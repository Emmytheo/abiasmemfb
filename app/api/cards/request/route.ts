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

        // Call Qore Channels requestCard
        let qoreSuccess = false
        try {
            if (account.source === 'qore') {
                await requestCard(user.id, account.account_number, card_type)
                qoreSuccess = true
            }
        } catch (err) {
            console.warn('[Qore Smart Card Sync] Qore card request failed. Proceeding locally.', err)
        }

        // Generate mock card numbers
        const prefixes = { visa: '4111', mastercard: '5123', verve: '5061' }
        const pref = prefixes[card_network as keyof typeof prefixes] || '5061'
        const randomDigits = Math.floor(10000000 + Math.random() * 90000000)
        const checkDigit = Math.floor(Math.random() * 10)
        const fullCardNum = `${pref}${randomDigits}${checkDigit}`
        const masked = `${pref}********${fullCardNum.slice(-4)}`

        const token = `CRD_TOK_${Math.random().toString(36).substring(2, 15).toUpperCase()}`

        // Expire in 3 years
        const expDate = new Date()
        expDate.setFullYear(expDate.getFullYear() + 3)

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
