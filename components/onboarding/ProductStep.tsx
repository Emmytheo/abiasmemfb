"use client";

import { useState } from "react";
import { ProductType } from "@/lib/api/types";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ArrowLeft, Check, Loader2, CreditCard, Sparkles, Building2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

interface ProductStepProps {
    data: any;
    products: ProductType[];
    onUpdate: (data: any) => void;
    onComplete: (result: { accountNumber: string; customerId: string }) => void;
    onBack: () => void;
}

export function ProductStep({ data, products, onUpdate, onComplete, onBack }: ProductStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<string>(data.productTypeId || "");

    const handleProvisioning = async () => {
        if (!selectedProduct) {
            toast.error("Please select a product to continue.");
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.createCoreBankingProfile({
                ...data,
                productTypeId: selectedProduct,
            });
            
            toast.success("Banking identity provisioned successfully!");
            onComplete({
                accountNumber: res.accountNumber,
                customerId: res.customerId
            });
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to provision banking identity. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <CreditCard className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Select Your Product</h2>
                <p className="text-muted-foreground">Choose the banking plan that best fits your needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 text-center p-12 border-2 border-dashed rounded-2xl">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Fetching available products...</p>
                    </div>
                ) : (
                    products.map((product) => {
                        const isSelected = selectedProduct === product.id;
                        const isBusiness = product.name.toLowerCase().includes('business');
                        
                        return (
                            <div 
                                key={product.id}
                                onClick={() => setSelectedProduct(product.id)}
                                className={cn(
                                    "relative cursor-pointer group rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-lg",
                                    isSelected 
                                        ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                                        : "border-muted hover:border-primary/50"
                                )}
                            >
                                {isSelected && (
                                    <div className="absolute -top-3 -right-3 h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-lg animate-in zoom-in">
                                        <Check className="h-5 w-5" />
                                    </div>
                                )}
                                
                                <div className="flex items-start gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-xl flex items-center justify-center transition-colors shrink-0",
                                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    )}>
                                        {isBusiness ? <Building2 className="h-6 w-6" /> : <UserCircle2 className="h-6 w-6" />}
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-bold text-xl">{product.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">{product.tagline || product.description}</p>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span>Instant Account Opening</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                        <span>Secure Mobile Banking</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t flex items-center justify-between">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Premium Plan</span>
                                    {isSelected ? (
                                        <span className="text-sm font-semibold flex items-center gap-1 text-primary">
                                            Selected <Sparkles className="h-3 w-3" />
                                        </span>
                                    ) : (
                                        <span className="text-sm font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                            Select Plan
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="flex justify-between items-center pt-8">
                <Button type="button" variant="ghost" onClick={onBack} disabled={isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>
                <Button 
                    onClick={handleProvisioning} 
                    disabled={isLoading || !selectedProduct} 
                    size="lg" 
                    className="px-12 relative h-14 min-w-[200px]"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-3">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span>Provisioning...</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <span>Open My Account</span>
                            <Sparkles className="h-4 w-4" />
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
