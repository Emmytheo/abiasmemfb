import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { checkCoptellerBridgeHealth } from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const dbStart = Date.now()
        await queryBankSuite("SELECT 1")
        const dbLatencyMs = Date.now() - dbStart

        const [
            accountsAgg,
            loansAgg,
            txPeriodAgg,
            customersAgg,
            pendingQueues,
            recentLoans,
            recentAuditLogs,
            coptellerHealth,
        ] = await Promise.all([
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_accounts,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active_accounts,
                    COUNT(*) FILTER (WHERE is_frozen = TRUE OR pnd_enabled = TRUE)::int AS restricted_accounts,
                    COALESCE(SUM(balance), 0)::bigint AS total_liquidity_kobo,
                    COALESCE(SUM(lien_amount), 0)::bigint AS total_lien_kobo
                FROM public.accounts
            `),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_loans,
                    COUNT(*) FILTER (WHERE status = 'active')::int AS active_loans,
                    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_loans,
                    COUNT(*) FILTER (WHERE status IN ('defaulted', 'written_off'))::int AS defaulted_loans,
                    COALESCE(SUM(principal), 0)::bigint AS total_principal_kobo,
                    COALESCE(SUM(outstanding_balance), 0)::bigint AS total_outstanding_kobo,
                    COALESCE(SUM(CASE WHEN status IN ('defaulted','written_off') THEN outstanding_balance ELSE 0 END), 0)::bigint AS defaulted_balance_kobo
                FROM public.loans
            `),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_txs,
                    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::bigint AS vol_30d_kobo,
                    COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::bigint AS vol_prev_30d_kobo,
                    COUNT(*) FILTER (WHERE status = 'failed' AND created_at >= NOW() - INTERVAL '24 hours')::int AS failed_24h,
                    COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_txs
                FROM public.transactions
            `),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_customers,
                    COUNT(*) FILTER (WHERE kyc_status = 'active')::int AS verified_customers,
                    COUNT(*) FILTER (WHERE kyc_status = 'pending')::int AS pending_kyc,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_30d
                FROM public.customers
                WHERE COALESCE(is_archived, FALSE) = FALSE
            `),
            queryBankSuite(`
                SELECT
                    (SELECT COUNT(*)::int FROM public.product_applications WHERE status IN ('pending','under_review')) AS pending_applications,
                    (SELECT COUNT(*)::int FROM public.agency_terminals WHERE status = 'pending') AS pending_terminals,
                    (SELECT COUNT(*)::int FROM public.merchant_profiles WHERE is_verified = FALSE) AS pending_merchants,
                    (SELECT COUNT(*)::int FROM public.cooperatives WHERE status = 'pending') AS pending_cooperatives,
                    (SELECT COUNT(*)::int FROM public.banksuite_approval_queue WHERE status = 'pending') AS pending_approvals,
                    (SELECT COUNT(*)::int FROM public.banksuite_funding_requests WHERE status = 'pending') AS pending_funding
            `),
            queryBankSuite(`
                SELECT l.id, l.principal, l.outstanding_balance, l.interest_rate, l.duration_months,
                       l.status, l.created_at,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, l.user_id) AS customer_name,
                       pt.name AS product_name
                FROM public.loans l
                LEFT JOIN public.customers c ON c.id = l.customer_id
                LEFT JOIN public.product_types pt ON pt.id = l.product_type_id
                ORDER BY l.created_at DESC
                LIMIT 8
            `),
            queryBankSuite(`
                SELECT id, actor_email, actor_role, action, entity_type, entity_id, amount_kobo, status, created_at
                FROM public.banksuite_audit_logs
                ORDER BY created_at DESC
                LIMIT 10
            `),
            checkCoptellerBridgeHealth(),
        ])

        const acc = accountsAgg.rows[0] || {}
        const loan = loansAgg.rows[0] || {}
        const tx = txPeriodAgg.rows[0] || {}
        const cust = customersAgg.rows[0] || {}
        const queues = pendingQueues.rows[0] || {}

        const totalPrincipalKobo = Number(loan.total_principal_kobo || 0)
        const defaultedBalanceKobo = Number(loan.defaulted_balance_kobo || 0)
        const npfRatio =
            totalPrincipalKobo > 0
                ? Number(((defaultedBalanceKobo / totalPrincipalKobo) * 100).toFixed(2))
                : 0

        const vol30 = Number(tx.vol_30d_kobo || 0)
        const volPrev = Number(tx.vol_prev_30d_kobo || 0)
        const volumeDeltaPct =
            volPrev > 0 ? Number((((vol30 - volPrev) / volPrev) * 100).toFixed(1)) : vol30 > 0 ? 100 : 0

        return NextResponse.json({
            success: true,
            kpis: {
                totalLiquidityKobo: Number(acc.total_liquidity_kobo || 0),
                totalLienKobo: Number(acc.total_lien_kobo || 0),
                totalAccounts: Number(acc.total_accounts || 0),
                activeAccounts: Number(acc.active_accounts || 0),
                restrictedAccounts: Number(acc.restricted_accounts || 0),
                totalLoanBookKobo: totalPrincipalKobo,
                totalOutstandingKobo: Number(loan.total_outstanding_kobo || 0),
                activeLoans: Number(loan.active_loans || 0),
                defaultedLoans: Number(loan.defaulted_loans || 0),
                npfRatio,
                totalCustomers: Number(cust.total_customers || 0),
                verifiedCustomers: Number(cust.verified_customers || 0),
                pendingKyc: Number(cust.pending_kyc || 0),
                newCustomers30d: Number(cust.new_30d || 0),
                volume30dKobo: vol30,
                volumeDeltaPct,
                failed24h: Number(tx.failed_24h || 0),
                pendingTxs: Number(tx.pending_txs || 0),
            },
            queues,
            health: {
                postgres: { status: "operational", latencyMs: dbLatencyMs },
                qore: {
                    status: process.env.QORE_SECRET_ID ? "configured" : "local_ledger_only",
                    env: process.env.QORE_ENV || "staging",
                    strictMode: process.env.QORE_STRICT_SETTLEMENT === "true",
                },
                copteller: coptellerHealth,
            },
            recentLoans: recentLoans.rows,
            recentAuditLogs: recentAuditLogs.rows,
        })
    } catch (err: any) {
        console.error("[GET /api/admin/operations/overview]", err)
        return NextResponse.json({ error: err.message || "Failed to load overview" }, { status: 500 })
    }
}
