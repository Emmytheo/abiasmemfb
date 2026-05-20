const { Client } = require('pg');

async function inspectAccounts() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const accRes = await client.query(`SELECT id, account_number, customer_id, user_id FROM accounts`);
        console.log("Accounts in database:", JSON.stringify(accRes.rows, null, 2));
    } catch (err) {
        console.error("Query failed:", err);
    } finally {
        await client.end();
    }
}

inspectAccounts();
