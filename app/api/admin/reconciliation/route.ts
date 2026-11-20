import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const started = Date.now()

        const [
            accountsByType,
            negativeAccounts,
            txByType,
            loansByStatus,
            duplicateRefs,
            esusuVaults,
        ] = await Promise.all([
            queryBankSuite(`
                SELECT account_type, COUNT(*)::int AS count,
                       COALESCE(SUM(balance), 0)::bigint AS total_balance_kobo,
                       COALESCE(SUM(lien_amount), 0)::bigint AS total_lien_kobo
                FROM public.accounts
                GROUP BY account_type
                ORDER BY total_balance_kobo DESC
            `),
            queryBankSuite(`
                SELECT id, account_number, balance, status FROM public.accounts WHERE balance < 0
            `),
            queryBankSuite(`
                SELECT type, status, COUNT(*)::int AS count, COALESCE(SUM(amount), 0)::bigint AS sum_kobo
                FROM public.transactions
                GROUP BY type, status
                ORDER BY type, status
            `),
            queryBankSuite(`
                SELECT status, COUNT(*)::int AS count,
                       COALESCE(SUM(principal), 0)::bigint AS principal_kobo,
                       COALESCE(SUM(outstanding_balance), 0)::bigint AS outstanding_kobo
                FROM public.loans
                GROUP BY status
            `),
            queryBankSuite(`
                SELECT reference, COUNT(*)::int AS cnt
                FROM public.transactions
                GROUP BY reference
                HAVING COUNT(*) > 1
            `),
            queryBankSuite(`
                SELECT ec.id, ec.name, ec.status, ec.contribution_amount, ec.total_slots,
                       a.account_number AS vault_account, COALESCE(a.balance, 0)::bigint AS vault_balance_kobo
                FROM public.esusu_cycles ec
                LEFT JOIN public.accounts a ON a.id = ec.holding_vault_account_id
                ORDER BY ec.created_at DESC
            `),
        ])

        const totalCustomerDepositsKobo = accountsByType.rows.reduce(
            (s, r) => s + Number(r.total_balance_kobo || 0),
            0
        )
        const totalLoanExposureKobo = loansByStatus.rows
            .filter((r) => r.status === "active" || r.status === "defaulted")
            .reduce((s, r) => s + Number(r.outstanding_kobo || 0), 0)

        const checks = [
            {
                id: "non_negative_balances",
                name: "Zero Overdrawn / Negative Deposit Accounts",
                passed: negativeAccounts.rows.length === 0,
                detail:
                    negativeAccounts.rows.length === 0
                        ? "All deposit accounts have non-negative balances."
                        : `${negativeAccounts.rows.length} account(s) currently have a negative balance.`,
            },
            {
                id: "unique_tx_references",
                name: "Transaction Reference Uniqueness (Idempotency)",
                passed: duplicateRefs.rows.length === 0,
                detail:
                    duplicateRefs.rows.length === 0
                        ? "Zero duplicate transaction references detected across the ledger."
                        : `${duplicateRefs.rows.length} duplicate transaction reference(s) detected.`,
            },
            {
                id: "liquidity_coverage",
                name: "Deposit-to-Loan Coverage Ratio",
                passed: totalLoanExposureKobo === 0 || totalCustomerDepositsKobo >= totalLoanExposureKobo,
                detail: `Total Deposits: ₦${(totalCustomerDepositsKobo / 100).toLocaleString()} vs Active Loan Exposure: ₦${(totalLoanExposureKobo / 100).toLocaleString()}.`,
            },
        ]

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "reconciliation.run",
            entityType: "ledger",
            entityId: "trial_balance",
            ipAddress: auth.ipAddress,
            metadata: { allPassed: checks.every((c) => c.passed) },
        })

        return NextResponse.json({
            success: true,
            generatedAt: new Date().toISOString(),
            durationMs: Date.now() - started,
            allPassed: checks.every((c) => c.passed),
            summary: {
                totalCustomerDepositsKobo,
                totalLoanExposureKobo,
                netLiquidityPositionKobo: totalCustomerDepositsKobo - totalLoanExposureKobo,
            },
            checks,
            accountsByType: accountsByType.rows,
            txByType: txByType.rows,
            loansByStatus: loansByStatus.rows,
            esusuVaults: esusuVaults.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
