import { dashboardApi } from "@/lib/dashboard-api/api";
import {
    UploadCloud,
    Wallet,
    TrendingUp,
    TrendingDown,
    FileText,
    Users,
    AlertTriangle,
    MoreVertical,
    Edit3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardOverview() {
    const accounts = await dashboardApi.getAllAccounts();
    const loans = await dashboardApi.getAllLoans();
    const transactions = await dashboardApi.getAllTransactions();
    const users = await dashboardApi.getAllUsers();

    const totalBalance = accounts.reduce((acc, curr) => acc + curr.balance, 0);
    const totalLoans = loans.reduce((acc, curr) => acc + curr.amount, 0);
    const userCount = users.length;

    // Filter pending loans as an example
    const recentLoans = loans.slice(0, 3);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Welcome & Key Stats */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black tracking-tight mb-2">Central Command Dashboard</h2>
                    <p className="text-muted-foreground max-w-xl">
                        Unified oversight for liquidity, risk assessment, and institutional growth across all digital touchpoints.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button className="font-bold shadow-lg shadow-primary/20 flex items-center gap-2 px-6">
                        <UploadCloud className="h-5 w-5" />
                        Update Live Site
                    </Button>
                </div>
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
                    <p className="text-3xl font-bold mb-1 tracking-tight">₦{(totalBalance + 4200000000).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}</p>
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
                    <p className="text-3xl font-bold mb-1 tracking-tight">₦{(totalLoans + 1820000000).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}</p>
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
                    <p className="text-3xl font-bold mb-1 tracking-tight">{(userCount + 12500).toLocaleString()}</p>
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
                    <p className="text-3xl font-bold mb-1 tracking-tight">0.82%</p>
                    <div className="flex items-center gap-2">
                        <span className="text-emerald-500 text-xs font-bold flex items-center gap-1">
                            <TrendingDown className="h-4 w-4" />-0.12%
                        </span>
                        <span className="text-muted-foreground/60 text-[10px] uppercase font-bold tracking-wider">NPF Ratio</span>
                    </div>
                </Card>
            </div>

            {/* Main Grid Layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left Column: Table and Analytics */}
                <div className="xl:col-span-2 space-y-8">

                    {/* Performance Chart Area */}
                    <Card className="bg-card border-border rounded-2xl overflow-hidden p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-lg font-bold">Bank Volume Analytics</h3>
                                <p className="text-sm text-muted-foreground">Monthly transaction volume across all digital channels</p>
                            </div>
                            <div className="flex bg-muted/50 p-1 rounded-lg border">
                                <button className="px-4 py-1.5 text-xs font-bold text-primary bg-primary/10 rounded-md">7 Days</button>
                                <button className="px-4 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">30 Days</button>
                            </div>
                        </div>

                        {/* SVG Chart Simulation */}
                        <div className="relative h-[240px] w-full">
                            <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 800 240">
                                <defs>
                                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                    </linearGradient>
                                </defs>
                                <path d="M0,180 Q100,160 200,190 T400,140 T600,100 T800,80 V240 H0 Z" fill="url(#chartGradient)" />
                                <path d="M0,180 Q100,160 200,190 T400,140 T600,100 T800,80" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth="3" />
                                {/* Points */}
                                <circle cx="200" cy="190" fill="hsl(var(--primary))" r="4" />
                                <circle cx="400" cy="140" fill="hsl(var(--primary))" r="4" />
                                <circle cx="600" cy="100" fill="hsl(var(--primary))" r="4" />
                                <circle cx="800" cy="80" fill="hsl(var(--primary))" r="4" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                <div className="border-b border-border/50 w-full" />
                                <div className="border-b border-border/50 w-full" />
                                <div className="border-b border-border/50 w-full" />
                                <div className="border-b border-border/50 w-full" />
                                <div className="w-full" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between mt-4 px-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">January</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">March</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">May</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">July</span>
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Today</span>
                        </div>
                    </Card>

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
                                    {recentLoans.map((loan, idx) => (
                                        <tr key={loan.id} className="hover:bg-muted/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-8 rounded bg-muted flex items-center justify-center font-bold text-xs text-muted-foreground">
                                                        U{idx}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold">User {loan.user_id.slice(0, 4)}</p>
                                                        <p className="text-[10px] text-muted-foreground">ID: #{loan.id.slice(0, 6)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-medium text-muted-foreground italic">Business Loan</span>
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
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </div>

                {/* Right Column: Quick Commands & Status */}
                <div className="space-y-8">

                    {/* Quick Command Widget */}
                    <Card className="bg-card border-border rounded-2xl p-6 relative overflow-hidden shadow-[0_0_15px_rgba(var(--primary),0.05)] border-primary/20">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Edit3 className="h-24 w-24 text-primary rotate-12" />
                        </div>
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 relative z-10">
                            <Edit3 className="text-primary h-5 w-5" />
                            Quick Command
                        </h3>

                        <div className="space-y-5 relative z-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hero Banner Headline</label>
                                <input
                                    className="w-full bg-background border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                                    type="text"
                                    defaultValue="Secure Your Future with AbiaSMEMFB"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Call to Action Link</label>
                                <input
                                    className="w-full bg-background border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                                    type="text"
                                    defaultValue="AbiaSMEMFB.com/apply-now"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Site Status Message</label>
                                <textarea
                                    className="w-full bg-background border-border rounded-lg px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                                    rows={2}
                                    defaultValue="Our interest rates just dropped! Explore the new SME loan offers today."
                                />
                            </div>
                            <Button className="w-full bg-primary/10 border border-primary/30 text-primary py-3 rounded-xl font-bold text-sm hover:bg-primary/20 transition-all shadow-none">
                                Publish Updates
                            </Button>
                        </div>
                    </Card>

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
