"use client"

import * as React from "react"
import { useBankProfile } from "@/context/bank-profile-context"

interface BankPageHeaderProps {
    badge: string
    livePill?: string
    liveTone?: "emerald" | "amber" | "rose" | "primary"
    title: string
    subtitle: string
    actions?: React.ReactNode
}

export function BankPageHeader({
    badge,
    livePill,
    liveTone = "emerald",
    title,
    subtitle,
    actions,
}: BankPageHeaderProps) {
    const { activeProfile } = useBankProfile()

    const toneCls =
        liveTone === "emerald"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/25"
            : liveTone === "amber"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/25"
              : liveTone === "rose"
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/25"
                : "bg-primary/10 text-primary border-primary/25"

    const dotCls =
        liveTone === "emerald"
            ? "bg-emerald-500"
            : liveTone === "amber"
              ? "bg-amber-500"
              : liveTone === "rose"
                ? "bg-rose-500"
                : "bg-primary"

    return (
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-border/80">
            <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                        {badge}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border text-[10px] font-bold">
                        {activeProfile.shortName} · {activeProfile.ussdCode}
                    </span>
                    {livePill && (
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-wider ${toneCls}`}
                        >
                            <span className={`size-1.5 rounded-full animate-pulse ${dotCls}`} />
                            {livePill}
                        </span>
                    )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
                    {title}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium max-w-3xl leading-relaxed">
                    {subtitle}
                </p>
            </div>
            {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
        </header>
    )
}
