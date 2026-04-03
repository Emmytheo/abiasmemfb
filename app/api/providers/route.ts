import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const body = await req.json()

        const doc = await payload.create({
            collection: 'service-providers',
            data: body,
        })

        return NextResponse.json({ doc }, { status: 201 })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
