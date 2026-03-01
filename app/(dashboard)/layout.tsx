import { Plus_Jakarta_Sans, Rubik } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "../globals.css";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";

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
import { PaletteProvider } from "@/context/palette-context";
import { Suspense } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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
                        <SidebarProvider>
                            {/* Sidebar Navigation */}
                            <Suspense fallback={null}>
                                <DashboardSidebar variant="inset" />
                            </Suspense>

                            {/* Main Content Area */}
                            <SidebarInset>
                                {/* Header */}
                                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        <SidebarTrigger className="-ml-2 hover:bg-muted/50 transition-colors" />
                                        <Separator orientation="vertical" className="h-6 opacity-50" />
                                        <Suspense fallback={null}>
                                            <DashboardBreadcrumb />
                                        </Suspense>
                                    </div>

                                    {/* Top Right Actions */}
                                    <div className="flex items-center gap-2 sm:gap-4">
                                        <div className="hidden sm:block">
                                            <ThemeCustomizer />
                                        </div>
                                        {/* Visual representation of user and actions matching LMS theme */}
                                        <div className="flex items-center gap-2 border rounded-full px-2 sm:px-3 py-1.5 bg-muted/30 shadow-sm">
                                            <div className="h-6 w-6 rounded-full bg-primary flex flex-col justify-center items-center text-[10px] text-primary-foreground font-bold shrink-0">
                                                AM
                                            </div>
                                            <span className="hidden sm:inline text-sm font-medium text-foreground">Admin User</span>
                                        </div>
                                    </div>
                                </header>

                                {/* Page Content */}
                                <main className="flex-1 overflow-auto p-2 px-0 sm:p-4 sm:px-0 md:p-8 md:px-0">
                                    <div className="mx-auto max-w-7xl w-full animate-in fade-in duration-500">
                                        {children}
                                    </div>
                                </main>
                            </SidebarInset>
                        </SidebarProvider>
                    </PaletteProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
