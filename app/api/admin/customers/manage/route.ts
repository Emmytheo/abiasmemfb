import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import { getCoptellerMemberLinkForCustomer } from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

const TIER_LIMITS: Record<number, { dailyKobo: number; maxBalKobo: number }> = {
    1: { dailyKobo: 5000000, maxBalKobo: 30000000 },       // ₦50k/day · ₦300k max
    2: { dailyKobo: 20000000, maxBalKobo: 500000000 },     // ₦200k/day · ₦5M max
    3: { dailyKobo: 500000000, maxBalKobo: 50000000000 },  // ₦5M/day · Unlimited
}

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const customerIdParam = req.nextUrl.searchParams.get("customerId")

        if (customerIdParam) {
            const customerId = Number(customerIdParam)
            const custRes = await queryBankSuite(`SELECT * FROM public.customers WHERE id = $1 LIMIT 1`, [customerId])
            const customer = custRes.rows[0]
            if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

            const [accountsRes, loansRes, cardsRes, txRes, kycRes, coptellerLink] = await Promise.all([
                queryBankSuite(
                    `SELECT * FROM public.accounts WHERE customer_id = $1 OR ($2 <> '' AND user_id = $2) ORDER BY is_primary DESC, created_at DESC`,
                    [customer.id, customer.supabase_id || ""]
                ),
                queryBankSuite(
                    `SELECT * FROM public.loans WHERE customer_id = $1 OR ($2 <> '' AND user_id = $2) ORDER BY created_at DESC`,
                    [customer.id, customer.supabase_id || ""]
                ),
                queryBankSuite(
                    `SELECT * FROM public.smart_cards WHERE customer_id = $1 OR ($2 <> '' AND user_id = $2) ORDER BY created_at DESC`,
                    [customer.id, customer.supabase_id || ""]
                ).catch(() => ({ rows: [] as any[] })),
                queryBankSuite(
                    `SELECT * FROM public.transactions WHERE customer_id = $1 OR ($2 <> '' AND user_id = $2) ORDER BY created_at DESC LIMIT 25`,
                    [customer.id, customer.supabase_id || ""]
                ),
                queryBankSuite(`SELECT * FROM public.banksuite_kyc_profiles WHERE customer_id = $1 LIMIT 1`, [customer.id]),
                getCoptellerMemberLinkForCustomer({ email: customer.email, bvn: customer.bvn }).catch(() => null),
            ])

            const defaultTier = customer.kyc_status === "active" && customer.bvn ? 2 : 1
            const kycProfile = kycRes.rows[0] || {
                customer_id: customer.id,
                kyc_tier: defaultTier,
                bvn_verified: Boolean(customer.bvn),
                nin: customer.metadata?.nin || "",
                nin_verified: Boolean(customer.metadata?.nin),
                address_verified: Boolean(customer.address),
                daily_limit_kobo: TIER_LIMITS[defaultTier].dailyKobo,
                max_balance_kobo: TIER_LIMITS[defaultTier].maxBalKobo,
            }

            return NextResponse.json({
                success: true,
                customer,
                kycProfile,
                accounts: accountsRes.rows,
                loans: loansRes.rows,
                cards: cardsRes.rows,
                transactions: txRes.rows,
                coptellerLink,
            })
        }

        // List all customers with aggregated balances, loan count & KYC Tier
        const listRes = await queryBankSuite(`
            SELECT c.*,
                   COALESCE(k.kyc_tier, CASE WHEN c.kyc_status = 'active' AND COALESCE(c.bvn, '') <> '' THEN 2 ELSE 1 END) AS kyc_tier,
                   COALESCE(k.bvn_verified, COALESCE(c.bvn, '') <> '') AS bvn_verified,
                   COALESCE(k.nin_verified, FALSE) AS nin_verified,
                   k.nin,
                   COALESCE(k.daily_limit_kobo, 5000000) AS daily_limit_kobo,
                   (SELECT COUNT(*)::int FROM public.accounts a WHERE (a.customer_id = c.id OR (c.supabase_id IS NOT NULL AND a.user_id = c.supabase_id)) AND COALESCE(a.is_archived, FALSE) = FALSE) AS accounts_count,
                   (SELECT COALESCE(SUM(a.balance), 0)::bigint FROM public.accounts a WHERE (a.customer_id = c.id OR (c.supabase_id IS NOT NULL AND a.user_id = c.supabase_id)) AND COALESCE(a.is_archived, FALSE) = FALSE) AS total_balance_kobo,
                   (SELECT COUNT(*)::int FROM public.loans l WHERE (l.customer_id = c.id OR (c.supabase_id IS NOT NULL AND l.user_id = c.supabase_id)) AND l.status IN ('active','defaulted')) AS active_loans_count
            FROM public.customers c
            LEFT JOIN public.banksuite_kyc_profiles k ON k.customer_id = c.id
            WHERE COALESCE(c.is_archived, FALSE) = FALSE
            ORDER BY c.created_at DESC
            LIMIT 200
        `)

        return NextResponse.json({ success: true, customers: listRes.rows })
    } catch (err: any) {
        console.error("[GET /api/admin/customers/manage]", err)
        return NextResponse.json({ error: err.message || "Failed to load customer 360" }, { status: 500 })
    }
}

/**
 * POST /api/admin/customers/manage — Provision a real new NUBAN bank account for a customer.
 */
export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const customerId = Number(body.customer_id)
        const accountType = ["Savings", "Current", "Fixed Deposit", "Corporate"].includes(body.account_type)
            ? body.account_type
            : "Savings"
        const openingDepositNaira = Math.max(0, Number(body.opening_deposit_naira || 0))

        if (!customerId) return NextResponse.json({ error: "customer_id is required" }, { status: 400 })
        const custRes = await queryBankSuite(`SELECT * FROM public.customers WHERE id = $1 LIMIT 1`, [customerId])
        const customer = custRes.rows[0]
        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

        const prefix = accountType === "Corporate" ? "20" : accountType === "Fixed Deposit" ? "40" : "10"
        const nuban = `${prefix}${Math.floor(10000000 + Math.random() * 89999999)}`
        const openingKobo = Math.round(openingDepositNaira * 100)

        const ins = await queryBankSuite(
            `INSERT INTO public.accounts (
                user_id, customer_id, account_number, account_type, balance, currency,
                status, interest_rate, notes, source, is_primary, is_archived, created_at, updated_at
             ) VALUES (
                $1, $2, $3, $4, $5, 'NGN',
                'active', $6, $7, 'local', FALSE, FALSE, NOW(), NOW()
             ) RETURNING *`,
            [
                customer.supabase_id || String(customer.id),
                customer.id,
                nuban,
                accountType,
                openingKobo,
                accountType === "Fixed Deposit" ? 12.5 : accountType === "Savings" ? 5.0 : 0,
                `Opened by ${auth.email} via Customer 360 Desk`,
            ]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: "admin",
            action: "customer.account.opened",
            entityType: "account",
            entityId: ins.rows[0].id,
            amountKobo: openingKobo,
            ipAddress: auth.ipAddress,
            afterState: { account_number: nuban, account_type: accountType, customer_id: customer.id },
        })

        return NextResponse.json({ success: true, account: ins.rows[0] }, { status: 201 })
    } catch (err: any) {
        console.error("[POST /api/admin/customers/manage]", err)
        return NextResponse.json({ error: err.message || "Account provisioning failed" }, { status: 400 })
    }
}

/**
 * PATCH /api/admin/customers/manage — Upgrade CBN KYC Tier (1 / 2 / 3), verify BVN/NIN & update Risk Tier.
 */
export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const customerId = Number(body.customer_id)
        if (!customerId) return NextResponse.json({ error: "customer_id is required" }, { status: 400 })

        const kycTier = [1, 2, 3].includes(Number(body.kyc_tier)) ? Number(body.kyc_tier) : 2
        const bvn = body.bvn !== undefined ? String(body.bvn).replace(/\D/g, "").slice(0, 11) : undefined
        const nin = body.nin !== undefined ? String(body.nin).replace(/\D/g, "").slice(0, 11) : undefined
        const riskTier = ["low", "medium", "high"].includes(body.risk_tier) ? body.risk_tier : undefined
        const kycStatus = ["pending", "active", "inactive", "rejected"].includes(body.kyc_status) ? body.kyc_status : "active"
        const limits = TIER_LIMITS[kycTier]

        const custRes = await queryBankSuite(`SELECT * FROM public.customers WHERE id = $1 LIMIT 1`, [customerId])
        const customer = custRes.rows[0]
        if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 })

        const updatedMeta = {
            ...(customer.metadata && typeof customer.metadata === "object" ? customer.metadata : {}),
            ...(nin ? { nin } : {}),
            kyc_tier: kycTier,
        }

        await queryBankSuite(
            `UPDATE public.customers
             SET kyc_status = $1,
                 risk_tier = COALESCE($2, risk_tier),
                 bvn = COALESCE(NULLIF($3, ''), bvn),
                 metadata = $4::jsonb,
                 updated_at = NOW()
             WHERE id = $5`,
            [kycStatus, riskTier || null, bvn ?? "", JSON.stringify(updatedMeta), customerId]
        )

        const kycUpd = await queryBankSuite(
            `INSERT INTO public.banksuite_kyc_profiles (
                customer_id, kyc_tier, bvn_verified, nin, nin_verified, address_verified,
                daily_limit_kobo, max_balance_kobo, verified_by_email, notes, updated_at
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             ON CONFLICT (customer_id) DO UPDATE SET
                kyc_tier = EXCLUDED.kyc_tier,
                bvn_verified = EXCLUDED.bvn_verified,
                nin = COALESCE(NULLIF(EXCLUDED.nin, ''), banksuite_kyc_profiles.nin),
                nin_verified = EXCLUDED.nin_verified,
                address_verified = EXCLUDED.address_verified,
                daily_limit_kobo = EXCLUDED.daily_limit_kobo,
                max_balance_kobo = EXCLUDED.max_balance_kobo,
                verified_by_email = EXCLUDED.verified_by_email,
                notes = EXCLUDED.notes,
                updated_at = NOW()
             RETURNING *`,
            [
                customerId,
                kycTier,
                Boolean(body.bvn_verified ?? (bvn || customer.bvn)),
                nin || "",
                Boolean(body.nin_verified ?? Boolean(nin)),
                Boolean(body.address_verified ?? kycTier === 3),
                limits.dailyKobo,
                limits.maxBalKobo,
                auth.email,
                String(body.notes || `Tier ${kycTier} authorized via Customer 360`),
            ]
        )

        // Sync daily transfer limit into user preferences if customer is linked to Supabase user
        if (customer.supabase_id) {
            await queryBankSuite(
                `INSERT INTO public.banksuite_user_preferences (user_id, daily_transfer_limit_kobo, updated_at)
                 VALUES ($1, $2, NOW())
                 ON CONFLICT (user_id) DO UPDATE SET daily_transfer_limit_kobo = EXCLUDED.daily_transfer_limit_kobo, updated_at = NOW()`,
                [customer.supabase_id, limits.dailyKobo]
            ).catch(() => {})
        }

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: "admin",
            action: `customer.kyc.tier_${kycTier}`,
            entityType: "customer",
            entityId: customerId,
            ipAddress: auth.ipAddress,
            afterState: { kyc_tier: kycTier, kyc_status: kycStatus, daily_limit_kobo: limits.dailyKobo },
        })

        return NextResponse.json({ success: true, kycProfile: kycUpd.rows[0] })
    } catch (err: any) {
        console.error("[PATCH /api/admin/customers/manage]", err)
        return NextResponse.json({ error: err.message || "KYC tier update failed" }, { status: 400 })
    }
}
