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
        const [coopsRes, cyclesRes, membersRes, payoutsRes, vaultsRes] = await Promise.all([
            queryBankSuite(`
                SELECT c.id, c.name, c.description, c.status, c.sector, c.cooperative_type,
                       c.state, c.registration_number, c.created_at,
                       COALESCE(cust.first_name || ' ' || cust.last_name, cust.email, 'Unassigned') AS union_leader
                FROM public.cooperatives c
                LEFT JOIN public.customers cust ON cust.id = c.union_leader_id
                ORDER BY c.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT ec.id, ec.name, ec.contribution_amount, ec.frequency, ec.total_slots,
                       ec.current_payout_index, ec.platform_fee_percent, ec.status,
                       ec.cooperative_id, ec.holding_vault_account_id,
                       COALESCE(a.balance, 0)::bigint AS vault_balance_kobo,
                       a.account_number AS vault_account_number
                FROM public.esusu_cycles ec
                LEFT JOIN public.accounts a ON a.id = ec.holding_vault_account_id
                ORDER BY ec.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT m.id, m.cycle_id, m.payout_order_index, m.status, m.user_id,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, m.user_id) AS customer_name
                FROM public.esusu_members m
                LEFT JOIN public.customers c ON c.id = m.customer_id
                ORDER BY m.payout_order_index ASC
                LIMIT 500
            `),
            queryBankSuite(`
                SELECT p.id, p.amount, p.status, p.created_at,
                       ec.name AS cycle_name, ec.platform_fee_percent,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, p.user_id) AS recipient
                FROM public.esusu_payouts p
                LEFT JOIN public.esusu_cycles ec ON ec.id = p.cycle_id
                LEFT JOIN public.customers c ON c.id = p.customer_id
                ORDER BY p.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT p.*,
                       COALESCE(NULLIF(TRIM(COALESCE(c.first_name,'') || ' ' || COALESCE(c.last_name,'')), ''), c.email, p.user_id) AS holder_name,
                       c.email AS holder_email
                FROM public.banksuite_personal_savings_plans p
                LEFT JOIN public.customers c ON c.supabase_id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT 150
            `),
        ])

        const membersByCycle: Record<string, any[]> = {}
        for (const m of membersRes.rows) {
            const key = String(m.cycle_id)
            if (!membersByCycle[key]) membersByCycle[key] = []
            membersByCycle[key].push(m)
        }

        return NextResponse.json({
            success: true,
            cooperatives: coopsRes.rows,
            cycles: cyclesRes.rows,
            membersByCycle,
            payouts: payoutsRes.rows,
            personalSavingsPlans: vaultsRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { cooperative_id, status } = body
        if (!cooperative_id || !["active", "suspended", "pending", "closed"].includes(status)) {
            return NextResponse.json({ error: "Valid cooperative_id and status are required" }, { status: 400 })
        }

        const beforeRes = await queryBankSuite(`SELECT id, name, status FROM public.cooperatives WHERE id = $1`, [Number(cooperative_id)])
        const before = beforeRes.rows[0]
        if (!before) return NextResponse.json({ error: "Cooperative not found" }, { status: 404 })

        const upd = await queryBankSuite(
            `UPDATE public.cooperatives
             SET status = $1,
                 bank_approval_date = CASE WHEN $1 = 'active' THEN COALESCE(bank_approval_date, NOW()) ELSE bank_approval_date END,
                 updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [status, Number(cooperative_id)]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: `esusu.cooperative.${status}`,
            entityType: "cooperative",
            entityId: cooperative_id,
            ipAddress: auth.ipAddress,
            beforeState: before,
            afterState: { status },
        })

        return NextResponse.json({ success: true, cooperative: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
