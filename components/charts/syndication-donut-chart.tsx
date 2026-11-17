"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, ShieldCheck, TrendingUp, Users2, Landmark } from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`

export interface DonutSegment {
    label: string
    value: number
    color: string
    description?: string
    percentage?: number
}

interface SyndicationDonutChartProps {
    title?: string
    subtitle?: string
    segments?: DonutSegment[]
    totalLabel?: string
    totalValue?: number
    centerSubtext?: string
}

export function SyndicationDonutChart({
    title = "Institutional Syndication & Float Composition",
    subtitle,
    segments: propSegments,
    totalLabel = "Total Tranche Pool",
    totalValue: propTotalValue,
    centerSubtext = "Active in Circulation"
}: SyndicationDonutChartProps) {
    const { activeProfile } = useBankProfile()
    const resolvedSubtitle = subtitle || `Tripartite co-funding ratio between statutory parastatals, private investors, and ${activeProfile.shortName}`
    const defaultSegments: DonutSegment[] = [
        {
            label: "Statutory Parastatal Float",
            value: 65000000,
            color: "#3b82f6",
            description: "Dedicated government wholesale pre-payment escrow"
        },
        {
            label: "Syndicated Private Investor Capital",
            value: 36000000,
            color: "#10b981",
            description: "Diaspora & institutional tranches earning 16.5% p.a."
        },
        {
            label: `${activeProfile.shortName} Liquidity Buffer`,
            value: 12500000,
            color: "#8b5cf6",
            description: "Statutory reserve & emergency float clearing"
        }
    ]

    const segments = propSegments || defaultSegments
    const total = propTotalValue || segments.reduce((acc, s) => acc + s.value, 0)
    
    const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null)

    // Calculate angles for donut slices
    const size = 220
    const center = size / 2
    const radius = 80
    const innerRadius = 54
    const strokeWidth = radius - innerRadius

    let accumulatedAngle = 0
    const slices = segments.map((seg, idx) => {
        const pct = total > 0 ? (seg.value / total) : 0
        const angle = pct * 360
        const startAngle = accumulatedAngle
        const endAngle = accumulatedAngle + angle
        accumulatedAngle = endAngle

        // SVG arc path calculation
        const startRad = (startAngle - 90) * (Math.PI / 180)
        const endRad = (endAngle - 90) * (Math.PI / 180)

        const x1 = center + radius * Math.cos(startRad)
        const y1 = center + radius * Math.sin(startRad)
        const x2 = center + radius * Math.cos(endRad)
        const y2 = center + radius * Math.sin(endRad)

        const x3 = center + innerRadius * Math.cos(endRad)
        const y3 = center + innerRadius * Math.sin(endRad)
        const x4 = center + innerRadius * Math.cos(startRad)
        const y4 = center + innerRadius * Math.sin(startRad)

        const largeArc = angle > 180 ? 1 : 0

        const path = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
            `L ${x3} ${y3}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
            "Z"
        ].join(" ")

        return {
            ...seg,
            index: idx,
            percentage: Math.round(pct * 100),
            path
        }
    })

    const activeItem = hoveredIdx !== null ? slices[hoveredIdx] : null

    return (
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5 font-sans">
            
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                        <PieChart className="h-3 w-3" /> Capital Syndication Model
                    </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-foreground">
                    {title}
                </h3>
                <p className="text-xs text-muted-foreground font-semibold max-w-xl">
                    {resolvedSubtitle}
                </p>
            </div>

            {/* Content: Donut + Legend */}
            <div className="flex flex-col items-center justify-center gap-6 pt-2">
                
                {/* SVG Donut Visual */}
                <div className="relative shrink-0 flex items-center justify-center">
                    <svg
                        width={size}
                        height={size}
                        className="transform -rotate-90 overflow-visible"
                    >
                        {slices.map((slice, idx) => {
                            const isHovered = hoveredIdx === idx
                            return (
                                <path
                                    key={idx}
                                    d={slice.path}
                                    fill={slice.color}
                                    className="transition-all duration-300 cursor-pointer"
                                    style={{
                                        transformOrigin: `${center}px ${center}px`,
                                        transform: isHovered ? "scale(1.05)" : "scale(1)",
                                        filter: isHovered ? "drop-shadow(0px 4px 8px rgba(0,0,0,0.2))" : "none"
                                    }}
                                    onMouseEnter={() => setHoveredIdx(idx)}
                                    onMouseLeave={() => setHoveredIdx(null)}
                                />
                            )
                        })}
                    </svg>

                    {/* Donut Center Label */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
                        <span className="text-[9px] uppercase tracking-wider font-black text-muted-foreground block truncate max-w-[120px]">
                            {activeItem ? activeItem.label : totalLabel}
                        </span>
                        <p className="text-base sm:text-lg font-black text-foreground mt-0.5 font-mono">
                            {activeItem ? fmt(activeItem.value) : fmt(total)}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-600 block">
                            {activeItem ? `${activeItem.percentage}% Allocation` : centerSubtext}
                        </span>
                    </div>
                </div>

                {/* Interactive Legend List */}
                <div className="w-full space-y-2.5">
                    {slices.map((slice, idx) => {
                        const isHovered = hoveredIdx === idx
                        return (
                            <div
                                key={idx}
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                                    isHovered 
                                        ? "bg-muted/70 border-blue-500/50 shadow-sm" 
                                        : "bg-muted/20 border-border/50 hover:bg-muted/40"
                                }`}
                            >
                                <div className="flex items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <span
                                            className="h-3 w-3 rounded-md shrink-0"
                                            style={{ backgroundColor: slice.color }}
                                        />
                                        <div className="min-w-0">
                                            <p className="font-black text-foreground text-xs">{slice.label}</p>
                                            <p className="text-[10px] text-muted-foreground line-clamp-1">{slice.description}</p>
                                        </div>
                                    </div>

                                    <div className="text-right shrink-0">
                                        <span className="font-black text-foreground block font-mono text-xs">{fmt(slice.value)}</span>
                                        <span className="text-[10px] font-bold text-muted-foreground">{slice.percentage}%</span>
                                    </div>
                                </div>

                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>

            </div>

        </div>
    )
}
