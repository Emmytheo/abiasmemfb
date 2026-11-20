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
    AlertTriangle,
    Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"

type OpsTab = "teller" | "funding" | "approvals" | "reconciliation" | "audit"

function OperationsContent() {
    const { activeProfile } = useBankProfile()
    const searchParams = useSearchParams()
    const initialTab = (searchParams?.get("tab") as OpsTab) || "teller"
    const [activeTab, setActiveTab] = React.useState<OpsTab>(
        ["teller", "funding", "approvals", "reconciliation", "audit"].includes(initialTab)
            ? initialTab
            : "teller"
    )

    const [loading, setLoading] = React.useState(true)
    const [accounts, setAccounts] = React.useState<any[]>([])
    const [fundingRequests, setFundingRequests] = React.useState<any[]>([])
    const [approvals, setApprovals] = React.useState<any[]>([])
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

    const loadAll = React.useCallback(async () => {
        setLoading(true)
        try {
            const [tellerRes, apprRes, auditRes] = await Promise.all([
                fetch("/api/admin/teller"),
                fetch("/api/admin/approvals"),
                fetch("/api/admin/audit-logs?limit=150"),
            ])
            const [tellerData, apprData, auditData] = await Promise.all([
                tellerRes.json(),
                apprRes.json(),
                auditRes.json(),
            ])
            if (tellerData.success) {
                setAccounts(tellerData.accounts || [])
                setFundingRequests(tellerData.fundingRequests || [])
                if (tellerData.makerCheckerThresholdNaira) {
                    setThresholdNaira(tellerData.makerCheckerThresholdNaira)
                }
                if (!selectedAccountId && tellerData.accounts?.[0]?.id) {
                    setSelectedAccountId(String(tellerData.accounts[0].id))
                }
            }
            if (apprData.success) setApprovals(apprData.approvals || [])
            if (auditData.success) setAuditLogs(auditData.logs || [])
        } catch (err) {
            toast.error("Failed to synchronize banking operations console")
        } finally {
            setLoading(false)
        }
    }, [selectedAccountId])

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
        if (activeTab === "reconciliation" && !recon) {
            runReconciliation()
        }
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
            if (data.queued) {
                toast.info("Queued for Maker-Checker dual authorization.")
            } else {
                toast.success(
                    `Posted ${direction === "deposit" ? "+" : "-"}₦${Number(amountNaira).toLocaleString()} (Ref: ${data.posting?.reference})`
                )
            }
            setAmountNaira("")
            setNarration("")
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
                body: JSON.stringify({
                    action: "update_controls",
                    account_id: acc.id,
                    [field]: !acc[field],
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Control update failed")
                return
            }
            toast.success(`Updated ${field === "is_frozen" ? "Account Freeze" : "Post-No-Debit"} for ${acc.account_number}`)
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
                body: JSON.stringify({
                    action: approve ? "approve_funding" : "reject_funding",
                    request_id: requestId,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Action failed")
                return
            }
            toast.success(approve ? "Inbound funding verified and credited to ledger!" : "Funding request rejected.")
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

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Branded Executive Operations Hero */}
            <section
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
                style={{
                    background: `radial-gradient(circle at 90% 10%, ${activeProfile.themeStyle?.accentHex || "#F4C414"}30 0%, transparent 45%), linear-gradient(135deg, ${activeProfile.themeStyle?.heroBgHex || "#070D59"} 0%, #090E24 100%)`,
                }}
            >
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-2.5 max-w-2xl">
                        <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 uppercase text-[10px] font-black tracking-widest">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Core Banking Operations · {activeProfile.shortName}</span>
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">Teller, Governance &amp; Reconciliation Desk</h1>
                        <p className="text-xs sm:text-sm text-white/75 font-medium">
                            Atomic double-entry teller postings, compliance account freezes/PND, maker-checker dual control, SQL trial balance, and CSV audit exports.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 shrink-0">
                        <div className="grid grid-cols-2 gap-3 bg-black/30 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-xs">
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Funding Queue</p>
                                <p className="text-lg font-black tabular-nums-fintech">{pendingFundingCount}</p>
                            </div>
                            <div className="border-l border-white/10 pl-3">
                                <p className="text-[9px] font-bold uppercase tracking-widest text-white/60">Approvals</p>
                                <p className="text-lg font-black tabular-nums-fintech">{pendingApprovalsCount}</p>
                            </div>
                        </div>
                        <Button
                            variant="outline"
                            onClick={loadAll}
                            disabled={loading}
                            className="rounded-xl h-11 font-bold gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
                        >
                            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh Ledger
                        </Button>
                    </div>
                </div>
            </section>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1.5 bg-muted p-1.5 rounded-2xl w-fit">
                {[
                    { key: "teller", label: "Teller & Controls", icon: Landmark },
                    { key: "funding", label: `Funding Queue (${pendingFundingCount})`, icon: ArrowDownLeft },
                    { key: "approvals", label: `Maker-Checker (${pendingApprovalsCount})`, icon: ShieldCheck },
                    { key: "reconciliation", label: "Trial Balance & Recon", icon: Scale },
                    { key: "audit", label: "Audit Trail", icon: FileSpreadsheet },
                ].map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setActiveTab(t.key as OpsTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === t.key
                                ? "bg-background text-foreground shadow-sm"
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
                            <form onSubmit={handleTellerPost} className="lg:col-span-5 bg-card border rounded-2xl p-6 space-y-5 shadow-sm h-fit">
                                <div>
                                    <h2 className="text-lg font-black">Atomic Teller Posting</h2>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Postings ≥ ₦{thresholdNaira.toLocaleString()} auto-route to Maker-Checker approval.
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
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Customer Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
                                        required
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.account_number} · {a.holder_name} (₦{(Number(a.balance || 0) / 100).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Amount (NGN)</label>
                                    <Input
                                        type="number"
                                        min="1"
                                        step="0.01"
                                        required
                                        value={amountNaira}
                                        onChange={(e) => setAmountNaira(e.target.value)}
                                        placeholder="e.g. 50000"
                                        className="h-11 rounded-xl font-mono text-base font-bold"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase text-muted-foreground">Teller Narration / Voucher Ref</label>
                                    <Input
                                        type="text"
                                        required
                                        value={narration}
                                        onChange={(e) => setNarration(e.target.value)}
                                        placeholder="e.g. Verified branch cash deposit slip #401"
                                        className="h-11 rounded-xl"
                                    />
                                </div>

                                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={queueForApproval}
                                        onChange={(e) => setQueueForApproval(e.target.checked)}
                                    />
                                    Route to Maker-Checker dual authorization queue
                                </label>

                                <Button type="submit" disabled={submitting === "teller"} className="w-full h-11 rounded-xl font-black">
                                    {submitting === "teller" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                    {queueForApproval ? "Queue for Dual Approval" : `Post Atomic ${direction === "deposit" ? "Credit" : "Debit"}`}
                                </Button>
                            </form>

                            {/* Live Accounts Compliance Controls */}
                            <div className="lg:col-span-7 bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                                <h2 className="text-lg font-black">Account Compliance & Restriction Controls</h2>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                                                <th className="px-3 py-3">Account</th>
                                                <th className="px-3 py-3">Balance</th>
                                                <th className="px-3 py-3">Status</th>
                                                <th className="px-3 py-3 text-right">Controls</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {accounts.map((a) => (
                                                <tr key={a.id} className="hover:bg-muted/20">
                                                    <td className="px-3 py-3">
                                                        <p className="font-mono font-bold">{a.account_number}</p>
                                                        <p className="text-[11px] text-muted-foreground">{a.holder_name}</p>
                                                    </td>
                                                    <td className="px-3 py-3 font-mono font-black">
                                                        ₦{(Number(a.balance || 0) / 100).toLocaleString()}
                                                    </td>
                                                    <td className="px-3 py-3 space-x-1">
                                                        <Badge variant="outline" className="text-[10px] uppercase">{a.status}</Badge>
                                                        {a.is_frozen && <Badge variant="destructive" className="text-[9px]">FROZEN</Badge>}
                                                        {a.pnd_enabled && <Badge className="bg-amber-500/15 text-amber-600 text-[9px]">PND</Badge>}
                                                    </td>
                                                    <td className="px-3 py-3 text-right space-x-1.5">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={submitting !== null}
                                                            onClick={() => handleToggleControl(a, "is_frozen")}
                                                            className="h-7 text-[10px] font-bold"
                                                        >
                                                            {a.is_frozen ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                                            {a.is_frozen ? "Unfreeze" : "Freeze"}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            disabled={submitting !== null}
                                                            onClick={() => handleToggleControl(a, "pnd_enabled")}
                                                            className="h-7 text-[10px] font-bold"
                                                        >
                                                            {a.pnd_enabled ? "Lift PND" : "Set PND"}
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

                    {/* 2. PENDING FUNDING REQUESTS */}
                    {activeTab === "funding" && (
                        <div className="bg-card border rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-black">Client Inbound Funding Verification Queue</h2>
                            {fundingRequests.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-12 text-center">No client funding requests submitted yet.</p>
                            ) : (
                                <div className="divide-y">
                                    {fundingRequests.map((f) => (
                                        <div key={f.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-sm">{f.reference}</span>
                                                    <Badge variant="outline" className="text-[10px] uppercase">{f.method}</Badge>
                                                    <Badge variant={f.status === "completed" ? "default" : f.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] uppercase">
                                                        {f.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {f.holder_name} · Account {f.account_number} · {f.narration || "Inbound Deposit"}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-lg font-black text-emerald-600">
                                                    ₦{(Number(f.amount_kobo || 0) / 100).toLocaleString()}
                                                </span>
                                                {f.status === "pending" && (
                                                    <>
                                                        <Button size="sm" variant="outline" disabled={submitting !== null} onClick={() => handleFundingAction(f.id, false)} className="text-destructive">
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" disabled={submitting !== null} onClick={() => handleFundingAction(f.id, true)}>
                                                            Verify & Credit
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 3. MAKER-CHECKER APPROVALS */}
                    {activeTab === "approvals" && (
                        <div className="bg-card border rounded-2xl p-6 space-y-4">
                            <h2 className="text-lg font-black">Maker-Checker Dual Authorization Queue</h2>
                            {approvals.length === 0 ? (
                                <p className="text-sm text-muted-foreground py-12 text-center">No maker-checker approvals queued.</p>
                            ) : (
                                <div className="divide-y">
                                    {approvals.map((a) => (
                                        <div key={a.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm">{a.title}</span>
                                                    <Badge variant={a.status === "approved" ? "default" : a.status === "rejected" ? "destructive" : "secondary"} className="text-[10px] uppercase">
                                                        {a.status}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Maker: {a.requested_by_email} · {a.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="font-mono font-black text-base">
                                                    ₦{(Number(a.amount_kobo || 0) / 100).toLocaleString()}
                                                </span>
                                                {a.status === "pending" && (
                                                    <>
                                                        <Button size="sm" variant="outline" disabled={submitting !== null} onClick={() => handleApprovalDecision(a.id, "reject")} className="text-destructive">
                                                            Reject
                                                        </Button>
                                                        <Button size="sm" disabled={submitting !== null} onClick={() => handleApprovalDecision(a.id, "approve")}>
                                                            Approve & Execute
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* 4. TRIAL BALANCE & RECONCILIATION */}
                    {activeTab === "reconciliation" && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black">Live Core Ledger Trial Balance & Integrity Scan</h2>
                                <Button onClick={runReconciliation} disabled={submitting === "recon"} className="rounded-xl font-bold gap-2">
                                    <RefreshCw className={`h-4 w-4 ${submitting === "recon" ? "animate-spin" : ""}`} /> Re-Run SQL Audit
                                </Button>
                            </div>
                            {recon && (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-card border rounded-2xl p-5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Total Customer Deposits</p>
                                            <p className="text-2xl font-black mt-1">₦{(recon.summary.totalCustomerDepositsKobo / 100).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-card border rounded-2xl p-5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Active Loan Exposure</p>
                                            <p className="text-2xl font-black mt-1">₦{(recon.summary.totalLoanExposureKobo / 100).toLocaleString()}</p>
                                        </div>
                                        <div className="bg-card border rounded-2xl p-5">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground">Net Liquidity Surplus</p>
                                            <p className="text-2xl font-black text-emerald-600 mt-1">₦{(recon.summary.netLiquidityPositionKobo / 100).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="bg-card border rounded-2xl p-6 space-y-3">
                                        <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Automated Integrity Assertions ({recon.durationMs}ms)</h3>
                                        {recon.checks.map((c: any) => (
                                            <div key={c.id} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
                                                {c.passed ? (
                                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                                ) : (
                                                    <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                                )}
                                                <div>
                                                    <p className="text-sm font-bold">{c.name}</p>
                                                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* 5. IMMUTABLE AUDIT TRAIL */}
                    {activeTab === "audit" && (
                        <div className="bg-card border rounded-2xl p-6 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <h2 className="text-lg font-black">Immutable BankSuite Audit Log</h2>
                                <div className="flex items-center gap-2">
                                    <Input
                                        placeholder="Filter action, actor, entity..."
                                        value={auditSearch}
                                        onChange={(e) => setAuditSearch(e.target.value)}
                                        className="h-9 w-56 rounded-xl"
                                    />
                                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold gap-1.5">
                                        <a href="/api/admin/audit-logs?format=csv">
                                            <Download className="h-3.5 w-3.5" /> Export CSV
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                                            <th className="px-3 py-3">Timestamp</th>
                                            <th className="px-3 py-3">Actor</th>
                                            <th className="px-3 py-3">Action</th>
                                            <th className="px-3 py-3">Entity</th>
                                            <th className="px-3 py-3">Amount</th>
                                            <th className="px-3 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {filteredLogs.map((l) => (
                                            <tr key={l.id} className="hover:bg-muted/20">
                                                <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">
                                                    {new Date(l.created_at).toLocaleString()}
                                                </td>
                                                <td className="px-3 py-2.5 font-semibold">{l.actor_email || l.actor_id}</td>
                                                <td className="px-3 py-2.5 font-mono font-bold text-primary">{l.action}</td>
                                                <td className="px-3 py-2.5">{l.entity_type} #{l.entity_id || "-"}</td>
                                                <td className="px-3 py-2.5 font-mono font-bold">
                                                    {l.amount_kobo != null ? `₦${(Number(l.amount_kobo) / 100).toLocaleString()}` : "—"}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <Badge variant="outline" className="text-[9px] uppercase">{l.status}</Badge>
                                                </td>
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

export default function OperationsPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading Operations Desk...</div>}>
            <OperationsContent />
        </React.Suspense>
    )
}
