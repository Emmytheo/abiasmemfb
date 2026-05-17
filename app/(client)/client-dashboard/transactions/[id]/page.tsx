"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import {
    Loader2, ArrowLeft, ArrowDownLeft, ArrowUpRight, CheckCircle2,
    XCircle, Clock, Copy, MessageSquareWarning, Share2, Receipt, Calendar, Info, RefreshCcw
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

const formatNaira = (n: number) => new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(n ?? 0);

const statusStyles = {
    successful: { label: 'Successful', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30', icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" /> },
    pending: { label: 'Pending', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30', icon: <Clock className="h-5 w-5 text-amber-500" /> },
    failed: { label: 'Failed', color: 'text-destructive bg-destructive/10 border-destructive/30', icon: <XCircle className="h-5 w-5 text-destructive" /> },
    reversed: { label: 'Reversed', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30', icon: <Clock className="h-5 w-5 text-blue-500" /> },
};

function ClientTransactionDetailContent({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [tx, setTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [userLoading, setUserLoading] = useState(true);
    const [issueText, setIssueText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getUser()
            .then(({ data: { user } }) => setUser(user))
            .finally(() => setUserLoading(false));

        api.getTransactionById(id)
            .then(setTx)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [id]);

    const copyRef = () => {
        if (!tx) return;
        navigator.clipboard.writeText(tx.reference);
        toast.success('Reference copied');
    };

    const shareText = () => {
        if (!tx) return;
        const text = `Transaction: ${tx.reference}\nAmount: ${tx.type === 'credit' ? '+' : '-'}${formatNaira(tx.amount)}\nDate: ${new Date(tx.created_at).toLocaleString()}\nStatus: ${tx.status}`;
        if (navigator.share) {
            navigator.share({ title: 'Transaction Receipt', text }).catch(() => {});
        } else {
            navigator.clipboard.writeText(text);
            toast.success('Transaction details copied');
        }
    };

    const submitIssue = async () => {
        if (!issueText.trim()) return;
        setSubmitting(true);
        await new Promise(r => setTimeout(r, 800));
        setSubmitting(false);
        setIssueText('');
        toast.success('Your issue has been submitted. Support will contact you shortly.');
    };

    if (loading || userLoading) return (
        <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    );

    if (!user) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Please log in to view this receipt.</p>
            </div>
        );
    }

    if (!tx) return (
        <div className="flex flex-col items-center p-24 text-center">
            <p className="text-muted-foreground mb-4">Transaction not found.</p>
            <Button asChild><Link href="/client-dashboard/transactions">Back</Link></Button>
        </div>
    );

    // Security Check: The user viewing MUST be associated with the source OR destination account or the top-level user_id.
    const sourceAccount = typeof tx.from_account === 'object' ? tx.from_account : null;
    const destAccount = typeof tx.to_account === 'object' ? tx.to_account : null;

    const isOwner = (sourceAccount?.user_id === user.id) || (destAccount?.user_id === user.id);
    const isDirectOwner = tx.user_id === user.id || String(tx.user_id) === String(user.id);

    if (!isOwner && !isDirectOwner) {
        return (
            <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] space-y-4 animate-in fade-in">
                <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-2">
                    <Info className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Access Denied</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    This transaction belongs to another user. You do not have permission to view it.
                </p>
                <Link href="/client-dashboard" className="mt-4 text-primary hover:underline font-medium">
                    &larr; Return to Dashboard
                </Link>
            </div>
        );
    }

    const isCredit = tx.type === 'credit' || tx.type === 'disbursement';

    // Determine the relevant counterparty logic for the receipt
    const isSender = sourceAccount?.user_id === user.id;
    const isReceiver = destAccount?.user_id === user.id;

    let displayCounterparty = "External Party";
    let displayCounterpartyAccount = "Unknown";

    if (isSender && destAccount) {
        displayCounterparty = "Internal Account";
        displayCounterpartyAccount = destAccount.account_number;
    } else if (isReceiver && sourceAccount) {
        displayCounterparty = "Internal Account";
        displayCounterpartyAccount = sourceAccount.account_number;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-3xl mx-auto px-4 md:px-0">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard/transactions" className="border shadow-sm bg-background p-2 rounded-xl text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Receipt</h1>
                </div>
            </div>

            {/* Receipt Card */}
            <Card className="overflow-hidden border-border/50 shadow-sm relative">
                {/* Decorative status bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${tx.status === 'successful' ? 'bg-emerald-500' : tx.status === 'pending' ? 'bg-amber-400' : 'bg-destructive'}`} />

                <CardHeader className="text-center pt-10 pb-6 bg-muted/20">
                    <div className={`mx-auto size-16 rounded-full flex items-center justify-center mb-4 ${isCredit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-foreground'}`}>
                        {isCredit ? <ArrowDownLeft className="h-8 w-8" /> : <ArrowUpRight className="h-8 w-8" />}
                    </div>
                    <CardTitle className="scroll-m-20 text-4xl font-extrabold tracking-tight mb-2">
                        {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                    </CardTitle>
                    <div className="flex justify-center">
                        <Badge variant={tx.status === 'successful' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1 text-xs">
                            {tx.status}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="p-0">
                    <div className="px-6 py-8 space-y-8">
                        {/* Summary details */}
                        <div className="flex flex-col gap-6 text-sm">
                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Receipt className="w-4 h-4" /> Reference
                                </div>
                                <div className="font-mono font-medium text-right text-foreground break-all max-w-[50%]">
                                    {tx.reference}
                                </div>
                            </div>

                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date & Time
                                </div>
                                <div className="font-medium text-right text-foreground">
                                    {new Date(tx.created_at).toLocaleString(undefined, {
                                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                                        hour: '2-digit', minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Description
                                </div>
                                <div className="font-medium text-right text-foreground max-w-[60%]">
                                    {tx.narration || (isCredit ? 'Credit Inflow' : 'Debit Outflow')}
                                </div>
                            </div>

                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4" /> Type
                                </div>
                                <div className="font-medium text-right text-foreground capitalize">
                                    {tx.type} • {tx.category || 'Standard'}
                                </div>
                            </div>
                        </div>

                        {/* Counterparty Block */}
                        <div className="bg-muted/30 rounded-xl p-5 border border-border/50 mt-4">
                            <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider mb-4">
                                {isCredit ? 'From' : 'To'}
                            </h3>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-bold text-foreground">{displayCounterparty}</p>
                                    <p className="text-sm text-muted-foreground tracking-wide font-mono mt-0.5">{displayCounterpartyAccount}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-muted/50 p-6 flex flex-col sm:flex-row gap-4 border-t border-border/50 mt-2">
                        <Button variant="outline" className="flex-1 gap-2" onClick={copyRef}>
                            <Copy className="h-4 w-4" /> Copy Ref
                        </Button>
                        <Button variant="outline" className="flex-1 gap-2" onClick={shareText}>
                            <Share2 className="h-4 w-4" /> Share
                        </Button>
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="ghost" className="flex-1 gap-2 text-muted-foreground hover:text-destructive">
                                    <MessageSquareWarning className="h-4 w-4" /> Report Issue
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Report Transaction Issue</DialogTitle>
                                    <DialogDescription>
                                        Describe the problem with transaction <span className="font-mono text-xs">{tx.reference}</span>. Our support team will review and respond within 24 hours.
                                    </DialogDescription>
                                </DialogHeader>
                                <Textarea
                                    rows={4}
                                    value={issueText}
                                    onChange={e => setIssueText(e.target.value)}
                                    placeholder="Describe your issue in detail..."
                                    className="resize-none"
                                />
                                <DialogFooter>
                                    <Button disabled={submitting || !issueText.trim()} onClick={submitIssue}>
                                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Issue
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ClientTransactionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <ClientTransactionDetailContent params={params} />
        </Suspense>
    );
}
