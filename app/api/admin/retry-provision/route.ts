import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';

/**
 * POST /api/admin/retry-provision
 * Body: { applicationId: string }
 *
 * Re-triggers ProvisionAccountExecutor for a stuck application.
 * Use this when an application has status=approved but workflow_stage="Provisioning Failed"
 * or "Submitted" (meaning provisioning never ran or silently failed).
 */
export async function POST(req: NextRequest) {
    try {
        const { applicationId } = await req.json();
        if (!applicationId) {
            return NextResponse.json({ error: 'applicationId is required' }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // Load the application
        const application = await payload.findByID({
            collection: 'product-applications',
            id: applicationId,
            depth: 2,
            overrideAccess: true,
        });

        if (!application) {
            return NextResponse.json({ error: `Application ${applicationId} not found` }, { status: 404 });
        }

        if (application.status !== 'approved') {
            return NextResponse.json({ 
                error: `Application must be in "approved" status to retry provisioning. Current: ${application.status}` 
            }, { status: 400 });
        }

        const userId = (application as any).user_id;
        if (!userId) {
            return NextResponse.json({ error: 'Application has no user_id. Cannot provision.' }, { status: 400 });
        }

        // Reset workflow stage so we can track progress
        await payload.update({
            collection: 'product-applications',
            id: applicationId,
            data: { workflow_stage: 'Retrying Provisioning' } as any,
            overrideAccess: true,
        });

        const { ProvisionAccountExecutor } = await import('@/lib/workflow/executor/ProvisionAccountExecutor');

        const logs: string[] = [];
        const env: any = {
            payload,
            executionId: `RETRY-PROVISION-${Date.now()}`,
            inputs: {
                user_id: userId,
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
                message: 'Provisioning completed successfully.', 
                logs 
            });
        } else {
            return NextResponse.json({ 
                success: false, 
                message: 'Provisioning executor returned false. Check logs for details.',
                logs
            }, { status: 500 });
        }

    } catch (e: any) {
        console.error('[retry-provision] Unexpected error:', e);
        return NextResponse.json({ 
            error: e.message || 'Unexpected server error' 
        }, { status: 500 });
    }
}
