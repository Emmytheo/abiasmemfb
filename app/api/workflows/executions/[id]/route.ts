import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    // Allow any authenticated BankSuite user (client viewing their own receipt OR admin)
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    try {
        const payload = await getPayload({ config })
        const execution = await payload.findByID({
            collection: 'workflow-executions',
            id: !isNaN(Number(id)) ? Number(id) : id,
            depth: 0,
        }).catch(() => null)

        if (!execution) {
            return NextResponse.json({ success: false, error: 'Execution not found' }, { status: 404 })
        }

        const formatted = {
            id: String(execution.id),
            status: execution.status,
            phases: (execution as any).phases || [],
            outputs: (execution as any).outputs || {},
            createdAt: execution.createdAt,
            startedAt: (execution as any).startedAt,
            completedAt: (execution as any).completedAt,
        }

        return NextResponse.json({
            success: true,
            status: formatted.status,
            phases: formatted.phases,
            execution: formatted,
        })
    } catch (error: any) {
        console.error(`[API] Fetch execution failed for ${id}:`, error)
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to fetch execution' },
            { status: 500 }
        )
    }
}
