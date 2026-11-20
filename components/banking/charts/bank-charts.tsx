"use client"

import * as React from "react"
import { TrendingUp, PieChart, ShieldCheck, Activity } from "lucide-react"

const fmtCompact = (n: number) =>
    `₦${Number(n || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`
const fmtFull = (n: number) => `₦${Math.round(Number(n || 0)).toLocaleString()}`

export interface CashflowPoint {
    date: string
    inflowNaira: number
    outflowNaira: number
    feeNaira?: number
}

/**
 * 1. Smooth Dual-Curve Interactive Treasury & Cashflow Telemetry Chart
 * Uses real PostgreSQL daily buckets (padded cleanly across the chosen window so sparse days still render crisp axes).
 */
export function TreasuryCashflowChart({
    title = "Treasury Inflow & Liquidity Velocity",
    subtitle = "Posted ledger inflows vs disbursements & transfers across core channels",
    data = [],
    badgeLabel = "Live Ledger Telemetry",
}: {
    title?: string
    subtitle?: string
    data?: CashflowPoint[]
    badgeLabel?: string
}) {
    const [timeframe, setTimeframe] = React.useState<"7D" | "14D" | "30D">("14D")
    const [hoverIdx, setHoverIdx] = React.useState<number | null>(null)
    const [seriesFilter, setSeriesFilter] = React.useState<"all" | "inflow" | "outflow">("all")

    const points = React.useMemo(() => {
        const count = timeframe === "7D" ? 7 : timeframe === "14D" ? 14 : 30
        const map = new Map<string, CashflowPoint>()
        for (const d of data) map.set(d.date, d)

        const out: CashflowPoint[] = []
        const now = new Date()
        for (let i = count - 1; i >= 0; i--) {
            const dt = new Date(now)
            dt.setDate(dt.getDate() - i)
            const lbl = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
            const matched = map.get(lbl)
            out.push({
                date: lbl,
                inflowNaira: matched?.inflowNaira || 0,
                outflowNaira: matched?.outflowNaira || 0,
                feeNaira: matched?.feeNaira || 0,
            })
        }
        return out
    }, [data, timeframe])

    const totalInflow = points.reduce((s, p) => s + p.inflowNaira, 0)
    const totalOutflow = points.reduce((s, p) => s + p.outflowNaira, 0)
    const netFlow = totalInflow - totalOutflow

    const width = 760
    const height = 220
    const padX = 24
    const padTop = 22
    const padBottom = 28

    const maxVal = Math.max(1000, ...points.map((p) => Math.max(p.inflowNaira, p.outflowNaira))) * 1.18
    const getX = (i: number) =>
        points.length <= 1 ? padX : padX + (i / (points.length - 1)) * (width - padX * 2)
    const getY = (v: number) => height - padBottom - (v / maxVal) * (height - padTop - padBottom)

    const buildSmoothPath = (vals: number[]) => {
        if (vals.length === 0) return ""
        const coords = vals.map((v, i) => ({ x: getX(i), y: getY(v) }))
        let d = `M ${coords[0].x},${coords[0].y}`
        for (let i = 1; i < coords.length; i++) {
            const prev = coords[i - 1]
            const curr = coords[i]
            const midX = (prev.x + curr.x) / 2
            d += ` C ${midX},${prev.y} ${midX},${curr.y} ${curr.x},${curr.y}`
        }
        return d
    }

    const inflowPath = buildSmoothPath(points.map((p) => p.inflowNaira))
    const outflowPath = buildSmoothPath(points.map((p) => p.outflowNaira))
    const baseY = height - padBottom
    const inflowArea = `${inflowPath} L ${getX(points.length - 1)},${baseY} L ${getX(0)},${baseY} Z`
    const outflowArea = `${outflowPath} L ${getX(points.length - 1)},${baseY} L ${getX(0)},${baseY} Z`

    const activePoint = hoverIdx !== null ? points[hoverIdx] : null
    const labelIndices = [
        0,
        Math.floor((points.length - 1) * 0.25),
        Math.floor((points.length - 1) * 0.5),
        Math.floor((points.length - 1) * 0.75),
        points.length - 1,
    ]

    return (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                            <TrendingUp className="h-3 w-3" /> {badgeLabel}
                        </span>
                        <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                netFlow >= 0
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                            }`}
                        >
                            Net {netFlow >= 0 ? "+" : ""}
                            {fmtCompact(netFlow)}
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">{title}</h3>
                    <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
                </div>

                <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/70 self-start">
                    {(["7D", "14D", "30D"] as const).map((tf) => (
                        <button
                            key={tf}
                            type="button"
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all ${
                                timeframe === tf
                                    ? "bg-card text-foreground shadow-sm border border-border/70"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Clickable metric filter strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-2xl bg-muted/30 border border-border/60">
                <button
                    type="button"
                    onClick={() => setSeriesFilter(seriesFilter === "inflow" ? "all" : "inflow")}
                    className={`p-3 rounded-xl text-left transition-all border ${
                        seriesFilter === "inflow"
                            ? "bg-emerald-500/10 border-emerald-500/35"
                            : "bg-card/70 border-transparent hover:border-border"
                    }`}
                >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-emerald-500" />
                        {activePoint ? `Inflow (${activePoint.date})` : `Credits (${timeframe})`}
                    </div>
                    <p className="text-base sm:text-lg font-black tabular-nums-fintech text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fmtFull(activePoint ? activePoint.inflowNaira : totalInflow)}
                    </p>
                </button>

                <button
                    type="button"
                    onClick={() => setSeriesFilter(seriesFilter === "outflow" ? "all" : "outflow")}
                    className={`p-3 rounded-xl text-left transition-all border ${
                        seriesFilter === "outflow"
                            ? "bg-blue-500/10 border-blue-500/35"
                            : "bg-card/70 border-transparent hover:border-border"
                    }`}
                >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-blue-600" />
                        {activePoint ? `Outflow (${activePoint.date})` : `Debits & Disbursals (${timeframe})`}
                    </div>
                    <p className="text-base sm:text-lg font-black tabular-nums-fintech text-foreground mt-0.5">
                        {fmtFull(activePoint ? activePoint.outflowNaira : totalOutflow)}
                    </p>
                </button>

                <div className="p-3 rounded-xl bg-card/70 text-left">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                        <span className="size-2 rounded-full bg-amber-500" />
                        Net Liquidity Delta
                    </div>
                    <p
                        className={`text-base sm:text-lg font-black tabular-nums-fintech mt-0.5 ${
                            (activePoint ? activePoint.inflowNaira - activePoint.outflowNaira : netFlow) >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-amber-600 dark:text-amber-400"
                        }`}
                    >
                        {fmtFull(activePoint ? activePoint.inflowNaira - activePoint.outflowNaira : netFlow)}
                    </p>
                </div>
            </div>

            {/* Interactive SVG Plot */}
            <div className="relative w-full select-none">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-52 sm:h-60 overflow-visible"
                    onMouseLeave={() => setHoverIdx(null)}
                >
                    <defs>
                        <linearGradient id="bsInflowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
                        </linearGradient>
                        <linearGradient id="bsOutflowGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.18" />
                            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.01" />
                        </linearGradient>
                    </defs>

                    {[0.25, 0.5, 0.75, 1].map((r, i) => {
                        const y = baseY - r * (height - padTop - padBottom)
                        return (
                            <g key={i}>
                                <line
                                    x1={padX}
                                    y1={y}
                                    x2={width - padX}
                                    y2={y}
                                    stroke="currentColor"
                                    strokeDasharray="3 3"
                                    className="text-border/70"
                                    strokeWidth="1"
                                />
                            </g>
                        )
                    })}

                    {(seriesFilter === "all" || seriesFilter === "inflow") && (
                        <>
                            <path d={inflowArea} fill="url(#bsInflowGrad)" />
                            <path d={inflowPath} fill="none" stroke="#10b981" strokeWidth="2.6" strokeLinecap="round" />
                        </>
                    )}
                    {(seriesFilter === "all" || seriesFilter === "outflow") && (
                        <>
                            <path d={outflowArea} fill="url(#bsOutflowGrad)" />
                            <path d={outflowPath} fill="none" stroke="#2563eb" strokeWidth="2.4" strokeLinecap="round" />
                        </>
                    )}

                    {hoverIdx !== null && (
                        <g>
                            <line
                                x1={getX(hoverIdx)}
                                y1={padTop}
                                x2={getX(hoverIdx)}
                                y2={baseY}
                                stroke="currentColor"
                                strokeWidth="1.25"
                                strokeDasharray="3 3"
                                className="text-muted-foreground/60"
                            />
                            <circle cx={getX(hoverIdx)} cy={getY(points[hoverIdx].inflowNaira)} r="5" fill="#10b981" stroke="#fff" strokeWidth="2" />
                            <circle cx={getX(hoverIdx)} cy={getY(points[hoverIdx].outflowNaira)} r="5" fill="#2563eb" stroke="#fff" strokeWidth="2" />
                        </g>
                    )}

                    {points.map((_, idx) => {
                        const stepW = (width - padX * 2) / Math.max(1, points.length - 1)
                        return (
                            <rect
                                key={idx}
                                x={getX(idx) - stepW / 2}
                                y={0}
                                width={stepW}
                                height={height}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoverIdx(idx)}
                            />
                        )
                    })}

                    {labelIndices.map((idx, k) => (
                        <text
                            key={k}
                            x={getX(idx)}
                            y={height - 6}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-muted-foreground"
                        >
                            {points[idx]?.date}
                        </text>
                    ))}
                </svg>

                {hoverIdx !== null && (
                    <div
                        className="absolute top-1 pointer-events-none transform -translate-x-1/2 bg-popover text-popover-foreground border border-border rounded-xl px-3 py-2 shadow-lg text-[10px] font-bold space-y-0.5 z-20 whitespace-nowrap"
                        style={{ left: `${Math.min(86, Math.max(14, (getX(hoverIdx) / width) * 100))}%` }}
                    >
                        <p className="text-muted-foreground font-mono">{points[hoverIdx].date}</p>
                        <p className="text-emerald-600">Inflow: {fmtFull(points[hoverIdx].inflowNaira)}</p>
                        <p className="text-blue-600">Outflow: {fmtFull(points[hoverIdx].outflowNaira)}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export interface MixSegment {
    label: string
    valueNaira: number
    color: string
    description?: string
}

/**
 * 2. Interactive Deposit & Liability Mix Donut Chart
 */
export function PortfolioMixDonut({
    title = "Regulated Deposit Composition",
    subtitle = "Retail CASA, SME corporate float, Copteller escrow custody & fixed vaults",
    segments = [],
    centerLabel = "Total Deposits",
}: {
    title?: string
    subtitle?: string
    segments: MixSegment[]
    centerLabel?: string
}) {
    const [hovered, setHovered] = React.useState<number | null>(null)
    const total = segments.reduce((s, x) => s + Math.max(0, x.valueNaira), 0)

    const size = 200
    const center = size / 2
    const outerR = 78
    const innerR = 54

    let acc = 0
    const slices = segments.map((seg, idx) => {
        const val = Math.max(0, seg.valueNaira)
        const pct = total > 0 ? val / total : 0
        const sweep = Math.min(359.6, pct * 360)
        const startA = acc
        const endA = acc + sweep
        acc += pct * 360

        const sRad = ((startA - 90) * Math.PI) / 180
        const eRad = ((endA - 90) * Math.PI) / 180
        const x1 = center + outerR * Math.cos(sRad)
        const y1 = center + outerR * Math.sin(sRad)
        const x2 = center + outerR * Math.cos(eRad)
        const y2 = center + outerR * Math.sin(eRad)
        const x3 = center + innerR * Math.cos(eRad)
        const y3 = center + innerR * Math.sin(eRad)
        const x4 = center + innerR * Math.cos(sRad)
        const y4 = center + innerR * Math.sin(sRad)
        const largeArc = sweep > 180 ? 1 : 0

        const path =
            sweep > 0.2
                ? `M ${x1} ${y1} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4} Z`
                : ""

        return { ...seg, val, pct: Math.round(pct * 100), path, idx }
    })

    const active = hovered !== null ? slices[hovered] : null

    return (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm flex flex-col justify-between space-y-5">
            <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black uppercase tracking-wider">
                    <PieChart className="h-3 w-3" /> Balance Sheet Mix
                </span>
                <h3 className="text-base sm:text-lg font-black tracking-tight text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground font-medium">{subtitle}</p>
            </div>

            <div className="flex flex-col items-center gap-5">
                <div className="relative flex items-center justify-center">
                    <svg width={size} height={size} className="overflow-visible">
                        <circle
                            cx={center}
                            cy={center}
                            r={(outerR + innerR) / 2}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={outerR - innerR}
                            className="text-muted/60"
                        />
                        {slices.map((s) =>
                            s.path ? (
                                <path
                                    key={s.idx}
                                    d={s.path}
                                    fill={s.color}
                                    className="transition-all duration-200 cursor-pointer"
                                    style={{
                                        transformOrigin: `${center}px ${center}px`,
                                        transform: hovered === s.idx ? "scale(1.04)" : "scale(1)",
                                    }}
                                    onMouseEnter={() => setHovered(s.idx)}
                                    onMouseLeave={() => setHovered(null)}
                                />
                            ) : null
                        )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
                        <span className="text-[9px] font-black uppercase tracking-wider text-muted-foreground truncate max-w-[100px]">
                            {active ? active.label : centerLabel}
                        </span>
                        <span className="text-base font-black tabular-nums-fintech text-foreground mt-0.5">
                            {fmtCompact(active ? active.val : total)}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600">
                            {active ? `${active.pct}% Share` : "100% Live GL"}
                        </span>
                    </div>
                </div>

                <div className="w-full space-y-2">
                    {slices.map((s) => (
                        <div
                            key={s.idx}
                            onMouseEnter={() => setHovered(s.idx)}
                            onMouseLeave={() => setHovered(null)}
                            className={`p-2.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                                hovered === s.idx
                                    ? "bg-muted/60 border-primary/35"
                                    : "bg-muted/20 border-border/60 hover:bg-muted/40"
                            }`}
                        >
                            <div className="flex items-center justify-between gap-2 text-xs">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                                    <span className="font-bold text-foreground truncate">{s.label}</span>
                                </div>
                                <div className="text-right shrink-0 font-mono text-[11px] font-black">
                                    {fmtCompact(s.val)} <span className="text-muted-foreground font-semibold">({s.pct}%)</span>
                                </div>
                            </div>
                            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full rounded-full transition-all duration-300"
                                    style={{ width: `${Math.max(s.val > 0 ? 3 : 0, s.pct)}%`, backgroundColor: s.color }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

/**
 * 3. Radial CBN Health / Trust Score Ring Gauge (Copteller Credit Ring aesthetic)
 */
export function CbnHealthGauge({
    label,
    value,
    max = 100,
    unit = "%",
    statusText,
    tone = "emerald",
    subtitle,
}: {
    label: string
    value: number
    max?: number
    unit?: string
    statusText: string
    tone?: "emerald" | "amber" | "rose" | "blue"
    subtitle?: string
}) {
    const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100))
    const r = 46
    const circ = 2 * Math.PI * r
    const dashOffset = circ - (pct / 100) * circ

    const stroke =
        tone === "emerald"
            ? "#10b981"
            : tone === "amber"
              ? "#f59e0b"
              : tone === "rose"
                ? "#e11d48"
                : "#2563eb"

    const badgeCls =
        tone === "emerald"
            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            : tone === "amber"
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
              : tone === "rose"
                ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                : "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20"

    return (
        <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex items-center gap-5">
            <div className="relative size-[112px] shrink-0 flex items-center justify-center">
                <svg width="112" height="112" className="-rotate-90">
                    <circle cx="56" cy="56" r={r} fill="none" stroke="currentColor" strokeWidth="9" className="text-muted/60" />
                    <circle
                        cx="56"
                        cy="56"
                        r={r}
                        fill="none"
                        stroke={stroke}
                        strokeWidth="9"
                        strokeLinecap="round"
                        strokeDasharray={circ}
                        strokeDashoffset={dashOffset}
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-black tabular-nums-fintech text-foreground">
                        {unit === "%" ? `${value}%` : value}
                    </span>
                    {unit !== "%" && (
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">{unit}</span>
                    )}
                </div>
            </div>
            <div className="space-y-1.5 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-black ${badgeCls}`}>
                    <ShieldCheck className="h-3 w-3" /> {statusText}
                </span>
                {subtitle && <p className="text-xs text-muted-foreground font-medium leading-snug">{subtitle}</p>}
            </div>
        </div>
    )
}

/**
 * 4. Channel Volume Velocity Bars
 */
export function ChannelVelocityBars({
    channels = [],
}: {
    channels: Array<{ channel: string; txCount: number; volumeNaira: number }>
}) {
    const maxVol = Math.max(1, ...channels.map((c) => c.volumeNaira))
    const colors = ["#0f766e", "#2563eb", "#10b981", "#f59e0b", "#7c3aed"]

    return (
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-wider mb-1">
                        <Activity className="h-3 w-3 text-primary" /> Channel Telemetry
                    </span>
                    <h3 className="text-base font-black text-foreground">Clearing Volume by Channel</h3>
                </div>
            </div>

            {channels.length === 0 ? (
                <p className="text-xs text-muted-foreground py-6 text-center">No posted transactions yet.</p>
            ) : (
                <div className="space-y-3">
                    {channels.map((ch, idx) => {
                        const pct = Math.max(6, Math.round((ch.volumeNaira / maxVol) * 100))
                        return (
                            <div key={ch.channel} className="space-y-1.5">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="font-bold capitalize text-foreground">
                                        {ch.channel.replace(/_/g, " ")} Channel
                                    </span>
                                    <span className="font-mono font-black text-foreground">
                                        {fmtFull(ch.volumeNaira)}{" "}
                                        <span className="text-muted-foreground font-semibold">({ch.txCount} txs)</span>
                                    </span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: `${pct}%`, backgroundColor: colors[idx % colors.length] }}
                                    />
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
