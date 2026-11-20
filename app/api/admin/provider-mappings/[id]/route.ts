import { requireAdminUser } from '@/lib/auth/server-guard';
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const __authGuard = await requireAdminUser(req);
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const { id } = await params;
        const body = await req.json();
        const { externalCode, productTypeId } = body;

        const payload = await getPayload({ config });

        const updateData: Record<string, any> = {};
        if (externalCode !== undefined) updateData.externalCode = externalCode;
        if (productTypeId !== undefined) {
            updateData.relatedEntity = {
                relationTo: 'product-types',
                value: productTypeId,
            };
        }

        const updated = await payload.update({
            collection: 'provider-mappings' as any,
            id,
            data: updateData,
            overrideAccess: true,
        });

        return NextResponse.json(updated);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const __authGuard = await requireAdminUser(req);
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const { id } = await params;
        const payload = await getPayload({ config });

        await payload.delete({
            collection: 'provider-mappings' as any,
            id,
            overrideAccess: true,
        });

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
