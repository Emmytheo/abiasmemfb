import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";
import { getServerBankProfile } from "@/lib/banking/bank-profile-server";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
  const { profile } = await getServerBankProfile();
  return {
    metadataBase: new URL(defaultUrl),
    title: `${profile.legalName} — ${profile.tagline}`,
    description: profile.heroDescription,
  };
}

async function resolveNavbarRoleFast(): Promise<AppRole | null> {
  try {
    const cookieStore = await cookies();
    const hasAuthCookie = cookieStore
      .getAll()
      .some((c) => c.name.includes("-auth-token") || c.name.startsWith("sb-"));

    // Fast path: anonymous visitors never wait on remote Supabase auth
    if (!hasAuthCookie) return null;

    const supabase = await createClient();
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 1200)),
    ]);

    if (!result || typeof result !== "object" || !("data" in result)) {
      return null;
    }

    const user = result.data?.user;
    return user ? (user.user_metadata?.role || "user") : null;
  } catch {
    return null;
  }
}

async function NavbarWithAuth() {
  const userRole = await resolveNavbarRoleFast();
  return <Navbar userRole={userRole} />;
}

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen marketing-scale">
      <Suspense fallback={<Navbar userRole={null} />}>
        <NavbarWithAuth />
      </Suspense>
      <div className="flex-1">
        {children}
      </div>
      <Footer />
    </div>
  );
}
