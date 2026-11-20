import { requireAdminUser } from '@/lib/auth/server-guard';
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { importRegistryBundle } from '@/lib/registry/sdl';

export async function GET() {
    const __authGuard = await requireAdminUser();
    if (__authGuard instanceof NextResponse) return __authGuard;
    try {
        const templatesDir = path.join(process.cwd(), 'lib/workflow/templates');
        if (!fs.existsSync(templatesDir)) {
            return NextResponse.json({ success: false, error: "Templates directory not found" }, { status: 404 });
        }

        const allFiles = fs.readdirSync(templatesDir);
        const registrySdlFiles = allFiles.filter(f => f.endsWith('.sdl.json'));

        const results: any[] = [];

        for (const file of registrySdlFiles) {
            const filePath = path.join(templatesDir, file);
            const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

            // Verify it's a Registry SDL (has products or services)
            if (content.products || content.services) {
                console.log(`[SYNC-LOCAL] Synchronizing: ${file}...`);
                const stats = await importRegistryBundle(content);
                results.push({
                    file,
                    status: 'synchronized',
                    stats
                });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: "Local registry synchronization completed", 
            results 
        });
    } catch (error: any) {
        console.error("[SYNC-LOCAL] Sync failed:", error);
        return NextResponse.json({ 
            success: false, 
            error: error.message 
        }, { status: 500 });
    }
}
