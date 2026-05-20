const { Client } = require('pg');

async function inspectApp() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const appRes = await client.query(`SELECT id, user_id, status, workflow_stage, metadata FROM product_applications WHERE id = 8`);
        console.log("App 8 database values:", JSON.stringify(appRes.rows[0], null, 2));
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

inspectApp();
