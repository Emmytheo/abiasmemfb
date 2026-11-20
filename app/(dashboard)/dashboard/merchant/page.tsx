"use client"

import * as React from "react"
import {
    Briefcase,
    CheckCircle,
    Loader2,
    DollarSign,
    Globe,
    Code,
    Activity,
    FileText,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function MerchantAdminPage() {
    const [merchants, setMerchants] = React.useState<any[]>([])
    const [checkouts, setCheckouts] = React.useState<any[]>([])
    const [deliveries, setDeliveries] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/merchants")
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load merchant profiles")
                return
            }
            setMerchants(data.merchants || [])
            setCheckouts(data.checkouts || [])
            setDeliveries(data.webhookDeliveries || [])
        } catch {
            toast.error("Failed to fetch merchant ledger")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleVerifyToggle = async (m: any) => {
        setBusyId(`m-${m.id}`)
        try {
            const nextState = !m.is_verified
            const res = await fetch("/api/admin/merchants", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: m.id, is_verified: nextState, revoke_keys: !nextState }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to update merchant status")
                return
            }
            toast.success(
                nextState
                    ? `Verified & activated "${m.business_name}".`
                    : `Suspended "${m.business_name}" and revoked active API keys.`
            )
            await loadData()
        } finally {
            setBusyId(null)
        }
    }

    const verifiedCount = merchants.filter((m) => m.is_verified).length
    const totalVolKobo = merchants.reduce((s, m) => s + Number(m.volume_kobo || 0), 0)
    const avgRate =
        merchants.length > 0
            ? merchants.reduce((s, m) => s + Number(m.success_rate || 0), 0) / merchants.length
            : 100

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading SME Merchant Gateway...
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <Badge className="bg-primary/15 text-primary border-primary/30 uppercase text-[10px] font-black tracking-widest mb-2">
                        SME API Gateway · Live KYB
                    </Badge>
                    <h1 className="text-3xl font-black tracking-tight">Merchant Accounts & Checkout Control</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Verify commercial businesses, audit live checkout settlement volume, revoke compromised keys, and monitor webhook deliveries.
                    </p>
                </div>
                <Button variant="outline" onClick={loadData} className="rounded-xl font-bold gap-1.5">
                    <RefreshCw className="h-4 w-4" /> Refresh
                </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-card p-5 rounded-2xl border">
                    <Briefcase className="h-5 w-5 text-primary mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Registered Merchants</p>
                    <p className="text-3xl font-black mt-1">{merchants.length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <CheckCircle className="h-5 w-5 text-emerald-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">KYB Verified Active</p>
                    <p className="text-3xl font-black mt-1">{verifiedCount}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <DollarSign className="h-5 w-5 text-blue-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Gross Settled Volume</p>
                    <p className="text-3xl font-black mt-1">₦{(totalVolKobo / 100).toLocaleString()}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <Activity className="h-5 w-5 text-purple-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Checkout Success Rate</p>
                    <p className="text-3xl font-black mt-1">{avgRate.toFixed(1)}%</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black">SME Business Directory</h2>
                    {merchants.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No merchant profiles registered yet.</p>
                    ) : (
                        <div className="space-y-4">
                            {merchants.map((m) => (
                                <div key={m.id} className="border rounded-2xl p-4 space-y-3 bg-muted/20">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-sm">{m.business_name}</h3>
                                                <Badge variant={m.is_verified ? "default" : "secondary"} className="text-[9px] uppercase">
                                                    {m.is_verified ? "Verified" : "Pending KYB"}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                {m.owner_name} ({m.owner_email || "—"}) · Settled: ₦{(Number(m.volume_kobo || 0) / 100).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            variant={m.is_verified ? "outline" : "default"}
                                            disabled={busyId !== null}
                                            onClick={() => handleVerifyToggle(m)}
                                            className={m.is_verified ? "text-destructive border-destructive/30 font-bold" : "font-bold"}
                                        >
                                            {m.is_verified ? "Suspend & Revoke Keys" : "Approve & Verify"}
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] bg-background rounded-xl p-3 border">
                                        <div>
                                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Settlement Account</span>
                                            <span className="font-mono font-bold">{m.settlement_account_number || "Unassigned"}</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">API Key Prefix</span>
                                            <span className="font-mono flex items-center gap-1"><Code className="h-3 w-3" /> {m.api_prefix || "None"} ({m.active_keys_count || 0})</span>
                                        </div>
                                        <div>
                                            <span className="text-muted-foreground block text-[9px] uppercase font-bold">Webhook URL</span>
                                            <span className="truncate flex items-center gap-1"><Globe className="h-3 w-3 text-emerald-500" /> {m.webhook_url || "Not set"}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border rounded-2xl p-6 space-y-4">
                        <h2 className="text-md font-black flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Checkout Ledger ({checkouts.length})
                        </h2>
                        {checkouts.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No checkouts recorded.</p>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {checkouts.map((c) => (
                                    <div key={c.id} className="p-3 rounded-xl border bg-muted/20 flex justify-between items-center text-xs">
                                        <div className="min-w-0">
                                            <p className="font-bold truncate">{c.business_name || "Merchant"}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{c.customer_email}</p>
                                            <p className="text-[9px] font-mono text-muted-foreground">{c.reference}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-black">₦{(Number(c.amount || 0) / 100).toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[9px] uppercase">{c.status}</Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card border rounded-2xl p-6 space-y-3">
                        <h2 className="text-md font-black">Recent Webhook Deliveries ({deliveries.length})</h2>
                        {deliveries.length === 0 ? (
                            <p className="text-xs text-muted-foreground">No webhook dispatches logged yet.</p>
                        ) : (
                            <div className="space-y-2 max-h-60 overflow-y-auto text-xs">
                                {deliveries.map((d) => (
                                    <div key={d.id} className="p-2.5 rounded-lg border flex justify-between items-center">
                                        <div className="min-w-0">
                                            <p className="font-mono font-bold truncate">{d.event}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{d.target_url}</p>
                                        </div>
                                        <Badge variant={d.success ? "default" : "destructive"} className="text-[9px]">
                                            {d.http_status || (d.success ? "OK" : "ERR")}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
