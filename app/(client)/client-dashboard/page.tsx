"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
    Eye,
    TrendingUp,
    BarChart3,
    CreditCard,
    Send,
    Receipt,
    PiggyBank,
    ArrowDownLeft,
    Zap,
    ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, Account, Loan, Transaction, User } from "@/lib/api";

export default function ClientDashboard() {
    const [user, setUser] = useState<User | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState<'6M' | '1Y' | 'ALL'>('6M');

    useEffect(() => {
        async function loadData() {
            try {
                const [userData, accountsData, loansData, txsData] = await Promise.all([
                    api.getCurrentUser(),
                    api.getAllAccounts(),
                    api.getAllLoans(),
                    api.getAllTransactions()
                ]);
                setUser(userData);
                setAccounts(accountsData);
                setLoans(loansData);
                setTransactions(txsData.slice(0, 4)); // Only top 4 recent
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const totalLiquidity = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    // Mock values for visual layout, using actual dynamic bases
    const investmentYield = 1120450;
    const availableCredit = 8500000;
    const portfolioValue = totalLiquidity + investmentYield + availableCredit;

    const chartData = useMemo(() => {
        const months = timeframe === '6M' ? 6 : timeframe === '1Y' ? 12 : 24;
        const now = new Date();
        const dataPoints = Array(months).fill(0);
        const labels: string[] = [];

        for (let i = 0; i < months; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
            labels.push(d.toLocaleDateString(undefined, { month: 'short' }));
        }

        let currentIterativeValue = portfolioValue || 1000000;

        for (let i = months - 1; i >= 0; i--) {
            dataPoints[i] = currentIterativeValue;
            // Go back in time: previous month was slightly less (growth of 0.5% to 3.5% per month randomly)
            const growthFactor = 1 + (Math.random() * 0.03 + 0.005);
            currentIterativeValue = currentIterativeValue / growthFactor;
        }

        return { points: dataPoints, labels };

    }, [timeframe, portfolioValue]);

    const { chartPath, chartFill, chartPoints } = useMemo(() => {
        const width = 1000;
        const height = 200;
        const { points } = chartData;
        const min = Math.min(...points) * 0.95;
        const max = Math.max(...points) * 1.02;
        const range = max - min || 1;

        const pts = points.map((val, i) => {
            const x = (i / (points.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return { x, y: Math.max(10, Math.min(height - 10, y)), value: val };
        });

        const pathStr = pts.map((pt, i) => {
            if (i === 0) return `M ${pt.x},${pt.y}`;
            const prev = pts[i - 1];
            const cp1x = prev.x + (pt.x - prev.x) / 2;
            const cp1y = prev.y;
            const cp2x = prev.x + (pt.x - prev.x) / 2;
            const cp2y = pt.y;
            return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
        }).join(' ');

        return {
            chartPath: pathStr,
            chartFill: `${pathStr} L ${width},${height} L 0,${height} Z`,
            chartPoints: pts
        };

    }, [chartData]);

    const displayLabels = useMemo(() => {
        const maxLabels = 6;
        const result = [];
        const step = Math.max(1, Math.floor((chartData.labels.length - 1) / (maxLabels - 1)));
        for (let i = 0; i < maxLabels - 1; i++) {
            result.push(chartData.labels[i * step]);
        }
        result.push(chartData.labels[chartData.labels.length - 1]);
        return result;
    }, [chartData.labels]);

    if (loading) {
        return <div className="max-w-6xl mx-auto p-10 flex justify-center text-muted-foreground">Loading dashboard...</div>;
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-muted-foreground text-lg font-medium">Good evening, {user?.full_name?.split(' ')[0] || 'User'}</h2>
                    <h3 className="text-5xl font-black tracking-tight mt-1">Dashboard</h3>
                </div>
                <div className="flex items-end gap-10">
                    <div className="text-left md:text-right w-full md:w-auto">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">Total Portfolio Value</p>
                        <div className="flex items-center md:justify-end gap-3">
                            <span className="text-4xl font-light text-primary">₦</span>
                            <span className="text-5xl font-bold tracking-tighter">{portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
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
                    <p className="text-2xl font-bold mt-1 tracking-tight">₦{totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 0 })}</p>
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
                    <p className="text-2xl font-bold mt-1 tracking-tight text-emerald-500">+₦{investmentYield.toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border hover:shadow-[0_0_15px_rgba(var(--primary),0.15)] transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">Current</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium">Available Credit</p>
                    <p className="text-2xl font-bold mt-1 tracking-tight">₦{availableCredit.toLocaleString()}</p>
                </div>
            </div>

            {/* Financial Growth Section */}
            <div className="bg-card rounded-2xl border overflow-hidden shadow-sm">
                <div className="p-6 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h4 className="text-xl font-bold tracking-tight">Financial Growth</h4>
                        <p className="text-sm text-muted-foreground">Portfolio performance over the last {timeframe === '6M' ? '6 months' : timeframe === '1Y' ? 'year' : '2 years'}</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={timeframe === '6M' ? 'default' : 'secondary'} onClick={() => setTimeframe('6M')} size="sm" className={`h-8 text-xs font-bold ${timeframe !== '6M' && 'text-muted-foreground bg-accent'}`}>6M</Button>
                        <Button variant={timeframe === '1Y' ? 'default' : 'secondary'} onClick={() => setTimeframe('1Y')} size="sm" className={`h-8 text-xs font-bold ${timeframe !== '1Y' && 'text-muted-foreground bg-accent'}`}>1Y</Button>
                        <Button variant={timeframe === 'ALL' ? 'default' : 'secondary'} onClick={() => setTimeframe('ALL')} size="sm" className={`h-8 text-xs font-bold ${timeframe !== 'ALL' && 'text-muted-foreground bg-accent'}`}>ALL</Button>
                    </div>
                </div>
                <div className="p-6 md:p-8">
                    <div className="relative h-64 w-full">
                        <svg className="w-full h-full" overflow="visible" preserveAspectRatio="none" viewBox="0 0 1000 200">
                            <defs>
                                <linearGradient id="chartGradientClient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={chartFill} fill="url(#chartGradientClient)" />
                            <path d={chartPath} fill="none" stroke="hsl(var(--primary))" strokeLinecap="round" strokeWidth="4" />
                            {chartPoints.map((pt, i) => (
                                <circle key={i} cx={pt.x} cy={pt.y} fill="hsl(var(--primary))" r={i === chartPoints.length - 1 ? "6" : "4"} className={i === chartPoints.length - 1 ? "animate-pulse origin-center shadow-[0_0_10px_rgba(var(--primary),0.8)]" : ""} />
                            ))}
                        </svg>
                    </div>
                    <div className="flex justify-between mt-6 px-2">
                        {displayLabels.map((lbl, i) => (
                            <span key={i} className={`text-[10px] sm:text-xs font-bold uppercase tracking-widest ${i === displayLabels.length - 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                                {lbl}
                            </span>
                        ))}
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
                        <Link href="/client/my-services" className="text-xs font-bold text-primary hover:underline">
                            View All
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border divide-y shadow-sm">
                        {transactions.map(tx => (
                            <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-500/10 text-muted-foreground'}`}>
                                        {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold">{tx.category}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <p className={`text-sm font-bold ${tx.type === 'credit' ? 'text-emerald-500' : ''}`}>
                                    {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        ))}
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
