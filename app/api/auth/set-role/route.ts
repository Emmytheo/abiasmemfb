import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";

/**
 * POST /api/auth/set-role
 * 
 * Called after signup to validate an optional admin secret
 * and set the user's role in user_metadata.
 * 
 * Body: { admin_secret?: string }
 */
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const adminSecret = body.admin_secret;

        const currentRole = user.user_metadata?.role || "user";
        let role = currentRole;

        if (adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) {
            role = "admin";
        }

        // If no secret is provided and the user already has a role,
        // we might not need to update user_metadata, but we'll do it to ensure consistency,
        // or we could skip the update and just return the current role.
        if (!adminSecret && currentRole !== "user") {
            role = currentRole;
        }

        // Use service role client to update user metadata
        const adminClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
        );

        const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
            user_metadata: { role },
        });

        if (updateError) {
            console.error("Failed to set role:", updateError);
            return NextResponse.json({ error: "Failed to set role" }, { status: 500 });
        }

        // If newly promoted to admin, or already an admin, ensure they have a Payload shadow user
        if (role === "admin") {
            try {
                const { getPayload } = await import("payload");
                const configPromise = (await import("@payload-config")).default;
                const payload = await getPayload({ config: configPromise });

                // Check if shadow already exists
                const { docs } = await payload.find({
                    collection: "users",
                    overrideAccess: true,
                    where: { supabase_id: { equals: user.id } },
                    limit: 1,
                });

                if (docs.length === 0) {
                    await payload.create({
                        collection: "users",
                        overrideAccess: true,
                        data: {
                            supabase_id: user.id,
                            email: user.email!,
                            name: user.user_metadata?.full_name || user.user_metadata?.name || "",
                            role: "admin",
                        },
                    });
                }
            } catch (payloadError) {
                console.error("Failed to sync Payload shadow user:", payloadError);
                // We do not fail the login if Payload fails; they can still login to the Next.js React Dashboard
            }
        }

        return NextResponse.json({
            role,
            redirect: role === "admin" ? "/dashboard" : "/client-dashboard",
        });
    } catch (e) {
        console.error("set-role error:", e);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * GET /api/auth/set-role
 * Returns the current user's role.
 */
export async function GET() {
    try {
        const supabase = await createServerSupabase();
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
            return NextResponse.json({ role: null }, { status: 401 });
        }

        const role = user.user_metadata?.role || "user";
        return NextResponse.json({ role });
    } catch (e) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
