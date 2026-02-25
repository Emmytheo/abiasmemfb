"use client";

import { useEffect, useState } from "react";
import { GenericDataTable } from "@/components/data-table";
import { dashboardApi } from "@/lib/dashboard-api/api";
import { Loan } from "@/lib/dashboard-api/types";
import { Badge } from "@/components/ui/badge";

export default function LoansPage() {
    const [data, setData] = useState<Loan[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        dashboardApi.getAllLoans().then((loans) => {
            setData(loans);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8">Loading loans...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <GenericDataTable
                title="Customer Loans"
                description="View and manage all active, pending, and past customer loans."
                data={data}
                searchPlaceholder="Search by status..."
                searchKey="status"
                columns={[
                    { header: "Amount", accessorKey: "amount", cell: (item) => `₦${item.amount.toLocaleString()}` },
                    { header: "Interest Rate", accessorKey: "interest_rate", cell: (item) => `${item.interest_rate}%` },
                    { header: "Duration", accessorKey: "duration_months", cell: (item) => `${item.duration_months} Months` },
                    {
                        header: "Status",
                        accessorKey: "status",
                        cell: (item) => {
                            const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                                approved: "default",
                                pending: "outline",
                                repaid: "secondary",
                                rejected: "destructive"
                            };
                            return (
                                <Badge variant={variants[item.status] || "default"} className="capitalize">
                                    {item.status}
                                </Badge>
                            );
                        }
                    },
                    {
                        header: "Created",
                        accessorKey: "created_at",
                        cell: (item) => new Date(item.created_at).toLocaleDateString()
                    },
                ]}
                gridRenderItem={(item) => {
                    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
                        approved: "default",
                        pending: "outline",
                        repaid: "secondary",
                        rejected: "destructive"
                    };
                    return (
                        <div key={item.id} className="border rounded-lg p-4 bg-background shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-semibold text-xl">₦{item.amount.toLocaleString()}</h3>
                                    <p className="text-sm text-muted-foreground">{item.interest_rate}% for {item.duration_months} months</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <Badge variant={variants[item.status]} className="capitalize">
                                    {item.status}
                                </Badge>
                                <div className="text-xs text-muted-foreground">ID: {item.user_id}</div>
                            </div>
                        </div>
                    )
                }}
            />
        </div>
    );
}
