"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { Promotion } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

export default function AdminPromotionsPage() {
    const [data, setData] = useState<Promotion[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadData() {
        setLoading(true);
        try {
            const promotions = await api.getPromotions();
            setData(promotions);
        } catch (error) {
            toast.error("Failed to load promotions.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this promotion?")) return;
        try {
            await api.deletePromotion(id);
            toast.success("Promotion deleted successfully");
            loadData();
        } catch (error) {
            toast.error("Failed to delete promotion.");
        }
    };

    if (loading && data.length === 0) return <div className="p-8">Loading promotions...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-4 md:p-8 border-b md:border-none">
                <div>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Promotions & Showcases</h1>
                    <p className="text-sm md:text-base text-muted-foreground mt-1">Manage public-facing advertisements and product showcases.</p>
                </div>
                <Button variant="default" className="shadow-lg shadow-primary/20 h-11 md:h-10 w-full md:w-auto" asChild>
                    <Link href="/promotions/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Promotion
                    </Link>
                </Button>
            </div>

            <GenericDataTable
                title="Active Promotions"
                description="List of all configured promotions and showcases for the website."
                data={data}
                searchPlaceholder="Search by title..."
                searchKey="title"
                columns={[
                    {
                        header: "Image",
                        accessorKey: "image",
                        cell: (item) => (
                            <div className="relative w-16 h-10 rounded overflow-hidden">
                                {item.image?.url ? (
                                    <Image src={item.image.url} alt={item.title} fill className="object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center text-xs text-muted-foreground">No img</div>
                                )}
                            </div>
                        )
                    },
                    {
                        header: "Promotion Details",
                        accessorKey: "title",
                        cell: (item) => (
                            <div className="flex flex-col">
                                <span className="font-medium text-sm">{item.title}</span>
                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{item.description}</span>
                            </div>
                        )
                    },
                    {
                        header: "Placement",
                        accessorKey: "placement",
                        cell: (item) => (
                            <Badge variant="outline" className="capitalize">
                                {item.placement}
                            </Badge>
                        )
                    },
                    {
                        header: "Status",
                        accessorKey: "isActive",
                        cell: (item) => (
                            <Badge variant={item.isActive ? 'default' : 'secondary'}>
                                {item.isActive ? 'Active' : 'Inactive'}
                            </Badge>
                        )
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (item) => (
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={`/promotions/${item.id}`}>
                                        <Edit className="h-4 w-4 text-primary" />
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
}
