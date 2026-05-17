"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GenericDataTable } from "@/components/data-table";
import { Loader2, Plus, Edit, Trash2, Tag, Box, AlertTriangle } from "lucide-react";
import { toast } from "sonner";



export default function ProductTypesPage() {
    const [types, setTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadData() {
        try {
            setLoading(true);
            const data = await api.getAllProductTypes();
            setTypes(data || []);
        } catch (err) {
            toast.error("Failed to load product types");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this product type? It may affect existing applications.")) return;
        try {
            await api.deleteProductType(id);
            toast.success("Product type deleted");
            setTypes(prev => prev.filter(t => t.id !== id));
        } catch (e: any) {
            toast.error(e?.message || "Failed to delete");
        }
    };

    if (loading && types.length === 0) {
        return <div className="flex justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Product Types</h1>
                    <p className="text-muted-foreground">Manage the catalog of financial products available to customers.</p>
                </div>
                <Button asChild>
                    <Link href="/products/types/new">
                        <Plus className="mr-2 h-4 w-4" /> New Product Type
                    </Link>
                </Button>
            </div>

            <GenericDataTable
                title="Product Catalog"
                description="All active and draft product types."
                data={types}
                searchPlaceholder="Search by name or category..."
                searchKey="name"
                columns={[
                    {
                        header: "Name",
                        accessorKey: "name",
                        cell: (item) => (
                            <div className="flex items-center gap-2">
                                <Box className="h-4 w-4 text-muted-foreground" />
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
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge variant={item.status === 'active' ? 'default' : item.status === 'draft' ? 'secondary' : 'destructive'} className="capitalize">
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: "Schema Length",
                        accessorKey: "id",
                        cell: (item) => (
                            <span className="text-muted-foreground">{item.form_schema?.length || 0} fields</span>
                        )
                    },
                    {
                        header: "Actions",
                        accessorKey: "id",
                        cell: (item) => (
                            <div className="flex items-center gap-2 justify-end">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href={`/products/types/${item.id}`}>
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
