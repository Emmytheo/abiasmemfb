import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const authHeader = req.headers.get('x-admin-secret');
    if (authHeader !== process.env.ADMIN_SECRET && process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('--- API IDENTITY RESTORATION: chidi.mgbara ---');
    
    try {
        const payload = await getPayload({ config });
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // 1. Find Supabase User
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;
        
        const targetUser = users.find(u => u.email?.includes('chidi.mgbara'));
        if (!targetUser) {
            return NextResponse.json({ error: 'Supabase user chidi.mgbara not found' }, { status: 404 });
        }

        // 2. Find Archived Payload Customer
        const { docs: customers } = await payload.find({
            collection: 'customers',
            where: {
                email: { contains: 'chidi.mgbara' }
            },
            limit: 10
        });

        const archivedCust = customers.find(c => c.is_archived);
        if (!archivedCust) {
             return NextResponse.json({ 
                error: 'Archived customer not found', 
                foundEmails: customers.map(c => c.email) 
            }, { status: 404 });
        }

        // 3. PERFORM RESTORATION
        const restoredEmail = targetUser.email!;
        
        const updated = await payload.update({
            collection: 'customers',
            id: archivedCust.id,
            data: {
                is_archived: false,
                email: restoredEmail,
                supabase_id: targetUser.id,
                is_associated: true,
                kyc_status: 'active'
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Identity restored and associated',
            updated: {
                id: updated.id,
                email: updated.email,
                supabase_id: updated.supabase_id,
                is_archived: updated.is_archived
            }
        });

    } catch (e: any) {
        console.error('API Restoration Failed:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
