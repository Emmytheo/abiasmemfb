import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Abia Microfinance Bank - Empowering Your Financial Future",
  description: "We create financial giants by providing bespoke microfinance solutions for entrepreneurs and small business owners across Abia State.",
};

export default async function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch auth state server-side for the Navbar
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userRole: AppRole | null = user ? (user.user_metadata?.role || "user") : null;

  return (
    <div className="flex flex-col min-h-screen">
        <Suspense fallback={null}>
            <Navbar userRole={userRole} />
        </Suspense>
        <div className="flex-1">
            {children}
        </div>
        <Footer />
    </div>
  );
}
