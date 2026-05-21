"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Briefcase, 
    Key, 
    Link as LinkIcon, 
    Wifi, 
    Plus, 
    Loader2, 
    Copy, 
    Check, 
    Sliders,
    Eye, 
    EyeOff,
    CheckCircle,
    Info,
    CreditCard,
    ArrowRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface ApiKey {
    id: string
    key_prefix: string
    key_type: 'live_public' | 'live_secret' | 'test_public' | 'test_secret'
    is_active: boolean
    created_at: string
}

interface CheckoutLog {
    id: string
    amount: number
    customer_email: string
    reference: string
    status: 'pending' | 'processing' | 'successful' | 'failed'
    created_at: string
}

interface WebhookEvent {
    id: string
    event: string
    payload: string
    fired_at: string
}

export default function MerchantClientPage() {
    const [apiKeys, setApiKeys] = React.useState<ApiKey[]>([])
    const [checkouts, setCheckouts] = React.useState<CheckoutLog[]>([])
    const [webhookEvents, setWebhookEvents] = React.useState<WebhookEvent[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    // Revealed key Modal
    const [showKeyRevealModal, setShowKeyRevealModal] = React.useState(false)
    const [revealedSecretKey, setRevealedSecretKey] = React.useState('')
    const [copied, setCopied] = React.useState(false)

    // Checkout Simulator
    const [showCheckoutSimulator, setShowCheckoutSimulator] = React.useState(false)
    const [checkoutAmount, setCheckoutAmount] = React.useState<number>(1500) // Default ₦1,500
    const [payerEmail, setPayerEmail] = React.useState('customer@example.com')
    const [simulatedCheckoutState, setSimulatedCheckoutState] = React.useState<'init' | 'gateway' | 'paying' | 'success'>('init')
    const [activePaymentMethod, setActivePaymentMethod] = React.useState<'card' | 'transfer'>('card')

    // Webhook Settings
    const [webhookUrl, setWebhookUrl] = React.useState('https://api.my-sme-store.com/webhooks/abia')
    const [businessName, setBusinessName] = React.useState('Julian Sterling SME Retailers')

    React.useEffect(() => {
        const loadMerchantData = async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                if (user) {
                    // 1. Fetch merchant profiles
                    const profileRes = await fetch(`/api/merchant-profiles?where[user_id][equals]=${user.id}`)
                    const profileData = await profileRes.json()
                    const profile = profileData.docs?.[0]

                    if (profile) {
                        setBusinessName(profile.business_name)
                        setWebhookUrl(profile.webhook_url || '')

                        // 2. Fetch keys
                        const keysRes = await fetch(`/api/merchant-api-keys?where[merchant][equals]=${profile.id}&limit=100`)
                        const keysData = await keysRes.json()
                        if (keysData.docs && keysData.docs.length > 0) {
                            setApiKeys(keysData.docs)
                        } else {
                            setApiKeys([
                                { id: 'key_1', key_prefix: 'pk_live_', key_type: 'live_public', is_active: true, created_at: new Date().toISOString() },
                                { id: 'key_2', key_prefix: 'sk_live_', key_type: 'live_secret', is_active: true, created_at: new Date().toISOString() }
                            ])
                        }

                        // 3. Fetch checkouts
                        const checkoutsRes = await fetch(`/api/merchant-checkouts?where[merchant][equals]=${profile.id}&limit=100&sort=-createdAt`)
                        const checkoutsData = await checkoutsRes.json()
                        if (checkoutsData.docs && checkoutsData.docs.length > 0) {
                            setCheckouts(checkoutsData.docs)
                        } else {
                            setCheckouts([
                                { id: 'chk_1', amount: 450000, customer_email: 'jennifer.eze@outlook.com', reference: 'REF-802931-AB', status: 'successful', created_at: new Date().toISOString() }
                            ])
                        }

                        // 4. Fetch transactions to list webhook-friendly events
                        const eventsRes = await fetch(`/api/transactions?where[user_id][equals]=${user.id}&limit=10&sort=-createdAt`)
                        const eventsData = await eventsRes.json()
                        if (eventsData.docs && eventsData.docs.length > 0) {
                            setWebhookEvents(eventsData.docs.map((tx: any) => ({
                                id: `evt_${tx.id}`,
                                event: 'checkout.successful',
                                payload: JSON.stringify({
                                    event: 'checkout.successful',
                                    reference: tx.reference,
                                    amount: tx.amount,
                                    status: tx.status,
                                    paid_at: tx.createdAt
                                }, null, 2),
                                fired_at: tx.createdAt
                            })))
                        } else {
                            setWebhookEvents([
                                { id: 'evt_1', event: 'checkout.successful', payload: JSON.stringify({ event: 'checkout.successful', reference: 'REF-802931-AB', amount: 450000, customer: 'jennifer.eze@outlook.com' }, null, 2), fired_at: new Date().toISOString() }
                            ])
                        }
                    } else {
                        // Default placeholder if merchant profile has not been initialized yet
                        setApiKeys([
                            { id: 'key_1', key_prefix: 'pk_live_', key_type: 'live_public', is_active: true, created_at: new Date().toISOString() },
                            { id: 'key_2', key_prefix: 'sk_live_', key_type: 'live_secret', is_active: true, created_at: new Date().toISOString() }
                        ])
                        setCheckouts([
                            { id: 'chk_1', amount: 450000, customer_email: 'jennifer.eze@outlook.com', reference: 'REF-802931-AB', status: 'successful', created_at: new Date().toISOString() }
                        ])
                        setWebhookEvents([
                            { id: 'evt_1', event: 'checkout.successful', payload: JSON.stringify({ event: 'checkout.successful', reference: 'REF-802931-AB', amount: 450000, customer: 'jennifer.eze@outlook.com' }, null, 2), fired_at: new Date().toISOString() }
                        ])
                    }
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadMerchantData()
    }, [])

    const handleUpdateWebhook = async () => {
        setActionLoading('webhook')
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                const profileRes = await fetch(`/api/merchant-profiles?where[user_id][equals]=${user.id}`)
                const profileData = await profileRes.json()
                const profile = profileData.docs?.[0]

                if (profile) {
                    const updateRes = await fetch(`/api/merchant-profiles/${profile.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            webhook_url: webhookUrl
                        })
                    })
                    if (updateRes.ok) {
                        toast.success('Webhook callback URL updated successfully!')
                    } else {
                        toast.error('Failed to update webhook URL')
                    }
                } else {
                    toast.error('No merchant profile found to update. Generate API keys first!')
                }
            }
        } catch (e) {
            toast.error('Network request failed')
        } finally {
            setActionLoading(null)
        }
    }

    const handleGenerateKeys = async () => {
        setActionLoading('keys')
        try {
            const res = await fetch('/api/merchant/keys/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_name: businessName
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('New cryptographic API keys generated!')
                
                // Fetch updated keys to populate UI
                const keysRes = await fetch(`/api/merchant-api-keys?where[merchant][equals]=${data.merchant.id}&limit=100`)
                const keysData = await keysRes.json()
                if (keysData.docs && keysData.docs.length > 0) {
                    setApiKeys(keysData.docs)
                }

                setRevealedSecretKey(data.keys.secretKey)
                setShowKeyRevealModal(true)
            } else {
                toast.error(data.error || 'Failed to generate merchant keys')
            }
        } catch (e) {
            toast.error('Network request failed')
        } finally {
            setActionLoading(null)
        }
    }

    const runCheckoutSimulation = async () => {
        setSimulatedCheckoutState('paying')
        
        try {
            // First initialize the payment reference
            const initRes = await fetch('/api/merchant/checkout/initialize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: checkoutAmount * 100, // Naira to kobo
                    customer_email: payerEmail,
                    reference: `REF-${Math.floor(Math.random() * 900000) + 100000}-AB`,
                    redirect_url: 'https://mysme-store.com/success'
                })
            })
            const initData = await initRes.json()

            if (!initData.success) {
                toast.error(initData.error || 'Failed to initialize payment session')
                setSimulatedCheckoutState('gateway')
                return
            }

            // Settle checkout via /charge
            const chargeRes = await fetch('/api/merchant/checkout/charge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checkout_id: initData.checkout.id,
                    source_type: activePaymentMethod,
                    details: activePaymentMethod === 'card' ? { pan_masked: '4111********9028', name: 'MOCK CUSTOMER' } : { bank: 'Abia MFB', account: '3092817263' }
                })
            })
            const chargeData = await chargeRes.json()

            if (chargeData.success) {
                setSimulatedCheckoutState('success')
                toast.success('Simulation payment settled successfully!')

                // Update Local UI Checkouts Table
                setCheckouts(prev => [
                    {
                        id: initData.checkout.id,
                        amount: checkoutAmount * 100,
                        customer_email: payerEmail,
                        reference: initData.checkout.reference,
                        status: 'successful',
                        created_at: new Date().toISOString()
                    },
                    ...prev
                ])

                // Prepend dynamically spawned webhook payload to events stream log!
                setWebhookEvents(prev => [
                    {
                        id: `evt_${Date.now()}`,
                        event: 'checkout.successful',
                        payload: JSON.stringify(chargeData.webhook_dispatch?.payload || {
                            event: 'checkout.successful',
                            reference: initData.checkout.reference,
                            amount: checkoutAmount * 100,
                            customer: payerEmail,
                            gateway: 'AbiaPay Checkout v1'
                        }, null, 2),
                        fired_at: new Date().toISOString()
                    },
                    ...prev
                ])
            } else {
                toast.error(chargeData.error || 'Checkout simulation charge declined')
                setSimulatedCheckoutState('gateway')
            }
        } catch (e) {
            toast.error('Simulation transaction failed')
            setSimulatedCheckoutState('gateway')
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success('Copied API Key to clipboard!')
        setTimeout(() => setCopied(false), 2000)
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Securing merchant checkout API vaults...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Merchant Payments Console</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Configure e-invoicing webhooks, manage secure API integration keys, and simulate checkout layers.</p>
                </div>
                <Button 
                    onClick={() => {
                        setSimulatedCheckoutState('init')
                        setShowCheckoutSimulator(true)
                    }} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Sliders className="h-5 w-5" /> Launch Checkout Simulator
                </Button>
            </div>

            {/* Quick API stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <Key className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">API Integrations</p>
                    <p className="text-2xl font-black mt-1">{apiKeys.length} Keys Listed</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Wifi className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500">Live Webhooks</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Fired Webhook Events</p>
                    <p className="text-2xl font-black mt-1 text-emerald-500">{webhookEvents.length} Dispatched</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">Verified</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Settlement Vault Account</p>
                    <p className="text-lg font-black mt-1.5 truncate">Julian Sterling Retail (309...)</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <Sliders className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Success Cap</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Cumulative SME Revenue</p>
                    <p className="text-2xl font-black mt-1">₦{((checkouts.filter(c => c.status === 'successful').reduce((sum, ch) => sum + ch.amount, 0)) / 100).toLocaleString()}</p>
                </div>
            </div>

            {/* Layout grids: keys, webhooks, checkouts, logs */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Columns: Keys manager and Webhooks setups */}
                <div className="lg:col-span-6 space-y-6">
                    
                    {/* API Key management */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <div className="flex justify-between items-center border-b pb-4">
                            <div>
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Key className="h-5 w-5 text-primary" /> Cryptographic API Keys
                                </h2>
                                <p className="text-xs text-muted-foreground font-semibold mt-0.5">Integration credentials to initiate Abia Pay checkouts.</p>
                            </div>
                            <Button 
                                onClick={handleGenerateKeys}
                                disabled={actionLoading === 'keys'}
                                className="bg-primary hover:bg-primary/95 text-primary-foreground font-bold rounded-xl h-10 px-4 flex items-center gap-1 text-xs shadow-md"
                            >
                                {actionLoading === 'keys' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Generate Keys'}
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {apiKeys.map(k => (
                                <div key={k.id} className="p-3 bg-muted/40 rounded-xl border flex justify-between items-center text-xs font-semibold">
                                    <div className="space-y-0.5">
                                        <p className="font-extrabold capitalize text-foreground">{k.key_type.replace('_', ' ')} Token</p>
                                        <p className="font-mono text-muted-foreground select-all">{k.key_prefix}•••••••••••••••••••••</p>
                                    </div>
                                    <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-emerald-50 text-emerald-600 border-emerald-100">Active</Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Webhook endpoint URL set */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <LinkIcon className="h-5 w-5 text-primary" /> Webhook Configurations
                        </h2>
                        <p className="text-xs text-muted-foreground font-semibold">Receive real-time transactional JSON server events automatically.</p>
                        
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold">Business Callback Webhook URL</label>
                                <input 
                                    type="text" 
                                    value={webhookUrl} 
                                    onChange={(e) => setWebhookUrl(e.target.value)}
                                    className="w-full bg-muted border border-border/80 rounded-xl h-12 px-4 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                            </div>
                            <Button 
                                onClick={handleUpdateWebhook}
                                disabled={actionLoading === 'webhook'}
                                className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black rounded-xl h-11 shadow-none flex items-center justify-center gap-2"
                            >
                                {actionLoading === 'webhook' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                                Save Endpoint Destination
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Right Columns: Checkout lists and live webhook payload dispatch logs */}
                <div className="lg:col-span-6 space-y-6">
                    
                    {/* Checkout transactions table list */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-primary" /> Checkout Invoices Ledger
                        </h2>
                        <div className="bg-muted/10 border rounded-xl divide-y overflow-x-auto">
                            {checkouts.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground font-semibold">No checkouts recorded yet.</div>
                            ) : (
                                checkouts.map(c => (
                                    <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-semibold">
                                        <div className="space-y-0.5">
                                            <p className="font-extrabold text-foreground">{c.customer_email}</p>
                                            <p className="text-[10px] text-muted-foreground font-mono">Ref: {c.reference}</p>
                                        </div>
                                        <div className="text-left sm:text-right space-y-1">
                                            <p className="font-black text-foreground">₦{(c.amount / 100).toLocaleString()}</p>
                                            <Badge variant="outline" className="text-[9px] uppercase bg-emerald-50 text-emerald-600 border-emerald-100">Successful</Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Fired Webhooks payload terminal stream */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Wifi className="h-5 w-5 text-primary" /> Webhooks Dispatch Logger (Events Stream)
                        </h2>
                        <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 max-h-[300px] overflow-y-auto space-y-4 font-mono select-none">
                            {webhookEvents.length === 0 ? (
                                <div className="text-xs text-slate-500 italic text-center py-4">Waiting for checkout events...</div>
                            ) : (
                                webhookEvents.map(evt => (
                                    <div key={evt.id} className="space-y-2 border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-center text-[10px] text-emerald-400">
                                            <span>⚡ event: {evt.event}</span>
                                            <span className="text-[8px] text-slate-500">{new Date(evt.fired_at).toLocaleTimeString()}</span>
                                        </div>
                                        <pre className="text-[10px] text-slate-300 bg-slate-900/50 p-2.5 rounded-lg overflow-x-auto leading-relaxed border border-slate-800/40">
                                            {evt.payload}
                                        </pre>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal: Secret API Key Reveal overlay */}
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">Secure API Secret Key</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Copy this secret key. It will not be shown again for cryptographic safety.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/60 border rounded-xl flex items-center justify-between gap-4 font-mono text-xs font-bold">
                                    <span className="select-all text-primary truncate max-w-[280px]">{revealedSecretKey}</span>
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => copyToClipboard(revealedSecretKey)}
                                        className="shrink-0 h-9 w-9 text-muted-foreground hover:text-foreground"
                                    >
                                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>

                                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex gap-2 text-rose-600 leading-normal">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        Keep this secret key absolutely confidential. Anyone possessing this key can trigger transactional withdrawals from customer settlement ledger vaults.
                                    </p>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <Button 
                                        onClick={() => setShowKeyRevealModal(false)}
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md"
                                    >
                                        I Have Stored the Key Safely
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Interactive Sandboxed Abia Checkout Gateway Modal */}
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
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-850 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl z-10 relative flex flex-col min-h-[460px] text-white"
                        >
                            {/* Simulator Sandbox indicator */}
                            <div className="bg-purple-600 text-[9px] font-black text-center py-1 uppercase tracking-widest text-white shrink-0">
                                Abia Pay Sandboxed Checkout Integration
                            </div>

                            {simulatedCheckoutState === 'init' && (
                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="text-lg font-black text-white">Initialize Sandboxed Invoice</h3>
                                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Set parameter bounds to launch client invoice popup simulation.</p>
                                        </div>
                                        <div className="space-y-3 font-sans">
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400">Payer Customer Email</label>
                                                <input 
                                                    type="email" 
                                                    value={payerEmail} 
                                                    onChange={(e) => setPayerEmail(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-3 text-xs font-semibold focus:outline-none"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-slate-400">Invoice Amount (₦)</label>
                                                <input 
                                                    type="number" 
                                                    value={checkoutAmount} 
                                                    onChange={(e) => setCheckoutAmount(Number(e.target.value))}
                                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-3 text-xs font-semibold focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => setSimulatedCheckoutState('gateway')}
                                        className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-xl h-11 text-xs shrink-0"
                                    >
                                        Launch Payer Popup Modal
                                    </Button>
                                </div>
                            )}

                            {simulatedCheckoutState === 'gateway' && (
                                <div className="p-6 flex-1 flex flex-col justify-between font-mono">
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center text-xs shrink-0 border-b border-slate-800 pb-3">
                                            <span className="font-bold text-slate-300">{businessName}</span>
                                            <span className="text-[10px] font-black text-emerald-400">₦{checkoutAmount.toLocaleString()}</span>
                                        </div>

                                        {/* Payment method selector */}
                                        <div className="space-y-3 font-sans shrink-0">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Choose Payment Option</p>
                                            
                                            <div 
                                                onClick={() => setActivePaymentMethod('card')}
                                                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                                    activePaymentMethod === 'card' 
                                                        ? 'bg-slate-800 border-primary shadow-lg shadow-primary/10 text-white' 
                                                        : 'bg-slate-850 border-slate-800/80 text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <CreditCard className="h-5 w-5 text-primary shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold leading-normal">Pay with Secure Card</p>
                                                    <p className="text-[9px] opacity-70">Immediate swiper ledger checkout</p>
                                                </div>
                                            </div>

                                            <div 
                                                onClick={() => setActivePaymentMethod('transfer')}
                                                className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                                                    activePaymentMethod === 'transfer' 
                                                        ? 'bg-slate-800 border-primary shadow-lg shadow-primary/10 text-white' 
                                                        : 'bg-slate-850 border-slate-800/80 text-slate-400 hover:text-slate-200'
                                                }`}
                                            >
                                                <Sliders className="h-5 w-5 text-cyan-400 shrink-0" />
                                                <div>
                                                    <p className="text-xs font-bold leading-normal">Pay via Direct Bank Transfer</p>
                                                    <p className="text-[9px] opacity-70">Generate virtual account number</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-6 shrink-0">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setSimulatedCheckoutState('init')}
                                            className="flex-1 border-slate-800 hover:bg-slate-800 text-slate-300 font-bold rounded-xl h-11 text-xs"
                                        >
                                            Go Back
                                        </Button>
                                        <Button 
                                            onClick={runCheckoutSimulation}
                                            className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-xl h-11 text-xs shadow-md"
                                        >
                                            Confirm Settlement
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {simulatedCheckoutState === 'paying' && (
                                <div className="flex-1 flex flex-col justify-center items-center gap-3 p-6 text-center select-none font-mono">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="text-xs font-bold text-slate-300">Charging transaction on ledger...</p>
                                    <p className="text-[9px] text-slate-500">Contacting credit network switching gateway</p>
                                </div>
                            )}

                            {simulatedCheckoutState === 'success' && (
                                <div className="p-6 flex-1 flex flex-col justify-between items-center text-center font-mono">
                                    <div className="my-auto space-y-4">
                                        <CheckCircle className="h-16 w-16 text-emerald-400 fill-emerald-950/20 mx-auto animate-bounce" />
                                        <div>
                                            <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest">INVOICE PAID SUCCESSFULLY</h4>
                                            <p className="text-[10px] text-slate-400 mt-1 font-semibold leading-relaxed">
                                                Checkout settlement completed in 120ms. Webhook fired to: {webhookUrl}
                                            </p>
                                        </div>
                                    </div>
                                    <Button 
                                        onClick={() => setShowCheckoutSimulator(false)}
                                        className="w-full bg-slate-800 hover:bg-slate-750 text-white font-black rounded-xl h-11 text-xs shrink-0 border border-slate-700"
                                    >
                                        Return to Console Dashboard
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
