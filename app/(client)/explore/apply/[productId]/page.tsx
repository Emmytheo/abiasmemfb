"use client";

import { use, useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductType, User } from "@/lib/api/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Send } from "lucide-react";

function ApplyProductContent({ params }: { params: Promise<{ productId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const productId = resolvedParams.productId;

    const [product, setProduct] = useState<ProductType | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Dynamic form state
    const [formData, setFormData] = useState<Record<string, any>>({});
    // Dedicated state for requested amount if applicable
    const [requestedAmount, setRequestedAmount] = useState<number | undefined>(undefined);

    useEffect(() => {
        Promise.all([
            api.getProductTypeById(productId),
            api.getCurrentUser()
        ]).then(([typeData, userData]) => {
            setProduct(typeData);
            setUser(userData);

            // Initialize form data defaults
            if (typeData?.form_schema) {
                const initial: Record<string, any> = {};
                typeData.form_schema.forEach(field => {
                    initial[field.id] = field.type === 'number' ? '' : '';
                });
                setFormData(initial);

                // Set default requested amount to min_amount if applicable
                if (typeData.category !== 'accounts') {
                    setRequestedAmount(typeData.min_amount || 0);
                }
            }
            setLoading(false);
        });
    }, [productId]);

    const handleInputChange = (fieldId: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [fieldId]: value
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!product || !user) return;

        setSubmitting(true);
        try {
            await api.createProductApplication({
                user_id: user.id,
                product_type_id: product.id,
                status: 'pending',
                workflow_stage: product.workflow_stages[0] || 'Submitted',
                submitted_data: formData,
                requested_amount: requestedAmount
            });

            // Route based on category
            if (product.category === 'accounts') {
                router.push("/my-products");
            } else {
                router.push("/my-loans");
            }
        } catch (error) {
            console.error("Application submission failed:", error);
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

                        {/* If it's a loan or investment, ask for Amount */}
                        {product.category !== 'accounts' && (
                            <div className="space-y-3 bg-primary/5 p-6 rounded-xl border border-primary/20">
                                <label className="text-sm font-semibold text-primary block">Requested Amount (₦)</label>
                                <input
                                    type="number"
                                    required
                                    min={product.min_amount}
                                    max={product.max_amount}
                                    value={requestedAmount}
                                    onChange={(e) => setRequestedAmount(Number(e.target.value))}
                                    className="w-full bg-background border-2 border-primary/30 rounded-lg text-lg h-12 px-4 focus:outline-none focus:border-primary font-mono shadow-inner"
                                />
                                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                                    <span>Min: ₦{product.min_amount?.toLocaleString()}</span>
                                    <span>Max: ₦{product.max_amount?.toLocaleString()}</span>
                                </div>
                            </div>
                        )}

                        {/* Dynamic Admin-Defined Fields */}
                        <div className="space-y-6">
                            {product.form_schema.map(field => (
                                <div key={field.id} className="space-y-2 group">
                                    <label className="text-sm font-medium group-focus-within:text-primary transition-colors flex items-center gap-1">
                                        {field.label} {field.required && <span className="text-destructive">*</span>}
                                    </label>

                                    {field.type === 'select' ? (
                                        <select
                                            required={field.required}
                                            value={formData[field.id]}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full bg-background border rounded-lg h-11 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
                                        >
                                            <option value="" disabled>Select an option...</option>
                                            {field.options?.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    ) : field.type === 'file' ? (
                                        <div className="flex items-center justify-center w-full">
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-accent/30 hover:bg-accent/50 hover:border-primary/50 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <UploadCloudIcon className="w-8 h-8 mb-3 text-muted-foreground" />
                                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                                    <p className="text-xs text-muted-foreground">PDF, JPG or PNG (MAX. 5MB)</p>
                                                </div>
                                                <input id={field.id} type="file" className="hidden" required={field.required} />
                                            </label>
                                        </div>
                                    ) : (
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            placeholder={field.placeholder}
                                            value={formData[field.id]}
                                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                                            className="w-full bg-background border rounded-lg h-11 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                        />
                                    )}
                                    {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                    <CardFooter className="bg-muted/30 pt-6 px-6 pb-6 border-t flex items-center justify-between">
                        <p className="text-xs text-muted-foreground max-w-[60%]">
                            By sumitting this form, you agree to the Terms and Conditions associated with this product.
                        </p>
                        <Button type="submit" size="lg" disabled={submitting} className="shadow-md">
                            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            Submit Application
                        </Button>
                    </CardFooter>
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
