import Link from "next/link"
import {
    Wallet,
    FileText,
    Users,
    AlertTriangle,
    ArrowRight,
    Landmark,
    Globe,
    Sliders,
    ExternalLink,
    Layers,
    ShieldCheck,
    CreditCard,
    CheckCircle2,
    Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UpdateLiveSiteButton } from "./DashboardWidgets"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"
import { BANK_MODULE_DEFINITIONS } from "@/lib/banking/bank-profiles"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { getInstitutionalTreasurySnapshot } from "@/lib/banking/gl-engine"
import { getCoptellerOversightSnapshot } from "@/lib/banking/copteller-bridge"
import { BankPageHeader } from "@/components/banking/page-header"
import {
    TreasuryCashflowChart,
    PortfolioMixDonut,
    CbnHealthGauge,
    ChannelVelocityBars,
} from "@/components/banking/charts/bank-charts"
import { EcosystemRailCard } from "@/components/banking/ecosystem-rail-card"

export const dynamic = "force-dynamic"

const fmtCompact = (n: number) =>
    `₦${Number(n || 0).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`

export default async function DashboardPage() {
    await ensureBankSuiteOperationalTables()
    const dbStart = Date.now()

    const [
        serverBank,
        treasury,
        coptellerSnap,
        customersAgg,
        queuesRes,
        recentLoansRes,
        recentAuditsRes,
        terminalsAgg,
    ] = await Promise.all([
        getServerBankProfile(),
        getInstitutionalTreasurySnapshot(),
        getCoptellerOversightSnapshot().catch(() => null),
        queryBankSuite(`
            SELECT COUNT(*)::int AS total_customers,
                   COUNT(*) FILTER (WHERE kyc_status = 'active')::int AS verified_customers,
                   COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::int AS new_30d
            FROM public.customers WHERE COALESCE(is_archived, FALSE) = FALSE
        `),
        queryBankSuite(`
            SELECT
                (SELECT COUNT(*)::int FROM public.product_applications WHERE status IN ('pending','under_review')) AS pending_applications,
                (SELECT COUNT(*)::int FROM public.agency_terminals WHERE status = 'pending') AS pending_terminals,
                (SELECT COUNT(*)::int FROM public.merchant_profiles WHERE is_verified = FALSE) AS pending_merchants,
                (SELECT COUNT(*)::int FROM public.banksuite_approval_queue WHERE status = 'pending') AS pending_approvals,
                (SELECT COUNT(*)::int FROM public.banksuite_funding_requests WHERE status = 'pending') AS pending_funding,
                (SELECT COUNT(*)::int FROM public.loans WHERE status = 'pending') AS pending_loans
        `),
        queryBankSuite(`
            SELECT l.id, l.principal, l.outstanding_balance, l.status, l.duration_months, l.interest_rate, l.created_at,
                   COALESCE(c.first_name || ' ' || c.last_name, c.email, l.user_id) AS applicant_name,
                   COALESCE(pt.name, l.purpose, 'Credit Facility') AS product_name
            FROM public.loans l
            LEFT JOIN public.customers c ON c.id = l.customer_id
            LEFT JOIN public.product_types pt ON pt.id = l.product_type_id
            ORDER BY l.created_at DESC
            LIMIT 6
        `),
        queryBankSuite(`
            SELECT id, actor_email, action, entity_type, amount_kobo, status, created_at
            FROM public.banksuite_audit_logs
            ORDER BY created_at DESC
            LIMIT 6
        `),
        queryBankSuite(`
            SELECT COUNT(*) FILTER (WHERE status IN ('active','assigned'))::int AS active_terminals
            FROM public.agency_terminals
        `),
    ])

    const dbLatencyMs = Date.now() - dbStart
    const bankProfile = serverBank.profile
    const sum = treasury.summary
    const queues = queuesRes.rows[0] || {}
    const cust = customersAgg.rows[0] || {}
    const copKpis = coptellerSnap?.kpis
    const copHealth = coptellerSnap?.health

    const coptellerEscrowNaira = (copKpis?.escrowBalanceKobo || 0) / 100
    const banksuiteCustodyNaira = sum.coptellerCustodyKobo / 100
    const totalRegulatedDepositsNaira =
        (sum.totalDirectDepositsKobo + sum.targetVaultsKobo + Math.max(sum.coptellerCustodyKobo, copKpis?.escrowBalanceKobo || 0)) / 100
    const totalLoanExposureNaira = sum.totalLoanExposureKobo / 100

    // Merge live Copteller escrow balance into deposit mix chart even before first manual sweep
    const liveDepositMix = treasury.depositMix.map((seg) =>
        seg.label.includes("Copteller")
            ? { ...seg, valueNaira: Math.max(seg.valueNaira, coptellerEscrowNaira) }
            : seg
    )

    const totalPendingActions =
        Number(queues.pending_approvals || 0) +
        Number(queues.pending_funding || 0) +
        Number(queues.pending_applications || 0) +
        Number(queues.pending_loans || 0) +
        Number(queues.pending_terminals || 0) +
        Number(queues.pending_merchants || 0) +
        Number(copKpis?.pendingCooperatives || 0) +
        Number(copKpis?.pendingLoansCount || 0)

    const queueCards = [
        { label: "Maker-Checker", count: Number(queues.pending_approvals || 0), href: "/dashboard/operations?tab=approvals" },
        { label: "Funding Queue", count: Number(queues.pending_funding || 0), href: "/dashboard/operations?tab=funding" },
        { label: "Credit Queue", count: Number(queues.pending_loans || 0) + Number(copKpis?.pendingLoansCount || 0), href: "/products/loans" },
        { label: "Applications", count: Number(queues.pending_applications || 0), href: "/products/applications" },
        { label: "POS Requests", count: Number(queues.pending_terminals || 0), href: "/dashboard/agency" },
        { label: "Copteller Unions", count: Number(copKpis?.pendingCooperatives || 0), href: "/dashboard/copteller?tab=unions" },
    ]

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
            {/* Crisp Light-First Institutional Header */}
            <BankPageHeader
                badge={`${bankProfile.legalName}`}
                livePill={`Core Postgres · ${dbLatencyMs}ms`}
                liveTone="emerald"
                title="Institutional Command Center"
                subtitle={`Real-time double-entry core ledger, CBN prudential liquidity controls, credit committee oversight, and regulated Copteller cooperative custody for ${bankProfile.shortName}.`}
                actions={
                    <>
                        <Button asChild size="sm" variant="outline" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Link href="/settings/bank-profiles">
                                <Sliders className="h-3.5 w-3.5" /> White-Label
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Link href="/dashboard/operations?tab=eod">
                                <Activity className="h-3.5 w-3.5 text-emerald-600" /> EOD Close &amp; Sync
                            </Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Link href="/products/loans">
                                <CreditCard className="h-3.5 w-3.5" /> Credit Desk
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5 shadow-sm">
                            <Link href="/dashboard/operations">
                                <Landmark className="h-3.5 w-3.5" /> Teller &amp; GL Desk
                            </Link>
                        </Button>
                        <UpdateLiveSiteButton />
                    </>
                }
            />

            {/* Primary Executive KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Link
                    href="/dashboard/operations?tab=gl"
                    className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Total Regulated Deposits
                        </span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Wallet className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech text-foreground">
                        {fmtCompact(totalRegulatedDepositsNaira)}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            Direct + GL 2100 Custody
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link
                    href="/products/loans"
                    className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Active Loan Exposure
                        </span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FileText className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech text-foreground">
                        {fmtCompact(totalLoanExposureNaira)}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-muted-foreground">
                            {treasury.parAging.activeCount} active · LDR {sum.loanToDepositPct}%
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link
                    href="/customers"
                    className="group bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-5 shadow-sm transition-all space-y-2.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Customer &amp; KYC Registry
                        </span>
                        <div className="p-2 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400">
                            <Users className="h-4 w-4" />
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech text-foreground">
                        {Number(cust.total_customers || 0).toLocaleString()}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {Number(cust.verified_customers || 0)} verified · +{Number(cust.new_30d || 0)} (30d)
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>

                <Link
                    href="/dashboard/operations?tab=approvals"
                    className="group bg-card border border-border/80 hover:border-amber-500/40 rounded-3xl p-5 shadow-sm transition-all space-y-2.5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Pending Governance Ops
                        </span>
                        <div className={`p-2 rounded-xl ${totalPendingActions > 0 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                            {totalPendingActions > 0 ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech text-foreground">
                        {totalPendingActions}
                    </p>
                    <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-bold ${totalPendingActions > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                            {totalPendingActions > 0 ? "Items awaiting sign-off" : "All queues clear"}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                </Link>
            </div>

            {/* Real-World Closed-Loop Architecture: BankSuite (MFB Core) <-> Copteller (Cooperative OS) */}
            {bankProfile.enabledModules.coptellerBridge && (
                <EcosystemRailCard
                    coptellerConnected={Boolean(copHealth?.connected)}
                    coptellerUrl={copHealth?.appUrl || "http://localhost:3001"}
                    activeCooperatives={copKpis?.activeCooperatives || 0}
                    activeMembers={copKpis?.totalMembers || 0}
                    coptellerEscrowNaira={coptellerEscrowNaira}
                    banksuiteCustodyNaira={banksuiteCustodyNaira}
                    pendingCreditCount={Number(queues.pending_loans || 0) + Number(copKpis?.pendingLoansCount || 0)}
                    avgTrustScore={copKpis?.avgCreditScore || 75}
                    activeTerminals={Number(terminalsAgg.rows[0]?.active_terminals || 0)}
                />
            )}

            {/* Interactive Charts & Balance Sheet Mix */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-stretch">
                <div className="xl:col-span-2">
                    <TreasuryCashflowChart
                        title="Core Banking Cashflow & Settlement Velocity"
                        subtitle="Live posted credits, loan repayments, outward transfers & disbursements across all MFB accounts"
                        data={treasury.dailyCashflow}
                    />
                </div>
                <PortfolioMixDonut
                    title="Regulated Deposit Mix"
                    subtitle="Direct Retail/SME CASA combined with ring-fenced Copteller GL 2100 custody"
                    segments={liveDepositMix}
                />
            </div>

            {/* CBN Prudential Risk Gauges + Channel Velocity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <CbnHealthGauge
                        label="CBN Liquidity Ratio"
                        value={sum.cbnLiquidityRatioPct}
                        max={100}
                        statusText={sum.cbnLiquidityRatioPct >= 20 ? "CBN Compliant (≥ 20%)" : "Below Floor"}
                        tone={sum.cbnLiquidityRatioPct >= 20 ? "emerald" : "rose"}
                        subtitle={`Liquid Nostro + CBN Reserve (${fmtCompact(sum.liquidAssetsKobo / 100)}) covering regulated deposits.`}
                    />
                    <CbnHealthGauge
                        label="Portfolio At Risk (PAR > 30d)"
                        value={sum.parRatioPct}
                        max={25}
                        statusText={sum.parRatioPct <= 5 ? "Prime Asset Quality" : "Watchlist Elevated"}
                        tone={sum.parRatioPct <= 5 ? "emerald" : sum.parRatioPct <= 10 ? "amber" : "rose"}
                        subtitle={`CBN benchmark ≤ 5.0%. Performing book: ${fmtCompact(treasury.parAging.performingKobo / 100)}.`}
                    />
                </div>
                <div className="lg:col-span-2">
                    <ChannelVelocityBars channels={treasury.channelBreakdown} />
                </div>
            </div>

            {/* Actionable Operational Queues */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {queueCards.map((q) => {
                    const active = q.count > 0
                    return (
                        <Link
                            key={q.label}
                            href={q.href}
                            className={`group rounded-2xl border p-4 transition-all flex items-center justify-between shadow-sm ${
                                active
                                    ? "border-amber-500/35 bg-amber-500/[0.04] hover:border-amber-500/60"
                                    : "border-border/80 bg-card hover:border-primary/40"
                            }`}
                        >
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-black text-muted-foreground">
                                    {q.label}
                                </p>
                                <p className={`text-2xl font-black mt-1 tabular-nums-fintech ${active ? "text-amber-600" : "text-foreground"}`}>
                                    {q.count}
                                </p>
                            </div>
                            <div className={`size-8 rounded-xl flex items-center justify-center transition-transform group-hover:translate-x-0.5 ${active ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground"}`}>
                                <ArrowRight className="h-4 w-4" />
                            </div>
                        </Link>
                    )
                })}
            </div>

            {/* Bottom Operational Feeds: Recent Credit Facilities & Live Audit Trail */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-foreground">Recent Credit Facilities</h3>
                            <p className="text-xs text-muted-foreground font-medium">Latest originated and active loans in core ledger</p>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-xs font-black text-primary">
                            <Link href="/products/loans">
                                Open Credit Desk <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                    {recentLoansRes.rows.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">No loan facilities recorded yet.</p>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {recentLoansRes.rows.map((l: any) => (
                                <Link
                                    key={l.id}
                                    href="/products/loans"
                                    className="py-3 flex items-center justify-between gap-3 hover:bg-muted/30 px-2 rounded-xl transition-colors"
                                >
                                    <div className="min-w-0">
                                        <p className="text-xs font-black text-foreground truncate">{l.applicant_name}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {l.product_name} · {l.duration_months}m @ {l.interest_rate}%
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black font-mono tabular-nums-fintech">
                                            ₦{(Number(l.principal || 0) / 100).toLocaleString()}
                                        </p>
                                        <Badge variant="outline" className="text-[9px] uppercase font-black mt-0.5">
                                            {l.status}
                                        </Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-black text-foreground flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Immutable Compliance Audit Stream
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">Real-time ledger, GL, and custody actions</p>
                        </div>
                        <Button asChild variant="ghost" size="sm" className="text-xs font-black text-primary">
                            <Link href="/dashboard/operations?tab=audit">
                                Full Audit Trail <ArrowRight className="h-3.5 w-3.5 ml-1" />
                            </Link>
                        </Button>
                    </div>
                    {recentAuditsRes.rows.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-8 text-center">No audit entries logged yet.</p>
                    ) : (
                        <div className="divide-y divide-border/70">
                            {recentAuditsRes.rows.map((a: any) => (
                                <div key={a.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                                    <div className="min-w-0">
                                        <p className="font-mono font-bold text-foreground truncate">{a.action}</p>
                                        <p className="text-[11px] text-muted-foreground truncate">
                                            {a.actor_email || "system"} · {a.entity_type}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        {a.amount_kobo ? (
                                            <p className="font-mono font-black text-foreground">
                                                ₦{(Number(a.amount_kobo) / 100).toLocaleString()}
                                            </p>
                                        ) : null}
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(a.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Active White-Label Modules Strip */}
            <div className="rounded-2xl border border-border/80 bg-card px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-widest text-muted-foreground mr-1">
                        <Layers className="h-3.5 w-3.5 text-primary" /> Active Modules ({bankProfile.shortName})
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
                                        : "text-muted-foreground/50 line-through"
                                }`}
                            >
                                {m.label}
                            </Badge>
                        )
                    })}
                </div>
                <div className="flex items-center gap-3 text-xs font-black">
                    <Link href="/settings/bank-profiles" className="text-primary hover:underline inline-flex items-center gap-1">
                        Configure <ArrowRight className="h-3 w-3" />
                    </Link>
                    <Link href="/" target="_blank" className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                        Live Site <ExternalLink className="h-3 w-3" />
                    </Link>
                </div>
            </div>
        </div>
    )
}
