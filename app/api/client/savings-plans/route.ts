import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [plansRes, accountsRes] = await Promise.all([
            queryBankSuite(
                `SELECT * FROM public.banksuite_personal_savings_plans WHERE user_id = $1 ORDER BY created_at DESC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, status FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC`,
                [auth.userId]
            ),
        ])
        return NextResponse.json({ success: true, plans: plansRes.rows, accounts: accountsRes.rows })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const name = String(body.name || "").trim()
        const deductionNaira = Number(body.deduction_amount_naira)
        const targetNaira = Number(body.target_amount_naira)
        const frequency = ["daily", "weekly", "monthly"].includes(body.frequency) ? body.frequency : "daily"
        const sourceAccountId = body.source_account_id ? Number(body.source_account_id) : null

        if (!name || !Number.isFinite(deductionNaira) || deductionNaira <= 0 || !Number.isFinite(targetNaira) || targetNaira <= 0) {
            return NextResponse.json({ error: "Valid name, deduction amount, and target amount are required." }, { status: 400 })
        }

        let accNum: string | null = null
        if (sourceAccountId) {
            const acc = await queryBankSuite(
                `SELECT account_number FROM public.accounts WHERE id = $1 AND user_id = $2`,
                [sourceAccountId, auth.userId]
            )
            accNum = acc.rows[0]?.account_number || null
        }

        const ins = await queryBankSuite(
            `INSERT INTO public.banksuite_personal_savings_plans (
                user_id, name, deduction_amount_kobo, target_amount_kobo, saved_amount_kobo,
                frequency, source_account_id, source_account_number, status, next_run_at
             ) VALUES ($1, $2, $3, $4, 0, $5, $6, $7, 'active', NOW() + INTERVAL '1 day')
             RETURNING *`,
            [
                auth.userId,
                name,
                Math.round(deductionNaira * 100),
                Math.round(targetNaira * 100),
                frequency,
                sourceAccountId,
                accNum,
            ]
        )

        return NextResponse.json({ success: true, plan: ins.rows[0] }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const { id, action, amount_naira } = body
        if (!id) return NextResponse.json({ error: "Plan id is required" }, { status: 400 })

        if (action === "toggle_status") {
            const upd = await queryBankSuite(
                `UPDATE public.banksuite_personal_savings_plans
                 SET status = CASE WHEN status = 'active' THEN 'paused' ELSE 'active' END, updated_at = NOW()
                 WHERE id = $1 AND user_id = $2 RETURNING *`,
                [Number(id), auth.userId]
            )
            if (!upd.rows[0]) return NextResponse.json({ error: "Plan not found" }, { status: 404 })
            return NextResponse.json({ success: true, plan: upd.rows[0] })
        }

        if (action === "topup" || action === "liquidate") {
            const result = await withBankSuiteTransaction(async (client) => {
                const planRes = await client.query(
                    `SELECT * FROM public.banksuite_personal_savings_plans WHERE id = $1 AND user_id = $2 FOR UPDATE`,
                    [Number(id), auth.userId]
                )
                const plan = planRes.rows[0]
                if (!plan) throw new Error("Savings plan not found.")

                const accRes = await client.query(
                    plan.source_account_id
                        ? `SELECT * FROM public.accounts WHERE id = $1 AND user_id = $2 FOR UPDATE`
                        : `SELECT * FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                    plan.source_account_id ? [plan.source_account_id, auth.userId] : [auth.userId]
                )
                const acc = accRes.rows[0]
                if (!acc || acc.status !== "active") throw new Error("No active funding bank account available.")

                const ref = `SAV_${action.toUpperCase()}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

                if (action === "topup") {
                    const topupKobo = Math.round(Number(amount_naira || 0) * 100) || Number(plan.deduction_amount_kobo)
                    if (topupKobo <= 0) throw new Error("Top-up amount must be positive.")
                    const avail = Number(acc.balance) - Number(acc.lien_amount || 0)
                    if (avail < topupKobo) throw new Error("Insufficient funds in linked bank account.")

                    const newAccBal = Number(acc.balance) - topupKobo
                    const newSaved = Number(plan.saved_amount_kobo) + topupKobo
                    await client.query(`UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`, [newAccBal, acc.id])
                    const updPlan = await client.query(
                        `UPDATE public.banksuite_personal_savings_plans SET saved_amount_kobo = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                        [newSaved, plan.id]
                    )
                    await client.query(
                        `INSERT INTO public.transactions (reference, type, amount, currency, from_account_id, status, narration, channel, balance_after, date, customer_id, user_id, created_at, updated_at)
                         VALUES ($1, 'debit', $2, 'NGN', $3, 'successful', $4, 'portal', $5, NOW(), $6, $7, NOW(), NOW())`,
                        [ref, topupKobo, acc.id, `Personal Ajo Savings Top-Up: ${plan.name}`, newAccBal, acc.customer_id || null, auth.userId]
                    )
                    return { plan: updPlan.rows[0], amountKobo: topupKobo }
                } else {
                    const savedKobo = Number(plan.saved_amount_kobo || 0)
                    if (savedKobo <= 0) throw new Error("No saved funds available to liquidate.")

                    const newAccBal = Number(acc.balance) + savedKobo
                    await client.query(`UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`, [newAccBal, acc.id])
                    const updPlan = await client.query(
                        `UPDATE public.banksuite_personal_savings_plans SET saved_amount_kobo = 0, status = 'completed', updated_at = NOW() WHERE id = $1 RETURNING *`,
                        [plan.id]
                    )
                    await client.query(
                        `INSERT INTO public.transactions (reference, type, amount, currency, to_account_id, status, narration, channel, balance_after, date, customer_id, user_id, created_at, updated_at)
                         VALUES ($1, 'credit', $2, 'NGN', $3, 'successful', $4, 'portal', $5, NOW(), $6, $7, NOW(), NOW())`,
                        [ref, savedKobo, acc.id, `Personal Ajo Savings Liquidation: ${plan.name}`, newAccBal, acc.customer_id || null, auth.userId]
                    )
                    return { plan: updPlan.rows[0], amountKobo: savedKobo }
                }
            })

            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                action: `savings_plan.${action}`,
                entityType: "personal_savings_plan",
                entityId: id,
                amountKobo: result.amountKobo,
                ipAddress: auth.ipAddress,
            })

            return NextResponse.json({ success: true, plan: result.plan })
        }

        return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
