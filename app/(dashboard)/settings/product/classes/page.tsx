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
import { ProductClass } from "@/lib/api/types";

export default function ProductClassesPage() {
    const [data, setData] = React.useState<ProductClass[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    // Fetch data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const classes = await api.getAllProductClasses();
            setData(classes);
        } catch (error) {
            console.error("Failed to load classes:", error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    // Viewing/Editing State
    const [selectedItem, setSelectedItem] = React.useState<ProductClass | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);

        try {
            const newClass = await api.createProductClass({
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                status: "active",
            });
            setData([...data, newClass]);
            setIsCreateOpen(false);
            toast.success("Product class created successfully.");
        } catch (error) {
            toast.error("Failed to create product class.");
        }
    };

    const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!selectedItem) return;

        const formData = new FormData(e.currentTarget);
        try {
            const updated = await api.updateProductClass(selectedItem.id, {
                name: formData.get("name") as string,
                description: formData.get("description") as string,
                status: formData.get("status") as 'active' | 'inactive',
            });
            setData(data.map(item => item.id === updated.id ? updated : item));
            setIsViewOpen(false);
            toast.success("Product class updated successfully.");
        } catch (error) {
            toast.error("Failed to update product class.");
        }
    };

    const handleDelete = (id: string) => {
        toast("Are you sure you want to delete this class?", {
            action: {
                label: "Delete",
                onClick: async () => {
                    try {
                        await api.deleteProductClass(id);
                        setData(prev => prev.filter(item => item.id !== id));
                        toast.success("Product class deleted.");
                    } catch (error) {
                        toast.error("Failed to delete product class.");
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
        cell: (item: ProductClass) => (
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
                        <Eye className="mr-2 h-4 w-4" /> View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Class
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
                title="Product Classes"
                description="Top-level classification for banking products."
                data={data}
                searchPlaceholder="Search classes..."
                searchKey="name"
                actionButton={
                    <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <SheetTrigger asChild>
                            <Button className="shrink-0">
                                <Plus className="mr-2 h-4 w-4" /> Add Class
                            </Button>
                        </SheetTrigger>
                        <SheetContent className="overflow-y-auto sm:max-w-md p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Create New Class</SheetTitle>
                                <SheetDescription>
                                    Add a new top-level product class.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Class Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Retail Products" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        required
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief description of the product class"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Class</Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                }
                columns={[
                    { header: "Class Name", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    {
                        header: "Description", accessorKey: "description", cell: (item) => {
                            const text = item.description || '';
                            return <span className="block max-w-[150px] md:max-w-[250px] lg:max-w-[400px] truncate" title={text}>{text}</span>;
                        }
                    },
                    { header: "Status", accessorKey: "status", cell: (item) => <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">{item.status}</span> },
                    actionColumn
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold">{item.name}</h3>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-6 w-6 p-0 -mt-1 -mr-2">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => { setSelectedItem(item); setIsViewOpen(true); }}>
                                        <Eye className="mr-2 h-4 w-4" /> View Details
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    </div>
                )}
            />

            {/* View/Edit Modal via Sheet */}
            <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto w-[400px] p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Class Details</SheetTitle>
                        <SheetDescription>
                            View and manage product class parameters.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedItem && (
                        <form onSubmit={handleUpdate} className="space-y-6">
                            <div className="space-y-2">
                                <Label>Class ID</Label>
                                <Input value={selectedItem.id} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Class Name</Label>
                                <Input name="name" defaultValue={selectedItem.name} required />
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
