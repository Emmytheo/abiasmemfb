import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PaletteProvider } from "@/context/palette-context";
import { BankProfileProvider } from "@/context/bank-profile-context";
import { getServerBankProfile } from "@/lib/banking/bank-profile-server";
import "./globals.css";

const defaultUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const viewport: Viewport = {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
    const { profile } = await getServerBankProfile();
    return {
        metadataBase: new URL(defaultUrl),
        title: {
            template: `%s | ${profile.legalName}`,
            default: `${profile.legalName} — ${profile.tagline}`,
        },
        description: profile.heroDescription,
    };
}

export default async function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const { profile, customProfiles, profileOverrides, isPreviewMode } = await getServerBankProfile();

    return (
        <html
            lang="en"
            suppressHydrationWarning
            data-palette={profile.defaultPalette}
            data-bank-profile={profile.id}
        >
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Rubik:wght@400;500;700;800&family=Playfair+Display:wght@500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-sans antialiased bg-background text-foreground">
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <PaletteProvider initialPalette={profile.defaultPalette}>
                        <BankProfileProvider
                            initialProfileId={profile.id}
                            initialCustomProfiles={customProfiles}
                            initialOverrides={profileOverrides}
                            initialPreviewMode={isPreviewMode}
                        >
                            {children}
                        </BankProfileProvider>
                    </PaletteProvider>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
