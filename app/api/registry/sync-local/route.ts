import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { importRegistryBundle } from '@/lib/registry/sdl';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'lib/workflow/templates/transfer_services.sdl.json');
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const bundle = JSON.parse(fileContent);

        console.log("[SYNC-LOCAL] Starting synchronization with bundle version:", bundle.version);
        const result = await importRegistryBundle(bundle);

        return NextResponse.json({ 
            success: true, 
            message: "Synchronization completed", 
            stats: result 
        });
    } catch (error: any) {
        console.error("[SYNC-LOCAL] Sync failed:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
