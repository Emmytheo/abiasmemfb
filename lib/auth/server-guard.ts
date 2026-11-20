import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient as createServerSupabase } from "@/lib/supabase/server"
import type { User as SupabaseUser } from "@supabase/supabase-js"

export interface AuthContext {
    user: SupabaseUser
    userId: string
    email: string
    fullName: string
    role: string
    isAdmin: boolean
    ipAddress: string
}

export function extractClientIp(req?: Request | NextRequest): string {
    if (!req) return "unknown"
    const xff = req.headers.get("x-forwarded-for")
    if (xff) return xff.split(",")[0].trim()
    return req.headers.get("x-real-ip") || "unknown"
}

export function timingSafeSecretMatch(provided: string | null | undefined, expected: string | null | undefined): boolean {
    if (!provided || !expected || expected.trim().length < 8) return false
    const a = Buffer.from(provided.trim(), "utf8")
    const b = Buffer.from(expected.trim(), "utf8")
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
}

/**
 * Verifies an authenticated Supabase user session.
 * Returns AuthContext or a 401 NextResponse.
 */
export async function requireAuthenticatedUser(req?: Request | NextRequest): Promise<AuthContext | NextResponse> {
    try {
        const supabase = await createServerSupabase()
        const {
            data: { user },
            error,
        } = await supabase.auth.getUser()

        if (error || !user) {
            return NextResponse.json(
                { error: "Unauthorized. Active authenticated session required." },
                { status: 401 }
            )
        }

        const role = String(user.user_metadata?.role || "user").toLowerCase()
        const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User"

        return {
            user,
            userId: user.id,
            email: user.email || "",
            fullName,
            role,
            isAdmin: role === "admin" || role === "superadmin",
            ipAddress: extractClientIp(req),
        }
    } catch {
        return NextResponse.json(
            { error: "Authentication service unavailable." },
            { status: 401 }
        )
    }
}

/**
 * Requires an authenticated bank admin / superadmin session, OR a verified internal ADMIN_SECRET header.
 */
export async function requireAdminUser(req?: Request | NextRequest): Promise<AuthContext | NextResponse> {
    if (req) {
        const internalSecret = req.headers.get("x-internal-secret") || req.headers.get("x-admin-secret")
        if (timingSafeSecretMatch(internalSecret, process.env.ADMIN_SECRET)) {
            return {
                user: { id: "system-admin", email: "system@banksuite.internal", user_metadata: { role: "admin" } } as any,
                userId: "system-admin",
                email: "system@banksuite.internal",
                fullName: "System Administrator",
                role: "admin",
                isAdmin: true,
                ipAddress: extractClientIp(req),
            }
        }
    }

    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    if (!auth.isAdmin) {
        return NextResponse.json(
            { error: "Forbidden. Bank administrator privileges required." },
            { status: 403 }
        )
    }

    return auth
}

/**
 * Allows either a valid CRON_SECRET Bearer token (non-empty) OR an authenticated bank admin.
 */
export async function requireCronOrAdmin(req: Request | NextRequest): Promise<AuthContext | NextResponse> {
    const authHeader = req.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim()
        if (
            timingSafeSecretMatch(token, process.env.CRON_SECRET) ||
            timingSafeSecretMatch(token, process.env.ADMIN_SECRET)
        ) {
            return {
                user: { id: "system-cron", email: "scheduler@banksuite.internal", user_metadata: { role: "admin" } } as any,
                userId: "system-cron",
                email: "scheduler@banksuite.internal",
                fullName: "Automated Scheduler",
                role: "admin",
                isAdmin: true,
                ipAddress: extractClientIp(req),
            }
        }
    }

    return requireAdminUser(req)
}

/**
 * Hard-blocks debug/maintenance/mock routes in production unless explicitly enabled AND called by an admin.
 */
export async function requireMaintenanceAccess(req: Request | NextRequest): Promise<AuthContext | NextResponse> {
    if (
        process.env.NODE_ENV === "production" &&
        process.env.ALLOW_ADMIN_MAINTENANCE_ENDPOINTS !== "true"
    ) {
        return NextResponse.json(
            { error: "Endpoint disabled in production." },
            { status: 403 }
        )
    }
    return requireAdminUser(req)
}
