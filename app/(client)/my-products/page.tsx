"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { api, Account } from "@/lib/api";

export default function MyProductsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // In a real app we would get accounts by user ID. 
                // Since this is mock data, we just get all for the current demo user view.
                const data = await api.getAllAccounts();
                setAccounts(data);
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
                    <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                    <p className="text-muted-foreground mt-1">View and manage your active accounts and assets.</p>
                </div>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Open New Account
                </Button>
            </div>

            {loading ? (
                <p className="text-muted-foreground">Loading accounts...</p>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {accounts.length === 0 ? (
                        <p className="text-muted-foreground col-span-full">You have no active accounts.</p>
                    ) : (
                        accounts.map(acc => (
                            <Card key={acc.id} className="border shadow-sm">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <CardDescription>{acc.account_type}</CardDescription>
                                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${acc.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>{acc.status}</span>
                                    </div>
                                    <CardTitle className="text-2xl">₦{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-sm text-muted-foreground mb-4">Account Number: {acc.account_number}</div>
                                    <Button variant="outline" className="w-full">View Details</Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
