"use client";

import * as React from "react";
import { GenericDataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Eye, Edit, Trash } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/lib/api";
import { ServiceCategory } from "@/lib/api/types";

export default function ServiceCategoriesPage() {
    const [data, setData] = React.useState<ServiceCategory[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    const [selectedItem, setSelectedItem] = React.useState<ServiceCategory | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const categories = await api.getServiceCategories();
            setData(categories);
        } catch (error) {
            console.error("Failed to load categories:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const newCat = await api.createServiceCategory({
                name: formData.get("name") as string,
                slug: (formData.get("name") as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                description: formData.get("description") as string,
                icon: formData.get("icon") as string,
                status: "active",
            });
            setData([...data, newCat]);
            setIsCreateOpen(false);
            toast.success("Service category created successfully.");
        } catch (error) {
            toast.error("Failed to create service category.");
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedItem) return;

        const formData = new FormData(e.currentTarget);
        try {
            const updated = await api.updateServiceCategory(selectedItem.id, {
                name: formData.get("name") as string,
                slug: (formData.get("name") as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
                description: formData.get("description") as string,
                icon: formData.get("icon") as string,
                status: formData.get("status") as 'active' | 'inactive',
            });
            setData(data.map(item => item.id === updated.id ? updated : item));
            setIsViewOpen(false);
            toast.success("Service category updated successfully.");
        } catch (error) {
            toast.error("Failed to update service category.");
        }
    };

    const handleDelete = (id: string) => {
        toast("Are you sure you want to delete this category?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.deleteServiceCategory(id);
                        setData(prev => prev.filter(item => item.id !== id));
                        toast.success("Service category deleted.");
                    } catch (error) {
                        toast.error("Failed to delete service category.");
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
        cell: (item: ServiceCategory) => (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                        <Eye className="mr-2 h-4 w-4" /> View / Edit
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
                title="Service Categories"
                description="Top-level groups for client services (e.g., Pay Bills, Transfers)."
                data={data}
                searchPlaceholder="Search categories..."
                searchKey="name"
                actionButton={
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button className="shrink-0">
                                <Plus className="mr-2 h-4 w-4" /> Add Category
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto w-full sm:max-w-md p-4 sm:p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Create New Category</SheetTitle>
                                <SheetDescription>
                                    Add a new grouping for services on the client dashboard.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Category Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Utility Bills" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon Name (Lucide)</Label>
                                    <Input id="icon" name="icon" placeholder="tag, wifi, landmark, etc..." />
                                    <p className="text-[10px] text-muted-foreground">Supported: tag, wifi, user, lightbulb, hash, landmark, creditcard, package, briefcase, listordered.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief description of the service category"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create</Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                }
                columns={[
                    { header: "Name", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    { header: "Slug", accessorKey: "slug", cell: (item) => <span className="text-muted-foreground font-mono text-xs">{item.slug}</span> },
                    { header: "Icon", accessorKey: "icon", cell: (item) => <span className="capitalize">{item.icon || '—'}</span> },
                    { header: "Status", accessorKey: "status", cell: (item) => <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">{item.status}</span> },
                    actionColumn
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border bg-card rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between flex-wrap gap-2 items-start mb-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 -mt-2 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                                        <Eye className="mr-2 h-4 w-4" /> View / Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(item.id)}>
                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{item.description}</p>
                        <div className="flex gap-2 text-xs">
                            <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">{item.status}</span>
                            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground border">icon: {item.icon || 'None'}</span>
                        </div>
                    </div>
                )}
            />

            {/* View/Edit Modal via Sheet */}
            <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
                <SheetContent className="overflow-y-auto w-full sm:max-w-md p-4 sm:p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Category Details</SheetTitle>
                        <SheetDescription>
                            View and manage service category parameters.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedItem && (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Category ID</Label>
                                <Input value={selectedItem.id} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Category Name</Label>
                                <Input name="name" defaultValue={selectedItem.name} required />
                            </div>
                            <div className="space-y-2">
                                <Label>Icon</Label>
                                <Input name="icon" defaultValue={selectedItem.icon} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    name="description"
                                    defaultValue={selectedItem.description}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <select
                                    id="status"
                                    name="status"
                                    defaultValue={selectedItem.status}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                            <div className="pt-6 flex justify-end gap-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </form>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
