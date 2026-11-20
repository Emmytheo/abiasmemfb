import { NextResponse } from "next/server"
import { getPayload } from "payload"
import configPromise from "@payload-config"
import crypto from "crypto"
import { createClient as createServerSupabase } from "@/lib/supabase/server"

export async function POST(req: Request) {
    try {
        let merchantId: string | number | null = null
        const payload = await getPayload({ config: configPromise })

        const authHeader = req.headers.get("Authorization")
        if (authHeader && authHeader.startsWith("Bearer ")) {
            const rawSecretKey = authHeader.split(" ")[1]
            const secHash = crypto.createHash("sha256").update(rawSecretKey).digest("hex")

            const keyResult = await payload.find({
                collection: "merchant-api-keys",
                where: {
                    and: [
                        { key_hash: { equals: secHash } },
                        { is_active: { equals: true } },
                    ],
                },
                limit: 1,
                overrideAccess: true,
            })

            const apiKeyDoc = keyResult.docs[0]
            if (!apiKeyDoc) {
                return NextResponse.json({ error: "Invalid or inactive Secret API Key" }, { status: 401 })
            }
            merchantId = typeof apiKeyDoc.merchant === "object" ? apiKeyDoc.merchant.id : apiKeyDoc.merchant
        } else {
            const supabase = await createServerSupabase()
            const { data: { user }, error: authError } = await supabase.auth.getUser()
            if (!authError && user) {
                const merchantResult = await payload.find({
                    collection: "merchant-profiles",
                    where: { user_id: { equals: user.id } },
                    limit: 1,
                    overrideAccess: true,
                })
                const merchantDoc = merchantResult.docs[0]
                if (merchantDoc) {
                    merchantId = merchantDoc.id
                }
            }
        }

        if (!merchantId) {
            return NextResponse.json(
                { error: "Missing Authorization header or initialized Merchant Profile." },
                { status: 401 }
            )
        }

        const merchant = await payload.findByID({
            collection: "merchant-profiles",
            id: merchantId,
            overrideAccess: true,
        })

        if (!merchant || !merchant.is_verified) {
            return NextResponse.json(
                { error: "Merchant account is pending verification or suspended." },
                { status: 403 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const { amount, customer_email, reference, redirect_url, metadata = {} } = body

        if (!amount || Number(amount) <= 0 || !customer_email || !reference) {
            return NextResponse.json(
                { error: "amount (kobo), customer_email, and unique reference are required" },
                { status: 400 }
            )
        }

        const existingCheckout = await payload.find({
            collection: "merchant-checkouts",
            where: { reference: { equals: reference } },
            limit: 1,
            overrideAccess: true,
        })

        if (existingCheckout.docs.length > 0) {
            return NextResponse.json({ error: "Duplicate transaction reference" }, { status: 400 })
        }

        const checkout = await payload.create({
            collection: "merchant-checkouts",
            data: {
                merchant: merchant.id,
                amount: Math.round(Number(amount)),
                currency: "NGN",
                customer_email,
                reference,
                redirect_url,
                status: "pending",
                metadata,
            },
            overrideAccess: true,
        })

        const baseUrl = process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : "http://localhost:3000"

        return NextResponse.json({
            success: true,
            checkout: {
                id: checkout.id,
                reference: checkout.reference,
                amount: checkout.amount,
                status: checkout.status,
            },
            data: {
                id: checkout.id,
                reference,
                amount: Number(amount),
                checkoutUrl: `${baseUrl}/pay/${checkout.id}`,
                status: "pending",
            },
        })
    } catch (error: any) {
        console.error("Merchant checkout initialize error:", error)
        return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
    }
}
