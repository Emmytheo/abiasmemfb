"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { ProductApplication, ProductType } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ArrowRight, Clock, CheckCircle2, XCircle } from "lucide-react";

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<ProductApplication[]>([]);
    const [productMap, setProductMap] = useState<Record<string, ProductType>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Get user ID directly from Supabase auth (matches how the apply page works)
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const apps = await api.getUserApplications(user.id);
                setApplications(apps);

                // Load product details for each unique product_type_id
                const uniqueIds = [...new Set(apps.map(a => a.product_type_id))];
                const products: Record<string, ProductType> = {};
                await Promise.all(
                    uniqueIds.map(async (id) => {
                        try {
                            const prod = await api.getProductTypeById(id);
                            if (prod) products[id] = prod;
                        } catch { /* ignore */ }
                    })
                );
                setProductMap(products);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8">
                <div>
                    <div className="h-10 w-64 bg-muted rounded-lg animate-pulse mb-2"></div>
                    <div className="h-5 w-96 bg-muted/50 rounded animate-pulse"></div>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-card rounded-2xl border p-5 h-24 animate-pulse flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-muted"></div>
                                <div className="space-y-2">
                                    <div className="h-5 w-40 bg-muted rounded"></div>
                                    <div className="h-3 w-32 bg-muted/50 rounded"></div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-8 w-24 bg-muted rounded-full"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-10 space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">My Applications</h1>
                <p className="text-muted-foreground mt-1">Track the status of all your product applications.</p>
            </div>

            {applications.length === 0 ? (
                <div className="text-center py-24 border rounded-3xl bg-card relative overflow-hidden">
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6 shadow-inner border border-primary/10">
                            <FileText className="h-10 w-10 text-primary/60" />
                        </div>
                        <h3 className="text-xl font-bold mb-2">No Applications Yet</h3>
                        <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto">You haven&apos;t applied for any products yet. Explore our offerings to get started.</p>
                        <Button asChild className="h-11 px-8 rounded-full shadow-lg shadow-primary/20">
                            <Link href="/explore">Explore Products</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => {
                        const product = productMap[app.product_type_id];
                        const isApproved = app.status === 'approved';
                        const isRejected = app.status === 'rejected';

                        const refId = typeof app.id === 'string' && app.id.includes('_')
                            ? app.id.split('_')[1]?.substring(0, 8).toUpperCase()
                            : String(app.id).substring(0, 8).toUpperCase();

                        return (
                            <Link key={app.id} href={`/applications/${app.id}`} className="block">
                                <div className="bg-card rounded-2xl border p-5 hover:border-primary/40 hover:shadow-lg transition-all group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                isApproved ? 'bg-emerald-500/10 text-emerald-500' :
                                                isRejected ? 'bg-destructive/10 text-destructive' :
                                                'bg-primary/10 text-primary'
                                            }`}>
                                                {isApproved ? <CheckCircle2 className="h-6 w-6" /> :
                                                 isRejected ? <XCircle className="h-6 w-6" /> :
                                                 <Clock className="h-6 w-6" />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{product?.name || 'Product Application'}</p>
                                                <p className="text-xs text-muted-foreground">Ref: {refId} · Applied {new Date(app.created_at).toLocaleDateString()}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            {app.requested_amount != null && app.requested_amount > 0 && (
                                                <p className="text-sm font-bold">₦{app.requested_amount.toLocaleString()}</p>
                                            )}
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                                isApproved ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                isRejected ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                app.status === 'withdrawn' ? 'bg-muted text-muted-foreground border-muted-foreground/20' :
                                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                                {isApproved ? 'Approved' : isRejected ? 'Rejected' : app.status === 'withdrawn' ? 'Withdrawn' : (app.workflow_stage || 'Pending')}
                                            </span>
                                            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
