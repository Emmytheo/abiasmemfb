"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, History } from "lucide-react";
import { api, Loan } from "@/lib/api";

export default function MyLoansPage() {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await api.getAllLoans();
                setLoans(data);
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
                    <p className="text-muted-foreground mt-1">Manage your active credit facilities and view history.</p>
                </div>
                <Button>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Apply for a Loan
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Loading loans...</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2">
                    {loans.length === 0 ? (
                        <p className="text-muted-foreground col-span-full">You have no active loans.</p>
                    ) : (
                        loans.map(loan => (
                            <Card key={loan.id} className="border shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardDescription>Loan Facility</CardDescription>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${loan.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' : loan.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                                            {loan.status}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl mt-2">₦{loan.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">ID</span>
                                            <span className="font-medium text-xs">#{loan.id.split('-')[0]}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Created On</span>
                                            <span className="font-medium">{new Date(loan.created_at).toLocaleDateString()}</span>
                                        </div>
                                        <div className="pt-4 flex gap-3">
                                            <Button className="flex-1" disabled={loan.status !== 'approved'}>Pay Now</Button>
                                            <Button variant="outline" size="icon"><History className="h-4 w-4" /></Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
