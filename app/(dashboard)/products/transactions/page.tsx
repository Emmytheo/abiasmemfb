"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Transaction } from "@/lib/api/types";
import { GenericDataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

export default function TransactionsPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAllTransactions().then(setData).finally(() => setLoading(false));
    }, []);

    const formatNaira = (amount: number) =>
        new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);

    if (loading) return <div className="p-8">Loading transactions...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Transaction Ledger"
                description="Full record of all credits, debits, loan disbursements, and repayments processed through the system."
                data={data}
                searchPlaceholder="Search by reference..."
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
                            <Badge
                                variant={item.type === 'credit' ? 'default' : 'secondary'}
                                className="capitalize"
                            >
                                {item.type}
                            </Badge>
                        )
                    },
                    {
                        header: "Amount",
                        accessorKey: "amount",
                        cell: (item) => (
                            <span className={`font-semibold ${item.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                                {item.type === 'credit' ? '+' : '-'}{formatNaira(item.amount)}
                            </span>
                        )
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge
                                variant={item.status === 'successful' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}
                                className="capitalize"
                            >
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: "Description",
                        accessorKey: "narration",
                        cell: (item) => <span className="text-sm text-muted-foreground">{item.narration || '—'}</span>
                    },
                    {
                        header: "Date",
                        accessorKey: "created_at",
                        cell: (item) => new Date(item.created_at).toLocaleString()
                    },
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-medium capitalize">{item.type}</p>
                                <p className="text-xs font-mono text-muted-foreground mt-1">{item.reference}</p>
                            </div>
                            <Badge variant={item.status === 'successful' ? 'default' : 'destructive'} className="capitalize">
                                {item.status}
                            </Badge>
                        </div>
                        <p className={`text-lg font-bold ${item.type === 'credit' ? 'text-green-600' : 'text-red-500'}`}>
                            {item.type === 'credit' ? '+' : '-'}{formatNaira(item.amount)}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">{item.narration || '—'}</p>
                        <p className="text-xs text-muted-foreground mt-2">{new Date(item.created_at).toLocaleString()}</p>
                    </div>
                )}
            />
        </div>
    );
}
