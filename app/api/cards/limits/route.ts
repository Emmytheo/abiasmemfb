import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { updateCardLimits } from "@/lib/api/adapters/qore/actions"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const { card_id, limit_pos, limit_web, limit_atm } = body

        if (
            !card_id ||
            limit_pos === undefined ||
            limit_web === undefined ||
            limit_atm === undefined
        ) {
            return NextResponse.json(
                { error: "card_id, limit_pos, limit_web, and limit_atm (in kobo) are required" },
                { status: 400 }
            )
        }

        const posVal = Math.max(0, Math.round(Number(limit_pos)))
        const webVal = Math.max(0, Math.round(Number(limit_web)))
        const atmVal = Math.max(0, Math.round(Number(limit_atm)))

        const payload = await getPayload({ config: configPromise })
        const card: any = await payload.findByID({
            collection: "smart-cards",
            id: card_id,
            overrideAccess: true,
        })

        if (!card) {
            return NextResponse.json({ error: "Smart card not found" }, { status: 404 })
        }

        if (!auth.isAdmin && String(card.user_id) !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: Card is not owned by this account" },
                { status: 403 }
            )
        }

        let qoreSuccess = false
        if (process.env.QORE_SECRET_ID) {
            try {
                await Promise.all([
                    updateCardLimits(card.card_token, "POS", posVal),
                    updateCardLimits(card.card_token, "WEB", webVal),
                    updateCardLimits(card.card_token, "ATM", atmVal),
                ])
                qoreSuccess = true
            } catch (err: any) {
                if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                    return NextResponse.json(
                        { error: `Core Banking Error: ${err.message}` },
                        { status: 400 }
                    )
                }
                console.warn("[Card Limits] Qore staging warning:", err.message)
            }
        }

        const updated = await payload.update({
            collection: "smart-cards",
            id: card_id,
            data: {
                limit_pos: posVal,
                limit_web: webVal,
                limit_atm: atmVal,
            },
            overrideAccess: true,
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "card.limits.updated",
            entityType: "smart_card",
            entityId: card_id,
            ipAddress: auth.ipAddress,
            beforeState: {
                limit_pos: card.limit_pos,
                limit_web: card.limit_web,
                limit_atm: card.limit_atm,
            },
            afterState: {
                limit_pos: posVal,
                limit_web: webVal,
                limit_atm: atmVal,
            },
        })

        return NextResponse.json({ success: true, card: updated, qore_processed: qoreSuccess })
    } catch (error: any) {
        console.error("Smart card limits error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
