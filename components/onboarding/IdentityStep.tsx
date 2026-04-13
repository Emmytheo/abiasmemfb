"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
            if (res.IsSuccessful) {
                setVerificationResult(res.Payload || res);
                toast.success("Identity details verified successfully!");
            } else {
                toast.error(res.Message || "Identity verification failed.");
            }
        } catch (error: any) {
            toast.error(error.message || "An error occurred during verification.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleContinue = () => {
        onUpdate({ bvn: verificationResult.BVN || verificationResult.bvn });
        onNext();
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
                    <Alert className="bg-primary/5 border-primary/20">
                        <AlertCircle className="h-4 w-4 text-primary" />
                        <AlertTitle className="text-primary font-bold">Details Matched!</AlertTitle>
                        <AlertDescription className="text-muted-foreground">
                            We've successfully retrieved and matched your identity details.
                        </AlertDescription>
                    </Alert>

                    <div className="grid grid-cols-2 gap-4 rounded-xl border p-6 bg-muted/30">
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">First Name</p>
                            <p className="text-lg font-medium">{verificationResult.FirstName || verificationResult.firstName}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Last Name</p>
                            <p className="text-lg font-medium">{verificationResult.LastName || verificationResult.lastName}</p>
                        </div>
                        <div className="col-span-2 pt-2 border-t mt-2">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Verified BVN</p>
                            <p className="text-lg font-mono font-medium tracking-widest">{verificationResult.BVN || verificationResult.bvn}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center pt-8">
                        <Button type="button" variant="ghost" onClick={() => setVerificationResult(null)}>
                            Change BVN
                        </Button>
                        <Button onClick={handleContinue} size="lg" className="px-12 group">
                            Continue
                            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
