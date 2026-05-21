const { Client } = require('pg');

async function queryCustomers() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query(`SELECT id, first_name, last_name, email, supabase_id FROM customers`);
        console.log("Customers:", JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

queryCustomers();
