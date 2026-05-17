import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { PaletteProvider } from "@/context/palette-context";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export const metadata: Metadata = {
    metadataBase: new URL(defaultUrl),
    title: {
        template: '%s | Abia Microfinance Bank',
        default: 'Abia Microfinance Bank - Empowering Your Financial Future',
    },
    description: "We create financial giants by providing bespoke microfinance solutions for entrepreneurs and small business owners across Abia State.",
};

export default function RootLayout({
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
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Rubik:ital,wght@0,300..900;1,300..900&family=Playfair+Display:wght@500;700&display=swap" rel="stylesheet" />
            </head>
            <body className="font-sans antialiased bg-background text-foreground">
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
