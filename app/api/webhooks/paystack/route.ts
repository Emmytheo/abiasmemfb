import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { executeTellerPosting } from "@/lib/banking/ledger-engine"

export async function POST(req: NextRequest) {
    try {
        const secretKey = process.env.PAYSTACK_SECRET_KEY
        if (!secretKey) {
            return NextResponse.json({ error: "Paystack webhook secret not configured" }, { status: 503 })
        }

        const rawBody = await req.text()
        const signature = req.headers.get("x-paystack-signature") || ""
        const expected = crypto.createHmac("sha512", secretKey).update(rawBody).digest("hex")

        const sigBuf = Buffer.from(signature, "utf8")
        const expBuf = Buffer.from(expected, "utf8")
        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
            return NextResponse.json({ error: "Invalid Paystack HMAC signature" }, { status: 401 })
        }

        const event = JSON.parse(rawBody)
        if (event.event !== "charge.success") {
            return NextResponse.json({ received: true, ignored: true })
        }

        const reference = String(event.data?.reference || "").trim()
        const amountKobo = Math.round(Number(event.data?.amount || 0))
        if (!reference || amountKobo <= 0) {
            return NextResponse.json({ received: true })
        }

        await ensureBankSuiteOperationalTables()
        const reqRes = await queryBankSuite(
            `SELECT * FROM public.banksuite_funding_requests WHERE reference = $1 LIMIT 1`,
            [reference]
        )
        const fundReq = reqRes.rows[0]
        if (!fundReq || fundReq.status === "completed") {
            return NextResponse.json({ received: true, alreadyProcessed: true })
        }

        await executeTellerPosting({
            actorId: "paystack-webhook",
            actorEmail: "paystack@gateway.internal",
            actorRole: "system",
            accountId: Number(fundReq.account_id),
            direction: "credit",
            amountKobo,
            narration: `Paystack Verified Card Funding (${reference})`,
            reference,
            channel: "api",
            metadata: { gateway: "paystack", paystack_id: event.data?.id },
        })

        await queryBankSuite(
            `UPDATE public.banksuite_funding_requests
             SET status = 'completed', gateway_reference = $1, verified_by_email = 'paystack-webhook', verified_at = NOW()
             WHERE id = $2`,
            [String(event.data?.id || reference), fundReq.id]
        )

        return NextResponse.json({ received: true, credited: true })
    } catch (err: any) {
        console.error("[Paystack Webhook] Error:", err.message)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
