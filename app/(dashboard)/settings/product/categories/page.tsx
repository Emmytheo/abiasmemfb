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

const INITIAL_DATA = [
    { id: "cat_1", class_name: "Retail Products", name: "Savings", description: "Standard savings accounts.", status: "active" },
    { id: "cat_2", class_name: "Retail Products", name: "Loans", description: "Personal loan facilities.", status: "active" },
    { id: "cat_3", class_name: "Corporate Products", name: "Current Accounts", description: "Business operating accounts.", status: "active" },
];

export default function ProductCategoriesPage() {
    const [data, setData] = React.useState(INITIAL_DATA);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    // Viewing/Editing State
    const [selectedItem, setSelectedItem] = React.useState<typeof INITIAL_DATA[0] | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newCategory = {
            id: `cat_${Date.now()}`,
            class_name: formData.get("class_name") as string,
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            status: "active"
        };
        setData([...data, newCategory]);
        setIsCreateOpen(false);
    };

    const actionColumn = {
        header: "Actions",
        accessorKey: "id",
        cell: (item: typeof INITIAL_DATA[0]) => (
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
                        <Edit className="mr-2 h-4 w-4" /> Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-destructive">
                        <Trash className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    };

    return (
        <div className="space-y-4">
            <GenericDataTable
                title="Product Categories"
                description="Sub-divisions under product classes."
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
                        <SheetContent className="overflow-y-auto sm:max-w-md p-6">
                            <SheetHeader className="mb-6">
                                <SheetTitle>Create New Category</SheetTitle>
                                <SheetDescription>
                                    Add a new sub-division under a product class.
                                </SheetDescription>
                            </SheetHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="class_name">Parent Class</Label>
                                    <select
                                        id="class_name"
                                        name="class_name"
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="Retail Products">Retail Products</option>
                                        <option value="Corporate Products">Corporate Products</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Category Name</Label>
                                    <Input id="name" name="name" required placeholder="e.g. Savings" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <textarea
                                        id="description"
                                        name="description"
                                        required
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Brief description of the category"
                                    />
                                </div>
                                <div className="pt-4 flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                                    <Button type="submit">Create Category</Button>
                                </div>
                            </form>
                        </SheetContent>
                    </Sheet>
                }
                columns={[
                    { header: "Category Name", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    { header: "Parent Class", accessorKey: "class_name" },
                    { header: "Description", accessorKey: "description" },
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
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{item.class_name}</div>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    </div>
                )}
            />

            {/* View/Edit Modal via Sheet */}
            <Sheet open={isViewOpen} onOpenChange={setIsViewOpen}>
                <SheetContent className="sm:max-w-md overflow-y-auto w-[400px] p-6">
                    <SheetHeader className="mb-6">
                        <SheetTitle>Category Details</SheetTitle>
                        <SheetDescription>
                            View and manage product category parameters.
                        </SheetDescription>
                    </SheetHeader>
                    {selectedItem && (
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Category ID</Label>
                                <Input value={selectedItem.id} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Parent Class</Label>
                                <select
                                    defaultValue={selectedItem.class_name}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="Retail Products">Retail Products</option>
                                    <option value="Corporate Products">Corporate Products</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Category Name</Label>
                                <Input defaultValue={selectedItem.name} />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <textarea
                                    defaultValue={selectedItem.description}
                                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="pt-1">
                                    <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-sm font-medium">
                                        {selectedItem.status}
                                    </span>
                                </div>
                            </div>
                            <div className="pt-6 flex justify-end gap-2 border-t">
                                <Button type="button" variant="outline" onClick={() => setIsViewOpen(false)}>Close</Button>
                                <Button type="submit">Save Changes</Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
