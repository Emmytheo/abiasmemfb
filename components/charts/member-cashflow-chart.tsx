"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    TrendingUp, 
    PiggyBank, 
    Truck, 
    HeartPulse, 
    Wallet, 
    Sparkles, 
    ShieldCheck, 
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Layers
} from "lucide-react"

const fmt = (n: number) => `₦${Math.round(Number(n || 0)).toLocaleString()}`

export interface MemberWeekPoint {
    week: string
    date: string
    totalInflow: number
    ajoSavings: number
    hpAmortization: number
    healthCoverage: number
    retainedFloat: number
    cumulativeSavings: number
    creditPts: number
}

interface MemberCashflowChartProps {
    title?: string
    subtitle?: string
    initialBalance?: number
    weeklyAjo?: number
    weeklyHp?: number
    weeklyHealth?: number
}

// Generate realistic weekly member progression
function generateMemberProgression(weeksCount: number, weeklyAjo: number = 10000, weeklyHp: number = 12500, weeklyHealth: number = 300): MemberWeekPoint[] {
    const points: MemberWeekPoint[] = []
    const now = new Date()
    let cumSavings = 0
    let currentCredit = 737

    for (let i = weeksCount - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i * 7)

        // Passenger / artisan velocity varies by week with steady growth
        const baseInflow = 42000 + (Math.sin(i / 2) * 6000) + ((weeksCount - i) * 800)
        const totalInflow = Math.round(baseInflow)
        
        const ajo = weeklyAjo
        const hp = weeklyHp
        const health = weeklyHealth
        const totalDeductions = ajo + hp + health
        const retainedFloat = Math.max(0, totalInflow - totalDeductions)

        cumSavings += ajo
        if (i % 2 === 0) currentCredit += 3

        points.push({
            week: `Wk ${weeksCount - i}`,
            date: d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
            totalInflow,
            ajoSavings: ajo,
            hpAmortization: hp,
            healthCoverage: health,
            retainedFloat,
            cumulativeSavings: cumSavings,
            creditPts: Math.min(850, currentCredit)
        })
    }

    return points
}

export function MemberCashflowChart({
    title = "Weekly Velocity & Savings Trajectory",
    subtitle = "Visual breakdown of your weekly earnings, rotational Ajo savings, and asset amortization",
    weeklyAjo = 10000,
    weeklyHp = 12500,
    weeklyHealth = 300
}: MemberCashflowChartProps) {
    const [timeframe, setTimeframe] = React.useState<"4W" | "12W" | "24W">("12W")
    const [viewMode, setViewMode] = React.useState<"trajectory" | "breakdown">("trajectory")
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)

    const weeksCount = timeframe === "4W" ? 4 : timeframe === "12W" ? 12 : 24

    const data = React.useMemo(() => {
        return generateMemberProgression(weeksCount, weeklyAjo, weeklyHp, weeklyHealth)
    }, [weeksCount, weeklyAjo, weeklyHp, weeklyHealth])

    const activePoint = hoverIndex !== null && data[hoverIndex] ? data[hoverIndex] : data[data.length - 1]

    const totalAjoAccumulated = data.reduce((acc, p) => acc + p.ajoSavings, 0)
    const totalHpPaid = data.reduce((acc, p) => acc + p.hpAmortization, 0)
    const totalHealthPaid = data.reduce((acc, p) => acc + p.healthCoverage, 0)
    const totalRetainedFloat = data.reduce((acc, p) => acc + p.retainedFloat, 0)

    // Chart dimensions
    const width = 800
    const height = 240
    const paddingX = 24
    const paddingTop = 20
    const paddingBottom = 30

    // Coordinate math for cumulative trajectory curve
    const maxCum = Math.max(...data.map(p => p.cumulativeSavings)) * 1.15 || 1
    const getX = (index: number) => paddingX + (index / (data.length - 1)) * (width - paddingX * 2)
    const getY = (val: number) => height - paddingBottom - (val / maxCum) * (height - paddingTop - paddingBottom)

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

    const trajectoryPath = buildBezier(data.map(d => d.cumulativeSavings))
    const areaPath = data.length > 0
        ? `${trajectoryPath} L ${getX(data.length - 1)} ${height - paddingBottom} L ${getX(0)} ${height - paddingBottom} Z`
        : ""

    // Math for weekly breakdown stacked bars
    const maxWeekTotal = Math.max(...data.map(p => p.totalInflow)) * 1.15 || 1

    return (
        <div className="bg-card border border-border rounded-3xl p-5 sm:p-7 space-y-6 shadow-sm relative overflow-hidden">
            {/* Top Header & Filters */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="h-3 w-3" /> Member Financial Intelligence
                        </span>
                        <span className="text-[10px] font-bold text-muted-foreground">
                            Live Synced with Cooperative Escrow
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-foreground mt-1.5">{title}</h3>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{subtitle}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* View Switcher */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                        <button
                            onClick={() => setViewMode("trajectory")}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                viewMode === "trajectory"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Accumulation Curve
                        </button>
                        <button
                            onClick={() => setViewMode("breakdown")}
                            className={`px-3 py-1 rounded-lg text-xs font-black transition-all ${
                                viewMode === "breakdown"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            Weekly Cashflow
                        </button>
                    </div>

                    {/* Timeframe Switcher */}
                    <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border">
                        {(["4W", "12W", "24W"] as const).map(tf => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                    timeframe === tf
                                        ? "bg-emerald-500 text-black shadow-sm"
                                        : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Quick Summary Pill Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Ajo Thrift Pool</span>
                        <PiggyBank className="h-3.5 w-3.5 text-amber-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalAjoAccumulated)}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">100% on-time clearance</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Asset Lease Equity</span>
                        <Truck className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalHpPaid)}</p>
                    <p className="text-[10px] text-muted-foreground font-semibold">TVS Keke paid down</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">Retained Pocket Float</span>
                        <Wallet className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalRetainedFloat)}</p>
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">In-hand disposable</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/80 space-y-1">
                    <div className="flex items-center justify-between text-muted-foreground">
                        <span className="text-[9px] font-black uppercase tracking-wider">ABSHIA Health Premium</span>
                        <HeartPulse className="h-3.5 w-3.5 text-rose-500" />
                    </div>
                    <p className="text-base font-black text-foreground">{fmt(totalHealthPaid)}</p>
                    <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Subsidized at ₦300/wk</p>
                </div>
            </div>

            {/* Active Period Inspection Header Banner */}
            {activePoint && (
                <div className="bg-slate-50 dark:bg-slate-950/80 border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex flex-col items-center justify-center shrink-0">
                            <span className="text-[9px] uppercase font-black text-muted-foreground">{activePoint.week}</span>
                            <span className="text-xs font-black">{activePoint.date.split(" ")[0]}</span>
                        </div>
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-black text-foreground">{activePoint.week} ({activePoint.date}) Ledger Telemetry</span>
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                    Rating: {activePoint.creditPts} pts
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold mt-1 flex-wrap">
                                <span>Inflow: <strong className="text-foreground">{fmt(activePoint.totalInflow)}</strong></span>
                                <span>•</span>
                                <span>Ajo: <strong className="text-amber-600 dark:text-amber-400">{fmt(activePoint.ajoSavings)}</strong></span>
                                <span>•</span>
                                <span>Lease: <strong className="text-emerald-600 dark:text-emerald-400">{fmt(activePoint.hpAmortization)}</strong></span>
                                <span>•</span>
                                <span>Health: <strong className="text-rose-600 dark:text-rose-400">{fmt(activePoint.healthCoverage)}</strong></span>
                                <span>•</span>
                                <span>Retained: <strong className="text-blue-600 dark:text-blue-400">{fmt(activePoint.retainedFloat)}</strong></span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground shrink-0">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Hover or tap data points to inspect
                    </div>
                </div>
            )}

            {/* SVG Visual Chart */}
            <div className="relative w-full overflow-hidden select-none">
                {viewMode === "trajectory" ? (
                    /* ── ACCUMULATION BEZIER CURVE ───────────────────────── */
                    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-56 sm:h-64 overflow-visible">
                        <defs>
                            <linearGradient id="memberSavingsGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
                                <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                            </linearGradient>
                            <linearGradient id="memberStrokeGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#f59e0b" />
                                <stop offset="50%" stopColor="#10b981" />
                                <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                        </defs>

                        {/* Subtle Horizontal grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                            const y = paddingTop + pct * (height - paddingTop - paddingBottom)
                            const val = maxCum * (1 - pct)
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

                        {/* Gradient Area Fill */}
                        <motion.path
                            d={areaPath}
                            fill="url(#memberSavingsGrad)"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        />

                        {/* Main Bezier Line */}
                        <motion.path
                            d={trajectoryPath}
                            fill="none"
                            stroke="url(#memberStrokeGrad)"
                            strokeWidth="3.5"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                        />

                        {/* Interactive Data Points & Hover Targets */}
                        {data.map((p, idx) => {
                            const x = getX(idx)
                            const y = getY(p.cumulativeSavings)
                            const isHovered = hoverIndex === idx
                            const isLast = idx === data.length - 1

                            return (
                                <g
                                    key={idx}
                                    onMouseEnter={() => setHoverIndex(idx)}
                                    onClick={() => setHoverIndex(idx)}
                                    className="cursor-pointer"
                                >
                                    {/* Large invisible hit area */}
                                    <rect
                                        x={x - (width / data.length) / 2}
                                        y={0}
                                        width={width / data.length}
                                        height={height}
                                        fill="transparent"
                                    />

                                    {/* Vertical Crosshair Line */}
                                    {isHovered && (
                                        <line
                                            x1={x}
                                            y1={paddingTop}
                                            x2={x}
                                            y2={height - paddingBottom}
                                            stroke="#10b981"
                                            strokeWidth="1.5"
                                            strokeDasharray="3 3"
                                            opacity="0.8"
                                        />
                                    )}

                                    {/* Glowing dot */}
                                    <circle
                                        cx={x}
                                        cy={y}
                                        r={isHovered ? "7" : isLast ? "5" : "3.5"}
                                        fill={isHovered ? "#10b981" : "#ffffff"}
                                        stroke="#10b981"
                                        strokeWidth={isHovered ? "3" : "2"}
                                        className="transition-all duration-200"
                                    />

                                    {/* Week label at bottom */}
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
                ) : (
                    /* ── WEEKLY STACKED BREAKDOWN BARS ───────────────────── */
                    <div className="overflow-x-auto no-scrollbar pb-2">
                        <div className="flex items-end gap-2 sm:gap-4 h-60 px-3 pt-12 pb-6 min-w-[580px] relative">
                            {data.map((p, idx) => {
                                const isHovered = hoverIndex === idx
                                const total = p.totalInflow
                                const totalHeightPct = Math.min(100, Math.max(15, (total / maxWeekTotal) * 100))

                                // Breakdown percentages
                                const ajoPct = (p.ajoSavings / total) * 100
                                const hpPct = (p.hpAmortization / total) * 100
                                const healthPct = (p.healthCoverage / total) * 100
                                const retainedPct = Math.max(0, 100 - (ajoPct + hpPct + healthPct))

                                return (
                                    <div
                                        key={idx}
                                        onMouseEnter={() => setHoverIndex(idx)}
                                        onClick={() => setHoverIndex(idx)}
                                        className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group relative cursor-pointer"
                                    >
                                        {/* Value Label */}
                                        <span className={`text-[9px] font-black transition-all ${
                                            isHovered ? "text-emerald-500 scale-110" : "text-muted-foreground opacity-60"
                                        }`}>
                                            {fmt(p.totalInflow)}
                                        </span>

                                        {/* Stacked Bar Container */}
                                        <div
                                            style={{ height: `${totalHeightPct}%` }}
                                            className={`w-full rounded-xl overflow-hidden flex flex-col-reverse transition-all border ${
                                                isHovered
                                                    ? "ring-2 ring-emerald-500 shadow-lg border-emerald-400"
                                                    : "border-border/60"
                                            }`}
                                        >
                                            {/* Stack 1: Ajo Contribution (Amber) */}
                                            <div
                                                style={{ height: `${ajoPct}%` }}
                                                className="bg-amber-500 hover:bg-amber-400 transition-colors"
                                                title={`Ajo Thrift: ${fmt(p.ajoSavings)}`}
                                            />
                                            {/* Stack 2: HP Vehicle Lease (Emerald) */}
                                            <div
                                                style={{ height: `${hpPct}%` }}
                                                className="bg-emerald-500 hover:bg-emerald-400 transition-colors"
                                                title={`HP Lease: ${fmt(p.hpAmortization)}`}
                                            />
                                            {/* Stack 3: ABSHIA Health (Rose) */}
                                            <div
                                                style={{ height: `${Math.max(4, healthPct)}%` }}
                                                className="bg-rose-500 hover:bg-rose-400 transition-colors"
                                                title={`ABSHIA Health: ${fmt(p.healthCoverage)}`}
                                            />
                                            {/* Stack 4: Retained In-Pocket Float (Blue/Cyan) */}
                                            <div
                                                style={{ height: `${retainedPct}%` }}
                                                className="bg-sky-600/70 dark:bg-sky-500/60 hover:bg-sky-500 transition-colors"
                                                title={`Retained Float: ${fmt(p.retainedFloat)}`}
                                            />
                                        </div>

                                        {/* Week Label */}
                                        <span className={`text-[9px] font-black tracking-tight whitespace-nowrap ${
                                            isHovered ? "text-foreground font-black" : "text-muted-foreground"
                                        }`}>
                                            {p.week}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Holistic Tripartite Ecosystem Explainer Callout */}
            <div className="bg-gradient-to-r from-emerald-950/20 via-background to-blue-950/20 border border-emerald-500/20 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h4 className="text-xs font-black text-foreground flex items-center gap-1.5">
                            Tripartite Ecosystem Protection Loop
                            <span className="text-[9px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                Active Parastatal Guarantee
                            </span>
                        </h4>
                        <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                            Your weekly ₦300 deduction keeps your ABSHIA state health coverage active at FMC Umuahia. Your TVS King lease is co-underwritten by private investors, and every on-time clearance boosts your credit rating (+8 pts).
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
                        <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Ajo
                        <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 ml-2" /> HP Lease
                        <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 ml-2" /> ABSHIA
                        <span className="w-2.5 h-2.5 rounded-sm bg-sky-500 ml-2" /> Float
                    </div>
                </div>
            </div>
        </div>
    )
}
