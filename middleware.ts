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
    "/product",
    "/api/auth",
    "/api/registry",
];

// Admin dashboard routes — require 'admin' role
const ADMIN_PATTERNS = [
    "/dashboard",
    "/products",
    "/blog-management",
    "/settings",
    "/workflows",
];

// Client portal routes — require at least 'user' role (authenticated)
const CLIENT_PATTERNS = [
    "/client-dashboard",
    "/my-products",
    "/my-loans",
    "/my-services",
    "/explore",
    "/pay",
    "/applications",
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

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-url', request.nextUrl.href);
    requestHeaders.set('x-pathname', pathname);

    // Always allow public routes, static assets, and API routes (except auth API)
    if (
        isPublicRoute(pathname) ||
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon") ||
        pathname.startsWith("/opengraph") ||
        pathname.startsWith("/twitter") ||
        pathname.match(/\.(ico|png|jpg|jpeg|svg|webp|gif|css|js|woff2?)$/)
    ) {
        return NextResponse.next();
    }

    // Payload admin routes — pass through, Payload's supabaseStrategy handles auth
    if (isPayloadRoute(pathname)) {
        return NextResponse.next();
    }

    // Create Supabase client for session check
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({ request });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const {
        data: { user },
    } = await supabase.auth.getUser();

    // Not authenticated → redirect to login
    if (!user) {
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

    // All other authenticated routes are allowed
    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization)
         * - favicon.ico, sitemap.xml, robots.txt
         */
        "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
    ],
};
