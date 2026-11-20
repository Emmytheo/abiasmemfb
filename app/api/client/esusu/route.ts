import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const [coopsRes, cyclesRes, membershipsRes, contribsRes, rosterRes] = await Promise.all([
            queryBankSuite(`SELECT id, name, description, status, created_at FROM public.cooperatives ORDER BY created_at DESC LIMIT 50`),
            queryBankSuite(`
                SELECT ec.id, ec.name, ec.contribution_amount, ec.frequency, ec.total_slots,
                       ec.current_payout_index, ec.platform_fee_percent, ec.status, ec.cooperative_id,
                       COALESCE(a.balance, 0)::bigint AS vault_balance_kobo
                FROM public.esusu_cycles ec
                LEFT JOIN public.accounts a ON a.id = ec.holding_vault_account_id
                ORDER BY ec.created_at DESC LIMIT 50
            `),
            queryBankSuite(
                `SELECT id, cycle_id, payout_order_index, status, customer_id, user_id
                 FROM public.esusu_members WHERE user_id = $1`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT id, cycle_id, amount, status, created_at
                 FROM public.esusu_contributions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 100`,
                [auth.userId]
            ),
            queryBankSuite(`
                SELECT m.id, m.cycle_id, m.payout_order_index, m.status, m.user_id,
                       COALESCE(NULLIF(TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')), ''), c.email, m.user_id) AS member_name,
                       COALESCE(c.email, '') AS email,
                       COALESCE(c.kyc_status::text, 'pending') AS kyc_status
                FROM public.esusu_members m
                LEFT JOIN public.customers c ON c.id = m.customer_id
                ORDER BY m.cycle_id DESC, m.payout_order_index ASC
                LIMIT 200
            `),
        ])

        return NextResponse.json({
            success: true,
            cooperatives: coopsRes.rows,
            cycles: cyclesRes.rows,
            memberships: membershipsRes.rows,
            contributions: contribsRes.rows,
            roster: rosterRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
