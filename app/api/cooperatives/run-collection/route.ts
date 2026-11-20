import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireCronOrAdmin } from "@/lib/auth/server-guard"
import { queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export async function POST(req: NextRequest) {
    try {
        const auth = await requireCronOrAdmin(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const filterCycleId = body?.cycle_id ? Number(body.cycle_id) : null

        const cyclesRes = await queryBankSuite(
            filterCycleId
                ? `SELECT * FROM public.esusu_cycles WHERE status = 'active' AND id = $1`
                : `SELECT * FROM public.esusu_cycles WHERE status = 'active' ORDER BY id ASC LIMIT 25`,
            filterCycleId ? [filterCycleId] : []
        )

        const summary: any[] = []

        for (const cycle of cyclesRes.rows) {
            let vaultAccountId = cycle.holding_vault_account_id ? Number(cycle.holding_vault_account_id) : null
            if (!vaultAccountId) {
                const corpAcc = await queryBankSuite(
                    `SELECT id FROM public.accounts WHERE account_type = 'Corporate' AND status = 'active' ORDER BY id ASC LIMIT 1`
                )
                vaultAccountId = corpAcc.rows[0]?.id ? Number(corpAcc.rows[0].id) : null
            }
            if (!vaultAccountId) {
                summary.push({
                    cycleId: cycle.id,
                    cycleName: cycle.name,
                    skipped: true,
                    reason: "No active holding vault account configured.",
                })
                continue
            }

            const membersRes = await queryBankSuite(
                `SELECT m.*, c.first_name, c.last_name
                 FROM public.esusu_members m
                 LEFT JOIN public.customers c ON c.id = m.customer_id
                 WHERE m.cycle_id = $1 AND m.status = 'active'
                 ORDER BY m.payout_order_index ASC`,
                [cycle.id]
            )
            const members = membersRes.rows
            if (members.length === 0) continue

            const contributionKobo = Math.round(Number(cycle.contribution_amount || 0))
            if (contributionKobo <= 0) continue

            let poolCollected = 0
            let paidCount = 0
            let delinquentCount = 0

            // Atomic per-member debit -> vault credit
            for (const member of members) {
                const collected = await withBankSuiteTransaction(async (client) => {
                    const accRes = await client.query(
                        `SELECT id, balance, lien_amount, is_frozen, pnd_enabled, status
                         FROM public.accounts
                         WHERE user_id = $1 AND status = 'active'
                         ORDER BY is_primary DESC, id ASC
                         LIMIT 1
                         FOR UPDATE`,
                        [member.user_id]
                    )
                    const memberAcc = accRes.rows[0]
                    const available = memberAcc
                        ? Number(memberAcc.balance || 0) - Number(memberAcc.lien_amount || 0)
                        : 0

                    if (!memberAcc || memberAcc.is_frozen || memberAcc.pnd_enabled || available < contributionKobo) {
                        await client.query(
                            `INSERT INTO public.esusu_contributions (cycle_id, member_id, customer_id, user_id, amount, status, created_at, updated_at)
                             VALUES ($1, $2, $3, $4, $5, 'delinquent', NOW(), NOW())`,
                            [cycle.id, member.id, member.customer_id, member.user_id, contributionKobo]
                        )
                        return false
                    }

                    const newMemberBal = Number(memberAcc.balance) - contributionKobo
                    await client.query(
                        `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [newMemberBal, memberAcc.id]
                    )
                    await client.query(
                        `UPDATE public.accounts SET balance = balance + $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [contributionKobo, vaultAccountId]
                    )

                    const refDebit = `AJO_DR_${cycle.id}_${member.id}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`
                    const txRes = await client.query(
                        `INSERT INTO public.transactions (
                            reference, type, amount, currency, from_account_id, to_account_id,
                            status, narration, channel, balance_after, date, customer_id, user_id,
                            created_at, updated_at
                         ) VALUES ($1, 'debit', $2, 'NGN', $3, $4, 'successful', $5, 'workflow', $6, NOW(), $7, $8, NOW(), NOW())
                         RETURNING id`,
                        [
                            refDebit,
                            contributionKobo,
                            memberAcc.id,
                            vaultAccountId,
                            `Esusu Cycle Contribution: ${cycle.name}`,
                            newMemberBal,
                            member.customer_id,
                            member.user_id,
                        ]
                    )

                    await client.query(
                        `INSERT INTO public.esusu_contributions (cycle_id, member_id, customer_id, user_id, amount, status, transaction_id, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, 'paid', $6, NOW(), NOW())`,
                        [cycle.id, member.id, member.customer_id, member.user_id, contributionKobo, txRes.rows[0].id]
                    )
                    return true
                })

                if (collected) {
                    poolCollected += contributionKobo
                    paidCount++
                } else {
                    delinquentCount++
                }
            }

            // Atomic payout of collected pool to current slot recipient
            const currentPayoutIndex = Number(cycle.current_payout_index || 0)
            const recipientMember = members.find(
                (m) => Number(m.payout_order_index) === currentPayoutIndex
            )
            let payoutAmount = 0
            let payoutDistributed = false
            const recipientName = recipientMember
                ? `${recipientMember.first_name || ""} ${recipientMember.last_name || ""}`.trim() || recipientMember.user_id
                : "Unassigned Slot"

            if (recipientMember && poolCollected > 0) {
                const payoutRes = await withBankSuiteTransaction(async (client) => {
                    const vaultRes = await client.query(
                        `SELECT id, balance FROM public.accounts WHERE id = $1 FOR UPDATE`,
                        [vaultAccountId]
                    )
                    const recAccRes = await client.query(
                        `SELECT id, balance FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                        [recipientMember.user_id]
                    )
                    const vault = vaultRes.rows[0]
                    const recAcc = recAccRes.rows[0]
                    if (!vault || !recAcc || Number(vault.balance) < poolCollected) return null

                    const feePct = Number(cycle.platform_fee_percent ?? 1)
                    const feeKobo = Math.floor((poolCollected * feePct) / 100)
                    const netKobo = poolCollected - feeKobo

                    await client.query(
                        `UPDATE public.accounts SET balance = balance - $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [poolCollected, vault.id]
                    )
                    const newRecBal = Number(recAcc.balance) + netKobo
                    await client.query(
                        `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [newRecBal, recAcc.id]
                    )

                    const refPayout = `AJO_PY_${cycle.id}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`
                    const txRes = await client.query(
                        `INSERT INTO public.transactions (
                            reference, type, amount, currency, from_account_id, to_account_id,
                            status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                            created_at, updated_at
                         ) VALUES ($1, 'credit', $2, 'NGN', $3, $4, 'successful', $5, 'workflow', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())
                         RETURNING id`,
                        [
                            refPayout,
                            netKobo,
                            vault.id,
                            recAcc.id,
                            `Esusu Cycle Payout: Slot ${currentPayoutIndex + 1} (${cycle.name})`,
                            newRecBal,
                            JSON.stringify({ cycle_id: cycle.id, fee_kobo: feeKobo }),
                            recipientMember.customer_id,
                            recipientMember.user_id,
                        ]
                    )

                    await client.query(
                        `INSERT INTO public.esusu_payouts (cycle_id, recipient_member_id, customer_id, user_id, amount, status, transaction_id, created_at, updated_at)
                         VALUES ($1, $2, $3, $4, $5, 'completed', $6, NOW(), NOW())`,
                        [cycle.id, recipientMember.id, recipientMember.customer_id, recipientMember.user_id, netKobo, txRes.rows[0].id]
                    )

                    const totalSlots = Number(cycle.total_slots || members.length)
                    const nextIndex = (currentPayoutIndex + 1) % totalSlots
                    await client.query(
                        `UPDATE public.esusu_cycles SET current_payout_index = $1, updated_at = NOW() WHERE id = $2`,
                        [nextIndex, cycle.id]
                    )

                    return { netKobo, feeKobo }
                })

                if (payoutRes) {
                    payoutAmount = payoutRes.netKobo
                    payoutDistributed = true
                }
            }

            summary.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                paidMembers: paidCount,
                delinquentMembers: delinquentCount,
                collectedKobo: poolCollected,
                payoutTo: recipientName,
                payoutAmountKobo: payoutAmount,
                success: payoutDistributed,
            })
        }

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "esusu.collection.executed",
            entityType: "esusu_cycle",
            entityId: filterCycleId || "all",
            ipAddress: auth.ipAddress,
            afterState: { summary },
        })

        return NextResponse.json({ success: true, summary })
    } catch (error: any) {
        console.error("Run collection error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
