"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, AlertCircle, CheckCircle2, Link2, Hash, Trash2, Plus, X, ArrowLeftCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface ProviderMapping {
    id: string;
    internalName: string;
    externalCode: string;
    provider: any;
    relatedEntity: any;
    updatedAt?: string;
}

interface ProductType {
    id: string;
    name: string;
    category: string;
}

export default function ProviderMappingsPage() {
    const [mappings, setMappings] = useState<ProviderMapping[]>([]);
    const [productTypes, setProductTypes] = useState<ProductType[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [edits, setEdits] = useState<Record<string, string>>({});
    
    // Create new mapping state
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [selectedProductTypeId, setSelectedProductTypeId] = useState("");
    const [newExternalCode, setNewExternalCode] = useState("");
    const [creating, setCreating] = useState(false);
    const [isSyncingProducts, setIsSyncingProducts] = useState(false);

    const handleProductSync = async () => {
        setIsSyncingProducts(true);
        toast.info("Starting products discovery sync from Qore...");
        try {
            const res = await fetch('/api/sync/products', { method: 'POST' });
            const result = await res.json();
            if (result.success) {
                toast.success("Products sync complete!", {
                    description: `Successfully processed dynamic registry synchronizations.`
                });
                loadData();
            } else {
                toast.error(`Sync failed: ${result.error}`);
            }
        } catch {
            toast.error("Network error during product sync");
        } finally {
            setIsSyncingProducts(false);
        }
    };

    async function loadData() {
        setLoading(true);
        try {
            const [mappingsRes, productTypesRes] = await Promise.all([
                fetch('/api/admin/provider-mappings'),
                fetch('/api/admin/product-types')
            ]);
            
            const mappingsData = await mappingsRes.json();
            const productTypesData = await productTypesRes.json();
            
            setMappings(mappingsData.docs || []);
            setProductTypes(productTypesData.docs || []);
            
            // Seed edit state from current values
            const initial: Record<string, string> = {};
            (mappingsData.docs || []).forEach((m: ProviderMapping) => {
                initial[m.id] = m.externalCode || '';
            });
            setEdits(initial);
        } catch {
            toast.error("Failed to load provider mappings and product types");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadData(); }, []);

    const handleSave = async (mapping: ProviderMapping) => {
        const newCode = edits[mapping.id]?.trim();
        if (!newCode) {
            toast.error("Product Code cannot be empty");
            return;
        }
        setSaving(mapping.id);
        try {
            const res = await fetch(`/api/admin/provider-mappings/${mapping.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ externalCode: newCode }),
            });
            if (res.ok) {
                toast.success(`Product Code updated successfully`, {
                    description: `Mapping: ${mapping.internalName}`
                });
                loadData();
            } else {
                const err = await res.json();
                toast.error(err.error || 'Failed to save');
            }
        } catch {
            toast.error("Network error");
        } finally {
            setSaving(null);
        }
    };

    const handleCreate = async () => {
        if (!selectedProductTypeId) {
            toast.error("Please select a Product Type");
            return;
        }
        if (!newExternalCode.trim()) {
            toast.error("Please specify a Qore ProductCode");
            return;
        }

        // Duplicates prevention
        const duplicate = mappings.find(m => 
            m.relatedEntity?.value === selectedProductTypeId || 
            m.relatedEntity === selectedProductTypeId
        );
        if (duplicate) {
            toast.error("Duplicate Mapping Error", {
                description: `A mapping already exists for "${duplicate.internalName.replace(' Qore Mapping', '')}". Please edit that mapping instead.`
            });
            return;
        }

        setCreating(true);
        try {
            const productType = productTypes.find(pt => pt.id === selectedProductTypeId);
            const ptName = productType ? productType.name : "Product";

            const res = await fetch('/api/admin/provider-mappings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    internalName: `${ptName} Qore Mapping`,
                    externalCode: newExternalCode.trim(),
                    productTypeId: selectedProductTypeId
                }),
            });

            if (res.ok) {
                toast.success("Mapping created successfully!");
                setShowCreateForm(false);
                setSelectedProductTypeId("");
                setNewExternalCode("");
                loadData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to create mapping");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (mapping: ProviderMapping) => {
        if (!confirm(`Are you absolutely sure you want to delete the mapping for "${mapping.internalName}"?\nThis could prevent new applications for this product from being provisioned.`)) {
            return;
        }
        setDeleting(mapping.id);
        try {
            const res = await fetch(`/api/admin/provider-mappings/${mapping.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                toast.success("Mapping deleted successfully");
                loadData();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to delete mapping");
            }
        } catch {
            toast.error("Network error");
        } finally {
            setDeleting(null);
        }
    };

    const isDirty = (id: string, current: string) => (edits[id] ?? current) !== current;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 mt-6 px-4 max-w-7xl mx-auto pb-24">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Provider Mappings</h1>
                    <p className="text-muted-foreground mt-1">
                        Map dynamic platform product types to Qore Core Banking ProductCodes. Duplicates are strictly guarded against.
                    </p>
                </div>
                {!showCreateForm && (
                    <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                        <Button 
                            variant="outline" 
                            onClick={handleProductSync} 
                            disabled={isSyncingProducts}
                            className="shadow-sm gap-2 select-none border-primary/20 hover:bg-primary/5 text-primary font-semibold"
                        >
                            <RefreshCw className={`h-4 w-4 ${isSyncingProducts ? 'animate-spin' : ''}`} />
                            {isSyncingProducts ? 'Syncing...' : 'Sync Products from Qore'}
                        </Button>
                        <Button onClick={() => setShowCreateForm(true)} className="shadow-md gap-2 select-none">
                            <Plus className="h-4 w-4" /> Create Mapping
                        </Button>
                    </div>
                )}
            </div>

            {/* Creation Form Overlay/Card */}
            {showCreateForm && (
                <Card className="border border-primary/20 bg-primary/5 rounded-2xl shadow-lg relative animate-in slide-in-from-top-3 duration-300">
                    <button 
                        onClick={() => setShowCreateForm(false)} 
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary animate-pulse" /> New Qore Product Mapping
                        </CardTitle>
                        <CardDescription>
                            Define a new link between an internal product definition and core banking properties.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="product-type-select">Internal Product Type</Label>
                                <Select value={selectedProductTypeId} onValueChange={setSelectedProductTypeId}>
                                    <SelectTrigger id="product-type-select">
                                        <SelectValue placeholder="Select active product..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {productTypes.map((pt) => (
                                            <SelectItem key={pt.id} value={pt.id}>
                                                {pt.name} ({pt.category})
                                            </SelectItem>
                                        ))}
                                        {productTypes.length === 0 && (
                                            <p className="p-2 text-xs text-muted-foreground text-center">No active product types found.</p>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-external-code">Qore ProductCode (externalCode)</Label>
                                <Input 
                                    id="new-external-code"
                                    value={newExternalCode} 
                                    onChange={e => setNewExternalCode(e.target.value)} 
                                    placeholder="e.g. 101, SAVINGS_01, 10" 
                                    className="font-mono text-sm h-10"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button variant="ghost" onClick={() => setShowCreateForm(false)} disabled={creating}>
                                Cancel
                            </Button>
                            <Button onClick={handleCreate} disabled={creating} className="shadow-md">
                                {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Mapping
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Info callout */}
            <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-sm text-amber-700 dark:text-amber-400 shadow-sm">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                    <p className="font-bold mb-0.5">How to find the correct ProductCode</p>
                    <p className="text-xs opacity-80 leading-relaxed">
                        Log into BankOne or ask your Qore relationship manager for the product codes configured on your institution.
                        Common codes: Savings (101), Current (102), Fixed Deposit (201). Staging codes may differ.
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
            ) : mappings.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-2xl text-muted-foreground">
                    <Link2 className="h-10 w-10 mx-auto mb-3 opacity-30 animate-pulse" />
                    <p className="font-medium">No provider mappings found.</p>
                    <p className="text-xs mt-1">Configure one using the &quot;Create Mapping&quot; button above.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mappings.map((m) => {
                        const code = edits[m.id] ?? m.externalCode ?? '';
                        const dirty = isDirty(m.id, m.externalCode || '');
                        const isMissing = !m.externalCode;

                        return (
                            <Card key={m.id} className={`rounded-2xl transition-all shadow-sm group hover:shadow-md ${isMissing ? 'border-destructive/30 bg-destructive/5' : 'border-primary/10'}`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2 flex-wrap">
                                        <div className="min-w-0">
                                            <CardTitle className="text-base font-bold truncate">{m.internalName}</CardTitle>
                                            <CardDescription className="text-xs mt-0.5">
                                                Provider: {typeof m.provider === 'object' ? m.provider?.name : m.provider}
                                            </CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {isMissing ? (
                                                <Badge variant="outline" className="text-[10px] border-destructive/40 text-destructive shrink-0 gap-1 bg-destructive/5">
                                                    <AlertCircle className="h-3 w-3" /> No Code Set
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 shrink-0 gap-1 bg-emerald-500/5">
                                                    <CheckCircle2 className="h-3 w-3" /> Configured
                                                </Badge>
                                            )}
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all duration-300 md:opacity-0 md:group-hover:opacity-100" 
                                                disabled={deleting === m.id}
                                                onClick={() => handleDelete(m)}
                                                title="Delete Mapping"
                                            >
                                                {deleting === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor={`code-${m.id}`} className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                                            <Hash className="h-3 w-3" /> Qore ProductCode
                                        </Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={`code-${m.id}`}
                                                value={code}
                                                onChange={e => setEdits(prev => ({ ...prev, [m.id]: e.target.value }))}
                                                placeholder="e.g. 101, SAVINGS, CURRENT"
                                                className={`font-mono h-9 text-sm ${dirty ? 'border-primary ring-1 ring-primary/20' : ''}`}
                                            />
                                            <Button
                                                size="sm"
                                                className="h-9 shrink-0 gap-1.5"
                                                disabled={!dirty || saving === m.id}
                                                onClick={() => handleSave(m)}
                                            >
                                                {saving === m.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                                Save
                                            </Button>
                                        </div>
                                    </div>
                                    {m.updatedAt && (
                                        <p className="text-[10px] text-muted-foreground">
                                            Last updated: {new Date(m.updatedAt).toLocaleString()}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
