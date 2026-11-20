import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { getInstitutionalTreasurySnapshot, postBalancedGlJournal } from "@/lib/banking/gl-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const snapshot = await getInstitutionalTreasurySnapshot()
        return NextResponse.json({ success: true, ...snapshot })
    } catch (err: any) {
        console.error("[GET /api/admin/treasury]", err)
        return NextResponse.json({ error: err.message || "Failed to load treasury snapshot" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const debitGl = String(body.debit_gl || "").trim()
        const creditGl = String(body.credit_gl || "").trim()
        const amountNaira = Number(body.amount_naira)
        const narration = String(body.narration || "").trim()

        if (!debitGl || !creditGl || debitGl === creditGl) {
            return NextResponse.json({ error: "Select two distinct GL accounts for debit and credit." }, { status: 400 })
        }
        if (!Number.isFinite(amountNaira) || amountNaira <= 0) {
            return NextResponse.json({ error: "Journal amount must be greater than zero." }, { status: 400 })
        }
        if (!narration) {
            return NextResponse.json({ error: "Journal narration is required for audit compliance." }, { status: 400 })
        }

        const amountKobo = Math.round(amountNaira * 100)
        const result = await postBalancedGlJournal({
            narration,
            sourceModule: "treasury_manual_journal",
            actorId: auth.userId,
            actorEmail: auth.email,
            ipAddress: auth.ipAddress,
            lines: [
                { glCode: debitGl, side: "debit", amountKobo, narration },
                { glCode: creditGl, side: "credit", amountKobo, narration },
            ],
        })

        return NextResponse.json({ success: true, ...result }, { status: 201 })
    } catch (err: any) {
        console.error("[POST /api/admin/treasury]", err)
        return NextResponse.json({ error: err.message || "GL journal posting failed" }, { status: 400 })
    }
}
