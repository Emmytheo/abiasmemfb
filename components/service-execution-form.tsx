"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Wifi, ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Service, ServiceFormSchema } from "@/lib/api/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface ServiceExecutionFormProps {
    service: Service | null;
}

export function ServiceExecutionForm({ service }: ServiceExecutionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [validationData, setValidationData] = useState<Record<string, any>>({});

    if (!service) {
        return (
            <Card className="border shadow-lg">
                <CardHeader className="bg-muted/50 border-b">
                    <CardTitle className="flex justify-between items-center text-lg">
                        Execution Form
                        <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-md border">No Service Selected</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center text-muted-foreground h-[300px] justify-center">
                    <ShieldCheck className="h-12 w-12 mb-4 opacity-20" />
                    <p className="text-sm">Please select a service from the list to begin.</p>
                </CardContent>
            </Card>
        );
    }

    const handleInputChange = async (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));

        // Handle on-the-fly validation (e.g. Account Name enquiry)
        const fieldSchema = service?.form_schema.find(f => f.name === name);
        if (fieldSchema?.triggers_validation && value.length > 3) {
            setIsValidating(true);
            try {
                // If it triggers validation, we might call the validation workflow
                // Real implementation varies, but we simulate standard name enquiry here.
                const res = await api.validateServiceWorkflow(service!.id, { ...formData, [name]: value });
                if (res.valid) {
                    setValidationData(prev => ({ ...prev, [name]: 'Verified Account Name' }));
                    toast.success('Details verified successfully');
                }
            } catch (error) {
                console.error("Validation error:", error);
            } finally {
                setIsValidating(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!service) return;

        setIsSubmitting(true);
        try {
            // Check required fields
            for (const field of service.form_schema) {
                if (field.required && !formData[field.name]) {
                    toast.error(`Please fill out the ${field.label} field.`);
                    setIsSubmitting(false);
                    return;
                }
            }

            // Execute via workflow engine
            const executionId = await api.executeServiceWorkflow(service.id, formData);

            toast.success(`${service.name} executed successfully!`);

            // Clear form and route to execution status tracker
            setFormData({});
            router.push(`/pay/receipt/${executionId}`);

        } catch (error: any) {
            toast.error(error.message || "Failed to execute service. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderField = (field: ServiceFormSchema) => {
        const id = `field-${field.name}`;

        if (field.type === 'select' || field.type === 'destination_bank_lookup') {
            const options = field.options ? field.options.split(',').map(o => o.trim()) : [];
            return (
                <div key={field.name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                        id={id}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    >
                        <option value="" disabled>Select {field.label.toLowerCase()}...</option>
                        {field.type === 'destination_bank_lookup' ? (
                            // Mock dynamic list for now
                            <>
                                <option value="abia_mfb">Abia MFB (Intra-bank)</option>
                                <option value="access_bank">Access Bank</option>
                                <option value="gtbank">GTBank</option>
                            </>
                        ) : (
                            options.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))
                        )}
                    </select>
                </div>
            );
        }

        return (
            <div key={field.name} className="space-y-2">
                <label htmlFor={id} className="text-sm font-medium flex justify-between">
                    <span>{field.label} {field.required && <span className="text-destructive">*</span>}</span>
                    {validationData[field.name] && <span className="text-xs text-green-600 font-medium">{validationData[field.name]}</span>}
                </label>
                {field.type === 'number' && field.name === 'amount' ? (
                    <div className="relative">
                        <span className="absolute left-3 top-2.5 text-muted-foreground">₦</span>
                        <Input
                            id={id}
                            type="number"
                            placeholder="0.00"
                            className="pl-8 text-lg font-bold"
                            value={formData[field.name] || ""}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            disabled={isValidating || isSubmitting}
                        />
                    </div>
                ) : (
                    <div className="relative">
                        <Input
                            id={id}
                            type={field.type}
                            placeholder={field.placeholder || ""}
                            value={formData[field.name] || ""}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            disabled={isValidating || isSubmitting}
                        />
                        {field.triggers_validation && isValidating && (
                            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <Card className="border shadow-lg">
            <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Wifi className="h-5 w-5 text-primary" />
                    {service.name}
                </CardTitle>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="pt-6 pb-6 space-y-5">
                    {service.form_schema && service.form_schema.length > 0 ? (
                        service.form_schema.map(renderField)
                    ) : (
                        <p className="text-sm text-muted-foreground italic">No configuration required. Ready to execute.</p>
                    )}
                </CardContent>
                <CardFooter className="border-t bg-muted/50 flex flex-col items-stretch pt-4 pb-4">
                    {service.fee_type !== 'none' && (
                        <div className="flex justify-between text-sm mb-4">
                            <span className="text-muted-foreground">Convenience Fee</span>
                            <span className="font-medium">
                                {service.fee_type === 'flat' ? `₦${service.fee_value?.toFixed(2)}` : `${service.fee_value}%`}
                            </span>
                        </div>
                    )}
                    <Button type="submit" className="w-full h-12 shadow-md gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                            </>
                        ) : (
                            <>
                                Execute <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
