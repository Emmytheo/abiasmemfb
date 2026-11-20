"use client";

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Transaction } from "@/lib/api";
import { ArrowDownLeft, ArrowUpRight, Activity, BarChart3 } from "lucide-react";

type Timeframe = "7D" | "30D" | "90D";

export function VolumeChart({ transactions }: { transactions: Transaction[] }) {
    const [timeframe, setTimeframe] = useState<Timeframe>("30D");
    const [isMounted, setIsMounted] = useState(false);
    const [hoverIdx, setHoverIdx] = useState<number | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const chartData = useMemo(() => {
        const now = isMounted ? new Date() : new Date("2026-01-01T00:00:00.000Z");
        const days = timeframe === "7D" ? 7 : timeframe === "30D" ? 30 : 90;
        const points = Array(days).fill(0);
        const counts = Array(days).fill(0);
        const labels: string[] = [];

        for (let i = 0; i < days; i++) {
            const d = new Date(now);
            d.setDate(d.getDate() - (days - 1 - i));
            labels.push(d.toLocaleDateString(undefined, { month: "short", day: "numeric" }));
        }

        let totalVolume = 0;
        let totalInflow = 0;
        let totalOutflow = 0;
        let totalCount = 0;

        transactions.forEach((tx) => {
            const txDate = new Date(tx.created_at);
            const diffDays = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < days) {
                const idx = days - 1 - diffDays;
                if (idx >= 0 && idx < days) {
                    const amt = Number(tx.amount || 0);
                    points[idx] += amt;
                    counts[idx] += 1;
                    totalVolume += amt;
                    totalCount += 1;
                    if (tx.type === "credit") totalInflow += amt;
                    else totalOutflow += amt;
                }
            }
        });

        const peakValue = Math.max(...points, 0);
        return { points, counts, labels, totalVolume, totalInflow, totalOutflow, totalCount, peakValue };
    }, [transactions, timeframe, isMounted]);

    const width = 800;
    const height = 220;

    const { path, fillPath, plotPoints, maxScale } = useMemo(() => {
        const { points } = chartData;
        const maxVal = Math.max(...points, 100);
        const topScale = maxVal * 1.15;

        const pts = points.map((val, i) => {
            const x = points.length > 1 ? (i / (points.length - 1)) * width : width / 2;
            const y = height - (val / topScale) * (height - 24) - 12;
            return { x, y: Math.max(10, Math.min(height - 10, y)), value: val };
        });

        const pStr = pts
            .map((pt, i) => {
                if (i === 0) return `M ${pt.x},${pt.y}`;
                const prev = pts[i - 1];
                const cp1x = prev.x + (pt.x - prev.x) / 2;
                const cp2x = prev.x + (pt.x - prev.x) / 2;
                return `C ${cp1x},${prev.y} ${cp2x},${pt.y} ${pt.x},${pt.y}`;
            })
            .join(" ");

        return {
            path: pStr,
            fillPath: `${pStr} L ${width},${height} L 0,${height} Z`,
            plotPoints: pts,
            maxScale: topScale,
        };
    }, [chartData]);

    const displayLabels = useMemo(() => {
        const result = [];
        const step = Math.max(1, Math.floor((chartData.labels.length - 1) / 4));
        for (let i = 0; i < 4; i++) {
            result.push(chartData.labels[Math.min(i * step, chartData.labels.length - 1)]);
        }
        result.push(chartData.labels[chartData.labels.length - 1]);
        return result;
    }, [chartData.labels]);

    const activePoint = hoverIdx !== null ? plotPoints[hoverIdx] : null;
    const activeLabel = hoverIdx !== null ? chartData.labels[hoverIdx] : null;
    const activeCount = hoverIdx !== null ? chartData.counts[hoverIdx] : 0;

    const fmtCompact = (n: number) =>
        `₦${n.toLocaleString(undefined, { notation: n >= 1_000_000 ? "compact" : "standard", maximumFractionDigits: 1 })}`;

    return (
        <Card className="fintech-card overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <BarChart3 className="h-4 w-4" />
                        </div>
                        <h3 className="text-base sm:text-lg font-black tracking-tight">Treasury Volume &amp; Cashflow</h3>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">
                        Interactive daily settlement flow across core ledger accounts ({timeframe})
                    </p>
                </div>

                <div className="flex bg-muted/60 p-1 rounded-xl border border-border/70 self-start">
                    {(["7D", "30D", "90D"] as Timeframe[]).map((tf) => (
                        <button
                            key={tf}
                            type="button"
                            onClick={() => {
                                setTimeframe(tf);
                                setHoverIdx(null);
                            }}
                            className={`px-3 py-1.5 text-[11px] font-black rounded-lg transition-all ${
                                timeframe === tf
                                    ? "bg-background text-primary shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* Period Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="rounded-xl bg-muted/40 border border-border/60 px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Period Volume</p>
                    <p className="text-base font-black tabular-nums-fintech mt-0.5">{fmtCompact(chartData.totalVolume)}</p>
                </div>
                <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <ArrowDownLeft className="h-3 w-3" /> Inflows
                    </p>
                    <p className="text-base font-black tabular-nums-fintech text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {fmtCompact(chartData.totalInflow)}
                    </p>
                </div>
                <div className="rounded-xl bg-rose-500/5 border border-rose-500/20 px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <ArrowUpRight className="h-3 w-3" /> Outflows
                    </p>
                    <p className="text-base font-black tabular-nums-fintech text-rose-600 dark:text-rose-400 mt-0.5">
                        {fmtCompact(chartData.totalOutflow)}
                    </p>
                </div>
                <div className="rounded-xl bg-muted/40 border border-border/60 px-3.5 py-2.5">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Activity className="h-3 w-3" /> Transactions
                    </p>
                    <p className="text-base font-black tabular-nums-fintech mt-0.5">{chartData.totalCount.toLocaleString()}</p>
                </div>
            </div>

            {/* Interactive SVG Area Chart */}
            <div
                className="relative h-[220px] w-full select-none"
                onMouseLeave={() => setHoverIdx(null)}
            >
                {/* Y-axis reference labels */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                    {[1, 0.75, 0.5, 0.25, 0].map((frac, idx) => (
                        <div key={idx} className="flex items-center gap-2 w-full">
                            <span className="text-[9px] font-mono text-muted-foreground/60 w-12 shrink-0 text-right tabular-nums-fintech">
                                {fmtCompact(maxScale * frac)}
                            </span>
                            <div className="border-b border-dashed border-border/60 flex-1" />
                        </div>
                    ))}
                </div>

                {/* Hover Tooltip */}
                {activePoint && activeLabel && (
                    <div
                        className="pointer-events-none absolute -top-2 z-20 rounded-xl border border-primary/30 bg-popover/95 backdrop-blur-md px-3 py-2 shadow-xl text-xs transition-all duration-75"
                        style={{
                            left: `clamp(56px, calc(${(activePoint.x / width) * 100}% - 55px), calc(100% - 145px))`,
                        }}
                    >
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{activeLabel}</p>
                        <p className="text-sm font-black tabular-nums-fintech text-foreground">
                            ₦{activePoint.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] font-semibold text-primary">
                            {activeCount} {activeCount === 1 ? "settlement" : "settlements"}
                        </p>
                    </div>
                )}

                <div className="absolute inset-0 pl-14">
                    <svg
                        className="w-full h-full"
                        overflow="visible"
                        preserveAspectRatio="none"
                        viewBox={`0 0 ${width} ${height}`}
                    >
                        <defs>
                            <linearGradient id="chartGradientVolume" x1="0" x2="0" y1="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.28" />
                                <stop offset="75%" stopColor="hsl(var(--primary))" stopOpacity="0.04" />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        <path d={fillPath} fill="url(#chartGradientVolume)" />
                        <path
                            d={path}
                            fill="none"
                            stroke="hsl(var(--primary))"
                            strokeLinecap="round"
                            strokeWidth="3"
                        />

                        {activePoint && (
                            <>
                                <line
                                    x1={activePoint.x}
                                    y1={0}
                                    x2={activePoint.x}
                                    y2={height}
                                    stroke="hsl(var(--primary))"
                                    strokeOpacity="0.35"
                                    strokeDasharray="4 4"
                                    strokeWidth="1.5"
                                />
                                <circle
                                    cx={activePoint.x}
                                    cy={activePoint.y}
                                    r="9"
                                    fill="hsl(var(--primary))"
                                    fillOpacity="0.18"
                                />
                                <circle
                                    cx={activePoint.x}
                                    cy={activePoint.y}
                                    r="4.5"
                                    fill="hsl(var(--primary))"
                                    stroke="hsl(var(--background))"
                                    strokeWidth="2"
                                />
                            </>
                        )}

                        {plotPoints.length > 0 && hoverIdx === null && (
                            <circle
                                cx={plotPoints[plotPoints.length - 1].x}
                                cy={plotPoints[plotPoints.length - 1].y}
                                fill="hsl(var(--primary))"
                                r="4.5"
                                className="animate-pulse origin-center"
                            />
                        )}
                    </svg>

                    {/* Invisible hover scrub hit zones */}
                    <div className="absolute inset-0 flex">
                        {plotPoints.map((_, i) => (
                            <div
                                key={i}
                                className="flex-1 h-full cursor-crosshair"
                                onMouseEnter={() => setHoverIdx(i)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pl-14 pr-1">
                {displayLabels.map((lbl, i) => (
                    <span
                        key={i}
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                            i === displayLabels.length - 1 ? "text-primary" : "text-muted-foreground"
                        }`}
                    >
                        {i === displayLabels.length - 1 ? "Today" : lbl}
                    </span>
                ))}
            </div>
        </Card>
    );
}
