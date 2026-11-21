"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Briefcase,
    Key,
    Link as LinkIcon,
    Wifi,
    Loader2,
    Copy,
    Check,
    Sliders,
    CheckCircle,
    Info,
    CreditCard,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { BankPageHeader } from "@/components/banking/page-header"

interface ApiKey {
    id: string
    key_prefix: string
    key_type: "live_public" | "live_secret" | "test_public" | "test_secret"
    is_active: boolean
    created_at: string
}

interface CheckoutLog {
    id: string
    amount: number
    customer_email: string
    reference: string
    status: "pending" | "processing" | "successful" | "failed"
    created_at: string
}

interface WebhookDelivery {
    id: number
    event: string
    target_url: string
    payload: any
    http_status: number | null
    success: boolean
    attempts: number
    created_at: string
}

export default function MerchantClientPage() {
    const { activeScope, setScopeId } = useScope()
    const { activeProfile } = useBankProfile()

    const [profile, setProfile] = React.useState<any>(null)
    const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([])
    const [checkouts, setCheckouts] = React.useState<CheckoutLog[]>([])
    const [webhookDeliveries, setWebhookDeliveries] = React.useState<WebhookDelivery[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    const [showKeyRevealModal, setShowKeyRevealModal] = React.useState(false)
    const [revealedSecretKey, setRevealedSecretKey] = React.useState("")
    const [copied, setCopied] = React.useState(false)

    // Checkout Simulator
    const [showCheckoutSimulator, setShowCheckoutSimulator] = React.useState(false)
    const [checkoutAmount, setCheckoutAmount] = React.useState<number>(1500)
    const [payerEmail, setPayerEmail] = React.useState("")
    const [simulatedCheckoutState, setSimulatedCheckoutState] = React.useState<"init" | "gateway" | "paying" | "success">("init")
    const [activePaymentMethod, setActivePaymentMethod] = React.useState<"card" | "transfer">("card")

    // Profile fields
    const [webhookUrl, setWebhookUrl] = React.useState("")
    const [businessName, setBusinessName] = React.useState("")

    const loadMerchantData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/merchant", { cache: "no-store" })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to load merchant profile")

            setProfile(json.profile)
            if (json.profile) {
                setBusinessName(json.profile.business_name || "")
                setWebhookUrl(json.profile.webhook_url || "")
            }
            setApiKeys(json.apiKeys || [])
            setCheckouts(json.checkouts || [])
            setWebhookDeliveries(json.webhookDeliveries || [])
        } catch (e: any) {
            toast.error(e.message || "Could not load merchant workspace")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadMerchantData()
    }, [loadMerchantData])

    const handleUpdateWebhook = async () => {
        setActionLoading("webhook")
        try {
            const res = await fetch("/api/client/merchant", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ webhook_url: webhookUrl.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to update webhook URL")
            toast.success("Webhook callback URL saved and audited.")
            await loadMerchantData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setActionLoading(null)
        }
    }

    const handleGenerateKeys = async () => {
        if (!businessName.trim() && !profile) {
            toast.error("Enter your Business Name first to initialize your merchant profile.")
            return
        }
        setActionLoading("keys")
        try {
            const res = await fetch("/api/merchant/keys/generate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ business_name: businessName.trim() || profile?.business_name }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to generate API keys")

            toast.success("New cryptographic API keys generated!")
            setRevealedSecretKey(data.keys.secretKey)
            setShowKeyRevealModal(true)
            await loadMerchantData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setActionLoading(null)
        }
    }

    const runCheckoutSimulation = async () => {
        if (!payerEmail.trim() || checkoutAmount <= 0) {
            toast.error("Enter valid payer email and amount")
            return
        }
        setSimulatedCheckoutState("paying")
        try {
            const initRes = await fetch("/api/merchant/checkout/initialize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: Math.round(checkoutAmount * 100),
                    customer_email: payerEmail.trim(),
                    reference: `REF-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`,
                }),
            })
            const initData = await initRes.json()
            if (!initRes.ok || !initData.success) {
                throw new Error(initData.error || "Failed to initialize checkout session")
            }

            const chargeRes = await fetch("/api/merchant/checkout/charge", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    checkout_id: initData.checkout.id,
                    source_type: activePaymentMethod,
                }),
            })
            const chargeData = await chargeRes.json()
            if (!chargeRes.ok || !chargeData.success) {
                throw new Error(chargeData.error || "Checkout charge declined")
            }

            setSimulatedCheckoutState("success")
            toast.success("Checkout settled atomically into your settlement vault!")
            await loadMerchantData()
        } catch (e: any) {
            toast.error(e.message || "Checkout transaction failed")
            setSimulatedCheckoutState("gateway")
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success("Copied API Key to clipboard!")
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Loading merchant payment gateway...</p>
            </div>
        )
    }

    if (activeScope.type !== "business") {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl shadow-xl space-y-6">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Briefcase className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Business Scope Required</h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        The Merchant Payments Suite is exclusive to registered business ledgers. Switch to Business scope to manage API keys, webhooks, and checkouts.
                    </p>
                </div>
                <Button onClick={() => setScopeId("business")} className="w-full bg-primary font-black text-primary-foreground rounded-xl h-12">
                    Switch to Business Scope
                </Button>
            </div>
        )
    }

    const settledRevenueKobo = checkouts
        .filter((c) => c.status === "successful")
        .reduce((sum, ch) => sum + Number(ch.amount || 0), 0)

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Developer Payment Gateway`}
                livePill={profile?.is_verified ? "KYB Verified Active" : profile ? "Pending KYB" : "Setup Required"}
                liveTone={profile?.is_verified ? "emerald" : "amber"}
                title="Merchant Payments Console"
                subtitle={`Manage cryptographic API keys, signed webhook endpoints, and live ${activeProfile.internalPayBrand} checkout settlements.`}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadMerchantData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </Button>
                        <Button
                            size="sm"
                            disabled={!profile}
                            onClick={() => {
                                setSimulatedCheckoutState("init")
                                setShowCheckoutSimulator(true)
                            }}
                            className="h-9 rounded-xl font-black text-xs gap-1.5"
                        >
                            <Sliders className="h-3.5 w-3.5" /> Test Live Checkout
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Key className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">
                            {profile?.is_verified ? "Verified" : profile ? "Pending KYC" : "Not Setup"}
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">API Keys</p>
                    <p className="text-2xl font-black mt-1">{apiKeys.filter((k) => k.is_active).length} Active</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Wifi className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Webhook Deliveries</p>
                    <p className="text-2xl font-black mt-1 text-emerald-500">{webhookDeliveries.length} Logged</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                            <Briefcase className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Settlement Account</p>
                    <p className="text-base font-black mt-1.5 truncate font-mono">
                        {profile?.settlement_account_number || "Not initialized"}
                    </p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Sliders className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Settled Revenue</p>
                    <p className="text-2xl font-black mt-1">₦{(settledRevenueKobo / 100).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left: Keys & Webhook */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 gap-3">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Key className="h-5 w-5 text-primary" /> Cryptographic API Keys
                                </h2>
                                <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                                    Credentials for {activeProfile.internalPayBrand} server-to-server checkouts.
                                </p>
                            </div>
                            <Button
                                onClick={handleGenerateKeys}
                                disabled={actionLoading === "keys"}
                                className="bg-primary text-primary-foreground font-bold rounded-xl h-10 px-4 text-xs"
                            >
                                {actionLoading === "keys" ? <Loader2 className="h-4 w-4 animate-spin" /> : profile ? "Rotate Keys" : "Initialize & Generate"}
                            </Button>
                        </div>

                        {!profile && (
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold">Registered Business Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Acme Distributors Ltd"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    className="w-full bg-muted border border-border/80 rounded-xl h-11 px-4 text-xs font-semibold"
                                />
                            </div>
                        )}

                        <div className="space-y-3">
                            {apiKeys.length === 0 ? (
                                <p className="text-xs text-muted-foreground py-2">
                                    No API keys issued yet. Enter your business name and click Initialize &amp; Generate.
                                </p>
                            ) : (
                                apiKeys.map((k) => (
                                    <div key={k.id} className="p-3 bg-muted/40 rounded-xl border flex justify-between items-center text-xs font-semibold">
                                        <div className="space-y-0.5">
                                            <p className="font-extrabold capitalize text-foreground">{k.key_type.replace("_", " ")}</p>
                                            <p className="font-mono text-muted-foreground">{k.key_prefix}••••••••••••••••••••</p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[9px] uppercase ${
                                                k.is_active
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {k.is_active ? "Active" : "Revoked"}
                                        </Badge>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-primary" /> Signed Webhook Endpoint
                        </h2>
                        <p className="text-xs text-muted-foreground font-semibold">
                            Every delivery is signed with HMAC-SHA256 (`x-banksuite-signature`) and logged below.
                        </p>
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold">HTTPS Callback URL</label>
                                <input
                                    type="url"
                                    placeholder="https://api.yourbusiness.com/webhooks/payments"
                                    value={webhookUrl}
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="w-full bg-muted border border-border/80 rounded-xl h-12 px-4 text-xs font-semibold"
                                />
                            </div>
                            <Button
                                onClick={handleUpdateWebhook}
                                disabled={actionLoading === "webhook" || !profile}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black rounded-xl h-11 shadow-none"
                            >
                                {actionLoading === "webhook" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Webhook Endpoint"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right: Checkouts & Real Webhook Delivery Logs */}
                <div className="lg:col-span-6 space-y-6">
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" /> Checkout Ledger ({checkouts.length})
                        </h2>
                        <div className="bg-muted/10 border rounded-xl divide-y max-h-[320px] overflow-y-auto">
                            {checkouts.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground font-semibold">
                                    No checkout sessions recorded yet.
                                </div>
                            ) : (
                                checkouts.map((c) => (
                                    <div key={c.id} className="p-4 flex justify-between items-center gap-4 text-xs font-semibold">
                                        <div className="space-y-0.5 min-w-0">
                                            <p className="font-extrabold text-foreground truncate">{c.customer_email}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">{c.reference}</p>
                                        </div>
                                        <div className="text-right space-y-1 shrink-0">
                                            <p className="font-black text-foreground">₦{(Number(c.amount || 0) / 100).toLocaleString()}</p>
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] uppercase ${
                                                    c.status === "successful"
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : c.status === "failed"
                                                        ? "bg-rose-50 text-rose-600 border-rose-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                }`}
                                            >
                                                {c.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-primary" /> Webhook Delivery Audit Log
                        </h2>
                        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 max-h-[300px] overflow-y-auto space-y-4 font-mono">
                            {webhookDeliveries.length === 0 ? (
                                <div className="text-xs text-slate-500 italic text-center py-6">
                                    No webhook deliveries dispatched yet. Set a webhook URL and settle a checkout to see signed deliveries.
                                </div>
                            ) : (
                                webhookDeliveries.map((evt) => (
                                    <div key={evt.id} className="space-y-2 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center text-[10px]">
                                            <span className={evt.success ? "text-emerald-400" : "text-rose-400"}>
                                                {evt.event} · HTTP {evt.http_status || "ERR"} ({evt.attempts}x)
                                            </span>
                                            <span className="text-slate-500">{new Date(evt.created_at).toLocaleString()}</span>
                                        </div>
                                        <pre className="text-[10px] text-slate-300 bg-slate-900/50 p-2.5 rounded-lg overflow-x-auto leading-relaxed">
                                            {typeof evt.payload === "string" ? evt.payload : JSON.stringify(evt.payload, null, 2)}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Key Reveal Modal */}
            <AnimatePresence>
                {showKeyRevealModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowKeyRevealModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">One-Time Secret Key Reveal</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                                    Copy this secret key now. Only its SHA-256 hash is stored in the database.
                                </p>
                            </div>
                            <div className="p-4 bg-muted/60 border rounded-xl flex items-center justify-between gap-4 font-mono text-xs font-bold">
                                <span className="select-all text-primary truncate max-w-[280px]">{revealedSecretKey}</span>
                                <Button size="icon" variant="ghost" onClick={() => copyToClipboard(revealedSecretKey)}>
                                    {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2 text-rose-600">
                                <Info className="h-5 w-5 shrink-0" />
                                <p className="text-[10px] font-semibold">Store this secret key in your backend vault only. Never expose it in browser code.</p>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={() => setShowKeyRevealModal(false)} className="rounded-xl font-black">
                                    I Have Stored the Key Safely
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Checkout Test Modal */}
            <AnimatePresence>
                {showCheckoutSimulator && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowCheckoutSimulator(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-10 relative flex flex-col min-h-[440px] text-white"
                        >
                            <div className="bg-purple-600 text-[9px] font-black text-center py-1.5 uppercase tracking-widest">
                                {activeProfile.internalPayBrand} Live Ledger Checkout
                            </div>

                            {simulatedCheckoutState === "init" && (
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black">Initialize Checkout Session</h3>
                                            <p className="text-[10px] text-slate-400 mt-0.5">
                                                Debits your payer ledger account and credits your merchant settlement vault atomically.
                                            </p>
                                        </div>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400">Customer Email *</label>
                                                <input
                                                    type="email"
                                                    required
                                                    placeholder="payer@domain.com"
                                                    value={payerEmail}
                                                    onChange={(e) => setPayerEmail(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-3 text-xs font-semibold"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400">Amount (₦)</label>
                                                <input
                                                    type="number"
                                                    min="100"
                                                    value={checkoutAmount}
                                                    onChange={(e) => setCheckoutAmount(Number(e.target.value))}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-3 text-xs font-semibold"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button
                                        onClick={() => setSimulatedCheckoutState("gateway")}
                                        disabled={!payerEmail.trim() || checkoutAmount <= 0}
                                        className="w-full bg-primary font-black rounded-xl h-11 text-xs"
                                    >
                                        Continue to Payment
                                    </Button>
                                </div>
                            )}

                            {simulatedCheckoutState === "gateway" && (
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-5">
                                        <div className="flex justify-between items-center text-xs border-b border-slate-800 pb-3">
                                            <span className="font-bold text-slate-300">{businessName}</span>
                                            <span className="font-black text-emerald-400">₦{checkoutAmount.toLocaleString()}</span>
                                        </div>
                                        <div className="space-y-2.5">
                                            <button
                                                type="button"
                                                onClick={() => setActivePaymentMethod("card")}
                                                className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left ${
                                                    activePaymentMethod === "card" ? "bg-slate-800 border-primary" : "border-slate-800 text-slate-400"
                                                }`}
                                            >
                                                <CreditCard className="h-5 w-5 text-primary shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold">Pay with Linked Account / Card</p>
                                                    <p className="text-[9px] opacity-70">Instant core ledger debit &amp; settlement</p>
                                                </div>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActivePaymentMethod("transfer")}
                                                className={`w-full p-3.5 rounded-xl border flex items-center gap-3 text-left ${
                                                    activePaymentMethod === "transfer" ? "bg-slate-800 border-primary" : "border-slate-800 text-slate-400"
                                                }`}
                                            >
                                                <Sliders className="h-5 w-5 text-cyan-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold">Direct Account Transfer</p>
                                                    <p className="text-[9px] opacity-70">Intra-bank double-entry transfer</p>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <Button variant="outline" onClick={() => setSimulatedCheckoutState("init")} className="flex-1 border-slate-700 text-slate-300 rounded-xl h-11 text-xs">
                                            Back
                                        </Button>
                                        <Button onClick={runCheckoutSimulation} className="flex-1 bg-primary font-black rounded-xl h-11 text-xs">
                                            Pay Now
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {simulatedCheckoutState === "paying" && (
                                <div className="flex-1 flex flex-col justify-center items-center gap-3 p-6 text-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-xs font-bold text-slate-300">Settling on core ledger...</p>
                                </div>
                            )}

                            {simulatedCheckoutState === "success" && (
                                <div className="p-6 flex-1 flex flex-col justify-between items-center text-center">
                                    <div className="my-auto space-y-4">
                                        <CheckCircle className="h-14 w-14 text-emerald-400 mx-auto" />
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Checkout Settled</h4>
                                            <p className="text-[10px] text-slate-400 mt-1">
                                                Credited to settlement vault {profile?.settlement_account_number || ""}.
                                            </p>
                                        </div>
                                    </div>
                                    <Button onClick={() => setShowCheckoutSimulator(false)} className="w-full rounded-xl font-black">
                                        Done
                                    </Button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
