"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Info,
    CreditCard,
    FileText,
    Lightbulb,
    Smartphone,
    UploadCloud,
    Bold,
    Italic,
    Underline,
    List,
    Link as LinkIcon,
    ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { ProductCategory } from "@/lib/api/types";
import { DualRangeSlider } from "@/components/ui/dual-range-slider";

export default function CreateProductTypePage() {
    const router = useRouter();

    const [isSaving, setIsSaving] = React.useState(false);
    const [interestRate, setInterestRate] = React.useState(10.0);
    const [minAmount, setMinAmount] = React.useState<number | "">("");
    const [maxAmount, setMaxAmount] = React.useState<number | "">("");
    const [minDuration, setMinDuration] = React.useState<number>(1);
    const [maxDuration, setMaxDuration] = React.useState<number>(12);
    const [currentStep, setCurrentStep] = React.useState(1);
    const [selectedCategory, setSelectedCategory] = React.useState<string>("");

    const [categories, setCategories] = React.useState<ProductCategory[]>([]);

    const selectedCatObj = categories.find(c => String(c.id) === String(selectedCategory));
    const catName = selectedCatObj ? selectedCatObj.name.toLowerCase() : "";
    const isAccount = catName.includes("account") || catName.includes("saving") || catName.includes("deposit") || catName.includes("current");

    React.useEffect(() => {
        api.getAllProductCategories().then(setCategories).catch(console.error);
    }, []);

    const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData(e.currentTarget);
            await api.saveProductType({
                id: `type_${Date.now()}`,
                name: formData.get("name") as string,
                category: formData.get("category") as string,
                tagline: formData.get("tagline") as string,
                description: "Product generated from dashboard UI.", // Add rich text later
                status: "active",
                financial_terms: [
                    isAccount ? {
                        blockType: "savings-terms",
                        interest_rate: Number(interestRate),
                        min_balance: Number(formData.get("min_amount") || 0)
                    } : {
                        blockType: "loan-terms",
                        interest_rate: Number(interestRate),
                        min_amount: Number(minAmount || 0),
                        max_amount: Number(maxAmount || 0),
                        min_duration: minDuration,
                        max_duration: maxDuration
                    }
                ],
                form_schema: [], // Empty for now, wait until form builder implemented
                workflow_stages: ['Submitted'],
                created_at: new Date().toISOString(),
            });
            router.push("/settings/product/types");
            toast.success("Product type saved successfully.");
        } catch (error) {
            console.error("Failed to save product type:", error);
            toast.error("Failed to save product type.");
        } finally {
            setIsSaving(false);
        }
    };

    const steps = [
        { step: 1, title: "Basic Info", icon: Info },
        { step: 2, title: "Financial Terms", icon: CreditCard },
        { step: 3, title: "Content & Media", icon: FileText }
    ];

    return (
        <div className="flex w-full gap-8 animate-in fade-in duration-500 justify-center px-4 md:px-8">
            {/* Central Content Area */}
            <main className="flex-1 max-w-3xl">
                <form id="create-product-form" onSubmit={handleSave} className="space-y-10 pb-24">

                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                                    <Link href="/settings/product/types">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                            </div>
                            <p className="text-muted-foreground ml-11">Configure a new individual product offering for your users.</p>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/settings/product/types">Cancel</Link>
                            </Button>
                        </div>
                    </div>

                    {/* Stepper Header */}
                    <div className="relative flex justify-between items-center mb-8 px-8">
                        {/* Connecting Line */}
                        <div className="absolute left-[10%] right-[10%] top-5 h-[2px] bg-border -z-10"></div>
                        {/* Active Line */}
                        <div
                            className="absolute left-[10%] top-5 h-[2px] bg-primary -z-10 transition-all duration-500"
                            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 80}%` }}
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
                                <span className={`text-xs font-bold uppercase tracking-wider hidden sm:block ${currentStep === s.step ? 'text-foreground' : ''}`}>
                                    {s.title}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Section: Basic Information */}
                    <div className={currentStep === 1 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section id="basic-info" className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <Info className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Basic Information</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Product Name</label>
                                    <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <input type="text" name="name" placeholder="e.g. Premium Business Checking" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" required />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Category</label>
                                    <div className="relative bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <select
                                            name="category"
                                            value={selectedCategory}
                                            onChange={(e) => setSelectedCategory(e.target.value)}
                                            className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="" disabled>Select Category...</option>
                                            {categories.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 group md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Short Tagline</label>
                                    <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <input type="text" name="tagline" placeholder="A brief, appealing summary of this product." className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">0/100 characters</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Section: Financial Terms */}
                    <div className={currentStep === 2 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section id="financial-terms" className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <CreditCard className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Financial Terms</h2>
                            </div>

                            <div className="bg-accent/50 rounded-xl p-6 border space-y-8">
                                {/* Interest Rate Slider */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Interest Rate (Annual)</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(Number(e.target.value))}
                                                className="bg-background border rounded text-primary font-bold w-20 text-center focus:ring-1 focus:ring-primary focus:border-primary text-sm p-1 outline-none"
                                            />
                                            <span className="text-muted-foreground text-sm">%</span>
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0" max="30" step="0.1"
                                        value={interestRate}
                                        onChange={(e) => setInterestRate(Number(e.target.value))}
                                        className="w-full h-2 bg-background rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>0%</span>
                                        <span>15%</span>
                                        <span>30%</span>
                                    </div>
                                </div>

                                {isAccount ? (
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Minimum Deposit / Balance</label>
                                        <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                            <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                            <input type="number" name="min_amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" required />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Minimum Amount</label>
                                                <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                                    <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                                    <input type="number" name="min_amount" value={minAmount} onChange={(e) => setMinAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" required />
                                                </div>
                                            </div>
                                            <div className="space-y-2 group">
                                                <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Maximum Amount</label>
                                                <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                                    <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                                    <input type="number" name="max_amount" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder="500000" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" required />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="px-2 mt-2">
                                            <DualRangeSlider
                                                min={0} max={10000000} step={50000}
                                                value={[Number(minAmount) || 0, Number(maxAmount) || 10000000]}
                                                onChange={(val) => { setMinAmount(val[0]); setMaxAmount(val[1]); }}
                                            />
                                            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                                                <span>₦0</span>
                                                <span>₦10,000,000+</span>
                                            </div>
                                        </div>

                                        {/* Tenure Slider */}
                                        <div className="space-y-4 pt-2 mt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2 group">
                                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Min Duration (Months)</label>
                                                    <div className="flex items-center bg-background rounded-lg border p-1 border-transparent focus-within:border-primary focus-within:ring-1">
                                                        <input type="number" value={minDuration} onChange={e => setMinDuration(Number(e.target.value))} className="w-full bg-transparent border-none text-sm h-9 px-3 font-mono outline-none" required />
                                                    </div>
                                                </div>
                                                <div className="space-y-2 group">
                                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Max Duration (Months)</label>
                                                    <div className="flex items-center bg-background rounded-lg border p-1 border-transparent focus-within:border-primary focus-within:ring-1">
                                                        <input type="number" value={maxDuration} onChange={e => setMaxDuration(Number(e.target.value))} className="w-full bg-transparent border-none text-sm h-9 px-3 font-mono outline-none" required />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="px-2">
                                                <DualRangeSlider
                                                    min={1} max={60} step={1}
                                                    value={[minDuration, maxDuration]}
                                                    onChange={(val) => { setMinDuration(val[0]); setMaxDuration(val[1]); }}
                                                />
                                                <div className="flex justify-between text-[10px] text-muted-foreground mt-2 font-mono">
                                                    <span>1 Month</span>
                                                    <span>60 Months</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Section: Content */}
                    <div className={currentStep === 3 ? "animate-in slide-in-from-right-4 fade-in duration-300 block" : "hidden"}>
                        <section id="content" className="space-y-6 pt-4">
                            <div className="flex items-center gap-2 pb-2 border-b">
                                <FileText className="text-primary h-5 w-5" />
                                <h2 className="text-lg font-semibold">Content & Media</h2>
                            </div>

                            {/* Rich Text Editor Mockup */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Detailed Description</label>
                                <div className="bg-background rounded-lg border overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
                                    <div className="flex items-center gap-1 p-2 bg-muted/50 border-b">
                                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Bold className="h-4 w-4" /></button>
                                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Italic className="h-4 w-4" /></button>
                                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><Underline className="h-4 w-4" /></button>
                                        <div className="w-px h-4 bg-border mx-1" />
                                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><List className="h-4 w-4" /></button>
                                        <button type="button" className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"><LinkIcon className="h-4 w-4" /></button>
                                    </div>
                                    <div className="p-4 min-h-[160px] text-sm text-foreground/80 leading-relaxed outline-none" contentEditable suppressContentEditableWarning data-placeholder="Explain the product's benefits in detail here...">
                                    </div>
                                </div>
                            </div>

                            {/* Image Uploader */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Product Banner Image</label>
                                <div className="border-2 border-dashed border-border hover:border-primary/50 bg-accent/30 rounded-xl p-8 flex flex-col items-center justify-center transition-colors cursor-pointer group">
                                    <div className="size-12 rounded-full bg-background border flex items-center justify-center mb-3 group-hover:bg-primary/10 transition-colors">
                                        <UploadCloud className="text-muted-foreground group-hover:text-primary h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                                    <p className="text-xs text-muted-foreground mt-1">SVG, PNG, JPG or GIF (max. 800x400px)</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="flex justify-between items-center pt-8 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
                            disabled={currentStep === 1}
                        >
                            Previous Step
                        </Button>

                        {currentStep < 3 ? (
                            <Button
                                type="button"
                                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
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
                    {/* Mobile Card Preview Container */}
                    <div className="w-[280px] bg-background rounded-[2rem] overflow-hidden shadow-2xl relative border-[6px] border-zinc-900 shrink-0">
                        {/* Status Bar */}
                        <div className="h-6 bg-zinc-900 flex justify-between items-center px-4">
                            <span className="text-[10px] text-white font-bold tracking-wider">9:41</span>
                            <div className="flex gap-1 h-2">
                                <div className="w-[2px] bg-white h-1.5 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white h-2 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white h-2.5 self-end rounded-sm"></div>
                                <div className="w-[2px] bg-white/40 h-3 self-end rounded-sm ml-0.5"></div>
                            </div>
                        </div>

                        {/* App Content */}
                        <div className="bg-accent/30 min-h-[400px]">
                            <div className="p-4">
                                <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Featured Product</h4>

                                <div className="bg-card rounded-xl shadow-sm overflow-hidden border">
                                    <div className="h-32 bg-muted relative flex items-center justify-center">
                                        <div className="size-10 rounded-full bg-border flex items-center justify-center">
                                            <Info className="h-5 w-5 text-muted-foreground/50" />
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-base font-bold leading-tight">Product Title</h3>
                                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">Product descriptions will appear here once entered.</p>

                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                                            <div>
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Interest</p>
                                                <p className="text-sm font-bold text-primary">{interestRate}% <span className="text-[9px] text-muted-foreground font-normal">p.a</span></p>
                                            </div>
                                            <div className="w-px h-8 bg-border"></div>
                                            <div>
                                                <p className="text-sm font-bold">{isAccount ? `₦${Number(minAmount || 0).toLocaleString()}` : maxDuration} <span className="text-[9px] text-muted-foreground font-normal">{isAccount ? '' : 'mos'}</span></p>
                                            </div>
                                        </div>

                                        <Button className="w-full mt-3 py-2 h-auto text-xs shadow-none" disabled>
                                            Apply Now
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>
    );
}
