"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { Account, User } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type EnrichedAccount = Account & { user?: User };

export default function AdminAccountsPage() {
    const [data, setData] = useState<EnrichedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [accounts, users] = await Promise.all([
                    api.getAllAccounts(),
                    api.getAllUsers()
                ]);

                const enriched = accounts.map(acc => ({ 
                    ...acc, 
                    user: users.find(u => u.id === acc.user_id) 
                }));

                setData(enriched);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8">Loading accounts...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Customer Accounts"
                description="Manage and review active customer accounts and balances."
                data={data}
                searchPlaceholder="Search by Account Number..."
                searchKey="account_number"
                columns={[
                    {
                        header: "Account No",
                        accessorKey: "account_number",
                        cell: (item) => <span className="font-mono text-sm tracking-widest">{item.account_number}</span>
                    },
                    {
                        header: "Customer",
                        accessorKey: "user_id",
                        cell: (item) => (
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.user?.full_name || 'Unknown User'}</span>
                                <span className="text-xs text-muted-foreground">{item.user?.email}</span>
                            </div>
                        )
                    },
                    {
                        header: "Type",
                        accessorKey: "account_type",
                        cell: (item) => <span className="font-medium capitalize">{item.account_type.replace('-', ' ')}</span>
                    },
                    {
                        header: "Balance",
                        accessorKey: "balance",
                        cell: (item) => <span className="font-bold">₦{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge variant={item.status === 'active' ? 'default' : item.status === 'dormant' ? 'secondary' : 'destructive'} className="capitalize">
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (item) => (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/products/accounts/${item.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View
                                </Link>
                            </Button>
                        )
                    }
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <div>
                                <h3 className="font-semibold text-lg">{item.account_type}</h3>
                                <p className="text-xs font-mono mt-1 text-primary tracking-widest">{item.account_number}</p>
                            </div>
                            <Badge variant={item.status === 'active' ? 'default' : item.status === 'dormant' ? 'secondary' : 'destructive'} className="capitalize shrink-0">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="flex justify-between items-center text-sm border-y py-3 mb-4">
                            <span className="text-muted-foreground">Balance</span>
                            <span className="font-bold text-lg">₦{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex flex-col gap-1 mb-4 text-xs">
                            <span className="text-muted-foreground">Owner</span>
                            <span className="font-medium">{item.user?.full_name || 'Unknown'} ({item.user?.email})</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/products/accounts/${item.id}`}>Manage</Link>
                            </Button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
