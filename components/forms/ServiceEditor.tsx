"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Service, ServiceFormSchema } from "@/lib/api/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SchemaFieldEditor } from "./builder/SchemaFieldEditor";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ServiceEditorProps {
    initialData?: Service;
    isEdit?: boolean;
}

export function ServiceEditor({ initialData, isEdit }: ServiceEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState(initialData?.name || "");
    const [category, setCategory] = useState(initialData?.category || "transfers");
    const [provider, setProvider] = useState(initialData?.provider || "internal");
    const [status, setStatus] = useState<'active' | 'inactive'>(initialData?.status || 'inactive');
    
    const [feeType, setFeeType] = useState<'none' | 'flat' | 'percentage' | 'tiered'>(initialData?.fee_type || 'none');
    const [feeValue, setFeeValue] = useState<string>(initialData?.fee_value?.toString() || "");
    
    const [serviceIntent, setServiceIntent] = useState<'none' | 'transfer_intra' | 'transfer_interbank' | 'transfer_international'>(initialData?.service_intent || 'none');
    
    // Map ServiceFormSchema to FormField for the editor, then map back on save.
    const [formSchema, setFormSchema] = useState<any[]>(initialData?.form_schema || []);

    const handleSave = async () => {
        if (!name) return toast.error("Name is required");
        setLoading(true);
        try {
            const payload: any = {
                id: initialData?.id || `srv_${Date.now()}`,
                name,
                category,
                provider,
                status,
                fee_type: feeType,
                fee_value: feeValue ? parseFloat(feeValue) : 0,
                service_intent: serviceIntent,
                form_schema: formSchema,
                created_at: initialData?.created_at || new Date().toISOString()
            };

            if (isEdit && initialData?.id) {
                await api.updateService(initialData.id, payload);
            } else {
                await api.createService(payload);
            }
            toast.success(`Service ${isEdit ? 'updated' : 'created'} successfully`);
            router.push("/services");
        } catch (error: any) {
            toast.error(error?.message || "Failed to save service");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-5xl animate-in fade-in duration-500 pb-24">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {isEdit ? "Edit Service" : "New Service"}
                        </h1>
                        <p className="text-muted-foreground text-sm">Configure transactional service routing and input requirements.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="shadow-md">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Service
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg">Service Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Interbank Transfer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="transfers">Transfers</SelectItem>
                                            <SelectItem value="bills">Bill Payments</SelectItem>
                                            <SelectItem value="airtime">Airtime/Data</SelectItem>
                                            <SelectItem value="services">Other Services</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Provider</Label>
                                    <Input value={provider} onChange={e => setProvider(e.target.value)} placeholder="e.g. internal, flw, paystack" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Service Intent (Client UI Routing)</Label>
                                    <Select value={serviceIntent} onValueChange={(val: any) => setServiceIntent(val)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Standard Form (None)</SelectItem>
                                            <SelectItem value="transfer_intra">Intra-bank Transfer</SelectItem>
                                            <SelectItem value="transfer_interbank">Inter-bank Transfer</SelectItem>
                                            <SelectItem value="transfer_international">International Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-[10px] text-muted-foreground mt-1">Special intents map to dedicated UI flows in the client portal instead of standard dynamic forms.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg">Service Form Builder</CardTitle>
                            <CardDescription>Design the input fields required to execute this service.</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <SchemaFieldEditor fields={formSchema} onChange={setFormSchema} />
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg">Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="inactive">Inactive</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2 pt-4 border-t">
                                <Label>Fee Type</Label>
                                <Select value={feeType} onValueChange={(val: any) => setFeeType(val)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No Fee</SelectItem>
                                        <SelectItem value="flat">Flat Amount</SelectItem>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {feeType !== 'none' && (
                                <div className="space-y-2">
                                    <Label>Fee Value</Label>
                                    <Input 
                                        type="number" 
                                        value={feeValue} 
                                        onChange={e => setFeeValue(e.target.value)} 
                                        placeholder="e.g. 50"
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
