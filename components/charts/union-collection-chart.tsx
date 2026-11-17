"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    CircleDollarSign,
    TrendingUp,
    Users,
    ShieldCheck,
    PiggyBank,
    Truck,
    CheckCircle2,
    Calendar,
    ArrowUpRight,
    Zap,
    Building2,
    Landmark
} from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"

const fmt = (n: number) => `₦${Math.round(Number(n || 0)).toLocaleString()}`

export interface UnionWeekCollection {
    week: string
    date: string
    totalCollected: number
    ajoThrift: number
    hpLeaseRepayments: number
    unionDues: number
    settledToEscrow: number
    recoverySla: number // percentage e.g. 98.4
}

interface UnionCollectionChartProps {
    unionName?: string
    memberCount?: number
    defaultTimeframe?: "4W" | "12W" | "24W"
}

function generateUnionWeeklyData(weeksCount: number, memberCount: number = 450): UnionWeekCollection[] {
    const points: UnionWeekCollection[] = []
    const now = new Date()

    for (let i = weeksCount - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)

        const baseAjo = memberCount * 9200 + (Math.sin(i / 2) * 180000)
        const baseHp = (memberCount * 0.3) * 12500 + (Math.cos(i / 3) * 80000)
        const baseDues = memberCount * 500
        const total = Math.round(baseAjo + baseHp + baseDues)
        const settled = Math.round(total * 0.985)
        const sla = Number((97.5 + (Math.sin(i) * 1.5) + (Math.random() * 0.5)).toFixed(1))

        points.push({
            week: `Wk ${weeksCount - i}`,
            date: d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
            totalCollected: total,
            ajoThrift: Math.round(baseAjo),
            hpLeaseRepayments: Math.round(baseHp),
            unionDues: Math.round(baseDues),
            settledToEscrow: settled,
            recoverySla: Math.min(100, Math.max(90, sla))
        })
    }

    return points
}

export function UnionCollectionChart({
    unionName,
    memberCount = 450,
    defaultTimeframe = "12W"
}: UnionCollectionChartProps) {
    const { activeProfile } = useBankProfile()
    const resolvedUnionName = unionName || activeProfile.demoCoopName
    const [timeframe, setTimeframe] = React.useState<"4W" | "12W" | "24W">(defaultTimeframe)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [activeLayer, setActiveLayer] = React.useState<"all" | "ajo" | "hp" | "settled">("all")

    const weeksCount = timeframe === "4W" ? 4 : timeframe === "12W" ? 12 : 24
    const data = React.useMemo(() => {
        return generateUnionWeeklyData(weeksCount, memberCount)
    }, [weeksCount, memberCount])

    const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1]

    const totalPeriodCollections = data.reduce((acc, p) => acc + p.totalCollected, 0)
    const totalAjo = data.reduce((acc, p) => acc + p.ajoThrift, 0)
    const totalHp = data.reduce((acc, p) => acc + p.hpLeaseRepayments, 0)
    const totalEscrowSettled = data.reduce((acc, p) => acc + p.settledToEscrow, 0)
    const avgSla = (data.reduce((acc, p) => acc + p.recoverySla, 0) / data.length).toFixed(1)

    // Chart dimensions
    const width = 800
    const height = 240
    const paddingX = 24
    const paddingTop = 20
    const paddingBottom = 30

    const maxVal = Math.max(...data.map(p => p.totalCollected)) * 1.15 || 1
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

    const totalPath = buildBezier(data.map(d => d.totalCollected))
    const settledPath = buildBezier(data.map(d => d.settledToEscrow))
    const totalAreaPath = data.length > 0
        ? `${totalPath} L ${getX(data.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`
        : ""

    return (
        <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Union Clearing & Settlement Velocity
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                            {memberCount} Active Operators Enrolled
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-foreground mt-1.5">
                        Weekly Collections, Thrift & Escrow Remittance
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                        Real-time tracking of {resolvedUnionName} collections reconciled directly into {activeProfile.shortName} Escrow Vault #{activeProfile.demoAccountNumber}.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                        {(["4W", "12W", "24W"] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                    timeframe === tf
                                        ? "bg-amber-500 text-black shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Total Collections</span>
                        <CircleDollarSign className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalPeriodCollections)}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Ajo + Lease + Dues</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Settled to Escrow</span>
                        <Landmark className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalEscrowSettled)}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">{activeProfile.shortName} Vault</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Vehicle HP Inflows</span>
                        <Truck className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalHp)}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">TVS King tranches</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Repayment SLA</span>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{avgSla}%</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Zero delinquency record</p>
                </div>
            </div>

            {/* Interactive Active Point Inspection Banner */}
            {activePoint && (
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] uppercase font-black text-muted-foreground">{activePoint.week}</span>
                            <span className="text-xs font-black">{activePoint.date.split(" ")[0]}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-foreground">{activePoint.week} ({activePoint.date}) Clearing Cycle</span>
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                    SLA Compliance: {activePoint.recoverySla}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">· Escrow Ref: TX-CLR-90{activePoint.week.replace("Wk ", "")}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold mt-1 flex-wrap">
                                <span>Collected: <strong className="text-foreground">{fmt(activePoint.totalCollected)}</strong></span>
                                <span>•</span>
                                <span>Ajo: <strong className="text-amber-600 dark:text-amber-400">{fmt(activePoint.ajoThrift)}</strong></span>
                                <span>•</span>
                                <span>HP Lease: <strong className="text-blue-600 dark:text-blue-400">{fmt(activePoint.hpLeaseRepayments)}</strong></span>
                                <span>•</span>
                                <span>Settled to Bank: <strong className="text-emerald-600 dark:text-emerald-400">{fmt(activePoint.settledToEscrow)}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground shrink-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        Hover points to inspect weekly reconciliation
                    </div>
                </div>
            )}

            {/* Visual SVG Chart */}
            <div className="relative w-full overflow-hidden select-none">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 sm:h-64 overflow-visible">
                    <defs>
                        <linearGradient id="unionCollGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="unionSettledGrad" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#10b981" />
                            <stop offset="100%" stopColor="#059669" />
                        </linearGradient>
                    </defs>

                    {/* Subtle Horizontal grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                        const y = paddingTop + pct * (height - paddingTop - paddingBottom)
                        const val = maxVal * (1 - pct)
                        return (
                            <g key={i}>
                                <line
                                    x1={paddingX}
                                    y1={y}
                                    x2={width - paddingX}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeOpacity="0.08"
                                    strokeDasharray="4 4"
                                />
                                <text
                                    x={paddingX + 4}
                                    y={y - 4}
                                    fill="currentColor"
                                    opacity="0.4"
                                    fontSize="9"
                                    fontWeight="700"
                                >
                                    {fmt(val)}
                                </text>
                            </g>
                        )
                    })}

                    {/* Total Collections Area */}
                    <motion.path
                        d={totalAreaPath}
                        fill="url(#unionCollGrad)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6 }}
                    />

                    {/* Total Collections Curve (Amber) */}
                    <motion.path
                        d={totalPath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                    />

                    {/* Settled to Escrow Curve (Emerald Dashed) */}
                    <motion.path
                        d={settledPath}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeDasharray="5 3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                    />

                    {/* Data Points */}
                    {data.map((p, idx) => {
                        const x = getX(idx)
                        const yTotal = getY(p.totalCollected)
                        const isHovered = hoverIndex === idx
                        const isLast = idx === data.length - 1

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
                                        stroke="#f59e0b"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                        opacity="0.8"
                                    />
                                )}

                                <circle
                                    cx={x}
                                    cy={yTotal}
                                    r={isHovered ? "7" : isLast ? "5" : "3.5"}
                                    fill={isHovered ? "#f59e0b" : "#ffffff"}
                                    stroke="#f59e0b"
                                    strokeWidth={isHovered ? "3" : "2"}
                                    className="transition-all duration-200"
                                />

                                <text
                                    x={x}
                                    y={height - 8}
                                    textAnchor="middle"
                                    fill="currentColor"
                                    opacity={isHovered || isLast ? "1" : "0.5"}
                                    fontSize={isHovered ? "10" : "9"}
                                    fontWeight={isHovered ? "900" : "700"}
                                >
                                    {p.week}
                                </text>
                            </g>
                        )
                    })}
                </svg>
            </div>

            {/* Legend & Tripartite Synergy Footer */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/80">
                <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-1 bg-amber-500 rounded-full" /> Total Member Collections
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 h-1 bg-emerald-500 rounded-full border border-dashed" /> Settled to Bank Escrow
                    </span>
                </div>
                <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    All settlements verified on core MFB ledger
                </div>
            </div>
        </div>
    )
}
