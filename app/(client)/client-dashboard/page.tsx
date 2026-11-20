"use client"

import * as React from "react"
import Link from "next/link"
import {
    Eye,
    EyeOff,
    CreditCard,
    Send,
    Receipt,
    PiggyBank,
    ArrowDownLeft,
    ArrowUpRight,
    FileText,
    RefreshCw,
    Lock,
    Wallet,
    Building2,
    Plus,
    Activity,
    ArrowRight,
    Copy,
    Check,
    Globe,
    ExternalLink,
    ShieldCheck,
    Printer,
    Store,
    Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { api, Account, Loan, Transaction, User, ProductApplication, ServiceCategory, Customer } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"
import { TreasuryCashflowChart } from "@/components/banking/charts/bank-charts"

const fmtFull = (n: number) => `₦${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fmtCompact = (n: number) => `₦${Number(n || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`

export default function ClientDashboard() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()

    const [user, setUser] = React.useState<User | null>(null)
    const [categories, setCategories] = React.useState<ServiceCategory[]>([])
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loans, setLoans] = React.useState<Loan[]>([])
    const [applications, setApplications] = React.useState<ProductApplication[]>([])
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [customer, setCustomer] = React.useState<Customer | null>(null)
    const [overview, setOverview] = React.useState<any>(null)
    const [savingsPlans, setSavingsPlans] = React.useState<any[]>([])
    const [coptellerLink, setCoptellerLink] = React.useState<any>(null)

    const [loading, setLoading] = React.useState(true)
    const [showBalance, setShowBalance] = React.useState(true)
    const [copiedAcc, setCopiedAcc] = React.useState<string | null>(null)
    const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

    const copyAccountNumber = (accNum: string) => {
        navigator.clipboard.writeText(accNum)
        setCopiedAcc(accNum)
        toast.success(`Copied NUBAN ${accNum}`)
        setTimeout(() => setCopiedAcc(null), 1800)
    }

    const loadAll = React.useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user: supaUser } } = await supabase.auth.getUser()
            if (!supaUser) return

            const currentUser: User = {
                id: supaUser.id,
                email: supaUser.email || "",
                full_name:
                    supaUser.user_metadata?.full_name ||
                    supaUser.user_metadata?.name ||
                    supaUser.email?.split("@")[0] ||
                    "Customer",
                role: supaUser.user_metadata?.role || "user",
                created_at: supaUser.created_at || new Date().toISOString(),
            }
            setUser(currentUser)

            const [accountsData, loansData, txsData, appsData, catsData, customerProfile, overviewRes, savingsRes, copRes] =
                await Promise.all([
                    api.getUserAccounts(currentUser.id).catch(() => []),
                    api.getUserLoans(currentUser.id).catch(() => []),
                    api.getUserTransactions(currentUser.id).catch(() => []),
                    api.getUserApplications(currentUser.id).catch(() => []),
                    api.getServiceCategories().catch(() => []),
                    api.getCustomerBySupabaseId(currentUser.id).catch(() => null),
                    fetch("/api/client/overview", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
                    fetch("/api/client/savings-plans", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
                    fetch("/api/client/copteller-link", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
                ])

            setCustomer(customerProfile)
            setCategories(catsData)
            setAccounts(accountsData)
            setLoans(loansData)
            setApplications(appsData)
            setTransactions(txsData)
            if (overviewRes?.success) setOverview(overviewRes)
            if (savingsRes?.success) setSavingsPlans(savingsRes.plans || [])
            if (copRes?.success) setCoptellerLink(copRes)
        } catch (err) {
            console.error("Dashboard load error:", err)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadAll()
    }, [loadAll])

    const greeting = React.useMemo(() => {
        const h = new Date().getHours()
        if (h < 12) return "Good morning"
        if (h < 17) return "Good afternoon"
        return "Good evening"
    }, [])

    // Build real daily cashflow series from customer transactions for TreasuryCashflowChart
    const dailySeries = React.useMemo(() => {
        const map = new Map<string, { date: string; inflowNaira: number; outflowNaira: number }>()
        for (const tx of transactions) {
            const dt = new Date(tx.created_at)
            const key = dt.toLocaleDateString("en-US", { month: "short", day: "2-digit" })
            const cur = map.get(key) || { date: key, inflowNaira: 0, outflowNaira: 0 }
            const amt = Number(tx.amount || 0)
            if (tx.type === "credit") cur.inflowNaira += amt
            else cur.outflowNaira += amt
            map.set(key, cur)
        }
        return Array.from(map.values())
    }, [transactions])

    const totalLiquidity = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)
    const totalVaultsNaira = savingsPlans.reduce((s, p) => s + Number(p.saved_amount_kobo || 0), 0) / 100
    const totalCreditLine = loans.reduce((s, l) => s + Number(l.amount || 0), 0)
    const transferSlug =
        categories.find((c) => c.slug.toLowerCase().includes("transfer") || c.name.toLowerCase().includes("transfer"))?.slug || "transfers"
    const billsSlug =
        categories.find((c) => c.slug.toLowerCase().includes("bill") || c.slug.toLowerCase().includes("utilit"))?.slug || "utilities"

    if (loading) {
        return (
            <div className="space-y-6 py-4 animate-pulse">
                <div className="h-20 rounded-3xl bg-muted/60" />
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="h-32 rounded-3xl bg-muted/50" />
                    ))}
                </div>
                <div className="h-72 rounded-3xl bg-muted/40" />
            </div>
        )
    }

    // ─── BUSINESS / MERCHANT SCOPE ──────────────────────────────────────────────
    if (activeScope.type === "business") {
        const biz = overview?.business || {}
        const bizInvoices: any[] = biz.invoices || []
        const bizTerminals: any[] = biz.terminals || []
        const totalRevenueNaira = Number(biz.settledRevenueKobo || 0) / 100
        const unpaidInvoices = bizInvoices.filter((i: any) => i.status === "unpaid" || i.status === "overdue")
        const unpaidSumNaira = unpaidInvoices.reduce((s: number, i: any) => s + Number(i.amount_kobo || 0), 0) / 100
        const payrollDisbursedNaira = Number(biz.payrollTotalDisbursedKobo || 0) / 100

        return (
            <div className="space-y-6 pb-10">
                <BankPageHeader
                    badge="Corporate & SME Merchant Hub"
                    livePill={`${bizTerminals.filter((t: any) => t.status === "active").length} POS Terminals Online`}
                    liveTone="emerald"
                    title={`${greeting}, ${biz.merchant?.business_name || activeScope.name}`}
                    subtitle="Live merchant checkout settlement revenue, accounts receivable invoicing, POS agency fleet, and bulk HR payroll."
                    actions={
                        <>
                            <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                                <Link href="/client-dashboard/invoices">
                                    <Receipt className="h-3.5 w-3.5" /> Invoices
                                </Link>
                            </Button>
                            <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                                <Link href="/agent/dashboard">
                                    <Store className="h-3.5 w-3.5" /> POS Agent Desk
                                </Link>
                            </Button>
                            <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                                <Link href="/merchant/payroll">
                                    <Users className="h-3.5 w-3.5" /> Run Payroll
                                </Link>
                            </Button>
                        </>
                    }
                />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Settled Revenue", val: fmtCompact(totalRevenueNaira), sub: `${biz.checkoutCount || 0} settled checkouts`, icon: Wallet, tone: "bg-emerald-500/10 text-emerald-600" },
                        { label: "Unpaid Invoices", val: fmtCompact(unpaidSumNaira), sub: `${unpaidInvoices.length} awaiting payment`, icon: Receipt, tone: "bg-rose-500/10 text-rose-600" },
                        { label: "Active POS Fleet", val: `${bizTerminals.filter((t: any) => t.status === "active").length} Online`, sub: `${bizTerminals.length} assigned terminals`, icon: Activity, tone: "bg-blue-500/10 text-blue-600" },
                        { label: "Payroll Disbursed", val: fmtCompact(payrollDisbursedNaira), sub: `${biz.payrollBatchCount || 0} completed batches`, icon: Building2, tone: "bg-violet-500/10 text-violet-600" },
                    ].map((k, idx) => (
                        <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                                <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                            </div>
                            <p className="text-2xl font-black tabular-nums-fintech">{k.val}</p>
                            <p className="text-[11px] text-muted-foreground font-medium">{k.sub}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black">Recent SME Invoices</h3>
                            <p className="text-xs text-muted-foreground">Persisted corporate billing ledger</p>
                        </div>
                        <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold">
                            <Link href="/client-dashboard/invoices">Manage All <ArrowRight className="h-3 w-3 ml-1" /></Link>
                        </Button>
                    </div>
                    {bizInvoices.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">No invoices created yet.</p>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {bizInvoices.slice(0, 6).map((inv: any) => (
                                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-black text-foreground">{inv.client_name}</p>
                                        <p className="text-[11px] text-muted-foreground font-mono">{inv.invoice_number}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-mono font-black">₦{(Number(inv.amount_kobo || 0) / 100).toLocaleString()}</p>
                                        <Badge variant="outline" className="text-[9px] uppercase">{inv.status}</Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // ─── PERSONAL & DEFAULT DIGITAL BANKING HUB ─────────────────────────────────
    return (
        <div className="space-y-6 pb-10">
            <BankPageHeader
                badge={`${activeProfile.shortName} Digital Banking`}
                livePill={customer?.kyc_status === "active" ? "KYC Verified · NDIC Insured" : "KYC Pending"}
                liveTone={customer?.kyc_status === "active" ? "emerald" : "amber"}
                title={`${greeting}, ${user?.full_name || "Valued Customer"}`}
                subtitle="Manage your regulated NUBAN accounts, automated target vaults, instant transfers, smart cards, and linked Copteller cooperative standing."
                actions={
                    <>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setShowBalance((v) => !v)}
                            className="h-9 rounded-xl font-bold text-xs gap-1.5"
                        >
                            {showBalance ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            {showBalance ? "Hide Balances" : "Show Balances"}
                        </Button>
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Link href="/client-dashboard/transfers">
                                <Send className="h-3.5 w-3.5" /> Transfer
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5 shadow-sm">
                            <Link href="/pay/fund">
                                <Plus className="h-3.5 w-3.5" /> Fund Account
                            </Link>
                        </Button>
                    </>
                }
            />

            {/* 4 Clean Clickable KPI Tiles (No Duplication!) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Link href="/my-products" className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Liquidity</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><Wallet className="h-4 w-4" /></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black tabular-nums-fintech text-foreground">
                        {showBalance ? fmtCompact(totalLiquidity) : "••••••"}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-bold">{accounts.length} active NUBAN account(s)</p>
                </Link>

                <Link href="/esusu" className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Target Vaults</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><PiggyBank className="h-4 w-4" /></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black tabular-nums-fintech text-foreground">
                        {showBalance ? fmtCompact(totalVaultsNaira) : "••••••"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-semibold">{savingsPlans.length} vault(s) · 6.5% p.a.</p>
                </Link>

                <Link href="/my-loans" className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Credit Facilities</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><CreditCard className="h-4 w-4" /></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black tabular-nums-fintech text-foreground">
                        {showBalance ? fmtCompact(totalCreditLine) : "••••••"}
                    </p>
                    <p className="text-[11px] text-muted-foreground font-semibold">{loans.length} active · {applications.length} applications</p>
                </Link>

                <Link href="/client-dashboard/transactions" className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Ledger Activity</span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600"><Activity className="h-4 w-4" /></div>
                    </div>
                    <p className="text-xl sm:text-2xl font-black tabular-nums-fintech text-foreground">{transactions.length}</p>
                    <p className="text-[11px] text-muted-foreground font-semibold">Posted bank transactions</p>
                </Link>
            </div>

            {/* Accounts Rail + Linked Copteller Cooperative Custody Card */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-8 bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-black text-foreground">My Regulated Accounts</h3>
                            <p className="text-xs text-muted-foreground">Tap any NUBAN to copy for instant NIP inflows</p>
                        </div>
                        <Button asChild variant="outline" size="sm" className="h-8 rounded-xl text-xs font-bold">
                            <Link href="/explore/accounts">+ Open Account</Link>
                        </Button>
                    </div>

                    {accounts.length === 0 ? (
                        <div className="py-10 text-center space-y-2 border border-dashed rounded-2xl">
                            <p className="text-sm font-bold text-muted-foreground">No active bank accounts yet.</p>
                            <Button asChild size="sm" className="rounded-xl text-xs font-black">
                                <Link href="/explore/accounts">Open Your First NUBAN</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {accounts.map((acc) => (
                                <div
                                    key={acc.id}
                                    className="p-4 rounded-2xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-all flex flex-col justify-between space-y-4"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                            {acc.account_type} Account
                                        </span>
                                        {acc.is_frozen || acc.pnd_enabled ? (
                                            <Badge variant="destructive" className="text-[9px] uppercase">Restricted</Badge>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 text-[9px] font-black uppercase border border-emerald-500/20">
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-2xl font-black tabular-nums-fintech text-foreground">
                                        {showBalance ? fmtFull(acc.balance) : "••••••••"}
                                    </p>
                                    <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
                                        <button
                                            type="button"
                                            onClick={() => copyAccountNumber(acc.account_number)}
                                            className="inline-flex items-center gap-1.5 font-mono font-bold text-foreground hover:text-primary transition-colors"
                                        >
                                            <span>{acc.account_number}</span>
                                            {copiedAcc === acc.account_number ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                        </button>
                                        <Link href="/client-dashboard/transfers" className="text-[11px] font-black text-primary hover:underline">
                                            Send →
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Live Copteller Cooperative Cross-Link Card */}
                <div className="lg:col-span-4 bg-card border border-emerald-500/25 rounded-3xl p-5 shadow-sm flex flex-col justify-between space-y-4 bg-gradient-to-b from-emerald-500/[0.04] to-transparent">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase">
                                <Globe className="h-3 w-3" /> Copteller Cooperative OS
                            </span>
                            {coptellerLink?.linked && (
                                <span className="font-mono font-black text-xs text-emerald-700">
                                    {coptellerLink.profile?.trustScore850}/850
                                </span>
                            )}
                        </div>
                        {coptellerLink?.linked && coptellerLink.profile ? (
                            <>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-muted-foreground">Copteller Escrow Balance</p>
                                    <p className="text-2xl font-black font-mono text-foreground mt-0.5">
                                        {showBalance ? `₦${(Number(coptellerLink.profile.walletBalanceKobo || 0) / 100).toLocaleString()}` : "••••••"}
                                    </p>
                                </div>
                                <div className="p-3 rounded-2xl bg-card border border-border/80 space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Trust Standing</span>
                                        <span className="font-black text-emerald-700">{coptellerLink.profile.creditTier}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Active Contracts</span>
                                        <span className="font-bold">{coptellerLink.profile.contracts?.length || 0} Ajo / HP</span>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5">
                                <h3 className="text-sm font-black text-foreground">Cooperative Thrift &amp; Fleet Credit</h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Join a registered union (Keke Owners, Market Traders, Agro) on Copteller to build a verified Trust Score and unlock low-rate MFB asset financing backed by {activeProfile.shortName}.
                                </p>
                            </div>
                        )}
                    </div>

                    <Button asChild size="sm" className="w-full h-10 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5">
                        <a href={`${coptellerLink?.appUrl || "http://localhost:3001"}/copteller/dashboard`} target="_blank" rel="noopener noreferrer">
                            {coptellerLink?.linked ? "Open My Cooperative Portal" : "Explore Copteller Cooperatives"}
                            <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                    </Button>
                </div>
            </div>

            {/* Interactive Cashflow Telemetry Chart (Replaces raw hand-coded SVG!) */}
            <TreasuryCashflowChart
                title="Personal Cashflow & Balance Velocity"
                subtitle="Your live posted inflows vs transfers & bill payments across your NUBAN accounts"
                data={dailySeries}
                badgeLabel="Account Telemetry"
            />

            {/* Quick Actions & Recent Transactions with Receipt Drawer */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 space-y-3">
                    <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Quick Banking Actions</h3>
                    <div className="space-y-2.5">
                        {[
                            { title: "Transfer Funds", desc: "Instant NIP & intra-bank transfers", href: `/pay/${transferSlug}`, icon: Send, tone: "bg-primary/10 text-primary" },
                            { title: "Pay Utilities & Bills", desc: "Power, airtime, cable & levies", href: `/pay/${billsSlug}`, icon: Receipt, tone: "bg-blue-500/10 text-blue-600" },
                            { title: "Target Savings Vaults", desc: "Automated goals at 6.5% p.a.", href: "/esusu", icon: PiggyBank, tone: "bg-emerald-500/10 text-emerald-600" },
                            { title: "Smart Debit Cards", desc: "Freeze & manage POS/Web limits", href: "/my-cards", icon: CreditCard, tone: "bg-violet-500/10 text-violet-600" },
                            { title: "Apply for Credit", desc: "Instant retail & SME facilities", href: "/explore/loans", icon: FileText, tone: "bg-amber-500/10 text-amber-600" },
                        ].map((act) => (
                            <Link
                                key={act.title}
                                href={act.href}
                                className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border/80 hover:border-primary/40 transition-all group shadow-sm"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${act.tone}`}>
                                        <act.icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-black text-foreground">{act.title}</p>
                                        <p className="text-[11px] text-muted-foreground">{act.desc}</p>
                                    </div>
                                </div>
                                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </Link>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-8 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-foreground">Recent Transactions</h3>
                            <p className="text-xs text-muted-foreground">Click any transaction to open its printable receipt</p>
                        </div>
                        <Link href="/client-dashboard/transactions" className="text-xs font-black text-primary hover:underline">
                            View Full Statement →
                        </Link>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
                            <Receipt className="h-8 w-8 mx-auto opacity-30" />
                            <p>No transactions posted yet. Fund your account to get started.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {transactions.slice(0, 8).map((tx) => {
                                const isCredit = tx.type === "credit"
                                return (
                                    <button
                                        key={tx.id}
                                        type="button"
                                        onClick={() => setSelectedTx(tx)}
                                        className="w-full py-3 px-2 hover:bg-muted/30 rounded-xl transition-colors flex items-center justify-between gap-3 text-left"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                    isCredit ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                                                }`}
                                            >
                                                {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-foreground truncate">{tx.category || tx.type}</p>
                                                <p className="text-[11px] text-muted-foreground">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`text-xs font-mono font-black ${isCredit ? "text-emerald-600" : "text-foreground"}`}>
                                                {isCredit ? "+" : "-"}
                                                {fmtFull(tx.amount)}
                                            </p>
                                            <span className="text-[9px] font-bold uppercase text-muted-foreground">Receipt →</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Transaction Receipt Drawer */}
            <BankSideDrawer
                open={Boolean(selectedTx)}
                onClose={() => setSelectedTx(null)}
                title="Official Transaction Receipt"
                subtitle={activeProfile.legalName}
                badge={
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-black uppercase">
                        <ShieldCheck className="h-3 w-3" /> Settled on Core Ledger
                    </span>
                }
                footer={
                    <Button type="button" size="sm" onClick={() => window.print()} className="rounded-xl font-black text-xs gap-1.5">
                        <Printer className="h-3.5 w-3.5" /> Print / Save PDF Receipt
                    </Button>
                }
            >
                {selectedTx && (
                    <div className="space-y-4">
                        <div className="p-5 rounded-2xl bg-muted/30 border text-center space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                {selectedTx.type === "credit" ? "Credit Received" : "Debit Processed"}
                            </p>
                            <p className={`text-3xl font-black font-mono ${selectedTx.type === "credit" ? "text-emerald-600" : "text-foreground"}`}>
                                {selectedTx.type === "credit" ? "+" : "-"}
                                {fmtFull(selectedTx.amount)}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-border/80 divide-y divide-border/70 text-xs">
                            <div className="p-3.5 flex justify-between">
                                <span className="text-muted-foreground">Reference ID</span>
                                <span className="font-mono font-bold">{selectedTx.id}</span>
                            </div>
                            <div className="p-3.5 flex justify-between">
                                <span className="text-muted-foreground">Narration / Category</span>
                                <span className="font-bold text-right max-w-[60%]">{selectedTx.category}</span>
                            </div>
                            <div className="p-3.5 flex justify-between">
                                <span className="text-muted-foreground">Date &amp; Time</span>
                                <span className="font-bold">{new Date(selectedTx.created_at).toLocaleString()}</span>
                            </div>
                            <div className="p-3.5 flex justify-between">
                                <span className="text-muted-foreground">Settlement Bank</span>
                                <span className="font-bold">{activeProfile.legalName}</span>
                            </div>
                        </div>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
