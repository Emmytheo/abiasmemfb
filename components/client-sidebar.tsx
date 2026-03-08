"use client";

import * as React from "react";
import {
    LayoutDashboard,
    Package,
    Landmark,
    CreditCard,
    Briefcase,
    Lightbulb,
    Hash,
    Wifi,
    Settings,
    Tag,
    ListOrdered,
    Search,
    History,
    Building,
    MailIcon,
    PhoneCall,
    FileText,
    User
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
import { NavUser } from "@/components/nav-user";
import { ThemeCustomizer } from "@/components/theme-customizer";
import { Logo } from "@/components/ui/logo";
import { ServiceCategory } from "@/lib/api/types";

type NavGroup = {
    title: string;
    items: { title: string; url: string; icon: any }[];
    minRole?: "user" | "customer";
};

const IconMap: Record<string, any> = {
    tag: Tag,
    wifi: Wifi,
    user: User,
    lightbulb: Lightbulb,
    hash: Hash,
    landmark: Landmark,
    creditcard: CreditCard,
    package: Package,
    briefcase: Briefcase,
    listordered: ListOrdered,
};

const navGroups: NavGroup[] = [
    {
        title: "General",
        minRole: "user",
        items: [
            {
                title: "Overview",
                url: "/client-dashboard",
                icon: LayoutDashboard,
            },
        ],
    },
    {
        title: "My Portfolio",
        minRole: "user",
        items: [
            {
                title: "My Assets & Accounts",
                url: "/my-products",
                icon: Landmark,
            },
            {
                title: "My Loans",
                url: "/my-loans",
                icon: CreditCard,
            },
            {
                title: "Transaction History",
                url: "/client-dashboard/transactions",
                icon: History,
            },
            {
                title: "My Applications",
                url: "/applications",
                icon: FileText,
            },
        ],
    },
    {
        title: "Explore Products",
        minRole: "user",
        items: [
            {
                title: "Open Account",
                url: "/explore/accounts",
                icon: Package,
            },
            {
                title: "Apply for Loan",
                url: "/explore/loans",
                icon: Briefcase,
            },
        ],
    },
    // Services Hub will be dynamically injected here
    {
        title: "Support & Settings",
        minRole: "user",
        items: [
            {
                title: "Preferences",
                url: "/settings",
                icon: Settings,
            },
        ],
    },
];

const ROLE_LEVEL: Record<string, number> = { user: 0, customer: 1, admin: 2 };

interface ClientSidebarProps extends React.ComponentProps<typeof Sidebar> {
    userRole?: "user" | "customer" | "admin";
    userName?: string;
    userEmail?: string;
    serviceCategories?: ServiceCategory[];
}

export function ClientSidebar({ userRole = "user", userName, userEmail, serviceCategories = [], ...props }: ClientSidebarProps) {
    const roleLevel = ROLE_LEVEL[userRole] ?? 0;

    // Dynamically insert the Services Hub group if there are active categories
    const dynamicNavGroups = [...navGroups];
    if (serviceCategories.length > 0) {
        // Insert right before "Support & Settings" (which is the last item)
        dynamicNavGroups.splice(dynamicNavGroups.length - 1, 0, {
            title: "Services Hub",
            minRole: "customer",
            items: serviceCategories.map(cat => ({
                title: cat.name,
                url: `/pay/${cat.slug}`,
                icon: IconMap[cat.icon?.toLowerCase() || ''] || Tag,
            }))
        });
    }

    // Filter nav groups based on user role
    const filteredGroups = dynamicNavGroups.filter((group) => {
        const minLevel = ROLE_LEVEL[group.minRole || "user"] ?? 0;
        return roleLevel >= minLevel;
    });

    const sidebarUser = {
        name: userName || "User",
        email: userEmail || "",
        avatar: "",
    };

    return (
        <Sidebar collapsible="icon" className="border-r shadow-sm bg-background/95 lg:bg-background/50 backdrop-blur-xl" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="/client-dashboard" className="flex items-center gap-2 w-full group-data-[collapsible=icon]:!justify-center">
                                <Logo
                                    className="w-full"
                                    iconClassName="bg-sidebar-primary text-sidebar-primary-foreground size-8"
                                    subtitle="Customer Portal"
                                    subtitleClassName="text-primary/80 uppercase tracking-widest font-medium"
                                />
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem className="flex flex-col gap-2 mt-4 group-data-[collapsible=icon]:items-center">
                                <div className="bg-accent/50 p-3 rounded-lg border w-full text-center">
                                    <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold mb-1">Personal Advisor</p>
                                    <p className="text-sm font-bold truncate">Julian Sterling</p>
                                    <Button size="sm" className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all border border-primary/20 flex items-center justify-center gap-2 shadow-none h-7">
                                        <PhoneCall className="h-3 w-3" />
                                        Contact
                                    </Button>
                                </div>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <NavMain groups={filteredGroups} />
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
