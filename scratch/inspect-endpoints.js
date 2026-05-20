const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        const resProviders = await client.query(`SELECT id, slug, name FROM service_providers`);
        console.log("\nProviders:");
        console.log(resProviders.rows);

        const resEndpoints = await client.query(`SELECT COUNT(*) FROM endpoints`);
        console.log("\nEndpoints count:", resEndpoints.rows[0].count);

        const resWorkflows = await client.query(`SELECT id, name FROM workflows`);
        console.log("\nWorkflows:");
        console.log(resWorkflows.rows);

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

run();
