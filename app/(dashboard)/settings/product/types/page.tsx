"use client";
import * as React from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Eye, Edit, Trash, RefreshCw, Layers, Download } from "lucide-react";
import { toast } from "sonner";
import { syncRegistryProductsAction, exportRegistryProductsAction } from "./actions";

import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { useBankProfile } from "@/context/bank-profile-context";

export default function ProductTypesPage() {
    const { activeProfile } = useBankProfile();
    const [data, setData] = React.useState<ProductType[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isSyncing, setIsSyncing] = React.useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const types = await api.getAllProductTypes();
            setData(types);
        } catch (error) {
            console.error("Failed to load product types:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncRegistryProductsAction();
            if (res.success && res.data) {
                const { created, updated, errors } = res.data;
                const msg = `Sync Complete: ${created} created, ${updated} updated.`;
                if (errors > 0) {
                    toast.warning(`${msg} (${errors} errors logged to console)`);
                } else {
                    toast.success(msg);
                }
                fetchData();
            } else {
                toast.error(`Sync Failed: ${res.error}`);
            }
        } catch (err) {
            toast.error("An unexpected error occurred during sync.");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleToggleStatus = async (item: ProductType) => {
        const newStatus = item.status === 'active' ? 'draft' : 'active';
        try {
            setData(prev => prev.map(t => t.id === item.id ? { ...t, status: newStatus as any } : t));
            await api.saveProductType({
                ...item,
                status: newStatus as any
            });
            toast.success(`Product type "${item.name}" is now ${newStatus}`);
        } catch (e: any) {
            setData(prev => prev.map(t => t.id === item.id ? { ...t, status: item.status } : t));
            toast.error(e?.message || "Failed to update status");
        }
    };

    const handleExport = async () => {
        const res = await exportRegistryProductsAction();
        if (res.success) {
            const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeProfile.id}-registry-sdl-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            toast.success("Registry SDL exported successfully.");
        } else {
            toast.error(`Export Failed: ${res.error}`);
        }
    };

    const handleDelete = (id: string) => {
        toast("Are you sure you want to delete this product type?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.deleteProductType(id);
                        setData(prev => prev.filter(item => item.id !== id));
                        toast.success("Product type deleted.");
                    } catch (error) {
                        toast.error("Failed to delete product type.");
                    }
                }
            },
            cancel: {
                label: "Cancel",
                onClick: () => { }
            }
        });
    };
    const actionColumn = {
        header: "Actions",
        accessorKey: "id",
        cell: (item: ProductType) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                        <Link href={`/settings/product/types/${item.id}`}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                        <Link href={`/settings/product/types/${item.id}`}>
                            <Edit className="mr-2 h-4 w-4" /> Edit Type
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    };

    return (
        <div className="space-y-4">
            <GenericDataTable
                title="Product Types"
                description="Specific individual products offered to customers."
                data={data}
                searchPlaceholder="Search product types..."
                searchKey="name"
                actionButton={
                    <div className="flex flex-wrap items-center gap-2 justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={isSyncing}
                            className="h-9 w-full sm:w-auto"
                        >
                            {isSyncing ? (
                                <RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" />
                            ) : (
                                <Layers className="mr-2 h-4 w-4 text-primary" />
                            )}
                            Sync with Core
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleExport}
                            className="h-9 w-full sm:w-auto"
                        >
                            <Download className="mr-2 h-4 w-4 text-primary" />
                            Export SDL
                        </Button>
                        <Button asChild className="shrink-0 h-9 w-full sm:w-auto">
                            <Link href="/settings/product/types/create">
                                <Plus className="mr-2 h-4 w-4" /> Add Type
                            </Link>
                        </Button>
                    </div>
                }
                columns={[
                    { header: "Product Type", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    { header: "Parent Category", accessorKey: "category" },
                    {
                        header: "Description", accessorKey: "description", cell: (item) => {
                            const text = item.description?.replace(/<[^>]*>?/gm, '') || '';
                            return <span className="block max-w-[150px] md:max-w-[250px] lg:max-w-[400px] truncate" title={text}>{text}</span>;
                        }
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <button
                                onClick={() => handleToggleStatus(item)}
                                className="group relative flex items-center gap-1 focus:outline-none transition-transform duration-200 active:scale-95"
                                title={`Click to change status to ${item.status === 'active' ? 'draft' : 'active'}`}
                            >
                                <span 
                                    className={`capitalize cursor-pointer select-none transition-all duration-300 font-semibold px-2.5 py-1 flex items-center gap-1.5 rounded-full text-xs ${
                                        item.status === 'active' 
                                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.1)]' 
                                            : 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-500/20 border border-zinc-500/20 shadow-none'
                                    }`}
                                >
                                    <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                                    {item.status}
                                </span>
                            </button>
                        )
                    },
                    actionColumn
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-primary">{item.name}</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-6 w-6 p-0 -mt-1 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                        <Link href={`/settings/product/types/${item.id}`}>
                                            <Eye className="mr-2 h-4 w-4" /> View Details
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{item.category}</div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{item.description?.replace(/<[^>]*>?/gm, '')}</p>
                    </div>
                )}
            />
        </div>
    );
}
