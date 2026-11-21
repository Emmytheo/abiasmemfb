import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { executeTransactionReversal } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [txsRes, aggRes] = await Promise.all([
            queryBankSuite(`
                SELECT t.id, t.reference, t.type::text AS type, t.amount, t.currency,
                       t.from_account_id, t.to_account_id, t.loan_id, t.status::text AS status,
                       t.narration, COALESCE(t.channel::text, 'portal') AS channel,
                       t.balance_after, t.metadata, t.created_at, t.user_id,
                       fa.account_number AS from_account_number,
                       ta.account_number AS to_account_number,
                       COALESCE(NULLIF(TRIM(COALESCE(c.first_name,'') || ' ' || COALESCE(c.last_name,'')), ''), c.email, t.user_id) AS customer_name,
                       (SELECT journal_ref FROM public.banksuite_gl_entries g WHERE g.source_ref = t.reference LIMIT 1) AS gl_journal_ref
                FROM public.transactions t
                LEFT JOIN public.accounts fa ON fa.id = t.from_account_id
                LEFT JOIN public.accounts ta ON ta.id = t.to_account_id
                LEFT JOIN public.customers c ON c.id = t.customer_id
                ORDER BY t.created_at DESC
                LIMIT 200
            `),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_count,
                    COALESCE(SUM(amount) FILTER (WHERE status::text = 'successful'), 0)::bigint AS total_volume_kobo,
                    COALESCE(SUM(amount) FILTER (WHERE type::text IN ('credit','repayment','interest') AND status::text = 'successful'), 0)::bigint AS total_credits_kobo,
                    COALESCE(SUM(amount) FILTER (WHERE type::text IN ('debit','transfer','disbursement') AND status::text = 'successful'), 0)::bigint AS total_debits_kobo,
                    COUNT(*) FILTER (WHERE status::text = 'reversed')::int AS reversed_count,
                    COUNT(*) FILTER (WHERE status::text IN ('pending','failed'))::int AS exception_count
                FROM public.transactions
            `),
        ])

        return NextResponse.json({
            success: true,
            transactions: txsRes.rows,
            summary: aggRes.rows[0] || {},
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to load transaction ledger" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { action, transaction_id, reason } = body

        if (action === "reverse") {
            if (!transaction_id) {
                return NextResponse.json({ error: "transaction_id is required." }, { status: 400 })
            }
            const res = await executeTransactionReversal({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                ipAddress: auth.ipAddress,
                transactionId: Number(transaction_id),
                reason: String(reason || "Branch supervisor reversal"),
            })
            return NextResponse.json({
                success: true,
                reversal: res,
                message: `Reversed transaction (${res.reversalReference}) with atomic balance & GL rollback.`,
            })
        }

        return NextResponse.json({ error: "Unsupported transaction action." }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Reversal failed" }, { status: 400 })
    }
}
