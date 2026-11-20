import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const res = await queryBankSuite(`
            SELECT sc.id, sc.card_holder_name, sc.card_network, sc.card_type,
                   sc.card_number_masked, sc.card_token, sc.limit_pos, sc.limit_web,
                   sc.limit_atm, sc.is_frozen, sc.expiry_date, sc.status, sc.created_at,
                   c.email AS customer_email,
                   a.account_number
            FROM public.smart_cards sc
            LEFT JOIN public.customers c ON c.id = sc.customer_id
            LEFT JOIN public.accounts a ON a.id = sc.account_id
            ORDER BY sc.created_at DESC
            LIMIT 200
        `)
        return NextResponse.json({ success: true, cards: res.rows })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { card_id, is_frozen, limit_pos, limit_web, limit_atm } = body
        if (!card_id) return NextResponse.json({ error: "card_id is required" }, { status: 400 })

        const beforeRes = await queryBankSuite(`SELECT * FROM public.smart_cards WHERE id = $1`, [Number(card_id)])
        const before = beforeRes.rows[0]
        if (!before) return NextResponse.json({ error: "Smart card not found" }, { status: 404 })

        const nextFrozen = is_frozen !== undefined ? Boolean(is_frozen) : Boolean(before.is_frozen)
        const nextStatus = nextFrozen ? "frozen" : "active"
        const nextPos = limit_pos !== undefined ? Math.max(0, Math.round(Number(limit_pos))) : Number(before.limit_pos)
        const nextWeb = limit_web !== undefined ? Math.max(0, Math.round(Number(limit_web))) : Number(before.limit_web)
        const nextAtm = limit_atm !== undefined ? Math.max(0, Math.round(Number(limit_atm))) : Number(before.limit_atm)

        const upd = await queryBankSuite(
            `UPDATE public.smart_cards
             SET is_frozen = $1, status = $2, limit_pos = $3, limit_web = $4, limit_atm = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [nextFrozen, nextStatus, nextPos, nextWeb, nextAtm, Number(card_id)]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: is_frozen !== undefined ? (nextFrozen ? "admin.card.frozen" : "admin.card.unfrozen") : "admin.card.limits_updated",
            entityType: "smart_card",
            entityId: card_id,
            ipAddress: auth.ipAddress,
            beforeState: { is_frozen: before.is_frozen, limit_pos: before.limit_pos, limit_web: before.limit_web, limit_atm: before.limit_atm },
            afterState: { is_frozen: nextFrozen, limit_pos: nextPos, limit_web: nextWeb, limit_atm: nextAtm },
        })

        return NextResponse.json({ success: true, card: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
