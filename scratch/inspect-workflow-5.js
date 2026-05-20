const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`SELECT id, name, definition FROM workflows WHERE id = 5`);
        if (res.rows.length > 0) {
            const wf = res.rows[0];
            console.log(JSON.stringify(wf.definition, null, 2));
        }

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

run();
