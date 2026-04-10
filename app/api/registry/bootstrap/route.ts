import { createClient } from '@/lib/supabase/server';

export async function GET() {
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

        const payload = await getPayload({ config });
        const templatesDir = path.join(process.cwd(), 'lib/workflow/templates');
        
        if (!fs.existsSync(templatesDir)) {
            return NextResponse.json({ error: "Templates directory not found" }, { status: 404 });
        }

        const allFiles = fs.readdirSync(templatesDir);
        const registrySdlFiles = allFiles.filter(f => f.endsWith('.sdl.json'));

        const results: any[] = [];

        for (const file of registrySdlFiles) {
            try {
                const filePath = path.join(templatesDir, file);
                const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

                // Verify it's a Registry SDL (has products or services)
                if (content.products || content.services) {
                    console.log(`[Registry Bootstrap] Syncing: ${file}...`);
                    const stats = await importRegistryBundle(content);
                    results.push({
                        file,
                        status: 'synchronized',
                        stats
                    });
                } else {
                    results.push({
                        file,
                        status: 'skipped',
                        reason: 'Not a Registry SDL bundle'
                    });
                }
            } catch (err: any) {
                results.push({
                    file,
                    status: 'error',
                    error: err.message
                });
            }
        }

        return NextResponse.json({
            message: "Registry Bootstrap Complete",
            results
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
