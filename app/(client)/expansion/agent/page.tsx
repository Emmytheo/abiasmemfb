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
    Upload,
    Store
} from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";

export default function AgentUpgradePage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        businessName: "",
        bvn: "",
        locationAddress: "",
        dailyVolume: "50,000 - 200,000",
        posRequested: "1",
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

            const appPayload = {
                user_id: user.id,
                product_type_id: "upgrade_agent",
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
                        agent_upgrade_status: 'pending',
                        ...formData
                    }
                });
            }

            toast.success("Agency application submitted!", {
                description: "Our agent network team is reviewing your location."
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
                        <Store className="size-8" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">Become an Agent</h1>
                    <p className="text-muted-foreground font-medium">
                        Apply to join the Agency Banking network, get POS terminals, and earn commissions.
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
                            <CardTitle>Agent Information</CardTitle>
                            <CardDescription>Tell us about yourself and where you plan to operate.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Shop / Trade Name (Optional)</Label>
                                <div className="relative">
                                    <Store className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        value={formData.businessName}
                                        onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                                        className="h-11 pl-10" 
                                        placeholder="e.g. Mama Chinedu Provisions" 
                                    />
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Bank Verification Number (BVN)</Label>
                                <Input 
                                    value={formData.bvn}
                                    onChange={(e) => setFormData({...formData, bvn: e.target.value})}
                                    className="h-11" 
                                    placeholder="22000000000" 
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Physical Operating Location</Label>
                                <Input 
                                    value={formData.locationAddress}
                                    onChange={(e) => setFormData({...formData, locationAddress: e.target.value})}
                                    className="h-11" 
                                    placeholder="Stall 14, Main Market, City" 
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                onClick={handleNext} 
                                disabled={!formData.bvn || !formData.locationAddress}
                                className="w-full h-12 font-black text-sm"
                            >
                                Continue to Volumes <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </CardFooter>
                    </Card>
                )}

                {step === 2 && (
                    <Card className="border-primary/10 shadow-xl shadow-primary/5">
                        <CardHeader>
                            <CardTitle>Hardware & Volume</CardTitle>
                            <CardDescription>Let us know your expected capacity to allocate hardware.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="p-8 border-2 border-dashed border-border/60 rounded-xl bg-muted/20 flex flex-col items-center justify-center text-center gap-3">
                                <div className="p-3 bg-primary/10 rounded-full text-primary">
                                    <Upload className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Upload Utility Bill</p>
                                    <p className="text-xs text-muted-foreground mt-1">Proof of operating address (e.g. NEPA bill, Tenancy Agreement).</p>
                                </div>
                                <Button variant="outline" size="sm" className="mt-2">Browse Files</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Expected Daily Volume</Label>
                                    <select 
                                        value={formData.dailyVolume}
                                        onChange={(e) => setFormData({...formData, dailyVolume: e.target.value})}
                                        className="w-full h-11 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-1 focus:ring-ring"
                                    >
                                        <option>Under 50,000 ₦</option>
                                        <option>50,000 - 200,000 ₦</option>
                                        <option>200,000 - 500,000 ₦</option>
                                        <option>Above 500,000 ₦</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Terminals Required</Label>
                                    <select 
                                        value={formData.posRequested}
                                        onChange={(e) => setFormData({...formData, posRequested: e.target.value})}
                                        className="w-full h-11 bg-background border border-input rounded-md px-3 text-sm font-medium focus:ring-1 focus:ring-ring"
                                    >
                                        <option>1 Terminal</option>
                                        <option>2 Terminals</option>
                                        <option>3+ Terminals</option>
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
                                    Your Agency Banking request is pending review by our field officers. You will receive an SMS when your POS terminal is ready for pickup.
                                </p>
                            </div>
                            <div className="bg-white/60 rounded-xl p-4 border border-emerald-100 flex items-start gap-3 text-left mx-auto max-w-sm mt-8">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-xs text-emerald-950">Estimated Turnaround</p>
                                    <p className="text-[11px] text-emerald-800/80 mt-0.5">Reviews and terminal provisioning typically take 3-5 business days.</p>
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
