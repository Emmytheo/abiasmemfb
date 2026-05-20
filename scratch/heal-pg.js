const { Client } = require('pg');

async function healDbDirectly() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL successfully.");

        // 1. Fetch Application 8
        const appRes = await client.query(`SELECT id, user_id, product_type_id, metadata FROM product_applications WHERE id = 8`);
        if (appRes.rows.length === 0) {
            console.error("Application 8 not found");
            process.exit(1);
        }
        const app = appRes.rows[0];
        const userId = app.user_id;

        // 2. Fetch Customer
        const custRes = await client.query(`SELECT id FROM customers WHERE supabase_id = $1`, [userId]);
        if (custRes.rows.length === 0) {
            console.error("Customer not found for user ID:", userId);
            process.exit(1);
        }
        const customer = custRes.rows[0];

        // 3. Update Customer with Qore ID
        await client.query(`
            UPDATE customers 
            SET qore_customer_id = '088018', 
                kyc_status = 'active', 
                onboarding_status = 'completed',
                updated_at = NOW()
            WHERE id = $1
        `, [customer.id]);
        console.log("Updated Customer Qore ID to 088018");

        // 4. Create Account record
        const checkAcc = await client.query(`SELECT id FROM accounts WHERE account_number = '1100880188'`);
        let accountId;
        
        if (checkAcc.rows.length === 0) {
            const createAcc = await client.query(`
                INSERT INTO accounts (
                    user_id, account_number, account_type, balance, status, 
                    customer_id, source, is_primary, is_archived, product_type_id, application_id,
                    created_at, updated_at
                ) VALUES (
                    $1, '1100880188', 'Savings', 0, 'active', 
                    $2, 'qore', true, false, $3, $4,
                    NOW(), NOW()
                ) RETURNING id
            `, [userId, customer.id, app.product_type_id, app.id]);
            accountId = createAcc.rows[0].id;
            console.log("Created Account record with ID:", accountId);
        } else {
            accountId = checkAcc.rows[0].id;
            console.log("Account already exists with ID:", accountId);
        }

        // 5. Update Application
        const metadata = app.metadata || {};
        metadata.provisioned_account_id = String(accountId);
        delete metadata.provisioning_error; // Clear error

        await client.query(`
            UPDATE product_applications 
            SET workflow_stage = 'Provisioned', 
                metadata = $1,
                status = 'approved',
                updated_at = NOW()
            WHERE id = 8
        `, [JSON.stringify(metadata)]);
        console.log("Application marked as Provisioned!");

        console.log("DB Healing complete.");
    } catch (err) {
        console.error("Healing failed:", err);
    } finally {
        await client.end();
    }
}

healDbDirectly();
