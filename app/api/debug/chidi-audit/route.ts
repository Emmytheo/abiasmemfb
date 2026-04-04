import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const payload = await getPayload({ config });
        const email = 'chidi.mgbara@gmail.com';

        const accounts = await payload.find({
            collection: 'accounts',
            limit: 20,
            overrideAccess: true,
        });

        const loans = await payload.find({
            collection: 'loans',
            limit: 20,
            overrideAccess: true,
        });

        const customers = await payload.find({
            collection: 'customers',
            limit: 20,
            overrideAccess: true,
        });

        return NextResponse.json({
            accounts: accounts.docs.map(d => ({ id: d.id, accNo: d.account_number, userId: d.user_id })),
            loans: loans.docs.map(d => ({ id: d.id, principal: d.principal, userId: d.user_id })),
            customers: customers.docs.map(d => ({ id: d.id, email: d.email, qoreId: d.qore_customer_id }))
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
