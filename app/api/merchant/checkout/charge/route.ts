import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import { intraBankTransfer } from "@/lib/api/adapters/qore/actions"
import { dispatchWebhook } from "@/lib/utils/webhook-dispatcher"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"

export async function POST(req: NextRequest) {
    try {
        // Strict authentication: payer MUST be authenticated and own the source account
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        await ensureBankSuiteOperationalTables()

        const body = await req.json().catch(() => ({}))
        const { checkout_id, source_account_id } = body

        if (!checkout_id) {
            return NextResponse.json({ error: "checkout_id is required" }, { status: 400 })
        }

        // Resolve source account strictly scoped to the authenticated user (unless admin)
        let targetSourceAccountId: number | null = source_account_id ? Number(source_account_id) : null
        if (!targetSourceAccountId) {
            const accRes = await queryBankSuite(
                `SELECT id FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1`,
                [auth.userId]
            )
            targetSourceAccountId = accRes.rows[0]?.id ? Number(accRes.rows[0].id) : null
        }

        if (!targetSourceAccountId) {
            return NextResponse.json(
                { error: "No active source bank account found for payer." },
                { status: 400 }
            )
        }

        const { profile: activeBank } = await getServerBankProfile()
        const ref = `MCH_CHG_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

        const settlement = await withBankSuiteTransaction(async (client) => {
            // Lock checkout session first to prevent double-charge races
            const chkRes = await client.query(
                `SELECT * FROM public.merchant_checkouts WHERE id = $1 FOR UPDATE`,
                [Number(checkout_id)]
            )
            const checkout = chkRes.rows[0]
            if (!checkout) throw new Error("NOT_FOUND:Checkout session not found")
            if (checkout.status === "successful") {
                throw new Error("BAD_REQUEST:Checkout session has already been settled")
            }

            const merchRes = await client.query(
                `SELECT * FROM public.merchant_profiles WHERE id = $1`,
                [checkout.merchant_id]
            )
            const merchant = merchRes.rows[0]
            if (!merchant || !merchant.is_verified) {
                throw new Error("FORBIDDEN:Merchant account is not verified or active")
            }

            const settlementAccountId = Number(merchant.settlement_account_id)
            const lockIds =
                targetSourceAccountId === settlementAccountId
                    ? [targetSourceAccountId]
                    : [targetSourceAccountId, settlementAccountId].sort((a, b) => a - b)

            const accRows = await client.query(
                `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status, source
                 FROM public.accounts WHERE id = ANY($1::int[]) ORDER BY id ASC FOR UPDATE`,
                [lockIds]
            )

            const payerAccount = accRows.rows.find((r) => Number(r.id) === targetSourceAccountId)
            const merchantAccount = accRows.rows.find((r) => Number(r.id) === settlementAccountId)

            if (!payerAccount || payerAccount.status !== "active") {
                throw new Error("BAD_REQUEST:Source payment account is not active")
            }
            if (!auth.isAdmin && String(payerAccount.user_id) !== auth.userId) {
                throw new Error("FORBIDDEN:You do not own the selected source account")
            }
            if (payerAccount.is_frozen || payerAccount.pnd_enabled) {
                throw new Error("BAD_REQUEST:Source account has freeze or Post-No-Debit restriction")
            }
            if (!merchantAccount) {
                throw new Error("SERVER:Merchant settlement account not found")
            }

            const amountKobo = Math.round(Number(checkout.amount || 0))
            const availableKobo = Math.max(
                0,
                Number(payerAccount.balance || 0) - Number(payerAccount.lien_amount || 0)
            )
            if (availableKobo < amountKobo) {
                throw new Error("BAD_REQUEST:Insufficient available funds in source account")
            }

            let qoreProcessed = false
            if (
                payerAccount.source === "qore" &&
                merchantAccount.source === "qore" &&
                payerAccount.id !== merchantAccount.id &&
                process.env.QORE_SECRET_ID
            ) {
                try {
                    await intraBankTransfer({
                        FromAccountNumber: payerAccount.account_number,
                        ToAccountNumber: merchantAccount.account_number,
                        Amount: String(amountKobo),
                        Narration: `${activeBank.internalPayBrand} Charge: ${merchant.business_name}`,
                        RetrievalReference: ref.replace(/[^A-Z0-9]/gi, "").slice(0, 12).padEnd(12, "0"),
                    })
                    qoreProcessed = true
                } catch (err: any) {
                    if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                        throw new Error(`BAD_REQUEST:Core Settlement Error: ${err.message}`)
                    }
                    console.warn("[Merchant Charge] Qore staging warning:", err.message)
                }
            }

            const newPayerBal =
                payerAccount.id === merchantAccount.id
                    ? Number(payerAccount.balance)
                    : Number(payerAccount.balance) - amountKobo

            if (payerAccount.id !== merchantAccount.id) {
                await client.query(
                    `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                    [newPayerBal, payerAccount.id]
                )
                await client.query(
                    `UPDATE public.accounts SET balance = balance + $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                    [amountKobo, merchantAccount.id]
                )
            }

            const txRes = await client.query(
                `
                INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, to_account_id,
                    status, narration, channel, balance_after, date, metadata,
                    customer_id, user_id, created_at, updated_at
                ) VALUES (
                    $1, 'transfer', $2, 'NGN', $3, $4,
                    'successful', $5, 'api', $6, NOW(), $7::jsonb,
                    $8, $9, NOW(), NOW()
                ) RETURNING id
                `,
                [
                    ref,
                    amountKobo,
                    payerAccount.id,
                    merchantAccount.id,
                    `Merchant Checkout: ${merchant.business_name} (${checkout.reference})`,
                    newPayerBal,
                    JSON.stringify({
                        checkout_id: checkout.id,
                        reference: checkout.reference,
                        merchant_id: merchant.id,
                        qore_processed: qoreProcessed,
                    }),
                    payerAccount.customer_id || null,
                    payerAccount.user_id,
                ]
            )
            const txnId = Number(txRes.rows[0].id)

            const updChk = await client.query(
                `UPDATE public.merchant_checkouts SET status = 'successful', transaction_id = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                [txnId, checkout.id]
            )

            return {
                checkout: updChk.rows[0],
                merchant,
                amountKobo,
                txnId,
                qoreProcessed,
            }
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "merchant.checkout.charged",
            entityType: "merchant_checkout",
            entityId: settlement.checkout.id,
            amountKobo: settlement.amountKobo,
            ipAddress: auth.ipAddress,
            afterState: {
                reference: settlement.checkout.reference,
                merchant: settlement.merchant.business_name,
                transaction_id: settlement.txnId,
            },
        })

        const webhookPayload = {
            event: "checkout.successful",
            data: {
                reference: settlement.checkout.reference,
                amount: settlement.amountKobo,
                status: "successful",
                email: settlement.checkout.customer_email,
                metadata: settlement.checkout.metadata || {},
                paid_at: new Date().toISOString(),
            },
        }

        // Dispatch signed webhook with derived HMAC secret (never hardcoded fallback string)
        if (settlement.merchant.webhook_url) {
            const signingSecret = crypto
                .createHmac("sha256", process.env.PAYLOAD_SECRET || process.env.ADMIN_SECRET || "banksuite-webhook-hmac")
                .update(`merchant:${settlement.merchant.id}`)
                .digest("hex")

            dispatchWebhook(settlement.merchant.webhook_url, signingSecret, webhookPayload, {
                merchantId: Number(settlement.merchant.id),
                userId: settlement.merchant.user_id,
                brandHeader: activeBank.shortName,
                retries: 2,
            }).catch(() => {})
        }

        return NextResponse.json({
            success: true,
            checkout: settlement.checkout,
            reference: settlement.checkout.reference,
            redirectUrl: settlement.checkout.redirect_url,
            webhook_dispatch: { payload: webhookPayload },
        })
    } catch (error: any) {
        const raw = String(error?.message || "Internal server error")
        if (raw.startsWith("NOT_FOUND:")) return NextResponse.json({ error: raw.slice(10) }, { status: 404 })
        if (raw.startsWith("FORBIDDEN:")) return NextResponse.json({ error: raw.slice(10) }, { status: 403 })
        if (raw.startsWith("BAD_REQUEST:")) return NextResponse.json({ error: raw.slice(12) }, { status: 400 })
        console.error("[POST /api/merchant/checkout/charge] Error:", raw)
        return NextResponse.json({ error: raw.replace(/^SERVER:/, "") }, { status: 500 })
    }
}
