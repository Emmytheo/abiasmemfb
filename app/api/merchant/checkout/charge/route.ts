import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { intraBankTransfer } from '@/lib/api/adapters/qore/actions'
import crypto from 'crypto'
import { createClient as createServerSupabase } from '@/lib/supabase/server'

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}))
        const { checkout_id, source_account_id } = body

        if (!checkout_id) {
            return NextResponse.json({ error: 'checkout_id is required' }, { status: 400 })
        }

        const payload = await getPayload({ config: configPromise })
        let finalSourceAccountId = source_account_id

        if (!finalSourceAccountId) {
            const supabase = await createServerSupabase()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const accounts = await payload.find({
                    collection: 'accounts',
                    where: { user_id: { equals: user.id } },
                    limit: 1,
                    overrideAccess: true,
                })
                if (accounts.docs.length > 0) {
                    finalSourceAccountId = accounts.docs[0].id
                }
            }
        }

        if (!finalSourceAccountId) {
            return NextResponse.json({ error: 'source_account_id is required' }, { status: 400 })
        }

        // Get checkout session
        const checkout = await payload.findByID({
            collection: 'merchant-checkouts',
            id: checkout_id,
            overrideAccess: true,
        })

        if (!checkout) {
            return NextResponse.json({ error: 'Checkout session not found' }, { status: 404 })
        }

        if (checkout.status === 'successful') {
            return NextResponse.json({ error: 'Checkout session has already been processed and paid successfully' }, { status: 400 })
        }

        // Get merchant
        const merchantId = typeof checkout.merchant === 'object' ? checkout.merchant.id : checkout.merchant
        const merchant = await payload.findByID({
            collection: 'merchant-profiles',
            id: merchantId,
            overrideAccess: true,
        })

        if (!merchant) {
            return NextResponse.json({ error: 'Merchant profile not found' }, { status: 500 })
        }

        // Get payer savings account
        const payerAccount = await payload.findByID({
            collection: 'accounts',
            id: finalSourceAccountId,
            overrideAccess: true,
        })

        if (!payerAccount || payerAccount.status !== 'active') {
            return NextResponse.json({ error: 'Source payment account not active or not found' }, { status: 400 })
        }

        const amountKobo = checkout.amount
        if (payerAccount.balance < amountKobo) {
            return NextResponse.json({ error: 'Insufficient funds in the selected source account' }, { status: 400 })
        }

        // Get merchant settlement account
        const settlementAccountId = typeof merchant.settlement_account === 'object' ? merchant.settlement_account.id : merchant.settlement_account
        const merchantAccount = await payload.findByID({
            collection: 'accounts',
            id: settlementAccountId,
            overrideAccess: true,
        })

        if (!merchantAccount) {
            return NextResponse.json({ error: 'Merchant settlement account not found' }, { status: 500 })
        }

        const ref = `MCH_CHG_${Date.now()}`

        // Trigger ledger transaction strictly on the core
        let qoreSuccess = false
        if (payerAccount.source === 'qore' && merchantAccount.source === 'qore') {
            try {
                await intraBankTransfer({
                    FromAccountNumber: payerAccount.account_number,
                    ToAccountNumber: merchantAccount.account_number,
                    Amount: String(amountKobo),
                    Narration: `SME Pay Charge: ${merchant.business_name}`,
                    RetrievalReference: ref.slice(0, 12).padEnd(12, '0'),
                })
                qoreSuccess = true
            } catch (err: any) {
                console.error('[Qore SME Sync] Core transfer failed. Aborting transaction.', err)
                return NextResponse.json({ error: `Core Settlement Error: ${err.message}` }, { status: 400 })
            }
        }

        // Deduct payer account
        await payload.update({
            collection: 'accounts',
            id: payerAccount.id,
            data: {
                balance: payerAccount.balance - amountKobo,
            },
            overrideAccess: true,
        })

        // Credit merchant account
        await payload.update({
            collection: 'accounts',
            id: merchantAccount.id,
            data: {
                balance: merchantAccount.balance + amountKobo,
            },
            overrideAccess: true,
        })

        // Create transaction entry
        const txn = await payload.create({
            collection: 'transactions',
            data: {
                reference: ref,
                type: 'transfer',
                amount: amountKobo,
                from_account: payerAccount.id,
                to_account: merchantAccount.id,
                status: 'successful',
                narration: `Merchant Checkout: ${merchant.business_name} (Ref: ${checkout.reference})`,
                channel: 'api',
                user_id: payerAccount.user_id,
                metadata: {
                    checkout_id: checkout.id,
                    reference: checkout.reference,
                    qore_processed: qoreSuccess,
                },
            },
            overrideAccess: true,
        })

        // Update checkout session status
        const updatedCheckout = await payload.update({
            collection: 'merchant-checkouts',
            id: checkout_id,
            data: {
                status: 'successful',
                transaction: txn.id,
            },
            overrideAccess: true,
        })

        // Post background webhook callback payload to webhookUrl if set
        if (merchant.webhook_url) {
            Promise.resolve().then(async () => {
                try {
                    const { dispatchWebhook } = await import('@/lib/utils/webhook-dispatcher')
                    
                    // Fetch merchant secret key
                    const keysRes = await payload.find({
                        collection: 'merchant-api-keys',
                        where: {
                            and: [
                                { merchant: { equals: merchant.id } },
                                { is_active: { equals: true } },
                                { key_type: { equals: 'live_secret' } }
                            ]
                        },
                        overrideAccess: true,
                        limit: 1
                    })
                    
                    const secretKey = keysRes.docs[0]?.key_value || 'fallback_secret_key'
                    
                    await dispatchWebhook(
                        merchant.webhook_url, 
                        secretKey, 
                        {
                            event: 'checkout.successful',
                            data: {
                                reference: checkout.reference,
                                amount: amountKobo,
                                status: 'successful',
                                email: checkout.customer_email,
                                metadata: checkout.metadata,
                                paid_at: new Date().toISOString(),
                            }
                        }
                    )
                } catch (e: any) {
                    console.error(`[Webhook Wrapper] Dispatch failed: ${e.message}`)
                }
            })
        }

        return NextResponse.json({
            success: true,
            checkout: updatedCheckout,
            reference: checkout.reference,
            redirectUrl: checkout.redirect_url,
        })
    } catch (error: any) {
        console.error('Merchant charge payment error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
