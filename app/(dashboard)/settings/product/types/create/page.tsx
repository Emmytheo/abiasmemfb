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
    Settings,
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

export default function CreateProductTypePage() {
    const router = useRouter();

    const [isSaving, setIsSaving] = React.useState(false);
    const [interestRate, setInterestRate] = React.useState(10.0);

    const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            router.push("/settings/product/types");
        }, 800);
    };

    // Handlers for scroll spy or simple anchor links
    const scrollTo = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex w-full gap-8 animate-in fade-in duration-500">
            {/* Left Sidebar Navigation (Anchor Links) */}
            <aside className="w-56 hidden lg:flex flex-col sticky top-24 h-[calc(100vh-8rem)]">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 pl-3">Navigation</h3>
                <div className="flex flex-col gap-1">
                    <button onClick={() => scrollTo('basic-info')} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-accent text-primary border-l-2 border-primary text-left">
                        <Info className="h-5 w-5" />
                        <span className="text-sm font-medium">Basic Info</span>
                    </button>
                    <button onClick={() => scrollTo('financial-terms')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                        <CreditCard className="h-5 w-5" />
                        <span className="text-sm font-medium">Financial Terms</span>
                    </button>
                    <button onClick={() => scrollTo('content')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                        <FileText className="h-5 w-5" />
                        <span className="text-sm font-medium">Content & Media</span>
                    </button>
                    <button onClick={() => scrollTo('settings')} className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-colors text-left">
                        <Settings className="h-5 w-5" />
                        <span className="text-sm font-medium">Configuration</span>
                    </button>
                </div>

                <div className="mt-auto mb-8 p-4 rounded-xl bg-gradient-to-b from-accent to-background border border-border">
                    <div className="flex items-center gap-2 text-primary mb-2">
                        <Lightbulb className="h-[18px] w-[18px]" />
                        <span className="text-xs font-bold uppercase">Pro Tip</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Start with basic details. You can always configure advanced settings later.
                    </p>
                </div>
            </aside>

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
                            <Button type="submit" disabled={isSaving} className="shadow-[0_0_15px_rgba(var(--primary),0.2)]">
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Save Product Type
                            </Button>
                        </div>
                    </div>

                    {/* Section: Basic Information */}
                    <section id="basic-info" className="space-y-6 pt-4 scroll-mt-24">
                        <div className="flex items-center gap-2 pb-2 border-b">
                            <Info className="text-primary h-5 w-5" />
                            <h2 className="text-lg font-semibold">Basic Information</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Product Name</label>
                                <div className="bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                    <input type="text" placeholder="e.g. Premium Business Checking" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" required />
                                </div>
                            </div>
                            <div className="space-y-2 group">
                                <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Category</label>
                                <div className="relative bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                    <select defaultValue="" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none appearance-none cursor-pointer" required>
                                        <option value="" disabled>Select Category...</option>
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
                                    <input type="text" placeholder="A brief, appealing summary of this product." className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-3 outline-none" />
                                </div>
                                <p className="text-xs text-muted-foreground text-right">0/100 characters</p>
                            </div>
                        </div>
                    </section>

                    {/* Section: Financial Terms */}
                    <section id="financial-terms" className="space-y-6 pt-4 scroll-mt-24">
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
                                        <input type="number" placeholder="0" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-2 group">
                                    <label className="text-sm font-medium text-muted-foreground group-focus-within:text-primary transition-colors">Maximum Amount</label>
                                    <div className="flex items-center bg-background rounded-lg border focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all p-1">
                                        <span className="pl-3 text-muted-foreground font-serif text-sm">₦</span>
                                        <input type="number" placeholder="50,000" className="w-full bg-transparent border-none focus:ring-0 text-sm h-9 px-2 font-mono outline-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Tenure Pseudo-Slider */}
                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-medium">Loan Tenure Range</label>
                                    <span className="text-sm text-primary font-mono bg-primary/10 px-2 py-0.5 rounded">1 - 12 Months</span>
                                </div>
                                <div className="relative w-full h-1.5 bg-background rounded-full">
                                    <div className="absolute left-[0%] right-[66%] top-0 bottom-0 bg-primary rounded-full"></div>
                                    <div className="absolute left-[0%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow cursor-pointer hover:scale-110 transition-transform"></div>
                                    <div className="absolute right-[66%] top-1/2 -translate-y-1/2 w-4 h-4 bg-primary border-2 border-background rounded-full shadow cursor-pointer hover:scale-110 transition-transform"></div>
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>1 Month</span>
                                    <span>36 Months</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section: Content */}
                    <section id="content" className="space-y-6 pt-4 scroll-mt-24">
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
                                                <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-wider">Tenure</p>
                                                <p className="text-sm font-bold">- <span className="text-[9px] text-muted-foreground font-normal">mos</span></p>
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
