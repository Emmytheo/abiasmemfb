import Link from "next/link";
import {
    Eye,
    TrendingUp,
    BarChart3,
    CreditCard,
    Send,
    Receipt,
    PiggyBank,
    ArrowDownLeft,
    ArrowUpRight,
    Zap,
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ClientDashboard() {
    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-muted-foreground text-lg font-medium">Good evening, Alex</h2>
                    <h3 className="text-5xl font-black tracking-tight mt-1">Dashboard</h3>
                </div>
                <div className="flex items-end gap-10">
                    <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">Total Portfolio Value</p>
                        <div className="flex items-center md:justify-end gap-3">
                            <span className="text-4xl font-light text-primary">₦</span>
                            <span className="text-5xl font-bold tracking-tighter">14,248,500.00</span>
                            <Eye className="h-6 w-6 text-muted-foreground cursor-pointer hover:text-primary transition-colors ml-2" />
                        </div>
                    </div>
                </div>
            </header>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-xl border hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <WalletIcon className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> 2.4%
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Liquidity Ratio</p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">₦4,200,000</p>
                </div>

                <div className="bg-card p-6 rounded-xl border hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <BarChart3 className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" /> 12.8%
                        </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Investment Yield</p>
                    <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-500">+₦1,120,450</p>
                </div>

                <div className="bg-card p-6 rounded-xl border hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">Current</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Available Credit</p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">₦8,500,000</p>
                </div>
            </div>

            {/* Financial Growth Section */}
            <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xl font-bold tracking-tight">Financial Growth</h4>
                        <p className="text-sm text-muted-foreground">Portfolio performance over the last 6 months</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="default" size="sm" className="h-8 text-xs font-bold">6M</Button>
                        <Button variant="secondary" size="sm" className="h-8 text-xs font-bold text-muted-foreground bg-accent">1Y</Button>
                        <Button variant="secondary" size="sm" className="h-8 text-xs font-bold text-muted-foreground bg-accent">ALL</Button>
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <div className="relative h-64 w-full">
                        <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 1000 200">
                            <defs>
                                <linearGradient id="chartGradientClient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d="M0,180 Q100,160 200,170 T400,120 T600,130 T800,40 T1000,60 L1000,200 L0,200 Z" fill="url(#chartGradientClient)" />
                            <path d="M0,180 Q100,160 200,170 T400,120 T600,130 T800,40 T1000,60" fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth="4" />
                            <circle cx="200" cy="170" fill="hsl(var(--primary))" r="4" />
                            <circle cx="400" cy="120" fill="hsl(var(--primary))" r="4" />
                            <circle cx="600" cy="130" fill="hsl(var(--primary))" r="4" />
                            <circle cx="800" cy="40" fill="hsl(var(--primary))" r="6" className="animate-pulse origin-center" />
                        </svg>
                    </div>
                    <div className="flex justify-between mt-6 px-2">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Jan</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Feb</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Mar</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Apr</span>
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">May</span>
                        <span className="text-xs font-bold text-primary uppercase tracking-widest">Jun</span>
                    </div>
                </div>
            </div>

            {/* Lower Section: Actions & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <h4 className="text-xl font-bold tracking-tight">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-4">

                        <button className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm">
                            <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                <Send className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold">Transfer Funds</p>
                                <p className="text-xs text-muted-foreground">Local and international</p>
                            </div>
                        </button>

                        <button className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm">
                            <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold">Pay Bills</p>
                                <p className="text-xs text-muted-foreground">Utilities, tax, and more</p>
                            </div>
                        </button>

                        <button className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm">
                            <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                <PiggyBank className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold">Apply for Loan</p>
                                <p className="text-xs text-muted-foreground">Instant wealth credit</p>
                            </div>
                        </button>

                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold tracking-tight">Recent Activity</h4>
                        <Link href="/client/activity" className="text-xs font-bold text-primary hover:underline">
                            View All
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border divide-y shadow-sm">

                        <div className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <ArrowDownLeft className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Portfolio Dividend</p>
                                    <p className="text-xs text-muted-foreground">June 14, 2024</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-emerald-500">+₦124,000.00</p>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-500/10 text-muted-foreground flex items-center justify-center shrink-0">
                                    <ShoppingBag className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Luxury Auto Leasing</p>
                                    <p className="text-xs text-muted-foreground">June 12, 2024</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold">-₦450,000.00</p>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                    <ArrowDownLeft className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Inward Wire Transfer</p>
                                    <p className="text-xs text-muted-foreground">June 10, 2024</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold text-emerald-500">+₦2,500,000.00</p>
                        </div>

                        <div className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="size-10 rounded-full bg-slate-500/10 text-muted-foreground flex items-center justify-center shrink-0">
                                    <Zap className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-sm font-bold">Utility Payment - SmartHome</p>
                                    <p className="text-xs text-muted-foreground">June 08, 2024</p>
                                </div>
                            </div>
                            <p className="text-sm font-bold">-₦25,400.00</p>
                        </div>

                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="p-10 text-center border-t border-border mt-10">
                <p className="text-xs text-muted-foreground font-medium">© 2024 Abia Microfinance Bank PLC. Licensed by the Central Bank of Nigeria.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Security</Link>
                </div>
            </footer>
        </div>
    );
}

function WalletIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a8 8 0 0 1-5 7.59l-9.74-1.51A2 2 0 0 1 2 19V9a2 2 0 0 1 2-2h15Z" />
            <path d="M22 10v6" />
        </svg>
    )
}
