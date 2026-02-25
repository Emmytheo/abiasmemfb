"use client";

import { useEffect, useState } from "react";
import { GenericDataTable } from "@/components/data-table";
import { dashboardApi } from "@/lib/dashboard-api/api";
import { Account } from "@/lib/dashboard-api/types";
import { Badge } from "@/components/ui/badge";

export default function AccountsPage() {
    const [data, setData] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getAllAccounts().then((accounts) => {
            setData(accounts);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8">Loading accounts...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Customer Accounts"
                description="Manage and view all registered customer accounts across different types."
                data={data}
                searchPlaceholder="Search by account number..."
                searchKey="account_number"
                columns={[
                    { header: "Account Number", accessorKey: "account_number" },
                    { header: "Type", accessorKey: "account_type" },
                    {
                        header: "Balance",
                        accessorKey: "balance",
                        cell: (item) => `₦${item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: "Created",
                        accessorKey: "created_at",
                        cell: (item) => new Date(item.created_at).toLocaleDateString()
                    },
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="font-semibold text-lg">{item.account_number}</h3>
                                <p className="text-sm text-muted-foreground">{item.account_type}</p>
                            </div>
                            <Badge variant={item.status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold mb-2">
                            ₦{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <p className="text-xs text-muted-foreground">User ID: {item.user_id}</p>
                    </div>
                )}
            />
        </div>
    );
}
