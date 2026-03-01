import { NextResponse } from 'next/server'
import { rescheduleAll } from '@/lib/workflow/scheduler/cronRunner'

// Secure this endpoint in production using a secret token header or internal networking
export async function POST(req: Request) {
    const authHeader = req.headers.get('workflow-admin')
    if (process.env.NODE_ENV === 'production' && authHeader !== process.env.PAYLOAD_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        await rescheduleAll()
        return NextResponse.json({ message: 'Scheduler initialized' })
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
