import { getPayload } from 'payload';
import config from '@payload-config';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const payload = await getPayload({ config });
        const targetCustomerId = 5; // Canonical Customer 5

        console.log(`[Repair] Starting manual relationship repair to Customer ${targetCustomerId}...`);

        // 1. Update Accounts 1, 2, 3, 5
        const accountIds = [1, 2, 3, 5];
        const accountUpdates = [];
        for (const id of accountIds) {
            try {
                await payload.update({
                    collection: 'accounts' as any,
                    id,
                    data: {
                        customer: targetCustomerId
                    },
                    overrideAccess: true
                });
                accountUpdates.push({ id, success: true });
            } catch (err: any) {
                console.error(`[Repair] Failed to update account ${id}:`, err.message);
                accountUpdates.push({ id, success: false, error: err.message });
            }
        }

        // 2. Update Loans 1, 2
        const loanIds = [1, 2];
        const loanUpdates = [];
        for (const id of loanIds) {
            try {
                await payload.update({
                    collection: 'loans' as any,
                    id,
                    data: {
                        customer: targetCustomerId
                    },
                    overrideAccess: true
                });
                loanUpdates.push({ id, success: true });
            } catch (err: any) {
                console.error(`[Repair] Failed to update loan ${id}:`, err.message);
                loanUpdates.push({ id, success: false, error: err.message });
            }
        }

        return NextResponse.json({
            success: true,
            message: "Database repair finished successfully.",
            accountsRepaired: accountUpdates,
            loansRepaired: loanUpdates
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
