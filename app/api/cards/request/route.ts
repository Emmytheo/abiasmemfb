import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import { requestCard } from "@/lib/api/adapters/qore/actions"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const {
            account_id,
            card_network = "verve",
            card_type = "virtual",
            card_holder_name,
        } = body

        if (!account_id || !card_holder_name) {
            return NextResponse.json(
                { error: "account_id and card_holder_name are required" },
                { status: 400 }
            )
        }

        const payload = await getPayload({ config: configPromise })

        const account: any = await payload.findByID({
            collection: "accounts",
            id: account_id,
            overrideAccess: true,
        })

        if (!account || account.status !== "active") {
            return NextResponse.json({ error: "Linked active account not found" }, { status: 404 })
        }

        // Strict ownership check (prevents IDOR card issuance on another user's account)
        if (!auth.isAdmin && String(account.user_id) !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: You do not own this linked account." },
                { status: 403 }
            )
        }

        const customerResult = await payload.find({
            collection: "customers",
            where: { supabase_id: { equals: account.user_id } },
            limit: 1,
            overrideAccess: true,
        })

        let customerId =
            customerResult.docs[0]?.id ||
            (typeof account.customer === "object" ? account.customer?.id : account.customer)

        if (!customerId) {
            return NextResponse.json(
                { error: "Customer profile not found for linked account" },
                { status: 404 }
            )
        }

        let qoreSuccess = false
        let token = `CRD_${crypto.randomBytes(10).toString("hex").toUpperCase()}`
        const binPrefix =
            card_network === "visa" ? "4000" : card_network === "mastercard" ? "5120" : "5061"
        const last4 = String(crypto.randomInt(1000, 9999))
        let masked = `${binPrefix} **** **** ${last4}`
        const expDate = new Date()
        expDate.setFullYear(expDate.getFullYear() + 3)

        if (account.source === "qore" && process.env.QORE_SECRET_ID) {
            try {
                const qoreRes = await requestCard(auth.userId, account.account_number, card_type)
                if (qoreRes?.data?.token) token = qoreRes.data.token
                const rawPan = qoreRes?.data?.pan || ""
                if (rawPan && rawPan.length >= 4) {
                    masked = `${binPrefix} **** **** ${rawPan.slice(-4)}`
                }
                qoreSuccess = true
            } catch (err: any) {
                if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                    return NextResponse.json(
                        { error: `Core Banking Error: ${err.message}` },
                        { status: 400 }
                    )
                }
                console.warn("[Smart Card Request] Qore staging fallback to local vault issuance:", err.message)
            }
        }

        const card = await payload.create({
            collection: "smart-cards",
            data: {
                customer: customerId,
                user_id: account.user_id,
                account: account.id,
                card_token: token,
                card_holder_name: String(card_holder_name).trim().toUpperCase(),
                card_network,
                card_type,
                card_number_masked: masked,
                limit_pos: 10000000,
                limit_web: 5000000,
                limit_atm: 2000000,
                is_frozen: false,
                expiry_date: expDate.toISOString(),
                status: "active",
            },
            overrideAccess: true,
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "card.issued",
            entityType: "smart_card",
            entityId: card.id,
            ipAddress: auth.ipAddress,
            afterState: {
                card_network,
                card_type,
                masked,
                account_id: account.id,
                qore_processed: qoreSuccess,
            },
        })

        return NextResponse.json({ success: true, card, qore_processed: qoreSuccess })
    } catch (error: any) {
        console.error("Smart card request error:", error)
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        )
    }
}
