import { api } from "@/lib/api";
import {
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    Users,
    AlertTriangle,
    MoreVertical,
    ArrowRight
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Suspense } from "react";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { UpdateLiveSiteButton, QuickCommandWidget } from "./DashboardWidgets";
import { getServerBankProfile } from "@/lib/banking/bank-profile-server";
import { BANK_MODULE_DEFINITIONS } from "@/lib/banking/bank-profiles";
import { Badge } from "@/components/ui/badge";

async function DashboardOverviewContent() {
    const [accounts, loans, transactions, users, products, serverBank] = await Promise.all([
        api.getAllAccounts(),
        api.getAllLoans(),
        api.getAllTransactions(),
        api.getAllUsers(),
        api.getAllProductTypes(),
        getServerBankProfile(),
    ]);
    const bankProfile = serverBank.profile;

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const totalLoans = loans.reduce((acc, curr) => acc + curr.amount, 0);
    const defaultedLoansList = loans.filter(l => l.status === 'defaulted' || l.status === 'written_off');
    const totalDefaulted = defaultedLoansList.reduce((acc, curr) => acc + curr.amount, 0);
    const npfRatio = totalLoans > 0 ? (totalDefaulted / totalLoans) * 100 : 0;

    const userCount = users.length;

    // Filter pending loans as an example
    const recentLoans = loans.slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-4 md:p-8">
            {/* Welcome & Key Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-2">
                    <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-black text-primary">
                        <span>Active White-Label: {bankProfile.legalName}</span>
                        <span className="text-muted-foreground font-mono">({bankProfile.ussdCode})</span>
                    </div>
                    <h2 className="text-3xl font-black tracking-tight">Central Command Dashboard</h2>
                    <p className="text-muted-foreground max-w-xl">
                        Unified oversight for liquidity, risk assessment, and institutional growth across all {bankProfile.shortName} digital touchpoints.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button asChild variant="outline" className="font-bold rounded-xl">
                        <Link href="/settings/bank-profiles">Swap Bank Profile</Link>
                    </Button>
                    <Button asChild variant="outline" className="font-bold rounded-xl">
                        <Link href="/" target="_blank">Preview Public Site</Link>
                    </Button>
                    <UpdateLiveSiteButton />
                </div>
            </div>

            {/* Active Suite Modules Telemetry Bar */}
            <div className="rounded-2xl border border-border bg-card/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted-foreground mr-1">
                        Active Suite Modules:
                    </span>
                    {BANK_MODULE_DEFINITIONS.map((m) => {
                        const enabled = bankProfile.enabledModules[m.key];
                        return (
                            <Badge
                                key={m.key}
                                variant={enabled ? "secondary" : "outline"}
                                className={`text-[10px] font-bold ${
                                    enabled
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : "text-muted-foreground/60 line-through"
                                }`}
                            >
                                {m.label}
                            </Badge>
                        );
                    })}
                </div>
                <Link
                    href="/settings/bank-profiles"
                    className="text-xs font-black text-primary hover:underline shrink-0"
                >
                    Configure Modules &rarr;
                </Link>
            </div>

            {/* Metric Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <Card className="bg-card border-border p-6 rounded-2xl hover:border-primary/30 transition-all group shadow-sm bg-gradient-to-b from-card to-background">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-sm font-medium">Total Liquidity</span>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Wallet className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold mb-1 tracking-tight">₦{(totalBalance).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />+2.4%
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-wider">vs last month</span>
                    </div>
                </Card>

                <Card className="bg-card border-border p-6 rounded-2xl hover:border-primary/30 transition-all group shadow-sm bg-gradient-to-b from-card to-background">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-sm font-medium">Active Portfolio</span>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <FileText className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold mb-1 tracking-tight">₦{(totalLoans).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />+5.1%
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-wider">Growth Trend</span>
                    </div>
                </Card>

                <Card className="bg-card border-border p-6 rounded-2xl hover:border-primary/30 transition-all group shadow-sm bg-gradient-to-b from-card to-background">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-sm font-medium">User Base</span>
                        <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold mb-1 tracking-tight">{(userCount).toLocaleString()}</p>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <TrendingUp className="h-4 w-4" />+12.5%
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-wider">Daily Active</span>
                    </div>
                </Card>

                <Card className="bg-card border-border p-6 rounded-2xl hover:border-primary/30 transition-all group shadow-sm bg-gradient-to-b from-card to-background">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-muted-foreground text-sm font-medium">Risk Exposure</span>
                        <div className="p-2 rounded-lg bg-destructive/10 text-destructive group-hover:scale-110 transition-transform">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold mb-1 tracking-tight">{npfRatio.toFixed(2)}%</p>
                    <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold flex items-center gap-1 ${npfRatio > 5 ? 'text-destructive' : 'text-emerald-500'}`}>
                            {npfRatio > 5 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            {npfRatio > 5 ? 'High Risk' : 'Healthy'}
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-wider">NPF Ratio</span>
                    </div>
                </Card>
            </div>

            {/* Automation Hub Quick Access */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Link href="/endpoints" className="block group">
                    <Card className="bg-primary/5 border-primary/20 p-6 rounded-2xl flex items-center justify-between hover:bg-primary/10 transition-all cursor-pointer shadow-none">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-primary text-primary-foreground group-hover:scale-110 transition-transform">
                                <TrendingUp className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">API Endpoints</h3>
                                <p className="text-sm text-muted-foreground">Manage dynamic integrations and vendor specifications.</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="h-5 w-5" />
                         </Button>
                    </Card>
                </Link>
                <Link href="/workflows" className="block group">
                    <Card className="bg-secondary/5 border-secondary/20 p-6 rounded-2xl flex items-center justify-between hover:bg-secondary/10 transition-all cursor-pointer shadow-none">
                         <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-secondary text-secondary-foreground group-hover:scale-110 transition-transform">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-foreground">Automation Workflows</h3>
                                <p className="text-sm text-muted-foreground">Orchestrate banking logic with declarative SDL.</p>
                            </div>
                         </div>
                         <Button variant="ghost" size="icon" className="group-hover:translate-x-1 transition-transform">
                            <ArrowRight className="h-5 w-5" />
                         </Button>
                    </Card>
                </Link>
                {/* Quick links to new product pages */}
                <Link href="/settings/product/types" className="block group">
                    <Card className="bg-muted/30 border-border p-4 rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all cursor-pointer shadow-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-background text-primary">
                                <FileText className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Product Types</h3>
                                <p className="text-xs text-muted-foreground">Manage catalog and publish product types.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Card>
                </Link>
                <Link href="/services" className="block group">
                    <Card className="bg-muted/30 border-border p-4 rounded-2xl flex items-center justify-between hover:bg-muted/50 transition-all cursor-pointer shadow-none">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-background text-primary">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm text-foreground">Services Hub</h3>
                                <p className="text-xs text-muted-foreground">Configure service forms and intents.</p>
                            </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                    </Card>
                </Link>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Table and Analytics */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Performance Chart Area */}
                    <VolumeChart transactions={transactions} />

                    {/* Loan Management Table */}
                    <Card className="bg-card border-border rounded-2xl overflow-hidden shadow-sm">
                        <div className="p-6 border-b flex items-center justify-between">
                            <h3 className="text-lg font-bold">Recent Loan Applications</h3>
                            <button className="text-xs font-bold text-primary hover:underline">View All Records</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/30">
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Applicant</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Product</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {recentLoans.map((loan, idx) => {
                                        const loanUser = users.find(u => String(u.id) === String(loan.user_id));
                                        const displayName = loanUser?.email?.split('@')[0] || `User ${loan.user_id.slice(0, 4)}`;
                                        const initial = displayName.charAt(0).toUpperCase();

                                        return (
                                            <tr key={loan.id} className="hover:bg-muted/20 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground uppercase">
                                                            {initial}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold">{displayName}</p>
                                                            <p className="text-[10px] text-muted-foreground">ID: #{loan.id.slice(0, 6)}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-medium text-muted-foreground italic">
                                                        {products.find(p => String(p.id) === String(loan.product_type_id))?.name || 'Unknown Loan'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-bold">₦{loan.amount.toLocaleString()}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${loan.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                        loan.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                            'bg-primary/10 text-primary border-primary/20'
                                                        }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Quick Commands & Status */}
                <div className="space-y-8">

                    <QuickCommandWidget />

                    {/* Site Health Card */}
                    <Card className="bg-muted/30 border-border rounded-2xl p-6 shadow-sm">
                        <h3 className="text-md font-bold mb-6">Platform Health</h3>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium">Transaction API</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-500">Operational</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-emerald-500" />
                                    <span className="text-sm font-medium">Auth Service</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-500">Operational</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-2 rounded-full bg-primary animate-pulse" />
                                    <span className="text-sm font-medium">SMS Gateway</span>
                                </div>
                                <span className="text-xs font-bold text-primary">Latency Alert</span>
                            </div>

                            <div className="pt-4 border-t border-border/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-muted-foreground">Monthly Target Progress</span>
                                    <span className="text-xs font-bold">84%</span>
                                </div>
                                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-primary w-[84%] rounded-full shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                </div>
                            </div>
                        </div>
                    </Card>

                </div>
            </div>
        </div>
    );
}

export default function DashboardOverview() {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-8">Loading dashboard overview...</div>}>
            <DashboardOverviewContent />
        </Suspense>
    );
}
