"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PiggyBank, Baby, GraduationCap, User, Banknote, Store, Building2, Briefcase, Clock, ArrowRight, Loader2, Landmark } from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";

// Helper to map an icon to a string
function getIconForProduct(name: string) {
    const l = name.toLowerCase();
    if (l.includes('kiddies')) return <Baby className="text-accent group-hover:text-white transition-colors" size={32} />;
    if (l.includes('school')) return <GraduationCap className="text-green-600 group-hover:text-white transition-colors" size={32} />;
    if (l.includes('individual')) return <User className="text-primary group-hover:text-white transition-colors" size={32} />;
    if (l.includes('business') || l.includes('sme')) return <Store className="text-purple-600 group-hover:text-white transition-colors" size={32} />;
    if (l.includes('corporate')) return <Building2 className="text-gray-600 dark:text-gray-300 group-hover:text-white transition-colors" size={32} />;
    if (l.includes('salary')) return <Briefcase className="text-teal-600 group-hover:text-white transition-colors" size={32} />;
    if (l.includes('fixed') || l.includes('deposit')) return <Clock className="text-rose-600 group-hover:text-white transition-colors" size={32} />;
    return <Landmark className="text-primary group-hover:text-white transition-colors" size={32} />;
}

export default function PersonalBanking() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAllProductTypes().then(types => {
            const isAccountCategory = (catName: string) => {
                const name = catName.toLowerCase();
                return name.includes("account") || name.includes("saving") || name.includes("deposit") || name.includes("current");
            };
            setProducts(types.filter(t => isAccountCategory(t.category) && t.status === 'active'));
            setLoading(false);
        });
    }, []);

    return (
        <div className="animate-in fade-in duration-700">
            <header className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-primary">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary-dark"></div>
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-foreground opacity-5 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent opacity-5 rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
                </div>
                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold text-white mb-6 tracking-tight">
                        Deposit Products
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg md:text-xl text-blue-100 font-light leading-relaxed">
                        We offer varieties of accounts that suit every stage of your life, with unique benefits designed to match your
                        personal banking needs as you grow.
                    </p>
                </div>
            </header>

            <main className="relative z-20 -mt-16 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                {loading ? (
                    <div className="flex justify-center p-24 bg-card rounded-2xl shadow-xl w-full border">
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {products.map(prod => {
                            const isAccountCategory = (catName: string) => {
                                const name = catName.toLowerCase();
                                return name.includes("account") || name.includes("saving") || name.includes("deposit") || name.includes("current");
                            };
                            const isAccount = isAccountCategory(prod.category);
                            const prodTerms = prod.financial_terms?.[0] as any;
                            return (
                                <div key={prod.id} className="group bg-card text-card-foreground rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-300 border flex flex-col relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                                    <div className="w-14 h-14 rounded-xl bg-blue-50/50 dark:bg-blue-900/30 flex items-center justify-center mb-6 group-hover:bg-primary transition-colors duration-300">
                                        {getIconForProduct(prod.name)}
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-3 font-display">{prod.name}</h3>
                                    <p className="text-muted-foreground text-sm leading-relaxed mb-6 flex-grow line-clamp-3">
                                        {prod.description?.replace(/<[^>]*>?/gm, '')}
                                    </p>

                                    <div className="flex items-center gap-4 mt-auto mb-6 pt-4 border-t w-full">
                                        {prodTerms?.blockType !== 'savings-terms' && (
                                            <>
                                                <div>
                                                    <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Interest</p>
                                                    <p className="text-sm font-bold text-primary">{prodTerms?.interest_rate || 0}% <span className="text-[9px] text-muted-foreground font-normal">p.a</span></p>
                                                </div>
                                                <div className="w-px h-8 bg-border"></div>
                                            </>
                                        )}
                                        <div>
                                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">
                                                {prodTerms?.blockType === 'savings-terms' ? 'Min Deposit' : prodTerms?.blockType === 'fixed-deposit-terms' ? 'Min Deposit' : 'Max Amount'}
                                            </p>
                                            <p className="text-sm font-bold">₦{((prodTerms?.blockType === 'savings-terms' ? prodTerms?.min_balance : prodTerms?.blockType === 'fixed-deposit-terms' ? prodTerms?.min_amount : prodTerms?.max_amount) || 0).toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <Link className="inline-flex items-center text-primary font-semibold text-sm hover:text-accent transition-colors mt-auto group" href={`/product/${prod.id}`}>
                                        Apply Now <ArrowRight className="ml-1 flex-shrink-0 group-hover:translate-x-1 transition-transform" size={16} />
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                )}
            </main>
        </div>
    );
}
