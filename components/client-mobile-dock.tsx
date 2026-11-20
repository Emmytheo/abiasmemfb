"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    Send,
    CreditCard,
    Users,
    Receipt,
    Briefcase,
    Menu,
    Wallet,
    ShieldCheck,
} from "lucide-react"
import { useSidebar } from "@/components/ui/sidebar"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"

export function ClientMobileDock() {
    const pathname = usePathname()
    const { toggleSidebar } = useSidebar()
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()
    const mods = activeProfile.enabledModules

    const items = React.useMemo(() => {
        if (activeScope.type === "business") {
            return [
                { label: "Home", href: "/client-dashboard", icon: LayoutDashboard },
                ...(mods.merchantApiAndPayroll ? [{ label: "Invoices", href: "/client-dashboard/invoices", icon: Receipt }] : []),
                ...(mods.merchantApiAndPayroll ? [{ label: "Gateway", href: "/merchant", icon: Briefcase }] : []),
                { label: "Transfers", href: "/client-dashboard/transfers", icon: Send },
            ]
        }
        if (activeScope.type === "coop") {
            return [
                { label: "Home", href: "/client-dashboard", icon: LayoutDashboard },
                { label: "Esusu", href: "/esusu", icon: Users },
                { label: "Roster", href: "/esusu/manage", icon: ShieldCheck },
                { label: "Fund", href: "/pay/fund", icon: Wallet },
            ]
        }
        return [
            { label: "Home", href: "/client-dashboard", icon: LayoutDashboard },
            { label: "Transfer", href: "/client-dashboard/transfers", icon: Send },
            ...(mods.smartCards ? [{ label: "Cards", href: "/my-cards", icon: CreditCard }] : [{ label: "Fund", href: "/pay/fund", icon: Wallet }]),
            ...(mods.cooperativeEsusu ? [{ label: "Esusu", href: "/esusu", icon: Users }] : [{ label: "History", href: "/client-dashboard/transactions", icon: Receipt }]),
        ]
    }, [activeScope.type, mods])

    return (
        <nav
            aria-label="Mobile Client Navigation"
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-2xl border-t border-border/80 px-2 pt-1.5 flex items-center justify-around shadow-[0_-8px_30px_rgba(0,0,0,0.08)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.4)] safe-area-pb"
        >
            {items.map((item) => {
                const isRoot = item.href === "/client-dashboard"
                const isActive = isRoot ? pathname === item.href : pathname.startsWith(item.href)
                const Icon = item.icon
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        className={`relative flex flex-col items-center justify-center min-h-[44px] min-w-[54px] py-1 px-2 rounded-2xl transition-all active:scale-95 ${
                            isActive
                                ? "text-primary bg-primary/10 font-black"
                                : "text-muted-foreground hover:text-foreground font-semibold"
                        }`}
                    >
                        {isActive && (
                            <span className="absolute -top-1.5 w-6 h-1 rounded-full bg-primary shadow-sm" />
                        )}
                        <Icon className={`h-4 w-4 ${isActive ? "scale-110" : ""} transition-transform`} />
                        <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                            {item.label}
                        </span>
                    </Link>
                )
            })}
            <button
                type="button"
                onClick={toggleSidebar}
                className="flex flex-col items-center justify-center min-h-[44px] min-w-[54px] py-1 px-2 rounded-2xl text-muted-foreground hover:text-foreground font-semibold transition-all active:scale-95"
            >
                <Menu className="h-4 w-4" />
                <span className="text-[10px] mt-0.5 tracking-tight">Menu</span>
            </button>
        </nav>
    )
}
