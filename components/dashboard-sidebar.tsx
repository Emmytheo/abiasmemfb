"use client";

import * as React from "react";
import {
    LayoutDashboard,
    Package,
    Landmark,
    CreditCard,
    Briefcase,
    GraduationCap,
    Lightbulb,
    Hash,
    Wifi,
    Settings,
    Globe,
    Tag,
    PlusCircleIcon,
    MailIcon,
    Building,
    BookOpen,
    Newspaper,
    LayoutTemplate,
    Workflow,
    Receipt,
    Clock,
    FileText,
    Play,
    Users,
    UserSquare2,
    RefreshCw,
    Megaphone,
} from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupContent,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/nav-main";
import { Button } from "@/components/ui/button";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";
import { NavUser } from "@/components/nav-user";
import { ScopeSelector } from "@/components/scope-selector";
import { useBankProfile } from "@/context/bank-profile-context";
import type { ModuleKey } from "@/lib/banking/bank-profiles";

type AdminNavItem = {
    title: string;
    url: string;
    icon: any;
    moduleKey?: ModuleKey;
};

type AdminNavGroup = {
    title: string;
    moduleKey?: ModuleKey;
    items: AdminNavItem[];
};

const navGroups: AdminNavGroup[] = [
    {
        title: "General",
        items: [
            {
                title: "Command Center",
                url: "/dashboard",
                icon: LayoutDashboard,
            },
            {
                title: "Teller, GL & Audit",
                url: "/dashboard/operations",
                icon: Landmark,
            },
            {
                title: "White-Label Profiles",
                url: "/settings/bank-profiles",
                icon: Building,
            },
            {
                title: "Infrastructure & Sync",
                url: "/settings/sync",
                icon: RefreshCw,
            },
        ],
    },
    {
        title: "Products",
        items: [
            {
                title: "Accounts",
                url: "/products/accounts",
                icon: Landmark,
            },
            {
                title: "Applications",
                url: "/products/applications",
                icon: FileText,
            },
            {
                title: "Credit & Loans",
                url: "/products/loans",
                icon: CreditCard,
            },
            {
                title: "Transactions",
                url: "/products/transactions",
                icon: Receipt,
            },
            {
                title: "Customer 360 & KYC",
                url: "/customers",
                icon: Users,
            },
            {
                title: "Account Officers",
                url: "/account-officers",
                icon: UserSquare2,
            },
        ],
    },
    {
        title: "Digital Hub Admin",
        items: [
            {
                title: "Copteller Custody",
                url: "/dashboard/copteller",
                icon: Globe,
                moduleKey: "coptellerBridge",
            },
            {
                title: "Target Vaults",
                url: "/dashboard/esusu",
                icon: Users,
                moduleKey: "cooperativeEsusu",
            },
            {
                title: "POS Partner Agency",
                url: "/dashboard/agency",
                icon: Landmark,
                moduleKey: "agencyPos",
            },
            {
                title: "Card Registry",
                url: "/dashboard/cards",
                icon: CreditCard,
                moduleKey: "smartCards",
            },
            {
                title: "Merchant Accounts",
                url: "/dashboard/merchant",
                icon: Briefcase,
                moduleKey: "merchantApiAndPayroll",
            },
        ],
    },
    {
        title: "Services",
        items: [
            {
                title: "Service Settings",
                url: "/settings/service",
                icon: Tag,
            },
            {
                title: "Registry Blueprints",
                url: "/settings/registry",
                icon: Settings,
            },
            {
                title: "Service Simulator",
                url: "/settings/service/simulator",
                icon: Play,
            },
        ],
    },
    {
        title: "Content",
        items: [
            {
                title: "Blog Management",
                url: "/blog-management",
                icon: Newspaper,
            },
            {
                title: "Global Content",
                url: "/settings/global-content",
                icon: Globe,
            },
            {
                title: "Page Builder",
                url: "/admin/collections/pages",
                icon: LayoutTemplate,
            },
            {
                title: "Promotions & Adverts",
                url: "/promotions",
                icon: Megaphone,
            },
        ],
    },
    {
        title: "Workflows & Automation",
        moduleKey: "workflowEngine",
        items: [
            {
                title: "Workflows",
                url: "/workflows",
                icon: Workflow,
            },
            {
                title: "Run History",
                url: "/workflows/runs",
                icon: LayoutDashboard,
            },
            {
                title: "API Endpoints",
                url: "/endpoints",
                icon: Wifi,
            },
            {
                title: "Provider Mappings",
                url: "/settings/mappings",
                icon: Building, 
            },
            {
                title: "Service Vault",
                url: "/workflows/providers",
                icon: Settings,
            },
            {
                title: "Secrets",
                url: "/workflows/vault",
                icon: Settings,
            },
            {
                title: "Scheduled Jobs",
                url: "/workflows/scheduled-jobs",
                icon: Clock,
            },
        ],
    },
    {
        title: "Misc",
        items: [
            {
                title: "Product Settings",
                url: "/settings/product",
                icon: Package,
            },
            {
                title: "Product Simulator",
                url: "/settings/product/simulator",
                icon: Play,
            },
        ],
    },
];

interface DashboardSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userName?: string;
    userEmail?: string;
}

export function DashboardSidebar({ userName, userEmail, ...props }: DashboardSidebarProps) {
    const { activeProfile } = useBankProfile();
    const mods = activeProfile.enabledModules;

    const gatedGroups = React.useMemo(() => {
        return navGroups
            .filter((group) => !group.moduleKey || mods[group.moduleKey])
            .map((group) => ({
                ...group,
                items: group.items.filter((item) => !item.moduleKey || mods[item.moduleKey]),
            }))
            .filter((group) => group.items.length > 0);
    }, [mods]);

    const sidebarUser = {
        name: userName || "Admin",
        email: userEmail || "",
        avatar: "",
    };

    return (
        <Sidebar collapsible="icon" className="border-r shadow-sm bg-background/95 lg:bg-background/50 backdrop-blur-xl" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/dashboard" className="flex items-center gap-2 w-full group-data-[collapsible=icon]:!justify-center">
                                <Logo
                                    className="w-full"
                                    iconClassName="bg-sidebar-primary text-sidebar-primary-foreground size-8"
                                    subtitle={`${activeProfile.shortName} Admin`}
                                    subtitleClassName="text-primary/80 uppercase tracking-widest font-medium"
                                />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupContent>
                        <ScopeSelector role="admin" />
                        <SidebarMenu>
                            <SidebarMenuItem className="flex flex-row gap-2 mt-4 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center">
                                <SidebarMenuButton
                                    asChild
                                    tooltip="Teller & Operations Desk"
                                    className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:!justify-center"
                                >
                                    <a href="/dashboard/operations">
                                        <PlusCircleIcon className="w-4 h-4 shrink-0" />
                                        <span>Teller Posting</span>
                                    </a>
                                </SidebarMenuButton>
                                <Button
                                    asChild
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    variant="outline"
                                    title="Maker-Checker Approvals"
                                >
                                    <a href="/dashboard/operations?tab=approvals">
                                        <MailIcon className="w-4 h-4" />
                                        <span className="sr-only">Approvals Queue</span>
                                    </a>
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <NavMain groups={gatedGroups} />
            </SidebarContent>
            <SidebarFooter>
                <div className="sm:hidden px-2 pb-2 flex justify-center">
                    <ThemeCustomizer />
                </div>
                <NavUser user={sidebarUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
