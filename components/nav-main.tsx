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

    const isActive = (url: string) => {
        return pathname === url || pathname.startsWith(url + "/");
    };

    return (
        <>
            {groups.map((group, index) => (
                <SidebarGroup key={index}>
                    {group.title && (
                        <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground/70 font-semibold mb-2">
                            {group.title}
                        </SidebarGroupLabel>
                    )}
                    <SidebarGroupContent className="flex flex-col gap-2">
                        <SidebarMenu>
                            {group.items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton tooltip={item.title} isActive={isActive(item.url)} asChild>
                                        <Link href={item.url} className={`flex items-center gap-3 w-full group-data-[collapsible=icon]:!justify-center ${isActive(item.url) ? 'bg-primary/10 text-primary font-bold' : ''}`}>
                                            {item.icon && <item.icon className={`h-4 w-4 shrink-0 ${isActive(item.url) ? 'text-primary' : ''}`} />}
                                            <span className="group-data-[collapsible=icon]:hidden">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                    {item.items?.length ? (
                                        <SidebarMenuSub>
                                            {item.items.map((subItem) => (
                                                <SidebarMenuSubItem key={subItem.title}>
                                                    <SidebarMenuSubButton asChild isActive={isActive(subItem.url)}>
                                                        <Link href={subItem.url} className={`flex items-center gap-2 ${isActive(subItem.url) ? 'text-primary font-bold' : ''}`}>
                                                            {subItem.icon && <subItem.icon className="h-3 w-3" />}
                                                            <span>{subItem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    ) : null}
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            ))}
        </>
    );
}
