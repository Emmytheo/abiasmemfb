import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Rubik } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "../globals.css";

import { Footer } from "@/components/layout/Footer";
import { Navbar } from "@/components/layout/Navbar";
import { PaletteProvider } from "@/context/palette-context";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Abia Microfinance Bank - Empowering Your Financial Future",
  description: "We create financial giants by providing bespoke microfinance solutions for entrepreneurs and small business owners across Abia State.",
};

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/auth/roles";

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=0.9" />
        <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
      </head>
      <body className={`${plusJakartaSans.variable} ${rubik.variable} font-sans antialiased bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <PaletteProvider>
            <Suspense fallback={null}>
              <Navbar userRole={userRole} />
            </Suspense>
            {children}
            <Footer />
          </PaletteProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
