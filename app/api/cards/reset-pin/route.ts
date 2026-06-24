import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { changeCardPin } from '@/lib/api/adapters/qore/actions'

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { card_id, new_pin } = body

        if (!card_id || !new_pin || String(new_pin).length !== 4) {
            return NextResponse.json({ error: 'card_id and a valid 4-digit PIN are required' }, { status: 400 })
        }

        const payload = await getPayload({ config: configPromise })

        // Get smart card profile
        const card = await payload.findByID({
            collection: 'smart-cards',
            id: card_id,
            overrideAccess: true,
        })

        if (!card) {
            return NextResponse.json({ error: 'Smart card not found' }, { status: 404 })
        }

        if (card.user_id !== user.id) {
            return NextResponse.json({ error: 'Unauthorized: Card is not owned by this account' }, { status: 403 })
        }

        // Enforce strict core banking sync
        try {
            await changeCardPin(card.card_token, new_pin)
        } catch (err: any) {
            console.error('[Qore Card Sync] Qore change PIN failed.', err)
            return NextResponse.json({ error: `Core Banking Error: ${err.message}` }, { status: 400 })
        }

        // Simulating hash of PIN for local storage security
        const simulatedPinHash = `HASHED_${new_pin}`

        // Update local database only if core banking succeeds
        const updated = await payload.update({
            collection: 'smart-cards',
            id: card_id,
            data: {
                pin_hash: simulatedPinHash,
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, message: 'Card PIN updated successfully on core ledger.' })
    } catch (error: any) {
        console.error('Smart card PIN reset error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
