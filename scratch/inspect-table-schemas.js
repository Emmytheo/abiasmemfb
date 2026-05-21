const { Client } = require('pg');

async function inspectSchemas() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const tables = ['cooperatives', 'esusu_cycles', 'esusu_members', 'agency_terminals', 'merchant_profiles', 'smart_cards'];
        
        for (const table of tables) {
            const cols = await client.query(`
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            console.log(`\n=== Table: ${table} ===`);
            cols.rows.forEach(c => {
                console.log(`- ${c.column_name} (${c.data_type}) | Nullable: ${c.is_nullable}`);
            });
        }

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

inspectSchemas();
