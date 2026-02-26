"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building, Briefcase, CheckCircle2, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { ProductType } from "@/lib/api/types";

export default function ExploreLoansPage() {
    const [products, setProducts] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAllProductTypes().then(types => {
            setProducts(types.filter(t => t.category === 'loans' && t.status === 'active'));
            setLoading(false);
        });
    }, []);

    if (loading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Explore Loans</h1>
                <p className="text-muted-foreground mt-1">Get the financial support you need to achieve your goals.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-8">
                {products.length === 0 ? (
                    <div className="col-span-full text-center p-12 border bg-card rounded-xl text-muted-foreground">
                        No active loans currently available.
                    </div>
                ) : products.map(product => (
                    <Card key={product.id} className="border flex flex-col hover:shadow-md transition-shadow relative overflow-hidden">
                        <CardHeader className="pt-8">
                            <div className="p-3 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                <Building className="h-7 w-7 text-primary" />
                            </div>
                            <CardTitle className="text-xl">{product.name}</CardTitle>
                            <CardDescription>{product.tagline}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                                <span className="text-muted-foreground">Interest Rate</span>
                                <span className="font-bold text-primary">{product.interest_rate}% P.A.</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 bg-muted/50 rounded-lg">
                                <span className="text-muted-foreground">Amount Limit</span>
                                <span className="font-bold">Up to ₦{product.max_amount?.toLocaleString()}</span>
                            </div>
                            <div className="text-sm mt-4 text-muted-foreground line-clamp-3">
                                {product.description}
                            </div>
                        </CardContent>
                        <CardFooter className="pt-6">
                            <Button asChild className="w-full h-12">
                                <Link href={`/explore/apply/${product.id}`}>Apply Now</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
