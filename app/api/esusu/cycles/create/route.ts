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
        const { cooperative_id, name, contribution_amount, frequency, total_slots, platform_fee_percent = 1 } = body

        if (!cooperative_id || !name || !contribution_amount || !frequency || !total_slots) {
            return NextResponse.json({ error: 'Missing required cycle configuration fields' }, { status: 400 })
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

        // Verify cooperative exists and belongs to this user/customer
        const coop = await payload.findByID({
            collection: 'cooperatives',
            id: cooperative_id,
            overrideAccess: true,
        })

        if (!coop) {
            return NextResponse.json({ error: 'Cooperative not found' }, { status: 404 })
        }

        const coopLeaderId = typeof coop.union_leader === 'object' ? coop.union_leader.id : coop.union_leader
        if (coopLeaderId !== customer.id) {
            return NextResponse.json({ error: 'Unauthorized: Only cooperative union leaders can launch cycles' }, { status: 403 })
        }

        // Create a new mock ledger holding vault account for this cycle
        const vaultNumber = `ESU_${Math.floor(1000000000 + Math.random() * 9000000000)}`
        const vaultAccount = await payload.create({
            collection: 'accounts',
            data: {
                user_id: user.id,
                customer: customer.id,
                account_number: vaultNumber,
                account_type: 'Savings',
                balance: 0,
                status: 'active',
                source: 'local',
                is_primary: false,
                notes: `Holding vault account for rotational cycle: ${name}`,
            },
            overrideAccess: true,
        })

        // Create the Esusu Rotational Cycle
        const cycle = await payload.create({
            collection: 'esusu-cycles',
            data: {
                cooperative: cooperative_id,
                name,
                contribution_amount: Number(contribution_amount),
                frequency,
                cycle_start_date: new Date().toISOString(),
                platform_fee_percent: Number(platform_fee_percent),
                status: 'active',
                total_slots: Number(total_slots),
                current_payout_index: 0,
                holding_vault_account: vaultAccount.id,
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, cycle, vaultAccount })
    } catch (error: any) {
        console.error('Create esusu cycle error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
