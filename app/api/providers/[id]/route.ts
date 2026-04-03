import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })
        const body = await req.json()

        const doc = await payload.update({
            collection: 'service-providers',
            id,
            data: body,
        })

        return NextResponse.json({ doc })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const payload = await getPayload({ config })

        const doc = await payload.findByID({
            collection: 'service-providers',
            id,
            depth: 1,
        })

        return NextResponse.json({ doc })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 404 })
    }
}
