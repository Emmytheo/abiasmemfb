"use client"

import React, { useState, useEffect } from "react"
import {
    Settings,
    ShieldCheck,
    Bell,
    Users,
    Lock,
    Save,
    Loader2,
    KeyRound,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useScope } from "@/context/scope-context"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function SettingsPage() {
    const { activeScope } = useScope()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [prefs, setPrefs] = useState<any>({
        two_factor_enabled: true,
        biometric_enabled: false,
        daily_transfer_limit_kobo: 50000000,
        require_dual_auth: true,
        api_ip_whitelist: "",
        strict_coop_kyc: true,
        public_coop_invites: false,
        compact_mode: false,
        exact_decimals: true,
        timezone: "Africa/Lagos",
        email_receipts: true,
        sms_alerts: true,
        webhook_failure_alerts: true,
        rotation_turn_alerts: true,
        has_transaction_pin: false,
    })

    const [dailyLimitNaira, setDailyLimitNaira] = useState("500000")
    const [currentPin, setCurrentPin] = useState("")
    const [newPin, setNewPin] = useState("")

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/client/settings")
                const data = await res.json()
                if (res.ok && data.success && data.preferences) {
                    setPrefs(data.preferences)
                    setDailyLimitNaira(String(Math.round(Number(data.preferences.daily_transfer_limit_kobo || 50000000) / 100)))
                }
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleSave = async (extra: Record<string, any> = {}) => {
        setSaving(true)
        try {
            const res = await fetch("/api/client/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...prefs,
                    daily_transfer_limit_naira: Number(dailyLimitNaira),
                    ...extra,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to save settings")
                return
            }
            setPrefs(data.preferences)
            if (extra.new_transaction_pin) {
                setCurrentPin("")
                setNewPin("")
                toast.success("4-digit Transaction PIN encrypted & saved!")
            } else {
                toast.success("Security & platform preferences persisted!")
            }
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading preferences...
            </div>
        )
    }

    return (
        <div className="mx-auto p-2 md:p-8 space-y-8 max-w-5xl">
            <header>
                <div className="flex items-center gap-3 mb-1">
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Persisted Configuration</p>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-widest">{activeScope.type} Scope</Badge>
                </div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1">Platform Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your real-time transaction PIN, daily transfer caps, dual-auth rules, and notification channels.
                </p>
            </header>

            <Tabs defaultValue="security" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12 bg-card border rounded-xl mb-6">
                    <TabsTrigger value="security" className="text-xs sm:text-sm font-bold"><ShieldCheck className="h-4 w-4 mr-1.5" /> Security & PIN</TabsTrigger>
                    <TabsTrigger value="preferences" className="text-xs sm:text-sm font-bold"><Settings className="h-4 w-4 mr-1.5" /> Preferences</TabsTrigger>
                    <TabsTrigger value="notifications" className="text-xs sm:text-sm font-bold"><Bell className="h-4 w-4 mr-1.5" /> Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Lock className="h-5 w-5 text-primary" /> Transfer Controls & Security
                            </CardTitle>
                            <CardDescription>Enforced directly by the BankSuite Atomic Transfer Engine.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div>
                                    <Label className="font-bold">Two-Factor Authentication (2FA)</Label>
                                    <p className="text-xs text-muted-foreground">Protect sensitive transfers and account edits.</p>
                                </div>
                                <Switch checked={prefs.two_factor_enabled} onCheckedChange={(v) => setPrefs({ ...prefs, two_factor_enabled: v })} />
                            </div>

                            <div className="space-y-2 border-b pb-4">
                                <Label className="font-bold">Daily Outbound Transfer Cap (NGN)</Label>
                                <Input type="number" min="1000" value={dailyLimitNaira} onChange={(e) => setDailyLimitNaira(e.target.value)} className="max-w-xs h-10 font-mono font-bold" />
                                <p className="text-xs text-muted-foreground">Strictly enforced across all transfers initiated from your accounts.</p>
                            </div>

                            {activeScope.type === "business" && (
                                <div className="space-y-4 border-b pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label className="font-bold">Require Corporate Dual Authorization</Label>
                                            <p className="text-xs text-muted-foreground">Transactions above threshold require secondary approval.</p>
                                        </div>
                                        <Switch checked={prefs.require_dual_auth} onCheckedChange={(v) => setPrefs({ ...prefs, require_dual_auth: v })} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="font-bold">Merchant API IP Whitelist</Label>
                                        <Input value={prefs.api_ip_whitelist || ""} onChange={(e) => setPrefs({ ...prefs, api_ip_whitelist: e.target.value })} placeholder="e.g. 41.58.12.10, 102.89.4.12" className="max-w-md" />
                                    </div>
                                </div>
                            )}

                            {activeScope.type === "coop" && (
                                <div className="flex items-center justify-between border-b pb-4">
                                    <div>
                                        <Label className="font-bold">Strict Cooperative KYC Enforcement</Label>
                                        <p className="text-xs text-muted-foreground">Require verified customer BVN before Esusu slot assignment.</p>
                                    </div>
                                    <Switch checked={prefs.strict_coop_kyc} onCheckedChange={(v) => setPrefs({ ...prefs, strict_coop_kyc: v })} />
                                </div>
                            )}

                            <Button onClick={() => handleSave()} disabled={saving} className="rounded-xl font-bold">
                                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Security Controls
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Transaction PIN */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-primary" /> 4-Digit Transaction PIN
                                <Badge variant={prefs.has_transaction_pin ? "default" : "secondary"} className="text-[10px]">
                                    {prefs.has_transaction_pin ? "Active" : "Not Set"}
                                </Badge>
                            </CardTitle>
                            <CardDescription>Scrypt-hashed server-side. When active, transfers require this 4-digit PIN.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col sm:flex-row gap-3 items-end">
                            {prefs.has_transaction_pin && (
                                <div className="space-y-1">
                                    <Label className="text-xs font-bold">Current PIN</Label>
                                    <Input type="password" maxLength={4} value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="w-32 font-mono text-center tracking-widest" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label className="text-xs font-bold">New 4-Digit PIN</Label>
                                <Input type="password" maxLength={4} value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ""))} placeholder="••••" className="w-32 font-mono text-center tracking-widest" />
                            </div>
                            <Button
                                disabled={saving || newPin.length !== 4}
                                onClick={() => handleSave({ current_transaction_pin: currentPin, new_transaction_pin: newPin })}
                                className="rounded-xl font-bold"
                            >
                                {prefs.has_transaction_pin ? "Rotate PIN" : "Set Transaction PIN"}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="preferences" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Display & Regional Preferences</CardTitle></CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div><Label className="font-bold">Compact Ledger Density</Label><p className="text-xs text-muted-foreground">Tighter row heights across tables.</p></div>
                                <Switch checked={prefs.compact_mode} onCheckedChange={(v) => setPrefs({ ...prefs, compact_mode: v })} />
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div><Label className="font-bold">Exact Currency Decimals</Label><p className="text-xs text-muted-foreground">Always show kobo decimals.</p></div>
                                <Switch checked={prefs.exact_decimals} onCheckedChange={(v) => setPrefs({ ...prefs, exact_decimals: v })} />
                            </div>
                            <div className="space-y-1.5">
                                <Label className="font-bold">Timezone</Label>
                                <select value={prefs.timezone} onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })} className="h-10 rounded-xl border bg-background px-3 text-sm">
                                    <option value="Africa/Lagos">West Africa Time (WAT / Africa/Lagos)</option>
                                    <option value="UTC">Greenwich Mean Time (UTC)</option>
                                </select>
                            </div>
                            <Button onClick={() => handleSave()} disabled={saving} className="rounded-xl font-bold">
                                <Save className="h-4 w-4 mr-2" /> Save Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-lg">Alert Channels</CardTitle></CardHeader>
                        <CardContent className="space-y-5">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div><Label className="font-bold">Email Transaction Receipts</Label></div>
                                <Switch checked={prefs.email_receipts} onCheckedChange={(v) => setPrefs({ ...prefs, email_receipts: v })} />
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div><Label className="font-bold">SMS Debit & Credit Alerts</Label></div>
                                <Switch checked={prefs.sms_alerts} onCheckedChange={(v) => setPrefs({ ...prefs, sms_alerts: v })} />
                            </div>
                            <div className="flex items-center justify-between border-b pb-4">
                                <div><Label className="font-bold">Webhook Failure Alerts</Label></div>
                                <Switch checked={prefs.webhook_failure_alerts} onCheckedChange={(v) => setPrefs({ ...prefs, webhook_failure_alerts: v })} />
                            </div>
                            <div className="flex items-center justify-between pb-2">
                                <div><Label className="font-bold">Esusu Rotation Turn Alerts</Label></div>
                                <Switch checked={prefs.rotation_turn_alerts} onCheckedChange={(v) => setPrefs({ ...prefs, rotation_turn_alerts: v })} />
                            </div>
                            <Button onClick={() => handleSave()} disabled={saving} className="rounded-xl font-bold">
                                <Save className="h-4 w-4 mr-2" /> Save Notification Rules
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
