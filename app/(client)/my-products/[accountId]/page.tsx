"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, Copy, Check, ShieldCheck,
    Smartphone, ArrowUpRight, ArrowDownLeft, Building,
    Activity, CreditCard, Bell, Settings, Tag, Target
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Account, Transaction } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";

export default function AccountDetailsPage({ params }: { params: Promise<{ accountId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const accountId = resolvedParams.accountId;

    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (!supaUser) {
                    router.push('/auth/login');
                    return;
                }

                const [accData, allTxData] = await Promise.all([
                    api.getAccountById(accountId),
                    api.getAllTransactions()
                ]);

                // Ensure the account exists and belongs to the user
                if (!accData || accData.user_id !== supaUser.id) {
                    router.push('/my-products');
                    return;
                }

                setAccount(accData);

                // In a real app, the API adapter would have a getTransactionsByAccount(accountId) method.
                // For now, we simulate this by filtering if possible, or just using dummy/returned transactions.
                // Assuming `api.getAllTransactions()` returns transactions that we might want to mock/filter
                setTransactions(allTxData.slice(0, 5)); // Just take 5 as mock data for this account

            } catch (err) {
                console.error("Failed to load account details:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [accountId, router]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
            </div>
        );
    }

    if (!account) {
        return (
            <div className="flex flex-col h-[60vh] w-full items-center justify-center gap-4">
                <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-20" />
                <h2 className="text-2xl font-bold tracking-tight">Account Not Found</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    We couldn't find the account you're looking for. It may have been closed or isn't linked to your profile.
                </p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/my-products">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to My Products
                    </Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 hover:bg-muted">
                    <Link href="/my-products">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Account Details
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                        {account.account_type} Account
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        Status: <span className="text-emerald-500 font-medium capitalize">{account.status}</span>
                    </p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className="md:col-span-2 border shadow-sm bg-gradient-to-br from-card to-muted/20 relative overflow-hidden group">
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                    <CardHeader className="pb-2">
                        <CardDescription className="tracking-wider text-xs uppercase font-medium">Available Balance</CardDescription>
                        <div className="flex items-baseline gap-2">
                            <CardTitle className="text-5xl font-mono tracking-tight text-primary">
                                ₦{account.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-end p-4 rounded-xl bg-background/50 border backdrop-blur-sm">
                            <div className="space-y-1">
                                <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider">Account Number</p>
                                <div className="flex items-center gap-2">
                                    <p className="font-mono text-xl md:text-2xl font-medium tracking-widest">{account.account_number}</p>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 rounded-full"
                                        onClick={() => copyToClipboard(account.account_number)}
                                    >
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                                    </Button>
                                </div>
                            </div>
                            <div className="text-right">
                                <Badge variant="secondary" className="px-3 py-1 font-medium bg-primary/10 tracking-widest text-primary border-primary/20">
                                    {account.account_type.toUpperCase()}
                                </Badge>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border shadow-sm bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button className="w-full justify-start h-12 relative overflow-hidden group" asChild>
                            <Link href={`/pay/transfer?from=${account.account_number}`}>
                                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/10 mr-3">
                                    <ArrowUpRight className="h-4 w-4" />
                                </span>
                                Transfer Funds
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 group" asChild>
                            <Link href={`/pay/bills?account=${account.account_number}`}>
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted mr-3 group-hover:bg-primary/10 transition-colors">
                                    <ArrowDownLeft className="h-4 w-4" />
                                </span>
                                Fund Account
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full justify-start h-12 group" asChild>
                            <Link href={`/pay/bills?account=${account.id}`}>
                                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted mr-3 group-hover:bg-primary/10 transition-colors">
                                    <Building className="h-4 w-4" />
                                </span>
                                Pay Bills
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Exhaustive Details Tabs */}
            <Tabs defaultValue="transactions" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 !h-full p-2 bg-muted dark:bg-muted/20">
                    <TabsTrigger value="transactions" className="py-2.5 data-[state=active]:bg-card dark:data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Activity className="h-4 w-4 mr-2" /> Recent Activity
                    </TabsTrigger>
                    <TabsTrigger value="cards" className="py-2.5 data-[state=active]:bg-card dark:data-[state=active]:bg-background  data-[state=active]:shadow-sm">
                        <CreditCard className="h-4 w-4 mr-2" /> Cards & Channels
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="py-2.5 data-[state=active]:bg-card dark:data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Settings className="h-4 w-4 mr-2" /> Account Settings
                    </TabsTrigger>
                    <TabsTrigger value="promotions" className="py-2.5 data-[state=active]:bg-card dark:data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Tag className="h-4 w-4 mr-2" /> Target Rewards
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* TRANSACTIONS TAB */}
                    <TabsContent value="transactions" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border-0 shadow-sm border-t border-r border-l border-b border-border">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Recent Transactions</CardTitle>
                                    <Button variant="ghost" size="sm" className="text-primary h-8">View Statement</Button>
                                </div>
                                <CardDescription>A summary of your latest deposits and withdrawals.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
                                        <Activity className="h-8 w-8 opacity-20" />
                                        <p>No recent activity found on this account.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center border shadow-sm shrink-0 ${tx.type === 'credit' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-red-500/10 text-red-600 border-red-500/20'
                                                        }`}>
                                                        {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{tx.reference || tx.category}</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                            <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                            <span>{tx.narration || 'Transaction'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`font-mono font-bold tracking-tight ${tx.type === 'credit' ? 'text-emerald-500' : ''}`}>
                                                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                    </p>
                                                    <Badge variant="outline" className={`text-[10px] mt-1 h-5 uppercase tracking-wider ${tx.status === 'successful' ? 'border-emerald-500/30 text-emerald-500' :
                                                            tx.status === 'failed' ? 'border-red-500/30 text-red-500' : 'border-amber-500/30 text-amber-500'
                                                        }`}>
                                                        {tx.status}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* CARDS & CHANNELS TAB */}
                    <TabsContent value="cards" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <div className="grid gap-6 md:grid-cols-2">
                            <Card className="border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <CreditCard className="h-5 w-5 text-primary" />
                                        Linked Cards
                                    </CardTitle>
                                    <CardDescription>Manage your ATM and Virtual debit cards for this account.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col items-center justify-center p-8 border border-dashed rounded-xl bg-muted/20 text-center gap-3">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <CreditCard className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">No Cards Request</p>
                                            <p className="text-sm text-muted-foreground max-w-[250px] mx-auto mt-1">You haven't requested a debit card for this account yet.</p>
                                        </div>
                                        <Button className="mt-2" variant="outline">Request Virtual Card</Button>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Smartphone className="h-5 w-5 text-primary" />
                                        Supported Channels
                                    </CardTitle>
                                    <CardDescription>Operational services configured for this account.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">USSD Banking</p>
                                            <p className="text-xs text-muted-foreground">Dial *887# to transact</p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">ACTIVE</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">Internet Banking</p>
                                            <p className="text-xs text-muted-foreground">App and Web access</p>
                                        </div>
                                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-0">ACTIVE</Badge>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card opacity-50">
                                        <div className="space-y-0.5">
                                            <p className="font-medium text-sm">Cheque Book</p>
                                            <p className="text-xs text-muted-foreground">For Current Accounts and Corporates</p>
                                        </div>
                                        <Badge variant="outline" className="text-muted-foreground border-border">UNAVAILABLE</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* SETTINGS TAB */}
                    <TabsContent value="settings" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Account Preferences</CardTitle>
                                <CardDescription>Configure alerts and privacy settings for this specific account.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Communication & Alerts</h3>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">Email Alerts</p>
                                            <p className="text-xs text-muted-foreground">Receive transaction receipts via email</p>
                                        </div>
                                        <div className="w-10 h-5 rounded-full bg-primary relative cursor-pointer">
                                            <div className="absolute right-1 top-1 w-3 h-3 rounded-full bg-white transition-all shadow-sm"></div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm">SMS Alerts (₦5 per SMS)</p>
                                            <p className="text-xs text-muted-foreground">Instant notifications for all activities</p>
                                        </div>
                                        <div className="w-10 h-5 rounded-full bg-muted border relative cursor-pointer">
                                            <div className="absolute left-1 top-1 w-3 h-3 rounded-full bg-muted-foreground transition-all shadow-sm"></div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <h3 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground">Account Status</h3>
                                    <div className="flex items-center justify-between p-4 rounded-xl border border-destructive/20 bg-destructive/5">
                                        <div className="space-y-1">
                                            <p className="font-medium text-sm text-destructive">Freeze Account</p>
                                            <p className="text-xs text-muted-foreground">Temporarily block all outbound transactions</p>
                                        </div>
                                        <Button variant="destructive" size="sm">Freeze</Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* PROMOTIONS TAB */}
                    <TabsContent value="promotions" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border shadow-sm border-primary/20 bg-gradient-to-br from-card to-primary/5">
                            <CardContent className="p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
                                <Target className="h-16 w-16 text-primary mb-6" />
                                <h3 className="text-2xl font-bold tracking-tight mb-2">Grow Your Yield</h3>
                                <p className="text-muted-foreground max-w-md mx-auto mb-8">
                                    Lock your balance of ₦{account.balance.toLocaleString('en-NG')} in a Fixed Deposit today and earn up to 12% per annum instantly!
                                </p>
                                <Button size="lg" className="rounded-full shadow-lg h-12 px-8">Calculate Returns</Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
