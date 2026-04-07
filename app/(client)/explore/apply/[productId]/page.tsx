"use client";

import { use, useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { UniversalDynamicForm } from "@/components/forms/UniversalDynamicForm";

function ApplyProductContent({ params }: { params: Promise<{ productId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const productId = resolvedParams.productId;

    const [product, setProduct] = useState<ProductType | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic form state
    const [formData, setFormData] = useState<Record<string, any>>({});
    // Dedicated state for requested amount if applicable
    const [requestedAmount, setRequestedAmount] = useState<number | undefined>(undefined);

    useEffect(() => {
        async function load() {
            // Get the authenticated Supabase user directly — never returns null if logged in
            const supabase = createClient();
            const { data: { user: supaUser } } = await supabase.auth.getUser();
            setUserId(supaUser?.id ?? null);

            const typeData = await api.getProductTypeById(productId);
            setProduct(typeData);

            if (typeData?.form_schema) {
                const initial: Record<string, any> = {};
                typeData.form_schema.forEach(field => {
                    initial[field.id] = '';
                });
                setFormData(initial);

                const terms = typeData.financial_terms?.[0] as any;
                if (terms) {
                    if (terms.blockType === 'savings-terms') {
                        setRequestedAmount(terms.min_balance || 0);
                    } else {
                        setRequestedAmount(terms.min_amount || 0);
                    }
                }
            }
            setLoading(false);
        }
        load();
    }, [productId]);

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = async (e: FormEvent, explicitData?: Record<string, any>) => {
        e.preventDefault();
        const submissionData = explicitData || formData;
        if (!product) return;

        if (!userId) {
            toast.error("Not signed in", { description: "Please log in to submit an application." });
            return;
        }

        setSubmitting(true);
        try {
            await api.createProductApplication({
                user_id: userId,
                product_type_id: product.id,
                status: 'pending',
                // Always default to 'Submitted' — workflow_stages is optional and set by admin later
                workflow_stage: 'Submitted',
                submitted_data: submissionData,
                requested_amount: requestedAmount
            });

            toast.success("Application Submitted!", {
                description: "Your application has been received and is being reviewed.",
                icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            });

            // Redirect based on product financial terms type (not category ID relationship)
            const terms = product.financial_terms?.[0] as any;
            const isLoan = terms?.blockType === 'loan-terms';
            router.push(isLoan ? "/my-loans" : "/my-products");
        } catch (error: any) {
            console.error("Application submission failed:", error);
            toast.error("Submission Failed", {
                description: error?.message || "Something went wrong. Please try again.",
            });
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center p-24 text-center">
                <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
                <p className="text-muted-foreground mb-6">The product you are attempting to apply for does not exist or has been archived.</p>
                <Button asChild><Link href="/explore/loans">Go Back</Link></Button>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="rounded-full">
                    <Link href={product.category === 'accounts' ? '/explore/accounts' : '/explore/loans'}>
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Apply for {product.name}</h1>
                    <p className="text-muted-foreground">{product.tagline}</p>
                </div>
            </div>

            <Card className="border shadow-lg overflow-hidden">
                {product.image_url && (
                    <div className="w-full h-40 bg-accent/30 relative border-b">
                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover opacity-90" />
                    </div>
                )}
                <CardHeader className="bg-card">
                    <CardTitle>Application Form</CardTitle>
                    <CardDescription>Please complete all required fields accurately to process your application.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-8 bg-card pb-8">

                        {/* Universal Amount Request Input */}
                        {(() => {
                            const terms = product.financial_terms?.[0] as any;
                            if (!terms) return null;

                            const isLoan = terms.blockType === 'loan-terms';
                            const isSavings = terms.blockType === 'savings-terms';
                            const isFixed = terms.blockType === 'fixed-deposit-terms';

                            const minVal = isSavings ? terms.min_balance : terms.min_amount;
                            const maxVal = isLoan ? terms.max_amount : undefined;

                            const label = isLoan ? "Requested Loan Amount (₦)" : isFixed ? "Initial Deposit Amount (₦)" : "Opening Balance (₦)";

                            return (
                                <div className="space-y-3 bg-primary/5 p-6 rounded-xl border border-primary/20">
                                    <label className="text-sm font-semibold text-primary block">{label}</label>
                                    <input
                                        type="number"
                                        required
                                        min={minVal}
                                        max={maxVal}
                                        value={requestedAmount === undefined ? '' : requestedAmount}
                                        onChange={(e) => setRequestedAmount(e.target.value ? Number(e.target.value) : undefined)}
                                        className="w-full bg-background border-2 border-primary/30 rounded-lg text-lg h-12 px-4 focus:outline-none focus:border-primary font-mono shadow-inner"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                        <span>Min: ₦{(minVal || 0).toLocaleString()}</span>
                                        {maxVal !== undefined && <span>Max: ₦{(maxVal || 0).toLocaleString()}</span>}
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Dynamic Admin-Defined Fields */}
                        <div className="space-y-6">
                            {product.form_schema.length > 0 ? (
                                <UniversalDynamicForm
                                    fields={product.form_schema}
                                    onSubmit={(data: Record<string, any>) => {
                                        setFormData(data);
                                        // Trigger the parent submit logic
                                        const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
                                        handleSubmit(syntheticEvent, data);
                                    }}
                                    submitLabel="Submit Application"
                                    isSubmitting={submitting}
                                />
                            ) : (
                                <div className="py-12 text-center border-2 border-dashed rounded-xl bg-accent/10">
                                    <p className="text-sm text-muted-foreground italic">No additional application fields required.</p>
                                    <Button 
                                        type="button" 
                                        onClick={(e) => handleSubmit(e as any)} 
                                        disabled={submitting}
                                        className="mt-4"
                                    >
                                        Proceed with Application
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </form>
            </Card>
        </div>
    );
}

function UploadCloudIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m16 16-4-4-4 4" />
        </svg>
    )
}

export default function ApplyProductPage({ params }: { params: Promise<{ productId: string }> }) {
    return (
        <Suspense fallback={<div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <ApplyProductContent params={params} />
        </Suspense>
    );
}
