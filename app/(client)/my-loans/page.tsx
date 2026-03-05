"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Loader2, TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { Loan, ProductApplication, ProductType } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";

export default function MyLoansPage() {
    const [applications, setApplications] = useState<(ProductApplication & { product?: ProductType })[]>([]);
    const [realLoans, setRealLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (!supaUser) return;
                const user = { id: supaUser.id };
                const [apps, types, loans] = await Promise.all([
                    api.getUserApplications(user.id),
                    api.getAllProductTypes(),
                    api.getUserLoans(user.id),
                ]);

                // Filter for loan products based on financial_terms blockType
                const enrichedApps = apps
                    .map(app => {
                        const product = types.find(t => t.id === app.product_type_id);
                        return { ...app, product };
                    })
                    .filter(app => {
                        const blockType = (app.product?.financial_terms?.[0] as any)?.blockType;
                        return blockType === 'loan-terms';
                    });

                setApplications(enrichedApps);
                setRealLoans(loans);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
                    <p className="text-muted-foreground mt-1">Track your loan applications and active credit.</p>
                </div>
                <Button asChild>
                    <Link href="/explore/loans">
                        <Plus className="mr-2 h-4 w-4" />
                        Apply For Loan
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div className="flex w-full justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="space-y-8">
                    {/* Active Loans Section */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" /> Active Loans
                        </h2>
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {realLoans.length === 0 ? (
                                <div className="col-span-full text-center p-12 border bg-card rounded-xl text-muted-foreground flex flex-col items-center gap-4">
                                    You have no active loans.
                                    <Button asChild variant="outline">
                                        <Link href="/explore/loans">Explore Loan Options</Link>
                                    </Button>
                                </div>
                            ) : (
                                realLoans.map(loan => {
                                    return (
                                        <Card key={loan.id} className="border shadow-sm flex flex-col relative overflow-hidden group hover:border-primary/30 transition-colors">
                                            <CardHeader className="pb-2 flex-1 relative z-10">
                                                <div className="flex justify-between items-start mb-2">
                                                    <CardDescription className="text-xs uppercase tracking-wider font-bold text-primary">
                                                        {loan.product_type_id ? 'Loan Facility' : 'Credit Line'}
                                                    </CardDescription>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm border ${loan.status === 'active' ? 'bg-primary/10 text-primary border-primary/20' :
                                                        loan.status === 'repaid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                            loan.status === 'defaulted' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                                'bg-accent/50 text-muted-foreground border-border'
                                                        }`}>
                                                        {loan.status}
                                                    </span>
                                                </div>
                                                <CardTitle className="text-2xl font-mono tracking-tight text-foreground">
                                                    ₦{(loan.outstanding_balance ?? loan.amount).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                                </CardTitle>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Outstanding Balance
                                                </p>
                                            </CardHeader>
                                            <div className="absolute right-0 bottom-0 top-0 w-32 bg-primary/5 blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
                                            <CardContent className="mt-4 pt-4 border-t bg-muted/10 relative z-10">
                                                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                                                    <span>Interest Rate:</span>
                                                    <span className="font-medium text-foreground">
                                                        {loan.interest_rate}% P.A
                                                    </span>
                                                </div>
                                                {loan.next_payment_date && (
                                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                        <span>Next Payment:</span>
                                                        <span className="font-medium text-foreground">{new Date(loan.next_payment_date).toLocaleDateString()}</span>
                                                    </div>
                                                )}
                                                <Button asChild className="w-full justify-between group/btn shadow-sm" variant="default">
                                                    <Link href={`/my-loans/${loan.id}`}>
                                                        Manage Loan <ArrowRight className="h-4 w-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                                                    </Link>
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Pending Applications Section */}
                    {applications.filter(a => a.status !== 'approved').length > 0 && (
                        <div>
                            <h2 className="text-xl font-semibold mb-4 text-muted-foreground">Pending Applications</h2>
                            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {applications.filter(a => a.status !== 'approved').map(app => (
                                    <Card key={app.id} className="border border-dashed shadow-none flex flex-col bg-muted/5 opacity-80 hover:opacity-100 transition-opacity">
                                        <CardHeader className="pb-2 flex-1">
                                            <div className="flex justify-between items-start mb-2">
                                                <CardDescription className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                                                    {app.product?.name || 'Unknown Loan'}
                                                </CardDescription>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm border ${app.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                    'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                                    }`}>
                                                    {app.status === 'pending' ? app.workflow_stage : app.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <CardTitle className="text-xl font-mono text-muted-foreground">
                                                {app.requested_amount ? `₦${app.requested_amount.toLocaleString()}` : 'Processing'}
                                            </CardTitle>
                                            <p className="text-xs text-muted-foreground mt-1">Requested Amount</p>
                                        </CardHeader>
                                        <CardContent className="mt-4 pt-4 border-t bg-muted/5">
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                                <span>Applied on:</span>
                                                <span className="font-medium text-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <Button asChild variant="outline" className="w-full justify-between group">
                                                <Link href={`/applications/${app.id}`}>
                                                    View Timeline <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                                </Link>
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
