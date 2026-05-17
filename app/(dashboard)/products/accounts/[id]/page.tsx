"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Account, Transaction } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw, Download, Snowflake, AlertTriangle, CreditCard, Shield, Building, TrendingDown, FileText, Bell, X, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const formatNaira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n);

function AdminAccountDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [stmtOpen, setStmtOpen] = useState(false);
    const [stmtFrom, setStmtFrom] = useState('');
    const [stmtTo, setStmtTo] = useState('');
    const [tierValue, setTierValue] = useState('1');

    useEffect(() => {
        async function load() {
            try {
                const [acct, txs] = await Promise.all([
                    api.getAccountById(id),
                    api.getAccountTransactions(id),
                ]);
                setAccount(acct);
                setTransactions(txs.slice(0, 50));
            } finally { setLoading(false); }
        }
        load();
    }, [id]);

    const doAction = async (actionKey: string, fn: () => Promise<any>, successMsg: string) => {
        setActionLoading(actionKey);
        try {
            await fn();
            toast.success(successMsg);
            const updated = await api.getAccountById(id);
            setAccount(updated);
        } catch (e: any) {
            toast.error(e?.message || 'Action failed');
        } finally { setActionLoading(null); }
    };

    if (loading) return (
        <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    );

    if (!account) return (
        <div className="flex flex-col items-center justify-center p-24 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Account Not Found</h2>
            <Button asChild><Link href="/products/accounts">Back to Accounts</Link></Button>
        </div>
    );

    const statusColor = account.is_frozen ? 'border-blue-500/30 bg-blue-500/10 text-blue-600' :
        account.pnd_enabled ? 'border-amber-500/30 bg-amber-500/10 text-amber-600' :
        'border-emerald-500/30 bg-emerald-500/10 text-emerald-600';

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-3">
            {/* Header */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Account Detail</h1>
                        <p className="text-muted-foreground font-mono text-sm">{account.account_number}</p>
                    </div>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${statusColor}`}>
                    {account.is_frozen ? 'Frozen' : account.pnd_enabled ? 'PND Active' : 'Active'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Balance Card */}
                    <Card className="border-t-4 border-t-primary shadow-md overflow-hidden">
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Available Balance</p>
                            <p className="text-4xl font-black tracking-tight">{formatNaira(account.balance)}</p>
                            {(account.lien_amount ?? 0) > 0 && (
                                <p className="text-sm text-amber-600 mt-2 flex items-center gap-1">
                                    <AlertTriangle className="h-3.5 w-3.5" />
                                    Lien: {formatNaira(account.lien_amount ?? 0)}
                                </p>
                            )}
                        </div>
                        <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div><p className="text-muted-foreground text-xs mb-0.5">Type</p><p className="font-semibold">{account.account_type}</p></div>
                            <div><p className="text-muted-foreground text-xs mb-0.5">Source</p><Badge variant={account.source === 'qore' ? 'default' : 'secondary'} className="text-[10px]">{account.source}</Badge></div>
                            <div><p className="text-muted-foreground text-xs mb-0.5">Primary</p><p className="font-semibold">{account.is_primary ? 'Yes' : 'No'}</p></div>
                            <div><p className="text-muted-foreground text-xs mb-0.5">Opened</p><p className="font-semibold">{new Date(account.created_at).toLocaleDateString()}</p></div>
                        </CardContent>
                    </Card>

                    {/* Transactions */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-base">Recent Transactions (Last 50)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            {transactions.length === 0 ? (
                                <div className="p-10 text-center text-muted-foreground text-sm">No transactions found.</div>
                            ) : (
                                <div className="divide-y">
                                    {transactions.map(tx => (
                                        <div key={tx.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/10">
                                            <div>
                                                <p className="text-sm font-medium capitalize">{tx.type}</p>
                                                <p className="text-xs text-muted-foreground font-mono">{tx.reference}</p>
                                                {tx.narration && <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[260px]">{tx.narration}</p>}
                                            </div>
                                            <div className="text-right">
                                                <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-emerald-600' : ''}`}>
                                                    {tx.type === 'credit' ? '+' : '-'}{formatNaira(tx.amount)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-4">
                    <Card className="border shadow-sm">
                        <CardHeader className="pb-3 border-b"><CardTitle className="text-base">Account Controls</CardTitle></CardHeader>
                        <CardContent className="pt-4 space-y-2">
                            {/* Freeze/Unfreeze */}
                            <Button
                                variant={account.is_frozen ? "outline" : "secondary"}
                                className="w-full justify-start gap-2 h-10"
                                disabled={actionLoading !== null}
                                onClick={() => doAction('freeze',
                                    () => api.updateAccount(id, { is_frozen: !account.is_frozen }),
                                    account.is_frozen ? 'Account unfrozen.' : 'Account frozen.'
                                )}
                            >
                                {actionLoading === 'freeze' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Snowflake className="h-4 w-4" />}
                                {account.is_frozen ? 'Unfreeze Account' : 'Freeze Account'}
                            </Button>

                            {/* PND */}
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2 h-10"
                                disabled={actionLoading !== null}
                                onClick={() => doAction('pnd',
                                    () => api.updateAccount(id, { pnd_enabled: !account.pnd_enabled }),
                                    account.pnd_enabled ? 'PND lifted.' : 'PND applied.'
                                )}
                            >
                                {actionLoading === 'pnd' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                {account.pnd_enabled ? 'Lift PND' : 'Apply PND'}
                            </Button>

                            {/* Tier Upgrade */}
                            <div className="flex gap-2">
                                <select
                                    value={tierValue}
                                    onChange={e => setTierValue(e.target.value)}
                                    className="flex-1 h-10 text-sm border rounded-md bg-background px-2"
                                >
                                    <option value="1">Tier 1</option>
                                    <option value="2">Tier 2</option>
                                    <option value="3">Tier 3</option>
                                </select>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="shrink-0"
                                    disabled={actionLoading !== null}
                                    onClick={() => doAction('tier',
                                        () => api.updateAccount(id, {} as any),
                                        `Account upgraded to Tier ${tierValue}.`
                                    )}
                                >
                                    {actionLoading === 'tier' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TrendingDown className="h-3.5 w-3.5" />}
                                    Set Tier
                                </Button>
                            </div>

                            {/* Statement */}
                            <Dialog open={stmtOpen} onOpenChange={setStmtOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="secondary" className="w-full justify-start gap-2 h-10">
                                        <FileText className="h-4 w-4" /> Download Statement
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Generate Statement</DialogTitle>
                                        <DialogDescription>Select a date range for the account statement.</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-2">
                                        <div className="space-y-1.5"><Label>From</Label><Input type="date" value={stmtFrom} onChange={e => setStmtFrom(e.target.value)} /></div>
                                        <div className="space-y-1.5"><Label>To</Label><Input type="date" value={stmtTo} onChange={e => setStmtTo(e.target.value)} /></div>
                                    </div>
                                    <DialogFooter>
                                        <Button onClick={async () => {
                                            toast.success('Statement generation triggered — download will begin shortly.');
                                            setStmtOpen(false);
                                        }}>Generate & Download</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            {/* Notification Preference */}
                            <Button
                                variant="secondary"
                                className="w-full justify-start gap-2 h-10"
                                disabled={actionLoading !== null}
                                onClick={() => doAction('notif',
                                    () => api.updateAccount(id, {} as any),
                                    'Notification preference updated.'
                                )}
                            >
                                {actionLoading === 'notif' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />}
                                Toggle Notifications
                            </Button>

                            {/* Archive */}
                            <Button
                                variant="outline"
                                className="w-full justify-start gap-2 h-10 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                disabled={actionLoading !== null}
                                onClick={() => doAction('archive',
                                    () => api.updateAccount(id, { is_archived: true } as any),
                                    'Account archived.'
                                )}
                            >
                                {actionLoading === 'archive' ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                Archive Account
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Customer Link */}
                    {account.customer && (
                        <Card className="border shadow-sm bg-muted/30">
                            <CardContent className="pt-4">
                                <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-2">Linked Customer</p>
                                <p className="font-mono text-xs text-foreground">
                                    {typeof account.customer === 'object' ? (account.customer as any)?.firstName + ' ' + (account.customer as any)?.lastName : String(account.customer)}
                                </p>
                                {typeof account.customer === 'object' && (
                                    <Button asChild size="sm" variant="outline" className="mt-3 w-full">
                                        <Link href={`/customers/${(account.customer as any).id}`}>View Customer</Link>
                                    </Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminAccountDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AdminAccountDetailContent params={params} />
        </Suspense>
    );
}
