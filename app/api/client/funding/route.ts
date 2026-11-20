import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [accountsRes, requestsRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, status, source FROM public.accounts WHERE user_id = $1 ORDER BY is_primary DESC, id ASC`,
                [auth.userId]
            ),
            queryBankSuite(
                `SELECT * FROM public.banksuite_funding_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 25`,
                [auth.userId]
            ),
        ])
        return NextResponse.json({
            success: true,
            accounts: accountsRes.rows,
            requests: requestsRes.rows,
            paystackEnabled: Boolean(process.env.PAYSTACK_SECRET_KEY && !process.env.PAYSTACK_SECRET_KEY.includes("xxxx")),
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const accountId = Number(body.account_id)
        const amountNaira = Number(body.amount_naira)
        const method = ["bank_transfer", "card", "ussd"].includes(body.method) ? body.method : "bank_transfer"
        const narration = String(body.narration || "").trim() || `Inbound ${method} deposit notification`

        if (!accountId || !Number.isFinite(amountNaira) || amountNaira < 100) {
            return NextResponse.json({ error: "Valid account and minimum ₦100 amount are required." }, { status: 400 })
        }

        const accRes = await queryBankSuite(
            `SELECT id, user_id, account_number, status FROM public.accounts WHERE id = $1 LIMIT 1`,
            [accountId]
        )
        const acc = accRes.rows[0]
        if (!acc || acc.status !== "active") {
            return NextResponse.json({ error: "Selected account not found or inactive." }, { status: 404 })
        }
        if (!auth.isAdmin && String(acc.user_id) !== auth.userId) {
            return NextResponse.json({ error: "Forbidden: You do not own this account." }, { status: 403 })
        }

        const amountKobo = Math.round(amountNaira * 100)
        const reference = `FND_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

        // Real Paystack initialization if configured with live/test secret key
        let authorizationUrl: string | null = null
        let gateway = "teller_bank_transfer"
        const paystackKey = process.env.PAYSTACK_SECRET_KEY
        if (method === "card" && paystackKey && paystackKey.startsWith("sk_")) {
            const psRes = await fetch("https://api.paystack.co/transaction/initialize", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${paystackKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: auth.email,
                    amount: amountKobo,
                    reference,
                    metadata: { account_id: acc.id, user_id: auth.userId },
                }),
            })
            const psData = await psRes.json().catch(() => ({}))
            if (psRes.ok && psData?.data?.authorization_url) {
                authorizationUrl = psData.data.authorization_url
                gateway = "paystack"
            }
        }

        const ins = await queryBankSuite(
            `INSERT INTO public.banksuite_funding_requests (
                reference, user_id, account_id, account_number, amount_kobo,
                method, gateway, narration, status
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending') RETURNING *`,
            [reference, auth.userId, acc.id, acc.account_number, amountKobo, method, gateway, narration]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "funding.request.submitted",
            entityType: "funding_request",
            entityId: ins.rows[0].id,
            amountKobo,
            status: "queued",
            ipAddress: auth.ipAddress,
            afterState: { reference, method, gateway },
        })

        return NextResponse.json({
            success: true,
            request: ins.rows[0],
            authorizationUrl,
            message: authorizationUrl
                ? "Redirecting to verified Paystack payment checkout..."
                : `Deposit notice ${reference} logged! Transfer ₦${amountNaira.toLocaleString()} to ${acc.account_number} — Teller Operations will verify & post to your ledger.`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
