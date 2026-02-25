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

// Dummy data for classes
const INITIAL_DATA = [
    { id: "cls_1", name: "Retail Products", description: "Products designed for individual consumers.", status: "active", created_at: new Date().toISOString() },
    { id: "cls_2", name: "Corporate Products", description: "Products designed for businesses and orgs.", status: "active", created_at: new Date().toISOString() },
];

export default function ProductClassesPage() {
    const [data, setData] = React.useState(INITIAL_DATA);
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);

    // Viewing/Editing State
    const [selectedItem, setSelectedItem] = React.useState<typeof INITIAL_DATA[0] | null>(null);
    const [isViewOpen, setIsViewOpen] = React.useState(false);

    const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const newClass = {
            id: `cls_${Date.now()}`,
            name: formData.get("name") as string,
            description: formData.get("description") as string,
            status: "active",
            created_at: new Date().toISOString()
        };
        setData([...data, newClass]);
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
                        <Edit className="mr-2 h-4 w-4" /> Edit Class
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
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label>Class ID</Label>
                                <Input value={selectedItem.id} disabled className="bg-muted" />
                            </div>
                            <div className="space-y-2">
                                <Label>Class Name</Label>
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
