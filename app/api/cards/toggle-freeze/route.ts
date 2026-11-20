import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { freezeCard } from "@/lib/api/adapters/qore/actions"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export async function PATCH(req: NextRequest) {
    try {
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const { card_id, is_frozen } = body

        if (!card_id || is_frozen === undefined) {
            return NextResponse.json(
                { error: "card_id and is_frozen status are required" },
                { status: 400 }
            )
        }

        const payload = await getPayload({ config: configPromise })
        const card: any = await payload.findByID({
            collection: "smart-cards",
            id: card_id,
            overrideAccess: true,
        })

        if (!card) {
            return NextResponse.json({ error: "Smart card not found" }, { status: 404 })
        }

        // Allow both the cardholder AND bank administrators
        if (!auth.isAdmin && String(card.user_id) !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: Card is not owned by this account" },
                { status: 403 }
            )
        }

        let qoreSuccess = false
        if (process.env.QORE_SECRET_ID && is_frozen) {
            try {
                await freezeCard(card.card_token)
                qoreSuccess = true
            } catch (err: any) {
                if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                    return NextResponse.json(
                        { error: `Core Banking Error: ${err.message}` },
                        { status: 400 }
                    )
                }
                console.warn("[Card Freeze] Qore staging warning:", err.message)
            }
        }

        const updated = await payload.update({
            collection: "smart-cards",
            id: card_id,
            data: {
                is_frozen: Boolean(is_frozen),
                status: is_frozen ? "frozen" : "active",
            },
            overrideAccess: true,
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: is_frozen ? "card.frozen" : "card.unfrozen",
            entityType: "smart_card",
            entityId: card_id,
            ipAddress: auth.ipAddress,
            beforeState: { is_frozen: card.is_frozen, status: card.status },
            afterState: { is_frozen: Boolean(is_frozen), status: is_frozen ? "frozen" : "active" },
        })

        return NextResponse.json({ success: true, card: updated, qore_processed: qoreSuccess })
    } catch (error: any) {
        console.error("Smart card toggle-freeze error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
