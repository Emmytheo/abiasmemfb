"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Landmark, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";

export default function ExploreAccountsPage() {
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

    if (loading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Open an Account</h1>
                <p className="text-muted-foreground mt-1">Discover high-yield savings and flexible business accounts.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {products.length === 0 ? (
                    <div className="col-span-full text-center p-12 border bg-card rounded-xl text-muted-foreground">
                        No active accounts currently available.
                    </div>
                ) : products.map(product => {
                    const isAccountCategory = (catName: string) => {
                        const name = catName.toLowerCase();
                        return name.includes("account") || name.includes("saving") || name.includes("deposit") || name.includes("current");
                    };
                    const isAccount = isAccountCategory(product.category);
                    const prodTerms = product.financial_terms?.[0] as any;
                    return (
                        <Card key={product.id} className="border flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                            <CardHeader className="pt-8">
                                <div className="p-3 w-14 h-14 rounded-full bg-accent text-primary flex items-center justify-center mb-4">
                                    <Landmark className="h-7 w-7" />
                                </div>
                                <CardTitle className="text-xl">{product.name}</CardTitle>
                                <CardDescription>{product.tagline}</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                                <div className="flex items-center gap-4 mt-auto pt-4 border-t w-full">
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
                                <div className="text-sm mt-4 text-muted-foreground line-clamp-3">
                                    {product.description?.replace(/<[^>]*>?/gm, '')}
                                </div>
                            </CardContent>
                            <CardFooter className="pt-6">
                                <Button asChild className="w-full h-12">
                                    <Link href={`/explore/apply/${product.id}`}>Open Account</Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    )
                })}
            </div>
        </div>
    );
}
