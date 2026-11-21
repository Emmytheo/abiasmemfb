"use client";

import { use, useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductApplication, ProductType, Account } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Check, X, AlertCircle, Clock, CheckCircle2, XCircle, Banknote, ShieldCheck, FileDown, Settings, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { BankPageHeader } from "@/components/banking/page-header";

// Generate a pseudo-random account number
function generateAccountNumber() {
    const prefix = "30"; // ABIASMEMFB prefix
    const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
    return prefix + rest;
}

function AdminApplicationReviewContent({ params }: { params: Promise<{ applicationId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const applicationId = resolvedParams.applicationId;

    const [app, setApp] = useState<ProductApplication | null>(null);
    const [product, setProduct] = useState<ProductType | null>(null);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectReason, setRejectReason] = useState("");

    const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
    const [selectedNewProduct, setSelectedNewProduct] = useState("");
    const [changeLoading, setChangeLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);
    
    const [customer, setCustomer] = useState<any>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Record<string, any>>({});
    const [editRequestedAmount, setEditRequestedAmount] = useState<number>(0);
    const [editLoading, setEditLoading] = useState(false);

    async function loadData() {
        try {
            const [allApps, allProds] = await Promise.all([
                api.getAllApplications(),
                api.getAllProductTypes().catch(() => [])
            ]);

            setProducts(allProds);

            const currentApp = allApps.find(a => String(a.id) === String(applicationId));

            if (currentApp) {
                setApp(currentApp);
                try {
                    const prodType = await api.getProductTypeById(currentApp.product_type_id);
                    setProduct(prodType);
                } catch {
                    // Product type might not be findable — proceed with null product
                }
                try {
                    if (currentApp.user_id) {
                        const cust = await api.getCustomerBySupabaseId(currentApp.user_id);
                        setCustomer(cust);
                    }
                } catch {
                    // Ignore customer load failure
                }
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
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
                const res = await fetch("/api/admin/applications", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "approve",
                        applicationId: app.id,
                    }),
                });
                const result = await res.json();
                if (!res.ok || !result.success) {
                    throw new Error(result.error || "Failed to approve and provision application.");
                }
                toast.success(result.message || "Application approved & live product provisioned with GL journal!");
                await loadData();
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
        if (!isRejecting) {
            setIsRejecting(true);
            return;
        }
        if (!rejectReason.trim()) {
            toast.error("Please provide a reason for rejection.");
            return;
        }

        setActionLoading(true);
        setActionError(null);
        try {
            const updatedApp = await api.updateApplication(String(app.id), {
                status: 'rejected',
                metadata: { ...app.metadata, rejection_reason: rejectReason }
            });
            setApp(updatedApp);
            toast.success("Application rejected.");
            setIsRejecting(false);
        } catch (e: any) {
            console.error("Reject error:", e);
            setActionError(e?.message || "Failed to reject application.");
            toast.error("Failed to reject application.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleChangeProduct = async () => {
        if (!selectedNewProduct || !app) {
            toast.error("Please select a product");
            return;
        }
        setChangeLoading(true);
        try {
            const res = await fetch(`/api/applications/${app.id}/change-product`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productTypeId: selectedNewProduct })
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Product changed and account provisioned successfully!", {
                    description: result.message
                });
                setIsChangeDialogOpen(false);
                loadData();
            } else {
                toast.error(result.error || "Failed to change product");
            }
        } catch {
            toast.error("Network error while updating product");
        } finally {
            setChangeLoading(false);
        }
    };

    const handleRetryProvision = async () => {
        if (!app) return;
        setRetryLoading(true);
        toast.info("Retrying account provisioning...");
        try {
            const res = await fetch('/api/admin/retry-provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id })
            });

            const result = await res.json();
            if (result.success) {
                toast.success("Provisioning completed successfully!");
                loadData();
            } else {
                toast.error(result.error || result.message || "Failed to retry provisioning");
            }
        } catch {
            toast.error("Network error while retrying provisioning");
        } finally {
            setRetryLoading(false);
        }
    };

    const handleUpdateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!app) return;
        setEditLoading(true);
        try {
            await api.updateApplication(String(app.id), {
                submitted_data: editFormData,
                requested_amount: editRequestedAmount
            });

            if (customer && customer.id) {
                const customerUpdates: Record<string, any> = {};
                const keyMap: Record<string, string> = {
                    'FirstName': 'firstName', 'LastName': 'lastName', 'PhoneNo': 'phone_number',
                    'BVN': 'bvn', 'DateOfBirth': 'dob', 'Email': 'email', 'Address': 'address', 'Gender': 'gender'
                };
                for (const [appKey, customerKey] of Object.entries(keyMap)) {
                    if (editFormData[appKey] !== undefined) customerUpdates[customerKey] = editFormData[appKey];
                }
                if (Object.keys(customerUpdates).length > 0) {
                    await api.updateCustomer(customer.id, customerUpdates);
                }
            }
            
            toast.success("Application details updated successfully!");
            setIsEditDialogOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error?.message || "Failed to update application details");
        } finally {
            setEditLoading(false);
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
        <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 space-y-6 animate-in fade-in duration-500 pb-24">
            <BankPageHeader
                badge={`Application Underwriting · ${product?.name || 'Banking Product'}`}
                livePill={isApproved ? 'Approved' : isRejected ? 'Rejected' : 'Pending Review'}
                liveTone={isApproved ? 'emerald' : isRejected ? 'rose' : 'amber'}
                title={`Application #${String(app.id).substring(0, 12).toUpperCase()}`}
                subtitle={`Workflow stage: ${app.workflow_stage || 'Submitted'} · Approving final stage provisions live NUBAN or disburses credit with Double-Entry GL.`}
                actions={
                    <Button variant="outline" size="sm" asChild className="rounded-xl">
                        <Link href="/products/applications">
                            <ArrowLeft className="h-4 w-4 mr-1.5" /> Applications Queue
                        </Link>
                    </Button>
                }
            />

            {isApproved && app.workflow_stage !== 'Provisioned' && (
                <div className="p-5 rounded-2xl border border-destructive/20 bg-destructive/5 text-destructive-foreground flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm animate-in slide-in-from-top-2 duration-300 shadow-md">
                    <div className="flex gap-3 text-foreground">
                        <AlertCircle className="h-6 w-6 shrink-0 mt-0.5 text-destructive" />
                        <div>
                            <p className="font-bold text-base text-destructive">Core Provisioning Mismatched Mapping</p>
                            <p className="text-xs mt-1 opacity-90 leading-relaxed max-w-2xl">
                                This application is approved but account generation failed on the core banking network. Staging environments often lack specific test codes or active mappings. Use the utilities below to correct this.
                            </p>
                            <div className="mt-2 text-[10px] font-mono bg-destructive/10 border border-destructive/20 p-2 rounded-lg opacity-85 max-h-24 overflow-y-auto text-destructive dark:text-red-300">
                                Exception: {app.metadata?.provisioning_error ? String(app.metadata.provisioning_error) : 'Account provisioning did not complete. No error details recorded in application metadata.'}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0 self-start md:self-auto">
                        <Button 
                            onClick={() => setIsChangeDialogOpen(true)}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 font-semibold shadow-md gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            Change Product Type
                        </Button>
                        <Button 
                            variant="outline"
                            onClick={handleRetryProvision}
                            disabled={retryLoading}
                            className="border-destructive/20 text-destructive hover:bg-destructive hover:text-white font-semibold gap-2"
                        >
                            <RefreshCw className={`h-4 w-4 ${retryLoading ? 'animate-spin' : ''}`} />
                            {retryLoading ? 'Retrying...' : 'Retry Provisioning'}
                        </Button>
                    </div>
                </div>
            )}

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
                        <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Customer Submission Data</CardTitle>
                                <CardDescription>Verify the information provided below.</CardDescription>
                            </div>
                            <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={() => {
                                    setEditFormData({
                                        FirstName: app.submitted_data?.FirstName || customer?.firstName || '',
                                        LastName: app.submitted_data?.LastName || customer?.lastName || '',
                                        BVN: app.submitted_data?.BVN || customer?.bvn || '',
                                        PhoneNo: app.submitted_data?.PhoneNo || customer?.phone_number || '',
                                        DateOfBirth: app.submitted_data?.DateOfBirth || customer?.dob || '',
                                        Gender: app.submitted_data?.Gender || customer?.gender || '',
                                        Email: app.submitted_data?.Email || customer?.email || '',
                                        Address: app.submitted_data?.Address || customer?.address || '',
                                        ...app.submitted_data
                                    });
                                    setEditRequestedAmount(app.requested_amount || 0);
                                    setIsEditDialogOpen(true);
                                }}
                                className="gap-2 shrink-0 border-primary/20 text-primary hover:bg-primary/5"
                            >
                                <Settings className="h-4 w-4" />
                                Edit Details
                            </Button>
                        </CardHeader>
                        <CardContent className="pt-6 grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
                            {app.requested_amount != null && app.requested_amount > 0 && (
                                <div className="sm:col-span-2 p-4 bg-primary/5 rounded-xl border border-primary/10">
                                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Requested Limit / Value</p>
                                    <p className="text-2xl font-mono mt-1">₦{app.requested_amount.toLocaleString()}</p>
                                </div>
                            )}

                            {(() => {
                                const displayData = (app.submitted_data && Object.keys(app.submitted_data).length > 0)
                                    ? app.submitted_data
                                    : {
                                        FirstName: customer?.firstName || '',
                                        LastName: customer?.lastName || '',
                                        BVN: customer?.bvn || '',
                                        PhoneNo: customer?.phone_number || '',
                                        DateOfBirth: customer?.dob || '',
                                        Gender: customer?.gender || '',
                                        Email: customer?.email || '',
                                        Address: customer?.address || '',
                                    };

                                const entries = Object.entries(displayData).filter(([_, val]) => !!val);
                                if (entries.length === 0) {
                                    return (
                                        <div className="sm:col-span-2 text-center py-6 text-sm text-muted-foreground">
                                            No additional data was submitted with this application.
                                        </div>
                                    );
                                }

                                return entries.map(([key, value]) => {
                                    const fieldDef = product?.form_schema?.find((f: any) => f.id === key);
                                    const label = fieldDef?.label || key.replace(/_/g, ' ');

                                    return (
                                        <div key={key} className="space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium capitalize">{label}</p>
                                            <div className="text-sm font-semibold break-words mt-1">
                                                {fieldDef?.type === 'file' ? (
                                                    typeof value === 'string' && value.startsWith('http') ? (
                                                        <div className="relative inline-block border rounded overflow-hidden">
                                                            {value.match(/\.(jpeg|jpg|gif|png)$/i) ? (
                                                                <img src={value} alt={label} className="h-32 w-auto object-cover" />
                                                            ) : (
                                                                <a href={value} target="_blank" rel="noreferrer" className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 text-primary transition-colors">
                                                                    <FileDown className="h-4 w-4" /> View Document
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <Button variant="outline" size="sm" className="h-8 font-normal cursor-default"><Check className="h-4 w-4 mr-2 text-emerald-500" /> File Attached</Button>
                                                    )
                                                ) : String(value) || '—'}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
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
                                        {!isRejecting ? (
                                            <>
                                                <Button
                                                    className="w-full h-11 shadow-md"
                                                    disabled={actionLoading}
                                                    onClick={handleAdvanceStage}
                                                >
                                                    {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                    {nextStage ? `Advance to "${nextStage}"` : (
                                                        <>
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
                                            </>
                                        ) : (
                                            <div className="space-y-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg animate-in slide-in-from-top-2">
                                                <label className="text-xs font-bold text-destructive uppercase tracking-widest">Reason for Rejection</label>
                                                <Textarea 
                                                    placeholder="Provide details to the customer..."
                                                    className="bg-background min-h-[80px]"
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                    disabled={actionLoading}
                                                />
                                                <div className="flex gap-2 pt-1">
                                                    <Button 
                                                        variant="destructive" 
                                                        className="flex-1" 
                                                        onClick={handleReject}
                                                        disabled={actionLoading}
                                                    >
                                                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                                                    </Button>
                                                    <Button 
                                                        variant="outline" 
                                                        className="flex-1"
                                                        onClick={() => { setIsRejecting(false); setRejectReason(""); }}
                                                        disabled={actionLoading}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
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

            <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[450px] rounded-2xl p-6 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Change Product Type</DialogTitle>
                        <DialogDescription className="text-xs">
                            Select an alternative product category. This will update the application and dynamically trigger account provisioning in Qore.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="admin-product-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alternative {product?.category} Products</Label>
                            <Select value={selectedNewProduct} onValueChange={setSelectedNewProduct}>
                                <SelectTrigger id="admin-product-select" className="w-full">
                                    <SelectValue placeholder="Select alternative product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products
                                        .filter(p => p.category === product?.category && String(p.id) !== String(product?.id) && p.status === 'active')
                                        .map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            {products.filter(p => p.category === product?.category && String(p.id) !== String(product?.id) && p.status === 'active').length === 0 && (
                                <p className="text-[11px] text-amber-600 bg-amber-500/10 p-2 rounded-lg mt-2 text-center font-medium">
                                    No alternative active products are currently available in this category.
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" onClick={() => setIsChangeDialogOpen(false)} disabled={changeLoading}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleChangeProduct} 
                            disabled={changeLoading || !selectedNewProduct} 
                            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95"
                        >
                            {changeLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Confirm & Provision Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[550px] max-h-[85vh] overflow-y-auto rounded-2xl p-6 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Edit Application Information</DialogTitle>
                        <DialogDescription className="text-xs">
                            Modify the submitted details on behalf of the customer. This will update the active registry records.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleUpdateApplication} className="space-y-4 py-4">
                        {app.requested_amount != null && app.requested_amount > 0 && (
                            <div className="space-y-2">
                                <Label htmlFor="requested-amount" className="text-xs font-semibold">Requested Amount (₦)</Label>
                                <input
                                    id="requested-amount"
                                    type="number"
                                    value={editRequestedAmount}
                                    onChange={(e) => setEditRequestedAmount(Number(e.target.value))}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                    required
                                />
                            </div>
                        )}

                        {((product?.form_schema && Array.isArray(product.form_schema) && product.form_schema.length > 0)
                            ? product.form_schema
                            : [
                                { id: 'FirstName', label: 'First Name', type: 'text', required: true },
                                { id: 'LastName', label: 'Last Name', type: 'text', required: true },
                                { id: 'BVN', label: 'Bank Verification Number (BVN)', type: 'text', required: true },
                                { id: 'PhoneNo', label: 'Phone Number', type: 'text', required: true },
                                { id: 'DateOfBirth', label: 'Date of Birth (YYYY-MM-DD)', type: 'text', required: true },
                                { id: 'Gender', label: 'Gender', type: 'select', required: true, options: [{value: "1", label: "Male"}, {value: "0", label: "Female"}] },
                                { id: 'Email', label: 'Email Address', type: 'email', required: true },
                                { id: 'Address', label: 'Residential Address', type: 'text', required: true },
                            ]).map((field: any) => {
                                const label = field.label || field.id.replace(/_/g, ' ');
                                return (
                                    <div key={field.id} className="space-y-2">
                                        <Label htmlFor={`field-${field.id}`} className="text-xs font-semibold capitalize">{label} {field.required && <span className="text-destructive">*</span>}</Label>
                                        
                                        {field.type === 'select' ? (
                                            <select
                                                id={`field-${field.id}`}
                                                value={editFormData[field.id] || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, [field.id]: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                required={field.required}
                                            >
                                                <option value="">Select option...</option>
                                                {field.options?.map((opt: any) => {
                                                    const val = typeof opt === 'object' ? opt.value : opt;
                                                    const name = typeof opt === 'object' ? opt.label : opt;
                                                    return <option key={val} value={val}>{name}</option>;
                                                })}
                                            </select>
                                        ) : (
                                            <input
                                                id={`field-${field.id}`}
                                                type={field.type === 'number' ? 'number' : 'text'}
                                                value={editFormData[field.id] || ''}
                                                onChange={(e) => setEditFormData({ ...editFormData, [field.id]: e.target.value })}
                                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                                required={field.required}
                                            />
                                        )}
                                    </div>
                                );
                        })}

                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)} disabled={editLoading}>
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={editLoading} 
                                className="gap-2 bg-primary text-primary-foreground hover:bg-primary/95"
                            >
                                {editLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
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
