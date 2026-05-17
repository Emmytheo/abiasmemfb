"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Loader2, ArrowLeft, AlertTriangle, ArrowDownLeft, ArrowUpRight,
    RefreshCw, Copy, CheckCircle2, XCircle, Clock, Receipt, ArrowRight, Info, ExternalLink, Hash, Activity, CalendarDays
} from "lucide-react";
import { toast } from "sonner";

const formatNaira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);

const statusMap = {
    successful: { icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />, label: 'Successful', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
    pending: { icon: <Clock className="h-5 w-5 text-amber-500" />, label: 'Pending', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
    failed: { icon: <XCircle className="h-5 w-5 text-destructive" />, label: 'Failed', color: 'text-destructive bg-destructive/10 border-destructive/30' },
    reversed: { icon: <RefreshCw className="h-5 w-5 text-blue-500" />, label: 'Reversed', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
};

function AdminTransactionDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [tx, setTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [querying, setQuerying] = useState(false);
    const [externalStatus, setExternalStatus] = useState<any>(null);

    useEffect(() => {
        api.getTransactionById(id)
            .then(setTx)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    const copyRef = () => {
        if (!tx) return;
        navigator.clipboard.writeText(tx.reference ?? '');
        toast.success('Reference copied to clipboard');
    };

    const queryExternal = async () => {
        if (!tx) return;
        setQuerying(true);
        try {
            const res = await fetch(`/api/mock/tx-status?TransactionReference=${encodeURIComponent(tx.reference)}`);
            const data = await res.json();
            setExternalStatus(data.Payload || data);
            toast.success('External status retrieved');
        } catch {
            toast.error('Could not reach external status endpoint');
        } finally {
            setQuerying(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    );

    if (!tx) return (
        <div className="flex flex-col items-center justify-center p-24 text-center">
            <AlertTriangle className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Transaction Not Found</h2>
            <Button asChild><Link href="/products/transactions">Back to Transactions</Link></Button>
        </div>
    );

    const { label } = statusMap[tx.status] ?? statusMap.pending;
    const isCredit = tx.type === 'credit' || tx.type === 'disbursement';

    // Type guards for populated relational accounts
    const sourceAccount = typeof tx.from_account === 'object' ? tx.from_account : null;
    const destAccount = typeof tx.to_account === 'object' ? tx.to_account : null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 px-4 md:px-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
                    <p className="text-muted-foreground">Complete audit trail for ledger entry {tx.reference}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Primary Overview Card */}
                <Card className="lg:col-span-2 overflow-hidden relative border shadow-sm">
                    <div className={`absolute top-0 left-0 w-2 h-full ${isCredit ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {isCredit ? 'Inflow' : 'Outflow'}
                                </CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> {tx.reference}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant={
                                    tx.status === 'successful' ? 'default' :
                                        tx.status === 'pending' ? 'secondary' :
                                            'destructive'
                                } className="capitalize">
                                    {tx.status}
                                </Badge>
                                <Badge variant="outline" className="capitalize flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> {tx.type}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-extrabold tracking-tight ${isCredit ? 'text-emerald-600' : 'text-red-500'}`}>
                                {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                            </span>
                        </div>

                        {tx.narration && (
                            <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                                <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">
                                    {tx.narration}
                                </p>
                            </div>
                        )}

                        <Separator />

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Date & Time</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    {new Date(tx.created_at).toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Category</span>
                                <p className="text-sm font-medium">{tx.category || 'N/A'}</p>
                            </div>
                            {tx.balance_after !== undefined && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Resulting Balance</span>
                                    <p className="text-sm font-medium">{formatNaira(tx.balance_after)}</p>
                                </div>
                            )}
                            {tx.workflow_execution && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Workflow Origin</span>
                                    <Link
                                        href={`/workflows/${typeof tx.workflow_execution === 'object' ? tx.workflow_execution.id : tx.workflow_execution}`}
                                        className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
                                    >
                                        View Execution <ExternalLink className="w-3 h-3" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Account Routing Card */}
                <div className="space-y-6">
                    <Card className="flex flex-col border shadow-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Receipt className="w-5 h-5" /> Routing Details
                            </CardTitle>
                            <CardDescription>Source and Destination Accounts</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-6">
                            {/* Sender */}
                            <div className="relative">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Sender</h3>
                                {sourceAccount ? (
                                    <div className="bg-card border rounded-lg p-3 hover:border-primary transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-semibold text-sm">{sourceAccount.account_number}</p>
                                            <Badge variant="outline" className="text-[10px] h-5">{sourceAccount.account_type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">ID: {sourceAccount.id}</p>
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 border border-dashed rounded-lg p-3 text-center text-sm text-muted-foreground/70">
                                        External / Cash Inflow
                                    </div>
                                )}
                            </div>

                            {/* Direction Arrow */}
                            <div className="flex justify-center -my-2 relative z-10">
                                <div className="bg-background border rounded-full p-1.5 shadow-sm">
                                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                                </div>
                            </div>

                            {/* Receiver */}
                            <div className="relative">
                                <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2">Receiver</h3>
                                {destAccount ? (
                                    <div className="bg-card border rounded-lg p-3 hover:border-primary transition-colors">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="font-semibold text-sm">{destAccount.account_number}</p>
                                            <Badge variant="outline" className="text-[10px] h-5">{destAccount.account_type}</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-mono">ID: {destAccount.id}</p>
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 border border-dashed rounded-lg p-3 text-center text-sm text-muted-foreground/70">
                                        External Destination / Withdrawal
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1 gap-2" onClick={copyRef}>
                            <Copy className="h-4 w-4" /> Copy Reference
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" disabled={querying} onClick={queryExternal}>
                            {querying ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                            Query CBS Status
                        </Button>
                    </div>
                </div>
            </div>

            {/* External Status */}
            {externalStatus && (
                <Card className="border shadow-sm bg-muted/30">
                    <CardHeader className="pb-3 border-b"><CardTitle className="text-sm">External Status Response</CardTitle></CardHeader>
                    <CardContent className="pt-3">
                        <pre className="text-xs font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(externalStatus, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}

            {/* Raw Payload Metadata (If exists) */}
            {tx.metadata && Object.keys(tx.metadata).length > 0 && (
                <Card className="border shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Provider Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto border">
                            {JSON.stringify(tx.metadata, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default function AdminTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AdminTransactionDetailContent params={params} />
        </Suspense>
    );
}
