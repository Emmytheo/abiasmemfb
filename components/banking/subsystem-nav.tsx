"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    Workflow,
    History,
    Wifi,
    Plug,
    Shield,
    Link2,
    Clock,
    RefreshCw,
    Layers,
    Package,
    Tag,
    Zap,
    Play,
    Sparkles,
} from "lucide-react"

interface SubsystemItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    exact?: boolean
}

const AUTOMATION_ITEMS: SubsystemItem[] = [
    { label: "Workflows", href: "/workflows", icon: Workflow, exact: true },
    { label: "Run History", href: "/workflows/runs", icon: History },
    { label: "API Endpoints", href: "/endpoints", icon: Wifi },
    { label: "Service Providers", href: "/workflows/providers", icon: Plug },
    { label: "Secret Vault", href: "/workflows/vault", icon: Shield },
    { label: "Provider Mappings", href: "/settings/mappings", icon: Link2 },
    { label: "Scheduled Jobs", href: "/workflows/scheduled-jobs", icon: Clock },
    { label: "Sync & Discovery", href: "/settings/sync", icon: RefreshCw },
]

const FACTORY_ITEMS: SubsystemItem[] = [
    { label: "Product Classes", href: "/settings/product/classes", icon: Layers },
    { label: "Product Categories", href: "/settings/product/categories", icon: Package },
    { label: "Product Types", href: "/settings/product/types", icon: Package },
    { label: "Product Simulator", href: "/settings/product/simulator", icon: Play },
    { label: "Service Categories", href: "/settings/service/categories", icon: Tag },
    { label: "Services", href: "/settings/service/list", icon: Zap },
    { label: "Service Simulator", href: "/settings/service/simulator", icon: Play },
    { label: "Registry Blueprints", href: "/settings/registry", icon: Sparkles },
]

export function SubsystemNav({
    group,
    compact = false,
}: {
    group: "automation" | "factory"
    compact?: boolean
}) {
    const pathname = usePathname() || ""
    const items = group === "automation" ? AUTOMATION_ITEMS : FACTORY_ITEMS

    return (
        <nav
            aria-label={group === "automation" ? "Automation & Integrations Subsystems" : "Product & Service Factory Subsystems"}
            className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar ${
                compact
                    ? "px-4 py-2 bg-card/90 border-b border-border/80"
                    : "p-1.5 rounded-2xl bg-muted/50 border border-border/70"
            }`}
        >
            {items.map((item) => {
                const Icon = item.icon
                const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`)
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                            active
                                ? "bg-background text-primary shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                        }`}
                    >
                        <Icon className="h-3.5 w-3.5" />
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )
}
