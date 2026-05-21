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
        const { name, description } = body

        if (!name) {
            return NextResponse.json({ error: 'Cooperative name is required' }, { status: 400 })
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

        // Create cooperative group in Payload CMS
        const cooperative = await payload.create({
            collection: 'cooperatives',
            data: {
                name,
                description,
                union_leader: customer.id,
                status: 'active',
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, cooperative })
    } catch (error: any) {
        console.error('Create cooperative error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
