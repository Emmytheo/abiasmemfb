"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Loader2, ArrowUpRight, ArrowDownLeft,
    Calendar, Clock, ShieldCheck, Activity, Target,
    AlertCircle, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { Loan, Transaction, ProductType } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";

export default function LoanDetailsPage({ params }: { params: Promise<{ loanId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const loanId = resolvedParams.loanId;

    const [loan, setLoan] = useState<Loan | null>(null);
    const [productType, setProductType] = useState<ProductType | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (!supaUser) {
                    router.push('/auth/login');
                    return;
                }

                const loanData = await api.getLoanById(loanId);

                // Ensure the loan exists and belongs to the user
                if (!loanData || loanData.user_id !== supaUser.id) {
                    router.push('/my-loans');
                    return;
                }

                setLoan(loanData);

                // Fetch the product type details to get the name
                if (loanData.product_type_id) {
                    const pType = await api.getProductTypeById(loanData.product_type_id);
                    setProductType(pType);
                }

                // Mock Fetch: Get transactions related to this loan (repayments)
                const allTxData = await api.getAllTransactions();
                setTransactions(allTxData.filter(tx => tx.type === 'debit').slice(0, 3));

            } catch (err) {
                console.error("Failed to load loan details:", err);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [loanId, router]);

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary/50" />
            </div>
        );
    }

    if (!loan) {
        return (
            <div className="flex flex-col h-[60vh] w-full items-center justify-center gap-4">
                <ShieldCheck className="h-16 w-16 text-muted-foreground opacity-20" />
                <h2 className="text-2xl font-bold tracking-tight">Loan Not Found</h2>
                <p className="text-muted-foreground text-center max-w-sm">
                    We couldn't find the loan you're looking for. It may have been fully repaid or isn't linked to your profile.
                </p>
                <Button variant="outline" asChild className="mt-4">
                    <Link href="/my-loans">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Return to My Loans
                    </Link>
                </Button>
            </div>
        );
    }

    // Calculations for progress
    const totalRepayable = loan.amount + (loan.amount * (loan.interest_rate / 100)); // Simple interest mock
    const outstanding = loan.outstanding_balance ?? totalRepayable;
    const amountPaid = totalRepayable - outstanding;
    const progressPercent = Math.min(100, Math.max(0, (amountPaid / totalRepayable) * 100));

    // Formatter
    const formatCurrency = (amount: number) => `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 hover:bg-muted">
                    <Link href="/my-loans">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Loan Details
                    </h1>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                        {productType?.name || 'Personal Loan'}
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        Status: <span className={`font-medium capitalize ${loan.status === 'active' ? 'text-primary' :
                                loan.status === 'repaid' ? 'text-emerald-500' :
                                    loan.status === 'defaulted' ? 'text-destructive' : 'text-amber-500'
                            }`}>{loan.status}</span>
                    </p>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div className="grid gap-6 md:grid-cols-3">
                <Card className={`md:col-span-2 border shadow-sm relative overflow-hidden group ${loan.status === 'repaid' ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border-emerald-500/20' :
                        loan.status === 'defaulted' ? 'bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20' :
                            'bg-gradient-to-br from-card to-muted/20'
                    }`}>
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-700" />
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <CardDescription className="tracking-wider text-xs uppercase font-medium">
                                Outstanding Balance
                            </CardDescription>
                            <Badge variant="outline" className={`px-2 py-0.5 uppercase tracking-widest text-[10px] ${loan.status === 'active' ? 'border-primary/30 text-primary' : ''
                                }`}>
                                {loan.status === 'active' ? 'IN REPAYMENT' : loan.status}
                            </Badge>
                        </div>
                        <div className="flex items-baseline gap-2">
                            <CardTitle className={`text-4xl sm:text-5xl font-mono tracking-tight ${loan.status === 'repaid' ? 'text-emerald-600' :
                                    loan.status === 'defaulted' ? 'text-destructive' : 'text-foreground'
                                }`}>
                                {formatCurrency(outstanding)}
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Repayment Progress</span>
                                <span className="font-medium">{progressPercent.toFixed(1)}%</span>
                            </div>
                            <Progress value={progressPercent} className={`h-2 ${loan.status === 'repaid' ? 'bg-emerald-500/20 [&>div]:bg-emerald-500' : ''}`} />
                            <div className="flex justify-between text-xs text-muted-foreground pt-1">
                                <span>Paid: {formatCurrency(amountPaid)}</span>
                                <span>Total: {formatCurrency(totalRepayable)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border shadow-sm bg-card">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Next Steps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {loan.status === 'active' || loan.status === 'defaulted' ? (
                            <>
                                <div className="p-3 border rounded-lg bg-muted/30 mb-4">
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">Next Payment</p>
                                    <p className="font-mono text-lg font-bold">{formatCurrency(loan.monthly_installment || 0)}</p>
                                    <p className="text-xs flex items-center gap-1 mt-1 text-primary">
                                        <Calendar className="h-3 w-3" /> Due {loan.next_payment_date ? new Date(loan.next_payment_date).toLocaleDateString() : 'N/A'}
                                    </p>
                                </div>
                                <Button className="w-full justify-start h-12 relative overflow-hidden group shadow-sm" asChild>
                                    <Link href={`/pay/transfer?to_loan=${loan.id}&amount=${loan.monthly_installment}`}>
                                        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-300" />
                                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground/10 mr-3">
                                            <ArrowUpRight className="h-4 w-4" />
                                        </span>
                                        Make Payment
                                    </Link>
                                </Button>
                            </>
                        ) : loan.status === 'repaid' ? (
                            <div className="flex flex-col items-center justify-center p-6 text-center h-full">
                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                                    <ShieldCheck className="h-6 w-6 text-emerald-500" />
                                </div>
                                <p className="font-medium text-emerald-600">Loan Fully Settled</p>
                                <p className="text-sm text-muted-foreground mt-1">Thank you for your prompt repayments.</p>
                            </div>
                        ) : (
                            <div className="flex items-center text-sm text-muted-foreground h-full p-4 text-center">
                                Payments are currently disabled for this loan status.
                            </div>
                        )}

                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="details" className="w-full">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 h-auto p-1 bg-muted/50">
                    <TabsTrigger value="details" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <FileText className="h-4 w-4 mr-2" /> Loan Profile
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Calendar className="h-4 w-4 mr-2" /> Repayment Schedule
                    </TabsTrigger>
                    <TabsTrigger value="history" className="py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        <Clock className="h-4 w-4 mr-2" /> Activity History
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {/* DETAILS TAB */}
                    <TabsContent value="details" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Facility Details</CardTitle>
                                <CardDescription>Comprehensive overview of your loan terms and conditions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Original Principal</p>
                                            <p className="text-lg font-mono font-medium">{formatCurrency(loan.amount)}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Interest Rate</p>
                                            <p className="text-lg font-medium">{loan.interest_rate}% <span className="text-sm font-normal text-muted-foreground block sm:inline leading-none">per month</span></p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Tenor / Duration</p>
                                            <p className="text-lg font-medium">{loan.duration_months} Months</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Disbursement Date</p>
                                            <p className="text-lg font-medium">{new Date(loan.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Expected Maturity Date</p>
                                            <p className="text-lg font-medium">{loan.maturity_date ? new Date(loan.maturity_date).toLocaleDateString() : 'N/A'}</p>
                                        </div>
                                        <Separator />
                                        <div>
                                            <p className="text-sm text-muted-foreground">Monthly Installment</p>
                                            <p className="text-lg font-mono font-medium text-primary">{formatCurrency(loan.monthly_installment || 0)}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SCHEDULE TAB */}
                    <TabsContent value="schedule" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg">Amortization Schedule</CardTitle>
                                <CardDescription>Your expected monthly repayment breakdown.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-muted/10">
                                    <Calendar className="h-10 w-10 text-muted-foreground/50 mb-4" />
                                    <h3 className="text-lg font-medium mb-1">Schedule Generation Pending</h3>
                                    <p className="text-sm text-muted-foreground max-w-sm">
                                        Your detailed month-by-month amortization schedule will appear here once your first repayment cycle begins.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* HISTORY TAB */}
                    <TabsContent value="history" className="m-0 focus-visible:outline-none focus-visible:ring-0">
                        <Card className="border shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">Repayment History</CardTitle>
                                    <Button variant="outline" size="sm">Download Statement</Button>
                                </div>
                                <CardDescription>Record of payments made towards this facility.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {transactions.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2 border rounded-xl bg-muted/10">
                                        <Activity className="h-8 w-8 opacity-20" />
                                        <p>No repayments have been recorded for this loan yet.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {transactions.map((tx) => (
                                            <div key={tx.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:shadow-md transition-shadow">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full flex items-center justify-center border shadow-sm shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                        <ArrowDownLeft className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">Loan Repayment</p>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                            <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                            <span>Ref: {tx.reference}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-mono font-bold tracking-tight text-emerald-500">
                                                        {formatCurrency(tx.amount)}
                                                    </p>
                                                    <Badge variant="outline" className={`text-[10px] mt-1 h-5 uppercase tracking-wider ${tx.status === 'successful' ? 'border-emerald-500/30 text-emerald-500' : 'border-amber-500/30 text-amber-500'
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
                </div>
            </Tabs>
        </div>
    );
}
