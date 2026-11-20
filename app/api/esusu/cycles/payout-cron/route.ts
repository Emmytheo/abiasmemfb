import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireCronOrAdmin } from "@/lib/auth/server-guard"
import { queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import { intraBankTransfer } from "@/lib/api/adapters/qore/actions"

export async function POST(req: NextRequest) {
    try {
        // Accepts EITHER valid non-empty CRON_SECRET Bearer token OR verified Bank Admin session
        const auth = await requireCronOrAdmin(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const requestedCycleId = body?.cycle_id ? Number(body.cycle_id) : null

        const cyclesRes = await queryBankSuite(
            requestedCycleId
                ? `SELECT * FROM public.esusu_cycles WHERE id = $1 AND status = 'active'`
                : `SELECT * FROM public.esusu_cycles WHERE status = 'active' ORDER BY id ASC LIMIT 100`,
            requestedCycleId ? [requestedCycleId] : []
        )

        if (requestedCycleId && cyclesRes.rows.length === 0) {
            return NextResponse.json(
                { error: "Active Esusu cycle not found for the specified cycle_id." },
                { status: 404 }
            )
        }

        const logs: string[] = []
        let payoutsProcessed = 0

        for (const cycle of cyclesRes.rows) {
            const totalSlots = Number(cycle.total_slots || 0)
            const currentIndex = Number(cycle.current_payout_index || 0)

            if (totalSlots > 0 && currentIndex >= totalSlots) {
                await queryBankSuite(
                    `UPDATE public.esusu_cycles SET status = 'completed', updated_at = NOW() WHERE id = $1`,
                    [cycle.id]
                )
                logs.push(`Cycle "${cycle.name}" completed.`)
                continue
            }

            const membersRes = await queryBankSuite(
                `SELECT m.*, c.first_name, c.last_name, c.supabase_id
                 FROM public.esusu_members m
                 LEFT JOIN public.customers c ON c.id = m.customer_id
                 WHERE m.cycle_id = $1 AND m.status = 'active'
                 ORDER BY m.payout_order_index ASC`,
                [cycle.id]
            )
            const recipient = membersRes.rows.find(
                (m) => Number(m.payout_order_index) === currentIndex
            )
            if (!recipient) {
                logs.push(`No active member assigned to slot ${currentIndex + 1} in "${cycle.name}".`)
                continue
            }

            const vaultAccountId = cycle.holding_vault_account_id
                ? Number(cycle.holding_vault_account_id)
                : null
            if (!vaultAccountId) {
                logs.push(`Holding vault not linked for "${cycle.name}".`)
                continue
            }

            const payoutOutcome = await withBankSuiteTransaction(async (client) => {
                const vaultRes = await client.query(
                    `SELECT * FROM public.accounts WHERE id = $1 FOR UPDATE`,
                    [vaultAccountId]
                )
                const vault = vaultRes.rows[0]
                if (!vault || Number(vault.balance || 0) <= 0) {
                    return { skipped: true, reason: `Holding vault balance is ₦0 for "${cycle.name}".` }
                }

                const recipientUserId = recipient.user_id || recipient.supabase_id
                const recAccRes = await client.query(
                    `SELECT * FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                    [recipientUserId]
                )
                const recAcc = recAccRes.rows[0]
                if (!recAcc) {
                    return { skipped: true, reason: `No active recipient account for slot ${currentIndex + 1} in "${cycle.name}".` }
                }

                const poolKobo = Number(vault.balance)
                const feePct = Number(cycle.platform_fee_percent || 1)
                const platformFeeKobo = Math.round((poolKobo * feePct) / 100)
                const payoutKobo = poolKobo - platformFeeKobo
                const ref = `ESU_PAY_${cycle.id}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

                let qoreProcessed = false
                if (vault.source === "qore" && recAcc.source === "qore" && process.env.QORE_SECRET_ID) {
                    try {
                        await intraBankTransfer({
                            FromAccountNumber: vault.account_number,
                            ToAccountNumber: recAcc.account_number,
                            Amount: String(payoutKobo),
                            Narration: `Esusu Payout: ${cycle.name}`,
                            RetrievalReference: ref.replace(/[^A-Z0-9]/gi, "").slice(0, 12).padEnd(12, "0"),
                        })
                        qoreProcessed = true
                    } catch (err: any) {
                        if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                            throw new Error(`Core transfer failed: ${err.message}`)
                        }
                    }
                }

                await client.query(
                    `UPDATE public.accounts SET balance = 0, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $1`,
                    [vault.id]
                )
                const newRecBal = Number(recAcc.balance) + payoutKobo
                await client.query(
                    `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                    [newRecBal, recAcc.id]
                )

                const txRes = await client.query(
                    `INSERT INTO public.transactions (
                        reference, type, amount, currency, from_account_id, to_account_id,
                        status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                        created_at, updated_at
                     ) VALUES ($1, 'transfer', $2, 'NGN', $3, $4, 'successful', $5, 'workflow', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())
                     RETURNING id`,
                    [
                        ref,
                        payoutKobo,
                        vault.id,
                        recAcc.id,
                        `Esusu Payout Slot ${currentIndex + 1}: ${cycle.name}`,
                        newRecBal,
                        JSON.stringify({
                            cycle_id: cycle.id,
                            recipient_member_id: recipient.id,
                            platform_fee_kobo: platformFeeKobo,
                            qore_processed: qoreProcessed,
                        }),
                        recipient.customer_id,
                        recipientUserId,
                    ]
                )

                await client.query(
                    `INSERT INTO public.esusu_payouts (cycle_id, recipient_member_id, customer_id, user_id, amount, status, transaction_id, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, 'completed', $6, NOW(), NOW())`,
                    [cycle.id, recipient.id, recipient.customer_id, recipientUserId, payoutKobo, txRes.rows[0].id]
                )

                const nextIndex = currentIndex + 1
                const nextStatus = totalSlots > 0 && nextIndex >= totalSlots ? "completed" : "active"
                await client.query(
                    `UPDATE public.esusu_cycles SET current_payout_index = $1, status = $2, updated_at = NOW() WHERE id = $3`,
                    [nextIndex, nextStatus, cycle.id]
                )

                return {
                    skipped: false,
                    payoutKobo,
                    platformFeeKobo,
                    nextIndex,
                    recipientName: `${recipient.first_name || ""} ${recipient.last_name || ""}`.trim() || recipientUserId,
                }
            })

            if (payoutOutcome.skipped) {
                logs.push(payoutOutcome.reason!)
                if (requestedCycleId) {
                    return NextResponse.json({ success: false, error: payoutOutcome.reason }, { status: 400 })
                }
            } else {
                payoutsProcessed++
                logs.push(
                    `Paid ₦${((payoutOutcome.payoutKobo || 0) / 100).toLocaleString()} to ${payoutOutcome.recipientName} for slot ${currentIndex + 1} in "${cycle.name}".`
                )
            }
        }

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "esusu.payout_cron.executed",
            entityType: "esusu_cycle",
            entityId: requestedCycleId || "all",
            ipAddress: auth.ipAddress,
            afterState: { payoutsProcessed, logs },
        })

        return NextResponse.json({
            success: true,
            processed: payoutsProcessed,
            message: logs[0] || `Processed ${payoutsProcessed} payout(s).`,
            logs,
        })
    } catch (error: any) {
        console.error("Esusu payout cron error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
