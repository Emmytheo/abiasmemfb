"use client";

import React, { useState } from "react";
import { 
    Smartphone, 
    Wifi, 
    WifiOff, 
    PlusCircle,
    Activity,
    MapPin,
    AlertTriangle,
    CheckCircle2,
    Settings2,
    RefreshCw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScope } from "@/context/scope-context";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const TERMINALS = [
    { tid: "20394811", model: "PAX S920", location: "Main Shop - Counter 1", status: "online", battery: 85, todayVol: 45000, lastActive: "Just now" },
    { tid: "20394812", model: "MoreFun MF919", location: "Annex Kiosk", status: "offline", battery: 12, todayVol: 35000, lastActive: "4 hours ago" },
];

export default function AgentTerminalsPage() {
    const { activeScopeId, activeScope } = useScope();
    const [isRequesting, setIsRequesting] = useState(false);
    
    // Simulate agent scope lock
    if (activeScope.type !== 'business' && activeScope.type !== 'personal') {
        // Just allowing rendering for now
    }

    const handleRequestTerminal = (e: React.FormEvent) => {
        e.preventDefault();
        setIsRequesting(true);
        setTimeout(() => {
            toast.success("Hardware request submitted successfully.");
            setIsRequesting(false);
        }, 1500);
    };

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Hardware Management</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">Agent ID: AG-4009</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">POS Terminals</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Monitor the health of your assigned POS devices, track hardware-specific volumes, and request new terminals.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-11 font-black shadow-lg">
                                <PlusCircle className="mr-2 h-4 w-4" /> Request New POS
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Hardware Request</DialogTitle>
                                <DialogDescription>
                                    Apply for additional POS hardware. A deployment fee may apply.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRequestTerminal} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Preferred Model</Label>
                                    <select className="w-full h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-1 focus:ring-ring">
                                        <option>Android Smart POS (MoreFun MF919)</option>
                                        <option>Traditional POS (PAX S920)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Deployment Location / Store Name</Label>
                                    <Input required placeholder="e.g. Branch 3" />
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 border">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">Requests are subject to volume review. An account manager will contact you.</p>
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isRequesting}>
                                    {isRequesting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                                    Submit Request
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {TERMINALS.map((t) => (
                    <Card key={t.tid} className={`relative overflow-hidden shadow-lg transition-all hover:shadow-xl ${t.status === 'online' ? 'border-primary/20 shadow-primary/5' : 'border-border'}`}>
                        {t.status === 'online' && (
                            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 z-0" />
                        )}
                        <CardHeader className="pb-2 relative z-10">
                            <div className="flex items-start justify-between mb-2">
                                <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <Smartphone className="size-6" />
                                </div>
                                {t.status === 'online' ? (
                                    <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1.5 shadow-sm">
                                        <div className="size-1.5 rounded-full bg-white animate-pulse" /> Online
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground bg-muted flex items-center gap-1.5">
                                        <WifiOff className="size-3" /> Offline
                                    </Badge>
                                )}
                            </div>
                            <CardTitle className="text-xl">TID: {t.tid}</CardTitle>
                            <CardDescription className="font-medium text-foreground">{t.model}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10 pb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <MapPin className="h-4 w-4" /> {t.location}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/50">
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Today's Vol</p>
                                    <p className="font-black text-lg">₦{t.todayVol.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Battery</p>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full ${t.battery > 20 ? 'bg-emerald-500' : 'bg-rose-500'}`} 
                                                style={{ width: `${t.battery}%` }} 
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{t.battery}%</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="bg-muted/30 border-t py-3 flex items-center justify-between text-xs text-muted-foreground z-10 relative">
                            <span>Last active: {t.lastActive}</span>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs font-bold">
                                <Settings2 className="h-3.5 w-3.5 mr-1.5" /> Manage
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {/* Blank State / Request Card */}
                <Card className="border-dashed border-2 border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center p-8 text-center min-h-[300px] shadow-none hover:bg-primary/5 transition-colors cursor-pointer">
                    <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                        <PlusCircle className="size-8" />
                    </div>
                    <h3 className="text-lg font-bold">Expand Network</h3>
                    <p className="text-sm text-muted-foreground max-w-[200px] mt-2 mb-4">Need another terminal for a new location or heavy traffic?</p>
                    <Button variant="outline" className="font-bold border-primary/30 text-primary hover:bg-primary/10">Request Hardware</Button>
                </Card>
            </div>
        </div>
    );
}
