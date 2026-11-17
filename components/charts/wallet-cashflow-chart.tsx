"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    TrendingUp,
    ArrowUpRight,
    ArrowDownLeft,
    Wallet,
    Calendar,
    Sparkles,
    CheckCircle2
} from "lucide-react"

const fmt = (n: number) => `₦${Math.round(Number(n || 0)).toLocaleString()}`

export interface WalletCashPoint {
    date: string
    inflow: number
    outflow: number
    netFloat: number
}

interface WalletCashflowChartProps {
    title?: string
    subtitle?: string
}

function generateWalletCashflow(days: number): WalletCashPoint[] {
    const points: WalletCashPoint[] = []
    const now = new Date()
    let cumFloat = 65000

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)

        // Realistic artisan/operator daily rhythm
        const isAjoDay = i % 7 === 0
        const isHpDay = i % 7 === 2
        
        let inflow = 8500 + Math.round(Math.sin(i / 2) * 3500) + (i % 3 === 0 ? 12000 : 0)
        let outflow = 3200 + (isAjoDay ? 10000 : 0) + (isHpDay ? 12500 : 0)

        cumFloat += (inflow - outflow)
        cumFloat = Math.max(15000, cumFloat)

        points.push({
            date: d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
            inflow,
            outflow,
            netFloat: cumFloat
        })
    }

    return points
}

export function WalletCashflowChart({
    title = "Cash-Flow Velocity & Net Float",
    subtitle = "Daily deposits and trade inflows vs automated cooperative deductions"
}: WalletCashflowChartProps) {
    const [timeframe, setTimeframe] = React.useState<"7D" | "14D" | "30D">("14D")
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

    const daysCount = timeframe === "7D" ? 7 : timeframe === "14D" ? 14 : 30
    const data = React.useMemo(() => generateWalletCashflow(daysCount), [daysCount])

    const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1]

    const totalInflow = data.reduce((acc, p) => acc + p.inflow, 0)
    const totalOutflow = data.reduce((acc, p) => acc + p.outflow, 0)
    const netRetained = totalInflow - totalOutflow

    // Chart dimensions
    const width = 800
    const height = 220
    const paddingX = 20
    const paddingTop = 20
    const paddingBottom = 28

    const maxVal = Math.max(...data.map(p => Math.max(p.inflow, p.outflow, p.netFloat * 0.4))) * 1.15 || 1
    const getX = (index: number) => paddingX + (index / (data.length - 1)) * (width - paddingX * 2)
    const getY = (val: number) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom)

    const buildBezier = (values: number[]) => {
        if (values.length === 0) return ""
        const pts = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }))
        let path = `M ${pts[0].x} ${pts[0].y}`
        for (let i = 0; i < pts.length - 1; i++) {
            const p0 = pts[i]
            const p1 = pts[i + 1]
            const cx = (p0.x + p1.x) / 2
            path += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`
        }
        return path
    }

    const inflowPath = buildBezier(data.map(d => d.inflow))
    const outflowPath = buildBezier(data.map(d => d.outflow))
    const inflowArea = data.length > 0
        ? `${inflowPath} L ${getX(data.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`
        : ""

    return (
        <div className="bg-card border border-border rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            Cash Velocity
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">Reconciled Live</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-foreground mt-1">{title}</h3>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">{subtitle}</p>
                </div>

                <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                    {(["7D", "14D", "30D"] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                timeframe === tf
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/80">
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Inflows</span>
                    <p className="text-sm sm:text-base font-black text-foreground mt-0.5">{fmt(totalInflow)}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/80">
                    <span className="text-[9px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">Deductions &amp; Debits</span>
                    <p className="text-sm sm:text-base font-black text-foreground mt-0.5">{fmt(totalOutflow)}</p>
                </div>
                <div className="p-2.5 rounded-2xl bg-muted/30 border border-border/80">
                    <span className="text-[9px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">Net Retained</span>
                    <p className="text-sm sm:text-base font-black text-foreground mt-0.5">{fmt(netRetained)}</p>
                </div>
            </div>

            {/* Active inspection banner */}
            {activePoint && (
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-border rounded-xl p-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                        <span className="font-black text-foreground">{activePoint.date}:</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">+{fmt(activePoint.inflow)}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">-{fmt(activePoint.outflow)}</span>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground">Float: <strong>{fmt(activePoint.netFloat)}</strong></span>
                </div>
            )}

            {/* SVG Visual */}
            <div className="relative w-full overflow-hidden select-none">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-44 sm:h-52 overflow-visible">
                    <defs>
                        <linearGradient id="walletInflowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Inflow Area */}
                    <motion.path
                        d={inflowArea}
                        fill="url(#walletInflowGrad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                    />

                    {/* Inflow Line (Emerald) */}
                    <motion.path
                        d={inflowPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                    />

                    {/* Outflow Line (Amber) */}
                    <motion.path
                        d={outflowPath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2"
                        strokeDasharray="4 3"
                        strokeLinecap="round"
                    />

                    {/* Interactive Points */}
                    {data.map((p, idx) => {
                        const x = getX(idx)
                        const y = getY(p.inflow)
                        const isHovered = hoverIndex === idx

                        return (
                            <g
                                key={idx}
                                onMouseEnter={() => setHoverIndex(idx)}
                                onClick={() => setHoverIndex(idx)}
                                className="cursor-pointer"
                            >
                                <rect
                                    x={x - (width / data.length) / 2}
                                    y={0}
                                    width={width / data.length}
                                    height={height}
                                    fill="transparent"
                                />
                                {isHovered && (
                                    <line
                                        x1={x}
                                        y1={paddingTop}
                                        x2={x}
                                        y2={height - paddingBottom}
                                        stroke="#10b981"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                        opacity="0.7"
                                    />
                                )}
                                <circle
                                    cx={x}
                                    cy={y}
                                    r={isHovered ? "6" : "3"}
                                    fill={isHovered ? "#10b981" : "#ffffff"}
                                    stroke="#10b981"
                                    strokeWidth="2"
                                />
                                <text
                                    x={x}
                                    y={height - 6}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    opacity={isHovered ? "1" : "0.5"}
                                    fontSize="8"
                                    fontWeight="700"
                                >
                                    {p.date.split(" ")[0]}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground pt-1 border-t border-border/80">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-emerald-500 rounded-full" /> Inflow
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2.5 h-1 bg-amber-500 rounded-full border border-dashed" /> Deductions
                    </span>
                </div>
                <span>Hover to inspect transactions</span>
            </div>
        </div>
    )
}
