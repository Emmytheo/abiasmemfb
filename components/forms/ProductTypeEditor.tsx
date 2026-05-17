"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProductType, FormField } from "@/lib/api/types";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SchemaFieldEditor } from "./builder/SchemaFieldEditor";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface ProductTypeEditorProps {
    initialData?: ProductType;
    isEdit?: boolean;
}

export function ProductTypeEditor({ initialData, isEdit }: ProductTypeEditorProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    const [name, setName] = useState(initialData?.name || "");
    const [category, setCategory] = useState(initialData?.category || "loan");
    const [tagline, setTagline] = useState(initialData?.tagline || "");
    const [description, setDescription] = useState(initialData?.description || "");
    const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");
    const [status, setStatus] = useState<'active' | 'draft' | 'archived'>(initialData?.status || 'draft');
    
    const [workflowStages, setWorkflowStages] = useState<string>(
        (initialData?.workflow_stages || ['Submitted', 'Under Review', 'Approved']).join(", ")
    );
    
    const [formSchema, setFormSchema] = useState<FormField[]>(initialData?.form_schema || []);

    const handleSave = async () => {
        if (!name) return toast.error("Name is required");
        setLoading(true);
        try {
            const payload: any = {
                id: initialData?.id || `pt_${Date.now()}`,
                name,
                category,
                tagline,
                description,
                image_url: imageUrl,
                status,
                workflow_stages: workflowStages.split(",").map(s => s.trim()).filter(Boolean),
                form_schema: formSchema,
                financial_terms: initialData?.financial_terms || [], // Kept simple for MVP
                created_at: initialData?.created_at || new Date().toISOString()
            };

            await api.saveProductType(payload);
            toast.success(`Product type ${isEdit ? 'updated' : 'created'} successfully`);
            router.push("/products/types");
        } catch (error: any) {
            toast.error(error?.message || "Failed to save product type");
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
                            {isEdit ? "Edit Product Type" : "New Product Type"}
                        </h1>
                        <p className="text-muted-foreground text-sm">Configure the product definition and application form.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.back()} disabled={loading}>Cancel</Button>
                    <Button onClick={handleSave} disabled={loading} className="shadow-md">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Product
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg">Product Details</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Target Savings" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="loan">Loan</SelectItem>
                                            <SelectItem value="savings">Savings</SelectItem>
                                            <SelectItem value="deposit">Fixed Deposit</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Tagline</Label>
                                <Input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="Short, catchy phrase" />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Full description of the product..." className="min-h-[100px]" />
                            </div>
                            <div className="space-y-2">
                                <Label>Hero Image URL</Label>
                                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..." />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm">
                        <CardHeader className="bg-muted/20 border-b">
                            <CardTitle className="text-lg">Application Form Builder</CardTitle>
                            <CardDescription>Design the form customers will fill out to apply for this product.</CardDescription>
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
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            
                            <div className="space-y-2">
                                <Label>Workflow Stages (Comma Separated)</Label>
                                <Textarea 
                                    value={workflowStages} 
                                    onChange={e => setWorkflowStages(e.target.value)} 
                                    placeholder="Submitted, Under Review, Approved"
                                    className="min-h-[100px] text-sm"
                                />
                                <p className="text-xs text-muted-foreground">These are the sequential steps an application will go through.</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
