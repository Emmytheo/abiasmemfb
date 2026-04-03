"use client";

import * as React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, LayoutGrid, List } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

interface Column<T> {
    header: string;
    accessorKey: keyof T | string;
    cell?: (item: T) => React.ReactNode;
}

interface GenericDataTableProps<T> {
    title: string;
    description: string;
    data: T[];
    columns: Column<T>[];
    gridRenderItem?: (item: T) => React.ReactNode;
    searchPlaceholder?: string;
    searchKey?: keyof T;
    actionButton?: React.ReactNode;
}

export function GenericDataTable<T extends { id: string | number }>({
    title,
    description,
    data,
    columns,
    gridRenderItem,
    searchPlaceholder = "Search...",
    searchKey,
    actionButton,
}: GenericDataTableProps<T>) {
    const [searchQuery, setSearchQuery] = React.useState("");
    const isMobile = useIsMobile();
    const [viewMode, setViewMode] = React.useState<string>("list");
    
    // Pagination state
    const [pageSize, setPageSize] = React.useState(10);
    const [currentPage, setCurrentPage] = React.useState(1);
 
    React.useEffect(() => {
        if (gridRenderItem) {
            setViewMode(isMobile ? "grid" : "list");
        }
    }, [isMobile, gridRenderItem]);
 
    const filteredData = React.useMemo(() => {
        if (!searchQuery || !searchKey) return data;
        return data.filter((item) => {
            const val = item[searchKey];
            if (typeof val === "string") {
                return val.toLowerCase().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    }, [data, searchQuery, searchKey]);

    // Reset to page 1 when search query changes
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    const totalPages = Math.ceil(filteredData.length / pageSize);
    const paginatedData = React.useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return filteredData.slice(start, start + pageSize);
    }, [filteredData, currentPage, pageSize]);

    return (
        <Card className="w-full bg-background/50 backdrop-blur border-border/50 shadow-transparent border-0">
            <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight text-primary">
                            {title}
                        </CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={searchPlaceholder}
                                className="pl-8 bg-background max-w-[200px] md:max-w-none"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        {actionButton}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
                    <div className="flex items-center justify-between mb-4">
                        <div className="text-sm text-muted-foreground">
                            Showing {Math.min(filteredData.length, (currentPage - 1) * pageSize + 1)} to {Math.min(filteredData.length, currentPage * pageSize)} of {filteredData.length} records
                        </div>
                        {gridRenderItem && (
                            <TabsList className="grid w-[120px] grid-cols-2">
                                <TabsTrigger value="list">
                                    <List className="h-4 w-4" />
                                </TabsTrigger>
                                <TabsTrigger value="grid">
                                    <LayoutGrid className="h-4 w-4" />
                                </TabsTrigger>
                            </TabsList>
                        )}
                    </div>
 
                    <TabsContent value="list" className="m-0 border rounded-md overflow-hidden bg-background">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    {columns.map((col, index) => (
                                        <TableHead key={index}>{col.header}</TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginatedData.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedData.map((item) => (
                                        <TableRow key={item.id}>
                                            {columns.map((col, index) => (
                                                <TableCell key={index}>
                                                    {col.cell
                                                        ? col.cell(item)
                                                        : String(
                                                            // @ts-ignore
                                                            col.accessorKey.split(".").reduce((acc, part) => acc && acc[part], item)
                                                        )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
 
                    {gridRenderItem && (
                        <TabsContent value="grid" className="m-0">
                            {paginatedData.length === 0 ? (
                                <div className="h-48 border rounded-md flex items-center justify-center text-muted-foreground bg-background">
                                    No results.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {paginatedData.map(gridRenderItem)}
                                </div>
                            )}
                        </TabsContent>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 py-4 mt-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <div className="flex items-center gap-1">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    // Logic to show a window of pages
                                    let pageNum = i + 1;
                                    if (totalPages > 5 && currentPage > 3) {
                                        pageNum = currentPage - 2 + i;
                                        if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                                    }
                                    
                                    if (pageNum <= 0 || pageNum > totalPages) return null;

                                    return (
                                        <Button
                                            key={pageNum}
                                            variant={currentPage === pageNum ? "default" : "outline"}
                                            size="sm"
                                            className="w-9 h-9"
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </Button>
                                    );
                                })}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </Tabs>
            </CardContent>
        </Card>
    );
}
