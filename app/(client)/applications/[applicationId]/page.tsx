"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { ProductApplication, ProductType } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, Building, Landmark, Check, XCircle, AlertCircle } from "lucide-react";

function ApplicationDetailContent({ params }: { params: Promise<{ applicationId: string }> }) {
    const resolvedParams = use(params);
    const applicationId = resolvedParams.applicationId;

    const [app, setApp] = useState<ProductApplication | null>(null);
    const [product, setProduct] = useState<ProductType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                // Get user ID directly from Supabase auth (matches how the apply page works)
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const allApps = await api.getUserApplications(user.id);
                const currentApp = allApps.find(a => String(a.id) === String(applicationId));

                if (currentApp) {
                    setApp(currentApp);
                    try {
                        const prodType = await api.getProductTypeById(currentApp.product_type_id);
                        setProduct(prodType);
                    } catch {
                        // Product type might not exist
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [applicationId]);

    if (loading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!app) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
                <p className="text-muted-foreground mb-6">We could not locate the details for this application.</p>
                <Button asChild><Link href="/applications">View All Applications</Link></Button>
            </div>
        );
    }

    const hasWorkflow = product && Array.isArray(product.workflow_stages) && product.workflow_stages.length > 0;
    const workflowStages = hasWorkflow ? product!.workflow_stages : [];
    const currentStageIndex = hasWorkflow ? workflowStages.indexOf(app.workflow_stage || '') : -1;
    const isApproved = app.status === 'approved';
    const isRejected = app.status === 'rejected';

    const refId = typeof app.id === 'string' && app.id.includes('_')
        ? app.id.split('_')[1]?.toUpperCase()
        : String(app.id).substring(0, 8).toUpperCase();

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href="/applications">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Application Tracker</h1>
                    <p className="text-muted-foreground">Monitor the progress of your {product?.name || 'product'} application.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">

                    {/* Workflow visualizer OR simple status */}
                    <Card className="border shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            Status: <span className={`uppercase text-xs font-bold tracking-widest px-2 py-1 rounded border shadow-sm ${isApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                isRejected ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                    'bg-primary/10 text-primary border-primary/20'
                                }`}>{app.status}</span>
                        </h3>

                        {hasWorkflow && workflowStages.length > 0 ? (
                            <div className="space-y-8 relative">
                                {/* Workflow line connecting steps */}
                                <div className="absolute left-4 top-2 bottom-2 w-px bg-border -z-10"></div>

                                {workflowStages.map((stage, idx) => {
                                    const isCompleted = isApproved || isRejected || idx < currentStageIndex;
                                    const isCurrent = !isApproved && !isRejected && idx === currentStageIndex;
                                    const isPendingStep = !isApproved && !isRejected && idx > currentStageIndex;

                                    return (
                                        <div key={stage} className={`flex items-start gap-4 transition-opacity duration-300 ${isPendingStep ? 'opacity-50' : 'opacity-100'}`}>
                                            <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-background shrink-0 shadow-sm ${isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                                                isCurrent ? 'border-primary text-primary' :
                                                    'border-muted text-muted-foreground'
                                                }`}>
                                                {isCompleted ? <Check className="h-4 w-4" /> : isCurrent ? <Clock className="h-4 w-4 animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground"></div>}
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold text-lg ${isCurrent ? 'text-primary' : 'text-foreground'}`}>{stage}</h4>
                                                {isCurrent && <p className="text-sm text-muted-foreground">Currently being processed by our team.</p>}
                                                {isCompleted && <p className="text-sm text-muted-foreground">Completed successfully.</p>}
                                                {isPendingStep && <p className="text-sm text-muted-foreground">Awaiting prior steps.</p>}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="flex items-center gap-4 py-4">
                                {isApproved ? (
                                    <><CheckCircle2 className="h-8 w-8 text-emerald-500" /><div><p className="font-bold text-emerald-600">Your application has been approved!</p><p className="text-sm text-muted-foreground">Your account/loan has been created.</p></div></>
                                ) : isRejected ? (
                                    <><XCircle className="h-8 w-8 text-destructive" /><div><p className="font-bold text-destructive">Your application was not approved.</p><p className="text-sm text-muted-foreground">Please contact support for more information.</p></div></>
                                ) : (
                                    <><Clock className="h-8 w-8 text-amber-500 animate-pulse" /><div><p className="font-bold text-amber-600">Your application is under review</p><p className="text-sm text-muted-foreground">Our team is reviewing your submission.</p></div></>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Submitted Data Review */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-lg">Submitted Information</CardTitle>
                            <CardDescription>The details you provided during the application.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            {app.requested_amount != null && app.requested_amount > 0 && (
                                <div className="sm:col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Requested Limit / Value</p>
                                    <p className="text-2xl font-mono mt-1">₦{app.requested_amount.toLocaleString()}</p>
                                </div>
                            )}

                            {Object.entries(app.submitted_data || {}).map(([key, value]) => {
                                const fieldDef = product?.form_schema?.find((f: any) => f.id === key);
                                const label = fieldDef?.label || key.replace(/_/g, ' ');

                                return (
                                    <div key={key} className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium capitalize">{label}</p>
                                        <p className="text-sm font-semibold truncate" title={String(value)}>
                                            {fieldDef?.type === 'file' ? 'Attached Document' : String(value) || '—'}
                                        </p>
                                    </div>
                                );
                            })}

                            {(!app.submitted_data || Object.keys(app.submitted_data).length === 0) && !app.requested_amount && (
                                <div className="sm:col-span-2 text-center py-6 text-sm text-muted-foreground">
                                    No additional data was submitted with this application.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                </div>

                {/* Sidebar Context */}
                <div className="space-y-6">
                    <Card className="border shadow-sm bg-accent/30 overflow-hidden">
                        <div className="h-24 bg-primary/10 relative border-b">
                            {product?.image_url && <img src={product.image_url} alt="" className="w-full h-full object-cover opacity-60 mix-blend-multiply" />}
                            <div className="absolute -bottom-6 left-6 w-12 h-12 bg-background border-2 border-primary rounded-xl flex items-center justify-center shadow-lg text-primary">
                                {product?.category?.toLowerCase().includes('loan') ? <Building className="h-6 w-6" /> : <Landmark className="h-6 w-6" />}
                            </div>
                        </div>
                        <CardContent className="pt-10">
                            <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-primary mb-1">{product?.category || 'Product'}</CardDescription>
                            <h3 className="font-bold text-lg leading-tight mb-2">{product?.name || 'Unknown Product'}</h3>
                            <p className="text-xs text-muted-foreground">{product?.tagline || ''}</p>

                            <div className="mt-6 pt-4 border-t space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Reference</span>
                                    <span className="font-mono text-xs">{refId}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Applied</span>
                                    <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                                </div>
                                {app.updated_at && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Last Updated</span>
                                        <span className="font-medium">{new Date(app.updated_at).toLocaleDateString()}</span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-4 rounded-xl border bg-card flex gap-3 text-sm text-muted-foreground shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        <p>Our team typically processes documentation and updates the tracker within 2-3 business days.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ApplicationDetailContent params={params} />
        </Suspense>
    );
}
