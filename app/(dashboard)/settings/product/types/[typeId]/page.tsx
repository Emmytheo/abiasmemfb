"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    Save,
    Loader2,
    Trash,
    Info,
    CreditCard,
    FileText,
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

export default function EditProductTypePage() {
    const params = useParams();
    const router = useRouter();
    const typeId = params.typeId as string;

    const [isSaving, setIsSaving] = React.useState(false);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [interestRate, setInterestRate] = React.useState(12.5);
    const [currentStep, setCurrentStep] = React.useState(1);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            router.push("/settings/product/types");
        }, 800);
    };

    const handleDelete = () => {
        setIsDeleting(true);
        setTimeout(() => {
            setIsDeleting(false);
            router.push("/settings/product/types");
        }, 800);
    }

    const steps = [
        { step: 1, title: "Basic Info", icon: Info },
        { step: 2, title: "Financial Terms", icon: CreditCard },
        { step: 3, title: "Content & Media", icon: FileText }
    ];

    return (
        <div className="flex w-full gap-8 animate-in fade-in duration-500 justify-center">
            {/* Central Content Area */}
            <main className="flex-1 max-w-3xl">
                <form id="edit-product-form" onSubmit={handleSave} className="space-y-10 pb-24">

                    {/* Header Actions */}
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                                    <Link href="/settings/product/types">
                                        <ArrowLeft className="h-4 w-4" />
                                    </Link>
                                </Button>
                                <h1 className="text-3xl font-bold tracking-tight">Edit Product</h1>
                            </div>
                            <p className="text-muted-foreground ml-11">Configure the core details for "SME Growth Loan". ID: {typeId}</p>
                        </div>
                        <div className="flex items-center gap-2 self-end md:self-auto">
                            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash className="h-4 w-4" />}
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
                                        <input type="text" defaultValue="SME Growth Loan" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" required />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Category</label>
                                    <div className="relative bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <select defaultValue="loans" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none appearance-none cursor-pointer">
                                            <option value="loans">Loans & Credit</option>
                                            <option value="savings">Savings Accounts</option>
                                            <option value="investment">Investments</option>
                                        </select>
                                        <div className="absolute right-3 top-3 pointer-events-none text-muted-foreground">
                                            <ChevronDown className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 group md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Short Tagline</label>
                                    <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <input type="text" defaultValue="Flexible financing to power your business growth." className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-right">46/100 characters</p>
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

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Minimum Amount</label>
                                        <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                            <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                            <input type="text" defaultValue="50,000" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 group">
                                        <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Maximum Amount</label>
                                        <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                            <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                            <input type="text" defaultValue="5,000,000" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" />
                                        </div>
                                    </div>
                                </div>

                                {/* Tenure Pseudo-Slider */}
                                <div className="space-y-4 pt-2">
                                    <div className="flex justify-between items-center">
                                        <label className="text-sm font-medium">Loan Tenure Range</label>
                                        <span className="text-sm text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">3 - 24 Months</span>
                                    </div>
                                    <div className="relative w-full h-1.5 bg-background rounded-full">
                                        <div className="absolute left-[10%] right-[30%] top-0 bottom-0 bg-primary rounded-full"></div>
                                        <div className="absolute left-[10%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow cursor-pointer hover:scale-110 transition-transform"></div>
                                        <div className="absolute right-[30%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow cursor-pointer hover:scale-110 transition-transform"></div>
                                    </div>
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>1 Month</span>
                                        <span>36 Months</span>
                                    </div>
                                </div>
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
                                    <div className="p-4 min-h-[160px] text-sm text-foreground/80 leading-relaxed outline-none" contentEditable suppressContentEditableWarning>
                                        <p>The SME Growth Loan provides business owners with the capital they need to expand operations, purchase inventory, or manage cash flow. With competitive interest rates and flexible repayment terms, this product is designed to support the backbone of our economy.</p>
                                        <br />
                                        <p><strong>Key Benefits:</strong></p>
                                        <ul className="list-disc list-inside ml-2 mt-1">
                                            <li>Quick approval process (48 hours)</li>
                                            <li>No collateral for loans under ₦500k</li>
                                            <li>Flexible repayment options</li>
                                        </ul>
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
                                    <div className="h-32 bg-muted relative">
                                        <img
                                            src="https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=400&h=200"
                                            alt="Preview"
                                            className="w-full h-full object-cover opacity-80"
                                        />
                                        <div className="absolute top-3 right-3 bg-background/90 backdrop-blur rounded-full px-2 py-0.5 text-[10px] font-bold text-primary border border-primary/20 shadow-sm">
                                            LOAN
                                        </div>
                                    </div>

                                    <div className="p-4">
                                        <h3 className="text-base font-bold leading-tight">SME Growth Loan</h3>
                                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">Flexible financing to power your business growth. Scale faster with AbiaSMEMFB.</p>

                                        <div className="flex items-center gap-4 mt-4 pt-3 border-t">
                                            <div>
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Interest</p>
                                                <p className="text-sm font-bold text-primary">{interestRate}% <span className="text-[9px] text-muted-foreground font-normal">p.a</span></p>
                                            </div>
                                            <div className="w-px h-8 bg-border"></div>
                                            <div>
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Tenure</p>
                                                <p className="text-sm font-bold">24 <span className="text-[9px] text-muted-foreground font-normal">mos</span></p>
                                            </div>
                                        </div>

                                        <Button className="w-full mt-3 py-2 h-auto text-xs shadow-none">
                                            Apply Now
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Skeleton items */}
                            <div className="px-4 space-y-3 opacity-40">
                                <div className="h-16 bg-card rounded-xl border"></div>
                                <div className="h-16 bg-card rounded-xl border"></div>
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
