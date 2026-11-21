"use client"

import * as React from "react"
import Link from "next/link"
import {
    Users2,
    ShieldCheck,
    Landmark,
    Smartphone,
    ArrowRight,
    Sparkles,
    CheckCircle2,
    ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const fmtCompact = (n: number) =>
    `₦${Number(n || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`

interface EcosystemRailCardProps {
    coptellerConnected: boolean
    coptellerUrl?: string
    activeCooperatives: number
    activeMembers: number
    coptellerEscrowNaira: number
    banksuiteCustodyNaira: number
    pendingCreditCount: number
    avgTrustScore: number
    activeTerminals: number
    compact?: boolean
}

export function EcosystemRailCard({
    coptellerConnected,
    coptellerUrl = "",
    activeCooperatives,
    activeMembers,
    coptellerEscrowNaira,
    banksuiteCustodyNaira,
    pendingCreditCount,
    avgTrustScore,
    activeTerminals,
    compact = false,
}: EcosystemRailCardProps) {
    const score850 = avgTrustScore > 100 ? Math.round(avgTrustScore) : Math.round(300 + (avgTrustScore || 72) * 5.5)

    const stages = [
        {
            step: "Rail 1",
            title: "Cooperative Mobilization",
            org: "Copteller OS (Zero-CAC Distribution)",
            icon: Users2,
            tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20",
            summary: "Grassroots unions (Keke, Market Traders, Agro) collect automated daily/weekly Ajo thrift & dues.",
            metric: `${activeCooperatives} Unions · ${activeMembers} Members`,
            href: "/dashboard/copteller?tab=unions",
        },
        {
            step: "Rail 2",
            title: "Regulated Escrow Custody",
            org: "BankSuite GL 2100 Trust Pool",
            icon: ShieldCheck,
            tone: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
            summary: "Ring-fenced 3000XXXXXX Escrow NUBANs safeguard cooperative float under CBN MFB license & NDIC.",
            metric: `${fmtCompact(Math.max(banksuiteCustodyNaira, coptellerEscrowNaira))} Float`,
            href: "/dashboard/copteller?tab=escrow",
        },
        {
            step: "Rail 3",
            title: "Telemetry Credit Committee",
            org: "BankSuite GL 1200/1300 Underwriting",
            icon: Landmark,
            tone: "bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-500/20",
            summary: "Copteller behavioral Trust Scores & Union Exec guarantees unlock low-NPL HP & SME credit lines.",
            metric: `Avg Score ${score850}/850 · ${pendingCreditCount} Pending`,
            href: "/products/loans",
        },
        {
            step: "Rail 4",
            title: "POS Agency Cash-In Rail",
            org: "BankSuite Last-Mile Agent Fleet",
            icon: Smartphone,
            tone: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20",
            summary: "Physical POS agents convert daily cash from Keke operators directly into Copteller wallets (70/30 split).",
            metric: `${activeTerminals} POS Terminals Live`,
            href: "/dashboard/agency",
        },
    ]

    return (
        <section className="rounded-3xl bg-card border border-border/80 shadow-sm p-5 sm:p-6 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-border/70">
                <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-black uppercase tracking-wider">
                            <Sparkles className="h-3 w-3" /> Closed-Loop MFB ⇄ Cooperative Architecture
                        </span>
                        <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${
                                coptellerConnected
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                    : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                            }`}
                        >
                            <span className={`size-1.5 rounded-full ${coptellerConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"}`} />
                            {coptellerConnected ? "Bi-Directional Rail Active" : "Bridge Offline"}
                        </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
                        How BankSuite (Licensed Core) &amp; Copteller (Cooperative OS) Power Real-World Scale
                    </h2>
                    {!compact && (
                        <p className="text-xs text-muted-foreground font-medium max-w-3xl">
                            Copteller mobilizes sticky zero-CAC deposits and verified social-trust credit scores across grassroots unions; BankSuite provides the CBN-regulated Escrow NUBAN vault, GL settlement, wholesale credit balance sheet, and physical POS cash-in rail.
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {coptellerUrl ? (
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <a href={`${coptellerUrl.replace(/\/$/, "")}/copteller/partner`} target="_blank" rel="noopener noreferrer">
                                Copteller Partner Console <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                        </Button>
                    ) : null}
                    <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                        <Link href="/dashboard/copteller">
                            Manage Custody Rails <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
                {stages.map((s) => (
                    <Link
                        key={s.step}
                        href={s.href}
                        className="group p-4 rounded-2xl bg-muted/20 hover:bg-muted/40 border border-border/70 hover:border-primary/35 transition-all flex flex-col justify-between space-y-3"
                    >
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between">
                                <div className={`p-2 rounded-xl border ${s.tone}`}>
                                    <s.icon className="h-4 w-4" />
                                </div>
                                <span className="text-[10px] font-mono font-black text-muted-foreground bg-card border border-border px-2 py-0.5 rounded-md">
                                    {s.step}
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    {s.title}
                                </p>
                                <p className="text-xs font-black text-foreground mt-0.5">{s.org}</p>
                                <p className="text-[11px] text-muted-foreground font-medium mt-1 leading-relaxed">
                                    {s.summary}
                                </p>
                            </div>
                        </div>

                        <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px]">
                            <span className="font-black text-emerald-700 dark:text-emerald-400 truncate">{s.metric}</span>
                            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>

            <div className="px-4 py-2.5 rounded-2xl bg-muted/30 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <span className="inline-flex items-center gap-2 text-muted-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>
                        <strong className="text-foreground">Closed-Loop Guarantee:</strong> Cooperative deposits stay inside BankSuite GL 2100; POS Agents convert daily cash; Copteller Trust Scores slash MFB loan defaults.
                    </span>
                </span>
                <span className="font-mono font-bold text-primary shrink-0">GL 1000 ⇄ 2100 ⇄ 1300</span>
            </div>
        </section>
    )
}
