import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()

        const [
            accountsRes,
            merchantRes,
            invoicesRes,
            payrollRes,
            terminalsRes,
            outboundTxsRes,
            coopsRes,
            cyclesRes,
            payoutsRes,
        ] = await Promise.all([
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, lien_amount, is_frozen, pnd_enabled, status, source, is_primary
                 FROM public.accounts WHERE user_id = $1 ORDER BY is_primary DESC, id ASC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT mp.*, a.account_number AS settlement_account_number
                 FROM public.merchant_profiles mp
                 LEFT JOIN public.accounts a ON a.id = mp.settlement_account_id
                 WHERE mp.user_id = $1 LIMIT 1`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT * FROM public.banksuite_business_invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT COUNT(*)::int AS batch_count, COALESCE(SUM(total_amount_kobo), 0)::bigint AS total_disbursed_kobo
                 FROM public.banksuite_payroll_batches WHERE user_id = $1`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT id, serial_number, pos_model, status FROM public.agency_terminals WHERE user_id = $1`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT id, reference, type, amount, narration, status, created_at
                 FROM public.transactions WHERE user_id = $1 AND type IN ('transfer', 'debit') ORDER BY created_at DESC LIMIT 6`,
                [auth.userId]
            ),
            queryBankSuite(`SELECT id, name, description, status FROM public.cooperatives ORDER BY created_at DESC LIMIT 20`),
            queryBankSuite(`
                SELECT ec.id, ec.name, ec.contribution_amount, ec.frequency, ec.total_slots,
                       ec.current_payout_index, ec.platform_fee_percent, ec.status,
                       COALESCE(a.balance, 0)::bigint AS vault_balance_kobo
                FROM public.esusu_cycles ec
                LEFT JOIN public.accounts a ON a.id = ec.holding_vault_account_id
                WHERE ec.status = 'active'
                ORDER BY ec.created_at DESC LIMIT 10
            `),
            queryBankSuite(`
                SELECT p.id, p.amount, p.status, p.created_at, ec.name AS cycle_name,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, p.user_id) AS recipient
                FROM public.esusu_payouts p
                LEFT JOIN public.esusu_cycles ec ON ec.id = p.cycle_id
                LEFT JOIN public.customers c ON c.id = p.customer_id
                ORDER BY p.created_at DESC LIMIT 10
            `),
        ])

        const merchant = merchantRes.rows[0] || null
        let checkoutSummary = { totalSettledKobo: 0, totalCount: 0 }
        if (merchant) {
            const chkRes = await queryBankSuite(
                `SELECT COUNT(*)::int AS cnt, COALESCE(SUM(CASE WHEN status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS settled_kobo
                 FROM public.merchant_checkouts WHERE merchant_id = $1`,
                [merchant.id]
            )
            checkoutSummary = {
                totalSettledKobo: Number(chkRes.rows[0]?.settled_kobo || 0),
                totalCount: Number(chkRes.rows[0]?.cnt || 0),
            }
        }

        // Load members per cycle
        const cycleIds = cyclesRes.rows.map((c) => c.id)
        const membersByCycle: Record<string, string[]> = {}
        if (cycleIds.length > 0) {
            const mRes = await queryBankSuite(
                `SELECT m.cycle_id, COALESCE(c.first_name || ' ' || c.last_name, c.email, m.user_id) AS name
                 FROM public.esusu_members m
                 LEFT JOIN public.customers c ON c.id = m.customer_id
                 WHERE m.cycle_id = ANY($1::int[]) AND m.status = 'active'
                 ORDER BY m.payout_order_index ASC`,
                [cycleIds]
            )
            for (const row of mRes.rows) {
                const k = String(row.cycle_id)
                if (!membersByCycle[k]) membersByCycle[k] = []
                membersByCycle[k].push(row.name)
            }
        }

        return NextResponse.json({
            success: true,
            accounts: accountsRes.rows,
            business: {
                merchant,
                settledRevenueKobo: checkoutSummary.totalSettledKobo,
                checkoutCount: checkoutSummary.totalCount,
                invoices: invoicesRes.rows,
                payrollTotalDisbursedKobo: Number(payrollRes.rows[0]?.total_disbursed_kobo || 0),
                payrollBatchCount: Number(payrollRes.rows[0]?.batch_count || 0),
                terminals: terminalsRes.rows,
                recentOutbound: outboundTxsRes.rows,
            },
            cooperative: {
                cooperatives: coopsRes.rows,
                cycles: cyclesRes.rows,
                membersByCycle,
                payouts: payoutsRes.rows,
                totalVaultPoolKobo: cyclesRes.rows.reduce(
                    (s, c) => s + Number(c.vault_balance_kobo || 0),
                    0
                ),
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
