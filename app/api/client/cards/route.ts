import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const [accountsRes, cardsRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, status, source
                 FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT sc.id, sc.card_holder_name, sc.card_network, sc.card_type,
                        sc.card_number_masked, sc.limit_pos, sc.limit_web, sc.limit_atm,
                        sc.is_frozen, sc.expiry_date, sc.status, sc.account_id,
                        a.account_number
                 FROM public.smart_cards sc
                 LEFT JOIN public.accounts a ON a.id = sc.account_id
                 WHERE sc.user_id = $1
                 ORDER BY sc.created_at DESC`,
                [auth.userId]
            ),
        ])

        return NextResponse.json({
            success: true,
            accounts: accountsRes.rows,
            cards: cardsRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
