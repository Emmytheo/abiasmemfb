import { requireMaintenanceAccess } from '@/lib/auth/server-guard';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const __authGuard = await requireMaintenanceAccess(req);
    if (__authGuard instanceof NextResponse) return __authGuard;
    return NextResponse.json({ error: 'Unauthorized. Healing endpoint disabled.' }, { status: 401 });
}
