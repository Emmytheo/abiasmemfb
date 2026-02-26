"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, ArrowRight, HeartHandshake, Store, Users, Bike, Rocket, Banknote, Sprout, ScrollText, Building, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";

// Helper to map an icon
function getIconForLoan(name: string) {
    const l = name.toLowerCase();
    if (l.includes('poverty') || l.includes('women')) return <HeartHandshake size={24} />;
    if (l.includes('group') || l.includes('team')) return <Users size={24} />;
    if (l.includes('ride') || l.includes('bike')) return <Bike size={24} />;
    if (l.includes('start') || l.includes('nysc')) return <Rocket size={24} />;
    if (l.includes('salary') || l.includes('advance')) return <Banknote size={24} />;
    if (l.includes('agric') || l.includes('farm')) return <Sprout size={24} />;
    if (l.includes('lpo') || l.includes('contract')) return <ScrollText size={24} />;
    return <Store size={24} />;
}

export default function Business() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAllProductTypes().then(types => {
            setProducts(types.filter(t => t.category === 'loans'));
            setLoading(false);
        });
    }, []);

    const featuredProduct = products.length > 0 ? products[0] : null;

    return (
        <div className="animate-in fade-in duration-700">
            {/* Hero Section */}
            <div className="relative bg-hero-pattern bg-cover bg-center h-[650px] pt-16 lg:pt-24 flex items-center justify-center text-center px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-primary/80 mix-blend-multiply"></div>
                <div className="relative max-w-4xl mx-auto z-10">
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white mb-6 leading-tight">
                        Empowering Growth with <br /><span className="text-accent">Flexible Financing</span>
                    </h1>
                    <p className="mt-4 max-w-2xl mx-auto text-xl text-white/80">
                        Tailored financial solutions designed to support your personal ambitions and business expansion across Abia State and beyond.
                    </p>
                    <div className="mt-10 flex flex-col lg:flex-row items-center justify-center gap-4">
                        <Link className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-primary bg-white hover:bg-gray-100 transition-colors shadow-lg" href="#featured">
                            View Featured Loan
                        </Link>
                        <Link className="inline-flex items-center px-8 py-3 border border-white text-base font-medium rounded-full text-white hover:bg-white/10 transition-colors" href="#all-loans">
                            Explore All Products
                        </Link>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex w-full justify-center p-24"><Loader2 className="h-10 w-10 text-primary animate-spin" /></div>
            ) : (
                <>
                    {/* Featured Loan Section */}
                    {featuredProduct && (
                        <div className="py-16 sm:py-24 bg-card text-card-foreground" id="featured">
                            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                                    <div className="relative rounded-2xl overflow-hidden shadow-2xl group border">
                                        <div className="absolute inset-0 bg-primary/10 group-hover:bg-transparent transition-colors duration-500 z-10"></div>
                                        <img
                                            alt={featuredProduct.name}
                                            className="w-full h-[500px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                                            src={featuredProduct.image_url || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80"}
                                        />
                                    </div>
                                    <div className="space-y-8">
                                        <div className="inline-flex items-center space-x-2">
                                            <span className="h-px w-8 bg-accent"></span>
                                            <span className="text-accent font-bold uppercase tracking-wider text-sm">Featured Product</span>
                                        </div>
                                        <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">
                                            {featuredProduct.name}
                                        </h2>
                                        <p className="text-lg text-muted-foreground leading-relaxed">
                                            {featuredProduct.description}
                                        </p>
                                        <div className="bg-muted p-6 rounded-xl border-l-4 border-accent">
                                            <h3 className="font-display font-bold text-xl mb-4 text-foreground">Key Features</h3>
                                            <ul className="space-y-3">
                                                <li className="flex items-start">
                                                    <CheckCircle className="text-accent mr-2 flex-shrink-0 mt-0.5" size={18} />
                                                    <span className="text-muted-foreground text-sm font-medium">Competitive Interest: {featuredProduct.interest_rate}%</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle className="text-accent mr-2 flex-shrink-0 mt-0.5" size={18} />
                                                    <span className="text-muted-foreground text-sm font-medium">Limits between ₦{featuredProduct.min_amount?.toLocaleString() || 0} to ₦{featuredProduct.max_amount?.toLocaleString() || 0}</span>
                                                </li>
                                                <li className="flex items-start">
                                                    <CheckCircle className="text-accent mr-2 flex-shrink-0 mt-0.5" size={18} />
                                                    <span className="text-muted-foreground text-sm font-medium">Fast processing & dedicated support</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <Link href={`/product/${featuredProduct.id}`} className="inline-flex items-center px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition-colors shadow-lg shadow-primary/30">
                                            Apply Now <ArrowRight className="ml-2" size={16} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* All Loans Grid */}
                    <div className="py-16 bg-background" id="all-loans">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Other Financial Products</h2>
                                <p className="text-muted-foreground max-w-2xl mx-auto">Comprehensive financial solutions tailored to every stage of your personal and business journey.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {products.map(prod => (
                                    <div key={prod.id} className="bg-card text-card-foreground p-8 rounded-2xl shadow-lg border hover:-translate-y-1 transition-transform duration-300 flex flex-col">
                                        <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                                            {getIconForLoan(prod.name)}
                                        </div>
                                        <h4 className="text-xl font-bold text-foreground mb-3">{prod.name}</h4>
                                        <p className="text-muted-foreground leading-relaxed text-sm mb-6 flex-grow">{prod.tagline}</p>

                                        <div className="space-y-1 mb-6 text-xs text-muted-foreground font-mono bg-muted/30 p-3 rounded-lg border">
                                            <div className="flex justify-between"><span>Max Limit</span><span className="font-semibold text-foreground">₦{prod.max_amount?.toLocaleString() || 'N/A'}</span></div>
                                            <div className="flex justify-between"><span>Rate</span><span className="font-semibold text-emerald-500">{prod.interest_rate}%</span></div>
                                        </div>

                                        <Link className="inline-flex justify-between w-full items-center text-primary font-semibold text-sm hover:text-accent transition-colors" href={`/product/${prod.id}`}>
                                            <span>Learn More</span>
                                            <ArrowRight size={16} />
                                        </Link>
                                    </div>
                                ))}

                                {/* Contact Card */}
                                <div className="bg-primary p-8 rounded-2xl shadow-lg hover:-translate-y-1 transition-transform duration-300 flex flex-col justify-center items-center text-center">
                                    <h3 className="text-xl font-display font-bold text-white mb-4">Need Something Else?</h3>
                                    <p className="text-blue-100 text-sm leading-relaxed mb-6">
                                        We have customized solutions for unique financial situations. Talk to our loan officers today.
                                    </p>
                                    <button className="bg-white text-primary font-medium px-6 py-2.5 rounded-full hover:bg-gray-100 transition-colors w-full shadow-md">
                                        Contact Us
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
