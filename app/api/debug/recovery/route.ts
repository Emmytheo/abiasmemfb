import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const payload = await getPayload({ config });
        const email = 'chidi.mgbara@gmail.com';
        const uuid = '33404e3d-5b4d-4715-989c-3d3104ce6128';

        // 1. Ensure Customer exists
        let customer: any;
        const existing = await payload.find({
            collection: 'customers',
            where: { email: { equals: email } },
            overrideAccess: true,
        });

        if (existing.docs.length > 0) {
            customer = existing.docs[0];
            console.log('Customer already exists:', customer.id);
        } else {
            customer = await payload.create({
                collection: 'customers',
                data: {
                    email,
                    firstName: 'Chidi',
                    lastName: 'Mgbara',
                    supabase_id: uuid,
                    is_associated: true,
                    is_test_account: true,
                    kyc_status: 'active'
                },
                overrideAccess: true,
            });
            console.log('Created new customer:', customer.id);
        }

        // 2. Link Accounts
        const accUpdate = await payload.update({
            collection: 'accounts',
            where: { user_id: { equals: uuid } },
            data: { customer: customer.id },
            overrideAccess: true,
        });

        // 3. Link Loans
        const loanUpdate = await payload.update({
            collection: 'loans',
            where: { user_id: { equals: uuid } },
            data: { 
                // We need to confirm if Loans has a customer field or links via Account
                // Loans in our system link to accounts, which link to customers.
                // However, some might have a direct user_id.
            },
            overrideAccess: true,
        });

        return NextResponse.json({
            success: true,
            customerId: customer.id,
            accountsLinked: accUpdate.docs.length,
            loansProcessed: loanUpdate?.docs?.length || 0
        });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
