import fs from 'fs';
import path from 'path';
import { importRegistryBundle } from '../lib/registry/sdl';
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const run = async () => {
    try {
        const filePath = process.argv[2];
        if (!filePath) {
            console.error("❌ Please provide the path to the SDL json file.");
            console.error("Usage: npx tsx scripts/import-registry.ts lib/workflow/templates/transfer_services.sdl.json");
            process.exit(1);
        }

        const absolutePath = path.resolve(process.cwd(), filePath);
        console.log(`Loading SDL payload from: ${absolutePath}`);
        
        const fileContent = fs.readFileSync(absolutePath, 'utf-8');
        const bundle = JSON.parse(fileContent);

        console.log(`Starting Payload CMS context...`);
        const result = await importRegistryBundle(bundle);

        console.log("✅ Registry Sync Complete!");
        console.log(`- Products Loaded: ${result.products}`);
        console.log(`- Services Loaded: ${result.services}`);
        if (result.errors.length > 0) {
            console.warn(`- Errors Encountered:`);
            console.warn(result.errors);
        }

        process.exit(0);
    } catch (e: any) {
        console.error("❌ Critical Import Error:", e.message);
        process.exit(1);
    }
};

run();
