import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const [terminalsRes, commissionsRes, agentsRes] = await Promise.all([
            queryBankSuite(`
                SELECT t.id, t.serial_number, t.pos_model, t.status, t.user_id, t.created_at, t.updated_at,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, t.user_id, 'Unassigned Agent') AS agent_name,
                       c.email AS agent_email
                FROM public.agency_terminals t
                LEFT JOIN public.customers c ON c.id = t.agent_customer_id
                ORDER BY t.created_at DESC
                LIMIT 200
            `),
            queryBankSuite(`
                SELECT ac.id, ac.transaction_amount, ac.total_commission, ac.agent_share, ac.bank_share,
                       ac.status, ac.created_at,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, ac.user_id, 'Agent') AS agent_name,
                       t.serial_number AS terminal_serial
                FROM public.agency_commissions ac
                LEFT JOIN public.customers c ON c.id = ac.agent_customer_id
                LEFT JOIN public.agency_terminals t ON t.id = ac.terminal_id
                ORDER BY ac.created_at DESC
                LIMIT 200
            `),
            queryBankSuite(`
                SELECT id, first_name, last_name, email, supabase_id
                FROM public.customers
                WHERE COALESCE(is_archived, FALSE) = FALSE
                ORDER BY created_at DESC
                LIMIT 100
            `),
        ])

        return NextResponse.json({
            success: true,
            terminals: terminalsRes.rows,
            commissions: commissionsRes.rows,
            customers: agentsRes.rows,
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
        const { id, status, serial_number, pos_model } = body
        if (!id) return NextResponse.json({ error: "Terminal id is required" }, { status: 400 })

        const beforeRes = await queryBankSuite(`SELECT * FROM public.agency_terminals WHERE id = $1`, [Number(id)])
        const before = beforeRes.rows[0]
        if (!before) return NextResponse.json({ error: "Terminal not found" }, { status: 404 })

        const nextStatus = status || before.status
        const nextSerial = serial_number ? String(serial_number).trim() : before.serial_number
        const nextModel = pos_model ? String(pos_model).trim() : before.pos_model

        const upd = await queryBankSuite(
            `UPDATE public.agency_terminals SET status = $1, serial_number = $2, pos_model = $3, updated_at = NOW() WHERE id = $4 RETURNING *`,
            [nextStatus, nextSerial, nextModel, Number(id)]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: `agency.terminal.${nextStatus}`,
            entityType: "agency_terminal",
            entityId: id,
            ipAddress: auth.ipAddress,
            beforeState: { status: before.status, serial_number: before.serial_number },
            afterState: { status: nextStatus, serial_number: nextSerial },
        })

        return NextResponse.json({ success: true, terminal: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { agent_customer_id, serial_number, pos_model = "Pax S900", status = "active" } = body
        if (!serial_number) {
            return NextResponse.json({ error: "serial_number is required" }, { status: 400 })
        }

        let userId: string | null = null
        if (agent_customer_id) {
            const cust = await queryBankSuite(`SELECT supabase_id FROM public.customers WHERE id = $1`, [Number(agent_customer_id)])
            userId = cust.rows[0]?.supabase_id || null
        }

        const ins = await queryBankSuite(
            `INSERT INTO public.agency_terminals (agent_customer_id, user_id, serial_number, pos_model, status, created_at, updated_at)
             VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
            [agent_customer_id ? Number(agent_customer_id) : null, userId, String(serial_number).trim(), pos_model, status]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "agency.terminal.provisioned",
            entityType: "agency_terminal",
            entityId: ins.rows[0].id,
            ipAddress: auth.ipAddress,
            afterState: ins.rows[0],
        })

        return NextResponse.json({ success: true, terminal: ins.rows[0] }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
