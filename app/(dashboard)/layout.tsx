import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { BankProfileSwitcher } from "@/components/dashboard/BankProfileSwitcher";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { CommandPalette } from "@/components/command-palette";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ScopeProvider } from "@/context/scope-context";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
    // Fetch the authenticated user and enforce admin role
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const role = user.user_metadata?.role || "user";
    if (role !== "admin") {
        redirect("/client-dashboard");
    }

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "Admin";
    const userEmail = user.email || "";
    const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <SidebarProvider>
            <ScopeProvider role="admin">
                <DashboardSidebar
                    variant="inset"
                    userName={userName}
                    userEmail={userEmail}
                />

                <SidebarInset className="ambient-mesh">
                    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl transition-all duration-300">
                        <div className="flex items-center gap-3 min-w-0">
                            <SidebarTrigger className="-ml-1 hover:bg-muted/60 transition-colors" />
                            <Separator orientation="vertical" className="h-5 opacity-50" />
                            <DashboardBreadcrumb />
                        </div>

                        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                            <CommandPalette role="admin" />
                            <div className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Core Live
                            </div>
                            <BankProfileSwitcher compact />
                            <div className="hidden sm:block">
                                <ThemeCustomizer />
                            </div>
                            <div className="flex items-center gap-2 border border-border/80 rounded-full pl-1.5 pr-2.5 py-1 bg-card/80 shadow-sm">
                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-black shrink-0">
                                    {initials}
                                </div>
                                <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[120px] truncate">{userName}</span>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-auto p-2 px-0 sm:p-4 sm:px-0 md:p-2 md:px-0">
                        <div className="mx-auto w-full animate-in fade-in duration-500">
                            {children}
                        </div>
                    </main>
                </SidebarInset>
            </ScopeProvider>
        </SidebarProvider>
    );
}
