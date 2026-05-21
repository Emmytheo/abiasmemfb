const { Client } = require('pg');

async function inspectRecords() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const coops = await client.query(`SELECT id, name FROM cooperatives`);
        console.log("Cooperatives:", coops.rows);

        const cycles = await client.query(`SELECT id, name FROM esusu_cycles`);
        console.log("Esusu Cycles:", cycles.rows);

        const terminals = await client.query(`SELECT id, serial_number FROM agency_terminals`);
        console.log("Agency Terminals:", terminals.rows);

        const profiles = await client.query(`SELECT id, business_name FROM merchant_profiles`);
        console.log("Merchant Profiles:", profiles.rows);

        const cards = await client.query(`SELECT id, card_number_masked FROM smart_cards`);
        console.log("Smart Cards:", cards.rows);

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

inspectRecords();
