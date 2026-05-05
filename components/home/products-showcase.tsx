"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";
import { ArrowRight, Briefcase, Wallet, Landmark, TrendingUp, PiggyBank } from "lucide-react";

export function ProductsShowcase() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProducts() {
            try {
                // Fetch dynamic products from Payload CMS
                const data = await api.getAllProductTypes();
                // Filter active and prioritize some for the homepage
                const activeProducts = data.filter(p => p.status === 'active').slice(0, 3);
                setProducts(activeProducts);
            } catch (error) {
                console.error("Failed to fetch products", error);
            } finally {
                setLoading(false);
            }
        }
        fetchProducts();
    }, []);

    const getIcon = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("loan")) return <Briefcase className="w-6 h-6" />;
        if (lower.includes("saving")) return <PiggyBank className="w-6 h-6" />;
        if (lower.includes("current")) return <Wallet className="w-6 h-6" />;
        if (lower.includes("fixed")) return <TrendingUp className="w-6 h-6" />;
        return <Landmark className="w-6 h-6" />;
    };

    if (loading) {
        return (
            <section className="py-20 bg-background">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto"></div>
                </div>
            </section>
        );
    }

    if (products.length === 0) return null;

    return (
        <section className="py-24 bg-background pattern-dots relative">
            <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary/5 rounded-full blur-3xl -z-10 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-accent font-bold tracking-wide uppercase text-sm mb-3">Tailored Solutions</h2>
                    <h3 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6 leading-tight">
                        Banking Products <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-accent">Designed For You.</span>
                    </h3>
                    <p className="text-lg text-muted-foreground">
                        Explore our comprehensive range of financial products, dynamically configured to meet your personal and business needs.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 mb-16 relative">
                    {products.map((product, index) => (
                        <div key={product.id} className={`group relative bg-white/5 backdrop-blur-xl border border-foreground/5 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 transition-all duration-700 hover:bg-white/10 hover:-translate-y-4 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] overflow-hidden ${index === 1 ? 'md:scale-105 md:z-10 bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-2xl shadow-primary/10' : ''}`}>
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] group-hover:scale-150 transition-transform duration-1000"></div>
                            
                            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-gradient-to-br from-primary to-primary/60 rounded-2xl sm:rounded-3xl flex items-center justify-center text-white mb-6 sm:mb-10 shadow-xl shadow-primary/30 group-hover:rotate-6 transition-transform duration-500">
                                <div className="scale-75 sm:scale-100">
                                    {getIcon(product.name)}
                                </div>
                            </div>
                            
                            <h4 className="text-2xl sm:text-3xl font-black text-foreground mb-3 sm:mb-4 tracking-tight leading-tight">{product.name}</h4>
                            <p className="text-muted-foreground text-sm sm:text-lg leading-relaxed mb-8 sm:mb-10 opacity-80 group-hover:opacity-100 transition-opacity line-clamp-3">
                                {product.tagline || product.description}
                            </p>
                            
                            <div className="relative overflow-hidden inline-flex">
                                <Link 
                                    href={`/product/${product.id}`}
                                    className="inline-flex items-center gap-3 text-sm sm:text-base font-black text-primary group/link"
                                >
                                    Experience Now 
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover/link:bg-primary group-hover/link:text-white transition-all duration-500">
                                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover/link:translate-x-1 transition-transform" />
                                    </div>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="text-center">
                    <Link
                        className="inline-flex items-center justify-center px-8 py-3 text-sm font-bold rounded-full border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all duration-300"
                        href="/personal-banking"
                    >
                        View All Products
                    </Link>
                </div>
            </div>
        </section>
    );
}
