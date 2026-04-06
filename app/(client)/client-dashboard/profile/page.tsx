"use client";

import React, { useState, useEffect } from "react";
import { 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    ShieldCheck, 
    ShieldAlert, 
    Loader2, 
    Save, 
    RefreshCw,
    Info,
    AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { api, Customer, User as AuthUser } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { z } from "zod";

const profileSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().min(10, "Invalid phone number"),
    address: z.string().optional().nullable(),
});

export default function ClientProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [formData, setFormData] = useState<Partial<Customer>>({});
    const [initialData, setInitialData] = useState<Partial<Customer>>({});

    useEffect(() => {
        async function loadProfile() {
            try {
                const supabase = createClient();
                const { data: { user: supaUser } } = await supabase.auth.getUser();
                if (!supaUser) return;

                // Lookup by email to bridge Supabase -> Payload Customer
                const allCustomers = await api.getAllCustomers();
                const currentCust = allCustomers.find(c => 
                    c.email === supaUser.email || c.supabase_id === supaUser.id
                );

                if (currentCust) {
                    setCustomer(currentCust);
                    const initial = {
                        firstName: currentCust.firstName,
                        lastName: currentCust.lastName,
                        email: currentCust.email,
                        phone_number: currentCust.phone_number,
                        address: currentCust.address,
                    };
                    setFormData(initial);
                    setInitialData(initial);
                }
            } catch (error) {
                toast.error("Failed to load profile data.");
            } finally {
                setIsLoading(false);
            }
        }
        loadProfile();
    }, []);

    const isProtectedFieldChanged = 
        formData.email !== initialData.email || 
        formData.phone_number !== initialData.phone_number;

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;

        const validation = profileSchema.safeParse(formData);
        if (!validation.success) {
            toast.error(validation.error.issues[0]?.message || "Invalid form data");
            return;
        }

        if (isProtectedFieldChanged) {
            toast.warning("Re-verification Required", {
                description: "Changing your email or phone number will trigger a mandatory re-verification workflow."
            });
        }

        setIsSaving(true);
        try {
            const updated = await api.updateCustomer(customer.id, formData);
            if (updated) {
                setCustomer(updated);
                setInitialData(formData);
                toast.success("Profile updated successfully", {
                    description: isProtectedFieldChanged ? "Verification codes have been dispatched." : "Your changes are now live."
                });
            }
        } catch (error) {
            toast.error("Update failed. Please try again later.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-10 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-muted-foreground">Fetching registry data...</p>
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="max-w-4xl mx-auto p-10 text-center">
                <h2 className="text-2xl font-bold">Profile not found</h2>
                <p className="text-muted-foreground mt-2">Your banking identity has not been synchronized yet.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header>
                <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">Account Management</p>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Profile Profile</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl">
                    Manage your personal identity data and security communications.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Form */}
                <Card className="lg:col-span-2 border-primary/5 shadow-xl shadow-primary/5">
                    <CardHeader className="bg-primary/[0.02] border-b">
                        <CardTitle className="text-lg">Identity Details</CardTitle>
                        <CardDescription>Updates to protected fields will trigger re-onboarding.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-8">
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-xs font-black uppercase tracking-wider text-muted-foreground">First Name</Label>
                                    <Input 
                                        id="firstName" 
                                        value={formData.firstName || ""} 
                                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                                        className="h-11 bg-accent/20 border-accent/40"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Last Name</Label>
                                    <Input 
                                        id="lastName" 
                                        value={formData.lastName || ""} 
                                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                                        className="h-11 bg-accent/20 border-accent/40"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Email Address</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        id="email" 
                                        type="email"
                                        value={formData.email || ""} 
                                        onChange={e => setFormData({...formData, email: e.target.value})}
                                        className="h-11 pl-10 bg-accent/20 border-accent/40"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Phone Number</Label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Input 
                                        id="phone" 
                                        value={formData.phone_number || ""} 
                                        onChange={e => setFormData({...formData, phone_number: e.target.value})}
                                        className="h-11 pl-10 bg-accent/20 border-accent/40"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address" className="text-xs font-black uppercase tracking-wider text-muted-foreground">Residential Address</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                                    <Textarea 
                                        id="address" 
                                        value={formData.address || ""} 
                                        onChange={e => setFormData({...formData, address: e.target.value})}
                                        className="pl-10 min-h-[100px] bg-accent/20 border-accent/40 resize-none pt-2.5"
                                    />
                                </div>
                            </div>

                            {isProtectedFieldChanged && (
                                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                    <div className="text-xs text-amber-900/80 leading-relaxed">
                                        <p className="font-bold text-amber-900">Mandatory Re-verification</p>
                                        Updating your primary communication channels requires a security handshake with the core registry. Access to certain features may be restricted during this period.
                                    </div>
                                </div>
                            )}

                            <Button 
                                type="submit" 
                                className={`w-full h-12 shadow-lg transition-all ${isProtectedFieldChanged ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20' : 'shadow-primary/20'}`}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Ledger...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        {isProtectedFieldChanged ? 'Initiate Re-verification' : 'Save Profile Updates'}
                                    </>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Right: Info */}
                <div className="space-y-6">
                    <Card className="shadow-lg shadow-emerald-500/5">
                        <CardHeader>
                            <CardTitle className="text-lg">Compliance Status</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">KYC Level</span>
                                <Badge variant={customer.kyc_status === 'active' ? 'default' : 'secondary'} className="capitalize">
                                    {customer.kyc_status}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Risk Rating</span>
                                <Badge variant="outline" className={`capitalize font-bold border-none ${
                                    customer.risk_tier === 'low' ? 'text-emerald-500 bg-emerald-50' : 
                                    customer.risk_tier === 'medium' ? 'text-amber-500 bg-amber-50' : 
                                    'text-rose-500 bg-rose-50'
                                }`}>
                                    {customer.risk_tier} Risk
                                </Badge>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Verified Registry Data</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground leading-relaxed">
                                    Your information is synchronized with the Central Bank of Nigeria's registry via the core banking engine.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900 border-zinc-800 text-white">
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-zinc-400" />
                                <CardTitle className="text-zinc-400 text-[10px] uppercase tracking-widest font-black">Data Privacy</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-[11px] text-zinc-500 leading-relaxed">
                                we use AES-256 encryption to protect your identity data both at rest and in transit between our systems and the core banking ledger.
                            </p>
                            <Button variant="ghost" size="sm" className="w-full h-8 text-[10px] text-zinc-400 hover:text-white hover:bg-white/5 border border-white/10 uppercase tracking-widest font-black">
                                Request Data Export
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
