"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { api, Transaction } from "@/lib/api";

export default function MyServicesPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const data = await api.getAllTransactions();
                setTransactions(data);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Transaction History</h1>
                <p className="text-muted-foreground mt-1">Review all your past service payments and fund transfers.</p>
            </div>

            <div className="flex items-center justify-between mt-8">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" placeholder="Search transactions..." className="pl-8 bg-background shadow-sm" />
                </div>
                <Button variant="outline" size="sm">
                    <Filter className="mr-2 h-4 w-4" />
                    Filter
                </Button>
            </div>

            <div className="bg-card border rounded-lg shadow-sm">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading transactions...</div>
                ) : (
                    <div className="divide-y relative max-h-[500px] overflow-auto">
                        {transactions.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground">No transactions found.</div>
                        ) : (
                            transactions.map(tx => (
                                <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <h4 className="font-medium text-sm">{tx.category}</h4>
                                        <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                                            <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                                            <span>•</span>
                                            <span>{tx.type}</span>
                                        </div>
                                        <div className="text-[10px] text-muted-foreground mt-1 break-all">Ref: {tx.reference}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`font-bold text-sm ${tx.type === 'credit' ? 'text-emerald-500' : ''}`}>
                                            {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 capitalize">{tx.status}</div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
