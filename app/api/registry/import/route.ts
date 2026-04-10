import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { importRegistryBundle } from '@/lib/registry/sdl';
import { RegistryBundleSDL } from '@/lib/registry/types';

export async function POST(req: Request) {
    try {
        // 1. Auth Guard (Admin Only)
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
        }

        const role = user.user_metadata?.role || "user";
        if (role !== "admin") {
            return NextResponse.json({ error: "Forbidden: Requires Administrator Privileges" }, { status: 403 });
        }

        // 2. Parse Incoming JSON
        const rawBody = await req.json();

        // Very basic validation heuristics to ensure it's an SDL bundle
        if (!rawBody || typeof rawBody !== 'object' || !rawBody.version) {
            return NextResponse.json({ error: "Malformed SDL Blueprint. Missing version identifier." }, { status: 400 });
        }

        if (!Array.isArray(rawBody.products) || !Array.isArray(rawBody.services)) {
            return NextResponse.json({ error: "Malformed SDL Blueprint. Ensure both 'products' and 'services' arrays are present." }, { status: 400 });
        }

        const bundle = rawBody as RegistryBundleSDL;

        // 3. Execute Integration Sync
        const stats = await importRegistryBundle(bundle);

        if (stats.errors.length > 0) {
            // Partial success or failure
            return NextResponse.json({
                message: "Sync completed with warnings.",
                stats,
                success: true
            }, { status: 207 }); // 207 Multi-Status
        }

        return NextResponse.json({
            message: "Registry bundle synchronized successfully.",
            stats,
            success: true
        });

    } catch (e: any) {
        console.error("[Registry Sync API Error]:", e.message);
        return NextResponse.json(
            { error: "Internal Server Error during execution", details: e.message },
            { status: 500 }
        );
    }
}
