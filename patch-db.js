const { Client } = require('pg');

const DATABASE_URI = "postgresql://postgres.gdmfudhjiugdyijebouc:ABIAsmemfb%40123@aws-1-us-east-2.pooler.supabase.com:6543/postgres";

async function patch() {
    const client = new Client({
        connectionString: DATABASE_URI,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        console.log("Connected to database.");

        // Check media table ID type
        const resMedia = await client.query("SELECT id FROM media LIMIT 1");
        const idType = typeof resMedia.rows[0]?.id === 'number' ? 'integer' : 'text';
        console.log(`Detected Media ID type: ${idType}`);

        console.log("Patching promotions table...");
        
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS image_source text DEFAULT 'url'`);
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS external_url text`);
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS media_image_id ${idType}`);
        
        // Also ensure link, placement and isActive exist since they might be new or renamed
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS link text`);
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS placement text DEFAULT 'hero'`);
        await client.query(`ALTER TABLE promotions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true`);

        console.log("Success! Columns added to promotions table.");
    } catch (err) {
        console.error("Error patching database:", err);
    } finally {
        await client.end();
    }
}

patch();
