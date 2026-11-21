"use client"

import * as React from "react"
import Link from "next/link"
import {
    CreditCard,
    Plus,
    ArrowRight,
    Loader2,
    TrendingUp,
    Calendar,
    CheckCircle2,
    RefreshCw,
    Wallet,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Account, Loan, ProductApplication, ProductType } from "@/lib/api/types"
import { createClient } from "@/lib/supabase/client"
import { useScope } from "@/context/scope-context"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

const fmtFull = (n: number) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function MyLoansPage() {
    const { activeScope } = useScope()
    const [applications, setApplications] = React.useState<(ProductApplication & { product?: ProductType })[]>([])
    const [loans, setLoans] = React.useState<Loan[]>([])
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(true)

    // Self-Service Loan Repayment Drawer
    const [repayLoan, setRepayLoan] = React.useState<Loan | null>(null)
    const [sourceAccId, setSourceAccId] = React.useState("")
    const [repayAmount, setRepayAmount] = React.useState("")
    const [repaying, setRepaying] = React.useState(false)
    const [lastReceipt, setLastReceipt] = React.useState<any>(null)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user: supaUser } } = await supabase.auth.getUser()
            if (!supaUser) return

            const [apps, types, allLoans, allAccs] = await Promise.all([
                api.getUserApplications(supaUser.id).catch(() => []),
                api.getAllProductTypes().catch(() => []),
                api.getUserLoans(supaUser.id).catch(() => []),
                api.getUserAccounts(supaUser.id).catch(() => []),
            ])

            const enrichedApps = apps
                .map((app) => ({ ...app, product: types.find((t) => t.id === app.product_type_id) }))
                .filter((app) => {
                    const blockType = (app.product?.financial_terms?.[0] as any)?.blockType
                    return blockType === "loan-terms" || String(app.product?.name || "").toLowerCase().includes("loan")
                })

            // Never drop legitimate loans with hardcoded amount heuristics
            setLoans(allLoans)
            setApplications(enrichedApps)
            const activeAccs = allAccs.filter((a) => a.status === "active" && !a.is_frozen)
            setAccounts(activeAccs)
            if (!sourceAccId && activeAccs[0]?.id) {
                setSourceAccId(String(activeAccs[0].id))
            }
        } finally {
            setLoading(false)
        }
    }, [sourceAccId])

    React.useEffect(() => {
        loadData()
    }, [])

    const handleRepaySubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!repayLoan || !sourceAccId || !repayAmount || Number(repayAmount) <= 0) {
            toast.error("Select a funding account and enter a positive repayment amount.")
            return
        }
        setRepaying(true)
        try {
            const res = await fetch("/api/client/loans/repay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    loan_id: Number(repayLoan.id),
                    source_account_id: Number(sourceAccId),
                    amount_naira: Number(repayAmount),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Repayment failed")
                return
            }
            toast.success(data.message || "Loan repayment settled!")
            setLastReceipt(data)
            setRepayAmount("")
            await loadData()
        } finally {
            setRepaying(false)
        }
    }

    const activeLoans = loans.filter((l) => l.status === "active" || l.status === "defaulted")
    const totalOutstanding = activeLoans.reduce((s, l) => s + Number(l.outstanding_balance ?? l.amount ?? 0), 0)
    const nextDue = activeLoans
        .filter((l) => l.next_payment_date)
        .sort((a, b) => new Date(a.next_payment_date!).getTime() - new Date(b.next_payment_date!).getTime())[0]
    const pendingApps = applications.filter((a) => a.status !== "approved")

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Credit Facilities`}
                livePill={`${activeLoans.length} Active Facilit${activeLoans.length === 1 ? "y" : "ies"}`}
                liveTone={activeLoans.length > 0 ? "amber" : "emerald"}
                title="My Loans & Credit Portfolio"
                subtitle="Track active credit balances, repayment schedules, and make instant self-service repayments directly from your linked NUBAN account."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <Link href="/explore/loans">
                                <Plus className="h-3.5 w-3.5" /> Apply for Loan
                            </Link>
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Outstanding Exposure</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><CreditCard className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums-fintech">{fmtFull(totalOutstanding)}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Across {activeLoans.length} active credit line(s)</p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Next Installment Due</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><Calendar className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums-fintech">
                        {nextDue?.next_payment_date ? new Date(nextDue.next_payment_date).toLocaleDateString() : "None Due"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">
                        {nextDue ? `Loan #${nextDue.id} · ${nextDue.interest_rate}% p.a.` : "All repayments current"}
                    </p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Completed / Repaid</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><CheckCircle2 className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums-fintech">
                        {loans.filter((l) => l.status === "repaid").length}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-medium">Boosts your MFB credit score</p>
                </div>
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your credit facilities...
                </div>
            ) : (
                <div className="space-y-8">
                    {loans.length === 0 ? (
                        <div className="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-4">
                            <TrendingUp className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                            <div>
                                <p className="font-black text-base">No Active Loans</p>
                                <p className="text-xs text-muted-foreground mt-1">Explore salary advances, SME working capital, or cooperative-backed facilities.</p>
                            </div>
                            <Button asChild className="rounded-xl font-black text-xs">
                                <Link href="/explore/loans">Explore Loan Options</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {loans.map((loan) => {
                                const principal = Math.max(1, Number(loan.amount || 0))
                                const outstanding = Number(loan.outstanding_balance ?? loan.amount ?? 0)
                                const paidPct = Math.min(100, Math.max(0, Math.round(((principal - Math.min(principal, outstanding)) / principal) * 100)))
                                const canRepay = (loan.status === "active" || loan.status === "defaulted") && outstanding > 0
                                return (
                                    <div key={loan.id} className="bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between gap-5">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between gap-2">
                                                <Badge variant="outline" className="text-[10px] font-black uppercase text-primary border-primary/25 bg-primary/5">
                                                    Loan #{loan.id}
                                                </Badge>
                                                <Badge
                                                    variant={loan.status === "repaid" ? "default" : loan.status === "defaulted" ? "destructive" : "secondary"}
                                                    className="text-[9px] uppercase font-black"
                                                >
                                                    {loan.status}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Outstanding Balance</p>
                                                <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums-fintech mt-0.5">
                                                    {fmtFull(outstanding)}
                                                </p>
                                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                                    Principal: {fmtFull(principal)} · {loan.interest_rate}% p.a. · {loan.duration_months || "—"}m
                                                </p>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] font-bold text-muted-foreground mb-1">
                                                    <span>Repayment Progress</span>
                                                    <span>{loan.status === "repaid" ? "100%" : `${paidPct}%`}</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${loan.status === "repaid" ? 100 : paidPct}%` }} />
                                                </div>
                                            </div>
                                            {loan.next_payment_date && loan.status !== "repaid" && (
                                                <p className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between pt-1">
                                                    <span>Next Due Date</span>
                                                    <span className="font-bold text-foreground">{new Date(loan.next_payment_date).toLocaleDateString()}</span>
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2 pt-3 border-t border-border/60">
                                            {canRepay && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setRepayLoan(loan)
                                                        setLastReceipt(null)
                                                        const suggested = loan.monthly_installment && loan.monthly_installment > 0
                                                            ? Math.min(outstanding, loan.monthly_installment)
                                                            : outstanding
                                                        setRepayAmount(String(Math.round(suggested)))
                                                    }}
                                                    className="w-full h-9 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                                >
                                                    <Wallet className="h-3.5 w-3.5" /> Repay Installment Now
                                                </Button>
                                            )}
                                            <Button asChild size="sm" variant="outline" className="w-full h-9 rounded-xl font-bold text-xs justify-between">
                                                <Link href={`/my-loans/${loan.id}`}>
                                                    Schedule &amp; Details <ArrowRight className="h-3.5 w-3.5" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {pendingApps.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black">Pending Loan Applications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingApps.map((app) => (
                                    <div key={app.id} className="bg-card border border-dashed rounded-3xl p-5 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black uppercase text-muted-foreground">{app.product?.name || "Loan Application"}</span>
                                            <Badge variant="outline" className="text-[9px] uppercase border-amber-500/40 text-amber-600 bg-amber-500/10">
                                                {app.workflow_stage || app.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xl font-mono font-black">
                                            {app.requested_amount ? `₦${Number(app.requested_amount).toLocaleString()}` : "Under Review"}
                                        </p>
                                        <Button asChild size="sm" variant="outline" className="w-full h-9 rounded-xl text-xs font-bold justify-between">
                                            <Link href={`/applications/${app.id}`}>
                                                Track Application <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Self-Service Repayment Drawer */}
            <BankSideDrawer
                open={Boolean(repayLoan)}
                onClose={() => setRepayLoan(null)}
                title={repayLoan ? `Repay Loan #${repayLoan.id}` : "Loan Repayment"}
                subtitle="Instant atomic settlement from your BankSuite NUBAN into GL 1200 / GL 4000."
            >
                {repayLoan && (
                    <div className="space-y-5">
                        {lastReceipt ? (
                            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 space-y-3 text-xs">
                                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm">
                                    <CheckCircle2 className="h-5 w-5" /> Repayment Confirmed
                                </div>
                                <div className="space-y-1.5 font-mono">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-bold">{lastReceipt.reference}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">GL Journal</span><span className="font-bold">{lastReceipt.glJournalRef}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Amount Paid</span><span className="font-bold">₦{Number(lastReceipt.paidNaira).toLocaleString()}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Remaining Balance</span><span className="font-bold">₦{Number(lastReceipt.remainingBalanceNaira).toLocaleString()}</span></div>
                                </div>
                                <Button onClick={() => setRepayLoan(null)} className="w-full h-10 rounded-xl font-black text-xs mt-2">Done</Button>
                            </div>
                        ) : (
                            <form onSubmit={handleRepaySubmit} className="space-y-4">
                                <div className="p-4 rounded-2xl bg-muted/40 border text-xs space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Outstanding Loan Balance</p>
                                    <p className="text-2xl font-black font-mono">{fmtFull(repayLoan.outstanding_balance ?? repayLoan.amount)}</p>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Debit Source NUBAN</label>
                                    <select
                                        value={sourceAccId}
                                        onChange={(e) => setSourceAccId(e.target.value)}
                                        className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                                        required
                                    >
                                        {accounts.map((a) => (
                                            <option key={a.id} value={a.id}>
                                                {a.account_number} ({a.account_type}) — {fmtFull(a.balance)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Repayment Amount (₦)</label>
                                    <Input
                                        type="number"
                                        min="100"
                                        step="any"
                                        value={repayAmount}
                                        onChange={(e) => setRepayAmount(e.target.value)}
                                        className="h-11 rounded-xl font-mono font-bold text-base"
                                        required
                                    />
                                    <div className="flex gap-2 pt-1">
                                        {repayLoan.monthly_installment && repayLoan.monthly_installment > 0 ? (
                                            <button
                                                type="button"
                                                onClick={() => setRepayAmount(String(Math.round(repayLoan.monthly_installment!)))}
                                                className="px-2.5 py-1 rounded-lg border bg-muted/40 text-[11px] font-bold"
                                            >
                                                1 Installment (₦{Math.round(repayLoan.monthly_installment).toLocaleString()})
                                            </button>
                                        ) : null}
                                        <button
                                            type="button"
                                            onClick={() => setRepayAmount(String(Math.round(repayLoan.outstanding_balance ?? repayLoan.amount)))}
                                            className="px-2.5 py-1 rounded-lg border bg-emerald-500/10 text-emerald-700 text-[11px] font-bold"
                                        >
                                            Full Payoff
                                        </button>
                                    </div>
                                </div>

                                <Button type="submit" disabled={repaying || accounts.length === 0} className="w-full h-11 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                                    {repaying ? "Processing Atomic Repayment..." : "Authorize Loan Repayment"}
                                </Button>
                            </form>
                        )}
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
