import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, Receipt, Calendar, Info, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export default async function ClientTransactionDetailsPage({ params }: { params: Promise<{ transactionId: string }> }) {
    const { transactionId } = await params;
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        return (
            <div className="p-8 text-center text-muted-foreground">
                <p>Please log in to view this receipt.</p>
            </div>
        );
    }

    const transaction = await api.getTransactionById(transactionId);

    if (!transaction) {
        notFound();
    }

    // Security Check: The user viewing MUST be associated with the source OR destination account.
    const sourceAccount = typeof transaction.from_account === 'object' ? transaction.from_account : null;
    const destAccount = typeof transaction.to_account === 'object' ? transaction.to_account : null;

    const isOwner = (sourceAccount?.user_id === session.user.id) || (destAccount?.user_id === session.user.id);
    // As an alternative fallback, if it's a top-level ledger entry mapped directly to them:
    const isDirectOwner = transaction.user_id === session.user.id || String(transaction.user_id) === String(session.user.id);

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

    const formatNaira = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    const isCredit = transaction.type === 'credit' || transaction.type === 'disbursement';

    // Determine the relevant counterparty logic for the receipt
    const isSender = sourceAccount?.user_id === session.user.id;
    const isReceiver = destAccount?.user_id === session.user.id;

    let displayCounterparty = "External Party";
    let displayCounterpartyAccount = "Unknown";

    if (isSender && destAccount) {
        displayCounterparty = "Internal Account"; // Could fetch full name if user table was populated
        displayCounterpartyAccount = destAccount.account_number;
    } else if (isReceiver && sourceAccount) {
        displayCounterparty = "Internal Account";
        displayCounterpartyAccount = sourceAccount.account_number;
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-3xl mx-auto">
            {/* Header / Nav */}
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard" className="border shadow-sm bg-background p-2 rounded-xl text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction Receipt</h1>
                </div>
            </div>

            {/* Receipt Card */}
            <Card className="overflow-hidden border-border/50 shadow-sm relative">
                {/* Decorative status bar */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${transaction.status === 'successful' ? 'bg-emerald-500' : transaction.status === 'pending' ? 'bg-amber-400' : 'bg-destructive'}`} />

                <CardHeader className="text-center pt-10 pb-6 bg-muted/20">
                    <div className={`mx-auto size-16 rounded-full flex items-center justify-center mb-4 ${isCredit ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-foreground'}`}>
                        {isCredit ? <ArrowDownLeft className="h-8 w-8" /> : <ArrowUpRight className="h-8 w-8" />}
                    </div>
                    <CardTitle className="scroll-m-20 text-4xl font-extrabold tracking-tight mb-2">
                        {isCredit ? '+' : '-'}{formatNaira(transaction.amount)}
                    </CardTitle>
                    <div className="flex justify-center">
                        <Badge variant={transaction.status === 'successful' ? 'default' : transaction.status === 'failed' ? 'destructive' : 'secondary'} className="capitalize px-3 py-1 text-xs">
                            {transaction.status}
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
                                    {transaction.reference}
                                </div>
                            </div>

                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <Calendar className="w-4 h-4" /> Date & Time
                                </div>
                                <div className="font-medium text-right text-foreground">
                                    {new Date(transaction.created_at).toLocaleString(undefined, {
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
                                    {transaction.narration || (isCredit ? 'Credit Inflow' : 'Debit Outflow')}
                                </div>
                            </div>

                            <div className="flex justify-between items-start pb-4 border-b border-border/50">
                                <div className="text-muted-foreground flex items-center gap-2">
                                    <RefreshCcw className="w-4 h-4" /> Type
                                </div>
                                <div className="font-medium text-right text-foreground capitalize">
                                    {transaction.type} • {transaction.category || 'Standard'}
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
                        <Link href="/client-dashboard" className="w-full">
                            <button className="w-full py-2.5 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                Done
                            </button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
