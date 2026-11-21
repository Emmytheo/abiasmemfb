import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { postBalancedGlJournal } from "@/lib/banking/gl-engine"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const loanId = Number(body.loan_id)
        const sourceAccountId = Number(body.source_account_id)
        const amountNaira = Number(body.amount_naira)

        if (!loanId || !sourceAccountId || !Number.isFinite(amountNaira) || amountNaira <= 0) {
            return NextResponse.json(
                { error: "Valid loan_id, source_account_id, and positive amount_naira are required." },
                { status: 400 }
            )
        }

        const amountKobo = Math.round(amountNaira * 100)
        const ref = `CLN_REP_${loanId}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

        const res = await withBankSuiteTransaction(async (client) => {
            const loanRes = await client.query(
                `SELECT * FROM public.loans WHERE id = $1 FOR UPDATE`,
                [loanId]
            )
            const loan = loanRes.rows[0]
            if (!loan) throw new Error("Loan facility not found.")
            if (!auth.isAdmin && String(loan.user_id) !== auth.userId) {
                throw new Error("Forbidden: You do not own this loan facility.")
            }
            if (!["active", "defaulted"].includes(String(loan.status))) {
                throw new Error(`Loan is not repayable in status "${loan.status}".`)
            }

            const outstanding = Number(loan.outstanding_balance || 0)
            if (outstanding <= 0) throw new Error("Loan balance is already fully repaid.")
            const payKobo = Math.min(amountKobo, outstanding)

            const accRes = await client.query(
                `SELECT * FROM public.accounts WHERE id = $1 FOR UPDATE`,
                [sourceAccountId]
            )
            const acc = accRes.rows[0]
            if (!acc || acc.status !== "active") throw new Error("Source account is inactive or not found.")
            if (!auth.isAdmin && String(acc.user_id) !== auth.userId) {
                throw new Error("Forbidden: You do not own the selected funding account.")
            }
            if (acc.is_frozen || acc.pnd_enabled) {
                throw new Error("Source account is frozen or has a Post-No-Debit restriction.")
            }

            const avail = Number(acc.balance || 0) - Number(acc.lien_amount || 0)
            if (avail < payKobo) {
                throw new Error(`Insufficient balance. Available: ₦${(avail / 100).toLocaleString()}.`)
            }

            const newAccBal = Number(acc.balance) - payKobo
            const newOutstanding = Math.max(0, outstanding - payKobo)
            const nextStatus = newOutstanding === 0 ? "repaid" : "active"

            // Split repayment proportionally between principal (GL 1200) and interest income (GL 4000)
            const annualRate = Number(loan.interest_rate || 12)
            const interestRatio = Math.min(0.35, Math.max(0.05, annualRate / 100 / 2))
            const interestPortionKobo = Math.round(payKobo * interestRatio)
            const principalPortionKobo = payKobo - interestPortionKobo

            await client.query(
                `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newAccBal, acc.id]
            )

            const nextDue = new Date()
            nextDue.setMonth(nextDue.getMonth() + 1)

            await client.query(
                `UPDATE public.loans
                 SET outstanding_balance = $1,
                     status = $2,
                     next_payment_date = CASE WHEN $2 = 'repaid' THEN NULL ELSE $3 END,
                     updated_at = NOW()
                 WHERE id = $4`,
                [newOutstanding, nextStatus, nextDue.toISOString(), loan.id]
            )

            await client.query(
                `INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, loan_id,
                    status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                    created_at, updated_at
                 ) VALUES ($1, 'repayment', $2, 'NGN', $3, $4, 'successful', $5, 'portal', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())`,
                [
                    ref,
                    payKobo,
                    acc.id,
                    loan.id,
                    `Self-Service Loan Repayment (Loan #${loan.id})`,
                    newAccBal,
                    JSON.stringify({
                        principal_kobo: principalPortionKobo,
                        interest_kobo: interestPortionKobo,
                        remaining_balance_kobo: newOutstanding,
                    }),
                    acc.customer_id || loan.customer_id || null,
                    auth.userId,
                ]
            )

            return {
                loanId: loan.id,
                payKobo,
                principalPortionKobo,
                interestPortionKobo,
                newOutstanding,
                nextStatus,
                newAccBal,
                accountNumber: acc.account_number,
            }
        })

        // Post strictly balanced Double-Entry GL journal
        const gl = await postBalancedGlJournal({
            narration: `Customer Loan Repayment (Loan #${res.loanId} · ${ref})`,
            sourceModule: "client_loan_repayment",
            sourceRef: ref,
            actorId: auth.userId,
            actorEmail: auth.email,
            ipAddress: auth.ipAddress,
            lines: [
                { glCode: "2000", side: "debit", amountKobo: res.payKobo, narration: `CASA debit from ${res.accountNumber}` },
                ...(res.principalPortionKobo > 0
                    ? [{ glCode: "1200", side: "credit" as const, amountKobo: res.principalPortionKobo, narration: `Loan #${res.loanId} principal reduction` }]
                    : []),
                ...(res.interestPortionKobo > 0
                    ? [{ glCode: "4000", side: "credit" as const, amountKobo: res.interestPortionKobo, narration: `Loan #${res.loanId} interest income` }]
                    : []),
            ],
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "loan.client_repaid",
            entityType: "loan",
            entityId: res.loanId,
            amountKobo: res.payKobo,
            ipAddress: auth.ipAddress,
            afterState: { reference: ref, remaining_kobo: res.newOutstanding, gl_journal_ref: gl.journalRef },
        })

        return NextResponse.json({
            success: true,
            reference: ref,
            glJournalRef: gl.journalRef,
            paidNaira: res.payKobo / 100,
            remainingBalanceNaira: res.newOutstanding / 100,
            loanStatus: res.nextStatus,
            newAccountBalanceNaira: res.newAccBal / 100,
            message:
                res.nextStatus === "repaid"
                    ? `Loan #${res.loanId} is now 100% PAID OFF!`
                    : `Paid ₦${(res.payKobo / 100).toLocaleString()} toward Loan #${res.loanId} (Remaining: ₦${(res.newOutstanding / 100).toLocaleString()}).`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Loan repayment failed" }, { status: 400 })
    }
}
