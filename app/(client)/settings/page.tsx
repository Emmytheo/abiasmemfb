"use client";

import React, { useState } from "react";
import { 
    Settings, 
    ShieldCheck, 
    Bell, 
    Smartphone, 
    Key, 
    Users, 
    Link as LinkIcon,
    Lock,
    Save,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useScope } from "@/context/scope-context";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function SettingsPage() {
    const { activeScopeId, activeScope } = useScope();
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = () => {
        setIsSaving(true);
        setTimeout(() => {
            toast.success("Preferences updated successfully");
            setIsSaving(false);
        }, 800);
    };

    return (
        <div className="mx-auto p-4 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl">
            <header>
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Configuration</p>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-widest">{activeScope.type} Scope</Badge>
                </div>
                <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Platform Settings</h1>
                <p className="text-muted-foreground mt-2">
                    Manage your security, notifications, and environment preferences.
                </p>
            </header>

            <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-14 bg-card border shadow-sm rounded-xl mb-8">
                    <TabsTrigger value="security" className="text-sm font-bold rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <ShieldCheck className="h-4 w-4 mr-2" /> Security & Access
                    </TabsTrigger>
                    <TabsTrigger value="preferences" className="text-sm font-bold rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Settings className="h-4 w-4 mr-2" /> General Preferences
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="text-sm font-bold rounded-lg data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                        <Bell className="h-4 w-4 mr-2" /> Notifications
                    </TabsTrigger>
                </TabsList>

                {/* SECURITY TAB */}
                <TabsContent value="security" className="space-y-6">
                    {/* Personal Security */}
                    {activeScope.type === 'personal' && (
                        <Card className="border-primary/10 shadow-lg shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Lock className="h-5 w-5 text-primary" /> Personal Security
                                </CardTitle>
                                <CardDescription>Configure biometric authentication and transaction limits.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Two-Factor Authentication (2FA)</Label>
                                        <p className="text-sm text-muted-foreground">Require a one-time password for sensitive actions.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Biometric Login</Label>
                                        <p className="text-sm text-muted-foreground">Use FaceID or Fingerprint to unlock the app.</p>
                                    </div>
                                    <Switch />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label className="font-bold">Daily Transfer Limit (₦)</Label>
                                    <Input type="number" defaultValue="500000" className="max-w-xs h-11 bg-muted/50" />
                                    <p className="text-xs text-muted-foreground">Maximum amount you can transfer in a single day.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Business Security */}
                    {activeScope.type === 'business' && (
                        <Card className="border-primary/10 shadow-lg shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" /> Team Access & Roles
                                </CardTitle>
                                <CardDescription>Manage who has access to your corporate ledger.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Require Dual Authorization</Label>
                                        <p className="text-sm text-muted-foreground">Transactions over ₦1M require 2 directors to approve.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="space-y-2 pt-2">
                                    <Label className="font-bold">API Access IP Whitelist</Label>
                                    <Input placeholder="e.g. 192.168.1.1, 10.0.0.5" className="max-w-md h-11 bg-muted/50" />
                                    <p className="text-xs text-muted-foreground">Restrict Merchant API calls to these static IPs.</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Coop Security */}
                    {activeScope.type === 'coop' && (
                        <Card className="border-primary/10 shadow-lg shadow-primary/5">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" /> Union Security
                                </CardTitle>
                                <CardDescription>Configure membership requirements and rules.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Strict KYC Enforced</Label>
                                        <p className="text-sm text-muted-foreground">Require all members to have Tier 3 KYC to join Esusu cycles.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Public Invitation Links</Label>
                                        <p className="text-sm text-muted-foreground">Allow members to invite others via URL links.</p>
                                    </div>
                                    <Switch />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-11 px-8 font-bold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Security Settings
                    </Button>
                </TabsContent>

                {/* PREFERENCES TAB */}
                <TabsContent value="preferences" className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">General Preferences</CardTitle>
                            <CardDescription>Customize your application experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">Compact Mode</Label>
                                    <p className="text-sm text-muted-foreground">Display more data with tighter spacing on dashboards.</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">Currency Display</Label>
                                    <p className="text-sm text-muted-foreground">Always show exact decimals (e.g. ₦1,000.00 vs ₦1k).</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="space-y-2 pt-2">
                                <Label className="font-bold">Timezone</Label>
                                <select className="w-full max-w-xs h-11 bg-muted/50 border border-border rounded-md px-3 text-sm">
                                    <option>West Africa Time (WAT)</option>
                                    <option>Greenwich Mean Time (GMT)</option>
                                </select>
                            </div>
                        </CardContent>
                    </Card>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-11 px-8 font-bold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Preferences
                    </Button>
                </TabsContent>

                {/* NOTIFICATIONS TAB */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card className="shadow-sm">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary" /> Alert Triggers
                            </CardTitle>
                            <CardDescription>Choose how and when we interrupt you.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">Email Receipts</Label>
                                    <p className="text-sm text-muted-foreground">Send a PDF receipt for every successful transaction.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-bold">SMS Alerts</Label>
                                    <p className="text-sm text-muted-foreground">Send SMS for credit/debit alerts (Standard charges apply).</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            
                            {activeScope.type === 'business' && (
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Webhook Failure Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Notify administrators if an API webhook endpoint fails 3 times.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            )}

                            {activeScope.type === 'coop' && (
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold">Rotation Turn Alerts</Label>
                                        <p className="text-sm text-muted-foreground">Notify members 3 days before their Esusu payout cycle.</p>
                                    </div>
                                    <Switch defaultChecked />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Button onClick={handleSave} disabled={isSaving} className="w-full sm:w-auto h-11 px-8 font-bold">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        Save Notification Rules
                    </Button>
                </TabsContent>
            </Tabs>
        </div>
    );
}
