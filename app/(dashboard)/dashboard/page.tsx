import { api } from "@/lib/api"
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    Users,
    AlertTriangle,
    ArrowRight,
    ShieldCheck,
    Landmark,
    Activity,
    Globe,
    Sparkles,
    ExternalLink,
    Sliders,
    Layers,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense } from "react"
import { VolumeChart } from "@/components/dashboard/volume-chart"
import { UpdateLiveSiteButton, QuickCommandWidget } from "./DashboardWidgets"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"
import { BANK_MODULE_DEFINITIONS } from "@/lib/banking/bank-profiles"
import { Badge } from "@/components/ui/badge"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { checkCoptellerBridgeHealth } from "@/lib/banking/copteller-bridge"

async function DashboardOverviewContent() {
    await ensureBankSuiteOperationalTables()
    const dbStart = Date.now()
    const [
        accountsAgg,
        loansAgg,
        txPeriodAgg,
        customersAgg,
        queuesRes,
        recentLoansRes,
        recentAuditsRes,
        transactions,
        serverBank,
        coptellerHealth,
    ] = await Promise.all([
        queryBankSuite(`
            SELECT COUNT(*)::int AS total_accounts,
                   COUNT(*) FILTER (WHERE is_frozen = TRUE OR pnd_enabled = TRUE)::int AS restricted_accounts,
                   COALESCE(SUM(balance), 0)::bigint AS total_balance_kobo
            FROM public.accounts
        `),
        queryBankSuite(`
            SELECT COUNT(*)::int AS total_loans,
                   COUNT(*) FILTER (WHERE status = 'active')::int AS active_loans,
                   COALESCE(SUM(principal), 0)::bigint AS total_principal_kobo,
                   COALESCE(SUM(CASE WHEN status IN ('defaulted','written_off') THEN outstanding_balance ELSE 0 END), 0)::bigint AS defaulted_kobo
            FROM public.loans
        `),
        queryBankSuite(`
            SELECT
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::bigint AS vol_30d,
                COALESCE(SUM(CASE WHEN created_at >= NOW() - INTERVAL '60 days' AND created_at < NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0)::bigint AS vol_prev_30d
            FROM public.transactions
        `),
        queryBankSuite(`
            SELECT COUNT(*)::int AS total_customers,
                   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_30d
            FROM public.customers WHERE COALESCE(is_archived, FALSE) = FALSE
        `),
        queryBankSuite(`
            SELECT
                (SELECT COUNT(*)::int FROM public.product_applications WHERE status IN ('pending','under_review')) AS pending_applications,
                (SELECT COUNT(*)::int FROM public.agency_terminals WHERE status = 'pending') AS pending_terminals,
                (SELECT COUNT(*)::int FROM public.merchant_profiles WHERE is_verified = FALSE) AS pending_merchants,
                (SELECT COUNT(*)::int FROM public.cooperatives WHERE status = 'pending') AS pending_cooperatives,
                (SELECT COUNT(*)::int FROM public.banksuite_approval_queue WHERE status = 'pending') AS pending_approvals,
                (SELECT COUNT(*)::int FROM public.banksuite_funding_requests WHERE status = 'pending') AS pending_funding
        `),
        queryBankSuite(`
            SELECT l.id, l.principal, l.status, l.duration_months, l.interest_rate, l.created_at,
                   COALESCE(c.first_name || ' ' || c.last_name, c.email, l.user_id) AS applicant_name,
                   COALESCE(pt.name, l.purpose, 'Credit Facility') AS product_name
            FROM public.loans l
            LEFT JOIN public.customers c ON c.id = l.customer_id
            LEFT JOIN public.product_types pt ON pt.id = l.product_type_id
            ORDER BY l.created_at DESC
            LIMIT 5
        `),
        queryBankSuite(`
            SELECT id, actor_email, action, entity_type, amount_kobo, status, created_at
            FROM public.banksuite_audit_logs
            ORDER BY created_at DESC
            LIMIT 6
        `),
        api.getAllTransactions().catch(() => []),
        getServerBankProfile(),
        checkCoptellerBridgeHealth(),
    ])
    const dbLatencyMs = Date.now() - dbStart
    const bankProfile = serverBank.profile

    const totalBalanceNaira = Number(accountsAgg.rows[0]?.total_balance_kobo || 0) / 100
    const totalAccounts = Number(accountsAgg.rows[0]?.total_accounts || 0)
    const restrictedAccounts = Number(accountsAgg.rows[0]?.restricted_accounts || 0)

    const totalLoansNaira = Number(loansAgg.rows[0]?.total_principal_kobo || 0) / 100
    const activeLoansCount = Number(loansAgg.rows[0]?.active_loans || 0)
    const defaultedNaira = Number(loansAgg.rows[0]?.defaulted_kobo || 0) / 100
    const npfRatio = totalLoansNaira > 0 ? (defaultedNaira / totalLoansNaira) * 100 : 0

    const vol30 = Number(txPeriodAgg.rows[0]?.vol_30d || 0)
    const volPrev = Number(txPeriodAgg.rows[0]?.vol_prev_30d || 0)
    const volDelta = volPrev > 0 ? ((vol30 - volPrev) / volPrev) * 100 : vol30 > 0 ? 100 : 0

    const totalCustomers = Number(customersAgg.rows[0]?.total_customers || 0)
    const newCustomers30d = Number(customersAgg.rows[0]?.new_30d || 0)
    const queues = queuesRes.rows[0] || {}
    const totalPendingActions =
        Number(queues.pending_applications || 0) +
        Number(queues.pending_terminals || 0) +
        Number(queues.pending_merchants || 0) +
        Number(queues.pending_cooperatives || 0) +
        Number(queues.pending_approvals || 0) +
        Number(queues.pending_funding || 0)

    const heroBg = bankProfile.themeStyle?.heroBgHex || "#070D59"
    const accentHex = bankProfile.themeStyle?.accentHex || "#F4C414"

    const queueCards = [
        { label: "Maker-Checker", count: Number(queues.pending_approvals || 0), href: "/dashboard/operations?tab=approvals" },
        { label: "Funding Queue", count: Number(queues.pending_funding || 0), href: "/dashboard/operations?tab=funding" },
        { label: "Applications", count: Number(queues.pending_applications || 0), href: "/products/applications" },
        { label: "POS Requests", count: Number(queues.pending_terminals || 0), href: "/dashboard/agency" },
        { label: "Merchants KYB", count: Number(queues.pending_merchants || 0), href: "/dashboard/merchant" },
        { label: "Cooperatives", count: Number(queues.pending_cooperatives || 0), href: "/dashboard/esusu" },
    ]

    return (
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8 max-w-[1440px] mx-auto">
            {/* Branded Executive Command Hero */}
            <section
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-white/10"
                style={{
                    background: `radial-gradient(circle at 90% 10%, ${accentHex}30 0%, transparent 45%), linear-gradient(135deg, ${heroBg} 0%, #090E24 100%)`,
                }}
            >
                <div className="absolute -right-24 -bottom-24 size-72 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ backgroundColor: accentHex }} />

                <div className="relative z-10 flex flex-col xl:flex-row xl:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[11px] font-black tracking-wide">
                            <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span>{bankProfile.legalName}</span>
                            <span className="opacity-60 font-mono">· {bankProfile.ussdCode}</span>
                            <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-mono uppercase">
                                {bankProfile.id}
                            </span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                            Institutional Command Center
                        </h1>
                        <p className="text-sm text-white/75 font-medium leading-relaxed">
                            Real-time double-entry core ledger, dual-control treasury operations, and modular cooperative oversight for {bankProfile.shortName}.
                        </p>

                        <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <Button asChild size="sm" className="rounded-xl font-black bg-white text-slate-950 hover:bg-white/90 h-10 px-4 shadow-lg">
                                <Link href="/dashboard/operations">
                                    <Landmark className="h-4 w-4 mr-1.5" /> Teller &amp; Audit Desk
                                </Link>
                            </Button>
                            {bankProfile.enabledModules.coptellerBridge && (
                                <Button asChild size="sm" variant="outline" className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4">
                                    <Link href="/dashboard/copteller">
                                        <Globe className="h-4 w-4 mr-1.5 text-emerald-300" /> Copteller Bridge
                                    </Link>
                                </Button>
                            )}
                            <Button asChild size="sm" variant="outline" className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4">
                                <Link href="/settings/bank-profiles">
                                    <Sliders className="h-4 w-4 mr-1.5" /> Swap White-Label
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="ghost" className="rounded-xl font-bold text-white/80 hover:text-white hover:bg-white/10 h-10 px-3">
                                <Link href="/" target="_blank">
                                    Live Site <ExternalLink className="h-3.5 w-3.5 ml-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>

                    {/* Executive Live Treasury Snapshot */}
                    <div className="flex flex-col sm:flex-row xl:flex-col items-stretch sm:items-end gap-3 shrink-0">
                        <div className="grid grid-cols-2 gap-3 bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-4 min-w-[270px]">
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Total Deposits</p>
                                <p className="text-xl sm:text-2xl font-black tabular-nums-fintech mt-0.5">
                                    ₦{totalBalanceNaira.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}
                                </p>
                            </div>
                            <div className="border-l border-white/10 pl-3">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">Pending Ops</p>
                                <p className="text-xl sm:text-2xl font-black tabular-nums-fintech mt-0.5 flex items-center gap-1.5">
                                    {totalPendingActions}
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${totalPendingActions > 0 ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/20 text-emerald-300"}`}>
                                        {totalPendingActions > 0 ? "Action" : "Clear"}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <UpdateLiveSiteButton />
                    </div>
                </div>
            </section>

            {/* Active Suite Modules Telemetry Strip */}
            <div className="rounded-2xl border border-border/80 bg-card/80 backdrop-blur-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground mr-1">
                        <Layers className="h-3.5 w-3.5 text-primary" /> Active Modules
                    </span>
                    {BANK_MODULE_DEFINITIONS.map((m) => {
                        const enabled = bankProfile.enabledModules[m.key]
                        return (
                            <Badge
                                key={m.key}
                                variant={enabled ? "secondary" : "outline"}
                                className={`text-[10px] font-bold rounded-full px-2.5 py-0.5 ${
                                    enabled
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25"
                                        : "text-muted-foreground/55 line-through"
                                }`}
                            >
                                {m.label}
                            </Badge>
                        )
                    })}
                </div>
                <Link href="/settings/bank-profiles" className="text-xs font-black text-primary hover:underline shrink-0 inline-flex items-center gap-1">
                    Configure <ArrowRight className="h-3 w-3" />
                </Link>
            </div>

            {/* Real Computed Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                <Card className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/40" />
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Customer Deposits</span>
                        <div className="p-2 rounded-xl bg-primary/10 text-primary">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black mb-2 tracking-tight tabular-nums-fintech">
                        ₦{totalBalanceNaira.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold tabular-nums-fintech">
                            {totalAccounts} accounts
                        </span>
                        <span className="text-muted-foreground text-[11px] font-semibold">
                            {restrictedAccounts} restricted
                        </span>
                    </div>
                </Card>

                <Card className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loan Portfolio</span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black mb-2 tracking-tight tabular-nums-fintech">
                        ₦{totalLoansNaira.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary font-bold">
                            {activeLoansCount} active
                        </span>
                        <span className="text-muted-foreground text-[11px] font-semibold tabular-nums-fintech">
                            30d vol {volDelta >= 0 ? "+" : ""}{volDelta.toFixed(1)}%
                        </span>
                    </div>
                </Card>

                <Card className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Customer Registry</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black mb-2 tracking-tight tabular-nums-fintech">{totalCustomers.toLocaleString()}</p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1 tabular-nums-fintech">
                            <TrendingUp className="h-3 w-3" />+{newCustomers30d}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-semibold">New last 30d</span>
                    </div>
                </Card>

                <Card className="fintech-card p-6 relative overflow-hidden">
                    <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${npfRatio > 5 ? "from-rose-500 to-orange-500" : "from-amber-400 to-emerald-500"}`} />
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Portfolio Risk (NPF)</span>
                        <div className={`p-2 rounded-xl ${npfRatio > 5 ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600 dark:text-amber-400"}`}>
                            <AlertTriangle className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-3xl font-black mb-2 tracking-tight tabular-nums-fintech">{npfRatio.toFixed(2)}%</p>
                    <div className="flex items-center gap-2 text-xs">
                        <span className={`px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${npfRatio > 5 ? "bg-destructive/10 text-destructive" : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"}`}>
                            {npfRatio > 5 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {npfRatio > 5 ? "Elevated" : "CBN Healthy"}
                        </span>
                        <span className="text-muted-foreground text-[11px] font-semibold tabular-nums-fintech">
                            {totalPendingActions} queued
                        </span>
                    </div>
                </Card>
            </div>

            {/* Actionable Operational Queues */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {queueCards.map((q) => {
                    const hasItems = q.count > 0
                    return (
                        <Link
                            key={q.label}
                            href={q.href}
                            className={`group rounded-2xl border p-4 transition-all flex items-center justify-between shadow-sm ${
                                hasItems
                                    ? "border-amber-500/35 bg-amber-500/[0.04] hover:border-amber-500/60"
                                    : "border-border/80 bg-card/90 hover:border-primary/40"
                            }`}
                        >
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">{q.label}</p>
                                <p className={`text-2xl font-black mt-1 tabular-nums-fintech ${hasItems ? "text-amber-600 dark:text-amber-400" : "text-foreground"}`}>
                                    {q.count}
                                </p>
                            </div>
                            <div className={`size-8 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-0.5 ${hasItems ? "bg-amber-500/15 text-amber-600 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Institutional Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Link href="/dashboard/operations" className="block group">
                    <Card className="fintech-card bg-gradient-to-br from-primary/10 via-card to-card border-primary/25 p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
                                <Landmark className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm sm:text-base">Teller, Reconciliation &amp; Audit</h3>
                                <p className="text-xs text-muted-foreground">Cash postings, liens, trial balance &amp; CSV audit logs.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                    </Card>
                </Link>

                {bankProfile.enabledModules.coptellerBridge && (
                    <Link href="/dashboard/copteller" className="block group">
                        <Card className="fintech-card bg-gradient-to-br from-emerald-500/10 via-card to-card border-emerald-500/25 p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                                    <Globe className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="font-black text-sm sm:text-base">Copteller Cooperative Bridge</h3>
                                    <p className="text-xs text-muted-foreground">
                                        {coptellerHealth.connected
                                            ? `Connected live (${coptellerHealth.latencyMs}ms) · Union & HP oversight`
                                            : "Configure Copteller database bridge"}
                                    </p>
                                </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-emerald-600 group-hover:translate-x-1 transition-transform shrink-0" />
                        </Card>
                    </Link>
                )}

                <Link href="/workflows" className="block group">
                    <Card className="fintech-card p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                            <div className="p-2.5 rounded-xl bg-muted border border-border text-primary">
                                <Activity className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-black text-sm sm:text-base">Workflows &amp; Core Endpoints</h3>
                                <p className="text-xs text-muted-foreground">Qore adapters, SDL orchestration &amp; provider mappings.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform shrink-0" />
                    </Card>
                </Link>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-7">
                <div className="xl:col-span-2 space-y-7">
                    <VolumeChart transactions={transactions} />

                    {/* Real Recent Loan Facilities */}
                    <Card className="fintech-card overflow-hidden">
                        <div className="px-6 py-5 border-b border-border/70 flex items-center justify-between">
                            <div>
                                <h3 className="text-base sm:text-lg font-black">Recent Loan Facilities</h3>
                                <p className="text-xs text-muted-foreground">Latest credit exposures on the core ledger</p>
                            </div>
                            <Link href="/products/loans" className="text-xs font-black text-primary hover:underline inline-flex items-center gap-1">
                                View All <ArrowRight className="h-3 w-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            {recentLoansRes.rows.length === 0 ? (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    No loan facilities recorded yet.
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="bg-muted/40 border-b border-border/60">
                                            <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Borrower</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Product</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Principal</th>
                                            <th className="px-6 py-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                            <th className="px-6 py-3 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/60">
                                        {recentLoansRes.rows.map((loan: any) => {
                                            const st = String(loan.status || "").toLowerCase()
                                            const stClass =
                                                st === "active"
                                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                                    : st === "pending"
                                                    ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                                                    : st === "defaulted"
                                                    ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25"
                                                    : "bg-muted text-muted-foreground"
                                            return (
                                                <tr key={loan.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm font-bold">{loan.applicant_name}</p>
                                                        <p className="text-[10px] text-muted-foreground font-mono">Loan #{loan.id}</p>
                                                    </td>
                                                    <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">{loan.product_name}</td>
                                                    <td className="px-6 py-4 text-sm font-black tabular-nums-fintech">
                                                        ₦{(Number(loan.principal || 0) / 100).toLocaleString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className={`text-[10px] font-black uppercase rounded-full ${stClass}`}>
                                                            {loan.status}
                                                        </Badge>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <Button asChild variant="ghost" size="sm" className="text-xs font-bold rounded-lg">
                                                            <Link href={`/products/loans/${loan.id}`}>Inspect</Link>
                                                        </Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Right Column: Live Health + Recent Audit Feed + Quick Command */}
                <div className="space-y-6">
                    <Card className="fintech-card p-6">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-primary" /> Live Infrastructure
                            </h3>
                            <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                Nominal
                            </span>
                        </div>
                        <div className="space-y-4 text-xs">
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-emerald-500" /> Core Postgres Ledger
                                    </span>
                                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 tabular-nums-fintech">
                                        {dbLatencyMs}ms
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, Math.max(12, 100 - dbLatencyMs / 25))}%` }} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-2">
                                        <span className={`size-2 rounded-full ${process.env.QORE_SECRET_ID ? "bg-emerald-500" : "bg-amber-500"}`} /> Qore Core Switch
                                    </span>
                                    <span className="font-mono font-bold text-muted-foreground uppercase">
                                        {process.env.QORE_SECRET_ID ? process.env.QORE_ENV || "staging" : "local ledger"}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${process.env.QORE_SECRET_ID ? "bg-emerald-500 w-4/5" : "bg-amber-500 w-1/2"}`} />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="font-bold flex items-center gap-2">
                                        <span className={`size-2 rounded-full ${coptellerHealth.connected ? "bg-emerald-500" : "bg-slate-400"}`} /> Copteller Bridge
                                    </span>
                                    <span className={`font-mono font-black tabular-nums-fintech ${coptellerHealth.connected ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}>
                                        {coptellerHealth.connected ? `${coptellerHealth.latencyMs}ms` : "offline"}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full ${coptellerHealth.connected ? "bg-emerald-500 w-11/12" : "bg-slate-400 w-1/5"}`} />
                                </div>
                            </div>
                        </div>
                    </Card>

                    <Card className="fintech-card p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black uppercase tracking-wider flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-primary" /> Audit Stream
                            </h3>
                            <Link href="/dashboard/operations?tab=audit" className="text-xs font-bold text-primary hover:underline">
                                Full Log &rarr;
                            </Link>
                        </div>
                        {recentAuditsRes.rows.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No administrative mutations logged yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {recentAuditsRes.rows.map((a: any) => (
                                    <div key={a.id} className="flex items-start justify-between gap-2 text-xs border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                                        <div className="min-w-0">
                                            <p className="font-mono font-bold truncate text-foreground">{a.action}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{a.actor_email || "system"}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            {a.amount_kobo != null && (
                                                <p className="font-black text-primary tabular-nums-fintech">
                                                    ₦{(Number(a.amount_kobo) / 100).toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground tabular-nums-fintech">
                                                {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>

                    <QuickCommandWidget />
                </div>
            </div>
        </div>
    )
}

export default function DashboardOverview() {
    return (
        <Suspense
            fallback={
                <div className="p-8 space-y-6 max-w-[1440px] mx-auto animate-pulse">
                    <div className="h-44 rounded-3xl bg-muted/60" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 rounded-2xl bg-muted/50" />
                        ))}
                    </div>
                </div>
            }
        >
            <DashboardOverviewContent />
        </Suspense>
    )
}
