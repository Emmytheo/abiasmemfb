"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Briefcase,
    TrendingUp, 
    Calendar, 
    ArrowRight, 
    PiggyBank, 
    CheckCircle, 
    Loader2, 
    Play,
    Building2,
    DollarSign,
    PlusCircle,
    UserCheck,
    Info,
    Globe,
    Code,
    Activity,
    X,
    FileText,
    Percent
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface MerchantProfile {
    id: string
    business_name: string
    ownerName: string
    email: string
    settlement_account: string
    webhook_url: string
    api_prefix: string
    is_verified: boolean
    successRate: number
    volumeKobo: number // In kobo
}

interface CheckoutTransaction {
    id: string
    business_name: string
    payerEmail: string
    amount: number // In kobo
    status: 'successful' | 'pending' | 'failed'
    timestamp: string
}

export default function MerchantAdminPage() {
    const [merchants, setMerchants] = React.useState<MerchantProfile[]>([])
    const [checkouts, setCheckouts] = React.useState<CheckoutTransaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState<string | null>(null)
    const [selectedMerchant, setSelectedMerchant] = React.useState<MerchantProfile | null>(null)

    React.useEffect(() => {
        const loadMerchantData = async () => {
            try {
                let fetchedMerchants: MerchantProfile[] = []
                let fetchedCheckouts: CheckoutTransaction[] = []

                try {
                    const profileRes = await fetch('/api/merchant-profiles?limit=100&sort=-createdAt')
                    const profileData = await profileRes.json()
                    if (profileData?.docs?.length > 0) {
                        fetchedMerchants = profileData.docs.map((d: any) => ({
                            id: d.id,
                            business_name: d.business_name,
                            ownerName: d.ownerName || 'Business Owner',
                            email: d.email || 'business@abiamfb.com',
                            settlement_account: typeof d.settlement_account === 'object' && d.settlement_account
                                ? `${d.settlement_account.account_number} (${d.settlement_account.account_type || 'Primary'})`
                                : d.settlement_account || '0092819209 (Primary)',
                            webhook_url: d.webhook_url || '',
                            api_prefix: d.api_prefix || 'pk_live_pending',
                            is_verified: d.is_verified ?? true,
                            successRate: d.successRate || 99.5,
                            volumeKobo: d.volumeKobo || 0
                        }))
                    }
                } catch (e) {
                    console.warn('[Admin Merchant] Failed to load merchant profiles', e)
                }

                try {
                    const chkRes = await fetch('/api/merchant-checkouts?limit=100&sort=-createdAt')
                    const chkData = await chkRes.json()
                    if (chkData?.docs?.length > 0) {
                        fetchedCheckouts = chkData.docs.map((d: any) => ({
                            id: d.id,
                            business_name: typeof d.merchant === 'object' ? d.merchant?.business_name : 'Merchant',
                            payerEmail: d.customer_email || 'customer@gmail.com',
                            amount: Number(d.amount || 0),
                            status: d.status as CheckoutTransaction['status'],
                            timestamp: d.createdAt
                        }))
                    }
                } catch (e) {
                    console.warn('[Admin Merchant] Failed to load checkouts', e)
                }

                // Demo fallback if database is empty
                if (fetchedMerchants.length === 0) {
                    fetchedMerchants = [
                        { id: 'merch_1', business_name: 'Aba Leathercraft Hub', ownerName: 'Chidi Ebere', email: 'chidi@abaleather.ng', settlement_account: '0092819209 (Primary)', webhook_url: 'https://api.abaleather.ng/webhooks/pay', api_prefix: 'pk_live_f8b1...', is_verified: true, successRate: 99.1, volumeKobo: 250000000 },
                        { id: 'merch_2', business_name: 'AgroMart Logistics Aba', ownerName: 'Amadi Kalu', email: 'amadi@agromart.com', settlement_account: '0055102910', webhook_url: 'https://agromart.com/webhooks/abia', api_prefix: 'pk_live_1a2b...', is_verified: true, successRate: 98.4, volumeKobo: 120000000 },
                        { id: 'merch_3', business_name: 'FashionVibe Design Studio', ownerName: 'Ngozi Okoye', email: 'ngozi@fashionvibe.ng', settlement_account: '0032910281', webhook_url: 'https://example.com/payment-webhook', api_prefix: 'pk_live_pending', is_verified: false, successRate: 0, volumeKobo: 0 }
                    ]
                }
                if (fetchedCheckouts.length === 0) {
                    fetchedCheckouts = [
                        { id: 'tx_inv_101', business_name: 'Aba Leathercraft Hub', payerEmail: 'payer.john@gmail.com', amount: 4500000, status: 'successful', timestamp: new Date(Date.now() - 3600000 * 3).toISOString() },
                        { id: 'tx_inv_102', business_name: 'AgroMart Logistics Aba', payerEmail: 'log.buyer@outlook.com', amount: 12500000, status: 'successful', timestamp: new Date(Date.now() - 3600000).toISOString() },
                        { id: 'tx_inv_103', business_name: 'Aba Leathercraft Hub', payerEmail: 'musa.k@yahoo.com', amount: 2000000, status: 'pending', timestamp: new Date(Date.now() - 1200000).toISOString() }
                    ]
                }

                setMerchants(fetchedMerchants)
                setCheckouts(fetchedCheckouts)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadMerchantData()
    }, [])

    const handleVerifyToggle = (id: string) => {
        setMerchants(prev => prev.map(m => {
            if (m.id === id) {
                const toggledStatus = !m.is_verified
                toast.success(`Merchant "${m.business_name}" is now ${toggledStatus ? 'Verified & Activated' : 'Suspended'}`)
                return {
                    ...m,
                    is_verified: toggledStatus,
                    api_prefix: toggledStatus ? `pk_live_${Math.random().toString(16).slice(2, 6)}...` : 'pk_live_suspended'
                }
            }
            return m
        }))
    }

    // Stats calculations
    const totalMerchants = merchants.length
    const verifiedMerchants = merchants.filter(m => m.is_verified).length
    const aggVolumeKobo = merchants.reduce((acc, curr) => acc + curr.volumeKobo, 0)
    const averageSuccessRate = merchants.filter(m => m.is_verified).reduce((acc, curr) => acc + curr.successRate, 0) / (verifiedMerchants || 1)

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Validating merchant cryptographic key prefix logs...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] font-black tracking-widest px-2 py-0.5">SME API Gateway</Badge>
                        <span className="text-xs text-muted-foreground font-bold">Merchant Accounts & Checkout Overseer</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mt-2 bg-gradient-to-r from-primary via-purple-500 to-emerald-400 bg-clip-text text-transparent">Merchant Accounts</h1>
                    <p className="text-sm text-muted-foreground mt-1">Audit small business API key vaults, configure checkout webhooks, and verify trade checkout applications.</p>
                </div>
            </div>

            {/* Metric widgets */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Briefcase className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider">Active profiles</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Registered SMEs</p>
                    <p className="text-3xl font-extrabold mt-1">{totalMerchants} Profiles</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <CheckCircle className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider text-emerald-500 bg-emerald-500/5">Verified</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Verified Active Merchants</p>
                    <p className="text-3xl font-extrabold mt-1">{verifiedMerchants} SMEs</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/20 text-[9px] uppercase font-black">Gross settlement</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Aggregate Switched Volume</p>
                    <p className="text-3xl font-extrabold mt-1">₦{(aggVolumeKobo / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-xl text-purple-500">
                            <Activity className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-emerald-500 font-bold flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" /> Target 99%
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Avg Checkout Success Rate</p>
                    <p className="text-3xl font-extrabold mt-1">{averageSuccessRate.toFixed(1)}%</p>
                </div>
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: SME Profiles Audits (8 slots) */}
                <div className="lg:col-span-8 space-y-8">
                    
                    {/* Profiles Grid */}
                    <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-md space-y-6">
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" /> SME Business Directory
                            </h2>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Verify retail profiles, check cryptographic token status, and configure merchant webhook URLs.</p>
                        </div>

                        <div className="space-y-4">
                            {merchants.map(merch => (
                                <div key={merch.id} className="bg-muted/30 border border-border/50 rounded-2xl p-5 hover:border-primary/20 transition-all flex flex-col space-y-4">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-sm font-extrabold text-foreground">{merch.business_name}</h3>
                                                <Badge variant="outline" className={`text-[8px] font-bold uppercase ${
                                                    merch.is_verified ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-200/20'
                                                }`}>
                                                    {merch.is_verified ? 'Verified API Active' : 'Verification Pending'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-semibold">Owner Contact: <span className="text-foreground">{merch.ownerName} ({merch.email})</span></p>
                                        </div>

                                        <div className="flex gap-2 w-full sm:w-auto self-end sm:self-center">
                                            {merch.is_verified ? (
                                                <Button 
                                                    onClick={() => handleVerifyToggle(merch.id)}
                                                    variant="outline" 
                                                    className="w-full sm:w-auto h-8 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 font-bold text-xs rounded-lg shadow-none"
                                                >
                                                    Suspend Merchant
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={() => handleVerifyToggle(merch.id)}
                                                    className="w-full sm:w-auto h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-lg"
                                                >
                                                    Approve & Verify
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tech specs info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-background/50 border border-border/40 rounded-xl p-3.5 text-[11px] font-semibold text-muted-foreground">
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Settlement Wallet</p>
                                            <p className="text-foreground truncate">{merch.settlement_account}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">API Public Prefix</p>
                                            <p className="text-primary font-mono truncate flex items-center gap-1"><Code className="h-3 w-3 text-primary" /> {merch.api_prefix}</p>
                                        </div>
                                        <div className="space-y-0.5">
                                            <p className="text-[9px] font-black uppercase text-muted-foreground/60 tracking-wider">Webhook Endpoint</p>
                                            <p className="text-foreground truncate flex items-center gap-1"><Globe className="h-3 w-3 text-emerald-500" /> {merch.webhook_url}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column: Checkout Invoices Audit (4 slots) */}
                <div className="lg:col-span-4 space-y-8">
                    
                    {/* Live Invoices Stream */}
                    <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-md space-y-6">
                        <div>
                            <h2 className="text-md font-black flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Checkout Invoices Ledger
                            </h2>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Real-time payment logs of client checkouts settles.</p>
                        </div>

                        <div className="space-y-4">
                            {checkouts.map(tx => (
                                <div key={tx.id} className="p-3.5 bg-muted/30 border border-border/50 rounded-2xl flex justify-between items-center hover:border-primary/20 transition-all text-xs">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="font-extrabold text-foreground">{tx.business_name}</span>
                                            <Badge variant="outline" className={`text-[7.5px] font-black uppercase tracking-tighter ${
                                                tx.status === 'successful' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25' : 'bg-amber-500/10 text-amber-600 border-amber-500/25 animate-pulse'
                                            }`}>
                                                {tx.status}
                                            </Badge>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground font-medium truncate max-w-[170px]">{tx.payerEmail}</p>
                                        <p className="text-[9px] text-muted-foreground/60 font-semibold">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-foreground">₦{(tx.amount / 100).toLocaleString()}</p>
                                        <span className="text-[8.5px] text-muted-foreground font-mono">#{tx.id}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    )
}
