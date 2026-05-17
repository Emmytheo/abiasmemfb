"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { Account, User } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Snowflake, Shield, Database } from "lucide-react";
import { Customer } from "@/lib/api/types";

type EnrichedAccount = Account & { customer?: Customer };

export default function AdminAccountsPage() {
    const [data, setData] = useState<EnrichedAccount[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [accounts, customers] = await Promise.all([
                    api.getAllAccounts(),
                    api.getAllCustomers(),
                ]);

                const customerMap = new Map(customers.map(c => [String(c.id), c]));
                const enriched = accounts.map(acc => ({
                    ...acc,
                    customer: typeof acc.customer === 'object'
                        ? acc.customer as any
                        : customerMap.get(String(acc.customer))
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
                        accessorKey: "customer",
                        cell: (item) => {
                            const cust = item.customer as any;
                            const name = cust ? `${cust.firstName || ''} ${cust.lastName || ''}`.trim() : null;
                            return (
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{name || <span className="text-muted-foreground italic">No Customer</span>}</span>
                                    <span className="text-xs text-muted-foreground">{cust?.email}</span>
                                </div>
                            );
                        }
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
                            <div className="flex items-center gap-1.5">
                                <Badge variant={item.status === 'active' ? 'default' : item.status === 'dormant' ? 'secondary' : 'destructive'} className="capitalize text-[10px]">
                                    {item.status}
                                </Badge>
                                {item.is_frozen && <Snowflake className="h-3.5 w-3.5 text-blue-500" aria-label="Frozen" />}
                                {item.pnd_enabled && <Shield className="h-3.5 w-3.5 text-amber-500" aria-label="PND" />}
                                {item.source === 'qore' && <Database className="h-3 w-3 text-muted-foreground" aria-label="Qore CBS" />}
                            </div>
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
                            <span className="font-medium">
                                {(() => { const c = item.customer as any; return c ? `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email : 'No Customer'; })()}
                            </span>
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
