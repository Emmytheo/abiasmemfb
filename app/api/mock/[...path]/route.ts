import { NextRequest, NextResponse } from "next/server"
import { requireMaintenanceAccess } from "@/lib/auth/server-guard"

async function handleMock(req: NextRequest) {
    const guard = await requireMaintenanceAccess(req)
    if (guard instanceof NextResponse) return guard

    return NextResponse.json({
        success: true,
        mock: true,
        method: req.method,
        path: req.nextUrl.pathname,
        timestamp: new Date().toISOString(),
    })
}

export const GET = handleMock
export const POST = handleMock
export const PUT = handleMock
export const PATCH = handleMock
export const DELETE = handleMock
