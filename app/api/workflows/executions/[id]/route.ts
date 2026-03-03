import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    try {
        const payload = await getPayload({ config })
        const execution = await payload.findByID({
            collection: 'workflow-executions',
            id,
            depth: 0,
        })

        if (!execution) {
            return NextResponse.json({ success: false, error: 'Execution not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            status: execution.status,
            phases: execution.phases || [],
        })
    } catch (error: any) {
        console.error(`[API] Fetch execution failed for ${id}:`, error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch execution' },
            { status: 500 }
        )
    }
}
