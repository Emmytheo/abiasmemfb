"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { ProductApplication, ProductType } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, ArrowRight, Clock, CheckCircle2, XCircle, Plus } from "lucide-react";
import { useScope } from "@/context/scope-context";
import { BankPageHeader } from "@/components/banking/page-header";

export default function MyApplicationsPage() {
    const [applications, setApplications] = useState<ProductApplication[]>([]);
    const [productMap, setProductMap] = useState<Record<string, ProductType>>({});
    const [loading, setLoading] = useState(true);
    const { activeScopeId, activeScope } = useScope();

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
                setApplications(apps);
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
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Origination Tracker`}
                livePill={`${applications.length} Application${applications.length === 1 ? "" : "s"}`}
                liveTone="emerald"
                title="My Product Applications"
                subtitle="Track real-time underwriting, NUBAN provisioning, and credit facility disbursement stages across all your requests."
                actions={
                    <>
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Link href="/explore/accounts"><Plus className="h-3.5 w-3.5" /> Open Account</Link>
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <Link href="/explore/loans"><Plus className="h-3.5 w-3.5" /> Apply for Loan</Link>
                        </Button>
                    </>
                }
            />

            {applications.length === 0 ? (
                <div className="text-center py-20 border border-border/80 rounded-3xl bg-card">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-black mb-1">No Applications Yet</h3>
                        <p className="text-xs text-muted-foreground mb-6 max-w-sm mx-auto">Apply for a Savings, Current, or Credit Facility to track underwriting live.</p>
                        <Button asChild className="h-10 px-6 rounded-xl font-black text-xs">
                            <Link href="/explore/accounts">Explore Accounts</Link>
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {applications.map((app) => {
                        const product = productMap[app.product_type_id];
                        const isApproved = app.status === 'approved';
                        const isRejected = app.status === 'rejected';
                        const isProvisionPending = isApproved && app.workflow_stage !== 'Provisioned';

                        const refId = typeof app.id === 'string' && app.id.includes('_')
                            ? app.id.split('_')[1]?.substring(0, 8).toUpperCase()
                            : String(app.id).substring(0, 8).toUpperCase();

                        return (
                            <Link key={app.id} href={`/applications/${app.id}`} className="block">
                                <div className="bg-card rounded-2xl border p-5 hover:border-primary/40 hover:shadow-lg transition-all group">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${
                                                isProvisionPending ? 'bg-amber-500/10 text-amber-500' :
                                                isApproved ? 'bg-emerald-500/10 text-emerald-500' :
                                                isRejected ? 'bg-destructive/10 text-destructive' :
                                                'bg-primary/10 text-primary'
                                            }`}>
                                                {isProvisionPending ? <Clock className="h-6 w-6 animate-pulse" /> :
                                                 isApproved ? <CheckCircle2 className="h-6 w-6" /> :
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
                                                isProvisionPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                isApproved ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                                isRejected ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                                app.status === 'withdrawn' ? 'bg-muted text-muted-foreground border-muted-foreground/20' :
                                                'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                                {isProvisionPending ? 'Finalising Setup' : isApproved ? 'Approved' : isRejected ? 'Rejected' : app.status === 'withdrawn' ? 'Withdrawn' : (app.workflow_stage || 'Pending')}
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
