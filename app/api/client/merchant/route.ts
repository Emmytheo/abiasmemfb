import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const profRes = await queryBankSuite(
            `SELECT mp.*, a.account_number AS settlement_account_number, a.account_type AS settlement_account_type
             FROM public.merchant_profiles mp
             LEFT JOIN public.accounts a ON a.id = mp.settlement_account_id
             WHERE mp.user_id = $1 LIMIT 1`,
            [auth.userId]
        )
        const profile = profRes.rows[0] || null
        if (!profile) {
            return NextResponse.json({
                success: true,
                profile: null,
                apiKeys: [],
                checkouts: [],
                webhookDeliveries: [],
            })
        }

        const [keysRes, checkoutsRes, deliveriesRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, key_prefix, key_type, is_active, created_at
                 FROM public.merchant_api_keys WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 20`,
                [profile.id]
            ),
            queryBankSuite(
                `SELECT id, amount, currency, customer_email, reference, status, created_at
                 FROM public.merchant_checkouts WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 50`,
                [profile.id]
            ),
            queryBankSuite(
                `SELECT id, event, target_url, payload, http_status, success, attempts, created_at
                 FROM public.banksuite_webhook_deliveries WHERE merchant_id = $1 ORDER BY created_at DESC LIMIT 30`,
                [profile.id]
            ),
        ])

        return NextResponse.json({
            success: true,
            profile,
            apiKeys: keysRes.rows,
            checkouts: checkoutsRes.rows,
            webhookDeliveries: deliveriesRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const webhookUrl = String(body.webhook_url || "").trim()
        if (webhookUrl && !webhookUrl.startsWith("https://") && !webhookUrl.startsWith("http://localhost")) {
            return NextResponse.json(
                { error: "Webhook URL must start with https:// (or http://localhost in development)." },
                { status: 400 }
            )
        }

        const upd = await queryBankSuite(
            `UPDATE public.merchant_profiles SET webhook_url = $1, updated_at = NOW() WHERE user_id = $2 RETURNING *`,
            [webhookUrl, auth.userId]
        )
        if (upd.rows.length === 0) {
            return NextResponse.json({ error: "Initialize your Merchant Profile first by generating API keys." }, { status: 404 })
        }

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "merchant.webhook.updated",
            entityType: "merchant_profile",
            entityId: upd.rows[0].id,
            ipAddress: auth.ipAddress,
            afterState: { webhook_url: webhookUrl },
        })

        return NextResponse.json({ success: true, profile: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
