"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductApplication, ProductType, Account } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, X, AlertCircle, Clock, CheckCircle2, XCircle, Banknote, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

// Generate a pseudo-random account number
function generateAccountNumber() {
    const prefix = "30"; // Abia MFB prefix
    const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
    return prefix + rest;
}

function AdminApplicationReviewContent({ params }: { params: Promise<{ applicationId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const applicationId = resolvedParams.applicationId;

    const [app, setApp] = useState<ProductApplication | null>(null);
    const [product, setProduct] = useState<ProductType | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                const allApps = await api.getAllApplications();
                const currentApp = allApps.find(a => String(a.id) === String(applicationId));

                if (currentApp) {
                    setApp(currentApp);
                    try {
                        const prodType = await api.getProductTypeById(currentApp.product_type_id);
                        setProduct(prodType);
                    } catch {
                        // Product type might not be findable — proceed with null product
                    }
                }
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [applicationId]);

    const hasWorkflow = product && Array.isArray(product.workflow_stages) && product.workflow_stages.length > 0;
    const workflowStages = hasWorkflow ? product!.workflow_stages : [];
    const currentStageIndex = hasWorkflow ? workflowStages.indexOf(app?.workflow_stage || '') : -1;
    const isLastStage = hasWorkflow ? currentStageIndex >= workflowStages.length - 1 : true;

    const isApproved = app?.status === 'approved';
    const isRejected = app?.status === 'rejected';
    const isPending = app?.status === 'pending';

    const nextStage = hasWorkflow && !isApproved && !isRejected && currentStageIndex < workflowStages.length - 1
        ? workflowStages[currentStageIndex + 1]
        : null;

    // Determine the product category for account vs loan creation reliably via blocks
    const financialBlocks = product?.financial_terms || [];
    const isLoanProduct = financialBlocks.some((t: any) => t.blockType === 'loan-terms');

    const handleAdvanceStage = async () => {
        if (!app) return;
        setActionLoading(true);
        setActionError(null);

        try {
            if (isLastStage || !hasWorkflow) {
                const updatedApp = await api.updateApplication(String(app.id), {
                    status: 'approved',
                    workflow_stage: hasWorkflow ? workflowStages[workflowStages.length - 1] : 'Approved',
                });
                setApp(updatedApp);
                toast.success("Application approved and provisions actively triggering on backend.");
            } else {
                // Advance to next workflow stage
                const nextStageName = workflowStages[currentStageIndex + 1];
                const updatedApp = await api.updateApplication(String(app.id), {
                    workflow_stage: nextStageName,
                });
                setApp(updatedApp);
                toast.success(`Advanced to "${nextStageName}"`);
            }
        } catch (e: any) {
            console.error("Advance stage error:", e);
            setActionError(e?.message || "Failed to update application.");
            toast.error("Failed to process application.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!app) return;
        setActionLoading(true);
        setActionError(null);
        try {
            const updatedApp = await api.updateApplication(String(app.id), {
                status: 'rejected',
            });
            setApp(updatedApp);
            toast.success("Application rejected.");
        } catch (e: any) {
            console.error("Reject error:", e);
            setActionError(e?.message || "Failed to reject application.");
            toast.error("Failed to reject application.");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex w-full justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!app) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Application Not Found</h2>
                <p className="text-muted-foreground text-sm mb-4">The application you're looking for doesn't exist or may have been deleted.</p>
                <Button asChild><Link href="/products/applications">Go Back</Link></Button>
            </div>
        );
    }

    const activeTerms = product?.financial_terms?.find((t: any) =>
        t.blockType === (isLoanProduct ? 'loan-terms' : 'savings-terms')
    ) as any;
    const interestRate = activeTerms?.interest_rate || 0;

    return (
        <div className="max-w-5xl mx-2 sm:mx-auto space-y-6 animate-in fade-in duration-500 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/products/applications">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Review Application</h1>
                        <p className="text-muted-foreground font-mono text-sm">Ref: {String(app.id).substring(0, 12)}</p>
                    </div>
                </div>
                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider border ${isApproved ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' :
                        isRejected ? 'bg-destructive/10 text-destructive border-destructive/30' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/30'
                    }`}>
                    {isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Workflow Pipeline — only show if product has workflow stages */}
                    {hasWorkflow && workflowStages.length > 1 ? (
                        <Card className="border shadow-sm">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    Workflow Progress
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between relative px-2">
                                    <div className="absolute top-1/2 left-8 right-8 h-1 bg-muted -translate-y-1/2 -z-10 rounded-full"></div>

                                    {/* Progress Line */}
                                    <div
                                        className="absolute top-1/2 left-8 h-1 -translate-y-1/2 -z-10 rounded-full transition-all duration-500"
                                        style={{
                                            width: isApproved ? 'calc(100% - 4rem)' : `${Math.max(0, (currentStageIndex / Math.max(1, workflowStages.length - 1)) * 100)}%`,
                                            backgroundColor: isRejected ? 'rgb(239 68 68)' : 'hsl(var(--primary))'
                                        }}
                                    ></div>

                                    {workflowStages.map((stage, idx) => {
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
                    ) : (
                        /* No workflow stages — show simple status card */
                        <Card className="border shadow-sm">
                            <CardHeader className="bg-muted/30 border-b">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-primary" />
                                    Application Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-4">
                                    {isApproved ? (
                                        <><CheckCircle2 className="h-8 w-8 text-emerald-500" /><span className="text-lg font-bold text-emerald-600">Approved</span></>
                                    ) : isRejected ? (
                                        <><XCircle className="h-8 w-8 text-destructive" /><span className="text-lg font-bold text-destructive">Rejected</span></>
                                    ) : (
                                        <><Clock className="h-8 w-8 text-amber-500 animate-pulse" /><span className="text-lg font-bold text-amber-600">Pending Review</span></>
                                    )}
                                </div>
                                {!hasWorkflow && isPending && (
                                    <p className="text-xs text-muted-foreground mt-3">This product has no multi-step workflow. You can directly approve or reject.</p>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Submitted Data Review */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/20">
                            <CardTitle className="text-lg">Customer Submission Data</CardTitle>
                            <CardDescription>Verify the information provided below.</CardDescription>
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
                                        <p className="text-sm font-semibold break-words">
                                            {fieldDef?.type === 'file' ? (
                                                <Button variant="outline" size="sm" className="h-8 mt-1 font-normal"><Check className="h-4 w-4 mr-2 text-emerald-500" /> Document.pdf</Button>
                                            ) : String(value) || '—'}
                                        </p>
                                    </div>
                                );
                            })}

                            {(!app.submitted_data || Object.keys(app.submitted_data).length === 0) && !app.requested_amount && (
                                <div className="sm:col-span-2 text-center py-6 text-sm text-muted-foreground">
                                    No additional data submitted with this application.
                                </div>
                            )}
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
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400">Application Approved</h4>
                                    <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1">
                                        {isLoanProduct ? 'A loan has been created for the customer.' :
                                            'An account has been created for the customer.'}
                                    </p>
                                </div>
                            ) : isRejected ? (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
                                    <XCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
                                    <h4 className="font-bold text-destructive">Application Rejected</h4>
                                    <p className="text-xs text-destructive/80 mt-1">This application has been denied.</p>
                                </div>
                            ) : (
                                <>
                                    {hasWorkflow && (
                                        <div className="p-4 bg-accent/30 rounded-xl border border-border">
                                            <span className="text-xs text-muted-foreground uppercase tracking-widest font-bold">Current Step</span>
                                            <p className="font-bold text-lg mt-1">{app.workflow_stage || 'Submitted'}</p>
                                        </div>
                                    )}

                                    {actionError && (
                                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-xs flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                            <span>{actionError}</span>
                                        </div>
                                    )}

                                    <div className="pt-2 space-y-3">
                                        <Button
                                            className="w-full h-11 shadow-md"
                                            disabled={actionLoading}
                                            onClick={handleAdvanceStage}
                                        >
                                            {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                            {nextStage ? `Advance to "${nextStage}"` : (
                                                <>
                                                    {/* <Banknote className="mr-2 h-4 w-4" /> */}
                                                    Final Approve & Create {isLoanProduct ? 'Loan' : 'Account'}
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive h-11"
                                            disabled={actionLoading}
                                            onClick={handleReject}
                                        >
                                            <X className="mr-2 h-4 w-4" />
                                            Reject Application
                                        </Button>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Product & User Context */}
                    <Card className="border shadow-sm bg-accent/30">
                        <CardContent className="pt-6">
                            <CardDescription className="uppercase tracking-widest text-[10px] font-bold text-primary mb-1">Product Details</CardDescription>
                            <h3 className="font-bold text-base leading-tight mb-4">{product?.name || 'Unknown Product'}</h3>

                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Category</span>
                                    <span className="font-medium capitalize">{product?.category || '—'}</span>
                                </div>
                                {interestRate > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Interest</span>
                                        <span className="font-medium text-emerald-500">{interestRate}%</span>
                                    </div>
                                )}
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">User ID</span>
                                    <span className="font-mono text-xs truncate max-w-[120px]">{app.user_id}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground">Applied</span>
                                    <span className="font-medium">{new Date(app.created_at).toLocaleDateString()}</span>
                                </div>
                                {hasWorkflow && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Workflow</span>
                                        <span className="font-medium text-xs">{workflowStages.length} stages</span>
                                    </div>
                                )}
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
