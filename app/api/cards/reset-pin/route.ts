import crypto from "crypto"
import { NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { changeCardPin } from "@/lib/api/adapters/qore/actions"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { card_id, new_pin } = body
        const pinStr = String(new_pin || "").trim()

        if (!card_id || !/^\d{4}$/.test(pinStr)) {
            return NextResponse.json(
                { error: "card_id and a valid 4-digit numeric PIN are required" },
                { status: 400 }
            )
        }

        const payload = await getPayload({ config: configPromise })

        const card = await payload.findByID({
            collection: "smart-cards",
            id: card_id,
            overrideAccess: true,
        })

        if (!card) {
            return NextResponse.json({ error: "Smart card not found" }, { status: 404 })
        }

        if (card.user_id !== user.id) {
            return NextResponse.json(
                { error: "Unauthorized: Card is not owned by this account" },
                { status: 403 }
            )
        }

        // Sync PIN to Qore core banking switch if Qore-backed (enforce strict mode only when QORE_STRICT_SETTLEMENT=true)
        let qoreSynced = false
        if (card.card_token && process.env.QORE_SECRET_ID) {
            try {
                await changeCardPin(card.card_token, pinStr)
                qoreSynced = true
            } catch (err: any) {
                if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                    return NextResponse.json(
                        { error: `Core Banking Error: ${err.message}` },
                        { status: 400 }
                    )
                }
                console.warn("[Card PIN Reset] Qore staging fallback to local SHA-256 vault:", err.message)
            }
        }

        // SHA-256 digest matching /api/agency/transactions/cash-out verification
        const sha256PinHash = crypto.createHash("sha256").update(pinStr).digest("hex")

        await payload.update({
            collection: "smart-cards",
            id: card_id,
            data: {
                pin_hash: sha256PinHash,
            },
            overrideAccess: true,
        })

        await writeBankAuditLog({
            actorId: user.id,
            actorEmail: user.email || undefined,
            actorRole: "user",
            action: "card.pin_reset",
            entityType: "smart_card",
            entityId: card_id,
            afterState: { qore_synced: qoreSynced },
        })

        return NextResponse.json({
            success: true,
            qoreSynced,
            message: "Card PIN updated securely on core ledger.",
        })
    } catch (error: any) {
        console.error("Smart card PIN reset error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
