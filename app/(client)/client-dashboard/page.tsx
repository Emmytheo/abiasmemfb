"use client";

import Link from "next/link";
import { useEffect, useState, useMemo } from "react";
import {
    Eye,
    EyeOff,
    TrendingUp,
    BarChart3,
    CreditCard,
    Send,
    Receipt,
    PiggyBank,
    ArrowDownLeft,
    ShoppingBag,
    FileText,
    RefreshCw,
    Lock,
    UserCheck,
    Sparkles,
    Wallet,
    SparklesIcon,
    Users,
    Building2,
    Key,
    DollarSign,
    Plus,
    Activity,
    Code,
    CheckCircle2,
    Info,
    Calendar,
    ChevronRight,
    ArrowRight,
    Copy,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, Account, Loan, Transaction, User, ProductApplication, ServiceCategory, Customer } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useScope } from "@/context/scope-context";
import { useBankProfile } from "@/context/bank-profile-context";

export default function ClientDashboard() {
    const { activeScopeId, activeScope } = useScope();
    const { activeProfile } = useBankProfile();
    const [user, setUser] = useState<User | null>(null);
    const [categories, setCategories] = useState<ServiceCategory[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [applications, setApplications] = useState<ProductApplication[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [timeframe, setTimeframe] = useState<'6M' | '1Y' | 'ALL'>('6M');
    const [isMounted, setIsMounted] = useState(false);
    const [showBalance, setShowBalance] = useState(true);
    const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

    const copyAccountNumber = (accNum: string) => {
        navigator.clipboard.writeText(accNum);
        setCopiedAccount(accNum);
        toast.success(`Copied account number ${accNum}`);
        setTimeout(() => setCopiedAccount(null), 1800);
    };

    // Live multi-scope operational overview from Postgres (/api/client/overview)
    const [overview, setOverview] = useState<any>(null);

    // Cooperative Member Lookup states
    const [memberAccountQuery, setMemberAccountQuery] = useState("");
    const [validatedMember, setValidatedMember] = useState<{ accountName: string; accountNumber: string; kycStatus?: string } | null>(null);
    const [memberLookupError, setMemberLookupError] = useState<string | null>(null);
    const [isValidatingMember, setIsValidatingMember] = useState(false);
    const [coopActiveCycleTab, setCoopActiveCycleTab] = useState(0);

    const loadOverview = async () => {
        try {
            const res = await fetch("/api/client/overview", { cache: "no-store" });
            if (res.ok) {
                const json = await res.json();
                if (json.success) setOverview(json);
            }
        } catch (err) {
            console.error("Failed to fetch multi-scope overview:", err);
        }
    };

    useEffect(() => {
        setIsMounted(true);
        async function loadData() {
            try {
                // Get user directly from Supabase auth (api.getCurrentUser returns null in Payload adapter)
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (!supaUser) return;

                // Construct a User-like object from Supabase auth data
                const currentUser: User = {
                    id: supaUser.id,
                    email: supaUser.email || '',
                    full_name: supaUser.user_metadata?.full_name || supaUser.user_metadata?.name || supaUser.email?.split('@')[0] || 'User',
                    role: supaUser.user_metadata?.role || 'user',
                    created_at: supaUser.created_at || new Date().toISOString(),
                };

                const [accountsData, loansData, txsData, appsData, catsData, customerProfile] = await Promise.all([
                    api.getUserAccounts(currentUser.id).catch(() => []),
                    api.getUserLoans(currentUser.id).catch(() => []),
                    api.getUserTransactions(currentUser.id).catch(() => []),
                    api.getUserApplications(currentUser.id).catch(() => []),
                    api.getServiceCategories().catch(() => []),
                    api.getCustomerBySupabaseId(currentUser.id).catch(() => null),
                    loadOverview(),
                ]);
                setUser(currentUser);
                setCustomer(customerProfile);
                setCategories(catsData);
                setAccounts(accountsData);
                setLoans(loansData);
                setApplications(appsData);
                setTransactions(txsData.slice(0, 4));
            } catch (err) {
                console.error("Dashboard data load error:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const totalLiquidity = accounts.reduce((sum, acc) => sum + acc.balance, 0);
    const availableCredit = loans.reduce((sum, loan) => sum + loan.amount, 0);
    const investmentYield = 0; // Keeping 0 for now until investments are built
    const portfolioValue = totalLiquidity + investmentYield + availableCredit;

    const chartData = useMemo(() => {
        const monthsCount = timeframe === '6M' ? 6 : timeframe === '1Y' ? 12 : 24;
        const now = isMounted ? new Date() : new Date();
        const labels: string[] = [];
        const dataPoints = Array(monthsCount).fill(0);

        // Create month labels
        for (let i = 0; i < monthsCount; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - (monthsCount - 1 - i), 1);
            labels.push(d.toLocaleDateString(undefined, { month: 'short' }));
        }

        if (!isMounted || transactions.length === 0) {
            return { points: dataPoints, labels, isEmpty: true };
        }

        // Calculate historical balance
        // We start with current portfolio value and work backwards
        let runningValue = portfolioValue;
        const sortedTxs = [...transactions].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        
        const monthBuckets = Array(monthsCount).fill(0).map((_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            return {
                start: new Date(d.getFullYear(), d.getMonth(), 1).getTime(),
                end: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime(),
                index: monthsCount - 1 - i
            };
        });

        // Current month starts with current value
        dataPoints[monthsCount - 1] = runningValue;

        let txIndex = 0;
        for (let i = monthsCount - 1; i >= 0; i--) {
            const bucket = monthBuckets[monthsCount - 1 - i];
            
            // Subtract/Add transactions that happened AFTER this month's start to find PREVIOUS month's end value
            while (txIndex < sortedTxs.length) {
                const txDate = new Date(sortedTxs[txIndex].created_at).getTime();
                if (txDate < bucket.start) break;

                // If it was a credit (+), we subtract it to go back in time
                // If it was a debit (-), we add it back.
                if (sortedTxs[txIndex].type === 'credit') {
                    runningValue -= sortedTxs[txIndex].amount;
                } else {
                    runningValue += sortedTxs[txIndex].amount;
                }
                txIndex++;
            }
            
            if (i > 0) {
                dataPoints[i - 1] = Math.max(0, runningValue);
            }
        }

        return { points: dataPoints, labels, isEmpty: false };

    }, [timeframe, portfolioValue, isMounted, transactions]);

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

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    }, []);

    // Live Core Ledger Member Lookup Validation
    const handleValidateMember = async (e: React.FormEvent) => {
        e.preventDefault();
        const query = memberAccountQuery.trim();
        if (!query) return;
        setIsValidatingMember(true);
        setValidatedMember(null);
        setMemberLookupError(null);
        try {
            const res = await fetch(`/api/account-lookup?accountNumber=${encodeURIComponent(query)}`);
            const data = await res.json();
            if (!res.ok || !data.accountName) {
                setMemberLookupError(data.error || "Account not found in core ledger.");
                toast.error(data.error || "Account does not match any registered customer.");
            } else {
                setValidatedMember({
                    accountName: data.accountName,
                    accountNumber: data.accountNumber || query,
                    kycStatus: data.kycStatus || "verified",
                });
                toast.success(`Verified: ${data.accountName}`);
            }
        } catch {
            setMemberLookupError("Unable to reach core banking directory.");
            toast.error("Account lookup failed.");
        } finally {
            setIsValidatingMember(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-10 animate-pulse">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2">
                        <div className="h-5 w-36 bg-muted rounded-md" />
                        <div className="h-10 w-52 bg-muted rounded-lg" />
                    </div>
                    <div className="h-10 w-48 bg-muted rounded-lg" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-card border rounded-xl p-6 space-y-3">
                            <div className="h-8 w-8 rounded-lg bg-muted" />
                            <div className="h-4 w-28 bg-muted rounded" />
                            <div className="h-7 w-36 bg-muted rounded" />
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="bg-muted/30 rounded-2xl h-48" />
                    <div className="lg:col-span-3 flex gap-4 overflow-hidden">
                        {[...Array(2)].map((_, i) => (
                            <div key={i} className="min-w-[280px] bg-muted/20 rounded-xl h-36" />
                        ))}
                    </div>
                </div>
                <div className="bg-card border rounded-2xl h-72" />
            </div>
        );
    }

    // Render Business/Merchant Dashboard (100% live from /api/client/overview)
    if (activeScope.type === "business") {
        const biz = overview?.business || {};
        const bizInvoices: any[] = biz.invoices || [];
        const bizTerminals: any[] = biz.terminals || [];
        const recentOutbound: any[] = biz.recentOutbound || [];
        const totalRevenueNaira = Number(biz.settledRevenueKobo || 0) / 100;
        const unpaidInvoices = bizInvoices.filter((i: any) => i.status === "unpaid" || i.status === "overdue");
        const unpaidSumNaira = unpaidInvoices.reduce((s: number, i: any) => s + Number(i.amount_kobo || 0), 0) / 100;
        const payrollDisbursedNaira = Number(biz.payrollTotalDisbursedKobo || 0) / 100;

        return (
            <div className="max-w-7xl mx-auto p-1 md:p-10 space-y-10 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-muted-foreground text-base md:text-lg font-medium">{greeting}, {biz.merchant?.business_name || activeScope.name}</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight mt-1 bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Business Hub</h3>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">Settled Merchant Revenue</p>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-foreground">
                            ₦{totalRevenueNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </header>

                {/* SME KPI Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] uppercase">{biz.checkoutCount || 0} Checkouts</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">SME Settled Volume</p>
                        <p className="text-2xl font-black mt-1 tracking-tight">₦{totalRevenueNaira.toLocaleString()}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-rose-500/10 rounded-xl text-rose-500">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="bg-rose-50 text-rose-600 border-rose-200 text-[10px] uppercase">{unpaidInvoices.length} Pending</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Unpaid Invoices</p>
                        <p className="text-2xl font-black mt-1 tracking-tight text-rose-600">₦{unpaidSumNaira.toLocaleString()}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                                <Activity className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px]">{bizTerminals.length} Assigned</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active POS Fleet</p>
                        <p className="text-2xl font-black mt-1 tracking-tight">
                            {bizTerminals.filter((t: any) => t.status === "active").length} Online
                        </p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] text-emerald-500 font-bold uppercase">{biz.payrollBatchCount || 0} Batches</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Payroll Disbursed</p>
                        <p className="text-xl font-bold mt-1 tracking-tight">₦{payrollDisbursedNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                            <div className="flex justify-between items-center border-b pb-4">
                                <div>
                                    <h3 className="text-lg font-black flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Invoice Billing Ledger</h3>
                                    <p className="text-xs text-muted-foreground font-semibold">Persisted SME invoices tracked in PostgreSQL.</p>
                                </div>
                                <Button asChild size="sm" className="h-9 font-bold bg-primary text-primary-foreground flex items-center gap-1.5 shadow-none rounded-xl">
                                    <Link href="/client-dashboard/invoices">Manage Invoices <ArrowRight className="h-3 w-3 ml-1" /></Link>
                                </Button>
                            </div>

                            {bizInvoices.length === 0 ? (
                                <div className="py-10 text-center text-xs text-muted-foreground">
                                    No invoices issued yet. Create your first customer invoice from the Invoices page.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {bizInvoices.slice(0, 6).map((inv: any) => (
                                        <div key={inv.id} className="py-4 first:pt-0 last:pb-0 flex justify-between items-center text-sm font-semibold">
                                            <div>
                                                <p className="font-extrabold text-foreground">{inv.client_name}</p>
                                                <p className="text-[11px] text-muted-foreground font-mono">
                                                    {inv.invoice_number} • Due {inv.due_date ? new Date(inv.due_date).toLocaleDateString() : "On Receipt"}
                                                </p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="font-black text-foreground">₦{(Number(inv.amount_kobo || 0) / 100).toLocaleString()}</p>
                                                <Badge variant="outline" className={`text-[9px] uppercase ${inv.status === "paid" ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-amber-50 text-amber-600 border-amber-100"}`}>
                                                    {inv.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border rounded-2xl p-6 space-y-4 shadow-sm">
                            <h3 className="text-lg font-black flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /> Corporate Remittances</h3>
                            <p className="text-xs text-muted-foreground font-semibold">Latest verified outbound ledger transfers.</p>
                            <div className="space-y-3 pt-1">
                                {recentOutbound.length === 0 ? (
                                    <p className="text-xs text-muted-foreground py-4 text-center">No outbound transfers recorded yet.</p>
                                ) : (
                                    recentOutbound.map((tx: any) => (
                                        <div key={tx.id} className="flex justify-between items-center text-xs font-semibold border-b pb-2 last:border-0">
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-foreground truncate">{tx.narration || tx.reference}</p>
                                                <p className="text-[10px] text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                            <p className="font-black text-rose-600 shrink-0">-₦{(Number(tx.amount || 0) / 100).toLocaleString()}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                            <Button variant="outline" className="w-full font-bold h-10 shadow-none border-primary/20 text-primary hover:bg-primary/5 rounded-xl" asChild>
                                <Link href="/client-dashboard/transfers">Initiate New Transfer</Link>
                            </Button>
                        </div>

                        <div className="bg-card border rounded-2xl p-6 space-y-3 shadow-sm">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Quick Merchant Tools</h3>
                            <div className="grid grid-cols-1 gap-2">
                                <Button variant="outline" className="justify-between rounded-xl font-bold h-10" asChild>
                                    <Link href="/merchant"><span>API Keys &amp; Webhooks</span><ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="outline" className="justify-between rounded-xl font-bold h-10" asChild>
                                    <Link href="/merchant/payroll"><span>Run Bulk Payroll</span><ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                                <Button variant="outline" className="justify-between rounded-xl font-bold h-10" asChild>
                                    <Link href="/merchant/team"><span>Manage Team Roles</span><ChevronRight className="h-4 w-4" /></Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Render Esusu/Coop Dashboard (100% live from /api/client/overview)
    if (activeScope.type === "coop") {
        const coop = overview?.cooperative || {};
        const liveCoops: any[] = coop.cooperatives || [];
        const liveCycles: any[] = coop.cycles || [];
        const membersByCycle: Record<string, string[]> = coop.membersByCycle || {};
        const livePayouts: any[] = coop.payouts || [];
        const totalUnionAssetsNaira = Number(coop.totalVaultPoolKobo || 0) / 100;
        const currentActiveCycle = liveCycles[coopActiveCycleTab] || liveCycles[0];

        return (
            <div className="max-w-7xl mx-auto p-1 md:p-10 space-y-10 animate-in fade-in duration-500">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h2 className="text-muted-foreground text-base md:text-lg font-medium">{greeting}, {activeScope.name}</h2>
                        <h3 className="text-4xl md:text-6xl font-black tracking-tight mt-1 bg-gradient-to-r from-primary via-purple-500 to-emerald-400 bg-clip-text text-transparent">Cooperative Portal</h3>
                    </div>
                    <div className="text-left md:text-right">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1">Active Holding Vault Pool</p>
                        <p className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter text-emerald-600">
                            ₦{totalUnionAssetsNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                    </div>
                </header>

                {/* Cooperative Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                                <PiggyBank className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] text-emerald-600 font-bold uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Live Pool</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Holding Vault Assets</p>
                        <p className="text-2xl font-black mt-1 tracking-tight">₦{totalUnionAssetsNaira.toLocaleString()}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                                <Users className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] font-bold">{liveCoops.length} Unions</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Registered Cooperatives</p>
                        <p className="text-lg font-black mt-1 tracking-tight truncate">{liveCoops[0]?.name || "None registered"}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-cyan-500/10 rounded-xl text-cyan-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px]">{liveCycles.length} Active</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Current Rotation Cycle</p>
                        <p className="text-lg font-bold mt-1 tracking-tight truncate">{currentActiveCycle?.name || "No active cycle"}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border transition-all">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Settled Payouts</p>
                        <p className="text-2xl font-black mt-1 tracking-tight text-emerald-500">{livePayouts.length}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Live Rotational Cycle Monitor */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                                <div>
                                    <h3 className="text-lg font-black flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Active Esusu Rotation Monitor</h3>
                                    <p className="text-xs text-muted-foreground font-semibold">Live queue directly from core Esusu tables.</p>
                                </div>
                                <div className="flex gap-1 bg-muted p-1 rounded-xl flex-wrap">
                                    {liveCycles.map((c: any, i: number) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setCoopActiveCycleTab(i)}
                                            className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-lg transition-all ${coopActiveCycleTab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                        >
                                            {String(c.name || "Cycle").split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {!currentActiveCycle ? (
                                <div className="py-10 text-center space-y-3">
                                    <p className="text-sm text-muted-foreground">No active Esusu rotational cycles found in the database.</p>
                                    <Button asChild size="sm" className="rounded-xl font-bold">
                                        <Link href="/esusu">Open Digital Esusu Hub</Link>
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Slot Contribution</p>
                                            <p className="text-xs font-black text-primary">₦{(Number(currentActiveCycle.contribution_amount || 0) / 100).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Frequency</p>
                                            <p className="text-xs font-black capitalize">{currentActiveCycle.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Vault Balance</p>
                                            <p className="text-xs font-black text-emerald-500">₦{(Number(currentActiveCycle.vault_balance_kobo || 0) / 100).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Cycle Slots</p>
                                            <p className="text-xs font-black">{currentActiveCycle.total_slots} Members</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cooperative Rotational Order</p>
                                        <div className="flex flex-wrap gap-4 items-center py-3 px-4 bg-muted/10 border rounded-xl">
                                            {(membersByCycle[String(currentActiveCycle.id)] || []).length === 0 ? (
                                                <p className="text-xs text-muted-foreground">No members enrolled in this cycle yet.</p>
                                            ) : (
                                                (membersByCycle[String(currentActiveCycle.id)] || []).map((m, slotIdx) => {
                                                    const isActive = Number(currentActiveCycle.current_payout_index) === slotIdx;
                                                    const isCompleted = slotIdx < Number(currentActiveCycle.current_payout_index);
                                                    return (
                                                        <div key={`${m}-${slotIdx}`} className="flex flex-col items-center gap-1 min-w-[75px]">
                                                            <div className={`size-10 rounded-full flex items-center justify-center font-black text-xs border-2 ${isActive ? 'bg-primary text-primary-foreground border-primary' : isCompleted ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/25' : 'bg-card text-muted-foreground border-border'}`}>
                                                                {slotIdx + 1}
                                                            </div>
                                                            <p className="text-[9px] font-bold text-foreground text-center truncate max-w-[85px]">{m}</p>
                                                            <Badge variant="outline" className={`text-[8px] scale-90 ${isActive ? 'bg-primary/10 text-primary border-primary/25' : isCompleted ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'text-muted-foreground border-border'}`}>
                                                                {isActive ? 'NEXT' : isCompleted ? 'PAID' : 'QUEUED'}
                                                            </Badge>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>

                                    <Button asChild className="w-full bg-primary text-primary-foreground font-black h-12 rounded-xl flex items-center justify-center gap-1.5">
                                        <Link href="/esusu">Open Full Esusu Contribution &amp; Cycle Hub <ArrowRight className="h-4 w-4" /></Link>
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Live Member Account Lookup + Payout History */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-lg font-black flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> Member Identity Validator</h3>
                            <p className="text-xs text-muted-foreground font-semibold">Query the live core banking directory to verify member bank accounts.</p>
                            <form onSubmit={handleValidateMember} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Client Bank Account Number</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Enter 10-digit account number"
                                        value={memberAccountQuery}
                                        onChange={(e) => setMemberAccountQuery(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-mono font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                                <Button type="submit" disabled={isValidatingMember} className="w-full h-11 font-black bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 shadow-none rounded-xl flex items-center justify-center gap-2">
                                    {isValidatingMember ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                                    {isValidatingMember ? "Verifying..." : "Query Core Ledger"}
                                </Button>
                            </form>

                            {validatedMember && (
                                <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20 flex flex-col items-center text-center gap-1">
                                    <p className="text-[10px] font-black uppercase text-emerald-600">Ledger Resolve Success</p>
                                    <p className="text-sm font-black text-foreground">{validatedMember.accountName}</p>
                                    <p className="text-[11px] font-mono text-muted-foreground">{validatedMember.accountNumber}</p>
                                </div>
                            )}
                            {memberLookupError && (
                                <div className="p-3 bg-rose-500/5 rounded-xl border border-rose-500/20 text-center text-xs font-bold text-rose-600">
                                    {memberLookupError}
                                </div>
                            )}
                        </div>

                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rotational Payout Audit Log</h3>
                            <div className="divide-y text-xs font-semibold">
                                {livePayouts.length === 0 ? (
                                    <p className="text-muted-foreground py-3 text-center">No Esusu payouts disbursed yet.</p>
                                ) : (
                                    livePayouts.slice(0, 5).map((p: any) => (
                                        <div key={p.id} className="py-2.5 flex justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="truncate font-bold">{p.cycle_name || "Esusu Cycle"}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{p.recipient}</p>
                                            </div>
                                            <span className="text-emerald-500 font-extrabold shrink-0">+₦{(Number(p.amount || 0) / 100).toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Default Personal Banking Dashboard Layout
    const primaryAccount = accounts[0];
    const heroBg = activeProfile.themeStyle?.heroBgHex || "#070D59";
    const accentHex = activeProfile.themeStyle?.accentHex || "#F4C414";

    return (
        <div className="max-w-7xl mx-auto p-1 md:p-6 space-y-8 animate-in fade-in duration-500">
            {/* Branded Executive Portfolio Hero Vault */}
            <section
                className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-white/10"
                style={{
                    background: `radial-gradient(circle at 88% 12%, ${accentHex}33 0%, transparent 45%), linear-gradient(135deg, ${heroBg} 0%, #090E24 100%)`,
                }}
            >
                <div className="absolute -right-20 -bottom-24 size-72 rounded-full blur-3xl opacity-25 pointer-events-none" style={{ backgroundColor: accentHex }} />

                <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-bold">
                                <span className={`size-1.5 rounded-full ${customer?.kyc_status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                                {greeting}, {user?.full_name?.split(' ')[0] || 'Client'}
                            </span>
                            {primaryAccount && (
                                <button
                                    type="button"
                                    onClick={() => copyAccountNumber(primaryAccount.account_number)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/25 hover:bg-black/40 border border-white/15 text-[11px] font-mono font-bold transition-colors"
                                >
                                    <span>NUBAN: {primaryAccount.account_number}</span>
                                    {copiedAccount === primaryAccount.account_number ? (
                                        <Check className="h-3 w-3 text-emerald-400" />
                                    ) : (
                                        <Copy className="h-3 w-3 opacity-75" />
                                    )}
                                </button>
                            )}
                        </div>

                        <div>
                            <p className="text-[11px] uppercase tracking-[0.2em] text-white/65 font-bold mb-1">
                                Total Portfolio Value · {activeProfile.shortName}
                            </p>
                            <div className="flex items-center gap-2.5">
                                <span className="text-2xl sm:text-3xl font-light opacity-80">₦</span>
                                <span className="text-4xl sm:text-5xl font-black tracking-tighter tabular-nums-fintech">
                                    {showBalance ? portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2 }) : "••••••••"}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setShowBalance(!showBalance)}
                                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors focus:outline-none"
                                    aria-label={showBalance ? "Hide balance" : "Show balance"}
                                >
                                    {showBalance ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        {/* One-Tap Glass Action Bar */}
                        <div className="flex flex-wrap gap-2.5 pt-1">
                            <Button asChild size="sm" className="rounded-xl font-black bg-white text-slate-950 hover:bg-white/90 h-10 px-4 shadow-lg">
                                <Link href="/pay/fund">
                                    <Plus className="h-4 w-4 mr-1.5" /> Fund Account
                                </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline" className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4">
                                <Link href="/client-dashboard/transfers">
                                    <Send className="h-3.5 w-3.5 mr-1.5" /> Transfer
                                </Link>
                            </Button>
                            {activeProfile.enabledModules.smartCards && (
                                <Button asChild size="sm" variant="outline" className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4">
                                    <Link href="/my-cards">
                                        <CreditCard className="h-3.5 w-3.5 mr-1.5" /> Smart Cards
                                    </Link>
                                </Button>
                            )}
                            {activeProfile.enabledModules.cooperativeEsusu && (
                                <Button asChild size="sm" variant="outline" className="rounded-xl font-bold bg-white/10 hover:bg-white/20 text-white border-white/20 h-10 px-4">
                                    <Link href="/esusu">
                                        <PiggyBank className="h-3.5 w-3.5 mr-1.5" /> Esusu Vault
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Right Hero Summary Pillars */}
                    <div className="grid grid-cols-3 gap-3 bg-black/25 backdrop-blur-md border border-white/15 rounded-2xl p-4 lg:min-w-[320px]">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Liquid Cash</p>
                            <p className="text-base sm:text-lg font-black tabular-nums-fintech mt-0.5">
                                {showBalance ? `₦${totalLiquidity.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}` : "•••"}
                            </p>
                        </div>
                        <div className="border-l border-white/10 pl-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Credit Line</p>
                            <p className="text-base sm:text-lg font-black tabular-nums-fintech mt-0.5">
                                {showBalance ? `₦${availableCredit.toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 1 })}` : "•••"}
                            </p>
                        </div>
                        <div className="border-l border-white/10 pl-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">Accounts</p>
                            <p className="text-base sm:text-lg font-black tabular-nums-fintech mt-0.5">
                                {accounts.length} Active
                            </p>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* Onboarding / Welcome Banner */}
            {!loading && accounts.length === 1 && accounts[0].balance === 0 && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-6 md:p-8 text-primary-foreground shadow-2xl">
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h4 className="text-2xl md:text-3xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2">
                                Welcome to the Family! <Sparkles className="h-6 w-6" />
                            </h4>
                            <p className="text-primary-foreground/80 font-medium max-w-xl">
                                Your premium account is active. Fund your account with at least ₦1,000 today to activate your virtual card and start earning 5% p.a. interest.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <Button variant="secondary" className="px-8 font-bold shadow-lg h-12" asChild>
                                <Link href="/pay/fund">Fund Now</Link>
                            </Button>
                            <Button variant="ghost" className="text-primary-foreground hover:bg-white/10 font-bold h-12">
                                Skip for now
                            </Button>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
                    <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/4 h-32 w-32 rounded-full bg-black/10 blur-2xl" />
                </div>
            )}

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary to-primary/40" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Wallet className="h-5 w-5 text-primary" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
                            {accounts.length} {accounts.length === 1 ? 'Account' : 'Accounts'}
                        </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Total Liquidity</p>
                    <p className="text-2xl font-black mt-1 tracking-tight tabular-nums-fintech">
                        {showBalance ? `₦${totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "••••••••"}
                    </p>
                </div>

                <div className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl">
                            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {applications.length} Applications
                        </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Recent Activity</p>
                    <p className="text-2xl font-black mt-1 tracking-tight tabular-nums-fintech">
                        {transactions.length} <span className="text-sm font-semibold text-muted-foreground">recent entries</span>
                    </p>
                </div>

                <div className="fintech-card p-6 relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-400" />
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-violet-500/10 rounded-xl">
                            <CreditCard className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">
                            {loans.length} Facilities
                        </Badge>
                    </div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Credit Exposure</p>
                    <p className="text-2xl font-black mt-1 tracking-tight tabular-nums-fintech">
                        {showBalance ? `₦${availableCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "••••••••"}
                    </p>
                </div>
            </div>

            {/* Banking Profile Sync Status */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-1 bg-gradient-to-br from-primary/10 to-transparent p-6 rounded-2xl border border-primary/20 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <UserCheck className="h-5 w-5 text-primary" />
                            <h4 className="font-bold">Banking Identity</h4>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">KYC Status</span>
                                <Badge 
                                    variant="outline" 
                                    className={`uppercase text-[10px] ${
                                        customer?.kyc_status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                                        customer?.kyc_status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-slate-50 text-slate-700 border-slate-200'
                                    }`}
                                >
                                    {customer?.kyc_status || 'Unlinked'}
                                </Badge>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-muted-foreground">BVN Verified</span>
                                <span className={`font-bold ${customer?.bvn ? 'text-emerald-600' : 'text-amber-500'}`}>
                                    {customer?.bvn ? 'Yes ✅' : 'Pending ⏳'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 mt-6">
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="flex-1 text-[10px] font-black bg-background/50 hover:bg-background h-8" 
                            disabled={isSyncing}
                            onClick={async () => {
                                setIsSyncing(true);
                                const tId = toast.loading("Syncing with core banking...");
                                try {
                                    const res = await api.syncBankingIdentity(user!.id);
                                    if (res.success) {
                                        toast.success(res.message, { id: tId });
                                        const [newAccs, newLoans, newProfile] = await Promise.all([
                                            api.getUserAccounts(user!.id),
                                            api.getUserLoans(user!.id),
                                            api.getCustomerBySupabaseId(user!.id)
                                        ]);
                                        setAccounts(newAccs);
                                        setLoans(newLoans);
                                        setCustomer(newProfile);
                                    } else {
                                        toast.error(res.message, { id: tId });
                                    }
                                } catch (e) {
                                    toast.error("Network synchronization failed.", { id: tId });
                                } finally {
                                    setIsSyncing(false);
                                }
                            }}
                        >
                            <RefreshCw className={`h-3 w-3 mr-1.5 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'SYNCING...' : 'SYNC'}
                        </Button>
                        <Button variant="default" size="sm" className="flex-1 text-[10px] font-black h-8 shadow-none" asChild>
                            <Link href="/client-dashboard/profile">MANAGE</Link>
                        </Button>
                    </div>
                </div>

                <div className="lg:col-span-3 fintech-card flex overflow-x-auto gap-4 p-4 no-scrollbar">
                    {accounts.map(acc => (
                        <div key={acc.id} className="min-w-[285px] bg-gradient-to-br from-muted/50 via-card to-background p-5 rounded-2xl border border-border/80 hover:border-primary/40 transition-all relative overflow-hidden group">
                           <div className="flex items-center justify-between gap-2 mb-2">
                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-black">{acc.account_type} Account</p>
                                {acc.is_frozen || acc.pnd_enabled ? (
                                    <Badge variant="destructive" className="text-[10px] uppercase tracking-tighter rounded-full">Restricted</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-[10px] uppercase tracking-tighter rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">Active</Badge>
                                )}
                           </div>
                           <p className="text-2xl font-black mb-5 tabular-nums-fintech tracking-tight">
                               {showBalance ? `₦${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : "••••••••"}
                           </p>
                           <div className="flex items-center justify-between text-xs pt-3 border-t border-border/50">
                                <button
                                    type="button"
                                    onClick={() => copyAccountNumber(acc.account_number)}
                                    className="inline-flex items-center gap-1.5 font-mono font-bold text-muted-foreground hover:text-primary transition-colors"
                                >
                                    <span>{acc.account_number}</span>
                                    {copiedAccount === acc.account_number ? (
                                        <Check className="h-3 w-3 text-emerald-500" />
                                    ) : (
                                        <Copy className="h-3 w-3 opacity-60" />
                                    )}
                                </button>
                                {acc.is_frozen && (
                                    <span title="Account Frozen">
                                        <Lock className="h-3.5 w-3.5 text-destructive" />
                                    </span>
                                )}
                           </div>
                        </div>
                    ))}
                    {accounts.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm italic py-8">
                            No active banking accounts found.
                        </div>
                    )}
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
                <div className="p-6 md:p-8 relative">
                    {chartData.isEmpty ? (
                        <div className="h-64 w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-accent/20">
                            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-2" />
                            <p className="text-sm font-medium text-muted-foreground">No transaction history found</p>
                            <p className="text-xs text-muted-foreground/60">Your financial trajectory will appear here once you start transacting.</p>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>
            </div>

            {/* Lower Section: Actions & Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Quick Actions */}
                <div className="lg:col-span-1 space-y-6">
                    <h4 className="text-xl font-bold tracking-tight">Quick Actions</h4>
                    <div className="grid grid-cols-1 gap-4">
                        {accounts.length > 0 ? (
                            <>
                                <Link href={`/pay/${categories.find(c => c.slug.toLowerCase().includes('transfer') || c.name.toLowerCase().includes('transfer'))?.slug || 'transfers'}`} className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm cursor-pointer">
                                    <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                        <Send className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Transfer Funds</p>
                                        <p className="text-xs text-muted-foreground">Local and international</p>
                                    </div>
                                </Link>

                                <Link href={`/pay/${categories.find(c => c.slug.toLowerCase().includes('bill') || c.slug.toLowerCase().includes('utilit') || c.name.toLowerCase().includes('bill'))?.slug || 'utilities'}`} className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm cursor-pointer">
                                    <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                        <Receipt className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold">Pay Bills</p>
                                        <p className="text-xs text-muted-foreground">Utilities, tax, and more</p>
                                    </div>
                                </Link>
                            </>
                        ) : (
                            <div className="p-5 bg-accent/20 rounded-xl border border-dashed flex flex-col items-center text-center gap-3">
                                <Lock className="h-8 w-8 text-muted-foreground/30" />
                                <div>
                                    <p className="text-sm font-bold">Banking Locked</p>
                                    <p className="text-[10px] text-muted-foreground max-w-[200px]">You need an active account to perform transfers or pay bills.</p>
                                </div>
                                <Button size="sm" className="w-full font-bold" asChild>
                                    <Link href="/explore/accounts">Open Account</Link>
                                </Button>
                            </div>
                        )}

                        <Link href="/applications" className="flex items-center gap-4 p-5 bg-card rounded-xl border hover:border-primary/40 transition-all text-left flex-1 group shadow-sm cursor-pointer">
                            <div className="size-12 rounded-lg bg-accent flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shrink-0">
                                <PiggyBank className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-bold">Apply for Loan</p>
                                <p className="text-xs text-muted-foreground">Instant wealth credit</p>
                            </div>
                        </Link>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xl font-bold tracking-tight">Recent Activity</h4>
                        <Link href="/client-dashboard/transactions" className="text-xs font-bold text-primary hover:underline">
                            View All
                        </Link>
                    </div>

                    <div className="bg-card rounded-2xl border divide-y shadow-sm">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-2">
                                <Receipt className="h-8 w-8 text-muted-foreground/50" />
                                No recent activity
                            </div>
                        ) : (
                            transactions.map(tx => (
                                <Link href={`/client-dashboard/transactions/${tx.id}`} key={tx.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer block">
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
                                </Link>
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Applications */}
                {applications.length > 0 && (
                    <div className="lg:col-span-3 space-y-6 mt-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xl font-bold tracking-tight">Recent Applications</h4>
                            <Link href="/applications" className="text-xs font-bold text-primary hover:underline">
                                View All Applications
                            </Link>
                        </div>

                        <div className="bg-card rounded-2xl border flex flex-col divide-y shadow-sm">
                            {applications.slice(0, 3).map(app => {
                                const isProvisionPending = app.status === 'approved' && app.workflow_stage !== 'Provisioned';
                                return (
                                    <Link key={app.id} href={`/applications/${app.id}`} className="block">
                                        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <FileText className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">Product Application #{String(app.id).substring(0, 8)}</p>
                                                    <p className="text-xs text-muted-foreground">Submitted on {new Date(app.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                {app.requested_amount != null && app.requested_amount > 0 && (
                                                    <p className="text-sm font-bold">₦{app.requested_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                )}
                                                <span className={`px-2.5 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${
                                                    isProvisionPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                    app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                    app.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                    'bg-accent/50 text-muted-foreground border-border'
                                                }`}>
                                                    {isProvisionPending ? 'Finalising Setup' : app.status === 'pending' ? (app.workflow_stage || 'Pending') : app.status}
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            {/* Footer */}
            <footer className="p-10 text-center border-t border-border mt-10">
                <p className="text-xs text-muted-foreground font-medium">© {new Date().getFullYear()} {activeProfile.legalName}. {activeProfile.licenseBadge}.</p>
                <div className="flex justify-center gap-6 mt-4">
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
                    <Link href="#" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">Security</Link>
                </div>
            </footer>
        </div>
    );
}

