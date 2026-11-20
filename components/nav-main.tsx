"use client";

import { type LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
    useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
    groups,
}: {
    groups: {
        title?: string;
        items: {
            title: string;
            url: string;
            icon?: LucideIcon;
            items?: {
                title: string;
                url: string;
                icon?: LucideIcon;
            }[];
        }[];
    }[];
}) {
    const pathname = usePathname();
    const { setOpenMobile, isMobile } = useSidebar();

    const isActive = (url: string) => {
        if (url === "/dashboard" || url === "/client-dashboard") {
            return pathname === url;
        }
        return pathname === url || pathname.startsWith(url + "/");
    };

    return (
        <>
            {groups.map((group, index) => (
                <SidebarGroup key={index} className="py-1.5">
                    {group.title && (
                        <SidebarGroupLabel className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 font-black mb-1 px-2.5">
                            {group.title}
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent className="flex flex-col gap-0.5">
                        <SidebarMenu>
                            {group.items.map((item) => {
                                const active = isActive(item.url);
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton tooltip={item.title} isActive={active} asChild>
                                            <Link
                                                href={item.url}
                                                onClick={() => isMobile && setOpenMobile(false)}
                                                className={`relative flex items-center gap-3 w-full rounded-xl px-2.5 py-2 transition-all duration-150 group-data-[collapsible=icon]:!justify-center ${
                                                    active
                                                        ? "bg-primary/12 text-primary font-bold shadow-[inset_0_0_0_1px_hsl(var(--primary)/0.2)]"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60 font-medium"
                                                }`}
                                            >
                                                {active && (
                                                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary group-data-[collapsible=icon]:hidden" />
                                                )}
                                                {item.icon && (
                                                    <item.icon
                                                        className={`h-4 w-4 shrink-0 transition-transform ${
                                                            active ? "text-primary scale-105" : "text-muted-foreground/80"
                                                        }`}
                                                    />
                                                )}
                                                <span className="truncate group-data-[collapsible=icon]:hidden">{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {item.items?.length ? (
                                            <SidebarMenuSub>
                                                {item.items.map((subItem) => {
                                                    const subActive = isActive(subItem.url);
                                                    return (
                                                        <SidebarMenuSubItem key={subItem.title}>
                                                            <SidebarMenuSubButton asChild isActive={subActive}>
                                                                <Link
                                                                    href={subItem.url}
                                                                    onClick={() => isMobile && setOpenMobile(false)}
                                                                    className={`flex items-center gap-2 rounded-lg transition-colors ${
                                                                        subActive ? "text-primary font-bold bg-primary/10" : "text-muted-foreground hover:text-foreground"
                                                                    }`}
                                                                >
                                                                    {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                                                    <span>{subItem.title}</span>
                                                                </Link>
                                                            </SidebarMenuSubButton>
                                                        </SidebarMenuSubItem>
                                                    );
                                                })}
                                            </SidebarMenuSub>
                                        ) : null}
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
