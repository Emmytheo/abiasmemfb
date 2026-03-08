import { notFound } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowRight, Activity, CalendarDays, ExternalLink, Hash, Receipt, Info } from "lucide-react";

export default async function TransactionDetailsPage({ params }: { params: Promise<{ transactionId: string }> }) {
    const { transactionId } = await params;
    const transaction = await api.getTransactionById(transactionId);

    if (!transaction) {
        notFound();
    }

    const formatNaira = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    const isCredit = transaction.type === 'credit' || transaction.type === 'disbursement';

    // Type guards for populated relational accounts
    const sourceAccount = typeof transaction.from_account === 'object' ? transaction.from_account : null;
    const destAccount = typeof transaction.to_account === 'object' ? transaction.to_account : null;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-4 md:px-6">
            <div className="flex items-center gap-4">
                <Link href="/products/transactions" className="text-muted-foreground hover:text-foreground transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transaction Details</h1>
                    <p className="text-muted-foreground">Complete audit trail for ledger entry {transaction.reference}</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Primary Overview Card */}
                <Card className="lg:col-span-2 overflow-hidden relative">
                    <div className={`absolute top-0 left-0 w-2 h-full ${isCredit ? 'bg-green-500' : 'bg-red-500'}`} />
                    <CardHeader>
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    {isCredit ? 'Inflow' : 'Outflow'}
                                </CardTitle>
                                <CardDescription className="mt-1 flex items-center gap-1">
                                    <Hash className="w-3 h-3" /> {transaction.reference}
                                </CardDescription>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <Badge variant={
                                    transaction.status === 'successful' ? 'default' :
                                        transaction.status === 'pending' ? 'secondary' :
                                            'destructive'
                                } className="capitalize">
                                    {transaction.status}
                                </Badge>
                                <Badge variant="outline" className="capitalize flex items-center gap-1">
                                    <Activity className="w-3 h-3" /> {transaction.type}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-baseline gap-2">
                            <span className={`text-5xl font-extrabold tracking-tight ${isCredit ? 'text-green-600' : 'text-red-500'}`}>
                                {isCredit ? '+' : '-'}{formatNaira(transaction.amount)}
                            </span>
                        </div>

                        {transaction.narration && (
                            <div className="bg-muted p-4 rounded-lg flex items-start gap-3">
                                <Info className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                                <p className="text-sm font-medium leading-relaxed">
                                    {transaction.narration}
                                </p>
                            </div>
                        )}

                        <Separator />

                        <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Date & Time</span>
                                <div className="flex items-center gap-2 text-sm font-medium">
                                    <CalendarDays className="w-4 h-4 text-primary" />
                                    {new Date(transaction.created_at).toLocaleString()}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Category</span>
                                <p className="text-sm font-medium">{transaction.category || 'N/A'}</p>
                            </div>
                            {transaction.balance_after !== undefined && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Resulting Balance</span>
                                    <p className="text-sm font-medium">{formatNaira(transaction.balance_after)}</p>
                                </div>
                            )}
                            {transaction.workflow_execution && (
                                <div className="space-y-1.5">
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Workflow Origin</span>
                                    <Link
                                        href={`/workflows/${typeof transaction.workflow_execution === 'object' ? transaction.workflow_execution.id : transaction.workflow_execution}`}
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
                <Card className="flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Receipt className="w-5 h-5" /> Routing Details
                        </CardTitle>
                        <CardDescription>Source and Destination Accounts</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 space-y-8">
                        {/* Sender */}
                        <div className="relative">
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Sender</h3>
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
                            <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-3">Receiver</h3>
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
            </div>

            {/* Raw Payload Metadata (If exists) */}
            {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium">Provider Metadata</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-auto border">
                            {JSON.stringify(transaction.metadata, null, 2)}
                        </pre>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
