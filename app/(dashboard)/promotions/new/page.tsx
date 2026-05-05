"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function NewPromotionPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageSource: "url" as "url" | "media",
        imageUrl: "https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6",
        link: "",
        placement: "hero",
        isActive: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Note: File uploads to Payload require FormData. 
            // For this implementation we are passing standard data and a dummy media object or omitting image 
            // depending on if it's DummyAdapter or PayloadAdapter.
            // Ideally, you'd use a custom file uploader component here that talks to the Payload Media collection.
            const payloadData = {
                title: formData.title,
                description: formData.description,
                imageSource: formData.imageSource,
                externalUrl: formData.imageSource === 'url' ? formData.imageUrl : undefined,
                image: formData.imageSource === 'media' ? undefined : undefined,
                link: formData.link,
                placement: formData.placement,
                isActive: formData.isActive,
            };
            
            await api.createPromotion(payloadData as any);
            toast.success("Promotion created successfully!");
            router.push("/promotions");
        } catch (error) {
            toast.error("Failed to create promotion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/promotions"><ArrowLeft className="h-5 w-5" /></Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight">Create Promotion</h1>
                    <p className="text-sm text-muted-foreground">Add a new showcase or advertisement.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-card border rounded-xl p-6 shadow-sm">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title <span className="text-destructive">*</span></Label>
                        <Input 
                            id="title" 
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            required 
                            placeholder="e.g. 5% Cash Back on SME Loans" 
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea 
                            id="description" 
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            placeholder="Brief details about the promotion..." 
                            rows={3}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="imageSource">Image Source</Label>
                            <Select value={formData.imageSource} onValueChange={(val: any) => setFormData({...formData, imageSource: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose source" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="url">External URL</SelectItem>
                                    <SelectItem value="media">Media Library</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {formData.imageSource === 'url' ? (
                            <div className="space-y-2">
                                <Label htmlFor="imageUrl">Image URL <span className="text-destructive">*</span></Label>
                                <Input 
                                    id="imageUrl" 
                                    value={formData.imageUrl} 
                                    onChange={(e) => setFormData({...formData, imageUrl: e.target.value})} 
                                    required 
                                    placeholder="Paste an image link" 
                                />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Label>Media Library</Label>
                                <div className="h-10 px-3 py-2 rounded-md border border-input bg-muted text-muted-foreground text-sm flex items-center italic">
                                    Use Payload Admin to upload files
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="link">Target URL</Label>
                        <Input 
                            id="link" 
                            value={formData.link} 
                            onChange={(e) => setFormData({...formData, link: e.target.value})} 
                            placeholder="/business or https://example.com" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="placement">Placement</Label>
                            <Select value={formData.placement} onValueChange={(val) => setFormData({...formData, placement: val})}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select placement" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="hero">Hero Section</SelectItem>
                                    <SelectItem value="banner">Banner</SelectItem>
                                    <SelectItem value="sidebar">Sidebar</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        
                        <div className="flex flex-col justify-center space-y-2 pt-6">
                            <div className="flex items-center space-x-2">
                                <Switch 
                                    id="isActive" 
                                    checked={formData.isActive} 
                                    onCheckedChange={(val) => setFormData({...formData, isActive: val})} 
                                />
                                <Label htmlFor="isActive" className="cursor-pointer">Active Status</Label>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t pt-6">
                    <Button variant="outline" type="button" asChild>
                        <Link href="/promotions">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={loading} className="w-32">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Save</>}
                    </Button>
                </div>
            </form>
        </div>
    );
}
