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
import { MoreHorizontal, Plus, Eye, Edit, Trash } from "lucide-react";

const DATA = [
    { id: "type_1", category_name: "Savings", name: "Student Savings Max", description: "Zero maintenance fee for students.", status: "active" },
    { id: "type_2", category_name: "Loans", name: "Salary Advance", description: "Quick loans against upcoming salary.", status: "active" },
    { id: "type_3", category_name: "Current Accounts", name: "SME Plus", description: "For small scale enterprises.", status: "active" },
];

export default function ProductTypesPage() {

    const actionColumn = {
        header: "Actions",
        accessorKey: "id",
        cell: (item: typeof DATA[0]) => (
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
                title="Product Types"
                description="Specific individual products offered to customers."
                data={DATA}
                searchPlaceholder="Search product types..."
                searchKey="name"
                actionButton={
                    <Button asChild className="shrink-0">
                        <Link href="/settings/product/types/create">
                            <Plus className="mr-2 h-4 w-4" /> Add Product Type
                        </Link>
                    </Button>
                }
                columns={[
                    { header: "Product Type", accessorKey: "name", cell: (item) => <span className="font-semibold">{item.name}</span> },
                    { header: "Parent Category", accessorKey: "category_name" },
                    { header: "Description", accessorKey: "description" },
                    { header: "Status", accessorKey: "status", cell: (item) => <span className="capitalize text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">{item.status}</span> },
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
                        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{item.category_name}</div>
                        <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    </div>
                )}
            />
        </div>
    );
}
