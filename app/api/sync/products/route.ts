import { NextResponse } from 'next/server';
import { RegistryBulkSyncExecutor } from '@/lib/workflow/executor/RegistryBulkSyncExecutor';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || user.user_metadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await RegistryBulkSyncExecutor();

        return NextResponse.json({
            success: true,
            message: 'Product sync completed',
            results
        });
    } catch (error: any) {
        console.error('[PRODUCT_SYNC_API_ERROR]', error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
