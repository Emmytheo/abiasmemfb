"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GenericDataTable } from "@/components/data-table";
import { api } from "@/lib/api";
import { ProductApplication, ProductType, Loan } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, TrendingUp, RefreshCw, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type EnrichedApp = ProductApplication & { product?: ProductType };

export default function AdminLoansPage() {
    const [applications, setApplications] = useState<EnrichedApp[]>([]);
    const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const [apps, types, loans] = await Promise.all([
                    api.getAllApplications(),
                    api.getAllProductTypes(),
                    api.getAllLoans(),
                ]);

                // Filter using blockType on financial_terms — reliable regardless of category naming
                const enriched = apps
                    .map(app => ({ ...app, product: types.find(t => t.id === app.product_type_id) }))
                    .filter(app => (app.product?.financial_terms?.[0] as any)?.blockType === 'loan-terms');

                setApplications(enriched);
                setActiveLoans(loans.filter(l => l.status === 'active' || l.status === 'defaulted' || l.status === 'under_review'));
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="p-8 text-muted-foreground animate-pulse">Loading loan data...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Active Loans Summary */}
            {activeLoans.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Card className="bg-card border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" /> Active Loans
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{activeLoans.filter(l => l.status === 'active').length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <RefreshCw className="h-4 w-4 text-amber-500" /> Under Review
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{activeLoans.filter(l => l.status === 'under_review').length}</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-card border shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm text-muted-foreground font-medium flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-destructive" /> Defaulted
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold text-destructive">{activeLoans.filter(l => l.status === 'defaulted').length}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Applications Table */}
            <GenericDataTable
                title="Customer Loan Applications"
                description="Manage and review customer applications for loans and credit facilities."
                data={applications}
                searchPlaceholder="Search by Reference ID..."
                searchKey="id"
                columns={[
                    {
                        header: "Reference",
                        accessorKey: "id",
                        cell: (item) => <span className="font-mono text-xs">{String(item.id).slice(0, 8).toUpperCase()}</span>
                    },
                    {
                        header: "Product",
                        accessorKey: "product_type_id",
                        cell: (item) => <span className="font-medium">{item.product?.name || 'Unknown'}</span>
                    },
                    {
                        header: "Requested",
                        accessorKey: "requested_amount",
                        cell: (item) => <span className="font-mono">₦{item.requested_amount?.toLocaleString() || 'N/A'}</span>
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
                                <p className="text-xs text-muted-foreground font-mono mt-1">Ref: {String(item.id).slice(0, 8).toUpperCase()}</p>
                            </div>
                            <Badge variant={item.status === 'approved' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'} className="capitalize shrink-0">
                                {item.status}
                            </Badge>
                        </div>
                        <div className="text-2xl font-bold mb-3">
                            ₦{item.requested_amount?.toLocaleString() || '0'}
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
