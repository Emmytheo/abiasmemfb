"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { Customer } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, RefreshCw, UserCheck, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

export default function AdminCustomersPage() {
    const [data, setData] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSyncing, setIsSyncing] = useState(false);

    async function loadData() {
        setLoading(true);
        try {
            const customers = await api.getAllCustomers();
            setData(customers);
        } catch (error) {
            toast.error("Failed to load customers.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        toast.info("Starting baseline customer sync...");
        try {
            const res = await fetch('/api/sync/customers', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                toast.success(`Sync complete: ${result.results.customersCreated} new, ${result.results.customersUpdated} updated.`);
                loadData();
            } else {
                toast.error(`Sync failed: ${result.error}`);
            }
        } catch (error) {
            toast.error("An error occurred during synchronization.");
        } finally {
            setIsSyncing(false);
        }
    };

    if (loading && data.length === 0) return <div className="p-8">Loading customer registry...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 md:p-8 border-b md:border-none">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Customer Management</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage core banking profiles and digital channel associations.</p>
                </div>
                <Button onClick={handleSync} disabled={isSyncing} variant="default" className="shadow-lg shadow-primary/20 h-11 md:h-10 w-full md:w-auto">
                    <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? 'Syncing...' : 'Sync from Qore'}
                </Button>
            </div>

            <GenericDataTable
                title="Customer Directory"
                description="Consolidated view of all bank customers synced from the Core Banking System."
                data={data}
                searchPlaceholder="Search by email, name or BVN..."
                searchKey="email"
                columns={[
                    {
                        header: "Customer Name",
                        accessorKey: "lastName",
                        cell: (item) => (
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.firstName} {item.lastName}</span>
                                <span className="text-xs text-muted-foreground">{item.email}</span>
                            </div>
                        )
                    },
                    {
                        header: "Identifiers",
                        accessorKey: "qore_customer_id",
                        cell: (item) => (
                            <div className="flex flex-col text-xs font-mono">
                                <span title="BankOne ID">ID: {item.qore_customer_id}</span>
                                <span title="BVN" className="text-muted-foreground">BVN: {item.bvn}</span>
                            </div>
                        )
                    },
                    {
                        header: "KYC Status",
                        accessorKey: "kyc_status",
                        cell: (item) => (
                            <Badge variant={item.kyc_status === 'active' ? 'default' : item.kyc_status === 'pending' ? 'secondary' : 'destructive'} className="capitalize">
                                {item.kyc_status}
                            </Badge>
                        )
                    },
                    {
                        header: "Identity",
                        accessorKey: "is_associated",
                        cell: (item) => (
                            <div className="flex items-center gap-2">
                                {item.is_associated ? (
                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                        <UserCheck className="h-3 w-3 mr-1" /> Linked
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                        <ShieldAlert className="h-3 w-3 mr-1" /> Shadow
                                    </Badge>
                                )}
                                {item.is_test_account && (
                                    <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-200 font-bold">
                                        TEST
                                    </Badge>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (item) => (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/customers/${item.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View Profile
                                </Link>
                            </Button>
                        )
                    }
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="relative border rounded-2xl p-6 bg-background shadow-sm hover:shadow-lg transition-all duration-300 group overflow-hidden border-primary/5">
                        <div className="absolute top-0 right-0 p-3 flex gap-2">
                             {item.is_test_account && <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 font-bold px-2 py-0 text-[10px]">TEST</Badge>}
                             <Badge variant={item.kyc_status === 'active' ? 'default' : 'secondary'} className="capitalize text-[10px] px-2 py-0">
                                {item.kyc_status}
                             </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary font-black text-2xl shadow-inner">
                                {item.firstName[0]}{item.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-bold text-xl tracking-tight truncate">{item.firstName} {item.lastName}</h3>
                                <p className="text-xs text-muted-foreground truncate font-medium">{item.email}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-muted/30 mb-6 text-sm border border-black/5">
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-black opacity-60">Bank Identifier</p>
                                <p className="font-mono text-xs font-bold text-primary">{item.qore_customer_id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest font-black opacity-60">Identity Status</p>
                                {item.is_associated ? (
                                    <span className="text-[11px] text-emerald-600 flex items-center font-black">
                                        <UserCheck className="h-3 w-3 mr-1" /> AUTH LINKED
                                    </span>
                                ) : (
                                    <span className="text-[11px] text-amber-600 flex items-center font-black">
                                        <ShieldAlert className="h-3 w-3 mr-1" /> SHADOW USER
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="default" size="sm" className="flex-1 shadow-md shadow-primary/20 font-bold" asChild>
                                <Link href={`/customers/${item.id}`}>View Profile</Link>
                            </Button>
                            <Button variant="outline" size="sm" className="w-12 p-0 border-primary/10">
                                <RefreshCw className="h-4 w-4 text-primary" />
                            </Button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
