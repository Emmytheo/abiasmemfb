"use client"

import * as React from "react"
import {
    ShieldAlert,
    RefreshCw,
    Truck,
    Building2,
    Download,
    Check,
    X,
    Zap,
    CircleDollarSign,
    Lock,
    ArrowUpRight,
    Loader2,
    Landmark,
    ArrowRightLeft,
    KeyRound,
    FileSpreadsheet,
    CheckCircle2,
    Users2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"
import { EcosystemRailCard } from "@/components/banking/ecosystem-rail-card"
import { CbnHealthGauge } from "@/components/banking/charts/bank-charts"

type BridgeTab = "escrow" | "console" | "settlements" | "underwriting" | "schemes" | "contracts" | "vault" | "audit"

const fmtNaira = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

function StatusPill({ status }: { status: string }) {
    const s = String(status || "").toLowerCase()
    const cls =
        s === "active" || s === "approved" || s === "completed" || s === "settled"
            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-700 dark:text-emerald-400"
            : s === "pending"
              ? "bg-amber-500/10 border-amber-500/25 text-amber-700 dark:text-amber-400"
              : "bg-rose-500/10 border-rose-500/25 text-rose-700 dark:text-rose-400"
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[10px] font-black uppercase ${cls}`}>
            {status}
        </span>
    )
}

function CoptellerCustodyContent() {
    const searchParams = useSearchParams()
    const [activeTab, setActiveTab] = React.useState<BridgeTab>("escrow")
    const [snapshot, setSnapshot] = React.useState<any>(null)
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [reconReport, setReconReport] = React.useState<any>(null)
    const [runningAudit, setRunningAudit] = React.useState(false)

    // Interactive Cooperative Custody Drawer
    const [selectedCoop, setSelectedCoop] = React.useState<any | null>(null)
    const [sweepAmountNaira, setSweepAmountNaira] = React.useState("")
    const [embedPath, setEmbedPath] = React.useState<string>("/copteller/admin?embed=1")

    React.useEffect(() => {
        const tab = searchParams?.get("tab")
        if (tab === "unions") setActiveTab("escrow")
        else if (tab === "grants") setActiveTab("underwriting")
        else if (tab === "assets") setActiveTab("contracts")
        else if (tab === "compliance") setActiveTab("audit")
        else if (tab && ["escrow", "console", "settlements", "underwriting", "schemes", "contracts", "vault", "audit"].includes(tab)) {
            setActiveTab(tab as BridgeTab)
        }
    }, [searchParams])

    const loadSnapshot = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/copteller", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Could not load Copteller Custody Bridge")
                return
            }
            setSnapshot(data)
            if (selectedCoop) {
                const updated = (data.cooperatives || []).find((c: any) => c.id === selectedCoop.id)
                if (updated) setSelectedCoop(updated)
            }
        } catch {
            toast.error("Failed to reach Copteller Bridge API")
        } finally {
            setLoading(false)
        }
    }, [selectedCoop?.id])

    React.useEffect(() => {
        loadSnapshot()
    }, [])

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
                    ? `Live Copteller vault audit PASSED (${data.report.durationMs}ms)`
                    : "Audit completed with items to review"
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
                return null
            }
            toast.success(successMsg)
            await loadSnapshot()
            return data
        } finally {
            setBusyId(null)
        }
    }

    if (loading && !snapshot) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-semibold">Synchronizing BankSuite ⇄ Copteller Custody Rails...</span>
            </div>
        )
    }

    const health = snapshot?.health || { connected: false, appUrl: "http://localhost:3001" }
    const kpis = snapshot?.kpis || {}
    const cooperatives = snapshot?.cooperatives || []
    const settlements = snapshot?.settlements || []
    const memberTelemetry = snapshot?.memberTelemetry || []
    const schemes = snapshot?.schemes || []
    const contracts = snapshot?.contracts || []
    const loans = snapshot?.loans || []
    const vaultSecrets = snapshot?.vaultSecrets || []
    const auditLogs = snapshot?.auditLogs || []

    const pendingCoops = cooperatives.filter((c: any) => c.status === "pending").length
    const pendingLoans = loans.filter((l: any) => l.status === "pending").length

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
            <BankPageHeader
                badge={`Optional Cooperative Submodule · ${
                    health.mode === "http_bridge"
                        ? "Decoupled HTTP Headless Rail"
                        : health.mode === "direct_db"
                          ? "Same-Cluster Direct DB + HTTP Ready"
                          : "Standalone Mode (Unlinked)"
                }`}
                livePill={
                    health.connected
                        ? `${health.mode === "http_bridge" ? "HTTP Bridge" : "Live Rail"} · ${health.latencyMs}ms`
                        : "Module Detached"
                }
                liveTone={health.connected ? "emerald" : "amber"}
                title="Copteller Custody & Headless Cooperative Module"
                subtitle="Modularly connect an independent Copteller Cooperative OS deployment to provision 3000XXXXXX Escrow NUBANs, settle GL 2100 sweeps, co-underwrite loans, and administer cooperatives headlessly — without reinventing Copteller inside BankSuite."
                actions={
                    <>
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <a href={`${health.appUrl}/copteller/partner`} target="_blank" rel="noopener noreferrer">
                                Copteller Partner Portal <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <a href="/api/admin/copteller/export?format=csv">
                                <Download className="h-3.5 w-3.5" /> CBN CSV Return
                            </a>
                        </Button>
                        <Button
                            onClick={runLiveVaultAudit}
                            disabled={runningAudit || !health.connected}
                            size="sm"
                            className="h-9 rounded-xl font-black text-xs gap-1.5 shadow-sm"
                        >
                            {runningAudit ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            {runningAudit ? "Auditing SQL..." : "Run Live Vault Audit"}
                        </Button>
                    </>
                }
            />

            {!health.connected && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/5 p-5 flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                        <p className="font-black text-rose-700">Copteller Bridge Disconnected</p>
                        <p className="text-muted-foreground">
                            {health.error || "Configure COPTELLER_DATABASE_URI in BankSuite environment variables."}
                        </p>
                    </div>
                </div>
            )}

            {reconReport && (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-border/70 pb-2.5">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className={`h-4 w-4 ${reconReport.allPassed ? "text-emerald-600" : "text-amber-600"}`} />
                            <span className="text-xs font-black uppercase tracking-wider text-foreground">
                                Live Cross-Database Vault Audit ({reconReport.durationMs}ms)
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setReconReport(null)}
                            className="text-xs font-bold text-muted-foreground hover:text-foreground"
                        >
                            Dismiss
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {reconReport.checks.map((c: any, idx: number) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-card border border-border/70 flex items-start gap-2">
                                <span className={`font-black ${c.passed ? "text-emerald-600" : "text-amber-600"}`}>
                                    {c.passed ? "✓" : "!"}
                                </span>
                                <div>
                                    <p className="font-bold text-foreground">{c.name}</p>
                                    <p className="text-[11px] text-muted-foreground">{c.detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* KPI Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Registered Cooperatives",
                        val: `${kpis.activeCooperatives ?? 0} Active`,
                        sub: `${pendingCoops} pending · ${kpis.totalMembers ?? 0} members`,
                        icon: Building2,
                        tone: "bg-emerald-500/10 text-emerald-600",
                    },
                    {
                        label: "Copteller Live Vault Float",
                        val: fmtNaira(kpis.escrowBalanceKobo ?? 0),
                        sub: "Real-time sum of member & union accounts",
                        icon: Lock,
                        tone: "bg-blue-500/10 text-blue-600",
                    },
                    {
                        label: "BankSuite Custody (GL 2100)",
                        val: fmtNaira(kpis.custodySettledKobo ?? 0),
                        sub: `${kpis.provisionedPoolsCount ?? 0} NUBAN pools · ${settlements.length} sweeps`,
                        icon: Landmark,
                        tone: "bg-violet-500/10 text-violet-600",
                    },
                    {
                        label: "HP & Thrift Collection SLA",
                        val: `${kpis.collectionRatePct ?? 100}%`,
                        sub: `${kpis.activeContracts ?? 0} active contracts · ${fmtNaira(kpis.totalContractCollectedKobo ?? 0)}`,
                        icon: CircleDollarSign,
                        tone: "bg-amber-500/10 text-amber-600",
                    },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}>
                                <k.icon className="h-4 w-4" />
                            </div>
                        </div>
                        <p className="text-xl sm:text-2xl font-black tabular-nums-fintech text-foreground">{k.val}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{k.sub}</p>
                    </div>
                ))}
            </div>

            <EcosystemRailCard
                compact
                coptellerConnected={Boolean(health.connected)}
                coptellerUrl={health.appUrl}
                activeCooperatives={kpis.activeCooperatives || 0}
                activeMembers={kpis.totalMembers || 0}
                coptellerEscrowNaira={(kpis.escrowBalanceKobo || 0) / 100}
                banksuiteCustodyNaira={(kpis.custodySettledKobo || 0) / 100}
                pendingCreditCount={pendingLoans}
                avgTrustScore={kpis.avgCreditScore || 75}
                activeTerminals={2}
            />

            {/* Tab Bar */}
            <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1.5 rounded-2xl border border-border/70 w-fit">
                {[
                    { key: "escrow", label: `Escrow Pools & Unions (${cooperatives.length})`, badge: pendingCoops },
                    { key: "console", label: "Headless Cooperative Console" },
                    { key: "settlements", label: `Settlement Rail (${settlements.length})` },
                    { key: "underwriting", label: `Credit Telemetry (${loans.length})`, badge: pendingLoans },
                    { key: "schemes", label: `Schemes (${schemes.length})` },
                    { key: "contracts", label: `HP Contracts (${contracts.length})` },
                    { key: "vault", label: `Vault (${vaultSecrets.length})` },
                    { key: "audit", label: `Audit (${auditLogs.length})` },
                ].map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key as BridgeTab)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            activeTab === t.key
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <span>{t.label}</span>
                        {t.badge ? (
                            <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black">
                                {t.badge}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>

            {/* TAB 1B: HEADLESS COOPERATIVE CONSOLE (EMBEDDED SUBMODULE) */}
            {activeTab === "console" && (
                <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-muted/20">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-sm font-black text-foreground">Embedded Copteller Headless Administration</h2>
                                <Badge variant="outline" className="text-[9px] font-black uppercase border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                                    Modular Submodule
                                </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Administer Ajo thrift circles, Keke/transport member forms, union executives, and asset leases directly from the connected Copteller deployment ({health.appUrl || "Configure COPTELLER_BRIDGE_URL"}).
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            {[
                                { label: "Coop Overview", path: "/copteller/admin?embed=1" },
                                { label: "Members", path: "/copteller/admin/members?embed=1" },
                                { label: "Schemes", path: "/copteller/admin/schemes?embed=1" },
                                { label: "Unions", path: "/copteller/superadmin/unions?embed=1" },
                                { label: "Forms & Settings", path: "/copteller/admin/settings?embed=1" },
                            ].map((r) => (
                                <button
                                    key={r.path}
                                    type="button"
                                    onClick={() => setEmbedPath(r.path)}
                                    className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                        embedPath === r.path
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "bg-background border border-border text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {r.label}
                                </button>
                            ))}
                            {health.appUrl && (
                                <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-[11px] font-bold gap-1">
                                    <a href={`${health.appUrl}${embedPath.replace("?embed=1", "")}`} target="_blank" rel="noopener noreferrer">
                                        Pop Out <ArrowUpRight className="h-3 w-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>
                    {health.appUrl ? (
                        <iframe
                            src={`${health.appUrl}${embedPath}`}
                            title="Copteller Headless Cooperative Administration"
                            className="w-full h-[760px] border-0 bg-background"
                        />
                    ) : (
                        <div className="p-12 text-center space-y-2 text-xs text-muted-foreground">
                            <p className="font-black text-sm text-foreground">No Remote Copteller Submodule URL Configured</p>
                            <p>Set <code className="font-mono px-1.5 py-0.5 rounded bg-muted">COPTELLER_BRIDGE_URL</code> and <code className="font-mono px-1.5 py-0.5 rounded bg-muted">COPTELLER_BRIDGE_SECRET</code> to attach an independent Copteller deployment.</p>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 1: ESCROW POOLS & UNIONS (RAIL 1) */}
            {activeTab === "escrow" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/70">
                        <div>
                            <h2 className="text-base font-black text-foreground">Regulated Cooperative Custody Registry</h2>
                            <p className="text-xs text-muted-foreground">
                                Click any cooperative to inspect custody terms, provision a dedicated 3000XXXXXX BankSuite Escrow NUBAN, or execute a GL 2100 settlement sweep.
                            </p>
                        </div>
                    </div>

                    {cooperatives.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-10 text-center">No cooperatives found in Copteller.</p>
                    ) : (
                        <div className="space-y-3">
                            {cooperatives.map((c: any) => {
                                const pool = c.escrow_pool
                                return (
                                    <div
                                        key={c.id}
                                        className="rounded-2xl border border-border/80 hover:border-primary/40 bg-muted/15 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all"
                                    >
                                        <div className="space-y-1.5 min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedCoop(c)
                                                        setSweepAmountNaira("")
                                                    }}
                                                    className="text-sm font-black text-foreground hover:text-primary text-left"
                                                >
                                                    {c.name}
                                                </button>
                                                <StatusPill status={c.status} />
                                                {pool ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 font-mono text-[10px] font-black">
                                                        Escrow NUBAN: {pool.escrow_nuban}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20 text-[10px] font-bold">
                                                        Escrow NUBAN Not Provisioned
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                Reg: <span className="font-mono font-bold text-foreground">{c.registration_number || "Pending"}</span> ·{" "}
                                                <span className="capitalize">{c.sector}</span> · {c.lga ? `${c.lga}, ` : ""}{c.state || "Nigeria"} ·{" "}
                                                {c.current_member_count || 0} members
                                            </p>
                                            {pool && (
                                                <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                                    Settled BankSuite Custody: {fmtNaira(pool.custody_balance_kobo)} · Escrow Fee: {(Number(pool.escrow_fee_bps || 150) / 100).toFixed(2)}%
                                                    {pool.last_swept_at ? ` · Last sweep ${new Date(pool.last_swept_at).toLocaleString()}` : ""}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {!pool ? (
                                                <Button
                                                    size="sm"
                                                    disabled={busyId !== null}
                                                    onClick={() =>
                                                        mutateCopteller(
                                                            { action: "provision_escrow_pool", cooperative_id: c.id },
                                                            `Provisioned regulated BankSuite Escrow NUBAN for ${c.name}!`,
                                                            `prov-${c.id}`
                                                        )
                                                    }
                                                    className="h-9 rounded-xl text-xs font-black gap-1.5"
                                                >
                                                    <Landmark className="h-3.5 w-3.5" />
                                                    {busyId === `prov-${c.id}` ? "Provisioning..." : "Provision Escrow NUBAN"}
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    disabled={busyId !== null}
                                                    onClick={() => {
                                                        setSelectedCoop(c)
                                                        setSweepAmountNaira("")
                                                    }}
                                                    className="h-9 rounded-xl text-xs font-black gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    <ArrowRightLeft className="h-3.5 w-3.5" /> Sweep to GL 2100
                                                </Button>
                                            )}

                                            {c.status !== "active" ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busyId !== null}
                                                    onClick={() =>
                                                        mutateCopteller(
                                                            { action: "update_cooperative_status", cooperative_id: c.id, status: "active" },
                                                            `Approved "${c.name}" under MFB license.`,
                                                            `st-${c.id}`
                                                        )
                                                    }
                                                    className="h-9 rounded-xl text-xs font-bold gap-1"
                                                >
                                                    <Check className="h-3.5 w-3.5 text-emerald-600" /> Approve
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
                                                            `st-${c.id}`
                                                        )
                                                    }
                                                    className="h-9 rounded-xl text-xs font-bold text-rose-600 border-rose-200"
                                                >
                                                    Suspend
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: SETTLEMENT RAIL LEDGER */}
            {activeTab === "settlements" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div>
                        <h2 className="text-base font-black text-foreground">Bi-Directional Settlement Ledger (Rails 1, 2 &amp; 3)</h2>
                        <p className="text-xs text-muted-foreground">
                            Audited record of every Escrow Treasury Sweep, Telemetry Loan Disbursement, and POS Agent Cooperative Cash-In posted to BankSuite GL 2100.
                        </p>
                    </div>
                    {settlements.length === 0 ? (
                        <div className="py-12 text-center space-y-2">
                            <p className="text-sm font-bold text-muted-foreground">No settlement sweeps posted yet.</p>
                            <p className="text-xs text-muted-foreground">
                                Go to <strong>Escrow Pools &amp; Unions</strong> and click <strong>Provision Escrow NUBAN</strong> or <strong>Sweep to GL 2100</strong> to post your first live settlement.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-black">Reference &amp; GL Journal</th>
                                        <th className="px-4 py-3 font-black">Rail Type</th>
                                        <th className="px-4 py-3 font-black">Cooperative / Counterparty</th>
                                        <th className="px-4 py-3 font-black text-right">Amount</th>
                                        <th className="px-4 py-3 font-black text-right">Fee</th>
                                        <th className="px-4 py-3 font-black text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/70">
                                    {settlements.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <p className="font-mono font-bold text-foreground">{s.reference}</p>
                                                <p className="font-mono text-[10px] text-muted-foreground">{s.gl_journal_ref || "—"}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline" className="text-[9px] font-black uppercase">
                                                    {String(s.rail_type || "").replace(/_/g, " ")}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-foreground">{s.coop_name || s.counterparty_label}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">
                                                    {s.escrow_nuban || s.counterparty_label} · {new Date(s.created_at).toLocaleString()}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono font-black text-foreground">
                                                {fmtNaira(s.amount_kobo)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                                                {fmtNaira(s.fee_kobo)}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <StatusPill status={s.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: CREDIT TELEMETRY & UNDERWRITING (RAIL 2) */}
            {activeTab === "underwriting" && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                        <div>
                            <h2 className="text-base font-black text-foreground">Copteller Credit &amp; Grant Disbursal Queue</h2>
                            <p className="text-xs text-muted-foreground">
                                Approving a Copteller loan posts DR GL 1300 / CR GL 2100 in BankSuite and credits the borrower&apos;s Copteller wallet atomically.
                            </p>
                        </div>
                        {loans.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-8 text-center">
                                No pending Copteller loans in queue. All cooperative facilities are clear.
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {loans.map((l: any) => (
                                    <div key={l.id} className="rounded-2xl border border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-black text-sm">{l.borrower_name}</span>
                                                <StatusPill status={l.status} />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Principal: <strong className="text-foreground">{fmtNaira(l.principal)}</strong> · {l.duration_months} mo @ {l.interest_rate}% · {l.purpose || "Cooperative Facility"}
                                            </p>
                                        </div>
                                        {l.status === "pending" && (
                                            <div className="flex gap-2 shrink-0">
                                                <Button
                                                    size="sm"
                                                    disabled={busyId !== null}
                                                    onClick={() =>
                                                        mutateCopteller(
                                                            { action: "disburse_loan", loan_id: l.id },
                                                            `Disbursed Loan #${l.id} via BankSuite GL 1300 → Copteller wallet!`,
                                                            `loan-${l.id}`
                                                        )
                                                    }
                                                    className="h-9 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                                                >
                                                    <Check className="h-3.5 w-3.5 mr-1" /> Approve &amp; Disburse
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    disabled={busyId !== null}
                                                    onClick={() =>
                                                        mutateCopteller(
                                                            { action: "reject_loan", loan_id: l.id },
                                                            `Rejected Copteller loan #${l.id}.`,
                                                            `loan-rej-${l.id}`
                                                        )
                                                    }
                                                    className="h-9 rounded-xl text-xs font-bold text-rose-600"
                                                >
                                                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-5 space-y-4">
                        <CbnHealthGauge
                            label="Average Cooperative Trust Score"
                            value={kpis.avgCreditScore > 100 ? Math.round(kpis.avgCreditScore) : Math.round(300 + (kpis.avgCreditScore || 72) * 5.5)}
                            max={850}
                            unit="/ 850"
                            statusText="Pre-Qualified Underwriting Pool"
                            tone="emerald"
                            subtitle="Computed live from Copteller member Ajo consistency and HP lease streak telemetry."
                        />
                        <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Users2 className="h-4 w-4 text-emerald-600" /> Verified Member Behavioral Telemetry
                            </h3>
                            {memberTelemetry.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-4 text-center">No active member telemetry records yet.</p>
                            ) : (
                                <div className="space-y-2">
                                    {memberTelemetry.slice(0, 8).map((m: any, i: number) => {
                                        const score = Number(m.credit_score || 70)
                                        const score850 = score > 100 ? Math.round(score) : Math.round(300 + score * 5.5)
                                        return (
                                            <div key={i} className="p-3 rounded-xl border border-border/70 bg-muted/20 flex items-center justify-between text-xs">
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground truncate">{m.member_name}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">
                                                        Contributed: {fmtNaira(m.total_contributed || 0)} · {m.role || "member"}
                                                    </p>
                                                </div>
                                                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono font-black text-[11px] shrink-0">
                                                    {score850}/850
                                                </span>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 4: SCHEMES */}
            {activeTab === "schemes" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-black text-foreground">Cooperative Schemes &amp; Syndicated Pools ({schemes.length})</h2>
                    {schemes.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">No cooperative schemes configured yet.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {schemes.map((s: any) => (
                                <div key={s.id} className="rounded-2xl border border-border/80 p-4 space-y-3 bg-muted/15">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <p className="font-black text-sm text-foreground">{s.name}</p>
                                            <p className="text-[11px] text-muted-foreground capitalize">
                                                {String(s.scheme_type || "thrift").replace(/_/g, " ")} · Target {fmtNaira(s.target_capital || 0)} · Yield {s.yield_rate || 0}%
                                            </p>
                                        </div>
                                        <StatusPill status={s.bank_approved ? "approved" : "pending"} />
                                    </div>
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            variant={s.bank_approved ? "outline" : "default"}
                                            disabled={busyId !== null}
                                            onClick={() =>
                                                mutateCopteller(
                                                    { action: "toggle_scheme_approval", scheme_id: s.id, bank_approved: !s.bank_approved },
                                                    s.bank_approved ? `Revoked MFB underwriting on "${s.name}".` : `Authorized "${s.name}" under MFB custody!`,
                                                    `sch-${s.id}`
                                                )
                                            }
                                            className="h-8 rounded-xl text-xs font-bold"
                                        >
                                            {s.bank_approved ? "Revoke Approval" : "Authorize Under MFB"}
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 5: CONTRACTS & HP */}
            {activeTab === "contracts" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <h2 className="text-base font-black text-foreground">Hire-Purchase &amp; Thrift Contracts ({contracts.length})</h2>
                    {contracts.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">No active contracts yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3 font-black">Contract &amp; Asset</th>
                                        <th className="px-4 py-3 font-black">Member</th>
                                        <th className="px-4 py-3 font-black text-right">Paid / Obligation</th>
                                        <th className="px-4 py-3 font-black text-right">Streak / Missed</th>
                                        <th className="px-4 py-3 font-black text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/70">
                                    {contracts.map((c: any) => (
                                        <tr key={c.id} className="hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-foreground">{c.asset_name || c.contract_type}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">{c.asset_identifier || `#${c.id}`}</p>
                                            </td>
                                            <td className="px-4 py-3 font-mono text-[11px]">{c.member}</td>
                                            <td className="px-4 py-3 text-right font-mono font-bold">
                                                {fmtNaira(c.total_paid || 0)} / {fmtNaira(c.total_obligation || c.asset_value || 0)}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                <span className="text-emerald-600">{c.payment_streak || 0}w</span> ·{" "}
                                                <span className={Number(c.missed_payments || 0) > 0 ? "text-rose-600" : "text-muted-foreground"}>
                                                    {c.missed_payments || 0} missed
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <StatusPill status={c.status} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 6: VAULT */}
            {activeTab === "vault" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                        <KeyRound className="h-4 w-4 text-primary" /> Copteller Encrypted Vault Keys (Read-Only Masked)
                    </h2>
                    {vaultSecrets.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-6">No vault secrets indexed.</p>
                    ) : (
                        vaultSecrets.map((s: any) => (
                            <div key={s.id} className="p-3.5 rounded-2xl border border-border/70 bg-muted/15 flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-mono font-bold">{s.name}</p>
                                    <p className="text-[11px] text-muted-foreground">{s.description || s.category}</p>
                                </div>
                                <span className="font-mono text-[11px] px-2.5 py-1 rounded-lg bg-muted border border-border">
                                    {s.maskedPreview}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB 7: AUDIT */}
            {activeTab === "audit" && (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                    <h2 className="text-base font-black text-foreground flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-primary" /> Copteller Immutable Audit Stream
                    </h2>
                    {auditLogs.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-6">No Copteller audit entries logged yet.</p>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {auditLogs.map((a: any) => (
                                <div key={a.id} className="py-2.5 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-mono font-bold text-foreground">{a.action}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {a.actor_name || a.actor_role} · {a.entity_type} #{a.entity_id}
                                        </p>
                                    </div>
                                    <span className="text-[11px] text-muted-foreground font-mono">
                                        {new Date(a.created_at).toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* SLIDE-OVER DRAWER: COOPERATIVE CUSTODY & GL 2100 SWEEP */}
            <BankSideDrawer
                open={Boolean(selectedCoop)}
                onClose={() => setSelectedCoop(null)}
                title={selectedCoop?.name || "Cooperative Custody"}
                subtitle={`Reg. No: ${selectedCoop?.registration_number || "Pending"} · ${selectedCoop?.state || "Nigeria"}`}
                badge={selectedCoop ? <StatusPill status={selectedCoop.status} /> : null}
            >
                {selectedCoop && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-muted/30 border border-border/70">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Escrow Pool NUBAN</p>
                                <p className="text-sm font-mono font-black text-foreground mt-1">
                                    {selectedCoop.escrow_pool?.escrow_nuban || "Not Provisioned"}
                                </p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-400">Settled GL 2100 Float</p>
                                <p className="text-sm font-mono font-black text-emerald-700 dark:text-emerald-400 mt-1">
                                    {fmtNaira(selectedCoop.escrow_pool?.custody_balance_kobo || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-border/80 p-4 space-y-3 bg-muted/15">
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                Execute Live GL 2100 Treasury Settlement Sweep
                            </h3>
                            <p className="text-xs text-muted-foreground">
                                Posts a balanced double-entry journal (<strong>DR 1000 Cash/NIBSS Nostro</strong> → <strong>CR 2100 Cooperative Escrow Trust</strong> + <strong>CR 4000 Escrow Fee</strong>) and updates the cooperative&apos;s ring-fenced Escrow NUBAN balance in PostgreSQL.
                            </p>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">
                                    Sweep Amount (₦) — leave blank to auto-sweep live Copteller float delta
                                </label>
                                <Input
                                    type="number"
                                    min={1000}
                                    step={5000}
                                    placeholder="Auto-calculate from Copteller vault balance"
                                    value={sweepAmountNaira}
                                    onChange={(e) => setSweepAmountNaira(e.target.value)}
                                    className="h-10 rounded-xl font-bold"
                                />
                            </div>
                            <Button
                                className="w-full h-10 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                                disabled={busyId !== null}
                                onClick={async () => {
                                    const res = await mutateCopteller(
                                        {
                                            action: "execute_settlement_sweep",
                                            cooperative_id: selectedCoop.id,
                                            amount_naira: sweepAmountNaira ? Number(sweepAmountNaira) : undefined,
                                        },
                                        `Settlement sweep posted to GL 2100 for ${selectedCoop.name}!`,
                                        `sweep-${selectedCoop.id}`
                                    )
                                    if (res) setSweepAmountNaira("")
                                }}
                            >
                                <ArrowRightLeft className="h-4 w-4" />
                                {busyId === `sweep-${selectedCoop.id}` ? "Posting GL Sweep..." : "Execute Settlement Sweep Now"}
                            </Button>
                        </div>

                        <div className="rounded-2xl border border-border/80 p-4 space-y-2 text-xs">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Society Metadata</p>
                            <div className="flex justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Union Leader</span>
                                <span className="font-bold">{selectedCoop.leader_name}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Sector &amp; Cycle</span>
                                <span className="font-bold capitalize">{selectedCoop.sector} · {selectedCoop.cycle_frequency || "weekly"}</span>
                            </div>
                            <div className="flex justify-between py-1 border-b border-border/60">
                                <span className="text-muted-foreground">Escrow Custody Fee</span>
                                <span className="font-mono font-bold">{selectedCoop.escrow_fee_percent ?? 1.5}%</span>
                            </div>
                            <div className="flex justify-between py-1">
                                <span className="text-muted-foreground">Credit Facility Ceiling</span>
                                <span className="font-mono font-bold">{fmtNaira(selectedCoop.escrow_pool?.credit_facility_limit_kobo || 1000000000)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}

export default function CoptellerAdminBridgePage() {
    return (
        <React.Suspense
            fallback={
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
            }
        >
            <CoptellerCustodyContent />
        </React.Suspense>
    )
}
