"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import {
    Landmark,
    ShieldCheck,
    Scale,
    FileSpreadsheet,
    Loader2,
    CheckCircle2,
    XCircle,
    RefreshCw,
    Lock,
    Unlock,
    Download,
    ArrowUpRight,
    ArrowDownLeft,
    BookOpen,
    PlusCircle,
    Clock,
    Play,
    AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { CbnHealthGauge } from "@/components/banking/charts/bank-charts"

type OpsTab = "teller" | "gl" | "eod" | "funding" | "approvals" | "reconciliation" | "audit"

const fmtNaira = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

function OperationsContent() {
    const searchParams = useSearchParams()
    const initialTab = (searchParams?.get("tab") as OpsTab) || "teller"
    const [activeTab, setActiveTab] = React.useState<OpsTab>(
        ["teller", "gl", "eod", "funding", "approvals", "reconciliation", "audit"].includes(initialTab)
            ? initialTab
            : "teller"
    )

    const [loading, setLoading] = React.useState(true)
    const [accounts, setAccounts] = React.useState<any[]>([])
    const [fundingRequests, setFundingRequests] = React.useState<any[]>([])
    const [approvals, setApprovals] = React.useState<any[]>([])
    const [treasury, setTreasury] = React.useState<any>(null)
    const [eodData, setEodData] = React.useState<any>(null)
    const [recon, setRecon] = React.useState<any>(null)
    const [auditLogs, setAuditLogs] = React.useState<any[]>([])
    const [auditSearch, setAuditSearch] = React.useState("")
    const [thresholdNaira, setThresholdNaira] = React.useState(5000000)

    // Teller form state
    const [selectedAccountId, setSelectedAccountId] = React.useState("")
    const [direction, setDirection] = React.useState<"deposit" | "withdrawal">("deposit")
    const [amountNaira, setAmountNaira] = React.useState("")
    const [narration, setNarration] = React.useState("")
    const [queueForApproval, setQueueForApproval] = React.useState(false)
    const [submitting, setSubmitting] = React.useState<string | null>(null)

    // Manual GL Journal state
    const [debitGl, setDebitGl] = React.useState("1000")
    const [creditGl, setCreditGl] = React.useState("4000")
    const [glAmount, setGlAmount] = React.useState("")
    const [glNarration, setGlNarration] = React.useState("")

    const loadAll = React.useCallback(async () => {
        setLoading(true)
        try {
            const [tellerRes, apprRes, auditRes, treasRes, eodRes] = await Promise.all([
                fetch("/api/admin/teller", { cache: "no-store" }),
                fetch("/api/admin/approvals", { cache: "no-store" }),
                fetch("/api/admin/audit-logs?limit=150", { cache: "no-store" }),
                fetch("/api/admin/treasury", { cache: "no-store" }),
                fetch("/api/admin/eod", { cache: "no-store" }),
            ])
            const [tellerData, apprData, auditData, treasData, eodJson] = await Promise.all([
                tellerRes.json(),
                apprRes.json(),
                auditRes.json(),
                treasRes.json(),
                eodRes.json(),
            ])
            if (tellerData.success) {
                setAccounts(tellerData.accounts || [])
                setFundingRequests(tellerData.fundingRequests || [])
                if (tellerData.makerCheckerThresholdNaira) setThresholdNaira(tellerData.makerCheckerThresholdNaira)
                if (!selectedAccountId && tellerData.accounts?.[0]?.id) {
                    setSelectedAccountId(String(tellerData.accounts[0].id))
                }
            }
            if (apprData.success) setApprovals(apprData.approvals || [])
            if (auditData.success) setAuditLogs(auditData.logs || [])
            if (treasData.success) setTreasury(treasData)
            if (eodJson.success) setEodData(eodJson)
        } catch {
            toast.error("Failed to synchronize banking operations console")
        } finally {
            setLoading(false)
        }
    }, [selectedAccountId])

    const handleRunEod = async (action: "sync_gl" | "run_eod") => {
        setSubmitting(action)
        try {
            const res = await fetch("/api/admin/eod", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "EOD operation failed")
                return
            }
            toast.success(data.message || "EOD batch completed!")
            await loadAll()
        } catch {
            toast.error("Network error running EOD engine")
        } finally {
            setSubmitting(null)
        }
    }

    const runReconciliation = async () => {
        setSubmitting("recon")
        try {
            const res = await fetch("/api/admin/reconciliation")
            const data = await res.json()
            if (data.success) {
                setRecon(data)
                toast.success(
                    data.allPassed
                        ? "Trial Balance & Ledger Reconciliation PASSED"
                        : "Reconciliation completed with warnings"
                )
            } else {
                toast.error(data.error || "Reconciliation failed")
            }
        } catch {
            toast.error("Reconciliation request failed")
        } finally {
            setSubmitting(null)
        }
    }

    React.useEffect(() => {
        loadAll()
    }, [])

    React.useEffect(() => {
        if (activeTab === "reconciliation" && !recon) runReconciliation()
    }, [activeTab])

    const handleTellerPost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccountId || !amountNaira || Number(amountNaira) <= 0) {
            toast.error("Select an account and enter a positive Naira amount.")
            return
        }
        setSubmitting("teller")
        try {
            const res = await fetch("/api/admin/teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: direction,
                    account_id: Number(selectedAccountId),
                    amount_naira: Number(amountNaira),
                    narration: narration.trim() || `Branch Teller ${direction === "deposit" ? "Cash-In" : "Cash-Out"}`,
                    queue_for_approval: queueForApproval,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Teller posting failed")
                return
            }
            if (data.queued) toast.info("Queued for Maker-Checker dual authorization.")
            else toast.success(`Posted ${direction === "deposit" ? "+" : "-"}₦${Number(amountNaira).toLocaleString()} (Ref: ${data.posting?.reference})`)
            setAmountNaira("")
            setNarration("")
            await loadAll()
        } finally {
            setSubmitting(null)
        }
    }

    const handlePostGlJournal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!glAmount || Number(glAmount) <= 0 || !glNarration.trim()) {
            toast.error("Enter a valid journal amount and narration.")
            return
        }
        setSubmitting("gl")
        try {
            const res = await fetch("/api/admin/treasury", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    debit_gl: debitGl,
                    credit_gl: creditGl,
                    amount_naira: Number(glAmount),
                    narration: glNarration.trim(),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "GL posting failed")
                return
            }
            toast.success(`Balanced GL journal ${data.journalRef} posted!`)
            setGlAmount("")
            setGlNarration("")
            await loadAll()
        } finally {
            setSubmitting(null)
        }
    }

    const handleToggleControl = async (acc: any, field: "is_frozen" | "pnd_enabled") => {
        setSubmitting(`ctrl-${acc.id}-${field}`)
        try {
            const res = await fetch("/api/admin/teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_controls", account_id: acc.id, [field]: !acc[field] }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Control update failed")
                return
            }
            toast.success(`Updated ${field === "is_frozen" ? "Freeze" : "PND"} for ${acc.account_number}`)
            await loadAll()
        } finally {
            setSubmitting(null)
        }
    }

    const handleFundingAction = async (requestId: number, approve: boolean) => {
        setSubmitting(`fund-${requestId}`)
        try {
            const res = await fetch("/api/admin/teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: approve ? "approve_funding" : "reject_funding", request_id: requestId }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Action failed")
                return
            }
            toast.success(approve ? "Funding verified and credited to ledger!" : "Funding request rejected.")
            await loadAll()
        } finally {
            setSubmitting(null)
        }
    }

    const handleApprovalDecision = async (id: number, decision: "approve" | "reject") => {
        setSubmitting(`appr-${id}`)
        try {
            const res = await fetch("/api/admin/approvals", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, decision }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Approval update failed")
                return
            }
            toast.success(decision === "approve" ? "Approved and executed atomically!" : "Request rejected.")
            await loadAll()
        } finally {
            setSubmitting(null)
        }
    }

    const pendingFundingCount = fundingRequests.filter((f) => f.status === "pending").length
    const pendingApprovalsCount = approvals.filter((a) => a.status === "pending").length
    const filteredLogs = auditLogs.filter((l) => {
        if (!auditSearch.trim()) return true
        const q = auditSearch.toLowerCase()
        return (
            String(l.action || "").toLowerCase().includes(q) ||
            String(l.actor_email || "").toLowerCase().includes(q) ||
            String(l.entity_type || "").toLowerCase().includes(q)
        )
    })

    const tSum = treasury?.summary || {}
    const glAccounts = treasury?.glAccounts || []
    const recentGlEntries = treasury?.recentGlEntries || []

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
            <BankPageHeader
                badge="Core Banking & General Ledger"
                livePill={`Funding: ${pendingFundingCount} · Approvals: ${pendingApprovalsCount}`}
                liveTone={pendingApprovalsCount + pendingFundingCount > 0 ? "amber" : "emerald"}
                title="Teller, General Ledger & Reconciliation Desk"
                subtitle="Atomic OTC teller postings, double-entry Chart of Accounts & Balance Sheet, maker-checker dual control, SQL trial balance, and immutable CSV audit exports."
                actions={
                    <>
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <a href="/api/admin/audit-logs?format=csv">
                                <Download className="h-3.5 w-3.5" /> Export Audit CSV
                            </a>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={loadAll}
                            disabled={loading}
                            className="h-9 rounded-xl font-bold text-xs gap-1.5"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Ledger
                        </Button>
                    </>
                }
            />

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1.5 rounded-2xl border border-border/70 w-fit">
                {[
                    { key: "teller", label: "Teller & Controls", icon: Landmark },
                    { key: "gl", label: "GL & Balance Sheet", icon: BookOpen },
                    { key: "eod", label: "EOD Close & Sync", icon: Clock },
                    { key: "funding", label: `Funding Queue (${pendingFundingCount})`, icon: ArrowDownLeft },
                    { key: "approvals", label: `Maker-Checker (${pendingApprovalsCount})`, icon: ShieldCheck },
                    { key: "reconciliation", label: "Trial Balance", icon: Scale },
                    { key: "audit", label: "Audit Trail", icon: FileSpreadsheet },
                ].map((t) => (
                    <button
                        key={t.key}
                        type="button"
                        onClick={() => setActiveTab(t.key as OpsTab)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === t.key
                                ? "bg-card text-foreground shadow-sm border border-border/80"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex h-64 items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading live ledger state...
                </div>
            ) : (
                <>
                    {/* 1. TELLER & ACCOUNT CONTROLS */}
                    {activeTab === "teller" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <form onSubmit={handleTellerPost} className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 space-y-5 shadow-sm h-fit">
                                <div>
                                    <h2 className="text-base font-black text-foreground">Atomic Teller Cash Posting</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Postings ≥ ₦{thresholdNaira.toLocaleString()} auto-route to Maker-Checker dual sign-off.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        type="button"
                                        variant={direction === "deposit" ? "default" : "outline"}
                                        onClick={() => setDirection("deposit")}
                                        className="rounded-xl font-bold gap-1.5"
                                    >
                                        <ArrowDownLeft className="h-4 w-4" /> Cash-In Credit
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={direction === "withdrawal" ? "destructive" : "outline"}
                                        onClick={() => setDirection("withdrawal")}
                                        className="rounded-xl font-bold gap-1.5"
                                    >
                                        <ArrowUpRight className="h-4 w-4" /> Cash-Out Debit
                                    </Button>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Customer Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full h-11 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                                        required
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.account_number} · {a.customer_name || a.account_type} (Bal: {fmtNaira(a.balance)})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
                                    <Input
                                        type="number"
                                        min="100"
                                        step="100"
                                        placeholder="e.g. 50000"
                                        value={amountNaira}
                                        onChange={(e) => setAmountNaira(e.target.value)}
                                        className="h-11 rounded-xl font-black text-base"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Teller Narration</label>
                                    <Input
                                        placeholder="e.g. OTC Branch Cash Deposit / Slip #4092"
                                        value={narration}
                                        onChange={(e) => setNarration(e.target.value)}
                                        className="h-11 rounded-xl text-xs font-semibold"
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={queueForApproval}
                                        onChange={(e) => setQueueForApproval(e.target.checked)}
                                        className="rounded"
                                    />
                                    Force Maker-Checker dual sign-off regardless of amount
                                </label>

                                <Button type="submit" disabled={submitting === "teller"} className="w-full h-11 rounded-xl font-black">
                                    {submitting === "teller" ? "Posting to Core Ledger..." : `Post ${direction === "deposit" ? "Cash-In Credit" : "Cash-Out Debit"}`}
                                </Button>
                            </form>

                            <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                                <div>
                                    <h2 className="text-base font-black text-foreground">Account Controls (Freeze &amp; PND)</h2>
                                    <p className="text-xs text-muted-foreground">Instant compliance locks on live NUBAN accounts.</p>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                            <tr>
                                                <th className="px-3 py-2.5 font-black">Account &amp; Holder</th>
                                                <th className="px-3 py-2.5 font-black text-right">Balance</th>
                                                <th className="px-3 py-2.5 font-black text-right">Restrictions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/70">
                                            {accounts.map((acc) => (
                                                <tr key={acc.id} className="hover:bg-muted/20">
                                                    <td className="px-3 py-3">
                                                        <p className="font-mono font-bold text-foreground">{acc.account_number}</p>
                                                        <p className="text-[11px] text-muted-foreground">{acc.customer_name || acc.account_type}</p>
                                                    </td>
                                                    <td className="px-3 py-3 text-right font-mono font-black">{fmtNaira(acc.balance)}</td>
                                                    <td className="px-3 py-3 text-right space-x-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant={acc.is_frozen ? "destructive" : "outline"}
                                                            disabled={submitting !== null}
                                                            onClick={() => handleToggleControl(acc, "is_frozen")}
                                                            className="h-7 text-[10px] font-bold rounded-lg px-2"
                                                        >
                                                            {acc.is_frozen ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                                            {acc.is_frozen ? "Unfreeze" : "Freeze"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant={acc.pnd_enabled ? "destructive" : "outline"}
                                                            disabled={submitting !== null}
                                                            onClick={() => handleToggleControl(acc, "pnd_enabled")}
                                                            className="h-7 text-[10px] font-bold rounded-lg px-2"
                                                        >
                                                            {acc.pnd_enabled ? "Lift PND" : "Set PND"}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. GENERAL LEDGER & BALANCE SHEET (NEW!) */}
                    {activeTab === "gl" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Assets (GL 1000–1300)</p>
                                    <p className="text-2xl font-black font-mono mt-1 text-foreground">{fmtNaira(tSum.totalAssetsKobo || 0)}</p>
                                    <p className="text-[11px] text-emerald-600 font-bold mt-1">Nostro + CBN Reserve + Loan Books</p>
                                </div>
                                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Liabilities (GL 2000–2200)</p>
                                    <p className="text-2xl font-black font-mono mt-1 text-foreground">{fmtNaira(tSum.totalLiabilitiesKobo || 0)}</p>
                                    <p className="text-[11px] text-blue-600 font-bold mt-1">CASA + GL 2100 Copteller Custody + Vaults</p>
                                </div>
                                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Shareholders&apos; Equity &amp; Net Income</p>
                                    <p className="text-2xl font-black font-mono mt-1 text-emerald-600">
                                        {fmtNaira((tSum.totalEquityKobo || 0) + (tSum.netIncomeKobo || 0))}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground font-bold mt-1">Tier-1 Capital + Recognized Fee/Interest Yield</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-8 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                                    <h2 className="text-base font-black text-foreground">Live Chart of Accounts (Double-Entry Core)</h2>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2.5 font-black">GL Code</th>
                                                    <th className="px-3 py-2.5 font-black">Account Title</th>
                                                    <th className="px-3 py-2.5 font-black">Category</th>
                                                    <th className="px-3 py-2.5 font-black text-right">Live Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/70">
                                                {glAccounts.map((g: any) => (
                                                    <tr key={g.code} className="hover:bg-muted/20">
                                                        <td className="px-3 py-3 font-mono font-black text-primary">{g.code}</td>
                                                        <td className="px-3 py-3">
                                                            <p className="font-bold text-foreground">{g.name}</p>
                                                            <p className="text-[10px] text-muted-foreground">{g.description}</p>
                                                        </td>
                                                        <td className="px-3 py-3">
                                                            <Badge variant="outline" className="text-[9px] uppercase font-black">
                                                                {g.category} ({g.normal_side})
                                                            </Badge>
                                                        </td>
                                                        <td className="px-3 py-3 text-right font-mono font-black text-foreground">
                                                            {fmtNaira(g.live_balance_kobo)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="lg:col-span-4 space-y-4">
                                    <CbnHealthGauge
                                        label="CBN Liquidity Ratio"
                                        value={tSum.cbnLiquidityRatioPct || 100}
                                        statusText={(tSum.cbnLiquidityRatioPct || 100) >= 20 ? "Healthy (≥ 20%)" : "Action Needed"}
                                        tone={(tSum.cbnLiquidityRatioPct || 100) >= 20 ? "emerald" : "rose"}
                                        subtitle="Statutory liquid assets divided by total regulated deposits."
                                    />

                                    <form onSubmit={handlePostGlJournal} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-3.5">
                                        <h3 className="text-sm font-black text-foreground flex items-center gap-1.5">
                                            <PlusCircle className="h-4 w-4 text-primary" /> Post Balanced GL Journal
                                        </h3>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Debit GL (DR)</label>
                                            <select
                                                value={debitGl}
                                                onChange={(e) => setDebitGl(e.target.value)}
                                                className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-bold"
                                            >
                                                {glAccounts.map((g: any) => (
                                                    <option key={g.code} value={g.code}>{g.code} · {g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Credit GL (CR)</label>
                                            <select
                                                value={creditGl}
                                                onChange={(e) => setCreditGl(e.target.value)}
                                                className="w-full h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-bold"
                                            >
                                                {glAccounts.map((g: any) => (
                                                    <option key={g.code} value={g.code}>{g.code} · {g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Amount (₦)</label>
                                            <Input
                                                type="number"
                                                min="100"
                                                placeholder="e.g. 250000"
                                                value={glAmount}
                                                onChange={(e) => setGlAmount(e.target.value)}
                                                className="h-9 rounded-xl font-bold text-xs"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-muted-foreground">Journal Narration</label>
                                            <Input
                                                placeholder="e.g. CBN reserve top-up / fee recognition"
                                                value={glNarration}
                                                onChange={(e) => setGlNarration(e.target.value)}
                                                className="h-9 rounded-xl text-xs"
                                                required
                                            />
                                        </div>
                                        <Button type="submit" disabled={submitting === "gl"} className="w-full h-9 rounded-xl font-black text-xs">
                                            {submitting === "gl" ? "Posting..." : "Post Balanced Entry (DR = CR)"}
                                        </Button>
                                    </form>
                                </div>
                            </div>

                            {recentGlEntries.length > 0 && (
                                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                                    <h3 className="text-sm font-black text-foreground">Recent Double-Entry Journal Lines</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2 font-black">Journal Ref</th>
                                                    <th className="px-3 py-2 font-black">GL Account</th>
                                                    <th className="px-3 py-2 font-black">Narration</th>
                                                    <th className="px-3 py-2 font-black text-right">Debit</th>
                                                    <th className="px-3 py-2 font-black text-right">Credit</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/70">
                                                {recentGlEntries.map((e: any) => (
                                                    <tr key={e.id}>
                                                        <td className="px-3 py-2.5 font-mono font-bold">{e.journal_ref}</td>
                                                        <td className="px-3 py-2.5 font-mono">{e.gl_code} · {e.gl_name}</td>
                                                        <td className="px-3 py-2.5 text-muted-foreground">{e.narration}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-blue-600">
                                                            {e.side === "debit" ? fmtNaira(e.amount_kobo) : "—"}
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600">
                                                            {e.side === "credit" ? fmtNaira(e.amount_kobo) : "—"}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. FUNDING QUEUE */}
                    {activeTab === "funding" && (
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-black text-foreground">Inbound Funding Verification Queue</h2>
                            {fundingRequests.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-8 text-center">No funding requests submitted yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {fundingRequests.map((f) => (
                                        <div key={f.id} className="rounded-2xl border border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs font-black">{f.reference}</span>
                                                    <Badge variant="outline" className="text-[9px] uppercase">{f.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    Account: <strong className="font-mono text-foreground">{f.account_number}</strong> · {f.method} · {fmtNaira(f.amount_kobo)}
                                                </p>
                                            </div>
                                            {f.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" disabled={submitting !== null} onClick={() => handleFundingAction(f.id, true)} className="rounded-xl font-bold text-xs gap-1">
                                                        <CheckCircle2 className="h-3.5 w-3.5" /> Verify &amp; Credit
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={submitting !== null} onClick={() => handleFundingAction(f.id, false)} className="rounded-xl font-bold text-xs text-rose-600 gap-1">
                                                        <XCircle className="h-3.5 w-3.5" /> Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. MAKER-CHECKER */}
                    {activeTab === "approvals" && (
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-black text-foreground">Maker-Checker Dual Authorization Queue</h2>
                            {approvals.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-8 text-center">No dual-control approvals queued.</p>
                            ) : (
                                <div className="space-y-3">
                                    {approvals.map((a) => (
                                        <div key={a.id} className="rounded-2xl border border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-black">{a.title}</p>
                                                    <Badge variant="outline" className="text-[9px] uppercase">{a.status}</Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {a.description} · Requested by {a.requested_by_email} · {fmtNaira(a.amount_kobo)}
                                                </p>
                                            </div>
                                            {a.status === "pending" && (
                                                <div className="flex gap-2">
                                                    <Button size="sm" disabled={submitting !== null} onClick={() => handleApprovalDecision(a.id, "approve")} className="rounded-xl font-bold text-xs">
                                                        Approve &amp; Execute
                                                    </Button>
                                                    <Button size="sm" variant="outline" disabled={submitting !== null} onClick={() => handleApprovalDecision(a.id, "reject")} className="rounded-xl font-bold text-xs text-rose-600">
                                                        Reject
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 5. RECONCILIATION */}
                    {activeTab === "reconciliation" && (
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-base font-black text-foreground">SQL Trial Balance &amp; Ledger Integrity</h2>
                                    <p className="text-xs text-muted-foreground">Automated non-negativity, idempotency, and liquidity coverage assertions.</p>
                                </div>
                                <Button size="sm" onClick={runReconciliation} disabled={submitting === "recon"} className="rounded-xl font-black text-xs gap-1.5">
                                    <RefreshCw className={`h-3.5 w-3.5 ${submitting === "recon" ? "animate-spin" : ""}`} /> Re-Run SQL Check
                                </Button>
                            </div>
                            {recon && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 border">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Customer Deposits</p>
                                            <p className="text-xl font-black font-mono mt-1">{fmtNaira(recon.summary.totalCustomerDepositsKobo)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-muted/30 border">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Active Loan Exposure</p>
                                            <p className="text-xl font-black font-mono mt-1">{fmtNaira(recon.summary.totalLoanExposureKobo)}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                            <p className="text-[10px] font-black uppercase text-emerald-700">Net Liquidity Coverage</p>
                                            <p className="text-xl font-black font-mono text-emerald-700 mt-1">{fmtNaira(recon.summary.netLiquidityPositionKobo)}</p>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        {recon.checks.map((c: any) => (
                                            <div key={c.id} className="p-3.5 rounded-2xl border border-border/80 flex items-start gap-2.5 text-xs">
                                                <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${c.passed ? "text-emerald-600" : "text-amber-600"}`} />
                                                <div>
                                                    <p className="font-bold text-foreground">{c.name}</p>
                                                    <p className="text-muted-foreground">{c.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 2B. END-OF-DAY (EOD) CLOSE-OF-BUSINESS & GL SUB-LEDGER SYNC */}
                    {activeTab === "eod" && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                <div className="lg:col-span-5 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
                                    <div>
                                        <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider border-emerald-500/30 text-emerald-600 bg-emerald-500/10 mb-2">
                                            Core Banking Batch Engine
                                        </Badge>
                                        <h2 className="text-lg font-black text-foreground">End-of-Day (EOD) Close-of-Business</h2>
                                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                            Synchronizes live customer/loan/vault sub-ledgers into the Double-Entry GL, accrues daily APY interest on Target Vaults (DR 5000 / CR 2200), tags PAR-30/60/90 overdue loans for CBN provisioning, sweeps due Standing Orders, and certifies Trial Balance equality.
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="p-3.5 rounded-2xl bg-muted/40 border">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Trial Balance</p>
                                            <p className={`text-sm font-black mt-1 ${eodData?.trialBalance?.balanced !== false ? "text-emerald-600" : "text-rose-600"}`}>
                                                {eodData?.trialBalance?.balanced !== false ? "DR = CR Balanced" : "Variance Detected"}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                {eodData?.trialBalance?.totalEntries || 0} journal lines
                                            </p>
                                        </div>
                                        <div className="p-3.5 rounded-2xl bg-muted/40 border">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Sub-Ledger Sync</p>
                                            <p className={`text-sm font-black mt-1 ${eodData?.variance?.inSync ? "text-emerald-600" : "text-amber-600"}`}>
                                                {eodData?.variance?.inSync ? "100% Tied Out" : "True-Up Needed"}
                                            </p>
                                            <p className="text-[10px] font-mono text-muted-foreground mt-0.5">
                                                Var: {fmtNaira(eodData?.variance?.totalAbsVarianceKobo || 0)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5">
                                        <Button
                                            onClick={() => handleRunEod("run_eod")}
                                            disabled={submitting !== null}
                                            className="w-full h-11 rounded-xl font-black text-xs gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            {submitting === "run_eod" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                                            Run Full EOD Close-of-Business Batch
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleRunEod("sync_gl")}
                                            disabled={submitting !== null}
                                            className="w-full h-10 rounded-xl font-bold text-xs gap-2"
                                        >
                                            {submitting === "sync_gl" ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                                            Sync Sub-Ledgers to Double-Entry GL Only
                                        </Button>
                                    </div>
                                </div>

                                <div className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                                    <div>
                                        <h2 className="text-base font-black text-foreground">GL Control Account vs Live Sub-Ledger Proof</h2>
                                        <p className="text-xs text-muted-foreground">Real-time tie-out between PostgreSQL sub-ledgers and General Ledger control codes.</p>
                                    </div>
                                    <div className="space-y-2.5">
                                        {(eodData?.variance?.variances || []).map((v: any) => {
                                            const synced = Number(v.varianceKobo || 0) === 0
                                            return (
                                                <div key={v.glCode} className="p-4 rounded-2xl border bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className="font-mono font-black text-[10px]">GL {v.glCode}</Badge>
                                                            <span className="font-bold text-foreground">{v.label}</span>
                                                        </div>
                                                        <p className="text-[11px] font-mono text-muted-foreground mt-1">
                                                            GL Balance: {fmtNaira(v.glBalanceKobo)} · Sub-Ledger: {fmtNaira(v.subLedgerKobo)}
                                                        </p>
                                                    </div>
                                                    <Badge
                                                        variant={synced ? "default" : "outline"}
                                                        className={`text-[10px] font-black uppercase w-fit ${
                                                            synced ? "bg-emerald-600 text-white" : "border-amber-500/40 text-amber-600 bg-amber-500/10"
                                                        }`}
                                                    >
                                                        {synced ? "In Sync" : `Δ ${fmtNaira(Math.abs(v.varianceKobo))}`}
                                                    </Badge>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                                <h2 className="text-base font-black text-foreground">EOD Close-of-Business Run History ({(eodData?.runs || []).length})</h2>
                                {(eodData?.runs || []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-8 text-center">No EOD batch runs executed yet. Click &ldquo;Run Full EOD Close-of-Business Batch&rdquo; above to execute your first close.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs">
                                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <tr>
                                                    <th className="px-3 py-2.5 font-black">Run Ref &amp; Time</th>
                                                    <th className="px-3 py-2.5 font-black">Operator</th>
                                                    <th className="px-3 py-2.5 font-black text-right">GL Synced</th>
                                                    <th className="px-3 py-2.5 font-black text-right">Vault Interest</th>
                                                    <th className="px-3 py-2.5 font-black text-right">Loans / PAR</th>
                                                    <th className="px-3 py-2.5 font-black text-right">CBN Provision</th>
                                                    <th className="px-3 py-2.5 font-black">Trial Balance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/70">
                                                {(eodData?.runs || []).map((r: any) => (
                                                    <tr key={r.id} className="hover:bg-muted/20">
                                                        <td className="px-3 py-2.5">
                                                            <p className="font-mono font-bold text-foreground">{r.run_ref}</p>
                                                            <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                                                        </td>
                                                        <td className="px-3 py-2.5">{r.actor_email}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold">{fmtNaira(r.gl_synced_kobo)}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono text-emerald-600 font-bold">{fmtNaira(r.interest_accrued_kobo)}</td>
                                                        <td className="px-3 py-2.5 text-right font-mono">
                                                            {r.loans_scanned} / <span className={r.overdue_loans_tagged > 0 ? "text-amber-600 font-bold" : ""}>{r.overdue_loans_tagged} PAR</span>
                                                        </td>
                                                        <td className="px-3 py-2.5 text-right font-mono font-bold">{fmtNaira(r.cbn_provision_required_kobo)}</td>
                                                        <td className="px-3 py-2.5">
                                                            <Badge variant={r.trial_balance_balanced ? "default" : "destructive"} className="text-[9px] uppercase font-black">
                                                                {r.trial_balance_balanced ? "Balanced" : "Variance"}
                                                            </Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* 6. AUDIT TRAIL */}
                    {activeTab === "audit" && (
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-base font-black text-foreground">Immutable Bank Audit Trail ({filteredLogs.length})</h2>
                                <Input
                                    value={auditSearch}
                                    onChange={(e) => setAuditSearch(e.target.value)}
                                    placeholder="Filter by action, email, or entity..."
                                    className="max-w-xs h-9 rounded-xl text-xs"
                                />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2.5 font-black">Timestamp</th>
                                            <th className="px-3 py-2.5 font-black">Action</th>
                                            <th className="px-3 py-2.5 font-black">Actor</th>
                                            <th className="px-3 py-2.5 font-black">Entity</th>
                                            <th className="px-3 py-2.5 font-black text-right">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70">
                                        {filteredLogs.map((l) => (
                                            <tr key={l.id} className="hover:bg-muted/20">
                                                <td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</td>
                                                <td className="px-3 py-2.5 font-mono font-bold text-foreground">{l.action}</td>
                                                <td className="px-3 py-2.5">{l.actor_email || l.actor_id}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{l.entity_type} #{l.entity_id || "—"}</td>
                                                <td className="px-3 py-2.5 text-right font-mono font-bold">{l.amount_kobo ? fmtNaira(l.amount_kobo) : "—"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

export default function OperationsAdminPage() {
    return (
        <React.Suspense
            fallback={
                <div className="flex h-[50vh] items-center justify-center">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                </div>
            }
        >
            <OperationsContent />
        </React.Suspense>
    )
}
