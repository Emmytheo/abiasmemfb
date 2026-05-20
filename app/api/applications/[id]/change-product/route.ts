import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { createClient } from '@/lib/supabase/server';
import { ProvisionAccountExecutor } from '@/lib/workflow/executor/ProvisionAccountExecutor';

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: applicationId } = await params;
        const body = await req.json();
        const { productTypeId } = body;

        if (!productTypeId) {
            return NextResponse.json({ error: 'productTypeId is required' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await getPayload({ config });

        // Load the application
        const application = await payload.findByID({
            collection: 'product-applications',
            id: applicationId,
            depth: 1,
            overrideAccess: true,
        });

        if (!application) {
            return NextResponse.json({ error: `Application ${applicationId} not found` }, { status: 404 });
        }

        // Access check: only admins or the actual owner of the application can change product
        const isAdmin = user.user_metadata?.role === 'admin';
        const isOwner = String((application as any).user_id) === String(user.id);

        if (!isAdmin && !isOwner) {
            return NextResponse.json({ error: 'Forbidden. You do not own this application.' }, { status: 403 });
        }

        // Validate application status is approved
        if (application.status !== 'approved') {
            return NextResponse.json({ 
                error: `Application must be in "approved" status to update product type and retry provisioning.` 
            }, { status: 400 });
        }

        // Verify the new product type exists
        const newProduct = await payload.findByID({
            collection: 'product-types',
            id: productTypeId,
            overrideAccess: true,
        });

        if (!newProduct) {
            return NextResponse.json({ error: `Product type ${productTypeId} not found` }, { status: 404 });
        }

        const targetProductTypeId = typeof productTypeId === 'string' && !isNaN(Number(productTypeId))
            ? Number(productTypeId)
            : productTypeId;

        // Update the application product type and reset provisioning error
        await payload.update({
            collection: 'product-applications',
            id: applicationId,
            data: {
                product_type_id: targetProductTypeId,
                workflow_stage: 'Retrying Provisioning',
                metadata: {
                    ...(application.metadata || {}),
                    provisioning_error: null,
                    failed_at: null,
                    prev_product_name: (application.product_type_id as any)?.name || 'Unknown Product'
                }
            } as any,
            overrideAccess: true,
        });

        // Trigger provisioning retry
        const logs: string[] = [];
        const env: any = {
            payload,
            executionId: `CLIENT-CHANGE-PROVISION-${Date.now()}`,
            inputs: {
                user_id: (application as any).user_id,
                application_id: applicationId,
                approver_id: null,
            },
            outputs: {},
            getInput: (key: string) => env.inputs[key],
            setOutput: (key: string, val: any) => { env.outputs[key] = val; },
            log: {
                info:  (m: string) => { logs.push(`[INFO] ${m}`);  payload.logger.info(m); },
                error: (m: string) => { logs.push(`[ERROR] ${m}`); payload.logger.error(m); },
            },
        };

        const success = await ProvisionAccountExecutor(env);

        if (success) {
            return NextResponse.json({ 
                success: true, 
                message: `Successfully changed product to "${newProduct.name}" and provisioned account.`,
                logs 
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                message: `Changed product to "${newProduct.name}" but provisioning executor returned false. Check logs for details.`,
                logs
            }, { status: 500 });
        }

    } catch (e: any) {
        console.error('[change-product-and-retry] Unexpected error:', e);
        return NextResponse.json({ 
            error: e.message || 'Unexpected server error' 
        }, { status: 500 });
    }
}
