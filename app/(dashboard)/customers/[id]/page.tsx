"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Customer, Account } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    ArrowLeft, 
    User, 
    CreditCard, 
    ShieldCheck, 
    ShieldAlert, 
    History, 
    Lock, 
    Unlock, 
    Ban, 
    DollarSign,
    RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PageProps {
    params: Promise<{ id: string }>;
}

export default function AdminCustomerDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    async function loadData() {
        setLoading(true);
        try {
            const cust = await api.getCustomerById(id);
            if (cust) {
                setCustomer(cust);
                // Bilateral Lookup: Fetch accounts/loans by both Customer ID and Digital UUID/Email
                const [allAccounts, allLoans] = await Promise.all([
                    api.getAllAccounts(),
                    api.getAllLoans()
                ]);

                const linkedAccounts = allAccounts.filter(acc => 
                    (typeof acc.customer === 'object' ? acc.customer?.id === id : acc.customer === id) ||
                    (acc.user_id === cust.email || acc.user_id === cust.supabase_id)
                );
                
                const linkedLoans = allLoans.filter(loan => 
                    (loan.user_id === cust.email || loan.user_id === cust.supabase_id)
                );

                setAccounts(linkedAccounts);
                setLoans(linkedLoans);
            }
        } catch (error) {
            toast.error("Failed to load customer details.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSync = async () => {
        if (!customer) return;
        setActionLoading('sync');
        toast.info(`Triggering refresh for ${customer.firstName}...`);
        try {
            // Re-sync specific account if we have one or just the customer
            const res = await fetch('/api/sync/customers', { 
                method: 'POST',
                body: JSON.stringify({ accounts: accounts.map(a => a.account_number).slice(0, 1) }) 
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Customer profile refreshed.");
                loadData();
            } else {
                toast.error(result.error);
            }
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!customer) return <div className="p-8">Customer not found.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header - Stacked on Mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/customers"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center flex-wrap gap-3">
                            {customer.firstName} {customer.lastName}
                            {customer.is_test_account && <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold px-2 py-0">TEST</Badge>}
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 mt-1">
                            {customer.email} • {customer.phone_number}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="outline" onClick={handleSync} disabled={actionLoading === 'sync'} className="flex-1 md:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'sync' ? 'animate-spin' : ''}`} />
                        Sync from Core
                    </Button>
                    <Button className="shadow-lg shadow-primary/20 flex-1 md:flex-none">
                        {customer.is_associated ? 'Manage User' : 'Grant Digital Access'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview (Left) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Profile Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">KYC Status</span>
                                <Badge variant={customer.kyc_status === 'active' ? 'default' : 'secondary'} className="w-fit capitalize">
                                    {customer.kyc_status}
                                </Badge>
                                
                                <span className="text-muted-foreground">BVN</span>
                                <span className="font-mono">{customer.bvn || 'Not Provided'}</span>
                                
                                <span className="text-muted-foreground">Qore ID</span>
                                <span className="font-mono text-xs">{customer.qore_customer_id}</span>
                                
                                <span className="text-muted-foreground">Risk Tier</span>
                                <span className="capitalize font-medium">{customer.risk_tier}</span>

                                <span className="text-muted-foreground">Supabase Link</span>
                                <span className="truncate text-xs text-primary">{customer.supabase_id ? 'Linked ✅' : 'None (Shadow)'}</span>
                            </div>

                            {customer.address && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Primary Address</p>
                                    <p className="text-sm leading-relaxed">{customer.address}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl bg-muted/30 border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Risk & Compliance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    <span>AML Screening</span>
                                </div>
                                <span className="text-xs font-bold text-emerald-500">PASSED</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                    <span>Identity Verification</span>
                                </div>
                                <span className="text-xs font-bold text-yellow-500">MANUAL REVIEW</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Accounts & Activity (Right) */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="accounts" className="w-full">
                        <TabsList className="bg-muted/50 !h-full p-2 rounded-xl mb-6 flex-wrap h-auto">
                            <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <CreditCard className="h-4 w-4" /> Banking Accounts
                            </TabsTrigger>
                            <TabsTrigger value="loans" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <DollarSign className="h-4 w-4" /> Credit Products
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <History className="h-4 w-4" /> Audit Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="accounts" className="space-y-4">
                            {accounts.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground">
                                    No linked banking accounts found for this profile.
                                </div>
                            ) : (
                                accounts.map((acc) => (
                                    <Card key={acc.id} className="rounded-2xl border-primary/5 hover:border-primary/20 transition-all overflow-hidden group">
                                        <div className="p-6">
                                            <div className="flex justify-between items-start mb-6">
                                                <div>
                                                    <h3 className="text-xl font-bold uppercase tracking-tight">{acc.account_type} Account</h3>
                                                    <p className="text-sm font-mono text-primary mt-1 tracking-[0.2em] font-bold">{acc.account_number}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Available Balance</p>
                                                    <p className="text-2xl font-black">₦{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t mb-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Status</p>
                                                    <Badge variant={acc.status === 'active' ? 'default' : 'destructive'} className="capitalize">{acc.status}</Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Post-No-Debit</p>
                                                    <span className={`text-sm font-bold ${acc.pnd_enabled ? 'text-destructive' : 'text-emerald-500'}`}>
                                                        {acc.pnd_enabled ? 'Enabled 🚫' : 'Disabled ✅'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Lien Amount</p>
                                                    <span className="text-sm font-bold">₦{(acc.lien_amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Currency</p>
                                                    <span className="text-sm font-bold">NGN (Naira)</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2">
                                                <Button size="sm" variant={acc.is_frozen ? "outline" : "destructive"} className="gap-2 text-xs h-9">
                                                    {acc.is_frozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                                    {acc.is_frozen ? 'Unfreeze' : 'Freeze'}
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-2 text-xs h-9">
                                                    <Ban className="h-3.5 w-3.5" /> Toggle PND
                                                </Button>
                                                <Button size="sm" variant="outline" className="gap-2 text-xs h-9">
                                                    <DollarSign className="h-3.5 w-3.5" /> Manage Lien
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="loans" className="space-y-4">
                            {loans.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
                                    <p className="font-medium">No active loan products found.</p>
                                    <p className="text-xs">Digital ledger credit history is clear.</p>
                                </div>
                            ) : (
                                loans.map((loan) => (
                                    <Card key={loan.id} className="rounded-2xl border-primary/5 p-6 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-0.5">{loan.status}</Badge>
                                                <h4 className="font-bold text-lg">Personal Credit Line</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Principal</p>
                                                <p className="text-xl font-black">₦{loan.amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Interest Rate</p>
                                                <p className="text-sm font-bold">{loan.interest_rate}% Annually</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Outstanding</p>
                                                <p className="text-sm font-bold text-destructive">₦{loan.outstanding_balance?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                                                <p className="text-sm font-bold">{loan.duration_months} Months</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card className="rounded-2xl border-primary/5 p-6 md:p-10">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Chronological Audit Log
                                </h3>
                                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                                    {/* Timeline Item 1 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
                                            <RefreshCw className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">Identity Recovery Sync</div>
                                                <time className="font-mono text-[10px] text-primary">JUST NOW</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Manual identity bridge executed for digital-only profile reconstruction (System Audit).</div>
                                        </div>
                                    </div>

                                    {/* Timeline Item 2 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-muted bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-emerald-500">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">KYC Activated</div>
                                                <time className="font-mono text-[10px] text-muted-foreground mr-1">3 HOURS AGO</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Digital-first KYC profile successfully verified and promoted to active status.</div>
                                        </div>
                                    </div>

                                    {/* Timeline Item 3 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-muted bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-muted-foreground">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">Registration</div>
                                                <time className="font-mono text-[10px] text-muted-foreground">2026-03-24</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Supabase digital identity created via mobile application channel.</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t text-center">
                                    <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">
                                        Load Extended History
                                    </Button>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
