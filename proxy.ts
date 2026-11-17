import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Public routes that never require auth
const PUBLIC_PATTERNS = [
    "/",
    "/auth",
    "/blog",
    "/company",
    "/careers",
    "/legal",
    "/media",
    "/support",
    "/personal-banking",
    "/business",
    "/internet-banking",
    "/product",
    "/api/auth",
    "/api/account-lookup",
    "/api/registry",
    "/api/workflows",
    "/api/mock",
];

// Admin dashboard routes — require 'admin' role
const ADMIN_PATTERNS = [
    "/dashboard",
    "/products",
    "/blog-management",
    "/settings",
    "/workflows",
    "/customers",
    "/account-officers",
    "/promotions",
    "/endpoints",
];

function isPublicRoute(pathname: string): boolean {
    if (pathname === "/") return true;
    return PUBLIC_PATTERNS.some(
        (p) => p !== "/" && (pathname === p || pathname.startsWith(p + "/"))
    );
}

function isAdminRoute(pathname: string): boolean {
    return ADMIN_PATTERNS.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
}

function isPayloadRoute(pathname: string): boolean {
    return pathname.startsWith("/admin");
}

// Short-lived in-memory cache for Banking auth checks
const bankingAuthCache = new Map<string, { user: any; expiresAt: number }>();
const bankingInFlightAuth = new Map<string, Promise<any>>();

async function getCachedBankingUser(request: NextRequest): Promise<any> {
    const authCookies = request.cookies
        .getAll()
        .filter((c) => c.name.includes("-auth-token") || c.name.startsWith("sb-"))
        .map((c) => `${c.name}=${c.value}`)
        .join(";");

    if (!authCookies) return null;

    const now = Date.now();
    const cached = bankingAuthCache.get(authCookies);
    if (cached && cached.expiresAt > now) {
        return cached.user;
    }

    if (bankingInFlightAuth.has(authCookies)) {
        return await bankingInFlightAuth.get(authCookies);
    }

    const authPromise = (async () => {
        try {
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                {
                    cookies: {
                        getAll() {
                            return request.cookies.getAll();
                        },
                        setAll() {},
                    },
                }
            );
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (user) {
                bankingAuthCache.set(authCookies, { user, expiresAt: Date.now() + 5000 });
            }
            return user || null;
        } catch (err: any) {
            console.warn("[proxy.ts] banking auth check failed:", err.message);
            return null;
        } finally {
            bankingInFlightAuth.delete(authCookies);
        }
    })();

    bankingInFlightAuth.set(authCookies, authPromise);
    return await authPromise;
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-url", request.nextUrl.href);
    requestHeaders.set("x-pathname", pathname);

    // Always allow static assets
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/opengraph") ||
        pathname.startsWith("/twitter") ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?)$/)
    ) {
        return NextResponse.next();
    }

    // Redirect legacy /copteller* paths to the standalone Copteller application
    if (pathname === "/copteller" || pathname.startsWith("/copteller/")) {
        const coptellerBase = (process.env.NEXT_PUBLIC_COPTELLER_URL || "http://localhost:3001").replace(/\/$/, "");
        return NextResponse.redirect(`${coptellerBase}${pathname}${request.nextUrl.search}`);
    }

    // Payload admin routes — Payload handles its own auth
    if (isPayloadRoute(pathname)) {
        return NextResponse.next();
    }

    // Banking public routes
    if (isPublicRoute(pathname)) {
        return NextResponse.next({ request: { headers: requestHeaders } });
    }

    // Banking auth check with in-memory caching & deduplication
    const user = await getCachedBankingUser(request);

    // Not authenticated → return 401 JSON for API routes, or redirect to banking login for UI pages
    if (!user) {
        if (pathname.startsWith("/api/")) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in to Abia SME Microfinance Bank." },
                { status: 401 }
            );
        }
        const url = request.nextUrl.clone();
        url.pathname = "/auth/login";
        url.searchParams.set("redirect", pathname);
        return NextResponse.redirect(url);
    }

    // Get user role
    const role = user.user_metadata?.role || "user";

    // Admin routes — only admins
    if (isAdminRoute(pathname)) {
        if (role !== "admin") {
            const url = request.nextUrl.clone();
            url.pathname = "/client-dashboard";
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
