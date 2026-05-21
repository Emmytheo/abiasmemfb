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
        const { pos_model = 'Pax S900' } = body

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

        // Generate a mock unique hardware serial number for the POS
        const serialNumber = `POS_${Math.floor(1000000000 + Math.random() * 9000000000)}`

        const terminal = await payload.create({
            collection: 'agency-terminals',
            data: {
                agent_customer: customer.id,
                user_id: user.id,
                serial_number: serialNumber,
                pos_model,
                status: 'pending',
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, terminal })
    } catch (error: any) {
        console.error('POS request error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
