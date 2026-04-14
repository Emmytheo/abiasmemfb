"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const identitySchema = z.object({
    bvn: z.string().length(11, "BVN must be exactly 11 digits"),
});

type IdentityFormData = z.infer<typeof identitySchema>;

interface IdentityStepProps {
    data: any;
    onUpdate: (data: any) => void;
    onNext: () => void;
    onBack: () => void;
}

export function IdentityStep({ data, onUpdate, onNext, onBack }: IdentityStepProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<IdentityFormData>({
        resolver: zodResolver(identitySchema),
        defaultValues: {
            bvn: data.bvn,
        },
    });

    const onVerify = async (values: { bvn: string }) => {
        setIsLoading(true);
        try {
            const res = await api.verifyIdentity(values.bvn);
            if (res.success) {
                // Identity Matching Logic
                const profileFirst = data.firstName?.toLowerCase().trim();
                const profileLast = data.lastName?.toLowerCase().trim();
                const registryFirst = res.firstName?.toLowerCase().trim();
                const registryLast = res.lastName?.toLowerCase().trim();

                const isMatch = (registryFirst && profileFirst && (registryFirst.includes(profileFirst) || profileFirst.includes(registryFirst))) ||
                               (registryLast && profileLast && (registryLast.includes(profileLast) || profileLast.includes(registryLast)));

                if (!isMatch) {
                    toast.error("Identity mismatch: The details on this BVN do not match the profile names provided.");
                    return;
                }

                setVerificationResult(res);
                toast.success(`Identity verified: Welcome, ${res.firstName}!`);
            } else {
                toast.error(res.message || "Identity verification failed.");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred during verification.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = async () => {
        setIsLoading(true);
        try {
            const success = await api.skipOnboarding(data.userId);
            if (success) {
                toast.success("Onboarding skipped. You can complete it later from the dashboard.");
                // Use location.href to ensure a full reload and trigger the guard in layout.tsx
                window.location.href = "/client-dashboard";
            } else {
                toast.error("Failed to skip onboarding.");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred while skipping.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = async () => {
        try {
            const bvn = verificationResult.bvn;
            await api.saveOnboardingDraft({
                userId: data.userId,
                email: data.email,
                bvn: bvn,
                firstName: verificationResult.firstName,
                lastName: verificationResult.lastName,
            });
            onUpdate({ bvn });
            onNext();
        } catch (error) {
            console.error("Failed to save draft:", error);
            onNext();
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                    <ShieldCheck className="h-6 w-6" />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Identity Verification</h2>
                <p className="text-muted-foreground">We need to verify your details against the national registry.</p>
            </div>

            {!verificationResult ? (
                <form onSubmit={handleSubmit(onVerify)} className="space-y-6">
                    <div className="space-y-4 max-w-md mx-auto">
                        <div className="space-y-2">
                            <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
                            <Input 
                                id="bvn" 
                                {...register("bvn")} 
                                placeholder="22233344455" 
                                maxLength={11}
                                className="text-center text-2xl tracking-widest h-14"
                            />
                            {errors.bvn && <p className="text-sm text-destructive text-center">{errors.bvn.message as string}</p>}
                        </div>
                        <p className="text-xs text-muted-foreground text-center">
                            Your BVN is used strictly for KYC verification as required by the CBN.
                        </p>
                    </div>

                    <div className="flex justify-between items-center pt-8">
                        <Button type="button" variant="ghost" onClick={onBack}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button type="submit" disabled={isLoading} size="lg" className="px-12">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Verifying...
                                </>
                            ) : (
                                "Verify Identity"
                            )}
                        </Button>
                    </div>
                </form>
            ) : (
                <div className="space-y-6 max-w-lg mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 px-3 py-1 flex items-center gap-1.5">
                            <CheckCircle2 className="h-4 w-4" />
                            Verified Identity
                        </Badge>
                        <UserCheck className="h-6 w-6 text-green-500" />
                    </div>

                    <Alert className="bg-primary/5 border-primary/20">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-bold">Details Matched!</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            National identity registry confirms your information.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-6 rounded-2xl border p-8 bg-muted/30 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <ShieldCheck className="h-24 w-24" />
                        </div>
                        
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">First Name</p>
                            <p className="text-xl font-semibold tracking-tight">{verificationResult.firstName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Last Name</p>
                            <p className="text-xl font-semibold tracking-tight">{verificationResult.lastName}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Associated Phone</p>
                            <p className="text-lg font-medium">
                                {verificationResult.phone ? 
                                    `${verificationResult.phone.slice(0, 4)}...${verificationResult.phone.slice(-4)}` : 
                                    "No phone linked"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold">Verified BVN</p>
                            <p className="text-lg font-mono font-medium tracking-widest">{verificationResult.bvn}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8">
                        <Button type="button" variant="ghost" onClick={() => setVerificationResult(null)} disabled={isLoading}>
                            Change BVN
                        </Button>
                        <div className="flex gap-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleSkip} 
                                disabled={isLoading}
                                className="border-primary/20 hover:bg-primary/5"
                            >
                                Skip for now
                            </Button>
                            <Button onClick={handleContinue} disabled={isLoading} size="lg" className="px-12 group shadow-lg shadow-primary/20">
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
