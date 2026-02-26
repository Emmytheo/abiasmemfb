"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { ProductApplication, ProductType } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type EnrichedApp = ProductApplication & { product?: ProductType };

export default function AdminAccountsPage() {
    const [data, setData] = useState<EnrichedApp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [apps, types] = await Promise.all([
                    api.getAllApplications(),
                    api.getAllProductTypes()
                ]);

                const enriched = apps
                    .map(app => ({ ...app, product: types.find(t => t.id === app.product_type_id) }))
                    .filter(app => app.product?.category === 'accounts');

                setData(enriched);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8">Loading applications...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Customer Account Applications"
                description="Manage and review customer applications for savings and corporate accounts."
                data={data}
                searchPlaceholder="Search by Reference ID..."
                searchKey="id"
                columns={[
                    {
                        header: "Reference",
                        accessorKey: "id",
                        cell: (item) => <span className="font-mono text-xs">{item.id.split('_')[1]?.toUpperCase()}</span>
                    },
                    {
                        header: "Product",
                        accessorKey: "product_type_id",
                        cell: (item) => <span className="font-medium">{item.product?.name || 'Unknown'}</span>
                    },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => (
                            <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize">
                                {item.status}
                            </Badge>
                        )
                    },
                    {
                        header: "Current Stage",
                        accessorKey: "workflow_stage",
                        cell: (item) => <span className="text-xs">{item.workflow_stage}</span>
                    },
                    {
                        header: "Date Applied",
                        accessorKey: "created_at",
                        cell: (item) => new Date(item.created_at).toLocaleDateString()
                    },
                    {
                        header: "Action",
                        accessorKey: "id",
                        cell: (item) => (
                            <Button variant="ghost" size="sm" asChild>
                                <Link href={`/products/applications/${item.id}`}>
                                    <Eye className="h-4 w-4 mr-2" /> View
                                </Link>
                            </Button>
                        )
                    }
                ]}
                gridRenderItem={(item) => (
                    <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow relative">
                        <div className="flex justify-between items-start mb-4 gap-2">
                            <div>
                                <h3 className="font-semibold">{item.product?.name || 'Unknown'}</h3>
                                <p className="text-xs text-muted-foreground font-mono mt-1">Ref: {item.id.split('_')[1]?.toUpperCase()}</p>
                            </div>
                            <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize shrink-0">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="text-sm border-t pt-3 mb-4">
                            <span className="text-muted-foreground block text-xs mb-1">Workflow Stage:</span>
                            <span className="font-medium">{item.workflow_stage}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted-foreground mt-4">
                            <span>{new Date(item.created_at).toLocaleDateString()}</span>
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/products/applications/${item.id}`}>Review</Link>
                            </Button>
                        </div>
                    </div>
                )}
            />
        </div>
    );
}
