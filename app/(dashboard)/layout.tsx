import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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
            <DashboardSidebar
                variant="inset"
                userName={userName}
                userEmail={userEmail}
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
                            <div className="h-6 w-6 rounded-full bg-primary flex flex-col justify-center items-center text-[10px] text-primary-foreground font-bold shrink-0">
                                {initials}
                            </div>
                            <span className="hidden sm:inline text-sm font-medium text-foreground">{userName}</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto p-2 px-0 sm:p-4 sm:px-0 md:p-2 md:px-0">
                    <div className="mx-auto w-full animate-in fade-in duration-500">
                        {children}
                    </div>
                </main>
            </SidebarInset>
        </SidebarProvider>
    );
}
