import { importRegistryBundle } from '../lib/registry/sdl';
import fs from 'fs';
import path from 'path';
import { getPayload } from 'payload';
import config from '../payload.config';

async function run() {
    try {
        console.log("Starting forced local bootstrap sync...");
        const payload = await getPayload({ config });
        const filePath = path.join(process.cwd(), 'lib/workflow/templates/transfer_services.sdl.json');
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        console.log("Importing transfer services...");
        const stats = await importRegistryBundle(content);
        console.log("Stats:", JSON.stringify(stats, null, 2));
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
