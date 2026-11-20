import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { hashTransactionPin, verifyTransactionPin, writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

const DEFAULTS = {
    two_factor_enabled: true,
    biometric_enabled: false,
    daily_transfer_limit_kobo: 50000000,
    dual_auth_threshold_kobo: 100000000,
    require_dual_auth: true,
    api_ip_whitelist: "",
    strict_coop_kyc: true,
    public_coop_invites: false,
    compact_mode: false,
    exact_decimals: true,
    timezone: "Africa/Lagos",
    email_receipts: true,
    sms_alerts: true,
    webhook_failure_alerts: true,
    rotation_turn_alerts: true,
}

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const res = await queryBankSuite(
            `SELECT * FROM public.banksuite_user_preferences WHERE user_id = $1 LIMIT 1`,
            [auth.userId]
        )
        const row = res.rows[0]
        return NextResponse.json({
            success: true,
            preferences: row
                ? {
                      ...DEFAULTS,
                      ...row,
                      has_transaction_pin: Boolean(row.transaction_pin_hash),
                      transaction_pin_hash: undefined,
                      transaction_pin_salt: undefined,
                  }
                : { ...DEFAULTS, has_transaction_pin: false },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))

        const existingRes = await queryBankSuite(
            `SELECT * FROM public.banksuite_user_preferences WHERE user_id = $1 LIMIT 1`,
            [auth.userId]
        )
        const current = existingRes.rows[0] || DEFAULTS

        // Handle Transaction PIN setup / rotation safely
        let pinHash = current.transaction_pin_hash || null
        let pinSalt = current.transaction_pin_salt || null
        let pinUpdated = false

        if (body.new_transaction_pin) {
            const newPin = String(body.new_transaction_pin).trim()
            if (!/^\d{4}$/.test(newPin)) {
                return NextResponse.json({ error: "Transaction PIN must be exactly 4 digits." }, { status: 400 })
            }
            if (current.transaction_pin_hash && current.transaction_pin_salt) {
                const currentPin = String(body.current_transaction_pin || "").trim()
                if (!verifyTransactionPin(currentPin, current.transaction_pin_hash, current.transaction_pin_salt)) {
                    return NextResponse.json({ error: "Current transaction PIN is incorrect." }, { status: 400 })
                }
            }
            const hashed = hashTransactionPin(newPin)
            pinHash = hashed.hash
            pinSalt = hashed.salt
            pinUpdated = true
        }

        const dailyLimitKobo =
            body.daily_transfer_limit_naira !== undefined
                ? Math.max(100000, Math.min(5000000000, Math.round(Number(body.daily_transfer_limit_naira) * 100)))
                : Number(current.daily_transfer_limit_kobo || DEFAULTS.daily_transfer_limit_kobo)

        const upd = await queryBankSuite(
            `INSERT INTO public.banksuite_user_preferences (
                user_id, two_factor_enabled, biometric_enabled, daily_transfer_limit_kobo,
                require_dual_auth, api_ip_whitelist, strict_coop_kyc, public_coop_invites,
                compact_mode, exact_decimals, timezone, email_receipts, sms_alerts,
                webhook_failure_alerts, rotation_turn_alerts,
                transaction_pin_hash, transaction_pin_salt, pin_updated_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
                CASE WHEN $18 THEN NOW() ELSE $19 END, NOW()
             )
             ON CONFLICT (user_id) DO UPDATE SET
                two_factor_enabled = EXCLUDED.two_factor_enabled,
                biometric_enabled = EXCLUDED.biometric_enabled,
                daily_transfer_limit_kobo = EXCLUDED.daily_transfer_limit_kobo,
                require_dual_auth = EXCLUDED.require_dual_auth,
                api_ip_whitelist = EXCLUDED.api_ip_whitelist,
                strict_coop_kyc = EXCLUDED.strict_coop_kyc,
                public_coop_invites = EXCLUDED.public_coop_invites,
                compact_mode = EXCLUDED.compact_mode,
                exact_decimals = EXCLUDED.exact_decimals,
                timezone = EXCLUDED.timezone,
                email_receipts = EXCLUDED.email_receipts,
                sms_alerts = EXCLUDED.sms_alerts,
                webhook_failure_alerts = EXCLUDED.webhook_failure_alerts,
                rotation_turn_alerts = EXCLUDED.rotation_turn_alerts,
                transaction_pin_hash = EXCLUDED.transaction_pin_hash,
                transaction_pin_salt = EXCLUDED.transaction_pin_salt,
                pin_updated_at = EXCLUDED.pin_updated_at,
                updated_at = NOW()
             RETURNING *`,
            [
                auth.userId,
                body.two_factor_enabled ?? current.two_factor_enabled ?? true,
                body.biometric_enabled ?? current.biometric_enabled ?? false,
                dailyLimitKobo,
                body.require_dual_auth ?? current.require_dual_auth ?? true,
                body.api_ip_whitelist ?? current.api_ip_whitelist ?? "",
                body.strict_coop_kyc ?? current.strict_coop_kyc ?? true,
                body.public_coop_invites ?? current.public_coop_invites ?? false,
                body.compact_mode ?? current.compact_mode ?? false,
                body.exact_decimals ?? current.exact_decimals ?? true,
                body.timezone ?? current.timezone ?? "Africa/Lagos",
                body.email_receipts ?? current.email_receipts ?? true,
                body.sms_alerts ?? current.sms_alerts ?? true,
                body.webhook_failure_alerts ?? current.webhook_failure_alerts ?? true,
                body.rotation_turn_alerts ?? current.rotation_turn_alerts ?? true,
                pinHash,
                pinSalt,
                pinUpdated,
                current.pin_updated_at || null,
            ]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: pinUpdated ? "user.security.pin_updated" : "user.preferences.updated",
            entityType: "user_preferences",
            entityId: auth.userId,
            ipAddress: auth.ipAddress,
        })

        const row = upd.rows[0]
        return NextResponse.json({
            success: true,
            preferences: {
                ...row,
                has_transaction_pin: Boolean(row.transaction_pin_hash),
                transaction_pin_hash: undefined,
                transaction_pin_salt: undefined,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
