"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
    Store,
    Wallet,
    TrendingUp,
    ArrowDownRight,
    ArrowUpRight,
    Search,
    Activity,
    CreditCard,
    Smartphone,
    Loader2,
    RefreshCw,
    Globe,
    CheckCircle2,
    ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"

const fmtFull = (n: number) => `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AgentDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [terminals, setTerminals] = useState<any[]>([])
    const [commissions, setCommissions] = useState<any>({ total_commission: 0, agent_share: 0, bank_share: 0, items: [] })
    const [floatBalanceNaira, setFloatBalanceNaira] = useState(0)

    // Rail 3: Live POS Agent Copteller Cooperative Cash-In Terminal
    const [memberQuery, setMemberQuery] = useState("")
    const [lookingUp, setLookingUp] = useState(false)
    const [verifiedMember, setVerifiedMember] = useState<any | null>(null)
    const [cashInAmount, setCashInAmount] = useState("")
    const [cashInNote, setCashInNote] = useState("")
    const [postingCashIn, setPostingCashIn] = useState(false)
    const [cashInReceipt, setCashInReceipt] = useState<any | null>(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const [agencyRes, overviewRes] = await Promise.all([
                fetch("/api/client/agency", { cache: "no-store" }),
                fetch("/api/client/overview", { cache: "no-store" }),
            ])
            if (agencyRes.ok) {
                const a = await agencyRes.json()
                setTerminals(a.terminals || [])
                setCommissions(a.commissions || { total_commission: 0, agent_share: 0, bank_share: 0, items: [] })
            }
            if (overviewRes.ok) {
                const o = await overviewRes.json()
                const totalKobo = (o.accounts || []).reduce((s: number, acc: any) => s + Number(acc.balance || 0), 0)
                setFloatBalanceNaira(totalKobo / 100)
            }
        } catch {
            toast.error("Failed to load live agent metrics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const handleLookupMember = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberQuery.trim()) return
        setLookingUp(true)
        setVerifiedMember(null)
        setCashInReceipt(null)
        try {
            const res = await fetch(`/api/client/agency/copteller-cashin?query=${encodeURIComponent(memberQuery.trim())}`)
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Member wallet not found on Copteller")
                return
            }
            setVerifiedMember(data.member)
            toast.success(`Verified Copteller Member: ${data.member.fullName}`)
        } catch {
            toast.error("Could not reach Copteller member directory")
        } finally {
            setLookingUp(false)
        }
    }

    const handleExecuteCashIn = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!verifiedMember || !cashInAmount || Number(cashInAmount) < 100) {
            toast.error("Enter a valid cash amount (minimum ₦100).")
            return
        }
        setPostingCashIn(true)
        try {
            const res = await fetch("/api/client/agency/copteller-cashin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    member_query: verifiedMember.accountNumber,
                    amount_naira: Number(cashInAmount),
                    narration: cashInNote.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Cash-in posting failed")
                return
            }
            setCashInReceipt(data)
            setCashInAmount("")
            setCashInNote("")
            toast.success(`Credited ₦${(data.amountKobo / 100).toLocaleString()} to ${data.member.fullName}! Earned +₦${(data.agentCommissionKobo / 100).toFixed(2)}.`)
            await loadData()
        } finally {
            setPostingCashIn(false)
        }
    }

    const items: any[] = commissions.items || []
    const totalVolumeNaira = items.reduce((s, c) => s + Number(c.transaction_amount || 0), 0) / 100
    const filteredItems = items.filter(
        (c) =>
            !search.trim() ||
            String(c.serial_number || "").toLowerCase().includes(search.toLowerCase()) ||
            String(c.id).includes(search)
    )

    const estFee = Math.min(250, Math.max(50, Math.round((Number(cashInAmount) || 0) * 0.005)))
    const estAgentEarn = Number(cashInAmount) >= 100 ? (estFee * 0.7).toFixed(2) : "0.00"

    if (loading) {
        return (
            <div className="flex h-[55vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-10">
            <BankPageHeader
                badge="POS Agency Network & Cooperative Cash Rail"
                livePill={`${terminals.filter((t) => t.status === "active").length} Active Terminals · 70/30 Split`}
                liveTone="emerald"
                title="Agent Portal & Copteller Cash-In Desk"
                subtitle="Manage your live e-value float, process physical POS cash-out, and accept last-mile daily cash deposits directly into Copteller Cooperative member wallets."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                            <Link href="/pay/fund">
                                <ArrowDownRight className="h-3.5 w-3.5" /> Fund Float
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <Link href="/agency">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Card Cash-Out
                            </Link>
                        </Button>
                    </>
                }
            />

            {/* 4 Clean KPI Tiles */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Available E-Value Float", val: fmtFull(floatBalanceNaira), sub: "Primary BankSuite settlement float", icon: Wallet, tone: "bg-primary/10 text-primary" },
                    { label: "Earned Commissions (70%)", val: fmtFull(Number(commissions.agent_share || 0) / 100), sub: "Credited immediately per txn", icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "POS Volume Processed", val: fmtFull(totalVolumeNaira), sub: `${items.length} audited settlements`, icon: Activity, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Assigned POS Fleet", val: String(terminals.length), sub: `${terminals.filter((t) => t.status === "active").length} online hardware units`, icon: Smartphone, tone: "bg-amber-500/10 text-amber-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-xl sm:text-2xl font-black tabular-nums-fintech">{k.val}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* RAIL 3: LIVE COPTELLER COOPERATIVE CASH-IN TERMINAL + QUICK LINKS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-card border border-emerald-500/30 rounded-3xl p-6 shadow-sm space-y-5">
                    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
                        <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase">
                                <Globe className="h-3 w-3" /> Rail 3 · Last-Mile Cooperative Cash-In
                            </span>
                            <h2 className="text-base sm:text-lg font-black text-foreground">
                                Accept Cash for Copteller Cooperative Member
                            </h2>
                            <p className="text-xs text-muted-foreground">
                                Collect physical cash from Keke riders or market traders → debit your float → credit their Copteller wallet &amp; BankSuite GL 2100 instantly while earning 70% commission.
                            </p>
                        </div>
                    </div>

                    {/* Step 1: Lookup Member */}
                    <form onSubmit={handleLookupMember} className="flex gap-2">
                        <Input
                            value={memberQuery}
                            onChange={(e) => setMemberQuery(e.target.value)}
                            placeholder="Enter Copteller Account No., Phone (e.g. 0803...), or Email..."
                            className="h-10 rounded-xl text-xs font-semibold flex-1"
                            required
                        />
                        <Button type="submit" disabled={lookingUp} variant="outline" className="h-10 rounded-xl font-black text-xs px-4 shrink-0">
                            {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Member"}
                        </Button>
                    </form>

                    {/* Verified Member Panel & Step 2 Amount */}
                    {verifiedMember && (
                        <form onSubmit={handleExecuteCashIn} className="p-4 rounded-2xl bg-emerald-500/[0.05] border border-emerald-500/25 space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <p className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" /> {verifiedMember.fullName}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-mono">
                                        Wallet: {verifiedMember.accountNumber} · {verifiedMember.cooperativeName}
                                    </p>
                                </div>
                                <Badge className="bg-emerald-600 text-white text-[10px] font-mono">
                                    Bal: ₦{(verifiedMember.balanceKobo / 100).toLocaleString()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Cash Collected (₦)</label>
                                    <Input
                                        type="number"
                                        min="100"
                                        step="100"
                                        value={cashInAmount}
                                        onChange={(e) => setCashInAmount(e.target.value)}
                                        placeholder="e.g. 5000"
                                        className="h-10 rounded-xl font-black text-sm bg-card"
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Receipt Note (Optional)</label>
                                    <Input
                                        value={cashInNote}
                                        onChange={(e) => setCashInNote(e.target.value)}
                                        placeholder="e.g. Daily Keke Ajo Thrift"
                                        className="h-10 rounded-xl text-xs bg-card"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-500/20">
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                                    Your Instant 70% Commission: <strong className="font-mono">+₦{estAgentEarn}</strong>
                                </span>
                                <Button type="submit" disabled={postingCashIn} className="h-10 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-5">
                                    {postingCashIn ? "Settling Rail..." : "Post Atomic Cash-In"}
                                </Button>
                            </div>
                        </form>
                    )}

                    {/* Instant Receipt */}
                    {cashInReceipt && (
                        <div className="p-4 rounded-2xl bg-card border border-emerald-500/30 space-y-2 text-xs">
                            <div className="flex items-center justify-between">
                                <span className="font-black text-emerald-700 flex items-center gap-1.5">
                                    <ShieldCheck className="h-4 w-4" /> Settled Cross-Platform Receipt
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground">{cashInReceipt.reference}</span>
                            </div>
                            <p className="text-muted-foreground">
                                Credited <strong className="text-foreground">₦{(cashInReceipt.amountKobo / 100).toLocaleString()}</strong> to{" "}
                                <strong className="text-foreground">{cashInReceipt.member.fullName}</strong> ({cashInReceipt.member.accountNumber}).
                                Agent commission <strong className="text-emerald-600">+₦{(cashInReceipt.agentCommissionKobo / 100).toFixed(2)}</strong> posted · GL Ref{" "}
                                <span className="font-mono">{cashInReceipt.glJournalRef || "POSTED"}</span>.
                            </p>
                        </div>
                    )}
                </div>

                {/* Agency Shortcuts */}
                <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-base font-black text-foreground">Agency Terminal Actions</h3>
                    <div className="space-y-2.5">
                        {[
                            { title: "POS Card Cash-Out Terminal", desc: "Process Verve/Mastercard customer withdrawals", href: "/agency", icon: CreditCard, tone: "bg-primary/10 text-primary" },
                            { title: "Manage POS Hardware Fleet", desc: `${terminals.length} terminals registered to your agency`, href: "/agent/terminals", icon: Smartphone, tone: "bg-emerald-500/10 text-emerald-600" },
                            { title: "Bank Transfers & Float Settlement", desc: "Rebalance float across your corporate NUBAN", href: "/client-dashboard/transfers", icon: Store, tone: "bg-blue-500/10 text-blue-600" },
                        ].map((a) => (
                            <Link
                                key={a.title}
                                href={a.href}
                                className="flex items-center gap-3 p-3.5 rounded-2xl border border-border/80 hover:border-primary/40 transition-all bg-muted/15"
                            >
                                <div className={`p-2.5 rounded-xl ${a.tone}`}>
                                    <a.icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-black text-foreground">{a.title}</p>
                                    <p className="text-[11px] text-muted-foreground">{a.desc}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            {/* Commission Settlement Log */}
            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                        <h3 className="text-base font-black text-foreground">Commission Settlement Journal</h3>
                        <p className="text-xs text-muted-foreground">Audited OTC &amp; Cooperative Cash-In commissions (70% Agent / 30% Bank)</p>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search terminal serial..."
                            className="pl-9 h-9 rounded-xl text-xs"
                        />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-[10px] text-muted-foreground uppercase bg-muted/40 border-b">
                            <tr>
                                <th className="px-5 py-3 font-black">Terminal &amp; Time</th>
                                <th className="px-5 py-3 font-black text-right">Volume</th>
                                <th className="px-5 py-3 font-black text-right">Agent Share (70%)</th>
                                <th className="px-5 py-3 font-black text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/70">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">
                                        No commission settlements recorded yet.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-muted/20">
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold font-mono text-foreground">{tx.serial_number || `Terminal #${tx.terminal_id}`}</p>
                                            <p className="text-[11px] text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono font-black">
                                            ₦{(Number(tx.transaction_amount || 0) / 100).toLocaleString()}
                                        </td>
                                        <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                                            +₦{(Number(tx.agent_share || 0) / 100).toFixed(2)}
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Badge variant="outline" className="uppercase text-[9px] font-black">{tx.status}</Badge>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
