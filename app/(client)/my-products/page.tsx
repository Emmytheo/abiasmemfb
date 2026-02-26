"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ProductApplication, ProductType, User } from "@/lib/api/types";

export default function MyProductsPage() {
    const [applications, setApplications] = useState<(ProductApplication & { product?: ProductType })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const user = await api.getCurrentUser();

                if (!user) {
                    return;
                }

                const [apps, types] = await Promise.all([
                    api.getUserApplications(user.id),
                    api.getAllProductTypes()
                ]);

                // Filter for "accounts" category and attach product data
                const enrichedApps = apps
                    .map(app => {
                        const product = types.find(t => t.id === app.product_type_id);
                        return { ...app, product };
                    })
                    .filter(app => app.product?.category === 'accounts');

                setApplications(enrichedApps);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
                    <p className="text-muted-foreground mt-1">Track your account applications and active assets.</p>
                </div>
                <Button asChild>
                    <Link href="/explore/accounts">
                        <Plus className="mr-2 h-4 w-4" />
                        Explore Accounts
                    </Link>
                </Button>
            </div>

            {loading ? (
                <div className="flex w-full justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {applications.length === 0 ? (
                        <div className="col-span-full text-center p-12 border bg-card rounded-xl text-muted-foreground flex flex-col items-center gap-4">
                            You have no active accounts or pending applications.
                            <Button asChild variant="outline">
                                <Link href="/explore/accounts">Browse Available Accounts</Link>
                            </Button>
                        </div>
                    ) : (
                        applications.map(app => (
                            <Card key={app.id} className="border shadow-sm flex flex-col">
                                <CardHeader className="pb-2 flex-1">
                                    <div className="flex justify-between items-start mb-2">
                                        <CardDescription className="text-xs uppercase tracking-wider font-bold text-primary">
                                            {app.product?.name || 'Unknown Product'}
                                        </CardDescription>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm border ${app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                            app.status === 'rejected' ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                'bg-accent/50 text-muted-foreground border-border'
                                            }`}>
                                            {app.status === 'pending' ? app.workflow_stage : app.status}
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl font-mono">
                                        {/* Mocking an account balance for approved ones or showing requested deposit */}
                                        {app.status === 'approved' ? '₦150,000.00' : (
                                            app.requested_amount ? `₦${app.requested_amount.toLocaleString()}` : 'Processing...'
                                        )}
                                    </CardTitle>
                                    {app.status === 'approved' && (
                                        <p className="text-xs text-muted-foreground font-mono mt-1">AC: 00{Math.floor(Math.random() * 90000000) + 10000000}</p>
                                    )}
                                </CardHeader>
                                <CardContent className="mt-4 pt-4 border-t bg-muted/10">
                                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                                        <span>Applied on:</span>
                                        <span className="font-medium text-foreground">{new Date(app.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <Button asChild variant="outline" className="w-full justify-between group">
                                        <Link href={`/applications/${app.id}`}>
                                            View Details <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
