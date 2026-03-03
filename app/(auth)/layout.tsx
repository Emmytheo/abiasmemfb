import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Rubik, Playfair_Display } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PaletteProvider } from "@/context/palette-context";
import "../globals.css";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: "Abia Microfinance Bank - Auth",
    description: "Secure login for Abia Microfinance Bank",
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

const playfairDisplay = Playfair_Display({
    variable: "--font-display",
    subsets: ["latin"],
    display: "swap",
    weight: ["500", "700"],
});

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=0.9" />
                <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
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
                        {children}
                    </PaletteProvider>
                </ThemeProvider>
                <Toaster />
            </body>
        </html>
    );
}
