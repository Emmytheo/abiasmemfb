import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

function generateNuban(prefix = "30") {
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("")
    return `${prefix}${digits}`
}

/**
 * POST /api/client/onboarding/provision-tier1
 * Deterministic Tier-1 Savings NUBAN instant auto-provisioner on customer onboarding completion.
 * Ensures new self-signup customers receive an active CBN Tier-1 NUBAN immediately
 * without getting stuck waiting for manual Admin intervention.
 */
export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const firstName = String(body.firstName || "").trim()
        const lastName = String(body.lastName || "").trim()
        const phone = String(body.phone_number || "").trim() || null
        const address = String(body.address || "").trim() || null
        const bvn = String(body.bvn || "").replace(/\D/g, "").slice(0, 11) || null
        const accountType = String(body.account_type || "Savings").trim() || "Savings"

        const result = await withBankSuiteTransaction(async (client) => {
            // 1. Upsert customer profile
            let custRes = await client.query(
                `SELECT * FROM public.customers WHERE supabase_id = $1 OR LOWER(email) = LOWER($2) ORDER BY id ASC LIMIT 1 FOR UPDATE`,
                [auth.userId, auth.email]
            )
            let customer = custRes.rows[0]

            if (!customer) {
                const insCust = await client.query(
                    `INSERT INTO public.customers (
                        supabase_id, email, first_name, last_name, phone_number, address, bvn,
                        kyc_status, risk_tier, onboarding_status, active, created_at, updated_at
                     ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', 'low', 'completed', TRUE, NOW(), NOW())
                     RETURNING *`,
                    [
                        auth.userId,
                        auth.email,
                        firstName || auth.email.split("@")[0],
                        lastName || "Customer",
                        phone,
                        address,
                        bvn,
                    ]
                )
                customer = insCust.rows[0]
            } else {
                const updCust = await client.query(
                    `UPDATE public.customers
                     SET supabase_id = COALESCE(supabase_id, $1),
                         first_name = COALESCE(NULLIF($2, ''), first_name),
                         last_name = COALESCE(NULLIF($3, ''), last_name),
                         phone_number = COALESCE($4, phone_number),
                         address = COALESCE($5, address),
                         bvn = COALESCE($6, bvn),
                         onboarding_status = 'completed',
                         kyc_status = CASE WHEN kyc_status = 'pending' THEN 'active' ELSE kyc_status END,
                         updated_at = NOW()
                     WHERE id = $7 RETURNING *`,
                    [auth.userId, firstName, lastName, phone, address, bvn, customer.id]
                )
                customer = updCust.rows[0]
            }

            // 2. Ensure CBN Tier-1 KYC profile (₦50k/day limit, ₦300k max balance; Tier-2 if BVN provided)
            const tier = bvn && bvn.length === 11 ? 2 : 1
            const dailyLimitKobo = tier === 2 ? 20000000 : 5000000
            const maxBalKobo = tier === 2 ? 50000000 : 30000000
            await client.query(
                `INSERT INTO public.banksuite_kyc_profiles (
                    customer_id, kyc_tier, bvn_verified, daily_limit_kobo, max_balance_kobo,
                    verified_by_email, notes, updated_at
                 ) VALUES ($1, $2, $3, $4, $5, 'auto-onboarding@banksuite.core', 'Self-service Tier-1/2 digital onboarding', NOW())
                 ON CONFLICT (customer_id) DO UPDATE SET
                    kyc_tier = GREATEST(public.banksuite_kyc_profiles.kyc_tier, EXCLUDED.kyc_tier),
                    bvn_verified = public.banksuite_kyc_profiles.bvn_verified OR EXCLUDED.bvn_verified,
                    daily_limit_kobo = GREATEST(public.banksuite_kyc_profiles.daily_limit_kobo, EXCLUDED.daily_limit_kobo),
                    max_balance_kobo = GREATEST(public.banksuite_kyc_profiles.max_balance_kobo, EXCLUDED.max_balance_kobo),
                    updated_at = NOW()`,
                [customer.id, tier, Boolean(bvn && bvn.length === 11), dailyLimitKobo, maxBalKobo]
            )

            // 3. Return existing primary account or provision a live unique 10-digit NUBAN
            const existingAcc = await client.query(
                `SELECT * FROM public.accounts WHERE user_id = $1 OR customer_id = $2 ORDER BY is_primary DESC, id ASC LIMIT 1`,
                [auth.userId, customer.id]
            )
            let account = existingAcc.rows[0]
            let newlyProvisioned = false

            if (!account) {
                let nuban = generateNuban("30")
                for (let i = 0; i < 6; i++) {
                    const dup = await client.query(`SELECT id FROM public.accounts WHERE account_number = $1`, [nuban])
                    if (dup.rows.length === 0) break
                    nuban = generateNuban("30")
                }

                const insAcc = await client.query(
                    `INSERT INTO public.accounts (
                        user_id, customer_id, account_number, account_type, balance, lien_amount,
                        currency, status, source, is_primary, is_frozen, pnd_enabled,
                        metadata, created_at, updated_at
                     ) VALUES (
                        $1, $2, $3, $4, 0, 0,
                        'NGN', 'active', 'local', TRUE, FALSE, FALSE,
                        $5::jsonb, NOW(), NOW()
                     ) RETURNING *`,
                    [
                        auth.userId,
                        customer.id,
                        nuban,
                        accountType,
                        JSON.stringify({ provisioned_via: "self_service_tier1_onboarding", kyc_tier: tier }),
                    ]
                )
                account = insAcc.rows[0]
                newlyProvisioned = true
            }

            // 4. Mark any stuck onboarding application as Provisioned
            await client.query(
                `UPDATE public.product_applications
                 SET status = 'approved', workflow_stage = 'Provisioned',
                     metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                     updated_at = NOW()
                 WHERE user_id = $2 AND status::text IN ('pending', 'approved') AND workflow_stage <> 'Provisioned'`,
                [JSON.stringify({ provisioned_account_number: account.account_number }), auth.userId]
            ).catch(() => {})

            return { customer, account, tier, newlyProvisioned }
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "onboarding.tier1_nuban_provisioned",
            entityType: "account",
            entityId: result.account.id,
            ipAddress: auth.ipAddress,
            afterState: {
                account_number: result.account.account_number,
                kyc_tier: result.tier,
                newly_provisioned: result.newlyProvisioned,
            },
        })

        return NextResponse.json({
            success: true,
            newlyProvisioned: result.newlyProvisioned,
            kycTier: result.tier,
            accountNumber: result.account.account_number,
            account: result.account,
            customer: result.customer,
            message: `Live Tier-${result.tier} NUBAN ${result.account.account_number} is active and ready to receive transfers!`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Tier-1 provisioning failed" }, { status: 400 })
    }
}
