"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, ShieldCheck, HeartHandshake, Loader2, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";

export default function PublicProductDetail() {
    const params = useParams();
    const router = useRouter();
    const productId = params.productId as string;

    const [product, setProduct] = useState<ProductType | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadProduct() {
            try {
                const data = await api.getProductTypeById(productId);
                setProduct(data || null);
            } catch (error) {
                console.error("Failed to fetch product details", error);
            } finally {
                setLoading(false);
            }
        }
        loadProduct();
    }, [productId]);

    if (loading) {
        return (
            <div className="flex w-full justify-center p-32">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!product) {
        return (
            <div className="flex flex-col items-center justify-center py-32 text-center">
                <ShieldCheck className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
                <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
                <p className="text-muted-foreground mb-6">The product you are looking for might be unavailable or removed.</p>
                <Button onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    const isAccount = product.category === 'accounts';

    return (
        <div className="animate-in fade-in duration-700 min-h-screen bg-background">
            {/* Hero Section */}
            <div className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b bg-muted/20">
                <div className="absolute inset-0 top-0 left-0 w-full h-[500px]">
                    {product.image_url ? (
                        <div className="w-full h-full relative">
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/20" />
                        </div>
                    ) : (
                        <div className="w-full h-full bg-primary/5" />
                    )}
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 md:mt-24">
                    <Button variant="ghost" asChild className="mb-8 hover:bg-background/20 backdrop-blur">
                        <Link href={isAccount ? "/personal-banking" : "/business"} className="inline-flex items-center gap-2">
                            <ArrowLeft size={16} /> Back to {isAccount ? "Accounts" : "Loans"}
                        </Link>
                    </Button>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        <div>
                            <div className="inline-flex items-center space-x-2 mb-6">
                                <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider backdrop-blur-md border border-primary/20">
                                    {isAccount ? 'Deposit Product' : 'Credit Product'}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-foreground mb-6 leading-tight">
                                {product.name}
                            </h1>
                            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                                {product.tagline || product.description?.substring(0, 100) + '...'}
                            </p>

                            <div className="mt-10 flex flex-wrap gap-4">
                                <Link
                                    href={`/explore/apply/${product.id}`}
                                    className="inline-flex items-center px-8 py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.4)] hover:-translate-y-0.5"
                                >
                                    Apply Now <ArrowRight className="ml-2" size={18} />
                                </Link>
                                <a
                                    href="#details"
                                    className="inline-flex items-center px-8 py-3.5 bg-background border border-border hover:bg-muted text-foreground font-medium rounded-full transition-colors"
                                >
                                    View Details
                                </a>
                            </div>
                        </div>

                        <div className="lg:justify-self-end w-full max-w-md">
                            <div className="bg-card/80 backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                                <h3 className="text-lg font-semibold border-b pb-4 mb-6">Quick Overview</h3>

                                <ul className="space-y-6">
                                    <li className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary"><HeartHandshake size={20} /></div>
                                            <span>Interest Rate</span>
                                        </div>
                                        <span className="text-lg font-bold text-emerald-500">{product.interest_rate}% p.a</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary"><ShieldCheck size={20} /></div>
                                            <span>{isAccount ? 'Min Opening Balance' : 'Max Loan Limit'}</span>
                                        </div>
                                        <span className="text-lg font-bold">₦{((isAccount ? product.min_amount : product.max_amount) || 0).toLocaleString()}</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <div className="flex items-center gap-3 text-muted-foreground">
                                            <div className="bg-primary/10 p-2 rounded-lg text-primary"><CheckCircle size={20} /></div>
                                            <span>Turnaround Time</span>
                                        </div>
                                        <span className="text-base font-semibold">24 - 48 hours</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Details Section */}
            <div id="details" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                    <div className="lg:col-span-2 prose prose-lg dark:prose-invert max-w-none hover:prose-a:text-primary">
                        <h2 className="text-3xl font-display font-bold mb-8">About this Product</h2>
                        <div dangerouslySetInnerHTML={{ __html: product.description || '<p>No detailed description provided.</p>' }} />
                    </div>

                    <div className="space-y-8">
                        <div className="bg-muted/30 border rounded-2xl p-6">
                            <h3 className="text-lg font-semibold mb-4 text-foreground">Next Steps</h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold font-mono text-sm shadow-sm">1</div>
                                    <p className="text-sm text-muted-foreground pt-1">Click the <strong className="text-foreground">Apply Now</strong> button to begin.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm shadow-sm ring-1 ring-primary/30">2</div>
                                    <p className="text-sm text-muted-foreground pt-1">Complete the dynamic {product.form_schema.length}-step form with your authentic details.</p>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold font-mono text-sm shadow-sm ring-1 ring-primary/30">3</div>
                                    <p className="text-sm text-muted-foreground pt-1">Track your progress via the Client Dashboard while our operators review it.</p>
                                </li>
                            </ul>
                        </div>

                        <div className="bg-gradient-to-br from-primary via-primary to-primary-dark p-8 rounded-2xl shadow-xl text-center text-primary-foreground relative overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-5 rounded-full blur-2xl"></div>
                            <h3 className="text-xl font-display font-bold mb-3">Ready to Start?</h3>
                            <p className="text-sm text-primary-foreground/80 mb-6">Our digital on-boarding takes fewer than 5 minutes.</p>
                            <Link
                                href={`/explore/apply/${product.id}`}
                                className="inline-flex w-full items-center justify-center px-6 py-3 bg-white text-primary hover:bg-white/90 font-bold rounded-xl transition-all shadow-md"
                            >
                                Apply Online Now
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Ensure Button is available
function Button(props: any) {
    const { className, variant, asChild, children, ...rest } = props;
    if (asChild) {
        return <div className={className}>{children}</div>
    }
    return <button className={`px-4 py-2 border rounded ${className}`} {...rest}>{children}</button>
}
