import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { updateCardLimits } from '@/lib/api/adapters/qore/actions'

export async function PATCH(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { card_id, limit_pos, limit_web, limit_atm } = body

        if (!card_id || limit_pos === undefined || limit_web === undefined || limit_atm === undefined) {
            return NextResponse.json({ error: 'card_id and all spending limits (limit_pos, limit_web, limit_atm) are required' }, { status: 400 })
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

        // Trigger limit updates on core-banking
        let qoreSuccess = false
        try {
            // Update channel limits in Qore
            await updateCardLimits(card.card_token, 'POS', Number(limit_pos))
            await updateCardLimits(card.card_token, 'WEB', Number(limit_web))
            await updateCardLimits(card.card_token, 'ATM', Number(limit_atm))
            qoreSuccess = true
        } catch (err) {
            console.warn('[Qore Card Sync] Qore card limits update failed. Proceeding locally.', err)
        }

        // Update local database
        const updated = await payload.update({
            collection: 'smart-cards',
            id: card_id,
            data: {
                limit_pos: Number(limit_pos),
                limit_web: Number(limit_web),
                limit_atm: Number(limit_atm),
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, card: updated, qore_processed: qoreSuccess })
    } catch (error: any) {
        console.error('Smart card limits error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
