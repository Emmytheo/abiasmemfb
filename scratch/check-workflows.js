const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const res = await client.query(`SELECT * FROM workflows LIMIT 1`);
        console.log("Workflow columns:", Object.keys(res.rows[0]));

        const resAll = await client.query(`SELECT id, name, status FROM workflows`);
        console.log(JSON.stringify(resAll.rows, null, 2));

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

run();
