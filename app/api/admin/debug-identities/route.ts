import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    return NextResponse.json({ error: 'Unauthorized. Diagnostic endpoint disabled.' }, { status: 401 });
}
