"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
    Briefcase, 
    Building, 
    Check, 
    ChevronRight, 
    FileText, 
    Loader2, 
    ShieldCheck, 
    Upload
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function MerchantUpgradePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        businessName: "",
        rcNumber: "",
        taxId: "",
        businessAddress: "",
        industry: "Retail & Commerce",
        annualVolume: "10M - 50M",
    });

    const handleNext = () => setStep(step + 1);
    const handleBack = () => setStep(step - 1);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                toast.error("Authentication required");
                return;
            }

            // Create an "application" representing this upgrade request
            const appPayload = {
                user_id: user.id,
                product_type_id: "upgrade_merchant",
                status: "pending" as const,
                workflow_stage: "submitted",
                submitted_data: {},
                kyc_data: formData,
            };

            await api.createProductApplication(appPayload);

            // Also update the customer metadata immediately to show they applied
            const customers = await api.getAllCustomers();
            const me = customers.find(c => c.supabase_id === user.id);
            if (me) {
                await api.updateCustomer(me.id, {
                    metadata: {
                        ...(me.metadata || {}),
                        merchant_upgrade_status: 'pending',
                        ...formData
                    }
                });
            }

            toast.success("Merchant application submitted!", {
                description: "Our compliance team is reviewing your documents."
            });
            
            // Advance to success step
            setStep(3);
        } catch (error) {
            toast.error("Failed to submit application");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6">
            <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                <div className="text-center space-y-2">
                    <div className="mx-auto size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/5 border border-primary/20">
                        <Briefcase className="size-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Expand to Merchant Suite</h1>
                    <p className="text-muted-foreground font-medium">
                        Unlock corporate invoicing, checkout sandbox, and API integrations.
                    </p>
                </div>

                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center gap-2">
                            <div className={`h-2.5 rounded-full transition-all duration-500 ${step >= s ? 'w-12 bg-primary' : 'w-4 bg-muted'}`} />
                        </div>
                    ))}
                </div>

                {step === 1 && (
                    <Card className="border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle>Corporate Identity</CardTitle>
                            <CardDescription>We need your registered corporate entity information to process the upgrade.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Registered Business Name</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                                        className="h-11 pl-10" 
                                        placeholder="e.g. Acme Corporation Ltd" 
                                    />
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">RC Number</Label>
                                    <Input 
                                        value={formData.rcNumber}
                                        onChange={(e) => setFormData({...formData, rcNumber: e.target.value})}
                                        className="h-11" 
                                        placeholder="RC-123456" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Tax ID Number (TIN)</Label>
                                    <Input 
                                        value={formData.taxId}
                                        onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                                        className="h-11" 
                                        placeholder="00000000-0000" 
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Operating Address</Label>
                                <Input 
                                    value={formData.businessAddress}
                                    onChange={(e) => setFormData({...formData, businessAddress: e.target.value})}
                                    className="h-11" 
                                    placeholder="123 Business Avenue, City" 
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleNext} 
                                disabled={!formData.businessName || !formData.rcNumber}
                                className="w-full h-12 font-black text-sm"
                            >
                                Continue to Compliance <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle>Compliance & Documents</CardTitle>
                            <CardDescription>Upload necessary corporate filings for registry verification.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-8 border-2 border-dashed border-border/60 rounded-xl bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Upload CAC Certificate</p>
                                    <p className="text-xs text-muted-foreground mt-1">Drag and drop your PDF or Image file here.</p>
                                </div>
                                <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Industry Sector</Label>
                                    <select 
                                        value={formData.industry}
                                        onChange={(e) => setFormData({...formData, industry: e.target.value})}
                                        className="w-full h-11 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-1 focus:ring-ring"
                                    >
                                        <option>Retail & Commerce</option>
                                        <option>Technology & Software</option>
                                        <option>Logistics & Transport</option>
                                        <option>Healthcare</option>
                                        <option>Agriculture</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Est. Annual Volume</Label>
                                    <select 
                                        value={formData.annualVolume}
                                        onChange={(e) => setFormData({...formData, annualVolume: e.target.value})}
                                        className="w-full h-11 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-1 focus:ring-ring"
                                    >
                                        <option>Under 10M ₦</option>
                                        <option>10M - 50M ₦</option>
                                        <option>50M - 200M ₦</option>
                                        <option>Above 200M ₦</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-4">
                            <Button variant="outline" onClick={handleBack} className="w-1/3 h-12 font-bold">Back</Button>
                            <Button onClick={handleSubmit} disabled={loading} className="w-2/3 h-12 font-black">
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Submit Application
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 3 && (
                    <Card className="border-emerald-500/20 shadow-xl shadow-emerald-500/5 bg-emerald-50/30">
                        <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
                            <div className="mx-auto size-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/20">
                                <Check className="size-10" />
                            </div>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-black text-emerald-950">Application in Review!</h2>
                                <p className="text-sm font-medium text-emerald-900/70 max-w-sm mx-auto">
                                    Your merchant upgrade application is now pending review by our compliance desk. You will receive an email once it is approved.
                                </p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-4 border border-emerald-100 flex items-start gap-3 text-left mx-auto max-w-sm mt-8">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-xs text-emerald-950">Estimated Turnaround</p>
                                    <p className="text-[11px] text-emerald-800/80 mt-0.5">Reviews are typically completed within 24-48 business hours.</p>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="pb-8 px-8">
                            <Button onClick={() => router.push('/client-dashboard')} className="w-full h-12 font-black bg-emerald-600 hover:bg-emerald-700 text-white">
                                Return to Dashboard
                            </Button>
                        </CardFooter>
                    </Card>
                )}

            </div>
        </div>
    );
}
