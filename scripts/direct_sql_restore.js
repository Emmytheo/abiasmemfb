const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URI,
        ssl: { rejectUnauthorized: false }
    });

    console.log('--- RAW SQL IDENTITY RESTORATION: chidi.mgbara ---');

    try {
        await client.connect();
        console.log('Connected to Database.');

        // 1. Find Supabase User
        console.log('Finding Supabase UUID...');
        const userRes = await client.query(
            "SELECT id, email FROM auth.users WHERE email ILIKE '%chidi.mgbara%' LIMIT 1"
        );

        if (userRes.rows.length === 0) {
            console.error('CRITICAL: Supabase user chidi.mgbara not found.');
            return;
        }

        const supabaseUser = userRes.rows[0];
        console.log(`Found Supabase User: ${supabaseUser.id} (${supabaseUser.email})`);

        // 2. Find Payload Customer
        console.log('Finding Payload Customer record...');
        const custRes = await client.query(
            "SELECT id, email, is_archived FROM customers WHERE email ILIKE '%chidi.mgbara%' LIMIT 5"
        );

        if (custRes.rows.length === 0) {
            console.error('CRITICAL: Payload customer record for chidi.mgbara not found.');
            return;
        }

        // Find the archived one
        const archivedCust = custRes.rows.find(r => r.is_archived);
        if (!archivedCust) {
            console.error('CRITICAL: No ARCHIVED record found for chidi.mgbara.');
            console.log('Found these instead:', custRes.rows);
            return;
        }

        console.log(`Found Archived Record: ID ${archivedCust.id} (Email: ${archivedCust.email})`);

        // 3. EXECUTE UPDATE
        console.log('Executing restoration UPDATE...');
        const query = `
            UPDATE customers 
            SET 
                is_archived = false, 
                email = $1, 
                supabase_id = $2, 
                is_associated = true,
                kyc_status = 'active',
                updated_at = NOW()
            WHERE id = $3
            RETURNING id, email, is_archived, supabase_id;
        `;

        const updateRes = await client.query(query, [supabaseUser.email, supabaseUser.id, archivedCust.id]);
        
        console.log('SUCCESS: Identity restored and associated.');
        console.log('Updated Record:', updateRes.rows[0]);

    } catch (err) {
        console.error('Restoration Failed:', err);
    } finally {
        await client.end();
        process.exit(0);
    }
}

run();
