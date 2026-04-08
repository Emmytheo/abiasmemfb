const { getPayload } = require('payload');
const config = require('./payload.config').default;
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function restoreChidi() {
    console.log('--- IDENTITY RESTORATION: chidi.mgbara ---');
    
    // 1. Init Payload
    const payload = await getPayload({ config });
    
    // 2. Init Supabase Admin
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    try {
        // 3. Find Global Supabase User
        console.log('Searching Supabase for chidi.mgbara...');
        const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;
        
        const targetUser = users.find(u => u.email.includes('chidi.mgbara'));
        if (!targetUser) {
            console.error('CRITICAL: Supabase user chidi.mgbara not found.');
            return;
        }
        console.log(`Found Supabase User: ${targetUser.id} (${targetUser.email})`);

        // 4. Find Archived Payload Customer
        console.log('Searching Payload for archived record...');
        const { docs: customers } = await payload.find({
            collection: 'customers',
            where: {
                email: { contains: 'chidi.mgbara' }
            },
            limit: 10
        });

        const archivedCust = customers.find(c => c.is_archived);
        if (!archivedCust) {
            console.error('CRITICAL: Archived customer record for chidi.mgbara not found.');
            return;
        }
        console.log(`Found Archived Record: ${archivedCust.id} (Current Email: ${archivedCust.email})`);

        // 5. PERFORM RESTORATION
        console.log('Executing restoration updates...');
        const restoredEmail = targetUser.email; // The real email from Supabase Auth
        
        const updated = await payload.update({
            collection: 'customers',
            id: archivedCust.id,
            data: {
                is_archived: false,
                email: restoredEmail,
                supabase_id: targetUser.id,
                is_associated: true,
                kyc_status: 'active' // Ensuring they are active
            }
        });

        console.log('SUCCESS: Identity restored and associated.');
        console.log('Updated Record:', JSON.stringify(updated, null, 2));

    } catch (e) {
        console.error('Restoration Failed:', e);
    } finally {
        process.exit(0);
    }
}

restoreChidi();
