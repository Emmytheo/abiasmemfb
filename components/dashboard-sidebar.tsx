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

const navGroups = [
    {
        title: "General",
        items: [
            {
                title: "Dashboard",
                url: "/dashboard",
                icon: LayoutDashboard,
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
                title: "Loans",
                url: "/products/loans",
                icon: CreditCard,
            },
        ],
    },
    {
        title: "Services",
        items: [
            { title: "Bills", url: "/services/bills", icon: Tag },
            { title: "School Fees", url: "/services/school-fees", icon: GraduationCap },
            { title: "Utilities", url: "/services/utilities", icon: Lightbulb },
            { title: "e-Pins", url: "/services/e-pins", icon: Hash },
            { title: "Internet Banking", url: "/services/internet-banking", icon: Wifi },
        ],
    },
    {
        title: "Misc",
        items: [
            {
                title: "Global Content",
                url: "/settings/global-content",
                icon: Globe,
            },
            {
                title: "Product Settings",
                url: "/settings/product",
                icon: Package,
            },
        ],
    },
];
import { NavUser } from "@/components/nav-user";

export function DashboardSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    // Temporary mock user matching the header
    const sidebarUser = {
        name: "Admin User",
        email: "admin@abiabank.local",
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
                                    subtitle="Admin Portal"
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
                                <SidebarMenuButton
                                    tooltip="Quick Create"
                                    className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground group-data-[collapsible=icon]:!justify-center"
                                >
                                    <PlusCircleIcon className="w-4 h-4 shrink-0" />
                                    <span>Quick Create</span>
                                </SidebarMenuButton>
                                <Button
                                    size="icon"
                                    className="h-9 w-9 shrink-0"
                                    variant="outline"
                                >
                                    <MailIcon className="w-4 h-4" />
                                    <span className="sr-only">Inbox</span>
                                </Button>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarHeader>
            <SidebarContent className="px-2 py-4">
                <NavMain groups={navGroups} />
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
