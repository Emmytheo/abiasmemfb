"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export type AppRole = "user" | "customer" | "admin";

/**
 * Get the role of the current Supabase user.
 * Reads from user_metadata.role, defaults to 'user'.
 */
export function getUserRole(user: any): AppRole {
    if (!user) return "user";
    const role = user.user_metadata?.role;
    if (role === "admin" || role === "customer") return role;
    return "user";
}

/**
 * Create a Supabase Admin client (service role) for user management operations.
 * This bypasses RLS and can update user metadata.
 */
function getAdminClient() {
    return createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );
}

/**
 * Promote a user to 'customer' role.
 * Called when the user's first bank account is created/approved.
 */
export async function promoteToCustomer(supabaseUserId: string) {
    const admin = getAdminClient();
    const { error } = await admin.auth.admin.updateUserById(supabaseUserId, {
        user_metadata: { role: "customer" },
    });
    if (error) {
        console.error("Failed to promote to customer:", error);
        throw error;
    }
}

/**
 * Promote a user to 'admin' role.
 * Also creates a Payload shadow user for CMS access.
 * Requires the caller to be an admin or a valid ADMIN_SECRET.
 */
export async function promoteToAdmin(supabaseUserId: string) {
    const admin = getAdminClient();

    // Get user info first
    const { data: { user }, error: fetchError } = await admin.auth.admin.getUserById(supabaseUserId);
    if (fetchError || !user) {
        throw new Error("User not found");
    }

    // Set role in Supabase
    const { error } = await admin.auth.admin.updateUserById(supabaseUserId, {
        user_metadata: { role: "admin" },
    });
    if (error) {
        console.error("Failed to promote to admin:", error);
        throw error;
    }

    // Create Payload shadow user
    try {
        const { getPayload } = await import("payload");
        const configPromise = (await import("@payload-config")).default;
        const payload = await getPayload({ config: configPromise });

        // Check if shadow already exists
        const { docs } = await payload.find({
            collection: "users",
            overrideAccess: true,
            where: { supabase_id: { equals: supabaseUserId } },
            limit: 1,
        });

        if (docs.length === 0) {
            await payload.create({
                collection: "users",
                overrideAccess: true,
                data: {
                    supabase_id: supabaseUserId,
                    email: user.email!,
                    name: user.user_metadata?.full_name || user.user_metadata?.name || "",
                    role: "admin",
                },
            });
        }
    } catch (e) {
        console.error("Failed to create Payload shadow user:", e);
        // Role is already set in Supabase — shadow will be created on next /admin access
    }
}

/**
 * Demote an admin back to 'customer'.
 * Removes the Payload shadow user.
 */
export async function demoteFromAdmin(supabaseUserId: string) {
    const admin = getAdminClient();

    // Revert role
    const { error } = await admin.auth.admin.updateUserById(supabaseUserId, {
        user_metadata: { role: "customer" },
    });
    if (error) {
        console.error("Failed to demote from admin:", error);
        throw error;
    }

    // Delete Payload shadow
    try {
        const { getPayload } = await import("payload");
        const configPromise = (await import("@payload-config")).default;
        const payload = await getPayload({ config: configPromise });

        const { docs } = await payload.find({
            collection: "users",
            overrideAccess: true,
            where: { supabase_id: { equals: supabaseUserId } },
            limit: 1,
        });

        if (docs.length > 0) {
            await payload.delete({
                collection: "users",
                id: docs[0].id,
                overrideAccess: true,
            });
        }
    } catch (e) {
        console.error("Failed to delete Payload shadow user:", e);
    }
}
