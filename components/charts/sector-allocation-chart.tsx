"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { HeartPulse, Truck, Wheat, Award, Landmark, TrendingUp } from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`

export interface SectorAllocation {
    sector: "health" | "transport" | "agriculture" | "commerce" | "other"
    partnerName: string
    shortName: string
    allocatedKobo: number
    activeEnrollees: number
    yieldRate: number
    color: string
    bgLight: string
    border: string
    icon: any
}

const DEFAULT_SECTOR_DATA: SectorAllocation[] = [
    {
        sector: "health",
        partnerName: "Abia State Health Insurance Agency (ABSHIA)",
        shortName: "ABSHIA Health Cover",
        allocatedKobo: 4500000000,
        activeEnrollees: 2840,
        yieldRate: 15.5,
        color: "text-rose-500",
        bgLight: "bg-rose-500/10",
        border: "border-rose-500/20",
        icon: HeartPulse
    },
    {
        sector: "transport",
        partnerName: "Ministry of Transport / Simba TVS Commercial Fleet",
        shortName: "ATMA & TVS Mobility",
        allocatedKobo: 3200000000,
        activeEnrollees: 1450,
        yieldRate: 17.2,
        color: "text-blue-500",
        bgLight: "bg-blue-500/10",
        border: "border-blue-500/20",
        icon: Truck
    },
    {
        sector: "agriculture",
        partnerName: "USAID / Feed the Future Agribusiness Matching Grants",
        shortName: "USAID Agro Clusters",
        allocatedKobo: 1800000000,
        activeEnrollees: 950,
        yieldRate: 14.8,
        color: "text-amber-500",
        bgLight: "bg-amber-500/10",
        border: "border-amber-500/20",
        icon: Wheat
    },
    {
        sector: "commerce",
        partnerName: "SMEDAN Artisan Tooling & Machinery Facility",
        shortName: "SMEDAN MSME Guilds",
        allocatedKobo: 1500000000,
        activeEnrollees: 868,
        yieldRate: 16.0,
        color: "text-emerald-500",
        bgLight: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        icon: Award
    }
]

export function SectorAllocationChart({
    title = "Institutional Underwriting by Sector",
    subtitle = "Live allocation of syndicated investment capital across state parastatals and verified sectors",
    allocations = DEFAULT_SECTOR_DATA
}: {
    title?: string
    subtitle?: string
    allocations?: SectorAllocation[]
}) {
    const { activeProfile } = useBankProfile()
    const totalAllocated = allocations.reduce((acc, a) => acc + a.allocatedKobo, 0)
    const totalEnrollees = allocations.reduce((acc, a) => acc + a.activeEnrollees, 0)

    return (
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5 font-sans">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Sector Syndication
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                            {totalEnrollees.toLocaleString()} Cooperative Beneficiaries
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                        {title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold max-w-xl">
                        {subtitle}
                    </p>
                </div>

                <div className="text-left sm:text-right">
                    <span className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">
                        Total Capital Underwritten
                    </span>
                    <p className="text-lg sm:text-xl font-black text-foreground font-mono">
                        {fmt(totalAllocated / 100)}
                    </p>
                </div>
            </div>

            {/* Horizontal Stacked Multi-Bar Visual */}
            <div className="space-y-2">
                <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-muted/40 p-0.5 border border-border/60">
                    {allocations.map((a, idx) => {
                        const pct = totalAllocated > 0 ? (a.allocatedKobo / totalAllocated) * 100 : 0
                        return (
                            <div
                                key={idx}
                                style={{ width: `${pct}%` }}
                                className={`h-full first:rounded-l-full last:rounded-r-full transition-all duration-500 ${
                                    a.sector === "health" ? "bg-rose-500" :
                                    a.sector === "transport" ? "bg-blue-500" :
                                    a.sector === "agriculture" ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                                title={`${a.shortName}: ${pct.toFixed(1)}%`}
                            />
                        )
                    })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground font-bold">
                    <span>Low Risk Statutory Float</span>
                    <span>100% Repayment Guarantee by {activeProfile.shortName}</span>
                </div>
            </div>

            {/* Sector Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {allocations.map((a, idx) => {
                    const Icon = a.icon
                    const pct = totalAllocated > 0 ? ((a.allocatedKobo / totalAllocated) * 100).toFixed(0) : "0"
                    return (
                        <div
                            key={idx}
                            className="p-3.5 rounded-2xl bg-muted/20 border border-border/60 space-y-2 hover:border-border transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className={`p-1.5 rounded-xl border ${a.bgLight} ${a.color} ${a.border}`}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    +{a.yieldRate}% APY
                                </span>
                            </div>

                            <div>
                                <h4 className="text-xs font-black text-foreground truncate">{a.shortName}</h4>
                                <p className="text-[10px] text-muted-foreground truncate">{a.partnerName}</p>
                            </div>

                            <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                                <span className="font-mono font-black text-foreground">{fmt(a.allocatedKobo / 100)}</span>
                                <span className="text-[10px] text-muted-foreground font-bold">{pct}% share</span>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    )
}
