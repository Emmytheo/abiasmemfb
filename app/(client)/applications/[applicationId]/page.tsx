"use client";

import { use, useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { ProductApplication, ProductType, Customer } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, CheckCircle2, Clock, Building, Landmark, Check, XCircle, AlertCircle, X, Info, Settings, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

function formatLabel(key: string, fieldDefLabel?: string) {
    if (fieldDefLabel) return fieldDefLabel;
    
    const overrides: Record<string, string> = {
        LastName: 'Last Name',
        FirstName: 'First Name',
        OtherNames: 'Other Names',
        DateOfBirth: 'Date of Birth',
        PhoneNo: 'Phone Number',
        NationalIdentityNo: 'National Identity Number (NIN)',
        BVN: 'Bank Verification Number (BVN)',
        Email: 'Email Address',
        Gender: 'Gender',
        Address: 'Residential Address',
    };
    if (overrides[key]) return overrides[key];
    
    return key
        .replace(/([A-Z])/g, ' $1')
        .replace(/_/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function ApplicationDetailContent({ params }: { params: Promise<{ applicationId: string }> }) {
    const resolvedParams = use(params);
    const applicationId = resolvedParams.applicationId;

    const [app, setApp] = useState<ProductApplication | null>(null);
    const [product, setProduct] = useState<ProductType | null>(null);
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [withdrawLoading, setWithdrawLoading] = useState(false);

    const [isChangeDialogOpen, setIsChangeDialogOpen] = useState(false);
    const [selectedNewProduct, setSelectedNewProduct] = useState("");
    const [changeLoading, setChangeLoading] = useState(false);
    const [retryLoading, setRetryLoading] = useState(false);

    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editFormData, setEditFormData] = useState<Record<string, any>>({});
    const [editRequestedAmount, setEditRequestedAmount] = useState<number>(0);
    const [editLoading, setEditLoading] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);

    async function loadData() {
        try {
            // Get user ID directly from Supabase auth (matches how the apply page works)
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const [allApps, allProds, customerProfile] = await Promise.all([
                api.getUserApplications(user.id),
                api.getAllProductTypes().catch(() => []),
                api.getCustomerBySupabaseId(user.id).catch(() => null)
            ]);

            setProducts(allProds);
            setCustomer(customerProfile);

            const currentApp = allApps.find(a => String(a.id) === String(applicationId));

            if (currentApp) {
                setApp(currentApp);
                setEditFormData(currentApp.submitted_data || {});
                setEditRequestedAmount(currentApp.requested_amount || 0);
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

    useEffect(() => {
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

    // Provisioning is pending if approved but workflow_stage has not reached 'Provisioned' yet
    const isProvisionPending = isApproved && app.workflow_stage !== 'Provisioned';

    const refId = typeof app.id === 'string' && app.id.includes('_')
        ? app.id.split('_')[1]?.toUpperCase()
        : String(app.id).substring(0, 8).toUpperCase();

    const handleRetryProvision = async () => {
        if (!app) return;
        setRetryLoading(true);
        toast.info("Retrying account provisioning with current details...");
        try {
            const res = await fetch('/api/admin/retry-provision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ applicationId: app.id })
            });
            const result = await res.json();
            if (result.success) {
                toast.success("Account provisioned successfully!", {
                    description: "Your account details have been created on the banking network."
                });
                loadData();
            } else {
                toast.error(result.error || result.message || "Provisioning failed — please try selecting an alternative product.");
            }
        } catch {
            toast.error("Network error while retrying provisioning.");
        } finally {
            setRetryLoading(false);
        }
    };

    const handleWithdraw = async () => {
        if (!confirm("Are you sure you want to withdraw this application? This action cannot be undone.")) return;
        setWithdrawLoading(true);
        try {
            await api.withdrawApplication(String(app.id));
            toast.success("Application withdrawn successfully");
            const allApps = await api.getUserApplications(app.user_id);
            const currentApp = allApps.find(a => String(a.id) === String(app.id));
            if (currentApp) setApp(currentApp);
        } catch (error: any) {
            toast.error(error?.message || "Failed to withdraw application");
        } finally {
            setWithdrawLoading(false);
        }
    };

    const handleChangeProduct = async () => {
        if (!selectedNewProduct) {
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
                toast.success("Product changed successfully!", {
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

    const handleUpdateApplication = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!app) return;
        if (app.workflow_stage === 'Provisioned') {
            toast.error("Edits are locked because this application has been successfully provisioned.");
            return;
        }
        setEditLoading(true);
        try {
            await api.updateApplication(String(app.id), {
                submitted_data: editFormData,
                requested_amount: editRequestedAmount
            });

            if (customer) {
                const customerUpdates: Record<string, any> = {};
                
                // Map of application dynamic keys to Customer model database keys
                const keyMap: Record<string, string> = {
                    'FirstName': 'firstName',
                    'LastName': 'lastName',
                    'PhoneNo': 'phone_number',
                    'phone_number': 'phone_number',
                    'Phone': 'phone_number',
                    'BVN': 'bvn',
                    'bvn': 'bvn',
                    'DateOfBirth': 'dob',
                    'dob': 'dob',
                    'Email': 'email',
                    'email': 'email',
                    'Address': 'address',
                    'address': 'address',
                    'Gender': 'gender',
                    'gender': 'gender'
                };
                
                for (const [appKey, customerKey] of Object.entries(keyMap)) {
                    if (editFormData[appKey] !== undefined) {
                        customerUpdates[customerKey] = editFormData[appKey];
                    }
                }
                
                if (Object.keys(customerUpdates).length > 0) {
                    console.log("[Dynamic Sync] Updating customer profile in lockstep:", customerUpdates);
                    await api.updateCustomer(customer.id, customerUpdates);
                }
            }
            
            toast.success("Application details updated successfully!");
            setIsEditDialogOpen(false);

            // Re-fetch user applications to get fresh ground truth state
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const allApps = await api.getUserApplications(user.id);
                const freshApp = allApps.find(a => String(a.id) === String(app.id));
                if (freshApp) setApp(freshApp);
            }

            // If provisioning had previously failed, auto-retry with the updated details
            const wasProvisionFailed = app.status === 'approved' && app.workflow_stage !== 'Provisioned';
            if (wasProvisionFailed) {
                toast.info("Re-attempting account provisioning with your updated details...");
                try {
                    const res = await fetch('/api/admin/retry-provision', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ applicationId: app.id })
                    });
                    const result = await res.json();
                    if (result.success) {
                        toast.success("Account provisioned successfully with your updated details!");
                        loadData();
                    } else {
                        toast.warning("Details saved, but provisioning still failed.", {
                            description: result.error || "You can retry manually from the banner above."
                        });
                    }
                } catch {
                    toast.warning("Details saved, but could not auto-retry provisioning.");
                }
            }
        } catch (error: any) {
            toast.error(error?.message || "Failed to update application details");
        } finally {
            setEditLoading(false);
        }
    };

    const activeSchema = (product?.form_schema && Array.isArray(product.form_schema) && product.form_schema.length > 0)
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
        ];

    const getProductTypeClass = (p: any) => {
        if (!p) return 'account';
        const cat = typeof p.category === 'object' && p.category ? String(p.category.name || p.category.id || '') : String(p.category || '');
        const name = String(p.name || '');
        if (cat.toLowerCase().includes('loan') || name.toLowerCase().includes('loan')) {
            return 'loan';
        }
        return 'account';
    };

    const currentClass = product 
        ? getProductTypeClass(product)
        : (app.requested_amount != null && app.requested_amount > 0) ? 'loan' : 'account';

    const categoryName = currentClass === 'loan' ? 'Loan' : 'Account';

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

            {isProvisionPending && (
                <div className="p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-amber-800 dark:text-amber-300 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm animate-in slide-in-from-top-2 duration-300 shadow-md">
                    <div className="flex gap-3">
                        <Clock className="h-6 w-6 shrink-0 mt-0.5 animate-pulse text-amber-600 dark:text-amber-400" />
                        <div>
                            <p className="font-bold text-base">Finalising Account Setup</p>
                            <p className="text-xs mt-1 opacity-90 leading-relaxed max-w-2xl">
                                Your application has been approved! We are currently generating your digital account details on the core banking network. If this takes longer than expected, or if your chosen product is temporarily unavailable for registration, you can retry or choose a different product class.
                            </p>
                            {app.metadata?.provisioning_error && (
                                <div className="mt-2 text-[10px] font-mono bg-amber-500/10 border border-amber-500/20 p-2 rounded-lg opacity-80 max-h-24 overflow-y-auto">
                                    Connection Log: {String(app.metadata.provisioning_error)}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start md:self-auto">
                        <Button
                            variant="outline"
                            onClick={handleRetryProvision}
                            disabled={retryLoading || changeLoading}
                            className="border-amber-500/30 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300 font-semibold gap-2"
                        >
                            {retryLoading
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <RefreshCw className="h-4 w-4" />}
                            {retryLoading ? 'Retrying...' : 'Retry Provisioning'}
                        </Button>
                        <Button 
                            onClick={() => setIsChangeDialogOpen(true)}
                            disabled={retryLoading || changeLoading}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md gap-2"
                        >
                            <Settings className="h-4 w-4" />
                            Select Alternative Product
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Main Content Area */}
                <div className="md:col-span-2 space-y-6">

                    {/* Workflow visualizer OR simple status */}
                    <Card className="border shadow-sm p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            Status: <span className={`uppercase text-xs font-bold tracking-widest px-2 py-1 rounded border shadow-sm ${
                                isProvisionPending ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' :
                                isApproved ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                isRejected ? 'bg-destructive/10 text-destructive border-destructive/20' :
                                'bg-primary/10 text-primary border-primary/20'
                            }`}>{isProvisionPending ? 'Finalising Setup' : app.status}</span>
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
                            <div className="flex flex-col gap-4 py-4">
                                <div className="flex items-center gap-4">
                                    {isProvisionPending ? (
                                        <><Clock className="h-8 w-8 text-amber-500 animate-pulse" /><div><p className="font-bold text-amber-600">Finalising Account Setup</p><p className="text-sm text-muted-foreground">Your application is approved! We are currently finalising your core banking account generation.</p></div></>
                                    ) : isApproved ? (
                                        <><CheckCircle2 className="h-8 w-8 text-emerald-500" /><div><p className="font-bold text-emerald-600">Your application has been approved!</p><p className="text-sm text-muted-foreground">Your account/loan has been created.</p></div></>
                                    ) : isRejected ? (
                                        <><XCircle className="h-8 w-8 text-destructive" /><div><p className="font-bold text-destructive">Your application was not approved.</p><p className="text-sm text-muted-foreground">Please contact support for more information.</p></div></>
                                    ) : app.status === 'withdrawn' ? (
                                        <><AlertCircle className="h-8 w-8 text-muted-foreground" /><div><p className="font-bold text-muted-foreground">Application Withdrawn</p><p className="text-sm text-muted-foreground">You have cancelled this application.</p></div></>
                                    ) : (
                                        <><Clock className="h-8 w-8 text-amber-500 animate-pulse" /><div><p className="font-bold text-amber-600">Your application is under review</p><p className="text-sm text-muted-foreground">Our team is reviewing your submission.</p></div></>
                                    )}
                                </div>
                                {isRejected && app.metadata?.rejection_reason && (
                                    <div className="mt-2 p-3 bg-destructive/5 border border-destructive/20 rounded-xl flex items-start gap-3">
                                        <Info className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-destructive uppercase tracking-widest mb-1">Reason for Rejection</p>
                                            <p className="text-sm text-destructive/90">{app.metadata.rejection_reason}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Submitted Data Review */}
                    <Card className="border shadow-sm">
                        <CardHeader className="border-b bg-muted/20 flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg">Submitted Information</CardTitle>
                                <CardDescription>The details you provided during the application.</CardDescription>
                            </div>
                            {(app.status === 'pending' || isProvisionPending) && (
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
                            )}
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
                                    const label = formatLabel(key, fieldDef?.label);

                                    return (
                                        <div key={key} className="space-y-1">
                                            <p className="text-xs text-muted-foreground font-medium">{label}</p>
                                            <p className="text-sm font-semibold truncate" title={String(value)}>
                                                {fieldDef?.type === 'file' ? 'Attached Document' : String(value) || '—'}
                                            </p>
                                        </div>
                                    );
                                });
                            })()}
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

                    {!isApproved && !isRejected && app.status !== 'withdrawn' && (
                        <Card className="border shadow-sm border-destructive/20">
                            <CardContent className="pt-6 space-y-4">
                                <div>
                                    <h4 className="font-bold text-sm text-destructive">Withdraw Application</h4>
                                    <p className="text-xs text-muted-foreground mt-1">If you no longer wish to proceed, you can cancel this application.</p>
                                </div>
                                <Button 
                                    variant="outline" 
                                    className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                                    onClick={handleWithdraw}
                                    disabled={withdrawLoading}
                                >
                                    {withdrawLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <X className="h-4 w-4 mr-2" />}
                                    Withdraw Application
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            <Dialog open={isChangeDialogOpen} onOpenChange={setIsChangeDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[450px] rounded-2xl p-6 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Select Alternative Product</DialogTitle>
                        <DialogDescription className="text-xs">
                            Choose an alternative active product type. We will immediately transfer your details and retry provisioning your account in real-time.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="alt-product-select" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alternative {categoryName} Products</Label>
                            <Select value={selectedNewProduct} onValueChange={setSelectedNewProduct}>
                                <SelectTrigger id="alt-product-select" className="w-full">
                                    <SelectValue placeholder="Select alternative product..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {products
                                        .filter(p => getProductTypeClass(p) === currentClass && String(p.id) !== String(app.product_type_id) && p.status === 'active')
                                        .map((p) => (
                                            <SelectItem key={p.id} value={String(p.id)}>
                                                {p.name}
                                            </SelectItem>
                                        ))
                                    }
                                </SelectContent>
                            </Select>
                            {products.filter(p => getProductTypeClass(p) === currentClass && String(p.id) !== String(app.product_type_id) && p.status === 'active').length === 0 && (
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
                            Confirm & Generate Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[550px] max-h-[85vh] overflow-y-auto rounded-2xl p-6 bg-background">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-bold">Edit Application Information</DialogTitle>
                        <DialogDescription className="text-xs">
                            Modify your submitted details. This will update the active registry records for your review.
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

                        {activeSchema.map((field: any) => {
                            const label = formatLabel(field.id, field.label);
                            return (
                                <div key={field.id} className="space-y-2">
                                    <Label htmlFor={`field-${field.id}`} className="text-xs font-semibold">{label} {field.required && <span className="text-destructive">*</span>}</Label>
                                    
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

export default function ApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ApplicationDetailContent params={params} />
        </Suspense>
    );
}
