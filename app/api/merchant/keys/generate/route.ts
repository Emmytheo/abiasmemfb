import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import crypto from 'crypto'

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { business_name = 'My SME Retail Hub' } = body

        const payload = await getPayload({ config: configPromise })

        // Find customer associated with user
        const customerResult = await payload.find({
            collection: 'customers',
            where: { supabase_id: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        })

        const customer = customerResult.docs[0]
        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
        }

        // Check if merchant profile already exists, else create one
        let merchantResult = await payload.find({
            collection: 'merchant-profiles',
            where: { user_id: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        })

        let merchant = merchantResult.docs[0]

        if (!merchant) {
            // Find an account to route settlements
            const accounts = await payload.find({
                collection: 'accounts',
                where: { user_id: { equals: user.id } },
                overrideAccess: true,
                limit: 1,
            })

            if (accounts.docs.length === 0) {
                return NextResponse.json({ error: 'No settlement bank accounts available to initialize Merchant profile' }, { status: 400 })
            }

            merchant = await payload.create({
                collection: 'merchant-profiles',
                data: {
                    customer: customer.id,
                    user_id: user.id,
                    business_name,
                    settlement_account: accounts.docs[0].id,
                    webhook_url: 'https://example.com/payment-webhook',
                    is_verified: true,
                },
                overrideAccess: true,
            })
        }

        // Inactivate existing keys for this merchant
        const existingKeys = await payload.find({
            collection: 'merchant-api-keys',
            where: { merchant: { equals: merchant.id } },
            limit: 100,
            overrideAccess: true,
        })

        for (const k of existingKeys.docs) {
            await payload.update({
                collection: 'merchant-api-keys',
                id: k.id,
                data: { is_active: false },
                overrideAccess: true,
            })
        }

        // Generate cryptographically secure API keys
        const rawPublicKey = `pk_live_${crypto.randomBytes(24).toString('hex')}`
        const rawSecretKey = `sk_live_${crypto.randomBytes(24).toString('hex')}`

        const pubHash = crypto.createHash('sha256').update(rawPublicKey).digest('hex')
        const secHash = crypto.createHash('sha256').update(rawSecretKey).digest('hex')

        // Register new keys in database
        await payload.create({
            collection: 'merchant-api-keys',
            data: {
                merchant: merchant.id,
                key_prefix: rawPublicKey.slice(0, 12),
                key_hash: pubHash,
                key_type: 'live_public',
                is_active: true,
            },
            overrideAccess: true,
        })

        await payload.create({
            collection: 'merchant-api-keys',
            data: {
                merchant: merchant.id,
                key_prefix: rawSecretKey.slice(0, 12),
                key_hash: secHash,
                key_type: 'live_secret',
                is_active: true,
            },
            overrideAccess: true,
        })

        return NextResponse.json({
            success: true,
            merchant,
            keys: {
                publicKey: rawPublicKey,
                secretKey: rawSecretKey,
            },
        })
    } catch (error: any) {
        console.error('Merchant generate key error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
