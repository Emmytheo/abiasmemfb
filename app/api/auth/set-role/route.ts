import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getPayloadClient } from "@/lib/payload";

/**
 * POST /api/auth/set-role
 *
 * Validates optional admin_secret, preserves existing user_metadata,
 * ensures Payload shadow user for admins (with a strict timeout so login never hangs),
 * and returns the role + target dashboard route.
 */
export async function POST(request: Request) {
    try {
        const supabase = await createServerSupabase();
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const body = await request.json().catch(() => ({}));
        const adminSecret = typeof body.admin_secret === "string" ? body.admin_secret.trim() : "";

        const currentRole = user.user_metadata?.role || "user";
        let role = currentRole;
        let roleChanged = false;

        if (adminSecret) {
            if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
                return NextResponse.json(
                    { error: "Invalid Staff Admin Secret. Leave Staff Access unchecked for customer login." },
                    { status: 403 }
                );
            }
            if (role !== "admin") {
                role = "admin";
                roleChanged = true;
            }
        }

        // Only update Supabase metadata when role needs to be initialized or elevated
        if (roleChanged || !user.user_metadata?.role) {
            if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const adminClient = createClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL,
                    process.env.SUPABASE_SERVICE_ROLE_KEY,
                    { auth: { autoRefreshToken: false, persistSession: false } }
                );

                const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
                    user_metadata: {
                        ...(user.user_metadata || {}),
                        role,
                    },
                });

                if (updateError) {
                    console.error("Failed to set role:", updateError);
                    return NextResponse.json({ error: "Failed to update account role" }, { status: 500 });
                }
            }
        }

        // Ensure Payload shadow user exists for admins, bounded to 2.5s so login never hangs
        if (role === "admin") {
            const syncShadowUser = async () => {
                const payload = await getPayloadClient();
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
            };

            await Promise.race([
                syncShadowUser().catch((payloadError) => {
                    console.warn("Payload shadow user sync skipped:", payloadError?.message || payloadError);
                }),
                new Promise<void>((resolve) => setTimeout(resolve, 2500)),
            ]);
        }

        return NextResponse.json({
            role,
            roleChanged,
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
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const role = user.user_metadata?.role || "user";
        return NextResponse.json({
            role,
            redirect: role === "admin" ? "/dashboard" : "/client-dashboard",
        });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
