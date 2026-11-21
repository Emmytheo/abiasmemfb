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
import { BankPageHeader } from "@/components/banking/page-header"

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
        <div className="space-y-6 pb-12 max-w-[1440px] mx-auto px-4 md:px-8 pt-6">
            <BankPageHeader
                badge="SME API Gateway & KYB Control"
                livePill={`${verifiedCount} Verified · ${avgRate.toFixed(0)}% Success`}
                liveTone="emerald"
                title="Merchant Accounts & Checkout Control"
                subtitle="Verify commercial businesses, audit live checkout settlement volume, revoke compromised keys, and monitor webhook deliveries."
                actions={
                    <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh
                    </Button>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Registered Merchants", val: String(merchants.length), sub: "SME gateway profiles", icon: Briefcase, tone: "bg-primary/10 text-primary" },
                    { label: "KYB Verified Active", val: String(verifiedCount), sub: "Live API key access", icon: CheckCircle, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Gross Settled Volume", val: `₦${(totalVolKobo / 100).toLocaleString()}`, sub: `${checkouts.length} checkout records`, icon: DollarSign, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Checkout Success Rate", val: `${avgRate.toFixed(1)}%`, sub: `${deliveries.length} webhook logs`, icon: Activity, tone: "bg-violet-500/10 text-violet-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.val}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
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
