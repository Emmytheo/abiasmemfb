"use client";

import * as React from "react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Wifi, ShieldCheck, Loader2, CheckCircle2, Building2, Globe, Search, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Service, ServiceFormSchema, Customer, Beneficiary } from "@/lib/api/types";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
interface ServiceExecutionFormProps {
    service: Service | null;
    prefillBeneficiaryId?: string;
}

export function ServiceExecutionForm({ service, prefillBeneficiaryId }: ServiceExecutionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [validationData, setValidationData] = useState<Record<string, any>>({});
    const [accounts, setAccounts] = useState<any[]>([]);
    const [sourceAccountId, setSourceAccountId] = useState<string>('');
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [isLoadingBeneficiaries, setIsLoadingBeneficiaries] = useState(false);
    const [lockedFields, setLockedFields] = useState<Set<string>>(new Set());
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isPickerOpen, setIsPickerOpen] = useState(false);

    React.useEffect(() => {
        if (!service) return;
        setIsLoadingAccounts(true);
        setIsLoadingBeneficiaries(true);
        async function fetchData() {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const [userAccounts, userBens] = await Promise.all([
                    api.getUserAccounts(user.id),
                    api.getUserBeneficiaries(user.id)
                ]);
                setAccounts(userAccounts);
                setBeneficiaries(userBens);
                if (userAccounts.length > 0) {
                    const defaultAccountId = String(userAccounts[0].id);
                    setSourceAccountId(defaultAccountId);
                    setFormData(prev => ({ ...prev, sourceAccountId: defaultAccountId }));
                }
            }
            setIsLoadingAccounts(false);
            setIsLoadingBeneficiaries(false);
        }
        fetchData();
    }, [service]);

    React.useEffect(() => {
        if (prefillBeneficiaryId && beneficiaries.length > 0) {
            const ben = beneficiaries.find(b => b.id === prefillBeneficiaryId);
            if (ben) {
                handleInputChange('beneficiary_id', prefillBeneficiaryId, ben);
            } else {
                // If not in standard list, fetch specifically
                api.getBeneficiaryById(prefillBeneficiaryId).then(b => {
                    if (b) handleInputChange('beneficiary_id', prefillBeneficiaryId, b);
                });
            }
        }
    }, [prefillBeneficiaryId, beneficiaries]);

    React.useEffect(() => {
        if (!prefillBeneficiaryId || !service) return;
        async function fetchBens() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const map = await api.getUserBeneficiaries(user.id);
                    const b = map.find(x => x.id === prefillBeneficiaryId);
                    if (b) {
                        const prefillData: Record<string, string> = {};
                        // Map commonly named fields from typical transfer workflows
                        if (service?.form_schema?.some(f => f.name === 'resolvedName' || f.name === 'accountName')) {
                            prefillData['resolvedName'] = b.account_name || '';
                            prefillData['accountName'] = b.account_name || '';
                        }
                        if (service?.form_schema?.some(f => f.name === 'destinationAccount')) prefillData['destinationAccount'] = b.account_number || '';
                        if (service?.form_schema?.some(f => f.name === 'bankCode')) prefillData['bankCode'] = b.bank_code || '';

                        // INTL variations
                        if (service?.form_schema?.some(f => f.name === 'iban')) prefillData['iban'] = b.account_number || '';
                        if (service?.form_schema?.some(f => f.name === 'swiftCode')) prefillData['swiftCode'] = b.swift_code || '';
                        if (service?.form_schema?.some(f => f.name === 'country')) prefillData['country'] = b.country || '';

                        setFormData(prev => ({ ...prev, ...prefillData }));
                    }
                }
            } catch (err) { }
        }
        fetchBens();
    }, [prefillBeneficiaryId, service]);

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

    const handleInputChange = async (name: string, value: string, extraData?: any) => {
        // If the value is an object (from a picker), we update the main field value to the ID or primary key
        const displayValue = typeof value === 'object' ? (value as any).id || value : value;
        setFormData(prev => ({ ...prev, [name]: displayValue }));

        // Event Handling logic
        const fieldSchema = service?.form_schema.find(f => f.name === name);
        if (fieldSchema?.events) {
            for (const event of fieldSchema.events) {
                if (event.trigger === 'onChange') {
                    if (event.action === 'SET_VALUES' && event.mappingConfig) {
                        const newLocked = new Set(lockedFields);
                        const updates: Record<string, string> = {};
                        
                        // If it's a beneficiary_select, track the chosen object for the UI
                        if (name === 'beneficiary_id' && extraData) {
                            setSelectedBeneficiary(extraData);
                            setIsPickerOpen(false); // Auto-close as requested
                        }

                        // Process the mapping config
                        for (const [targetField, template] of Object.entries(event.mappingConfig)) {
                            // Basic template resolution: {{$value.prop}}
                            let resolvedValue = template;
                            if (typeof template === 'string' && template.includes('{{$value.')) {
                                const prop = template.replace('{{$value.', '').replace('}}', '');
                                resolvedValue = extraData ? extraData[prop] : (typeof value === 'object' ? (value as any)[prop] : value);
                            } else if (template === '{{$value}}') {
                                resolvedValue = displayValue;
                            }
                            updates[targetField] = String(resolvedValue);
                            // Locking requirement: "locked for now" when pre-filled by a beneficiary
                            newLocked.add(targetField);
                        }
                        setFormData(prev => ({ ...prev, ...updates }));
                        setLockedFields(newLocked);
                    }
                }
            }
        }

        // Auto-resolve account name when account number is filled in
        const isAccountNumberField = name === 'destinationAccount' || name === 'iban' || name === 'destination_account';
        const bankCode = name === 'bankCode' || name === 'destination_bank_code' ? value : (formData['bankCode'] || formData['destination_bank_code'] || '');
        if (isAccountNumberField && value.replace(/\s/g, '').length >= 10 && !lockedFields.has('accountName') && !lockedFields.has('resolvedName')) {
            // Require bank to be selected first (essential for real NIP lookup)
            const hasBankField = service?.form_schema.some(f => f.name === 'bankCode' || f.name === 'destination_bank_code');
            if (hasBankField && !bankCode) {
                toast.warning('Please select the destination bank before verifying the account number.');
                setIsValidating(false);
                return;
            }
            setIsValidating(true);
            try {
                const params = new URLSearchParams({
                    accountNumber: value.trim(),
                    bankCode,
                    providerSlug: formData['nipProviderId'] || bankCode,
                });
                const res = await fetch(`/api/account-lookup?${params}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.accountName) {
                        // Populate whichever name field exists in the schema
                        setFormData(prev => ({
                            ...prev,
                            resolvedName: data.accountName,
                            accountName: data.accountName,
                            destination_name: data.accountName,
                        }));
                        setValidationData(prev => ({ ...prev, [name]: data.accountName }));
                        toast.success(`Account verified: ${data.accountName}`);
                    }
                } else {
                    toast.error('Could not verify account number. Please check and retry.');
                }
            } catch (error) {
                console.error('Account lookup error:', error);
            } finally {
                setIsValidating(false);
            }
            return;
        }

        // Handle other on-the-fly validation triggers
        if (fieldSchema?.triggers_validation && value.length > 3) {
            setIsValidating(true);
            try {
                const res = await api.validateServiceWorkflow(service!.id, { ...formData, [name]: value });
                if (res.valid) {
                    setValidationData(prev => ({ ...prev, [name]: 'Verified' }));
                }
            } catch (error) {
                console.error('Validation error:', error);
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

            if (!sourceAccountId) {
                toast.error("Please select a source account to fund this transaction.");
                setIsSubmitting(false);
                return;
            }

            // Merge dynamic form data with the required implicit session context
            const payload = {
                ...formData,
                sourceAccountId
            };

            // Execute via workflow engine
            const executionId = await api.executeServiceWorkflow(service.id, payload);

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

        if (field.name === 'sourceAccountId') {
            return (
                <div key={field.name} className="space-y-2 mb-2 p-4 rounded-md border bg-accent/10">
                    <label htmlFor={id} className="text-sm font-medium">
                        Pay From (Source Account) <span className="text-destructive">*</span>
                    </label>
                    <select
                        id={id}
                        value={sourceAccountId}
                        onChange={e => {
                            setSourceAccountId(e.target.value);
                            setFormData(prev => ({ ...prev, [field.name]: e.target.value }));
                        }}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                        required
                    >
                        <option value="" disabled>Select an account...</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.account_type} - {acc.account_number} (₦{acc.balance.toLocaleString('en-NG', { minimumFractionDigits: 2 })})
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === 'beneficiary_select') {
            const benType = service.name.toLowerCase().includes('intra') ? 'internal' : (service.name.toLowerCase().includes('inter') ? 'interbank' : 'international');
            
            const filteredBens = beneficiaries.filter(b => {
                const matchesSearch = !searchQuery || 
                    (b.account_name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                    (b.account_number?.includes(searchQuery));
                
                if (!matchesSearch) return false;
                if (benType === 'internal') return b.bank_code === 'abia_mfb' || !b.bank_code;
                if (benType === 'interbank') return b.bank_code && b.bank_code !== 'abia_mfb' && !b.is_international;
                if (benType === 'international') return b.is_international;
                return true;
            });

            if (selectedBeneficiary) {
                return (
                    <div key={field.name} className="p-4 rounded-xl border bg-primary/5 border-primary/20 space-y-3 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <CheckCircle2 size={48} className="text-primary" />
                        </div>
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <Avatar className="h-10 w-10 border-2 border-primary/20">
                                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                        {selectedBeneficiary.account_name?.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h4 className="text-sm font-bold flex items-center gap-1.5">
                                        {selectedBeneficiary.account_name}
                                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 uppercase font-black tracking-tighter bg-primary/10 text-primary border-none">
                                            Recipient
                                        </Badge>
                                    </h4>
                                    <p className="text-[11px] text-muted-foreground font-medium">
                                        {selectedBeneficiary.bank_name} • {selectedBeneficiary.account_number}
                                    </p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 text-[10px] font-black uppercase text-primary hover:bg-primary/10"
                                onClick={() => {
                                    setSelectedBeneficiary(null);
                                    setLockedFields(new Set());
                                    // Also clear form data for the mapped fields
                                    const fieldSchema = service?.form_schema.find(f => f.name === field.name);
                                    const event = fieldSchema?.events?.find(e => e.trigger === 'onChange' && e.action === 'SET_VALUES');
                                    if (event?.mappingConfig) {
                                        const clears: Record<string, string> = {};
                                        Object.keys(event.mappingConfig).forEach(k => clears[k] = '');
                                        setFormData(prev => ({ ...prev, ...clears, [field.name]: '' }));
                                    }
                                }}
                            >
                                Change
                            </Button>
                        </div>
                    </div>
                );
            }

            return (
                <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium flex justify-between">
                        <span>{field.label} {field.required && <span className="text-destructive">*</span>}</span>
                    </label>
                    <Sheet open={isPickerOpen} onOpenChange={setIsPickerOpen}>
                        <SheetTrigger asChild>
                            <Button 
                                variant="outline" 
                                className="w-full h-12 justify-start gap-3 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-muted-foreground font-normal transition-all"
                            >
                                <Search className="h-4 w-4 text-primary" />
                                <span>Search saved beneficiaries...</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="h-[80vh] flex flex-col p-0 rounded-t-3xl overflow-hidden border-t-2 border-primary/10">
                            <SheetHeader className="px-6 py-4 border-b bg-muted/5">
                                <SheetTitle className="text-lg font-black flex items-center gap-2">
                                    <UserCircle2 className="h-5 w-5 text-primary" />
                                    Select Beneficiary
                                </SheetTitle>
                                <div className="relative mt-2">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search name, bank or account..." 
                                        className="pl-9 h-11 bg-background border-primary/20 rounded-full"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                            </SheetHeader>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                {filteredBens.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                                            <Search className="h-6 w-6 text-muted-foreground/50" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm">No beneficiaries found</p>
                                            <p className="text-xs text-muted-foreground">Try a different search or enter details manually.</p>
                                        </div>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="rounded-full h-8 px-6 text-[11px] font-bold"
                                            onClick={() => setIsPickerOpen(false)}
                                        >
                                            Enter Manually
                                        </Button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {filteredBens.map(b => (
                                            <button
                                                key={b.id}
                                                type="button"
                                                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 active:bg-primary/10 transition-colors text-left border border-transparent hover:border-primary/10 group"
                                                onClick={() => {
                                                    handleInputChange(field.name, b.id || '', b);
                                                }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border group-hover:border-primary/30 transition-colors">
                                                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs uppercase">
                                                            {b.account_name?.substring(0, 2)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-bold truncate max-w-[200px]">{b.account_name}</p>
                                                        <p className="text-[11px] text-muted-foreground truncate">
                                                            {b.bank_name} • {b.account_number}
                                                        </p>
                                                    </div>
                                                </div>
                                                {b.is_international ? <Globe className="h-4 w-4 text-primary" /> : <Building2 className="h-4 w-4 text-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            );
        }

        if (field.type === 'select' || field.type === 'destination_bank_lookup') {
            // Parse options: supports both JSON [{label,value}] arrays and legacy comma strings
            let parsedOptions: { label: string; value: string }[] = [];
            if (field.options) {
                const raw = field.options as any;
                if (Array.isArray(raw)) {
                    parsedOptions = raw.map((o: any) =>
                        typeof o === 'object' ? { label: o.label ?? o.value, value: o.value } : { label: String(o), value: String(o) }
                    );
                } else if (typeof raw === 'string') {
                    const trimmed = raw.trim();
                    if (trimmed.startsWith('[')) {
                        try {
                            const arr = JSON.parse(trimmed);
                            parsedOptions = arr.map((o: any) =>
                                typeof o === 'object' ? { label: o.label ?? o.value, value: o.value } : { label: String(o), value: String(o) }
                            );
                        } catch {
                            parsedOptions = trimmed.split(',').map(o => ({ label: o.trim(), value: o.trim() }));
                        }
                    } else {
                        parsedOptions = trimmed.split(',').map(o => ({ label: o.trim(), value: o.trim() }));
                    }
                }
            }
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
                            <>
                                <option value="abia_mfb">Abia MFB (Intra-bank)</option>
                                <option value="access_bank">Access Bank</option>
                                <option value="gtbank">GTBank</option>
                            </>
                        ) : (
                            parsedOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
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
                            disabled={isValidating || isSubmitting || lockedFields.has(field.name)}
                            className={lockedFields.has(field.name) ? "bg-muted cursor-not-allowed border-dashed" : ""}
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
                <CardContent className="pt-3 pb-3 space-y-5">
                    {/* Source account picker - always shown */}
                    <div className="space-y-2 p-4 rounded-md border bg-accent/10">
                        <label htmlFor="source-account-picker" className="text-sm font-medium">
                            Pay From (Source Account) <span className="text-destructive">*</span>
                        </label>
                        {isLoadingAccounts ? (
                            <div className="h-10 rounded-md border bg-muted animate-pulse" />
                        ) : (
                            <select
                                id="source-account-picker"
                                value={sourceAccountId}
                                onChange={e => {
                                    setSourceAccountId(e.target.value);
                                    setFormData(prev => ({ ...prev, sourceAccountId: e.target.value }));
                                }}
                                className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                                required
                            >
                                <option value="" disabled>Select an account...</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_type} - {acc.account_number} (₦{Number(acc.balance).toLocaleString('en-NG', { minimumFractionDigits: 2 })})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    {/* Dynamic schema fields — skip sourceAccountId since it's rendered above */}
                    {service.form_schema && service.form_schema.length > 0 ? (
                        service.form_schema.filter(f => f.name !== 'sourceAccountId').map(renderField)
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
