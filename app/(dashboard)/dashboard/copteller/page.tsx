"use client"

import * as React from "react"
import {
    ShieldAlert,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Truck,
    Building2,
    Award,
    AlertCircle,
    Clock,
    Download,
    Check,
    X,
    Zap,
    CircleDollarSign,
    Lock,
    ArrowUpRight,
    Bell,
    Loader2,
    KeyRound,
    Layers,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { useBankProfile } from "@/context/bank-profile-context"

function StatusBadge({ status }: { status: string }) {
    const s = String(status || "").toLowerCase()
    const cls =
        s === "active" || s === "approved" || s === "completed" || s === "live"
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
            : s === "pending"
                ? "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                : "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400"
    return (
        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${cls}`}>
            {status}
        </span>
    )
}

function CoptellerSuperadminContent() {
    const { activeProfile } = useBankProfile()
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = React.useState<
        "overview" | "unions" | "schemes" | "grants" | "assets" | "vault" | "compliance"
    >("overview")
    const [snapshot, setSnapshot] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [reconReport, setReconReport] = React.useState<any>(null)
    const [runningAudit, setRunningAudit] = React.useState(false)

    React.useEffect(() => {
        const tab = searchParams?.get("tab")
        if (tab && ["overview", "unions", "schemes", "grants", "assets", "vault", "compliance"].includes(tab)) {
            setActiveTab(tab as any)
        }
    }, [searchParams])

    const loadSnapshot = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/copteller")
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Could not load Copteller Bridge data")
                return
            }
            setSnapshot(data)
        } catch {
            toast.error("Failed to reach Copteller Bridge API")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadSnapshot()
    }, [loadSnapshot])

    const runLiveVaultAudit = async () => {
        setRunningAudit(true)
        try {
            const res = await fetch("/api/admin/copteller/reconcile", { method: "POST" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Reconciliation failed")
                return
            }
            setReconReport(data.report)
            toast.success(
                data.report.allPassed
                    ? `Live Copteller audit passed (${data.report.durationMs}ms)`
                    : "Audit complete with warnings — inspect details below"
            )
            await loadSnapshot()
        } finally {
            setRunningAudit(false)
        }
    }

    const mutateCopteller = async (payload: Record<string, any>, successMsg: string, key: string) => {
        setBusyId(key)
        try {
            const res = await fetch("/api/admin/copteller", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Operation failed")
                return
            }
            toast.success(successMsg)
            await loadSnapshot()
        } finally {
            setBusyId(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <span className="text-sm font-semibold">Connecting to live Copteller Cooperative Bridge...</span>
            </div>
        )
    }

    const health = snapshot?.health || { connected: false, appUrl: "http://localhost:3001" }
    const kpis = snapshot?.kpis || {}
    const cooperatives = snapshot?.cooperatives || []
    const pendingCoops = cooperatives.filter((c: any) => c.status === "pending")
    const schemes = snapshot?.schemes || []
    const contracts = snapshot?.contracts || []
    const loans = snapshot?.loans || []
    const pendingLoans = loans.filter((l: any) => l.status === "pending")
    const vaultSecrets = snapshot?.vaultSecrets || []
    const auditLogs = snapshot?.auditLogs || []

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
            {/* Branded Executive Copteller Bridge Hero */}
            <section
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
                style={{
                    background: `radial-gradient(circle at 88% 15%, rgba(16,185,129,0.28) 0%, transparent 45%), linear-gradient(135deg, ${activeProfile.themeStyle?.heroBgHex || "#070D59"} 0%, #071917 100%)`,
                }}
            >
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 uppercase text-[10px] font-black tracking-widest">
                                Modular Bridge · {activeProfile.shortName}
                            </span>
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${
                                    health.connected
                                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                                        : "bg-rose-500/20 text-rose-300 border-rose-400/30"
                                }`}
                            >
                                <span className={`size-1.5 rounded-full ${health.connected ? "bg-emerald-400 animate-pulse" : "bg-rose-400"}`} />
                                {health.connected ? `LIVE DB SYNC · ${health.latencyMs}ms` : "BRIDGE DISCONNECTED"}
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Copteller Cooperative Oversight</h1>
                        <p className="text-xs sm:text-sm text-white/75 font-medium max-w-2xl">
                            Real-time institutional supervision of Copteller unions, hire-purchase assets, escrow custody, and CBN cooperative returns.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-bold text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20">
                            <a href={`${health.appUrl}/copteller/superadmin`} target="_blank" rel="noopener noreferrer">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Standalone Copteller
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-10 rounded-xl font-bold text-xs gap-1.5 bg-white/10 hover:bg-white/20 text-white border-white/20">
                            <a href="/api/admin/copteller/export?format=csv">
                                <Download className="h-3.5 w-3.5" /> CBN CSV Return
                            </a>
                        </Button>
                        <Button
                            onClick={runLiveVaultAudit}
                            disabled={runningAudit || !health.connected}
                            size="sm"
                            className="h-10 rounded-xl font-black text-xs gap-1.5 bg-white text-slate-950 hover:bg-white/90 px-4 shadow-lg"
                        >
                            {runningAudit ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5 text-emerald-600" />}
                            {runningAudit ? "Auditing SQL..." : "Run Live Vault Audit"}
                        </Button>
                    </div>
                </div>
            </section>

            {!health.connected && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                        <p className="font-black text-rose-600">Copteller Bridge Offline</p>
                        <p className="text-muted-foreground">
                            {health.error || "Configure COPTELLER_DATABASE_URI in environment variables to stream live Copteller cooperative ledgers."}
                        </p>
                    </div>
                </div>
            )}

            {/* Live Reconciliation Output */}
            {reconReport && (
                <div className="rounded-2xl border bg-slate-950 text-slate-100 p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${reconReport.allPassed ? "bg-emerald-400" : "bg-amber-400"}`} />
                            <span className="text-xs font-mono font-bold uppercase tracking-wider">
                                Live Copteller SQL Reconciliation ({reconReport.durationMs}ms)
                            </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(reconReport.ranAt).toLocaleString()}
                        </span>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                        {reconReport.checks.map((c: any, idx: number) => (
                            <div key={idx} className="flex items-start gap-2">
                                <span className={c.passed ? "text-emerald-400" : "text-amber-400"}>
                                    {c.passed ? "✓" : "!"}
                                </span>
                                <span>
                                    <strong>{c.name}:</strong> {c.detail}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit flex-wrap">
                {[
                    { key: "overview", label: "Overview" },
                    { key: "unions", label: `Unions (${cooperatives.length})`, badge: pendingCoops.length },
                    { key: "schemes", label: `Schemes (${schemes.length})` },
                    { key: "grants", label: `Loans & Grants (${loans.length})`, badge: pendingLoans.length },
                    { key: "assets", label: `Contracts & HP (${contracts.length})` },
                    { key: "vault", label: `Vault (${vaultSecrets.length})` },
                    { key: "compliance", label: `Audit Logs (${auditLogs.length})` },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as any)}
                        className={`relative px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === t.key
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {t.label}
                        {t.badge ? (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                                {t.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* OVERVIEW */}
            {activeTab === "overview" && (
                <div className="space-y-6">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            {
                                label: "Active Cooperatives",
                                val: String(kpis.activeCooperatives ?? 0),
                                sub: `${kpis.pendingCooperatives ?? 0} pending · ${kpis.totalMembers ?? 0} active members`,
                                icon: Building2,
                            },
                            {
                                label: "Copteller Escrow Custody",
                                val: `₦${((kpis.escrowBalanceKobo ?? 0) / 100).toLocaleString()}`,
                                sub: "Sum of live Copteller ledger accounts",
                                icon: Lock,
                            },
                            {
                                label: "Active Contracts & HP",
                                val: String(kpis.activeContracts ?? 0),
                                sub: `${kpis.defaultingContracts ?? 0} defaulting · ${kpis.completedContracts ?? 0} completed`,
                                icon: Truck,
                            },
                            {
                                label: "Contract Collection Rate",
                                val: `${kpis.collectionRatePct ?? 0}%`,
                                sub: `₦${((kpis.totalContractCollectedKobo ?? 0) / 100).toLocaleString()} collected`,
                                icon: CircleDollarSign,
                            },
                        ].map((s, i) => (
                            <div key={i} className="bg-card border rounded-2xl p-5 space-y-2.5">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary w-fit">
                                    <s.icon className="h-4 w-4" />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{s.label}</p>
                                <p className="text-2xl font-black">{s.val}</p>
                                <p className="text-[11px] text-muted-foreground">{s.sub}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-card border rounded-2xl p-6 space-y-4">
                            <h3 className="text-sm font-black">Live Sector Distribution</h3>
                            {snapshot?.sectorDistribution?.length === 0 ? (
                                <p className="text-xs text-muted-foreground">No cooperatives registered in Copteller yet.</p>
                            ) : (
                                snapshot?.sectorDistribution?.map((s: any) => (
                                    <div key={s.sector} className="space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="capitalize">{s.sector.replace(/_/g, " ")}</span>
                                            <span className="text-muted-foreground">{s.coops} coop(s) · {s.members} members ({s.pct}%)</span>
                                        </div>
                                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-primary rounded-full" style={{ width: `${s.pct}%` }} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="bg-card border rounded-2xl p-6 space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider flex items-center gap-2">
                                <Bell className="h-4 w-4 text-primary" /> Live Risk Signals
                            </h3>
                            <div className="space-y-2 text-xs">
                                <div className="p-3 rounded-xl bg-muted/40 flex justify-between font-bold">
                                    <span>Pending Union Approvals</span>
                                    <span>{kpis.pendingCooperatives ?? 0}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex justify-between font-bold">
                                    <span>Pending Loan Disbursals</span>
                                    <span>{kpis.pendingLoansCount ?? 0}</span>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex justify-between font-bold">
                                    <span>Defaulting HP Contracts</span>
                                    <span className={(kpis.defaultingContracts ?? 0) > 0 ? "text-rose-600" : "text-emerald-600"}>
                                        {kpis.defaultingContracts ?? 0}
                                    </span>
                                </div>
                                <div className="p-3 rounded-xl bg-muted/40 flex justify-between font-bold">
                                    <span>Avg Member Credit Score</span>
                                    <span className="text-emerald-600">{kpis.avgCreditScore ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* UNIONS */}
            {activeTab === "unions" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black">Registered Copteller Cooperatives ({cooperatives.length})</h2>
                    {cooperatives.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No cooperatives registered in Copteller yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {cooperatives.map((c: any) => (
                                <div key={c.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="text-sm font-black">{c.name}</p>
                                            <StatusBadge status={c.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {c.sector} · {c.cooperative_type} · Reg: {c.registration_number || "N/A"} · State: {c.state || "N/A"}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">
                                            Leader: {c.leader_name} · {c.current_member_count || 0} members · Escrow fee: {c.escrow_fee_percent ?? 1.5}%
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {c.status !== "active" ? (
                                            <Button
                                                size="sm"
                                                disabled={busyId !== null}
                                                onClick={() =>
                                                    mutateCopteller(
                                                        { action: "update_cooperative_status", cooperative_id: c.id, status: "active" },
                                                        `Approved "${c.name}" under bank license.`,
                                                        `coop-${c.id}`
                                                    )
                                                }
                                                className="rounded-xl font-bold gap-1"
                                            >
                                                <Check className="h-3.5 w-3.5" /> Approve
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={busyId !== null}
                                                onClick={() =>
                                                    mutateCopteller(
                                                        { action: "update_cooperative_status", cooperative_id: c.id, status: "suspended" },
                                                        `Suspended "${c.name}".`,
                                                        `coop-${c.id}`
                                                    )
                                                }
                                                className="rounded-xl font-bold text-rose-600 border-rose-200 gap-1"
                                            >
                                                <X className="h-3.5 w-3.5" /> Suspend
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SCHEMES */}
            {activeTab === "schemes" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black">Cooperative Schemes & Bank Underwriting ({schemes.length})</h2>
                    {schemes.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No schemes found in Copteller.</p>
                    ) : (
                        <div className="space-y-3">
                            {schemes.map((s: any) => (
                                <div key={s.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black">{s.name}</p>
                                            <StatusBadge status={s.status} />
                                            <Badge variant="outline" className="text-[10px]">
                                                {s.bank_approved ? "Bank Approved" : "Awaiting Bank Sign-Off"}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Type: {s.scheme_type} · Yield: {s.yield_rate ?? 0}% · Target: ₦{(Number(s.target_capital || 0) / 100).toLocaleString()} · Enrolled: {s.enrolled_count || 0}/{s.max_participants || "∞"}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant={s.bank_approved ? "outline" : "default"}
                                        disabled={busyId !== null}
                                        onClick={() =>
                                            mutateCopteller(
                                                { action: "toggle_scheme_approval", scheme_id: s.id, bank_approved: !s.bank_approved },
                                                `${s.bank_approved ? "Revoked" : "Granted"} bank approval for "${s.name}".`,
                                                `scheme-${s.id}`
                                            )
                                        }
                                        className="rounded-xl font-bold"
                                    >
                                        {s.bank_approved ? "Revoke Sign-Off" : "Grant Bank Sign-Off"}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* GRANTS & LOANS */}
            {activeTab === "grants" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black">Cooperative Loans & Grant Disbursals ({loans.length})</h2>
                    {loans.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No loans or grant requests in Copteller.</p>
                    ) : (
                        <div className="space-y-3">
                            {loans.map((l: any) => (
                                <div key={l.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-black">{l.borrower_name}</p>
                                            <StatusBadge status={l.status} />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {l.purpose || "Cooperative Facility"} · {l.duration_months}m @ {l.interest_rate}% · Principal: ₦{(Number(l.principal || 0) / 100).toLocaleString()}
                                        </p>
                                    </div>
                                    {l.status === "pending" && (
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={busyId !== null}
                                                onClick={() =>
                                                    mutateCopteller(
                                                        { action: "reject_loan", loan_id: l.id },
                                                        `Loan #${l.id} rejected.`,
                                                        `loan-${l.id}`
                                                    )
                                                }
                                                className="text-rose-600"
                                            >
                                                Reject
                                            </Button>
                                            <Button
                                                size="sm"
                                                disabled={busyId !== null}
                                                onClick={() =>
                                                    mutateCopteller(
                                                        { action: "disburse_loan", loan_id: l.id },
                                                        `Disbursed Loan #${l.id} atomically to borrower wallet!`,
                                                        `loan-${l.id}`
                                                    )
                                                }
                                            >
                                                Disburse Atomically
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* CONTRACTS & HP ASSETS */}
            {activeTab === "assets" && (
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <div className="p-6 border-b">
                        <h2 className="text-lg font-black">Live HP Assets & Cooperative Contracts ({contracts.length})</h2>
                    </div>
                    {contracts.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-12 text-center">No active contracts in Copteller.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Asset / Contract</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Member Ref</th>
                                        <th className="px-4 py-3">Paid</th>
                                        <th className="px-4 py-3">Obligation</th>
                                        <th className="px-4 py-3">Missed</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {contracts.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3 font-bold">
                                                {c.asset_name || `Contract #${c.id}`}
                                                {c.asset_identifier && <span className="block text-[10px] font-mono text-muted-foreground">{c.asset_identifier}</span>}
                                            </td>
                                            <td className="px-4 py-3 uppercase font-mono">{c.contract_type}</td>
                                            <td className="px-4 py-3 font-mono text-muted-foreground">{c.member}</td>
                                            <td className="px-4 py-3 font-black text-emerald-600">
                                                ₦{(Number(c.total_paid || 0) / 100).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                ₦{(Number(c.total_obligation || c.asset_value || 0) / 100).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-bold">{c.missed_payments || 0}</td>
                                            <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* VAULT */}
            {activeTab === "vault" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" /> Copteller Secret Vault (Masked Oversight)
                    </h2>
                    {vaultSecrets.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No vault entries stored in Copteller yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {vaultSecrets.map((s: any) => (
                                <div key={s.id} className="border rounded-2xl p-4 space-y-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-sm font-black">{s.name}</p>
                                            <p className="text-[11px] text-muted-foreground">{s.category} · {s.description || "Service credential"}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] uppercase">
                                            {s.encrypted ? "AES-256-GCM" : "Masked"}
                                        </Badge>
                                    </div>
                                    <p className="font-mono text-xs bg-muted/50 px-3 py-2 rounded-lg">{s.maskedPreview}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* AUDIT LOGS */}
            {activeTab === "compliance" && (
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <div className="p-6 border-b flex items-center justify-between">
                        <h2 className="text-lg font-black">Live Copteller Immutable Audit Stream</h2>
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold text-xs gap-1.5">
                            <a href="/api/admin/copteller/export?format=json" target="_blank">
                                <Download className="h-3.5 w-3.5" /> JSON Snapshot
                            </a>
                        </Button>
                    </div>
                    {auditLogs.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-12 text-center">No Copteller audit logs found.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">Time</th>
                                        <th className="px-4 py-3">Actor</th>
                                        <th className="px-4 py-3">Action</th>
                                        <th className="px-4 py-3">Entity</th>
                                        <th className="px-4 py-3">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {auditLogs.map((a: any) => (
                                        <tr key={a.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                                                {new Date(a.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 font-semibold">{a.actor_name || a.actor_id} ({a.actor_role})</td>
                                            <td className="px-4 py-3 font-mono font-bold text-primary">{a.action}</td>
                                            <td className="px-4 py-3">{a.entity_type} #{a.entity_id}</td>
                                            <td className="px-4 py-3 font-mono font-bold">
                                                {a.amount_kobo ? `₦${(Number(a.amount_kobo) / 100).toLocaleString()}` : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default function CoptellerSuperadminPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Copteller Bridge...</div>}>
            <CoptellerSuperadminContent />
        </React.Suspense>
    )
}
