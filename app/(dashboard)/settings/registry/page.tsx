"use client";

import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { CloudUpload, Code, FileJson, CheckCircle2, Loader2, Sparkles, Zap, RefreshCw } from "lucide-react";

export default function RegistryBlueprintsEditor() {
    const [rawJson, setRawJson] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [activeFileName, setActiveFileName] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const validateAndFormatJson = (input: string) => {
        try {
            if (!input.trim()) return null;
            const parsed = JSON.parse(input);
            setRawJson(JSON.stringify(parsed, null, 2));
            return parsed;
        } catch (e: any) {
            toast.error("Invalid JSON Syntax", { description: e.message });
            return null;
        }
    };

    const handleImportSubmit = async (payload: any) => {
        setIsSubmitting(true);
        try {
            const req = await fetch('/api/registry/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await req.json();

            if (!req.ok) {
                toast.error("Registry Sync Failed", { description: res.error || res.details || "Unknown API error" });
                return;
            }

            toast.success("Blueprint Successfully Injected", {
                description: `Created/Merged: ${res.stats?.products} Products & ${res.stats?.services} Services`
            });
            
            if (res.stats?.errors?.length > 0) {
                toast.warning("Some partial failures occurred", { description: res.stats.errors[0] });
            }

            // Reset after success
            setRawJson("");
            setActiveFileName(null);
            
        } catch (e: any) {
            toast.error("Network Error", { description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBootstrap = async () => {
        setIsSubmitting(true);
        try {
            const req = await fetch('/api/registry/bootstrap');
            const res = await req.json();

            if (!req.ok) {
                toast.error("Bootstrap Failed", { description: res.error || "Unknown error" });
                return;
            }

            const totalSucceeded = res.results.filter((r: any) => r.status === 'synchronized').length;
            toast.success("Bootstrap Sync Complete", {
                description: `Successfully synchronized ${totalSucceeded} local SDL templates.`
            });
            
        } catch (e: any) {
            toast.error("Network Error", { description: e.message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Drag and Drop Handlers
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        await processFile(file);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await processFile(file);
    };

    const processFile = async (file: File) => {
        if (file.type !== "application/json" && !file.name.endsWith(".json")) {
            toast.error("Invalid File Type", { description: "Please upload an SDL JSON file." });
            return;
        }

        try {
            const text = await file.text();
            const parsed = validateAndFormatJson(text);
            if (parsed) {
                setActiveFileName(file.name);
                toast.info(`Parsed ${file.name}`, { description: "Ready for injection" });
            }
        } catch (e: any) {
            toast.error("File Read Error", { description: "Could not read the dropped file." });
        }
    };

    return (
        <div className="max-w-6xl w-full mx-auto p-4 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Registry Blueprints
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload or paste Service Definition Language (SDL) JSON payloads to update platform products dynamically.
                    </p>
                </div>
                {activeFileName && (
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {activeFileName} Ready
                    </div>
                )}
            </div>

            <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5">
                <Tabs defaultValue="upload" className="w-full">
                    <CardHeader className="bg-muted/30 border-b pb-0">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <CardTitle className="text-xl">Import Engine</CardTitle>
                                <CardDescription>Consolidate your banking architecture visually.</CardDescription>
                            </div>
                            <TabsList className="bg-background border">
                                <TabsTrigger value="upload" className="gap-2">
                                    <CloudUpload className="h-4 w-4" /> Upload
                                </TabsTrigger>
                                <TabsTrigger value="code" className="gap-2">
                                    <Code className="h-4 w-4" /> Edit Code
                                </TabsTrigger>
                            </TabsList>
                            <div className="h-8 w-px bg-border mx-2" />
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="gap-2 text-primary border-primary/20 hover:bg-primary/5"
                                onClick={handleBootstrap}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                                <span className="hidden sm:inline">Sync from Templates</span>
                                <span className="sm:hidden">Sync</span>
                            </Button>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="p-6">
                        <TabsContent value="upload" className="mt-0">
                            <div 
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/10"}`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".json,application/json"
                                    onChange={handleFileSelect}
                                />
                                
                                <div className={`p-4 rounded-full mb-4 transition-colors ${activeFileName ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                                    {activeFileName ? <FileJson className="h-10 w-10" /> : <CloudUpload className="h-10 w-10" />}
                                </div>
                                <h3 className="text-lg font-bold">
                                    {activeFileName ? `Loaded: ${activeFileName}` : "Drag & Drop JSON Blueprint"}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-2 text-center max-w-sm">
                                    {activeFileName 
                                        ? "Your SDL template has been parsed and is ready to push into the registry."
                                        : "You can drag your .sdl.json files directly here or click to browse your computer."}
                                </p>
                            </div>
                        </TabsContent>

                        <TabsContent value="code" className="mt-0">
                            <Textarea 
                                value={rawJson}
                                onChange={(e) => setRawJson(e.target.value)}
                                placeholder={`{\n  "version": "1.0.0",\n  "services": [],\n  "products": []\n}`}
                                className="min-h-[400px] font-mono text-sm bg-muted/30 border-muted-foreground/20 leading-relaxed shadow-inner"
                                onBlur={() => validateAndFormatJson(rawJson)}
                            />
                        </TabsContent>
                    </CardContent>
                </Tabs>

                <div className="p-6 border-t bg-muted/10 flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                        Warning: Injecting registry payloads uses a deep-merge strategy based on naming conventions. Ensure 'name' fields are strictly typed.
                    </p>
                    <Button 
                        size="lg" 
                        disabled={isSubmitting || (!rawJson.trim() && !activeFileName)}
                        onClick={() => {
                            const parsed = validateAndFormatJson(rawJson);
                            if (parsed) handleImportSubmit(parsed);
                        }}
                        className="font-bold gap-2 ml-4 shrink-0 shadow-lg shadow-primary/20"
                    >
                        {isSubmitting ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Syncing</>
                        ) : (
                            <><CloudUpload className="h-4 w-4" /> Inject Blueprint</>
                        )}
                    </Button>
                </div>
            </Card>
        </div>
    );
}
