// app/(client)/client-dashboard/transactions/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ShoppingBag, Receipt, Filter } from "lucide-react";
import { api, Transaction } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export default function ClientTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                
                const data = await api.getUserTransactions(user.id);
                setTransactions(data);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, []);

    if (loading) {
        return (
            <div className="p-8 text-center text-muted-foreground animate-pulse">
                Loading transaction history...
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard" className="border shadow-sm bg-background p-2 rounded-xl text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Transaction History</h1>
                    <p className="text-sm text-muted-foreground">Your complete financial activity log.</p>
                </div>
            </div>

            <div className="bg-card rounded-2xl border shadow-sm overflow-hidden">
                <div className="p-4 border-b bg-muted/20 flex justify-between items-center">
                    <h2 className="font-semibold text-sm">All Transactions</h2>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs">
                        <Filter className="w-3.5 h-3.5" /> Filter
                    </Button>
                </div>
                
                <div className="divide-y divide-border">
                    {transactions.length === 0 ? (
                        <div className="p-12 text-center text-muted-foreground text-sm flex flex-col items-center justify-center gap-3">
                            <Receipt className="h-10 w-10 text-muted-foreground/30" />
                            <p>No transactions found.</p>
                        </div>
                    ) : (
                        transactions.map(tx => (
                            <Link href={`/client-dashboard/transactions/${tx.id}`} key={tx.id} className="p-5 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className={`size-12 rounded-full flex items-center justify-center shrink-0 border ${tx.type === 'credit' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-500/10 border-slate-500/20 text-muted-foreground'}`}>
                                        {tx.type === 'credit' ? <ArrowDownLeft className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-sm font-bold group-hover:text-primary transition-colors">{tx.category || 'Transfer'}</p>
                                            {tx.status === 'pending' && <span className="bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Pending</span>}
                                            {tx.status === 'failed' && <span className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Failed</span>}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(tx.created_at).toLocaleString(undefined, {
                                                month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className={`text-base font-bold ${tx.type === 'credit' ? 'text-emerald-500' : ''}`}>
                                        {tx.type === 'credit' ? '+' : '-'}₦{tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                    </p>
                                    {tx.reference && <p className="text-[10px] text-muted-foreground font-mono mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Ref: {tx.reference}</p>}
                                </div>
                            </Link>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
