import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"
import { getCoptellerBridgeUrl, getCoptellerMemberLinkForCustomer } from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const custRes = await queryBankSuite(
            `SELECT email, bvn FROM public.customers WHERE supabase_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
            [auth.userId, auth.email]
        )
        const customer = custRes.rows[0]
        const link = await getCoptellerMemberLinkForCustomer({
            email: customer?.email || auth.email,
            bvn: customer?.bvn || null,
        })

        return NextResponse.json({
            success: true,
            appUrl: getCoptellerBridgeUrl(),
            linked: Boolean(link?.linked),
            profile: link || null,
        })
    } catch (err: any) {
        return NextResponse.json({
            success: true,
            appUrl: getCoptellerBridgeUrl(),
            linked: false,
            profile: null,
        })
    }
}
