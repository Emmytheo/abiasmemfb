import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { cycle_id } = body

        if (!cycle_id) {
            return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 })
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
            return NextResponse.json({ error: 'Customer profile not found. Please complete banking onboarding.' }, { status: 404 })
        }

        // Get cycle and verify slots
        const cycle = await payload.findByID({
            collection: 'esusu-cycles',
            id: cycle_id,
            overrideAccess: true,
        })

        if (!cycle) {
            return NextResponse.json({ error: 'Esusu cycle not found' }, { status: 404 })
        }

        if (cycle.status !== 'active') {
            return NextResponse.json({ error: 'This esusu cycle is not currently active' }, { status: 400 })
        }

        // Check current members
        const membersResult = await payload.find({
            collection: 'esusu-members',
            where: {
                and: [
                    { cycle: { equals: cycle_id } },
                    { status: { equals: 'active' } },
                ]
            },
            overrideAccess: true,
            limit: 100,
        })

        if (membersResult.docs.length >= (cycle.total_slots || 0)) {
            return NextResponse.json({ error: 'All contribution slots in this cycle have already been filled' }, { status: 400 })
        }

        // Check if customer is already a member
        const alreadyMember = membersResult.docs.some(
            (m) => (typeof m.customer === 'object' ? m.customer.id : m.customer) === customer.id
        )
        if (alreadyMember) {
            return NextResponse.json({ error: 'You are already registered as a member in this esusu cycle' }, { status: 400 })
        }

        // Assign next available payout index
        const assignedPayoutIndex = membersResult.docs.length

        // Create the Esusu Member slot
        const member = await payload.create({
            collection: 'esusu-members',
            data: {
                cycle: cycle_id,
                customer: customer.id,
                user_id: user.id,
                payout_order_index: assignedPayoutIndex,
                status: 'active',
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, member })
    } catch (error: any) {
        console.error('Join esusu cycle error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
