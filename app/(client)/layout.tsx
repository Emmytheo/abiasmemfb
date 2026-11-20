import { ClientSidebar } from "@/components/client-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { DashboardBreadcrumb } from "@/components/dashboard-breadcrumb";
import { CommandPalette } from "@/components/command-palette";
import { ClientMobileDock } from "@/components/client-mobile-dock";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { AppRole } from "@/lib/auth/roles";
import { api } from "@/lib/api";
import { headers } from "next/headers";
import { ScopeProvider } from "@/context/scope-context";

export const dynamic = 'force-dynamic';

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
    // Fetch the authenticated user
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const headersList = await headers();
    const pathname = headersList.get("x-pathname") || "";
    const isOnboardingPage = pathname === "/onboarding";

    // Fetch customer data to check onboarding status
    const customer = await api.getCustomerBySupabaseId(user.id);
    
    const hasCoreBanking = !!customer?.qore_customer_id;
    const onboardingStatus = customer?.onboarding_status || "pending";
    const isSkipped = onboardingStatus === "skipped";
    const isCompleted = onboardingStatus === "completed" || hasCoreBanking;
    const hasVerifiedIdentity = !!customer?.bvn;

    // Guard: If not onboarded AND not skipped AND not identity verified, redirect
    if (!isCompleted && !isSkipped && !hasVerifiedIdentity && !isOnboardingPage) {
        redirect("/onboarding");
    }

    // Guard: If completed but wandering into onboarding, redirect to dashboard
    if (isCompleted && isOnboardingPage) {
        redirect("/client-dashboard");
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
            <ScopeProvider role="client">
                {!isOnboardingPage && (
                    <ClientSidebar
                        variant="inset"
                        userRole={role}
                        userName={userName}
                        userEmail={userEmail}
                        serviceCategories={serviceCategories}
                        onboardingStatus={onboardingStatus as any}
                    />
                )}
                <SidebarInset className="ambient-mesh">
                    {!isOnboardingPage && (
                        <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/80 px-4 sm:px-6 backdrop-blur-xl transition-all duration-300">
                            <div className="flex items-center gap-3 min-w-0">
                                <SidebarTrigger className="-ml-1 hover:bg-muted/60 transition-colors" />
                                <Separator orientation="vertical" className="h-5 opacity-50" />
                                <DashboardBreadcrumb />
                            </div>

                            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                                <CommandPalette role="client" />
                                <div className="hidden sm:block">
                                    <ThemeCustomizer />
                                </div>
                                <div className="flex items-center gap-2 border border-border/80 rounded-full pl-1.5 pr-2.5 py-1 bg-card/80 shadow-sm">
                                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[10px] text-primary-foreground font-black shadow-sm shrink-0">
                                        {initials}
                                    </div>
                                    <span className="hidden sm:inline text-xs font-bold text-foreground max-w-[120px] truncate">{userName}</span>
                                </div>
                            </div>
                        </header>
                    )}

                    <main className="flex-1 overflow-auto px-2 p-4 md:p-8 pb-24 md:pb-8">
                        <div className="mx-auto max-w-7xl w-full animate-in fade-in duration-500">
                            {children}
                        </div>
                    </main>

                    {!isOnboardingPage && <ClientMobileDock />}
                </SidebarInset>
            </ScopeProvider>
        </SidebarProvider>
    );
}
