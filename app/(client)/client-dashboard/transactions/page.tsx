// app/(client)/client-dashboard/transactions/page.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowDownLeft, ArrowUpRight, ShoppingBag, Receipt, Filter, X, Search, ChevronDown } from "lucide-react";
import { api, Transaction } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const formatNaira = (n: number) => `₦${n.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

// Group transactions by date string
function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {};
    for (const tx of txs) {
        const key = new Date(tx.created_at).toLocaleDateString('en-NG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (!groups[key]) groups[key] = [];
        groups[key].push(tx);
    }
    return groups;
}

const TYPE_FILTERS = [
    { label: 'All', value: 'all' },
    { label: 'Credits', value: 'credit' },
    { label: 'Debits', value: 'debit' },
    { label: 'Transfers', value: 'transfer' },
    { label: 'Repayments', value: 'repayment' },
];

const STATUS_COLORS: Record<string, string> = {
    successful: 'border-emerald-500/30 text-emerald-500',
    pending: 'border-amber-500/30 text-amber-500',
    failed: 'border-red-500/30 text-red-500',
    reversed: 'border-blue-500/30 text-blue-500',
};

export default function ClientTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');

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

    const filtered = useMemo(() => {
        return transactions.filter(tx => {
            const matchType = typeFilter === 'all' || tx.type === typeFilter;
            const q = search.toLowerCase();
            const matchSearch = !q ||
                tx.reference?.toLowerCase().includes(q) ||
                tx.narration?.toLowerCase().includes(q) ||
                tx.category?.toLowerCase().includes(q);
            return matchType && matchSearch;
        });
    }, [transactions, typeFilter, search]);

    const grouped = useMemo(() => groupByDate(filtered), [filtered]);

    // Summary stats
    const totalCredits = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalDebits = filtered.filter(t => t.type !== 'credit').reduce((s, t) => s + t.amount, 0);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse p-4 px-3 mx-auto max-w-7xl">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-16 bg-muted/40 rounded-xl" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 px-3 mx-auto max-w-7xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/client-dashboard" className="border shadow-sm bg-background p-2 rounded-xl text-muted-foreground hover:text-primary transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Transaction History</h1>
                    <p className="text-sm text-muted-foreground">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs text-emerald-600 uppercase tracking-widest font-bold mb-1">Total Inflow</p>
                    <p className="text-xl font-black text-emerald-600">{formatNaira(totalCredits)}</p>
                </div>
                <div className="bg-muted/50 border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">Total Outflow</p>
                    <p className="text-xl font-black">{formatNaira(totalDebits)}</p>
                </div>
            </div>

            {/* Search + Filter bar */}
            <div className="space-y-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by reference, narration…"
                        className="pl-9 h-10 bg-background"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setTypeFilter(f.value)}
                            className={`shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full border transition-all ${typeFilter === f.value ? 'bg-primary text-primary-foreground border-primary shadow-sm' : 'bg-background border-border text-muted-foreground hover:text-foreground'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grouped Transactions */}
            {filtered.length === 0 ? (
                <div className="bg-card rounded-2xl border p-12 text-center flex flex-col items-center gap-3">
                    <Receipt className="h-10 w-10 text-muted-foreground/30" />
                    <p className="text-muted-foreground text-sm">
                        {search || typeFilter !== 'all' ? 'No transactions match your filters.' : 'No transactions found.'}
                    </p>
                    {(search || typeFilter !== 'all') && (
                        <Button variant="outline" size="sm" onClick={() => { setSearch(''); setTypeFilter('all'); }}>
                            <X className="h-3.5 w-3.5 mr-1.5" /> Clear Filters
                        </Button>
                    )}
                </div>
            ) : (
                Object.entries(grouped).map(([date, txs]) => (
                    <div key={date}>
                        <div className="flex items-center gap-3 mb-2">
                            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{date}</p>
                            <div className="flex-1 h-px bg-border" />
                            <p className="text-xs text-muted-foreground">{txs.length}</p>
                        </div>
                        <div className="bg-card rounded-2xl border shadow-sm overflow-hidden divide-y">
                            {txs.map(tx => {
                                const isCredit = tx.type === 'credit';
                                return (
                                    <Link
                                        key={tx.id}
                                        href={`/client-dashboard/transactions/${tx.id}`}
                                        className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors cursor-pointer group"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`size-10 rounded-full flex items-center justify-center shrink-0 border ${isCredit ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-slate-500/10 border-slate-500/20 text-muted-foreground'}`}>
                                                {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-bold group-hover:text-primary transition-colors truncate">
                                                        {tx.narration || tx.category || tx.type}
                                                    </p>
                                                    {tx.status !== 'successful' && (
                                                        <Badge variant="outline" className={`text-[9px] uppercase tracking-wider h-4 px-1.5 shrink-0 ${STATUS_COLORS[tx.status] || ''}`}>
                                                            {tx.status}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono truncate">
                                                    {new Date(tx.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                                                    {tx.reference && ` · ${tx.reference}`}
                                                </p>
                                            </div>
                                        </div>
                                        <p className={`text-sm font-bold shrink-0 ml-3 ${isCredit ? 'text-emerald-500' : ''}`}>
                                            {isCredit ? '+' : '-'}{formatNaira(tx.amount)}
                                        </p>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
