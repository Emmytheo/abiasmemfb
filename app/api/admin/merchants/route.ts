import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [merchantsRes, checkoutsRes, deliveriesRes] = await Promise.all([
            queryBankSuite(`
                SELECT mp.id, mp.business_name, mp.webhook_url, mp.is_verified, mp.user_id, mp.created_at,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, 'Business Owner') AS owner_name,
                       c.email AS owner_email,
                       a.account_number AS settlement_account_number,
                       a.account_type AS settlement_account_type,
                       (SELECT key_prefix FROM public.merchant_api_keys k WHERE k.merchant_id = mp.id AND k.is_active = TRUE AND k.key_type = 'live_public' ORDER BY k.created_at DESC LIMIT 1) AS api_prefix,
                       (SELECT COUNT(*)::int FROM public.merchant_api_keys k WHERE k.merchant_id = mp.id AND k.is_active = TRUE) AS active_keys_count,
                       (SELECT COALESCE(SUM(mc.amount), 0)::bigint FROM public.merchant_checkouts mc WHERE mc.merchant_id = mp.id AND mc.status = 'successful') AS volume_kobo,
                       (SELECT COUNT(*)::int FROM public.merchant_checkouts mc WHERE mc.merchant_id = mp.id) AS total_checkouts,
                       (SELECT COUNT(*)::int FROM public.merchant_checkouts mc WHERE mc.merchant_id = mp.id AND mc.status = 'successful') AS successful_checkouts
                FROM public.merchant_profiles mp
                LEFT JOIN public.customers c ON c.id = mp.customer_id
                LEFT JOIN public.accounts a ON a.id = mp.settlement_account_id
                ORDER BY mp.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT mc.id, mc.reference, mc.amount, mc.currency, mc.customer_email, mc.status, mc.created_at,
                       mp.business_name
                FROM public.merchant_checkouts mc
                LEFT JOIN public.merchant_profiles mp ON mp.id = mc.merchant_id
                ORDER BY mc.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT id, merchant_id, event, target_url, http_status, success, attempts, created_at
                FROM public.banksuite_webhook_deliveries
                ORDER BY created_at DESC
                LIMIT 50
            `),
        ])

        const merchants = merchantsRes.rows.map((m) => {
            const total = Number(m.total_checkouts || 0)
            const ok = Number(m.successful_checkouts || 0)
            return {
                ...m,
                volume_kobo: Number(m.volume_kobo || 0),
                success_rate: total > 0 ? Number(((ok / total) * 100).toFixed(1)) : 100,
            }
        })

        return NextResponse.json({
            success: true,
            merchants,
            checkouts: checkoutsRes.rows,
            webhookDeliveries: deliveriesRes.rows,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const { id, is_verified, revoke_keys = false } = body
        if (!id) return NextResponse.json({ error: "Merchant id is required" }, { status: 400 })

        const beforeRes = await queryBankSuite(`SELECT * FROM public.merchant_profiles WHERE id = $1`, [Number(id)])
        const before = beforeRes.rows[0]
        if (!before) return NextResponse.json({ error: "Merchant profile not found" }, { status: 404 })

        const nextVerified = is_verified !== undefined ? Boolean(is_verified) : Boolean(before.is_verified)
        const upd = await queryBankSuite(
            `UPDATE public.merchant_profiles SET is_verified = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [nextVerified, Number(id)]
        )

        if (!nextVerified || revoke_keys) {
            await queryBankSuite(
                `UPDATE public.merchant_api_keys SET is_active = FALSE, updated_at = NOW() WHERE merchant_id = $1`,
                [Number(id)]
            )
        }

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: nextVerified ? "merchant.verified" : "merchant.suspended",
            entityType: "merchant_profile",
            entityId: id,
            ipAddress: auth.ipAddress,
            beforeState: { is_verified: before.is_verified },
            afterState: { is_verified: nextVerified, keys_revoked: !nextVerified || revoke_keys },
        })

        return NextResponse.json({ success: true, merchant: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
