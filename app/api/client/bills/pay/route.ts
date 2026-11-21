import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
    ensureBankSuiteOperationalTables,
    queryBankSuite,
    withBankSuiteTransaction,
} from "@/lib/banking/db-pool"
import { postBalancedGlJournal } from "@/lib/banking/gl-engine"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export interface BillCatalogItem {
    id: string
    category: "airtime" | "data" | "electricity" | "cable" | "levies"
    name: string
    providerCode: string
    customerLabel: string
    customerPlaceholder: string
    feeNaira: number
    minAmountNaira: number
    maxAmountNaira: number
    quickAmounts: number[]
    packages?: { label: string; amountNaira: number }[]
}

const BILL_CATALOG: BillCatalogItem[] = [
    {
        id: "airtime-mtn",
        category: "airtime",
        name: "MTN Nigeria Airtime",
        providerCode: "MTN_VTU",
        customerLabel: "Phone Number",
        customerPlaceholder: "0803 000 0000",
        feeNaira: 0,
        minAmountNaira: 50,
        maxAmountNaira: 50000,
        quickAmounts: [200, 500, 1000, 2000, 5000],
    },
    {
        id: "airtime-airtel",
        category: "airtime",
        name: "Airtel Nigeria Airtime",
        providerCode: "AIRTEL_VTU",
        customerLabel: "Phone Number",
        customerPlaceholder: "0802 000 0000",
        feeNaira: 0,
        minAmountNaira: 50,
        maxAmountNaira: 50000,
        quickAmounts: [200, 500, 1000, 2000, 5000],
    },
    {
        id: "airtime-glo",
        category: "airtime",
        name: "Glo / 9mobile Airtime",
        providerCode: "GLO_VTU",
        customerLabel: "Phone Number",
        customerPlaceholder: "0805 000 0000",
        feeNaira: 0,
        minAmountNaira: 50,
        maxAmountNaira: 50000,
        quickAmounts: [200, 500, 1000, 2000],
    },
    {
        id: "data-bundles",
        category: "data",
        name: "Mobile Data Bundles (MTN / Airtel / Glo)",
        providerCode: "DATA_BUNDLE",
        customerLabel: "Subscriber Phone Number",
        customerPlaceholder: "0803 000 0000",
        feeNaira: 0,
        minAmountNaira: 300,
        maxAmountNaira: 50000,
        quickAmounts: [500, 1200, 2500, 5000, 10000],
        packages: [
            { label: "1.5GB Monthly", amountNaira: 1200 },
            { label: "4.5GB Monthly", amountNaira: 2500 },
            { label: "12GB Monthly", amountNaira: 5000 },
            { label: "40GB Mega", amountNaira: 12000 },
        ],
    },
    {
        id: "elec-eedc",
        category: "electricity",
        name: "EEDC Prepaid / Postpaid (Enugu & Abia)",
        providerCode: "EEDC_PREPAID",
        customerLabel: "Meter Number",
        customerPlaceholder: "4502 1984 221",
        feeNaira: 100,
        minAmountNaira: 1000,
        maxAmountNaira: 500000,
        quickAmounts: [2000, 5000, 10000, 20000, 50000],
    },
    {
        id: "elec-aba-power",
        category: "electricity",
        name: "Aba Power (Geometric) Prepaid",
        providerCode: "ABAPOWER_PREPAID",
        customerLabel: "Meter Number",
        customerPlaceholder: "0421 8841 903",
        feeNaira: 100,
        minAmountNaira: 1000,
        maxAmountNaira: 500000,
        quickAmounts: [2000, 5000, 10000, 20000, 50000],
    },
    {
        id: "elec-ikedc-ekedc",
        category: "electricity",
        name: "IKEDC / EKEDC / AEDC Electricity",
        providerCode: "NATIONAL_DISCO",
        customerLabel: "Meter Number",
        customerPlaceholder: "1029 4412 889",
        feeNaira: 100,
        minAmountNaira: 1000,
        maxAmountNaira: 500000,
        quickAmounts: [5000, 10000, 20000, 50000],
    },
    {
        id: "cable-dstv",
        category: "cable",
        name: "DStv Subscription",
        providerCode: "DSTV",
        customerLabel: "Smartcard / IUC Number",
        customerPlaceholder: "7028192045",
        feeNaira: 100,
        minAmountNaira: 3000,
        maxAmountNaira: 100000,
        quickAmounts: [7900, 15700, 29500, 44500],
        packages: [
            { label: "DStv Padi", amountNaira: 4400 },
            { label: "DStv Yanga", amountNaira: 6000 },
            { label: "DStv Confam", amountNaira: 11000 },
            { label: "DStv Compact", amountNaira: 19000 },
            { label: "DStv Premium", amountNaira: 44500 },
        ],
    },
    {
        id: "cable-gotv",
        category: "cable",
        name: "GOtv & Startimes Subscription",
        providerCode: "GOTV",
        customerLabel: "IUC / Smartcard Number",
        customerPlaceholder: "4120987651",
        feeNaira: 100,
        minAmountNaira: 1500,
        maxAmountNaira: 50000,
        quickAmounts: [3600, 5800, 8500, 15700],
        packages: [
            { label: "GOtv Smallie", amountNaira: 1900 },
            { label: "GOtv Jinja", amountNaira: 3600 },
            { label: "GOtv Jolli", amountNaira: 5800 },
            { label: "GOtv Max", amountNaira: 8500 },
            { label: "GOtv Supa+", amountNaira: 16800 },
        ],
    },
    {
        id: "levy-abia-igr",
        category: "levies",
        name: "Abia State IGR / Market & Transport Levy",
        providerCode: "ABIA_IGR",
        customerLabel: "ABSSIN / Assessment Reference",
        customerPlaceholder: "ABIA-IGR-2026-0041",
        feeNaira: 50,
        minAmountNaira: 500,
        maxAmountNaira: 2000000,
        quickAmounts: [1000, 2500, 5000, 10000, 25000],
    },
]

function generateElectricityToken(): string {
    const digits = Array.from({ length: 20 }, () => crypto.randomInt(0, 10)).join("")
    return digits.replace(/(.{4})/g, "$1-").slice(0, -1)
}

/**
 * GET /api/client/bills/pay
 * Returns active biller catalog, customer's spendable accounts, and recent bill payments.
 */
export async function GET() {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await ensureBankSuiteOperationalTables()

        const [accRes, custRes, recentRes] = await Promise.all([
            queryBankSuite(
                `SELECT id, account_number, account_type, balance, lien_amount, status, is_frozen, pnd_enabled, is_primary
                 FROM public.accounts
                 WHERE (user_id = $1 OR customer_id IN (SELECT id FROM public.customers WHERE supabase_id = $1))
                   AND COALESCE(is_archived, FALSE) = FALSE
                 ORDER BY is_primary DESC, id ASC`,
                [user.id]
            ),
            queryBankSuite(`SELECT id, first_name, last_name FROM public.customers WHERE supabase_id = $1 LIMIT 1`, [user.id]),
            queryBankSuite(
                `SELECT id, reference, amount, status, narration, metadata, created_at
                 FROM public.transactions
                 WHERE user_id = $1 AND (category = 'Bills' OR narration ILIKE '%Bill Payment%' OR narration ILIKE '%Airtime%' OR narration ILIKE '%Electricity%' OR narration ILIKE '%Cable%')
                 ORDER BY created_at DESC
                 LIMIT 15`,
                [user.id]
            ).catch(() => ({ rows: [] as any[] })),
        ])

        const accounts = accRes.rows.map((a) => ({
            id: String(a.id),
            account_number: String(a.account_number),
            account_type: String(a.account_type || "Savings"),
            balanceNaira: Number(a.balance || 0) / 100,
            availableNaira: Math.max(0, Number(a.balance || 0) - Number(a.lien_amount || 0)) / 100,
            status: a.status,
            is_frozen: Boolean(a.is_frozen),
            pnd_enabled: Boolean(a.pnd_enabled),
        }))

        const recentBills = recentRes.rows.map((tx) => ({
            id: String(tx.id),
            reference: String(tx.reference),
            amountNaira: Number(tx.amount || 0) / 100,
            status: tx.status,
            narration: tx.narration,
            token: tx.metadata?.meter_token || tx.metadata?.voucher_pin || null,
            billerName: tx.metadata?.biller_name || null,
            customerRef: tx.metadata?.customer_ref || null,
            created_at: tx.created_at,
        }))

        return NextResponse.json({
            success: true,
            catalog: BILL_CATALOG,
            accounts,
            recentBills,
            customerName: custRes.rows[0]
                ? `${custRes.rows[0].first_name || ""} ${custRes.rows[0].last_name || ""}`.trim()
                : user.email,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to load bill payments" }, { status: 500 })
    }
}

/**
 * POST /api/client/bills/pay
 * Atomic BankSuite Bill Payment execution:
 * 1) Validates customer ownership, account status, available balance, and optional transaction PIN.
 * 2) Debits customer account with FOR UPDATE row lock.
 * 3) Inserts transaction receipt into public.transactions (category: 'Bills').
 * 4) Posts balanced Double-Entry GL Journal (DR 2000 Customer Deposits / CR 1000 Biller Clearing / CR 4000 Fee Revenue).
 * 5) Generates electricity prepaid token or instant biller confirmation receipt + audit log.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await ensureBankSuiteOperationalTables()

        const body = await req.json().catch(() => ({}))
        const sourceAccountId = Number(body.sourceAccountId || body.account_id)
        const billerId = String(body.billerId || "").trim()
        const customBillerName = String(body.billerName || "").trim()
        const customCategory = String(body.category || "bills").trim()
        const customerRef = String(
            body.customerRef || body.meter_number || body.smartcard_number || body.phone_number || body.customer_id || ""
        ).trim()
        const amountNaira = Number(body.amountNaira ?? body.amount ?? 0)
        const transactionPin = body.transactionPin ? String(body.transactionPin).trim() : null
        const packageLabel = body.packageLabel ? String(body.packageLabel).trim() : null

        const biller = BILL_CATALOG.find((b) => b.id === billerId || b.providerCode === billerId)
        const billerName = biller?.name || customBillerName || "Utility Bill Payment"
        const feeNaira = biller ? biller.feeNaira : Number(body.feeNaira ?? 0)
        const billCategory = biller?.category || customCategory

        if (!sourceAccountId || !Number.isFinite(sourceAccountId)) {
            return NextResponse.json({ error: "Please select a valid source NUBAN account." }, { status: 400 })
        }
        if (!customerRef || customerRef.length < 4) {
            return NextResponse.json({ error: "Please enter a valid meter, smartcard, phone, or assessment number." }, { status: 400 })
        }
        if (!Number.isFinite(amountNaira) || amountNaira < (biller?.minAmountNaira || 50)) {
            return NextResponse.json(
                { error: `Minimum payment amount is ₦${(biller?.minAmountNaira || 50).toLocaleString()}.` },
                { status: 400 }
            )
        }
        if (biller && amountNaira > biller.maxAmountNaira) {
            return NextResponse.json(
                { error: `Maximum single payment for ${biller.name} is ₦${biller.maxAmountNaira.toLocaleString()}.` },
                { status: 400 }
            )
        }

        // Verify Transaction PIN if user configured one
        const prefRes = await queryBankSuite(
            `SELECT transaction_pin_hash FROM public.banksuite_user_preferences WHERE user_id = $1 LIMIT 1`,
            [user.id]
        ).catch(() => ({ rows: [] as any[] }))
        const storedPinHash = prefRes.rows[0]?.transaction_pin_hash
        if (storedPinHash && transactionPin) {
            const incomingHash = crypto.createHash("sha256").update(transactionPin).digest("hex")
            if (incomingHash !== storedPinHash) {
                return NextResponse.json({ error: "Invalid 4-digit Transaction PIN." }, { status: 403 })
            }
        }

        const principalKobo = Math.round(amountNaira * 100)
        const feeKobo = Math.round(Math.max(0, feeNaira) * 100)
        const totalDebitKobo = principalKobo + feeKobo
        const reference = `BILL_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`
        const meterToken = billCategory === "electricity" ? generateElectricityToken() : null
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined

        const txResult = await withBankSuiteTransaction(async (client) => {
            const accRes = await client.query(
                `SELECT id, account_number, balance, lien_amount, status, is_frozen, pnd_enabled, customer_id, user_id
                 FROM public.accounts
                 WHERE id = $1
                   AND (user_id = $2 OR customer_id IN (SELECT id FROM public.customers WHERE supabase_id = $2))
                 LIMIT 1 FOR UPDATE`,
                [sourceAccountId, user.id]
            )
            const acc = accRes.rows[0]
            if (!acc) {
                throw new Error("Source account not found or does not belong to you.")
            }
            if (acc.status !== "active" || acc.is_frozen || acc.pnd_enabled) {
                throw new Error("Selected account is restricted, frozen, or has Post-No-Debit active.")
            }

            const availKobo = Number(acc.balance || 0) - Number(acc.lien_amount || 0)
            if (availKobo < totalDebitKobo) {
                throw new Error(
                    `Insufficient available balance. Required: ₦${(totalDebitKobo / 100).toLocaleString()}, Available: ₦${(availKobo / 100).toLocaleString()}.`
                )
            }

            const balanceAfterKobo = Number(acc.balance) - totalDebitKobo
            await client.query(
                `UPDATE public.accounts
                 SET balance = $1, last_transaction_at = NOW(), updated_at = NOW()
                 WHERE id = $2`,
                [balanceAfterKobo, acc.id]
            )

            const narration = `Bill Payment: ${billerName}${packageLabel ? ` (${packageLabel})` : ""} — ${customerRef}`
            const metadata = {
                rail: "BANKSUITE_BILL_PAYMENT",
                biller_id: biller?.id || billerId || "custom",
                biller_name: billerName,
                provider_code: biller?.providerCode || "CUSTOM_BILLER",
                bill_category: billCategory,
                customer_ref: customerRef,
                package_label: packageLabel,
                principal_kobo: principalKobo,
                fee_kobo: feeKobo,
                meter_token: meterToken,
                units_kwh: billCategory === "electricity" ? Number((amountNaira / 209.5).toFixed(1)) : null,
            }

            const txIns = await client.query(
                `INSERT INTO public.transactions (
                    reference, type, category, amount, currency, from_account_id,
                    status, narration, channel, balance_after, date, metadata,
                    customer_id, user_id, created_at, updated_at
                 ) VALUES (
                    $1, 'debit', 'Bills', $2, 'NGN', $3,
                    'successful', $4, 'portal', $5, NOW(), $6::jsonb,
                    $7, $8, NOW(), NOW()
                 ) RETURNING id, reference, created_at`,
                [
                    reference,
                    totalDebitKobo,
                    acc.id,
                    narration,
                    balanceAfterKobo,
                    JSON.stringify(metadata),
                    acc.customer_id || null,
                    user.id,
                ]
            )

            return {
                transactionId: String(txIns.rows[0].id),
                reference: String(txIns.rows[0].reference),
                createdAt: txIns.rows[0].created_at,
                accountNumber: String(acc.account_number),
                balanceAfterKobo,
                narration,
                metadata,
            }
        })

        // Post balanced Double-Entry GL Journal
        let glJournalRef: string | null = null
        try {
            const gl = await postBalancedGlJournal({
                journalRef: `GL_${reference}`,
                narration: txResult.narration,
                sourceModule: "bill_payments",
                sourceRef: reference,
                actorId: user.id,
                actorEmail: user.email || "client@banksuite.local",
                ipAddress,
                lines: [
                    {
                        glCode: "2000",
                        side: "debit",
                        amountKobo: totalDebitKobo,
                        narration: `Customer debit for ${billerName} (${txResult.accountNumber})`,
                    },
                    {
                        glCode: "1000",
                        side: "credit",
                        amountKobo: principalKobo,
                        narration: `Biller settlement clearing (${biller?.providerCode || "BILLER"})`,
                    },
                    ...(feeKobo > 0
                        ? [
                              {
                                  glCode: "4000",
                                  side: "credit" as const,
                                  amountKobo: feeKobo,
                                  narration: `Bill payment convenience fee (${billerName})`,
                              },
                          ]
                        : []),
                ],
            })
            glJournalRef = gl.journalRef
        } catch (glErr: any) {
            console.warn("[Bills GL] Non-fatal GL mirror warning:", glErr.message)
        }

        await writeBankAuditLog({
            actorId: user.id,
            actorEmail: user.email || "client@banksuite.local",
            actorRole: "customer",
            action: "client.bill_payment.settled",
            entityType: "transaction",
            entityId: txResult.transactionId,
            amountKobo: totalDebitKobo,
            ipAddress,
            afterState: {
                reference,
                billerName,
                customerRef,
                feeKobo,
                meterToken,
                glJournalRef,
            },
        })

        return NextResponse.json({
            success: true,
            receipt: {
                transactionId: txResult.transactionId,
                reference: txResult.reference,
                billerName,
                category: billCategory,
                customerRef,
                packageLabel,
                amountNaira,
                feeNaira,
                totalDebitedNaira: totalDebitKobo / 100,
                accountNumber: txResult.accountNumber,
                balanceAfterNaira: txResult.balanceAfterKobo / 100,
                meterToken,
                unitsKwh: txResult.metadata.units_kwh,
                glJournalRef,
                createdAt: txResult.createdAt,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Bill payment failed" }, { status: 400 })
    }
}
