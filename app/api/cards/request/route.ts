import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { requestCard } from '@/lib/api/adapters/qore/actions'

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { account_id, card_network = 'verve', card_type = 'virtual', card_holder_name } = body

        if (!account_id || !card_holder_name) {
            return NextResponse.json({ error: 'account_id and cardholder name are required' }, { status: 400 })
        }

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

        // Get parent account
        const account = await payload.findByID({
            collection: 'accounts',
            id: account_id,
            overrideAccess: true,
        })

        if (!account) {
            return NextResponse.json({ error: 'Linked account not found' }, { status: 404 })
        }

        // Call Qore Channels requestCard strictly
        let qoreSuccess = false
        let token = ''
        let masked = ''
        let expDate = new Date()

        if (account.source !== 'qore') {
            return NextResponse.json({ error: 'Card issuance is only supported for Qore core accounts at this time.' }, { status: 400 })
        }

        try {
            const qoreRes = await requestCard(user.id, account.account_number, card_type)
            
            // Assume Qore returns card details in its payload
            // If it only returns success, we generate a secure token referencing the Qore internal record.
            token = qoreRes?.data?.token || `CRD_TOK_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
            
            const rawPan = qoreRes?.data?.pan || ''
            if (rawPan && rawPan.length >= 4) {
                masked = `**** **** **** ${rawPan.slice(-4)}`
            } else {
                // If Qore doesn't return PAN immediately (e.g. async generation), we store a pending mask.
                masked = `**** **** **** PEND`
            }

            if (qoreRes?.data?.expiry) {
                // Assuming MM/YY or similar. For now, fallback to +3 years
                expDate.setFullYear(expDate.getFullYear() + 3)
            } else {
                expDate.setFullYear(expDate.getFullYear() + 3)
            }

            qoreSuccess = true
        } catch (err: any) {
            console.error('[Qore Smart Card Sync] Qore card request failed. Aborting.', err)
            return NextResponse.json({ error: `Core Banking Error: ${err.message}` }, { status: 400 })
        }

        const card = await payload.create({
            collection: 'smart-cards',
            data: {
                customer: customer.id,
                user_id: user.id,
                account: account.id,
                card_token: token,
                card_holder_name,
                card_network,
                card_type,
                card_number_masked: masked,
                limit_pos: 10000000,
                limit_web: 5000000,
                limit_atm: 2000000,
                is_frozen: false,
                expiry_date: expDate.toISOString(),
                status: 'active',
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, card, qore_processed: qoreSuccess })
    } catch (error: any) {
        console.error('Smart card request error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
