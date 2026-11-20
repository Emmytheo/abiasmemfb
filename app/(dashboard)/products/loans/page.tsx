"use client"

import * as React from "react"
import {
    CreditCard,
    PlusCircle,
    RefreshCw,
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ShieldCheck,
    Clock,
    DollarSign,
    X,
    Globe,
    Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"
import { CbnHealthGauge } from "@/components/banking/charts/bank-charts"

const fmtNaira = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

function LoanStatusPill({ status }: { status: string }) {
    const s = String(status || "").toLowerCase()
    const cls =
        s === "active" || s === "repaid"
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

export default function AdminLoansCreditDeskPage() {
    const [loading, setLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [tab, setTab] = React.useState<"banksuite" | "copteller">("banksuite")
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState("all")

    const [kpis, setKpis] = React.useState<any>({})
    const [bankLoans, setBankLoans] = React.useState<any[]>([])
    const [coptellerLoans, setCoptellerLoans] = React.useState<any[]>([])
    const [customers, setCustomers] = React.useState<any[]>([])

    // Slide-over Loan Dossier
    const [selectedLoan, setSelectedLoan] = React.useState<any | null>(null)
    const [repayAmountNaira, setRepayAmountNaira] = React.useState("")
    const [repayMode, setRepayMode] = React.useState<"debit_account" | "cash_otc">("debit_account")

    // Originate New Loan Modal
    const [showOriginate, setShowOriginate] = React.useState(false)
    const [origCustomerId, setOrigCustomerId] = React.useState("")
    const [origPrincipal, setOrigPrincipal] = React.useState("150000")
    const [origRate, setOrigRate] = React.useState("18")
    const [origMonths, setOrigMonths] = React.useState("6")
    const [origPurpose, setOrigPurpose] = React.useState("SME Working Capital Facility")
    const [origCollateral, setOrigCollateral] = React.useState("Union Executive Guarantee / BVN Mandate")
    const [origDisburseNow, setOrigDisburseNow] = React.useState(true)

    const loadPortfolio = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/loans", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load credit portfolio")
                return
            }
            setKpis(data.kpis || {})
            setBankLoans(data.bankLoans || [])
            setCoptellerLoans(data.coptellerLoans || [])
            setCustomers(data.customers || [])
            if (!origCustomerId && data.customers?.[0]?.id) {
                setOrigCustomerId(String(data.customers[0].id))
            }
            if (selectedLoan) {
                const updated = (data.bankLoans || []).find((l: any) => l.id === selectedLoan.id)
                if (updated) setSelectedLoan(updated)
            }
        } catch {
            toast.error("Failed to fetch live credit committee desk")
        } finally {
            setLoading(false)
        }
    }, [origCustomerId, selectedLoan?.id])

    React.useEffect(() => {
        loadPortfolio()
    }, [])

    const handleOriginate = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("originate")
        try {
            const res = await fetch("/api/admin/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "originate",
                    customer_id: Number(origCustomerId),
                    principal_naira: Number(origPrincipal),
                    interest_rate: Number(origRate),
                    duration_months: Number(origMonths),
                    purpose: origPurpose,
                    collateral: origCollateral,
                    disburse_immediately: origDisburseNow,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Loan origination failed")
                return
            }
            toast.success(
                origDisburseNow
                    ? `Loan #${data.loan.id} originated & disbursed to ${data.creditedAccountNumber || "borrower"} (GL 1200 posted)!`
                    : `Loan #${data.loan.id} queued for committee approval.`
            )
            setShowOriginate(false)
            await loadPortfolio()
        } finally {
            setBusy(null)
        }
    }

    const handleRepay = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedLoan || !repayAmountNaira) return
        setBusy("repay")
        try {
            const res = await fetch("/api/admin/loans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "repay",
                    loan_id: selectedLoan.id,
                    amount_naira: Number(repayAmountNaira),
                    source_mode: repayMode,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Repayment posting failed")
                return
            }
            toast.success(`Posted repayment of ₦${Number(repayAmountNaira).toLocaleString()} (Ref: ${data.reference})!`)
            setRepayAmountNaira("")
            await loadPortfolio()
        } finally {
            setBusy(null)
        }
    }

    const handleLoanDecision = async (loanId: number, decision: string, source: "banksuite" | "copteller" = "banksuite") => {
        setBusy(`dec-${source}-${loanId}`)
        try {
            const res = await fetch("/api/admin/loans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ loan_id: loanId, decision, source }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Status update failed")
                return
            }
            toast.success(`Loan #${loanId} updated (${decision}).`)
            await loadPortfolio()
        } finally {
            setBusy(null)
        }
    }

    const filteredBankLoans = bankLoans.filter((l) => {
        const q = search.toLowerCase()
        const matchQ =
            !q ||
            String(l.borrower_name || "").toLowerCase().includes(q) ||
            String(l.purpose || "").toLowerCase().includes(q) ||
            String(l.id).includes(q)
        const matchS = statusFilter === "all" || l.status === statusFilter
        return matchQ && matchS
    })

    const previewMonthly = React.useMemo(() => {
        const p = Number(origPrincipal) || 0
        const r = Number(origRate) || 0
        const m = Math.max(1, Number(origMonths) || 1)
        const total = p + p * (r / 100) * (m / 12)
        return Math.round(total / m)
    }, [origPrincipal, origRate, origMonths])

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
            <BankPageHeader
                badge="Credit Risk & Underwriting Committee"
                livePill={`NPL ${kpis.nplRatioPct ?? 0}% · Copteller SLA ${kpis.coptellerCollectionRatePct ?? 100}%`}
                liveTone={(kpis.nplRatioPct ?? 0) <= 5 ? "emerald" : "amber"}
                title="Credit Committee & Loan Lifecycle Desk"
                subtitle="Originate direct MFB credit facilities with automated amortization schedules, underwrite Copteller behavioral-score loans, post atomic repayments, and monitor PAR aging."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadPortfolio} disabled={loading} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Book
                        </Button>
                        <Button size="sm" onClick={() => setShowOriginate(true)} className="h-9 rounded-xl font-black text-xs gap-1.5 shadow-sm">
                            <PlusCircle className="h-3.5 w-3.5" /> Originate Loan Facility
                        </Button>
                    </>
                }
            />

            {/* KPIs + Radial NPL Gauge */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                        { label: "Active Exposure", val: fmtNaira(kpis.activeExposureKobo || 0), sub: `${kpis.activeLoans || 0} active facilities`, icon: DollarSign, tone: "bg-blue-500/10 text-blue-600" },
                        { label: "Pending Committee", val: String(kpis.pendingLoans || 0), sub: "BankSuite + Copteller", icon: Clock, tone: "bg-amber-500/10 text-amber-600" },
                        { label: "Fully Repaid", val: String(kpis.repaidLoans || 0), sub: "Zero arrears cleared", icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
                        { label: "Defaulted / PAR", val: String(kpis.defaultedLoans || 0), sub: fmtNaira(kpis.defaultedKobo || 0), icon: AlertTriangle, tone: "bg-rose-500/10 text-rose-600" },
                    ].map((k, idx) => (
                        <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-2">
                            <div className={`p-2 rounded-xl w-fit ${k.tone}`}>
                                <k.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</p>
                                <p className="text-xl font-black tabular-nums-fintech mt-0.5 text-foreground">{k.val}</p>
                                <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{k.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="lg:col-span-4">
                    <CbnHealthGauge
                        label="Portfolio NPL Ratio"
                        value={kpis.nplRatioPct ?? 0}
                        max={25}
                        statusText={(kpis.nplRatioPct ?? 0) <= 5 ? "CBN Prime (≤ 5%)" : "Watchlist Alert"}
                        tone={(kpis.nplRatioPct ?? 0) <= 5 ? "emerald" : "rose"}
                        subtitle="Copteller behavioral Trust Scores & Union Exec guarantees actively protect repayment quality."
                    />
                </div>
            </div>

            {/* Tab Switcher + Filters */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="inline-flex gap-1.5 bg-muted/60 p-1.5 rounded-2xl border border-border/70 w-fit">
                    <button
                        type="button"
                        onClick={() => setTab("banksuite")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            tab === "banksuite" ? "bg-card text-foreground shadow-sm border border-border/80" : "text-muted-foreground"
                        }`}
                    >
                        BankSuite Credit Book ({bankLoans.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => setTab("copteller")}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                            tab === "copteller" ? "bg-card text-foreground shadow-sm border border-border/80" : "text-muted-foreground"
                        }`}
                    >
                        <Globe className="h-3.5 w-3.5 text-emerald-600" /> Copteller Cooperative Loans ({coptellerLoans.length})
                    </button>
                </div>

                {tab === "banksuite" && (
                    <div className="flex flex-wrap items-center gap-2">
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search borrower or purpose..."
                            className="h-9 w-56 rounded-xl text-xs"
                        />
                        {(["all", "pending", "active", "repaid", "defaulted"] as const).map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => setStatusFilter(s)}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black capitalize transition-all border ${
                                    statusFilter === s
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-card text-muted-foreground border-border hover:text-foreground"
                                }`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex h-60 items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading live credit book...
                </div>
            ) : tab === "banksuite" ? (
                <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-black">Borrower &amp; Purpose</th>
                                    <th className="px-5 py-3.5 font-black">Copteller Trust</th>
                                    <th className="px-5 py-3.5 font-black text-right">Principal</th>
                                    <th className="px-5 py-3.5 font-black text-right">Outstanding</th>
                                    <th className="px-5 py-3.5 font-black">Terms</th>
                                    <th className="px-5 py-3.5 font-black">Status</th>
                                    <th className="px-5 py-3.5 font-black text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                                {filteredBankLoans.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">
                                            No loans match this filter. Click <strong>Originate Loan Facility</strong> to book a new facility.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBankLoans.map((l) => (
                                        <tr
                                            key={l.id}
                                            onClick={() => {
                                                setSelectedLoan(l)
                                                setRepayAmountNaira(String(Math.round((l.monthly_installment_kobo || 0) / 100) || ""))
                                            }}
                                            className="hover:bg-muted/25 cursor-pointer transition-colors"
                                        >
                                            <td className="px-5 py-3.5">
                                                <p className="font-black text-foreground">{l.borrower_name}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    #{l.id} · {l.purpose || l.product_name || "Credit Facility"} · {l.linked_account_number || "OTC"}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {l.copteller_telemetry?.linked ? (
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 font-mono text-[10px] font-black">
                                                        <ShieldCheck className="h-3 w-3" /> {l.copteller_telemetry.trustScore850}/850
                                                    </span>
                                                ) : (
                                                    <span className="text-[11px] text-muted-foreground">Direct Retail</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-bold">{fmtNaira(l.principal_kobo)}</td>
                                            <td className="px-5 py-3.5 text-right font-mono font-black text-foreground">{fmtNaira(l.outstanding_kobo)}</td>
                                            <td className="px-5 py-3.5 font-semibold text-muted-foreground">
                                                {l.duration_months}m @ {l.interest_rate}%
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <LoanStatusPill status={l.status} />
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Button size="sm" variant="outline" className="h-8 rounded-xl text-[11px] font-bold">
                                                    Inspect &amp; Manage
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-3">
                    {coptellerLoans.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-10 text-center">No cooperative loan requests currently queued from Copteller.</p>
                    ) : (
                        coptellerLoans.map((cl) => (
                            <div key={cl.id} className="rounded-2xl border border-border/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-black text-sm">{cl.borrower_name}</span>
                                        <LoanStatusPill status={cl.status} />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Principal {fmtNaira(cl.principal_kobo)} · {cl.duration_months}m @ {cl.interest_rate}% · {cl.purpose || "Cooperative Facility"}
                                    </p>
                                </div>
                                {cl.status === "pending" && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            disabled={busy !== null}
                                            onClick={() => handleLoanDecision(cl.id, "disburse", "copteller")}
                                            className="h-8 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
                                        >
                                            Approve &amp; Disburse (GL 1300)
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busy !== null}
                                            onClick={() => handleLoanDecision(cl.id, "reject", "copteller")}
                                            className="h-8 rounded-xl text-xs font-bold text-rose-600"
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* SLIDE-OVER CREDIT DOSSIER & AMORTIZATION DRAWER */}
            <BankSideDrawer
                open={Boolean(selectedLoan)}
                onClose={() => setSelectedLoan(null)}
                title={selectedLoan ? `Loan #${selectedLoan.id} · ${selectedLoan.borrower_name}` : "Loan Dossier"}
                subtitle={selectedLoan ? `${selectedLoan.purpose || "Credit Facility"} · Account ${selectedLoan.linked_account_number || "OTC"}` : ""}
                badge={selectedLoan ? <LoanStatusPill status={selectedLoan.status} /> : null}
            >
                {selectedLoan && (
                    <div className="space-y-5">
                        <div className="grid grid-cols-3 gap-2.5">
                            <div className="p-3 rounded-2xl bg-muted/30 border">
                                <p className="text-[9px] font-black uppercase text-muted-foreground">Principal</p>
                                <p className="text-sm font-mono font-black mt-0.5">{fmtNaira(selectedLoan.principal_kobo)}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                                <p className="text-[9px] font-black uppercase text-amber-700">Outstanding</p>
                                <p className="text-sm font-mono font-black text-amber-700 mt-0.5">{fmtNaira(selectedLoan.outstanding_kobo)}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-[9px] font-black uppercase text-emerald-700">Monthly Due</p>
                                <p className="text-sm font-mono font-black text-emerald-700 mt-0.5">{fmtNaira(selectedLoan.monthly_installment_kobo)}</p>
                            </div>
                        </div>

                        {selectedLoan.copteller_telemetry?.linked && (
                            <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Copteller Behavioral Telemetry Verified
                                    </span>
                                    <span className="font-mono font-black text-sm text-emerald-700">
                                        {selectedLoan.copteller_telemetry.trustScore850} / 850
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Standing: <strong className="text-foreground">{selectedLoan.copteller_telemetry.creditTier}</strong> · Copteller Wallet Balance:{" "}
                                    <strong className="font-mono text-foreground">{fmtNaira(selectedLoan.copteller_telemetry.walletBalanceKobo)}</strong>
                                </p>
                            </div>
                        )}

                        {/* Pending Approval Controls */}
                        {selectedLoan.status === "pending" && (
                            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] flex items-center justify-between gap-3">
                                <div className="text-xs">
                                    <p className="font-black text-foreground">Awaiting Credit Committee Disbursement</p>
                                    <p className="text-muted-foreground">Credits borrower NUBAN and posts GL 1200/2000 atomically.</p>
                                </div>
                                <Button
                                    size="sm"
                                    disabled={busy !== null}
                                    onClick={() => handleLoanDecision(selectedLoan.id, "disburse")}
                                    className="rounded-xl font-black bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                >
                                    Approve &amp; Disburse
                                </Button>
                            </div>
                        )}

                        {/* Record Repayment Form */}
                        {(selectedLoan.status === "active" || selectedLoan.status === "defaulted") && (
                            <form onSubmit={handleRepay} className="p-4 rounded-2xl border border-border/80 bg-muted/15 space-y-3">
                                <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Post Atomic Loan Repayment (GL 1200 / GL 4000)
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setRepayMode("debit_account")}
                                        className={`py-2 px-3 rounded-xl text-[11px] font-black border transition-all ${
                                            repayMode === "debit_account" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                                        }`}
                                    >
                                        Debit Linked Account
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRepayMode("cash_otc")}
                                        className={`py-2 px-3 rounded-xl text-[11px] font-black border transition-all ${
                                            repayMode === "cash_otc" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"
                                        }`}
                                    >
                                        Cash / OTC Teller
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        min="100"
                                        placeholder="Repayment amount (₦)"
                                        value={repayAmountNaira}
                                        onChange={(e) => setRepayAmountNaira(e.target.value)}
                                        className="h-10 rounded-xl font-bold"
                                        required
                                    />
                                    <Button type="submit" disabled={busy === "repay"} className="h-10 rounded-xl font-black px-4 shrink-0">
                                        {busy === "repay" ? "Posting..." : "Post Repayment"}
                                    </Button>
                                </div>
                            </form>
                        )}

                        {/* Amortization Schedule */}
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5 text-primary" /> Amortization Schedule ({selectedLoan.schedule?.length || 0} Installments)
                            </h3>
                            <div className="rounded-2xl border border-border/80 overflow-hidden">
                                <table className="w-full text-left text-[11px]">
                                    <thead className="bg-muted/40 border-b text-[9px] uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2 font-black">#</th>
                                            <th className="px-3 py-2 font-black">Due Date</th>
                                            <th className="px-3 py-2 font-black text-right">Principal</th>
                                            <th className="px-3 py-2 font-black text-right">Interest</th>
                                            <th className="px-3 py-2 font-black text-right">Total</th>
                                            <th className="px-3 py-2 font-black text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/70">
                                        {(selectedLoan.schedule || []).map((inst: any) => (
                                            <tr key={inst.installmentNo}>
                                                <td className="px-3 py-2 font-mono font-bold">{inst.installmentNo}</td>
                                                <td className="px-3 py-2">{new Date(inst.dueDate).toLocaleDateString()}</td>
                                                <td className="px-3 py-2 text-right font-mono">{fmtNaira(inst.principalKobo)}</td>
                                                <td className="px-3 py-2 text-right font-mono text-muted-foreground">{fmtNaira(inst.interestKobo)}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold">{fmtNaira(inst.totalKobo)}</td>
                                                <td className="px-3 py-2 text-right">
                                                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                        inst.status === "paid" ? "bg-emerald-500/10 text-emerald-700" : inst.status === "due" ? "bg-amber-500/10 text-amber-700" : "bg-muted text-muted-foreground"
                                                    }`}>
                                                        {inst.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Risk Status Actions */}
                        {selectedLoan.status === "active" && (
                            <div className="pt-2 border-t border-border/70 flex justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy !== null}
                                    onClick={() => handleLoanDecision(selectedLoan.id, "defaulted")}
                                    className="h-8 rounded-xl text-xs font-bold text-rose-600 border-rose-200"
                                >
                                    Flag as PAR / Defaulted
                                </Button>
                            </div>
                        )}
                        {selectedLoan.status === "defaulted" && (
                            <div className="pt-2 border-t border-border/70 flex justify-end">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={busy !== null}
                                    onClick={() => handleLoanDecision(selectedLoan.id, "active")}
                                    className="h-8 rounded-xl text-xs font-bold text-emerald-600 border-emerald-200"
                                >
                                    Restructure to Active Performing
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </BankSideDrawer>

            {/* ORIGINATE LOAN MODAL */}
            {showOriginate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm">
                    <form onSubmit={handleOriginate} className="bg-card border border-border rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-lg font-black text-foreground">Originate Credit Facility</h3>
                                <p className="text-xs text-muted-foreground">Auto-generates amortization schedule &amp; posts GL 1200 receivable.</p>
                            </div>
                            <button type="button" onClick={() => setShowOriginate(false)} className="p-1.5 rounded-xl hover:bg-muted">
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Borrower Customer</label>
                            <select
                                value={origCustomerId}
                                onChange={(e) => setOrigCustomerId(e.target.value)}
                                className="w-full h-10 rounded-xl border border-border bg-background px-3 text-xs font-bold"
                                required
                            >
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.first_name} {c.last_name} ({c.email}) {c.primary_account_number ? `· Acc ${c.primary_account_number}` : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Principal (₦)</label>
                                <Input type="number" min="5000" step="5000" value={origPrincipal} onChange={(e) => setOrigPrincipal(e.target.value)} className="h-10 rounded-xl font-black" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Rate (% p.a.)</label>
                                <Input type="number" min="0" max="60" step="0.5" value={origRate} onChange={(e) => setOrigRate(e.target.value)} className="h-10 rounded-xl font-bold" required />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-muted-foreground">Tenure (Mo)</label>
                                <Input type="number" min="1" max="48" value={origMonths} onChange={(e) => setOrigMonths(e.target.value)} className="h-10 rounded-xl font-bold" required />
                            </div>
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">Estimated Monthly Installment</span>
                            <span className="font-mono font-black text-emerald-700 dark:text-emerald-400">₦{previewMonthly.toLocaleString()} / mo</span>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Facility Purpose</label>
                            <Input value={origPurpose} onChange={(e) => setOrigPurpose(e.target.value)} className="h-10 rounded-xl text-xs font-semibold" required />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-muted-foreground">Collateral / Guarantee</label>
                            <Input value={origCollateral} onChange={(e) => setOrigCollateral(e.target.value)} className="h-10 rounded-xl text-xs font-semibold" />
                        </div>

                        <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                            <input type="checkbox" checked={origDisburseNow} onChange={(e) => setOrigDisburseNow(e.target.checked)} />
                            Disburse immediately into borrower&apos;s primary NUBAN &amp; post GL 1200/2000
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowOriginate(false)} className="rounded-xl text-xs font-bold">
                                Cancel
                            </Button>
                            <Button type="submit" disabled={busy === "originate"} className="rounded-xl text-xs font-black">
                                {busy === "originate" ? "Booking Loan..." : origDisburseNow ? "Book & Disburse Now" : "Queue for Approval"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
