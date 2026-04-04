const { Client } = require('pg');
const dotenv = require('dotenv');
const fs = require('fs');

async function checkData() {
    // Attempt to read from .env.local
    const env = dotenv.parse(fs.readFileSync('.env.local'));
    const client = new Client({
        connectionString: env.DATABASE_URI,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        const accounts = await client.query("SELECT id, account_number, user_id FROM accounts WHERE user_id = 'chidi.mgbara@gmail.com'");
        const loans = await client.query("SELECT id, principal, user_id FROM loans WHERE user_id = 'chidi.mgbara@gmail.com'");
        const customers = await client.query("SELECT id, email FROM customers WHERE email = 'chidi.mgbara@gmail.com'");

        console.log(JSON.stringify({
            accounts: accounts.rows,
            loans: loans.rows,
            customers: customers.rows
        }, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkData();
