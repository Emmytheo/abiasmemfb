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
        const [accountsRes, batchesRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, status FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT * FROM public.banksuite_payroll_batches WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
                [auth.userId]
            ),
        ])
        return NextResponse.json({
            success: true,
            accounts: accountsRes.rows,
            batches: batchesRes.rows,
        })
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
        const sourceAccountId = Number(body.source_account_id)
        const batchName = String(body.batch_name || `Payroll ${new Date().toISOString().slice(0, 10)}`).trim()
        const items: Array<{ name: string; account: string; bank: string; amount: number }> = Array.isArray(body.items) ? body.items : []

        if (!sourceAccountId || items.length === 0) {
            return NextResponse.json(
                { error: "source_account_id and at least one payroll employee row are required." },
                { status: 400 }
            )
        }

        const sanitized = items.map((row, idx) => {
            const amountNaira = Number(row.amount)
            if (!row.name || !row.account || !Number.isFinite(amountNaira) || amountNaira <= 0) {
                throw new Error(`Invalid payroll row #${idx + 1}: name, 10-digit account, and positive amount are required.`)
            }
            return {
                name: String(row.name).trim(),
                account: String(row.account).replace(/\s/g, "").trim(),
                bank: String(row.bank || "Internal").trim(),
                amountKobo: Math.round(amountNaira * 100),
            }
        })

        const totalAmountKobo = sanitized.reduce((s, r) => s + r.amountKobo, 0)
        const batchRef = `PAY_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

        const result = await withBankSuiteTransaction(async (client) => {
            const accRes = await client.query(
                `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status
                 FROM public.accounts WHERE id = $1 FOR UPDATE`,
                [sourceAccountId]
            )
            const srcAcc = accRes.rows[0]
            if (!srcAcc || srcAcc.status !== "active") {
                throw new Error("Source corporate account not found or inactive.")
            }
            if (!auth.isAdmin && String(srcAcc.user_id) !== auth.userId) {
                throw new Error("Forbidden: You do not own the selected source corporate account.")
            }
            if (srcAcc.is_frozen || srcAcc.pnd_enabled) {
                throw new Error("Source account is frozen or under Post-No-Debit restriction.")
            }
            const available = Number(srcAcc.balance) - Number(srcAcc.lien_amount || 0)
            if (available < totalAmountKobo) {
                throw new Error(
                    `Insufficient corporate balance. Available: ₦${(available / 100).toLocaleString()}, Required: ₦${(totalAmountKobo / 100).toLocaleString()}.`
                )
            }

            const newSrcBal = Number(srcAcc.balance) - totalAmountKobo
            await client.query(
                `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newSrcBal, srcAcc.id]
            )

            const batchIns = await client.query(
                `INSERT INTO public.banksuite_payroll_batches (
                    batch_reference, user_id, source_account_id, batch_name,
                    total_employees, total_amount_kobo, total_fees_kobo,
                    succeeded_count, failed_count, status
                 ) VALUES ($1, $2, $3, $4, $5, $6, 0, $5, 0, 'completed') RETURNING *`,
                [batchRef, auth.userId, srcAcc.id, batchName, sanitized.length, totalAmountKobo]
            )
            const batch = batchIns.rows[0]

            // Record batch debit in immutable transactions ledger
            await client.query(
                `INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, status,
                    narration, channel, balance_after, date, metadata, customer_id, user_id,
                    created_at, updated_at
                 ) VALUES ($1, 'debit', $2, 'NGN', $3, 'successful', $4, 'portal', $5, NOW(), $6::jsonb, $7, $8, NOW(), NOW())`,
                [
                    batchRef,
                    totalAmountKobo,
                    srcAcc.id,
                    `Bulk Payroll Disbursement: ${batchName} (${sanitized.length} staff)`,
                    newSrcBal,
                    JSON.stringify({ batch_id: batch.id, employee_count: sanitized.length }),
                    srcAcc.customer_id || null,
                    srcAcc.user_id,
                ]
            )

            const processedItems: any[] = []
            for (let i = 0; i < sanitized.length; i++) {
                const row = sanitized[i]
                const itemRef = `${batchRef}_${i + 1}`

                // If employee holds an internal BankSuite account, credit atomically!
                const empAccRes = await client.query(
                    `SELECT id, user_id, customer_id, balance FROM public.accounts WHERE account_number = $1 AND status = 'active' LIMIT 1 FOR UPDATE`,
                    [row.account]
                )
                const empAcc = empAccRes.rows[0]
                if (empAcc && empAcc.id !== srcAcc.id) {
                    const nextEmpBal = Number(empAcc.balance) + row.amountKobo
                    await client.query(
                        `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [nextEmpBal, empAcc.id]
                    )
                    await client.query(
                        `INSERT INTO public.transactions (
                            reference, type, amount, currency, from_account_id, to_account_id,
                            status, narration, channel, balance_after, date, customer_id, user_id,
                            created_at, updated_at
                         ) VALUES ($1, 'credit', $2, 'NGN', $3, $4, 'successful', $5, 'portal', $6, NOW(), $7, $8, NOW(), NOW())`,
                        [
                            itemRef,
                            row.amountKobo,
                            srcAcc.id,
                            empAcc.id,
                            `Salary Credit (${batchName})`,
                            nextEmpBal,
                            empAcc.customer_id || null,
                            empAcc.user_id,
                        ]
                    )
                }

                const itemIns = await client.query(
                    `INSERT INTO public.banksuite_payroll_items (
                        batch_id, employee_name, account_number, bank_name, amount_kobo, status, transaction_reference
                     ) VALUES ($1, $2, $3, $4, $5, 'paid', $6) RETURNING *`,
                    [batch.id, row.name, row.account, row.bank, row.amountKobo, itemRef]
                )
                processedItems.push(itemIns.rows[0])
            }

            return { batch, items: processedItems, newBalanceKobo: newSrcBal }
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "payroll.batch.disbursed",
            entityType: "payroll_batch",
            entityId: result.batch.id,
            amountKobo: totalAmountKobo,
            ipAddress: auth.ipAddress,
            afterState: { batch_reference: batchRef, employees: sanitized.length },
        })

        return NextResponse.json({
            success: true,
            batch: result.batch,
            items: result.items,
            newBalanceNaira: result.newBalanceKobo / 100,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Payroll execution failed" }, { status: 400 })
    }
}
