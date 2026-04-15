import { getPayload } from 'payload';
import config from './payload.config';
import fs from 'fs';
import path from 'path';
import { importRegistryBundle } from './lib/registry/sdl';

// Manually load environment to bypass Payload internal loadEnvConfig issue
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function runSync() {
    console.log("[SYNC] Initializing Payload...");
    try {
        const payload = await getPayload({ config });
        
        const filePath = path.join(process.cwd(), 'lib/workflow/templates/transfer_services.sdl.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const bundle = JSON.parse(fileContent);

        console.log("[SYNC] Starting import for bundle version:", bundle.version);
        const stats = await importRegistryBundle(bundle);
        
        console.log("[SYNC] Success!");
        console.log(JSON.stringify(stats, null, 2));
        process.exit(0);
    } catch (error) {
        console.error("[SYNC] Fatal error:", error);
        process.exit(1);
    }
}

runSync();
