"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Wifi, ShieldCheck, Loader2, CheckCircle2, Building2, Globe, Search, UserCircle2, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { Service, ServiceFormSchema, Customer, Beneficiary } from "@/lib/api/types";
import { api } from "@/lib/api";
import { NIGERIAN_BANKS } from "@/lib/data/nigerian-banks";
import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { applyMappingConfig, normalizeOptionsData } from "@/lib/utils/form-mapper";

interface ServiceExecutionFormProps {
    service: Service | null;
    prefillBeneficiaryId?: string;
}

export function ServiceExecutionForm({ service, prefillBeneficiaryId }: ServiceExecutionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isValidating, setIsValidating] = useState(false);
    const [formData, setFormData] = useState<Record<string, any>>({});
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

    // api_select: fetched options per field name
    const [apiOptions, setApiOptions] = useState<Record<string, { label: string; value: any }[]>>({});
    const [loadingApiOptions, setLoadingApiOptions] = useState<Record<string, boolean>>({});
    // autocomplete_select: search term and open state per field
    const [acSearchTerms, setAcSearchTerms] = useState<Record<string, string>>({});
    const [openAcDropdown, setOpenAcDropdown] = useState<string | null>(null);
    const acDropdownRef = useRef<HTMLDivElement>(null);

    // Close autocomplete dropdowns on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (acDropdownRef.current && !acDropdownRef.current.contains(e.target as Node)) {
                setOpenAcDropdown(null);
            }
        }
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, []);

    // Fetch api_select options
    const fetchApiOptions = useCallback(async (field: ServiceFormSchema) => {
        const endpointId = typeof (field as any).options_endpoint === 'object'
            ? (field as any).options_endpoint?.id
            : (field as any).options_endpoint;
        if (!endpointId) return;
        setLoadingApiOptions(prev => ({ ...prev, [field.name]: true }));
        try {
            const res = await fetch('/api/endpoints/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpointId, dynamicPayload: {} })
            });
            const data = await res.json();
            const rawData = data?.data ?? data?.Payload ?? data ?? [];
            // Support custom data path for nested arrays (e.g. CommercialBanks key in NIP response)
            const dataPath = (field as any).options_data_path;
            const finalData = dataPath ? (rawData?.[dataPath] ?? rawData) : rawData;
            const opts = normalizeOptionsData(
                finalData,
                (field as any).options_text_key || 'name',
                (field as any).options_value_key || 'id'
            );
            setApiOptions(prev => ({ ...prev, [field.name]: opts }));
        } catch (e) {
            console.error('[SEF] Failed to fetch options for', field.name, e);
        } finally {
            setLoadingApiOptions(prev => ({ ...prev, [field.name]: false }));
        }
    }, []);

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
        // Pre-fetch api_select options
        service.form_schema?.forEach(field => {
            if ((field as any).type === 'api_select' && (field as any).options_endpoint) {
                fetchApiOptions(field);
            }
        });
    }, [service, fetchApiOptions]);

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
                    await executeEvent(event, displayValue, extraData);
                } else if (event.trigger === 'onCondition' && event.condition) {
                    const { type, value: condValue } = event.condition;
                    let met = false;
                    
                    try {
                        if (type === 'length') {
                            met = String(displayValue).length === Number(condValue);
                        } else if (type === 'regex') {
                            const regex = new RegExp(String(condValue));
                            met = regex.test(String(displayValue));
                        } else if (type === 'regex_not_match') {
                            const regex = new RegExp(String(condValue));
                            met = !regex.test(String(displayValue));
                        }
                    } catch (e) {
                        console.error(`Error evaluating condition for field ${name}:`, e);
                    }
                    
                    if (met) {
                        await executeEvent(event, displayValue, extraData);
                    }
                }
            }
        }
    };

    const handleBlur = async (name: string) => {
        const value = formData[name] || '';
        const fieldSchema = service?.form_schema.find(f => f.name === name);
        if (fieldSchema?.events) {
            for (const event of fieldSchema.events) {
                if (event.trigger === 'onBlur') {
                    await executeEvent(event, value);
                }
            }
        }
    };

    const executeEvent = async (event: any, value: any, extraData?: any) => {
        if ((event.action === 'SET_VALUES' || event.action === 'SET_VALUE') && event.mappingConfig) {
            // Track selected beneficiary for rich UI rendering
            if (extraData && extraData.account_name) {
                setSelectedBeneficiary(extraData);
                setIsPickerOpen(false);
            }
            const updates = applyMappingConfig(event.mappingConfig, null, value, extraData);
            const newLocked = new Set(lockedFields);
            Object.keys(updates).forEach(k => newLocked.add(k));
            setFormData(prev => ({ ...prev, ...updates }));
            setLockedFields(newLocked);

        } else if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
            setIsValidating(true);
            try {
                const triggerField = event.fieldName || '';
                const enquiryPayload: Record<string, any> = {
                    ...formData,
                    // Always include common Qore/BankOne field name variants
                    accountNumber: value,
                    AccountNumber: value,
                    [triggerField]: value,
                };
                const res = await fetch('/api/endpoints/execute', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        endpointId: typeof event.endpointId === 'object' ? event.endpointId.id : event.endpointId,
                        dynamicPayload: enquiryPayload
                    })
                });

                if (res.ok) {
                    const data = await res.json();
                    // BankOne/Qore: response payload often nested under .Payload
                    const responseData = data.Payload ?? data.data ?? data;

                    if (event.mappingConfig) {
                        const updates = applyMappingConfig(event.mappingConfig, responseData, value, extraData);
                        setFormData(prev => ({ ...prev, ...updates }));

                        // Surface the resolved human-readable label (e.g. account name)
                        const resolvedLabel =
                            updates[triggerField] ||
                            responseData.fullName ||
                            responseData.AccountName ||
                            responseData.accountName;
                        if (resolvedLabel) {
                            setValidationData(prev => ({ ...prev, [triggerField]: resolvedLabel }));
                        }
                    }
                    toast.success('Information resolved successfully');
                } else {
                    const err = await res.json();
                    toast.error(err.error || 'Failed to verify information');
                }
            } catch (error) {
                console.error('Event execution error:', error);
                toast.error('Network error during verification');
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

    // ── Static options parser (mirrors UniversalDynamicForm) ──────────────
    const parseOptions = (options: any): { label: string; value: any }[] => {
        if (!options) return [];
        if (typeof options === 'string') {
            const trimmed = options.trim();
            if (trimmed.startsWith('[')) {
                try {
                    const arr = JSON.parse(trimmed);
                    return arr.map((o: any) =>
                        typeof o === 'object'
                            ? { label: o.label ?? o.name ?? String(o.value), value: o.value ?? o }
                            : { label: String(o), value: o }
                    );
                } catch (_) {}
            }
            return trimmed.split(',').map((o: string) => ({ label: o.trim(), value: o.trim() }));
        }
        if (Array.isArray(options)) {
            return options.map((o: any) =>
                typeof o === 'object'
                    ? { label: o.label ?? o.name ?? String(o.value), value: o.value ?? o }
                    : { label: String(o), value: o }
            );
        }
        return [];
    };

    const renderField = (field: ServiceFormSchema) => {
        const id = `field-${field.name}`;

        // ── Hidden fields — not rendered, maintained in formData via useEffect
        if ((field as any).type === 'hidden') {
            return (
                <input
                    key={field.name}
                    type="hidden"
                    name={field.name}
                    value={formData[field.name] ?? ''}
                    readOnly
                />
            );
        }

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
                if (benType === 'internal') return b.bank_code === 'abiasmemfb' || !b.bank_code;
                if (benType === 'interbank') return b.bank_code && b.bank_code !== 'abiasmemfb' && !b.is_international;
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

        if (field.type === 'destination_bank_lookup') {
            return (
                <div key={field.name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                        id={id}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        onBlur={() => handleBlur(field.name)}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    >
                        <option value="" disabled>Select bank...</option>
                        <option value="abiasmemfb">ABIASMEMFB (Intra-bank)</option>
                        {NIGERIAN_BANKS.map(bank => (
                            <option key={bank.code} value={bank.code}>
                                {bank.name} ({bank.code})
                            </option>
                        ))}
                    </select>
                </div>
            );
        }

        if (field.type === 'select') {
            const parsedOptions = parseOptions(field.options);
            return (
                <div key={field.name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <select
                        id={id}
                        value={formData[field.name] || ""}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        onBlur={() => handleBlur(field.name)}
                        className="w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                    >
                        <option value="" disabled>Select {field.label.toLowerCase()}...</option>
                        {parsedOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            );
        }

        if ((field as any).type === 'api_select') {
            const isLoading = loadingApiOptions[field.name];
            const opts = apiOptions[field.name] || [];
            return (
                <div key={field.name} className="space-y-2">
                    <label htmlFor={id} className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <div className="relative">
                        {isLoading && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin pointer-events-none" />
                        )}
                        <select
                            id={id}
                            value={formData[field.name] || ""}
                            onChange={(e) => handleInputChange(field.name, e.target.value)}
                            onBlur={() => handleBlur(field.name)}
                            disabled={isLoading || isSubmitting}
                            className={`w-full h-10 px-3 rounded-md border bg-background text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer ${isLoading ? 'opacity-60' : ''}`}
                        >
                            <option value="" disabled>
                                {isLoading ? 'Loading...' : `Select ${field.label.toLowerCase()}...`}
                            </option>
                            {opts.map((opt, idx) => (
                                <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            );
        }

        if ((field as any).type === 'autocomplete_select') {
            const allOptions = parseOptions(field.options);
            const searchTerm = acSearchTerms[field.name] || '';
            const filtered = searchTerm
                ? allOptions.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
                : allOptions;
            const selectedLabel = allOptions.find(o => String(o.value) === String(formData[field.name]))?.label;
            return (
                <div key={field.name} className="space-y-2">
                    <label className="text-sm font-medium">
                        {field.label} {field.required && <span className="text-destructive">*</span>}
                    </label>
                    <div
                        className="relative"
                        ref={openAcDropdown === field.name ? acDropdownRef : undefined}
                    >
                        <div
                            className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm cursor-pointer"
                            onClick={() => setOpenAcDropdown(openAcDropdown === field.name ? null : field.name)}
                        >
                            <span className={`flex-1 truncate ${selectedLabel ? '' : 'text-muted-foreground'}`}>
                                {selectedLabel || `Select ${field.label.toLowerCase()}...`}
                            </span>
                            {formData[field.name] ? (
                                <X
                                    size={13}
                                    className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                                    onClick={e => {
                                        e.stopPropagation();
                                        handleInputChange(field.name, '');
                                        setAcSearchTerms(prev => ({ ...prev, [field.name]: '' }));
                                    }}
                                />
                            ) : (
                                <ChevronDown size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                            )}
                        </div>
                        {openAcDropdown === field.name && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden">
                                <div className="p-1.5 border-b">
                                    <div className="relative">
                                        <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                        <input
                                            autoFocus
                                            className="w-full h-7 pl-6 pr-2 text-xs rounded border bg-background focus:outline-none"
                                            placeholder="Search..."
                                            value={searchTerm}
                                            onChange={e => setAcSearchTerms(prev => ({ ...prev, [field.name]: e.target.value }))}
                                        />
                                    </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {filtered.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-3">No options found</p>
                                    ) : filtered.map((o, idx) => (
                                        <div
                                            key={`${o.value}-${idx}`}
                                            className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors ${
                                                String(formData[field.name]) === String(o.value) ? 'bg-muted font-medium' : ''
                                            }`}
                                            onClick={() => {
                                                handleInputChange(field.name, o.value);
                                                setOpenAcDropdown(null);
                                                setAcSearchTerms(prev => ({ ...prev, [field.name]: '' }));
                                            }}
                                        >
                                            {o.label}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
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
                            onBlur={() => handleBlur(field.name)}
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
