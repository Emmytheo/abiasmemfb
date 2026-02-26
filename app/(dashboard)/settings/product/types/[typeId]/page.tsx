"use client";

import * as React from "react";
import { Suspense, useEffect, useState, use } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft, Save, Loader2, Trash, Info, CreditCard,
    FileText, Smartphone, UploadCloud, Bold, Italic, Underline,
    List, Link as LinkIcon, ChevronDown, CheckSquare, Plus, X, GripVertical, Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";
import { api } from "@/lib/api";
import { ProductType, FormField } from "@/lib/api/types";

function RichTextEditor({ value, onChange }: { value: string, onChange: (v: string) => void }) {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const hasInit = React.useRef(false);

    React.useEffect(() => {
        if (!hasInit.current && editorRef.current && value) {
            editorRef.current.innerHTML = value;
            hasInit.current = true;
        } else if (hasInit.current && editorRef.current && value === '') {
            editorRef.current.innerHTML = '';
            hasInit.current = false;
        }
    }, [value]);

    const execCommand = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    return (
        <div className="bg-background rounded-lg border overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
            <div className="flex items-center gap-1 p-2 bg-muted/50 border-b">
                <button type="button" onClick={() => execCommand('bold')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Bold"><Bold className="h-4 w-4" /></button>
                <button type="button" onClick={() => execCommand('italic')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Italic"><Italic className="h-4 w-4" /></button>
                <button type="button" onClick={() => execCommand('underline')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Underline"><Underline className="h-4 w-4" /></button>
                <div className="w-px h-4 bg-border mx-1" />
                <button type="button" onClick={() => execCommand('insertUnorderedList')} className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Bullet List"><List className="h-4 w-4" /></button>
            </div>
            <div
                ref={editorRef}
                contentEditable
                className="w-full p-4 min-h-[160px] text-sm text-foreground/80 leading-relaxed outline-none border-none bg-transparent"
                onInput={(e) => onChange(e.currentTarget.innerHTML)}
                onBlur={(e) => onChange(e.currentTarget.innerHTML)}
            />
        </div>
    );
}

function EditProductTypeContent({ typeId }: { typeId: string }) {
    const router = useRouter();

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const [product, setProduct] = useState<ProductType>({
        id: typeId,
        name: '',
        category: 'loans',
        tagline: '',
        description: '',
        interest_rate: 0,
        min_amount: 0,
        max_amount: 0,
        min_duration: 1,
        max_duration: 12,
        image_url: '',
        form_schema: [],
        workflow_stages: ['Submitted', 'Under Review', 'Approved'],
        status: 'active',
        created_at: new Date().toISOString()
    });

    const [currentStep, setCurrentStep] = useState(1);

    useEffect(() => {
        async function fetchProduct() {
            try {
                // If it's a new product, we would handle differently. 
                // Assumes typical flow is editing an existing one based on ID.
                const data = await api.getProductTypeById(typeId);
                if (data) {
                    setProduct(data);
                }
            } catch (error) {
                console.error("Failed to load product", error);
            } finally {
                setIsLoading(false);
            }
        }
        if (typeId && typeId !== 'new') {
            fetchProduct();
        } else {
            setIsLoading(false); // New product template
        }
    }, [typeId]);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.saveProductType(product);
            router.push("/products/accounts"); // Redirect to listings
        } catch (error) {
            console.error("Save failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await api.deleteProductType(product.id);
            router.push("/products/accounts");
        } catch (error) {
            console.error("Delete failed", error);
        } finally {
            setIsDeleting(false);
        }
    }

    const updateProduct = (updates: Partial<ProductType>) => {
        setProduct(prev => ({ ...prev, ...updates }));
    };

    const addFormField = () => {
        const newField: FormField = {
            id: `field_${Math.random().toString(36).substr(2, 9)}`,
            label: 'New Field',
            type: 'text',
            required: false
        };
        updateProduct({ form_schema: [...product.form_schema, newField] });
    };

    const updateFormField = (index: number, updates: Partial<FormField>) => {
        const newSchema = [...product.form_schema];
        newSchema[index] = { ...newSchema[index], ...updates };
        updateProduct({ form_schema: newSchema });
    };

    const removeFormField = (index: number) => {
        const newSchema = product.form_schema.filter((_, i) => i !== index);
        updateProduct({ form_schema: newSchema });
    };

    // Drag and drop state for form builder
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

    const handleDragStart = (e: React.DragEvent, index: number) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        // Need to set data to allow drag on Firefox
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
        e.dataTransfer.dropEffect = 'move';
        if (draggedIndex === null || draggedIndex === index) return;

        const newSchema = [...product.form_schema];
        const draggedItem = newSchema[draggedIndex];
        newSchema.splice(draggedIndex, 1);
        newSchema.splice(index, 0, draggedItem);

        updateProduct({ form_schema: newSchema });
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const steps = [
        { step: 1, title: "Basic Info", icon: Info },
        { step: 2, title: "Financials", icon: CreditCard },
        { step: 3, title: "Content", icon: FileText },
        { step: 4, title: "App Form", icon: CheckSquare }
    ];

    if (isLoading) {
        return <div className="flex w-full justify-center p-24"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
    }

    return (
        <div className="flex w-full gap-8 animate-in fade-in duration-500 justify-center px-4 md:px-8">
            <main className="flex-1 max-w-3xl">
                <form id="edit-product-form" onSubmit={handleSave} className="space-y-10 pb-24">

                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                                    <Link href="/products/accounts">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <h1 className="text-xl md:text-3xl font-bold tracking-tight">{typeId === 'new' ? 'Create Product' : 'Edit Product'}</h1>
                            </div>
                            <p className="text-muted-foreground ml-11 text-md md:text-base">Configure the core details and application workflows.</p>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                            {typeId !== 'new' && (
                                <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                    {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Stepper Header */}
                    <div className="relative flex justify-between items-center mb-8 px-4 sm:px-8">
                        <div className="absolute left-[10%] right-[10%] top-5 h-[2px] bg-border -z-10"></div>
                        <div
                            className="absolute left-[10%] top-5 h-[2px] bg-primary -z-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                        ></div>

                        {steps.map((s) => (
                            <button
                                key={s.step}
                                type="button"
                                onClick={() => setCurrentStep(s.step)}
                                className={`flex flex-col items-center gap-2 bg-background px-2 transition-colors ${currentStep >= s.step ? 'text-primary' : 'text-muted-foreground'}`}
                            >
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep >= s.step ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.2)]' : 'border-border bg-background'}`}>
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <span className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider hidden sm:block ${currentStep === s.step ? 'text-foreground' : ''}`}>
                                    {s.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Section 1: Basic Information */}
                    <div className={currentStep === 1 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Info className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Product Name</label>
                                    <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <input type="text" value={product.name} onChange={e => updateProduct({ name: e.target.value })} className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" required />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Category</label>
                                    <div className="relative bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <select value={product.category} onChange={e => updateProduct({ category: e.target.value as any })} className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none appearance-none cursor-pointer">
                                            <option value="loans">Loans & Credit</option>
                                            <option value="accounts">Savings Accounts</option>
                                            <option value="investments">Investments</option>
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 group md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Short Tagline</label>
                                    <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <input type="text" value={product.tagline} onChange={e => updateProduct({ tagline: e.target.value })} className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">{product.tagline?.length || 0}/100 characters</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section 2: Financial Terms */}
                    <div className={currentStep === 2 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <CreditCard className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Financial Terms</h2>
                            </div>

                            <div className="bg-accent/50 rounded-xl p-6 border space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Interest Rate (Annual)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={product.interest_rate}
                                                onChange={(e) => updateProduct({ interest_rate: Number(e.target.value) })}
                                                className="bg-background border rounded text-primary font-bold w-20 text-center focus:ring-1 focus:ring-primary focus:border-primary text-sm p-1 outline-none"
                                            />
                                            <span className="text-muted-foreground text-sm">%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="30" step="0.1"
                                        value={product.interest_rate}
                                        onChange={(e) => updateProduct({ interest_rate: Number(e.target.value) })}
                                        className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0%</span>
                                        <span>15%</span>
                                        <span>30%</span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Minimum Amount (₦)</label>
                                            <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                                <input type="number" value={product.min_amount} onChange={e => updateProduct({ min_amount: Number(e.target.value) })} className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 font-mono outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Maximum Amount (₦)</label>
                                            <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                                <input type="number" value={product.max_amount} onChange={e => updateProduct({ max_amount: Number(e.target.value) })} className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 font-mono outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <DualRangeSlider
                                            min={0} max={10000000} step={50000}
                                            value={[product.min_amount || 0, product.max_amount || 10000000]}
                                            onChange={(val) => updateProduct({ min_amount: val[0], max_amount: val[1] })}
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                                            <span>₦0</span>
                                            <span>₦10,000,000+</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 pt-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Min Duration (Months)</label>
                                            <div className="flex items-center bg-background rounded-lg border p-1 border-transparent focus-within:border-primary focus-within:ring-1">
                                                <input type="number" value={product.min_duration} onChange={e => updateProduct({ min_duration: Number(e.target.value) })} className="w-full bg-transparent border-none text-sm h-9 px-3 font-mono outline-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2 group">
                                            <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Max Duration (Months)</label>
                                            <div className="flex items-center bg-background rounded-lg border p-1 border-transparent focus-within:border-primary focus-within:ring-1">
                                                <input type="number" value={product.max_duration} onChange={e => updateProduct({ max_duration: Number(e.target.value) })} className="w-full bg-transparent border-none text-sm h-9 px-3 font-mono outline-none" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-2">
                                        <DualRangeSlider
                                            min={1} max={60} step={1}
                                            value={[product.min_duration || 1, product.max_duration || 12]}
                                            onChange={(val) => updateProduct({ min_duration: val[0], max_duration: val[1] })}
                                        />
                                        <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                                            <span>1 Month</span>
                                            <span>60 Months</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section 3: Content */}
                    <div className={currentStep === 3 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Content & Media</h2>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Detailed Description</label>
                                <RichTextEditor
                                    value={product.description}
                                    onChange={(val) => updateProduct({ description: val })}
                                />
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <label className="text-sm font-medium text-foreground">Product Banner Image</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 p-4 border rounded-xl bg-muted/20 hover:bg-muted/40 transition-colors">
                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><UploadCloud className="h-4 w-4" /> Upload Local Image</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const url = URL.createObjectURL(file);
                                                    updateProduct({ image_url: url });
                                                }
                                            }}
                                            className="w-full text-sm mt-2 file:bg-primary file:text-primary-foreground file:border-0 file:rounded-md file:px-4 file:py-2 file:mr-4 file:cursor-pointer hover:file:bg-primary/90 bg-background rounded-lg border focus:ring-1 focus:ring-primary shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2 p-4 border rounded-xl bg-muted/20">
                                        <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2"><LinkIcon className="h-4 w-4" /> External Image URL</label>
                                        <input
                                            type="url"
                                            value={product.image_url}
                                            onChange={e => updateProduct({ image_url: e.target.value })}
                                            placeholder="https://..."
                                            className="w-full bg-background border rounded-lg h-10 px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-sm mt-2"
                                        />
                                    </div>
                                </div>

                                {product.image_url && (
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Current Banner Preview</div>
                                        <div className="h-40 md:h-64 rounded-xl overflow-hidden relative border shadow-sm">
                                            <img src={product.image_url} alt="Banner Preview" className="w-full h-full object-cover" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Section 4: Application Form Builder */}
                    <div className={currentStep === 4 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <CheckSquare className="text-primary h-5 w-5" />
                                <div>
                                    <h2 className="text-lg font-semibold">Application Form Builder</h2>
                                    <p className="text-xs text-muted-foreground mt-1">Define the questions customers must answer to apply for this product.</p>
                                </div>
                            </div>

                            <div className="space-y-4 w-full">
                                {product.form_schema.map((field, index) => (
                                    <div
                                        key={field.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        className={`relative bg-card border rounded-xl p-4 flex gap-4 transition-colors ${draggedIndex === index ? 'opacity-40 border-primary border-dashed shadow-inner' : 'hover:border-primary/50 group'}`}
                                    >
                                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground mt-2 touch-none flex flex-col justify-center pb-8" title="Drag to reorder">
                                            <GripVertical className="h-5 w-5 pointer-events-none" />
                                        </div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">Field Label</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={(e) => updateFormField(index, { label: e.target.value })}
                                                    className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-medium text-muted-foreground">Input Type</label>
                                                <select
                                                    value={field.type}
                                                    onChange={(e) => updateFormField(index, { type: e.target.value as any })}
                                                    className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                                >
                                                    <option value="text">Short Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="email">Email</option>
                                                    <option value="select">Dropdown Select</option>
                                                    <option value="file">File Upload</option>
                                                </select>
                                            </div>
                                            {field.type === 'select' && (
                                                <div className="space-y-1 md:col-span-2">
                                                    <label className="text-xs font-medium text-muted-foreground">Options (comma separated)</label>
                                                    <input
                                                        type="text"
                                                        value={field.options?.join(', ') || ''}
                                                        onChange={(e) => updateFormField(index, { options: e.target.value.split(',').map(s => s.trim()) })}
                                                        placeholder="Option A, Option B, Option C"
                                                        className="w-full bg-background border rounded text-sm h-9 px-3 outline-none focus:border-primary"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-center justify-between border-l pl-4 ml-2">
                                            <button type="button" onClick={() => removeFormField(index)} className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors m-1">
                                                <Trash className="h-4 w-4" />
                                            </button>
                                            <div className="flex flex-col items-center gap-1 mt-auto pb-1">
                                                <label className="text-[10px] font-bold uppercase">Required</label>
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={(e) => updateFormField(index, { required: e.target.checked })}
                                                    className="w-4 h-4 accent-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                <Button type="button" variant="outline" onClick={addFormField} className="w-full border-dashed py-8 bg-accent/20 hover:bg-accent/40 text-muted-foreground hover:text-foreground">
                                    <Plus className="mr-2 h-4 w-4" /> Add Field
                                </Button>
                            </div>

                            <div className="mt-8 pt-6 border-t">
                                <h3 className="text-sm font-semibold mb-3">Workflow Stages</h3>
                                <div className="flex gap-2 items-center text-sm text-muted-foreground bg-accent/30 p-4 rounded-lg">
                                    {product.workflow_stages.map((stage, i) => (
                                        <React.Fragment key={stage}>
                                            <span className="font-medium text-foreground bg-background px-2 py-1 rounded border shadow-sm">{stage}</span>
                                            {i < product.workflow_stages.length - 1 && <span>→</span>}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Footer Nav */}
                    <div className="flex justify-between items-center pt-8 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                        >
                            Previous Step
                        </Button>

                        {currentStep < 4 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
                            >
                                Continue to Next Step
                            </Button>
                        ) : (
                            <Button type="submit" disabled={isSaving} className="shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Publish Product
                            </Button>
                        )}
                    </div>

                </form>
            </main>

            {/* Right Panel: Live Preview */}
            <aside className="w-[340px] hidden xl:flex flex-col border rounded-2xl bg-card overflow-hidden sticky top-24 h-[calc(100vh-8rem)] shadow-lg">
                <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                    <div className="flex items-center gap-2">
                        <Smartphone className="text-primary h-5 w-5" />
                        <h3 className="text-sm font-semibold">Live Preview</h3>
                    </div>
                </div>

                <div className="flex-1 p-6 bg-black/5 overflow-y-auto flex flex-col items-center">
                    <div className="w-[280px] bg-background rounded-[2rem] overflow-hidden shadow-2xl relative border-[6px] border-zinc-900 shrink-0">
                        <div className="h-6 bg-zinc-900 flex justify-between items-center px-4">
                            <span className="text-[10px] text-white font-bold tracking-wider">9:41</span>
                            <div className="flex gap-1 h-2">
                                <div className="w-[2px] bg-white h-1.5 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white h-2 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white h-2.5 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white/40 h-3 self-end rounded-sm ml-0.5"></div>
                            </div>
                        </div>

                        <div className="bg-accent/30 min-h-[400px]">
                            <div className="p-4">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Featured Product</h4>

                                <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
                                    <div className="h-32 bg-muted relative">
                                        {product.image_url ? (
                                            <img src={product.image_url} alt="Preview" className="w-full h-full object-cover opacity-80" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-accent/50 text-xs">No Image</div>
                                        )}
                                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 shadow-sm uppercase">
                                            {product.category || 'CATEGORY'}
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-base font-bold leading-tight">{product.name || 'Product Name'}</h3>
                                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{product.tagline || 'Short tagline describing the value proposition.'}</p>

                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                                            {product.category !== 'accounts' && (
                                                <>
                                                    <div>
                                                        <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Interest</p>
                                                        <p className="text-sm font-bold text-primary">{product.interest_rate}% <span className="text-[9px] text-muted-foreground font-normal">p.a</span></p>
                                                    </div>
                                                    <div className="w-px h-8 bg-border"></div>
                                                </>
                                            )}
                                            <div>
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">{product.category === 'accounts' ? 'Min Deposit' : 'Max Amount'}</p>
                                                <p className="text-sm font-bold">₦{((product.category === 'accounts' ? product.min_amount : product.max_amount) || 0).toLocaleString()}</p>
                                            </div>
                                        </div>

                                        <Button className="w-full mt-3 py-2 h-auto text-xs shadow-none">
                                            Apply Now ({product.form_schema.length} steps)
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-3 border-t bg-muted/30 text-center">
                    <p className="text-[11px] text-muted-foreground">Changes reflect in real-time on the user app.</p>
                </div>
            </aside>
        </div>
    );
}

export default function EditProductTypePage({ params }: { params: Promise<{ typeId: string }> }) {
    const resolvedParams = use(params);

    return (
        <Suspense fallback={<div className="flex w-full justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>}>
            <EditProductTypeContent typeId={resolvedParams.typeId} />
        </Suspense>
    );
}
