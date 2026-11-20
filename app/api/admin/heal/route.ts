import { requireMaintenanceAccess } from '@/lib/auth/server-guard';
import { NextResponse } from 'next/server';
import { getPayloadClient } from '@/lib/payload';

export async function GET() {
    const __authGuard = await requireMaintenanceAccess(new Request('http://internal'));
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const payload = await getPayloadClient();

        // 1. Fetch Application 8
        const app = await payload.findByID({
            collection: 'product-applications',
            id: '8'
        });

        const userId = app.user_id;
        
        // 2. Find Customer
        const { docs: customers } = await payload.find({
            collection: 'customers' as any,
            where: { supabase_id: { equals: userId } },
            limit: 1
        });
        
        if (customers.length === 0) {
            return NextResponse.json({ error: "Customer not found" });
        }
        const customer = customers[0];

        // 3. Update Customer with Qore ID
        await payload.update({
            collection: 'customers' as any,
            id: customer.id,
            data: {
                qore_customer_id: '088018',
                kyc_status: 'active',
                onboarding_status: 'completed'
            }
        });

        // 4. Check if account already exists to prevent duplicate key
        const { docs: existingAccounts } = await payload.find({
            collection: 'accounts' as any,
            where: { account_number: { equals: '1100880188' } }
        });
        
        let accountId;
        
        if (existingAccounts.length === 0) {
            const account = await payload.create({
                collection: 'accounts' as any,
                data: {
                    user_id: userId,
                    account_number: '1100880188',
                    account_type: 'Savings',
                    balance: 0,
                    status: 'active',
                    customer: customer.id,
                    source: 'qore',
                    is_primary: true,
                    is_archived: false,
                    product_type: app.product_type_id,
                    application: app.id,
                } as any
            });
            accountId = account.id;
        } else {
            accountId = existingAccounts[0].id;
        }

        // 5. Update Application
        await payload.update({
            collection: 'product-applications',
            id: app.id,
            data: {
                workflow_stage: 'Provisioned',
                metadata: {
                    ...(app.metadata || {}),
                    provisioned_account_id: String(accountId),
                    provisioning_error: null // clear error
                }
            }
        });
        
        return NextResponse.json({ success: true, message: "Healing complete", accountId });
    } catch (err: any) {
        return NextResponse.json({ success: false, error: err.message });
    }
}
