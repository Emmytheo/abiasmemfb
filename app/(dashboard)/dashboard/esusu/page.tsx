"use client"

import * as React from "react"
import Link from "next/link"
import {
    PiggyBank,
    Users,
    Calendar,
    Building2,
    DollarSign,
    PlusCircle,
    Loader2,
    X,
    RefreshCw,
    Play,
    Globe,
    Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"
import { BankPageHeader } from "@/components/banking/page-header"

const fmtNaira = (kobo: number | string) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

export default function EsusuAdminPage() {
    const { activeProfile } = useBankProfile()
    const [tab, setTab] = React.useState<"vaults" | "legacy">("vaults")
    const [vaults, setVaults] = React.useState<any[]>([])
    const [cooperatives, setCooperatives] = React.useState<any[]>([])
    const [cycles, setCycles] = React.useState<any[]>([])
    const [membersByCycle, setMembersByCycle] = React.useState<Record<string, any[]>>({})
    const [payouts, setPayouts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)

    const [showCoopModal, setShowCoopModal] = React.useState(false)
    const [showCycleModal, setShowCycleModal] = React.useState(false)
    const [newCoopName, setNewCoopName] = React.useState("")
    const [newCoopDesc, setNewCoopDesc] = React.useState("")

    const [newCycleName, setNewCycleName] = React.useState("")
    const [newCycleCoopId, setNewCycleCoopId] = React.useState("")
    const [newCycleAmountNaira, setNewCycleAmountNaira] = React.useState("5000")
    const [newCycleFreq, setNewCycleFreq] = React.useState<"daily" | "weekly" | "monthly">("weekly")
    const [newCycleSlots, setNewCycleSlots] = React.useState("5")
    const [newCycleFee, setNewCycleFee] = React.useState("2.0")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/esusu", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load Target Vaults ledger")
                return
            }
            setVaults(data.personalSavingsPlans || [])
            setCooperatives(data.cooperatives || [])
            setCycles(data.cycles || [])
            setMembersByCycle(data.membersByCycle || {})
            setPayouts(data.payouts || [])
            if (!newCycleCoopId && data.cooperatives?.[0]?.id) {
                setNewCycleCoopId(String(data.cooperatives[0].id))
            }
        } catch {
            toast.error("Failed to fetch Target Vaults")
        } finally {
            setLoading(false)
        }
    }, [newCycleCoopId])

    React.useEffect(() => {
        loadData()
    }, [])

    const handleCreateCoop = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create-coop")
        try {
            const res = await fetch("/api/esusu/cooperatives/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCoopName.trim(), description: newCoopDesc.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to create legacy group")
                return
            }
            toast.success(`Created group "${newCoopName.trim()}"!`)
            setNewCoopName("")
            setNewCoopDesc("")
            setShowCoopModal(false)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleCreateCycle = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create-cycle")
        try {
            const res = await fetch("/api/esusu/cycles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cooperative_id: newCycleCoopId,
                    name: newCycleName.trim(),
                    contribution_amount: Math.round(Number(newCycleAmountNaira) * 100),
                    frequency: newCycleFreq,
                    total_slots: Number(newCycleSlots),
                    platform_fee_percent: Number(newCycleFee),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to launch cycle")
                return
            }
            toast.success(`Launched cycle "${newCycleName.trim()}"!`)
            setNewCycleName("")
            setShowCycleModal(false)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleRunCollection = async (cycleId: number) => {
        setBusy(`collect-${cycleId}`)
        try {
            const res = await fetch("/api/cooperatives/run-collection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cycle_id: cycleId }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Collection run failed")
                return
            }
            toast.success("Atomic cycle collection & payout completed!")
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const totalVaultFloatKobo = vaults.reduce((s, v) => s + Number(v.saved_amount_kobo || 0), 0)
    const activeVaultsCount = vaults.filter((v) => v.status === "active").length
    const totalMembers = Object.values(membersByCycle).reduce((s, list) => s + list.length, 0)
    const totalPaidKobo = payouts.reduce((s, p) => s + Number(p.amount || 0), 0)

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 pb-12">
            <BankPageHeader
                badge="Personal Target Vaults · GL 2200"
                livePill={`${activeVaultsCount} Active Vaults · 6.5% APY`}
                liveTone="emerald"
                title="Target Savings Vaults & Legacy Pools"
                subtitle="Oversee individual locked target savings vaults (GL 2200) and EOD interest accrual. Multi-member registered cooperatives, union executives, and fleet hire-purchase operate on Copteller Custody (GL 2100)."
                actions={
                    <>
                        {activeProfile.enabledModules.coptellerBridge && (
                            <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
                                <Link href="/dashboard/copteller">
                                    <Globe className="h-3.5 w-3.5" /> Open Copteller Custody Rail
                                </Link>
                            </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Total Vault Float (GL 2200)", value: fmtNaira(totalVaultFloatKobo), sub: `${vaults.length} personal vaults created`, icon: PiggyBank, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Active Yield Vaults", value: String(activeVaultsCount), sub: "Accruing daily APY via EOD", icon: Sparkles, tone: "bg-amber-500/10 text-amber-600" },
                    { label: "Legacy Rotational Cycles", value: String(cycles.length), sub: `${totalMembers} enrolled legacy slots`, icon: Calendar, tone: "bg-violet-500/10 text-violet-600" },
                    { label: "Legacy Payouts Settled", value: fmtNaira(totalPaidKobo), sub: `${payouts.length} completed disbursements`, icon: DollarSign, tone: "bg-blue-500/10 text-blue-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-1 bg-muted/70 p-1 rounded-2xl w-fit">
                    <button
                        onClick={() => setTab("vaults")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            tab === "vaults" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                        }`}
                    >
                        Personal Target Vaults ({vaults.length})
                    </button>
                    <button
                        onClick={() => setTab("legacy")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            tab === "legacy" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                        }`}
                    >
                        Legacy Internal Cycles ({cycles.length})
                    </button>
                </div>

                {tab === "legacy" && (
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowCoopModal(true)} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5" /> New Legacy Group
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowCycleModal(true)} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5" /> Launch Cycle
                        </Button>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading vault ledgers...
                </div>
            ) : tab === "vaults" ? (
                <div className="bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-border/70 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-black">Retail Personal Target Savings Vaults (GL 2200)</h2>
                            <p className="text-xs text-muted-foreground">Customer-funded goal vaults backed by GL 2200 with daily EOD APY interest accrual.</p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold">
                            <Link href="/dashboard/operations?tab=eod">Run EOD Interest Accrual</Link>
                        </Button>
                    </div>
                    {vaults.length === 0 ? (
                        <div className="py-14 text-center space-y-2">
                            <PiggyBank className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                            <p className="text-sm font-bold text-muted-foreground">No retail target vaults created yet.</p>
                            <p className="text-xs text-muted-foreground">Customers can open yield-bearing target vaults from their Client Portal (`/esusu`).</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-5 py-3.5">Vault Goal</th>
                                        <th className="px-5 py-3.5">Customer &amp; Source NUBAN</th>
                                        <th className="px-5 py-3.5">Progress</th>
                                        <th className="px-5 py-3.5 text-right">Saved Balance</th>
                                        <th className="px-5 py-3.5">APY &amp; Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {vaults.map((v) => {
                                        const saved = Number(v.saved_amount_kobo || 0)
                                        const target = Math.max(1, Number(v.target_amount_kobo || 1))
                                        const pct = Math.min(100, Math.round((saved / target) * 100))
                                        return (
                                            <tr key={v.id} className="hover:bg-muted/25">
                                                <td className="px-5 py-3.5">
                                                    <p className="font-black text-foreground">{v.name}</p>
                                                    <p className="text-[11px] text-muted-foreground capitalize">
                                                        {v.frequency} · {fmtNaira(v.deduction_amount_kobo)}/cycle
                                                    </p>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="font-bold">{v.holder_name}</p>
                                                    <p className="text-[11px] font-mono text-muted-foreground">{v.source_account_number || "Primary NUBAN"}</p>
                                                </td>
                                                <td className="px-5 py-3.5 w-48">
                                                    <div className="flex justify-between text-[10px] font-bold mb-1">
                                                        <span>{pct}%</span>
                                                        <span className="text-muted-foreground">Goal {fmtNaira(target)}</span>
                                                    </div>
                                                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-mono font-black text-sm tabular-nums-fintech">
                                                    {fmtNaira(saved)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-1.5">
                                                        <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 border-emerald-500/30">
                                                            {Number(v.apy_percent || 6.5)}% APY
                                                        </Badge>
                                                        <Badge variant={v.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase">
                                                            {v.status}
                                                        </Badge>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-base font-black flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" /> Legacy Internal Rotational Cycles ({cycles.length})
                        </h2>
                        {cycles.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-8 text-center">No legacy cycles present.</p>
                        ) : (
                            <div className="space-y-3">
                                {cycles.map((c) => (
                                    <div key={c.id} className="p-4 rounded-2xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-sm">{c.name}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase">{c.status}</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {fmtNaira(c.contribution_amount)} / {c.frequency} · {c.total_slots} slots · Vault {c.vault_account_number || "—"} ({fmtNaira(c.vault_balance_kobo)})
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={busy !== null}
                                            onClick={() => handleRunCollection(c.id)}
                                            className="h-8 rounded-xl text-[11px] font-black gap-1"
                                        >
                                            <Play className="h-3 w-3" /> Run Collection
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 space-y-4 shadow-sm">
                        <h2 className="text-base font-black flex items-center gap-2">
                            <Building2 className="h-4 w-4 text-primary" /> Legacy Internal Groups ({cooperatives.length})
                        </h2>
                        <div className="space-y-2.5">
                            {cooperatives.map((g) => (
                                <div key={g.id} className="p-3.5 rounded-2xl border bg-muted/20 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold">{g.name}</p>
                                        <p className="text-[11px] text-muted-foreground">Leader: {g.union_leader}</p>
                                    </div>
                                    <Badge variant={g.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase">
                                        {g.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create Legacy Group Modal */}
            {showCoopModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleCreateCoop} className="bg-card border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-black">Create Legacy Internal Group</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowCoopModal(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <input
                            value={newCoopName}
                            onChange={(e) => setNewCoopName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-bold"
                            required
                        />
                        <textarea
                            value={newCoopDesc}
                            onChange={(e) => setNewCoopDesc(e.target.value)}
                            placeholder="Description"
                            className="w-full rounded-xl border bg-background p-3 text-xs"
                            rows={3}
                        />
                        <Button type="submit" disabled={busy !== null} className="w-full h-10 rounded-xl font-black text-xs">Create Group</Button>
                    </form>
                </div>
            )}

            {/* Launch Cycle Modal */}
            {showCycleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleCreateCycle} className="bg-card border rounded-3xl p-6 max-w-md w-full space-y-3 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-base font-black">Launch Rotational Cycle</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowCycleModal(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <select value={newCycleCoopId} onChange={(e) => setNewCycleCoopId(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-bold">
                            {cooperatives.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input value={newCycleName} onChange={(e) => setNewCycleName(e.target.value)} placeholder="Cycle Name" className="w-full h-10 rounded-xl border bg-background px-3 text-xs font-bold" required />
                        <div className="grid grid-cols-2 gap-2">
                            <input type="number" value={newCycleAmountNaira} onChange={(e) => setNewCycleAmountNaira(e.target.value)} placeholder="Amount (₦)" className="h-10 rounded-xl border bg-background px-3 text-xs font-mono" />
                            <select value={newCycleFreq} onChange={(e) => setNewCycleFreq(e.target.value as any)} className="h-10 rounded-xl border bg-background px-3 text-xs font-bold">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <input type="number" value={newCycleSlots} onChange={(e) => setNewCycleSlots(e.target.value)} placeholder="Slots" className="h-10 rounded-xl border bg-background px-3 text-xs font-mono" />
                            <input type="number" step="0.5" value={newCycleFee} onChange={(e) => setNewCycleFee(e.target.value)} placeholder="Fee %" className="h-10 rounded-xl border bg-background px-3 text-xs font-mono" />
                        </div>
                        <Button type="submit" disabled={busy !== null} className="w-full h-10 rounded-xl font-black text-xs">Launch Cycle</Button>
                    </form>
                </div>
            )}
        </div>
    )
}
