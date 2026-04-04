import { NextResponse } from 'next/server';
import { CustomerBulkSyncExecutor } from '@/lib/workflow/executor/CustomerBulkSyncExecutor';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.user_metadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json().catch(() => ({}));
        const targetAccounts = body.accounts || undefined;

        const results = await CustomerBulkSyncExecutor(targetAccounts);

        return NextResponse.json({
            success: true,
            message: 'Customer sync completed',
            results
        });
    } catch (error: any) {
        console.error('[CUSTOMER_SYNC_API_ERROR]', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
