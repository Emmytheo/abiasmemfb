import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const [terminalsRes, commissionsRes, cardsRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, serial_number, pos_model, status, created_at
                 FROM public.agency_terminals WHERE user_id = $1 ORDER BY created_at DESC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT ac.id, ac.terminal_id, ac.transaction_amount, ac.total_commission,
                        ac.agent_share, ac.bank_share, ac.status, ac.created_at,
                        t.serial_number
                 FROM public.agency_commissions ac
                 LEFT JOIN public.agency_terminals t ON t.id = ac.terminal_id
                 WHERE ac.user_id = $1
                 ORDER BY ac.created_at DESC LIMIT 100`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT id, card_holder_name, card_network, card_number_masked, status, is_frozen
                 FROM public.smart_cards WHERE status = 'active' AND is_frozen = FALSE ORDER BY created_at DESC LIMIT 20`
            ),
        ])

        const total_commission = commissionsRes.rows.reduce((s, r) => s + Number(r.total_commission || 0), 0)
        const agent_share = commissionsRes.rows.reduce((s, r) => s + Number(r.agent_share || 0), 0)
        const bank_share = commissionsRes.rows.reduce((s, r) => s + Number(r.bank_share || 0), 0)

        return NextResponse.json({
            success: true,
            terminals: terminalsRes.rows,
            commissions: {
                total_commission,
                agent_share,
                bank_share,
                items: commissionsRes.rows,
            },
            cards: cardsRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
