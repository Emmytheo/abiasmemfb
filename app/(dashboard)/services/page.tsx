"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Service } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Edit, Trash2, Zap, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { GenericDataTable } from "@/components/data-table";

export default function ServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadData() {
        try {
            setLoading(true);
            const data = await api.getAllServices();
            setServices(data || []);
        } catch (err) {
            toast.error("Failed to load services");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this service? It will remove it from the client portal immediately.")) return;
        try {
            await api.deleteService(id);
            toast.success("Service deleted");
            setServices(prev => prev.filter(s => s.id !== id));
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete");
        }
    };

    if (loading && services.length === 0) {
        return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Services</h1>
                    <p className="text-muted-foreground">Manage transactional services like transfers, bill payments, and airtime.</p>
                </div>
                <Button asChild>
                    <Link href="/services/new">
                        <Plus className="mr-2 h-4 w-4" /> New Service
                    </Link>
                </Button>
            </div>

            <GenericDataTable
                title="Service Catalog"
                description="Active services available to clients."
                data={services}
                searchPlaceholder="Search services..."
                searchKey="name"
                columns={[
                    {
                        header: "Name",
                        accessorKey: "name",
                        cell: (item) => (
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-primary" />
                                <span className="font-medium">{item.name}</span>
                            </div>
                        )
                    },
                    {
                        header: "Category",
                        accessorKey: "category",
                        cell: (item) => <span className="capitalize">{item.category}</span>
                    },
                    {
                        header: "Intent",
                        accessorKey: "service_intent",
                        cell: (item) => (
                            <span className="text-xs font-mono text-muted-foreground">
                                {item.service_intent === 'none' ? '—' : item.service_intent}
                            </span>
                        )
                    },
                    {
                        header: "Fee",
                        accessorKey: "fee_type",
                        cell: (item) => (
                            <Badge variant="outline" className="capitalize">
                                {item.fee_type === 'none' ? 'Free' : `${item.fee_type} (${item.fee_value || 0})`}
                            </Badge>
                        )
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
                        header: "Actions",
                        accessorKey: "id",
                        cell: (item) => (
                            <div className="flex items-center gap-2 justify-end">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/services/${item.id}`}>
                                        <Edit className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
