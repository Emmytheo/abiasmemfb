import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import {
    getCoptellerOversightSnapshot,
    processCoptellerLoanDecision,
    toggleCoptellerSchemeApproval,
    updateCoptellerCooperativeStatus,
} from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const snapshot = await getCoptellerOversightSnapshot()
        return NextResponse.json({ success: true, ...snapshot })
    } catch (err: any) {
        console.error("[GET /api/admin/copteller]", err)
        return NextResponse.json({ error: err.message || "Failed to load Copteller bridge snapshot" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { action } = body

        if (action === "update_cooperative_status") {
            const coopId = Number(body.cooperative_id)
            const status = body.status
            if (!coopId || !["active", "suspended", "pending", "closed"].includes(status)) {
                return NextResponse.json({ error: "Valid cooperative_id and status are required" }, { status: 400 })
            }
            const cooperative = await updateCoptellerCooperativeStatus({
                cooperativeId: coopId,
                status,
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({ success: true, cooperative })
        }

        if (action === "toggle_scheme_approval") {
            const schemeId = Number(body.scheme_id)
            if (!schemeId || body.bank_approved === undefined) {
                return NextResponse.json({ error: "scheme_id and bank_approved are required" }, { status: 400 })
            }
            const scheme = await toggleCoptellerSchemeApproval({
                schemeId,
                bankApproved: Boolean(body.bank_approved),
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({ success: true, scheme })
        }

        if (action === "disburse_loan" || action === "reject_loan") {
            const loanId = Number(body.loan_id)
            if (!loanId) return NextResponse.json({ error: "loan_id is required" }, { status: 400 })
            const result = await processCoptellerLoanDecision({
                loanId,
                decision: action === "disburse_loan" ? "disburse" : "reject",
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({ success: true, ...result })
        }

        return NextResponse.json({ error: "Unsupported Copteller bridge action" }, { status: 400 })
    } catch (err: any) {
        console.error("[PATCH /api/admin/copteller]", err)
        return NextResponse.json({ error: err.message || "Copteller bridge mutation failed" }, { status: 400 })
    }
}
