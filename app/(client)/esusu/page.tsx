"use client"

import * as React from "react"
import {
    PiggyBank,
    PlusCircle,
    Loader2,
    TrendingUp,
    Wallet,
    ArrowDownLeft,
    ArrowUpRight,
    PauseCircle,
    PlayCircle,
    Globe,
    ExternalLink,
    ShieldCheck,
    X,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"

const fmtNaira = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

export default function PersonalTargetVaultsPage() {
    const [loading, setLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [plans, setPlans] = React.useState<any[]>([])
    const [accounts, setAccounts] = React.useState<any[]>([])
    const [coptellerLink, setCoptellerLink] = React.useState<any>(null)

    // Create Vault Modal
    const [showCreate, setShowCreate] = React.useState(false)
    const [name, setName] = React.useState("")
    const [deduction, setDeduction] = React.useState("5000")
    const [target, setTarget] = React.useState("250000")
    const [frequency, setFrequency] = React.useState<"daily" | "weekly" | "monthly">("weekly")
    const [sourceAccId, setSourceAccId] = React.useState("")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [plansRes, copRes] = await Promise.all([
                fetch("/api/client/savings-plans", { cache: "no-store" }),
                fetch("/api/client/copteller-link", { cache: "no-store" }),
            ])
            if (plansRes.ok) {
                const p = await plansRes.json()
                setPlans(p.plans || [])
                setAccounts(p.accounts || [])
                if (!sourceAccId && p.accounts?.[0]?.id) {
                    setSourceAccId(String(p.accounts[0].id))
                }
            }
            if (copRes.ok) {
                const c = await copRes.json()
                setCoptellerLink(c)
            }
        } catch {
            toast.error("Failed to load target savings vaults")
        } finally {
            setLoading(false)
        }
    }, [sourceAccId])

    React.useEffect(() => {
        loadData()
    }, [])

    const handleCreateVault = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create")
        try {
            const res = await fetch("/api/client/savings-plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    deduction_amount_naira: Number(deduction),
                    target_amount_naira: Number(target),
                    frequency,
                    source_account_id: sourceAccId ? Number(sourceAccId) : null,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to create target vault")
                return
            }
            toast.success(`Created Target Savings Vault "${name.trim()}"!`)
            setName("")
            setShowCreate(false)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleVaultAction = async (id: number, action: "topup" | "liquidate" | "toggle_status") => {
        setBusy(`${action}-${id}`)
        try {
            const res = await fetch("/api/client/savings-plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Vault operation failed")
                return
            }
            toast.success(
                action === "topup"
                    ? "Stashed funds atomically from your linked bank account!"
                    : action === "liquidate"
                      ? "Vault liquidated back into your bank account!"
                      : "Auto-save schedule updated."
            )
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const totalSavedKobo = plans.reduce((s, p) => s + Number(p.saved_amount_kobo || 0), 0)
    const totalTargetKobo = plans.reduce((s, p) => s + Number(p.target_amount_kobo || 0), 0)
    const activeCount = plans.filter((p) => p.status === "active").length
    const annualYieldEstKobo = Math.round(totalSavedKobo * 0.065)

    return (
        <div className="space-y-6 pb-10">
            <BankPageHeader
                badge="Personal Wealth & Yield Vaults (GL 2200)"
                livePill={`${activeCount} Active Vaults · 6.5% p.a.`}
                liveTone="emerald"
                title="Target Savings & Fixed Vaults"
                subtitle="Automate personal savings goals backed directly by your licensed bank balance sheet with instant liquidation to your primary NUBAN."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button size="sm" onClick={() => setShowCreate(true)} className="h-9 rounded-xl font-black text-xs gap-1.5 shadow-sm">
                            <PlusCircle className="h-3.5 w-3.5" /> Create Target Vault
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Vault Balance", val: fmtNaira(totalSavedKobo), sub: `Goal: ${fmtNaira(totalTargetKobo)}`, icon: PiggyBank, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Projected Annual Yield", val: fmtNaira(annualYieldEstKobo), sub: "6.50% p.a. accrued daily", icon: TrendingUp, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Active Auto-Vaults", val: String(activeCount), sub: `${plans.length} total plans created`, icon: ShieldCheck, tone: "bg-violet-500/10 text-violet-600" },
                    { label: "Linked Funding Balance", val: fmtNaira(accounts.reduce((s, a) => s + Number(a.balance || 0), 0)), sub: `${accounts.length} active bank accounts`, icon: Wallet, tone: "bg-amber-500/10 text-amber-600" },
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

            {/* Clean Architectural Handoff Banner for Group Cooperatives -> Copteller */}
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/[0.04] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shrink-0">
                        <Globe className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                                Partner Cooperative Operating System
                            </span>
                            {coptellerLink?.linked && (
                                <Badge className="bg-emerald-600 text-white text-[9px] font-black">
                                    Linked · Score {coptellerLink.profile?.trustScore850}/850
                                </Badge>
                            )}
                        </div>
                        <h3 className="text-sm sm:text-base font-black text-foreground">
                            Looking for Group Ajo, Cooperative Unions, or Keke Hire-Purchase?
                        </h3>
                        <p className="text-xs text-muted-foreground max-w-2xl">
                            Personal savings &amp; fixed-deposit vaults live right here on your BankSuite account. Full multi-member cooperatives, rotational thrift (Ajo), and asset financing run on <strong>Copteller Cooperative OS</strong> — custodied safely under this bank&apos;s GL 2100 Escrow Trust.
                        </p>
                    </div>
                </div>
                <Button asChild size="sm" className="h-10 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-1.5">
                    <a href={`${coptellerLink?.appUrl || "http://localhost:3001"}/copteller/dashboard`} target="_blank" rel="noopener noreferrer">
                        Open Copteller OS <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                </Button>
            </div>

            {/* Target Vault Cards */}
            {loading ? (
                <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading your vaults...
                </div>
            ) : plans.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-3xl p-12 text-center space-y-3">
                    <div className="p-4 rounded-2xl bg-muted w-fit mx-auto">
                        <PiggyBank className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-base font-black text-foreground">No Target Savings Vaults Yet</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                        Create your first automated target vault (e.g., Rent Reserve, Business Inventory, School Fees) earning 6.5% p.a. with instant atomic top-ups.
                    </p>
                    <Button onClick={() => setShowCreate(true)} className="rounded-xl font-black text-xs gap-1.5">
                        <PlusCircle className="h-4 w-4" /> Create First Target Vault
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {plans.map((p) => {
                        const saved = Number(p.saved_amount_kobo || 0)
                        const tgt = Math.max(1, Number(p.target_amount_kobo || 1))
                        const pct = Math.min(100, Math.round((saved / tgt) * 100))
                        return (
                            <div key={p.id} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4">
                                <div className="space-y-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-sm font-black text-foreground">{p.name}</h3>
                                            <p className="text-[11px] text-muted-foreground capitalize">
                                                {p.frequency} stash: {fmtNaira(p.deduction_amount_kobo)} · {p.apy_percent || 6.5}% p.a.
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] font-black uppercase ${
                                                p.status === "active"
                                                    ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {p.status}
                                        </Badge>
                                    </div>

                                    <div>
                                        <div className="flex items-baseline justify-between mb-1.5">
                                            <span className="text-xl font-black font-mono text-foreground">{fmtNaira(saved)}</span>
                                            <span className="text-[11px] font-bold text-muted-foreground">of {fmtNaira(tgt)} ({pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border/70 flex flex-wrap gap-2">
                                    <Button
                                        size="sm"
                                        disabled={busy !== null || p.status === "completed"}
                                        onClick={() => handleVaultAction(p.id, "topup")}
                                        className="flex-1 h-9 rounded-xl text-xs font-black gap-1"
                                    >
                                        <ArrowDownLeft className="h-3.5 w-3.5" />
                                        {busy === `topup-${p.id}` ? "Stashing..." : `Stash ${fmtNaira(p.deduction_amount_kobo)}`}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy !== null || p.status === "completed"}
                                        onClick={() => handleVaultAction(p.id, "toggle_status")}
                                        className="h-9 rounded-xl text-xs font-bold px-2.5"
                                        title={p.status === "active" ? "Pause Auto-Save" : "Resume Auto-Save"}
                                    >
                                        {p.status === "active" ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        disabled={busy !== null || saved <= 0}
                                        onClick={() => handleVaultAction(p.id, "liquidate")}
                                        className="h-9 rounded-xl text-xs font-bold gap-1"
                                    >
                                        <ArrowUpRight className="h-3.5 w-3.5" /> Liquidate
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Target Vault Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
                    <form onSubmit={handleCreateVault} className="bg-card border border-border rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-black">Create Target Savings Vault</h3>
                                <p className="text-xs text-muted-foreground">Backed by your bank balance sheet at 6.50% p.a.</p>
                            </div>
                            <button type="button" onClick={() => setShowCreate(false)} className="p-1.5 rounded-xl hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Vault Name</label>
                            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shop Restock Reserve" className="h-10 rounded-xl text-xs font-bold" required />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Stash Amount (₦)</label>
                                <Input type="number" min="500" value={deduction} onChange={(e) => setDeduction(e.target.value)} className="h-10 rounded-xl font-black" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Target Goal (₦)</label>
                                <Input type="number" min="1000" value={target} onChange={(e) => setTarget(e.target.value)} className="h-10 rounded-xl font-black" required />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Frequency</label>
                                <select value={frequency} onChange={(e) => setFrequency(e.target.value as any)} className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs font-bold">
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Funding Account</label>
                                <select value={sourceAccId} onChange={(e) => setSourceAccId(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-background px-2.5 text-xs font-bold">
                                    {accounts.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            {a.account_number} ({fmtNaira(a.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="rounded-xl text-xs font-bold">Cancel</Button>
                            <Button type="submit" disabled={busy === "create"} className="rounded-xl text-xs font-black">
                                {busy === "create" ? "Creating..." : "Create Vault"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
