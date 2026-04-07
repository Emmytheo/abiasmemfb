import { NextRequest, NextResponse } from 'next/server';
import { executeCustomerMerge } from '@/lib/api/adapters/payload/actions';

/**
 * POST /api/sync/customers/merge
 * Refactored to use the decoupled executeCustomerMerge action.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            primaryCustomerId, 
            supabaseUserId, 
            profileData, 
            selectedAccountNumbers = [],
            isCustomerToCustomer = false,
            keepTargetAsPrimary = false
        } = body;

        if (!primaryCustomerId || !supabaseUserId || !profileData) {
            return NextResponse.json({ error: "Missing required merge parameters." }, { status: 400 });
        }

        const result = await executeCustomerMerge({
            primaryCustomerId,
            targetId: supabaseUserId,
            isCustomerToCustomer,
            profileData,
            selectedAccountNumbers,
            keepTargetAsPrimary
        });

        return NextResponse.json(result);

    } catch (err: any) {
        console.error("Identity Merge API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
