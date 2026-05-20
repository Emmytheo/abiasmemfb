const { Client } = require('pg');

async function run() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();

        console.log("\n=== SERVICES ===");
        const services = await client.query(`SELECT id, name, service_intent, validation_workflow_id, execution_workflow_id FROM services`);
        console.log(JSON.stringify(services.rows, null, 2));
        
        console.log("\n=== WORKFLOWS ===");
        const workflows = await client.query(`SELECT id, name, status, trigger FROM workflows`);
        console.log(JSON.stringify(workflows.rows, null, 2));

        console.log("\n=== ENDPOINTS ===");
        const endpoints = await client.query(`SELECT id, name FROM endpoints`);
        console.log(JSON.stringify(endpoints.rows, null, 2));

    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

run();
