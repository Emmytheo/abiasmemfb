import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * PATCH /api/admin/applications/[id]
 * Allows admins to override the product_type_id on a stuck application.
 * Body: { productTypeId: string }
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { productTypeId, status, workflow_stage } = body;

        const payload = await getPayload({ config });

        const updateData: Record<string, any> = {};
        if (productTypeId !== undefined) updateData.product_type_id = productTypeId;
        if (status !== undefined) updateData.status = status;
        if (workflow_stage !== undefined) updateData.workflow_stage = workflow_stage;

        const updated = await payload.update({
            collection: 'product-applications' as any,
            id,
            data: updateData,
            overrideAccess: true,
        });

        return NextResponse.json({ success: true, doc: updated });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
