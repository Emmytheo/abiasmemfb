import { requireAdminUser } from '@/lib/auth/server-guard';
import { NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export async function GET() {
    const __authGuard = await requireAdminUser();
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const payload = await getPayload({ config });
        const result = await payload.find({
            collection: 'product-types' as any,
            depth: 0,
            limit: 200,
            overrideAccess: true,
            sort: 'name',
            where: { status: { equals: 'active' } },
        });
        return NextResponse.json(result);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
