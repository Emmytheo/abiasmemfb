"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductApplication, ProductType, User } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Building, Landmark, Check, X, AlertCircle } from "lucide-react";

function AdminApplicationReviewContent({ params }: { params: Promise<{ applicationId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const applicationId = resolvedParams.applicationId;

    const [app, setApp] = useState<ProductApplication | null>(null);
    const [product, setProduct] = useState<ProductType | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        async function loadData() {
            try {
                // Fetch all to find the specific one
                const allApps = await api.getAllApplications();
                const currentApp = allApps.find(a => a.id === applicationId);

                if (currentApp) {
                    setApp(currentApp);
                    const prodType = await api.getProductTypeById(currentApp.product_type_id);
                    setProduct(prodType);
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [applicationId]);

    const handleAdvanceStage = async () => {
        if (!app || !product) return;
        setActionLoading(true);
        try {
            const currentStageIndex = product.workflow_stages.indexOf(app.workflow_stage);
            const isLastStage = currentStageIndex === product.workflow_stages.length - 1;

            // In a real app we'd dispatch an update to the backend here instead of modifying mock state directly.
            // Since this is a prototype using dummy data without a dedicated updateApplication method, 
            // we will simulate the UI change.

            if (isLastStage) {
                setApp({ ...app, status: 'approved' });
            } else {
                setApp({ ...app, workflow_stage: product.workflow_stages[currentStageIndex + 1] });
            }
        } finally {
            // Fake network delay
            setTimeout(() => setActionLoading(false), 600);
        }
    };

    const handleReject = async () => {
        if (!app) return;
        setActionLoading(true);
        setTimeout(() => {
            setApp({ ...app, status: 'rejected' });
            setActionLoading(false);
        }, 600);
    };

    if (loading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!app || !product) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
                <Button asChild className="mt-4"><Link href="/products/accounts">Go Back</Link></Button>
            </div>
        );
    }

    const currentStageIndex = product.workflow_stages.indexOf(app.workflow_stage);
    const isApproved = app.status === 'approved';
    const isRejected = app.status === 'rejected';
    const nextStage = !isApproved && !isRejected && currentStageIndex < product.workflow_stages.length - 1 ? product.workflow_stages[currentStageIndex + 1] : null;

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href={product.category === 'accounts' ? '/products/accounts' : '/products/loans'}>
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Review Application</h1>
                        <p className="text-muted-foreground font-mono text-sm">Ref ID: {app.id}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Workflow pipeline */}
                    <Card className="border shadow-sm">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-lg">Workflow State</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between relative px-2">
                                <div className="absolute top-1/2 left-8 right-8 h-1 bg-muted -translate-y-1/2 -z-10 rounded-full"></div>

                                {/* Progress Line */}
                                <div
                                    className="absolute top-1/2 left-8 h-1 bg-primary -translate-y-1/2 -z-10 rounded-full transition-all duration-500"
                                    style={{ width: isApproved ? 'calc(100% - 4rem)' : `${(currentStageIndex / (product.workflow_stages.length - 1)) * 100}%`, backgroundColor: isRejected ? 'rgb(239 68 68)' : undefined }}
                                ></div>

                                {product.workflow_stages.map((stage, idx) => {
                                    const isCompleted = isApproved || isRejected || idx < currentStageIndex;
                                    const isCurrent = !isApproved && !isRejected && idx === currentStageIndex;

                                    return (
                                        <div key={stage} className="flex flex-col items-center gap-2">
                                            <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center bg-background shrink-0 transition-colors ${isCompleted ? 'border-primary bg-primary text-primary-foreground' :
                                                isCurrent ? 'border-primary text-primary animate-pulse shadow-[0_0_15px_rgba(var(--primary),0.3)]' :
                                                    'border-muted text-muted-foreground'
                                                }`}>
                                                {isCompleted ? <Check className="h-4 w-4" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider text-center max-w-[80px] ${isCurrent ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {stage}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Submitted Data Review */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-lg">Customer Submission Data</CardTitle>
                            <CardDescription>Verify the information provided below.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            {app.requested_amount && (
                                <div className="sm:col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Requested Limit / Value</p>
                                    <p className="text-2xl font-mono mt-1">₦{app.requested_amount.toLocaleString()}</p>
                                </div>
                            )}

                            {Object.entries(app.submitted_data || {}).map(([key, value]) => {
                                const fieldDef = product.form_schema.find(f => f.id === key);
                                const label = fieldDef?.label || key.replace(/_/g, ' ');

                                return (
                                    <div key={key} className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">{label}</p>
                                        <p className="text-sm font-semibold break-words">
                                            {fieldDef?.type === 'file' ? (
                                                <Button variant="outline" size="sm" className="h-8 mt-1 font-normal"><Check className="h-4 w-4 mr-2 text-emerald-500" /> Document.pdf</Button>
                                            ) : String(value) || '—'}
                                        </p>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Context & Actions */}
                <div className="space-y-6">
                    <Card className="border shadow-sm border-t-4 border-t-primary">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">Review Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isApproved ? (
                                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                    <Check className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Application Approved</h4>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">This application has completed all workflow stages.</p>
                                </div>
                            ) : isRejected ? (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                                    <X className="h-8 w-8 text-destructive mx-auto mb-2" />
                                    <h4 className="font-bold text-destructive">Application Rejected</h4>
                                    <p className="text-xs text-destructive/80 mt-1">The customer has been notified.</p>
                                </div>
                            ) : (
                                <>
                                    <div className="p-4 bg-accent/30 rounded-xl border border-border">
                                        <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Current Step</span>
                                        <p className="font-bold text-lg mt-1">{app.workflow_stage}</p>
                                    </div>

                                    <div className="pt-2 space-y-3">
                                        <Button
                                            className="w-full h-11 shadow-md"
                                            disabled={actionLoading}
                                            onClick={handleAdvanceStage}
                                        >
                                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                            {nextStage ? `Advance to ${nextStage}` : 'Final Approve'}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-11"
                                            disabled={actionLoading}
                                            onClick={handleReject}
                                        >
                                            Reject Application
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="border shadow-sm bg-accent/30">
                        <CardContent className="pt-6">
                            <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-primary mb-1">Product Details</CardDescription>
                            <h3 className="font-bold text-base leading-tight mb-4">{product.name}</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="font-medium capitalize">{product.category}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Interest</span>
                                    <span className="font-medium text-emerald-500">{product.interest_rate}%</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">User ID</span>
                                    <span className="font-mono text-xs">{app.user_id}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}

export default function AdminApplicationReviewPage({ params }: { params: Promise<{ applicationId: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <AdminApplicationReviewContent params={params} />
        </Suspense>
    );
}
