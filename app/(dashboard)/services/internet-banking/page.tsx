"use client";

import { useEffect, useState } from "react";
import { GenericDataTable } from "@/components/data-table";
import { dashboardApi } from "@/lib/dashboard-api/api";
import { Transaction } from "@/lib/dashboard-api/types";
import { Badge } from "@/components/ui/badge";

export default function InternetBankingPage() {
    const [data, setData] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getTransactionsByCategory("Transfer").then((txs) => {
            setData(txs);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8">Loading transfers...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Internet Banking Transfers"
                description="Monitor all local and international transfers."
                data={data}
                searchPlaceholder="Search by reference..."
                searchKey="reference"
                columns={[
                    { header: "Reference", accessorKey: "reference" },
                    { header: "Amount", accessorKey: "amount", cell: (item) => `₦${item.amount.toLocaleString()}` },
                    { header: "Type", accessorKey: "type", cell: (item) => <span className="uppercase text-xs font-bold">{item.type}</span> },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge variant={item.status === 'successful' ? 'default' : item.status === 'pending' ? 'outline' : 'destructive'} className="capitalize">
                                {item.status}
                            </Badge>
                        )
                    },
                    { header: "Date", accessorKey: "created_at", cell: (item) => new Date(item.created_at).toLocaleDateString() },
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.reference}</h3>
                            <Badge variant={item.status === 'successful' ? 'default' : item.status === 'pending' ? 'outline' : 'destructive'} className="capitalize">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="text-xl font-bold mb-1">₦{item.amount.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">User ID: {item.user_id}</p>
                    </div>
                )}
            />
        </div>
    );
}
