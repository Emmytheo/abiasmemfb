"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { TrendingUp, ArrowUpRight, ArrowDownRight, CircleDollarSign, Calendar, RefreshCw } from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"

const fmt = (n: number) => `₦${Number(n || 0).toLocaleString()}`

export interface FlowDataPoint {
    date: string
    deployed: number    // Float deployed / disbursed
    recovered: number   // Amortization inflows recovered
    margin: number      // Net spread yield accrued
}

interface LiquidityFlowChartProps {
    title?: string
    subtitle?: string
    data?: FlowDataPoint[]
    defaultTimeframe?: "7D" | "30D" | "90D" | "1Y"
    accentColor?: string
    onTimeframeChange?: (tf: string) => void
}

// Generate realistic financial progression based on timeframes
function generateSampleData(days: number, scaleMultiplier: number = 1): FlowDataPoint[] {
    const points: FlowDataPoint[] = []
    const now = new Date()
    
    let baseDeployed = 12000000 * scaleMultiplier
    let baseRecovered = 8600000 * scaleMultiplier
    let baseMargin = 1400000 * scaleMultiplier

    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now)
        d.setDate(d.getDate() - i)
        
        // Random micro fluctuations with upward trend
        const dailyDrift = 1 + (Math.sin(i / 3) * 0.08) + (Math.random() * 0.05)
        const deployed = Math.round(baseDeployed * dailyDrift)
        const recovered = Math.round(baseRecovered * (1 + (Math.cos(i / 2.5) * 0.07) + (Math.random() * 0.04)))
        const margin = Math.round(baseMargin * dailyDrift)

        points.push({
            date: d.toLocaleDateString("en-NG", { month: "short", day: "numeric" }),
            deployed,
            recovered,
            margin
        })

        baseDeployed += 180000 * scaleMultiplier
        baseRecovered += 165000 * scaleMultiplier
        baseMargin += 28000 * scaleMultiplier
    }

    return points
}

export function LiquidityFlowChart({
    title = "Float Liquidity & Recovery Velocity",
    subtitle = "Daily wholesale capital deployed vs micro-amortization inflows recycled from cooperatives",
    data,
    defaultTimeframe = "30D",
    accentColor = "#3b82f6"
}: LiquidityFlowChartProps) {
    const { activeProfile } = useBankProfile()
    const [timeframe, setTimeframe] = React.useState<"7D" | "30D" | "90D" | "1Y">(defaultTimeframe)
    const [hoverIndex, setHoverIndex] = React.useState<number | null>(null)
    const [activeMetric, setActiveMetric] = React.useState<"all" | "deployed" | "recovered" | "margin">("all")

    const daysCount = timeframe === "7D" ? 7 : timeframe === "30D" ? 30 : timeframe === "90D" ? 90 : 365
    const chartData = React.useMemo(() => {
        if (data && data.length > 0) return data
        return generateSampleData(daysCount)
    }, [data, daysCount])

    const totalDeployed = chartData.reduce((acc, p) => acc + p.deployed, 0)
    const totalRecovered = chartData.reduce((acc, p) => acc + p.recovered, 0)
    const totalMargin = chartData.reduce((acc, p) => acc + p.margin, 0)
    const recoveryRate = totalDeployed > 0 ? ((totalRecovered / totalDeployed) * 100).toFixed(1) : "0.0"

    // Chart dimensions
    const width = 800
    const height = 240
    const paddingX = 20
    const paddingTop = 25
    const paddingBottom = 30

    // Coordinate mapping
    const maxVal = Math.max(
        ...chartData.map(p => Math.max(p.deployed, p.recovered, p.margin * 3))
    ) * 1.15 || 1

    const getX = (index: number) => paddingX + (index / (chartData.length - 1)) * (width - paddingX * 2)
    const getY = (val: number) => height - paddingBottom - (val / maxVal) * (height - paddingTop - paddingBottom)

    // Build smooth cubic bezier curve
    const buildPath = (values: number[]) => {
        if (values.length === 0) return ""
        const points = values.map((val, idx) => ({ x: getX(idx), y: getY(val) }))
        
        let path = `M ${points[0].x},${points[0].y}`
        for (let i = 1; i < points.length; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            const cp1x = prev.x + (curr.x - prev.x) / 2
            const cp1y = prev.y
            const cp2x = prev.x + (curr.x - prev.x) / 2
            const cp2y = curr.y
            path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`
        }
        return path
    }

    const deployedPath = buildPath(chartData.map(p => p.deployed))
    const recoveredPath = buildPath(chartData.map(p => p.recovered))
    const marginPath = buildPath(chartData.map(p => p.margin * 3))

    const deployedArea = `${deployedPath} L ${getX(chartData.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`
    const recoveredArea = `${recoveredPath} L ${getX(chartData.length - 1)},${height - paddingBottom} L ${getX(0)},${height - paddingBottom} Z`

    const hoveredPoint = hoverIndex !== null ? chartData[hoverIndex] : chartData[chartData.length - 1]

    // X-axis label points (5 evenly spaced labels)
    const labelIndices = [
        0,
        Math.floor((chartData.length - 1) * 0.25),
        Math.floor((chartData.length - 1) * 0.5),
        Math.floor((chartData.length - 1) * 0.75),
        chartData.length - 1
    ]

    return (
        <div className="p-5 sm:p-6 rounded-3xl bg-card border border-border/80 shadow-sm space-y-5 font-sans">
            
            {/* Header with Title and Timeframe Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> Live Telemetry
                        </span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                            {recoveryRate}% Streak SLA
                        </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-foreground">
                        {title}
                    </h3>
                    <p className="text-xs text-muted-foreground font-semibold max-w-xl">
                        {subtitle}
                    </p>
                </div>

                {/* Controls: Timeframe Pills */}
                <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-2xl border border-border/60 self-start sm:self-auto">
                    {(["7D", "30D", "90D", "1Y"] as const).map(tf => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                timeframe === tf
                                    ? "bg-card text-foreground shadow-sm border border-border/80"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Metric Summary Strips */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3 rounded-2xl bg-muted/20 border border-border/50 text-xs">
                <button
                    onClick={() => setActiveMetric(activeMetric === "deployed" ? "all" : "deployed")}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                        activeMetric === "deployed" ? "bg-blue-500/15 border border-blue-500/30" : "hover:bg-muted/40"
                    }`}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Wholesale Deployed</span>
                    </div>
                    <p className="text-sm sm:text-lg font-black text-foreground">{fmt(hoveredPoint.deployed)}</p>
                    <span className="text-[9px] text-muted-foreground font-semibold">Pre-funded liquidity</span>
                </button>

                <button
                    onClick={() => setActiveMetric(activeMetric === "recovered" ? "all" : "recovered")}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                        activeMetric === "recovered" ? "bg-emerald-500/15 border border-emerald-500/30" : "hover:bg-muted/40"
                    }`}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Recycled Inflow</span>
                    </div>
                    <p className="text-sm sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{fmt(hoveredPoint.recovered)}</p>
                    <span className="text-[9px] text-emerald-600 font-bold">₦300/wk micro-amortizations</span>
                </button>

                <button
                    onClick={() => setActiveMetric(activeMetric === "margin" ? "all" : "margin")}
                    className={`p-2.5 rounded-xl text-left transition-all ${
                        activeMetric === "margin" ? "bg-amber-500/15 border border-amber-500/30" : "hover:bg-muted/40"
                    }`}
                >
                    <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span className="text-[10px] font-black uppercase text-muted-foreground tracking-wider">Spread Yield</span>
                    </div>
                    <p className="text-sm sm:text-lg font-black text-amber-600 dark:text-amber-400">{fmt(hoveredPoint.margin)}</p>
                    <span className="text-[9px] text-amber-600 font-bold">+16.5% p.a. investor return</span>
                </button>
            </div>

            {/* ── INTERACTIVE SVG CHART ────────────────────────────────────── */}
            <div className="relative w-full overflow-hidden select-none">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full h-48 sm:h-64 overflow-visible"
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    <defs>
                        <linearGradient id="deployedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="recoveredGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                    </defs>

                    {/* Horizontal grid guide lines */}
                    {[0.2, 0.5, 0.8].map((ratio, idx) => {
                        const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom)
                        return (
                            <line
                                key={idx}
                                x1={paddingX}
                                y1={y}
                                x2={width - paddingX}
                                y2={y}
                                stroke="currentColor"
                                strokeDasharray="3 3"
                                className="text-border/40"
                                strokeWidth="1"
                            />
                        )
                    })}

                    {/* Gradient Fills */}
                    {(activeMetric === "all" || activeMetric === "deployed") && (
                        <path d={deployedArea} fill="url(#deployedGradient)" />
                    )}
                    {(activeMetric === "all" || activeMetric === "recovered") && (
                        <path d={recoveredArea} fill="url(#recoveredGradient)" />
                    )}

                    {/* Stroke Curves */}
                    {(activeMetric === "all" || activeMetric === "deployed") && (
                        <path
                            d={deployedPath}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="transition-all duration-300"
                        />
                    )}
                    {(activeMetric === "all" || activeMetric === "recovered") && (
                        <path
                            d={recoveredPath}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            className="transition-all duration-300"
                        />
                    )}
                    {(activeMetric === "all" || activeMetric === "margin") && (
                        <path
                            d={marginPath}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="2"
                            strokeDasharray="4 4"
                            strokeLinecap="round"
                            className="transition-all duration-300"
                        />
                    )}

                    {/* Hover vertical crosshair & points */}
                    {hoverIndex !== null && (
                        <g>
                            <line
                                x1={getX(hoverIndex)}
                                y1={paddingTop}
                                x2={getX(hoverIndex)}
                                y2={height - paddingBottom}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeDasharray="2 2"
                                className="text-muted-foreground/60"
                            />
                            {/* Deployed dot */}
                            <circle
                                cx={getX(hoverIndex)}
                                cy={getY(chartData[hoverIndex].deployed)}
                                r="5"
                                fill="#3b82f6"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                            {/* Recovered dot */}
                            <circle
                                cx={getX(hoverIndex)}
                                cy={getY(chartData[hoverIndex].recovered)}
                                r="5"
                                fill="#10b981"
                                stroke="#ffffff"
                                strokeWidth="2"
                            />
                        </g>
                    )}

                    {/* Transparent touch/click zones across x coordinates */}
                    {chartData.map((_, idx) => {
                        const stepWidth = (width - paddingX * 2) / (chartData.length - 1)
                        return (
                            <rect
                                key={idx}
                                x={getX(idx) - stepWidth / 2}
                                y={0}
                                width={stepWidth}
                                height={height}
                                fill="transparent"
                                className="cursor-pointer"
                                onMouseEnter={() => setHoverIndex(idx)}
                            />
                        )
                    })}

                    {/* X-Axis Dates */}
                    {labelIndices.map(idx => (
                        <text
                            key={idx}
                            x={getX(idx)}
                            y={height - 8}
                            textAnchor="middle"
                            className="text-[10px] font-bold fill-muted-foreground"
                        >
                            {chartData[idx]?.date}
                        </text>
                    ))}
                </svg>

                {/* Floating Tooltip Indicator */}
                {hoverIndex !== null && (
                    <div
                        className="absolute pointer-events-none top-2 transform -translate-x-1/2 bg-popover text-popover-foreground border border-border px-2.5 py-1.5 rounded-xl shadow-lg text-[10px] font-bold space-y-0.5 z-20"
                        style={{
                            left: `${(getX(hoverIndex) / width) * 100}%`
                        }}
                    >
                        <div className="text-muted-foreground font-mono">{chartData[hoverIndex].date}</div>
                        <div className="text-blue-500">Deployed: {fmt(chartData[hoverIndex].deployed)}</div>
                        <div className="text-emerald-500">Recycled: {fmt(chartData[hoverIndex].recovered)}</div>
                        <div className="text-amber-500">Spread: {fmt(chartData[hoverIndex].margin)}</div>
                    </div>
                )}
            </div>

            {/* Bottom Legend */}
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Wholesale Outflow
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-emerald-500" /> Member Micro-Inflows
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground">
                        <span className="h-2 w-2 rounded-full bg-amber-500" /> Net Float Spread (+16.5%)
                    </span>
                </div>

                <div className="text-[10px] text-muted-foreground font-semibold">
                    Audited by {activeProfile.shortName} Clearinghouse
                </div>
            </div>

        </div>
    )
}
