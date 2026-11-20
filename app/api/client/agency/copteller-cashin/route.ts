import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import {
    executeAgentCoptellerCashIn,
    lookupCoptellerMember,
} from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    const q = req.nextUrl.searchParams.get("query") || ""
    if (!q.trim()) {
        return NextResponse.json({ error: "Enter a Copteller account number, phone number, or email." }, { status: 400 })
    }

    try {
        const member = await lookupCoptellerMember(q)
        if (!member) {
            return NextResponse.json({ error: "No active Copteller cooperative member wallet matched that query." }, { status: 404 })
        }
        return NextResponse.json({ success: true, member })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Member lookup failed" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const memberQuery = String(body.member_query || "").trim()
        const amountNaira = Number(body.amount_naira)
        const narration = body.narration ? String(body.narration).trim() : undefined

        if (!memberQuery || !Number.isFinite(amountNaira) || amountNaira < 100) {
            return NextResponse.json({ error: "Valid Copteller member identifier and amount (≥ ₦100) are required." }, { status: 400 })
        }

        const result = await executeAgentCoptellerCashIn({
            agentUserId: auth.userId,
            agentEmail: auth.email,
            ipAddress: auth.ipAddress,
            memberQuery,
            amountNaira,
            narration,
        })

        return NextResponse.json({ success: true, ...result }, { status: 201 })
    } catch (err: any) {
        console.error("[POST /api/client/agency/copteller-cashin]", err)
        return NextResponse.json({ error: err.message || "Cooperative cash-in failed" }, { status: 400 })
    }
}
