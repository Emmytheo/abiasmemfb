import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function GET(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
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

        // Get commissions for this agent
        const commissions = await payload.find({
            collection: 'agency-commissions',
            where: { user_id: { equals: user.id } },
            limit: 100,
            overrideAccess: true,
            sort: '-createdAt',
        })

        let totalCommission = 0
        let agentShare = 0
        let bankShare = 0
        let settledAmount = 0
        let pendingAmount = 0

        commissions.docs.forEach((c) => {
            totalCommission += c.total_commission || 0
            agentShare += c.agent_share || 0
            bankShare += c.bank_share || 0
            if (c.status === 'settled') {
                settledAmount += c.agent_share || 0
            } else {
                pendingAmount += c.agent_share || 0
            }
        })

        return NextResponse.json({
            success: true,
            summary: {
                totalCommission,
                agentShare,
                bankShare,
                settledAmount,
                pendingAmount,
                transactionCount: commissions.docs.length,
            },
            commissions: commissions.docs,
        })
    } catch (error: any) {
        console.error('Agency commission statement error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
