"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
} from "@/components/ui/breadcrumb";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

export function DashboardBreadcrumb() {
    const pathname = usePathname();
    const isMobile = useIsMobile();

    const segments = (pathname || "").split('/').filter(Boolean);

    if (segments.length === 0) return null;

    // Helper to format segments
    const formatSegment = (segment: string) => {
        return segment
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Skip the word "dashboard" or "client-dashboard" if it's the first segment to prevent Home > Dashboard > Dashboard
    const isBaseSegment = segments[0] === "dashboard" || segments[0] === "client-dashboard";
    const displaySegments = isBaseSegment ? segments.slice(1) : segments;

    // Determine if we need to truncate based on device and length
    const ITEMS_TO_DISPLAY = isMobile ? 2 : 4;
    const shouldTruncate = displaySegments.length > ITEMS_TO_DISPLAY;

    return (
        <Breadcrumb className="flex w-full min-w-0">
            <BreadcrumbList className="flex-nowrap whitespace-nowrap overflow-hidden">
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link href="/dashboard" className="flex items-center gap-1">
                            <Home className="h-3.5 w-3.5" />
                            <span className="sr-only">Home</span>
                        </Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>

                {shouldTruncate ? (
                    <>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 outline-none">
                                    <BreadcrumbEllipsis className="h-4 w-4" />
                                    <span className="sr-only">Toggle menu</span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {displaySegments.slice(0, -1).map((segment, index) => {
                                        const originalIndex = isBaseSegment ? index + 1 : index;
                                        const path = `/${segments.slice(0, originalIndex + 1).join('/')}`;
                                        return (
                                            <DropdownMenuItem key={path} asChild>
                                                <Link href={path}>{formatSegment(segment)}</Link>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator>
                            <ChevronRight className="h-3.5 w-3.5" />
                        </BreadcrumbSeparator>
                        <BreadcrumbItem>
                            <BreadcrumbPage className="max-w-[80px] sm:max-w-[200px] truncate">
                                {formatSegment(displaySegments[displaySegments.length - 1])}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </>
                ) : (
                    displaySegments.map((segment, index) => {
                        const isLast = index === displaySegments.length - 1;
                        const originalIndex = isBaseSegment ? index + 1 : index;
                        const path = `/${segments.slice(0, originalIndex + 1).join('/')}`;

                        return (
                            <React.Fragment key={path}>
                                <BreadcrumbSeparator>
                                    <ChevronRight className="h-3.5 w-3.5" />
                                </BreadcrumbSeparator>
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage className="max-w-[80px] sm:max-w-[200px] truncate">{formatSegment(segment)}</BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link href={path} className="max-w-[80px] sm:max-w-[200px] truncate">{formatSegment(segment)}</Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </React.Fragment>
                        );
                    })
                )}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
