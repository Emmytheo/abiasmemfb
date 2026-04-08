import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { api } from "@/lib/api";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
    // Fetch the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    let role: AppRole = user.user_metadata?.role || "user";

    // Dynamically elevate to "customer" UI role if they have active products
    if (role === "user") {
        const [accounts, loans] = await Promise.all([
            api.getUserAccounts(user.id).catch(() => []),
            api.getUserLoans(user.id).catch(() => [])
        ]);
        if (accounts.length > 0 || loans.length > 0) {
            role = "customer";
        }
    }

    // Fetch dynamic Service Categories for the Sidebar
    const serviceCategories = await api.getServiceCategories().catch(() => []);

    const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
    const userEmail = user.email || "";
    const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

    return (
        <SidebarProvider>
            <ClientSidebar
                variant="inset"
                userRole={role}
                userName={userName}
                userEmail={userEmail}
                serviceCategories={serviceCategories}
            />

            <SidebarInset>
                <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/80 px-6 backdrop-blur-sm transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <SidebarTrigger className="-ml-2 hover:bg-muted/50 transition-colors" />
                        <Separator orientation="vertical" className="h-6 opacity-50" />
                        <DashboardBreadcrumb />
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4">
                        <div className="hidden sm:block">
                            <ThemeCustomizer />
                        </div>
                        <div className="flex items-center gap-2 border rounded-full px-2 sm:px-3 py-1.5 bg-muted/30 shadow-sm">
                            <div className="h-6 w-6 rounded-full bg-primary flex flex-col justify-center items-center text-[10px] text-primary-foreground font-bold shadow-sm shrink-0">
                                {initials}
                            </div>
                            <span className="hidden sm:inline text-sm font-medium text-foreground">{userName}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <div className="mx-auto max-w-7xl w-full animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
