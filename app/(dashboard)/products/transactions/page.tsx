"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/api/types";
import { GenericDataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock, XCircle, DollarSign } from "lucide-react";

const formatNaira = (amount: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

const statusBadge = (status: string) => {
    const map: Record<string, string> = {
        successful: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
        pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
        failed: 'bg-destructive/10 text-destructive border-destructive/30',
        reversed: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    };
    return (
        <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${map[status] || ''}`}>
            {status}
        </span>
    );
};

export default function TransactionsPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        api.getAllTransactions().then(setData).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => data.filter(tx => {
        const matchType = typeFilter === 'all' || tx.type === typeFilter;
        const matchStatus = statusFilter === 'all' || tx.status === statusFilter;
        return matchType && matchStatus;
    }), [data, typeFilter, statusFilter]);

    // Summary stats
    const totalVolume = filtered.reduce((s, t) => s + t.amount, 0);
    const totalCredits = filtered.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
    const totalDebits = filtered.filter(t => t.type !== 'credit').reduce((s, t) => s + t.amount, 0);
    const pendingCount = filtered.filter(t => t.status === 'pending').length;
    const failedCount = filtered.filter(t => t.status === 'failed').length;

    if (loading) return (
        <div className="space-y-4 animate-pulse p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted/40 rounded-xl" />)}
            </div>
            <div className="h-96 bg-muted/40 rounded-xl" />
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Summary Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 px-2 md:px-8 pt-2 md:pt-4">
                {[
                    { label: 'Total Volume', value: formatNaira(totalVolume), icon: DollarSign, color: 'text-primary' },
                    { label: 'Total Credits', value: formatNaira(totalCredits), icon: TrendingUp, color: 'text-emerald-600' },
                    { label: 'Total Debits', value: formatNaira(totalDebits), icon: TrendingDown, color: 'text-foreground' },
                    { label: 'Pending / Failed', value: `${pendingCount} / ${failedCount}`, icon: Clock, color: 'text-amber-600' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <Card key={label} className="border shadow-sm">
                        <CardContent className="pt-4 px-3 md:px-6">
                            <div className="flex justify-between items-start mb-2">
                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold">{label}</p>
                                <Icon className={`h-4 w-4 ${color}`} />
                            </div>
                            <p className={`text-lg font-black ${color}`}>{value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Filter Row */}
            <div className="flex items-center gap-3 flex-wrap px-3 md:px-8">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 w-44 text-sm">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        {['all', 'credit', 'debit', 'transfer', 'disbursement', 'repayment', 'fee', 'interest'].map(v => (
                            <SelectItem key={v} value={v} className="capitalize">{v === 'all' ? 'All Types' : v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 w-44 text-sm">
                        <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                        {['all', 'successful', 'pending', 'failed', 'reversed'].map(v => (
                            <SelectItem key={v} value={v} className="capitalize">{v === 'all' ? 'All Statuses' : v}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {(typeFilter !== 'all' || statusFilter !== 'all') && (
                    <Button variant="ghost" size="sm" className="h-9 text-muted-foreground" onClick={() => { setTypeFilter('all'); setStatusFilter('all'); }}>
                        Clear filters
                    </Button>
                )}
                <p className="text-sm text-muted-foreground ml-auto">{filtered.length} transaction{filtered.length !== 1 ? 's' : ''}</p>
            </div>

            <GenericDataTable
                title="Transaction Ledger"
                description="Full record of all credits, debits, loan disbursements, and repayments."
                data={filtered}
                searchPlaceholder="Search by reference or narration..."
                searchKey="reference"
                columns={[
                    {
                        header: "Reference",
                        accessorKey: "reference",
                        cell: (item) => <span className="font-mono text-xs">{item.reference}</span>
                    },
                    {
                        header: "Type",
                        accessorKey: "type",
                        cell: (item) => (
                            <Badge variant={item.type === 'credit' ? 'default' : 'secondary'} className="capitalize text-[10px]">
                                {item.type}
                            </Badge>
                        )
                    },
                    {
                        header: "Amount",
                        accessorKey: "amount",
                        cell: (item) => (
                            <span className={`font-bold text-sm ${item.type === 'credit' ? 'text-emerald-600' : ''}`}>
                                {item.type === 'credit' ? '+' : '-'}{formatNaira(item.amount)}
                            </span>
                        )
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => statusBadge(item.status)
                    },
                    {
                        header: "Description",
                        accessorKey: "narration",
                        cell: (item) => <span className="text-sm text-muted-foreground truncate max-w-[200px] block">{item.narration || '—'}</span>
                    },
                    {
                        header: "Date",
                        accessorKey: "created_at",
                        cell: (item) => (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {new Date(item.created_at).toLocaleString()}
                            </span>
                        )
                    },
                    {
                        header: "",
                        accessorKey: "actions",
                        cell: (item) => (
                            <Link href={`/products/transactions/${item.id}`} className="text-primary hover:underline text-sm font-medium">
                                View
                            </Link>
                        )
                    }
                ]}
                gridRenderItem={(item) => (
                    <Link href={`/products/transactions/${item.id}`} key={item.id} className="block border rounded-lg p-4 bg-background shadow-sm hover:shadow-md hover:border-primary transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-medium capitalize">{item.type}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-1">{item.reference}</p>
                            </div>
                            {statusBadge(item.status)}
                        </div>
                        <p className={`text-lg font-bold ${item.type === 'credit' ? 'text-emerald-600' : ''}`}>
                            {item.type === 'credit' ? '+' : '-'}{formatNaira(item.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2 truncate">{item.narration || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(item.created_at).toLocaleString()}</p>
                    </Link>
                )}
            />
        </div>
    );
}
