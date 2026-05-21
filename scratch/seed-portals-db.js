const { Client } = require('pg');

async function seedBankingFeatures() {
    const client = new Client({
        connectionString: "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log("Connected to PostgreSQL for programmatic seeding...");

        // 1. Cooperative
        let coopId;
        const coopCheck = await client.query(`SELECT id FROM cooperatives WHERE name = 'Abia Agro-Traders Association' LIMIT 1`);
        if (coopCheck.rows.length > 0) {
            coopId = coopCheck.rows[0].id;
            console.log(`Cooperative already exists. ID: ${coopId}`);
        } else {
            const coopRes = await client.query(`
                INSERT INTO cooperatives (name, description, union_leader_id, status, created_at, updated_at)
                VALUES ('Abia Agro-Traders Association', 'Empowering small-scale local farmers across Aba North.', 5, 'active', NOW(), NOW())
                RETURNING id
            `);
            coopId = coopRes.rows[0].id;
            console.log(`Created Cooperative ID: ${coopId}`);
        }

        // 2. Esusu Cycle
        let cycleId;
        const cycleCheck = await client.query(`SELECT id FROM esusu_cycles WHERE name = 'Traders Daily Rotation (A)' LIMIT 1`);
        if (cycleCheck.rows.length > 0) {
            cycleId = cycleCheck.rows[0].id;
            console.log(`Esusu Cycle already exists. ID: ${cycleId}`);
        } else {
            const cycleRes = await client.query(`
                INSERT INTO esusu_cycles (cooperative_id, name, contribution_amount, frequency, cycle_start_date, platform_fee_percent, status, total_slots, current_payout_index, holding_vault_account_id, created_at, updated_at)
                VALUES ($1, 'Traders Daily Rotation (A)', 500000, 'daily', NOW(), 2.5, 'active', 5, 2, 1, NOW(), NOW())
                RETURNING id
            `, [coopId]);
            cycleId = cycleRes.rows[0].id;
            console.log(`Created Esusu Cycle ID: ${cycleId}`);
        }

        // 3. Esusu Members
        const members = [
            { customer_id: 2, user_id: '032166@abia-mfb.internal', index: 0 },
            { customer_id: 3, user_id: 'muhammadfb90@gmail.con', index: 1 },
            { customer_id: 5, user_id: '33404e3d-5b4d-4715-989c-3d3104ce6128', index: 2 },
            { customer_id: 6, user_id: 'abiasmemfb@gmail.com', index: 3 }
        ];

        for (const mem of members) {
            const memCheck = await client.query(`
                SELECT id FROM esusu_members 
                WHERE cycle_id = $1 AND customer_id = $2
            `, [cycleId, mem.customer_id]);
            
            if (memCheck.rows.length === 0) {
                await client.query(`
                    INSERT INTO esusu_members (cycle_id, customer_id, user_id, payout_order_index, status, created_at, updated_at)
                    VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
                `, [cycleId, mem.customer_id, mem.user_id, mem.index]);
                console.log(`Added Member Slot: customer ${mem.customer_id}`);
            }
        }

        // 4. Agency Terminals
        const term1Check = await client.query(`SELECT id FROM agency_terminals WHERE serial_number = 'ABIA-POS-9001'`);
        if (term1Check.rows.length === 0) {
            await client.query(`
                INSERT INTO agency_terminals (agent_customer_id, user_id, serial_number, pos_model, status, created_at, updated_at)
                VALUES (5, '33404e3d-5b4d-4715-989c-3d3104ce6128', 'ABIA-POS-9001', 'Pax S900', 'active', NOW(), NOW())
            `);
            console.log("Added POS Terminal ABIA-POS-9001");
        }
        
        const term2Check = await client.query(`SELECT id FROM agency_terminals WHERE serial_number = 'ABIA-POS-9002'`);
        if (term2Check.rows.length === 0) {
            await client.query(`
                INSERT INTO agency_terminals (agent_customer_id, user_id, serial_number, pos_model, status, created_at, updated_at)
                VALUES (5, '33404e3d-5b4d-4715-989c-3d3104ce6128', 'ABIA-POS-9002', 'Pax A920', 'pending', NOW(), NOW())
            `);
            console.log("Added POS Terminal ABIA-POS-9002");
        }

        // 5. Merchant Profile
        const merchCheck = await client.query(`SELECT id FROM merchant_profiles WHERE business_name = 'Aba Mega Leather Works Ltd'`);
        if (merchCheck.rows.length === 0) {
            await client.query(`
                INSERT INTO merchant_profiles (customer_id, user_id, business_name, settlement_account_id, webhook_url, is_verified, created_at, updated_at)
                VALUES (5, '33404e3d-5b4d-4715-989c-3d3104ce6128', 'Aba Mega Leather Works Ltd', 2, 'https://webhook.site/dummy-abia-callback', true, NOW(), NOW())
            `);
            console.log("Added Merchant Profile 'Aba Mega Leather Works Ltd'");
        }

        // 6. Smart Card
        const cardCheck = await client.query(`SELECT id FROM smart_cards WHERE card_token = 'tok_card_chidi_99'`);
        if (cardCheck.rows.length === 0) {
            await client.query(`
                INSERT INTO smart_cards (customer_id, user_id, account_id, card_token, card_holder_name, card_network, card_type, card_number_masked, limit_pos, limit_web, limit_atm, is_frozen, expiry_date, status, created_at, updated_at)
                VALUES (5, '33404e3d-5b4d-4715-989c-3d3104ce6128', 1, 'tok_card_chidi_99', 'Chidi Mgbara', 'verve', 'physical', '5061-04XX-XXXX-9891', 10000000, 5000000, 2000000, false, '2030-12-31 00:00:00+00', 'active', NOW(), NOW())
            `);
            console.log("Added Smart Card for Chidi");
        }

        console.log("DB SEEDING COMPLETED SUCCESSFULLY!");
    } catch (err) {
        console.error("Seeding failed:", err);
    } finally {
        await client.end();
    }
}

seedBankingFeatures();
