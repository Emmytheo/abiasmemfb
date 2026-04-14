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
    User,
    Users,
    ShieldCheck,
    ArrowRight,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
                title: "Saved Beneficiaries",
                url: "/client-dashboard/beneficiaries",
                icon: Users,
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
                title: "My Profile",
                url: "/client-dashboard/profile",
                icon: User,
            },
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
    onboardingStatus?: 'pending' | 'skipped' | 'completed';
}

export function ClientSidebar({ 
    userRole = "user", 
    userName, 
    userEmail, 
    serviceCategories = [], 
    onboardingStatus = 'completed',
    ...props 
}: ClientSidebarProps) {
    const roleLevel = ROLE_LEVEL[userRole] ?? 0;
    const isPendingOnboarding = onboardingStatus === 'skipped' || onboardingStatus === 'pending';

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

                {/* Action Carousel (Profile Incomplete + Personal Advisor) */}
                <SidebarGroup className="group-data-[collapsible=icon]:hidden">
                    <SidebarGroupContent>
                        <SidebarActionCarousel isPendingOnboarding={isPendingOnboarding} />
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

function SidebarActionCarousel({ isPendingOnboarding }: { isPendingOnboarding: boolean }) {
    const [index, setIndex] = React.useState(0);
    const slides = React.useMemo(() => {
        const items = [];
        if (isPendingOnboarding) {
            items.push(
                <div key="onboarding" className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl space-y-3 mx-2">
                    <div className="flex items-center gap-2 text-orange-600">
                        <ShieldCheck className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-tight">Profile Incomplete</span>
                    </div>
                    <p className="text-[11px] text-orange-700/80 leading-relaxed font-medium">
                        Finish setting up your profile to unlock features.
                    </p>
                    <Button size="sm" variant="link" asChild className="p-0 h-auto text-orange-600 font-bold hover:text-orange-700 text-xs flex items-center gap-1 no-underline">
                        <a href="/onboarding">Complete Now <ArrowRight className="h-3 w-3" /></a>
                    </Button>
                </div>
            );
        }
        items.push(
            <div key="advisor" className="bg-accent/50 p-3 rounded-lg border mx-2 text-center h-full flex flex-col justify-center">
                <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold mb-1">Personal Advisor</p>
                <p className="text-sm font-bold truncate">Julian Sterling</p>
                <Button size="sm" className="w-full mt-2 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-all border border-primary/20 flex items-center justify-center gap-2 shadow-none h-7">
                    <PhoneCall className="h-3 w-3" />
                    Contact
                </Button>
            </div>
        );
        return items;
    }, [isPendingOnboarding]);

    React.useEffect(() => {
        if (slides.length <= 1) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    if (slides.length === 0) return null;

    return (
        <div className="relative group/carousel mt-2 min-h-[120px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="w-full h-full"
                >
                    {slides[index]}
                </motion.div>
            </AnimatePresence>
            
            {slides.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-2">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setIndex(i)}
                            className={`size-1.5 rounded-full transition-all ${index === i ? 'bg-primary w-3' : 'bg-muted-foreground/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function SparklesIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M19 17v4" />
            <path d="M3 5h4" />
            <path d="M17 19h4" />
        </svg>
    )
}

function WalletIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.59l-9.74-1.51A2 2 0 0 1 2 19V9a2 2 0 0 1 2-2h15Z" />
            <path d="M22 10v6" />
        </svg>
    )
}
