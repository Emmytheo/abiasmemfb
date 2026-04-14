"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, ProductType } from "@/lib/api/types";
import { ProfileStep } from "./ProfileStep";
import { IdentityStep } from "./IdentityStep";
import { ProductStep } from "./ProductStep";
import { CelebrationStep } from "./CelebrationStep";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, User as UserIcon, ShieldCheck, CreditCard, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
    user: any; // Supabase User
    products: ProductType[];
    initialCustomerData?: any;
}

export function OnboardingWizard({ user, products, initialCustomerData }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        userId: user.id,
        firstName: initialCustomerData?.firstName || user.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: initialCustomerData?.lastName || user.user_metadata?.full_name?.split(' ')[1] || "",
        email: user.email || "",
        phone_number: initialCustomerData?.phone_number || "",
        dob: initialCustomerData?.dob || "",
        gender: initialCustomerData?.gender || 0,
        address: initialCustomerData?.address || "",
        bvn: initialCustomerData?.bvn || "",
        productTypeId: "",
    });

    const [registrationResult, setRegistrationResult] = useState<{
        accountNumber: string;
        customerId: string;
    } | null>(null);

    const steps = [
        { id: 1, name: "Profile", icon: UserIcon },
        { id: 2, name: "Identity", icon: ShieldCheck },
        { id: 3, name: "Plan", icon: CreditCard },
        { id: 4, name: "Done", icon: PartyPopper },
    ];

    const nextStep = () => setStep((s) => Math.min(s + 1, 4));
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const updateFormData = (data: Partial<typeof formData>) => {
        setFormData((prev) => ({ ...prev, ...data }));
    };

    return (
        <div className="space-y-8 p-0">
            {/* Progress Header */}
            <div className="relative flex justify-between">
                <div className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-muted transition-all duration-500" />
                <div 
                    className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-in-out" 
                    style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                />
                
                {steps.map((s) => {
                    const Icon = s.icon;
                    const isActive = step === s.id;
                    const isCompleted = step > s.id;

                    return (
                        <div key={s.id} className="relative z-10 flex flex-col items-center">
                            <div 
                                className={cn(
                                    "flex h-12 w-12 items-center justify-center rounded-full border-2 bg-background transition-all duration-300",
                                    isActive && "border-primary ring-4 ring-primary/10",
                                    isCompleted && "border-primary bg-primary text-primary-foreground"
                                )}
                            >
                                {isCompleted ? <Check className="h-6 w-6" /> : <Icon className={cn("h-6 w-6", isActive ? "text-primary" : "text-muted-foreground")} />}
                            </div>
                            <span className={cn(
                                "mt-2 text-xs font-medium transition-colors",
                                isActive ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {s.name}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Main Content Card */}
            <Card className="overflow-hidden border-none shadow-2xl bg-background/60 backdrop-blur-xl">
                <CardContent className="p-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={step}
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: -20, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="p-8 md:p-12"
                        >
                            {step === 1 && (
                                <ProfileStep 
                                    data={formData} 
                                    onUpdate={updateFormData} 
                                    onNext={nextStep} 
                                />
                            )}
                            {step === 2 && (
                                <IdentityStep 
                                    data={formData} 
                                    onUpdate={updateFormData} 
                                    onNext={nextStep}
                                    onBack={prevStep}
                                />
                            )}
                            {step === 3 && (
                                <ProductStep 
                                    data={formData} 
                                    products={products}
                                    onUpdate={updateFormData} 
                                    onComplete={(result: any) => {
                                        setRegistrationResult(result);
                                        nextStep();
                                    }}
                                    onBack={prevStep}
                                />
                            )}
                            {step === 4 && registrationResult && (
                                <CelebrationStep 
                                    accountNumber={registrationResult.accountNumber} 
                                    customerId={registrationResult.customerId}
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </CardContent>
            </Card>
        </div>
    );
}
