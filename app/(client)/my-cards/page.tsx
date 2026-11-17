"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    CreditCard, 
    Shield, 
    Lock, 
    Unlock, 
    Sliders, 
    Eye, 
    EyeOff, 
    KeyRound, 
    Plus, 
    Loader2, 
    CheckCircle, 
    Info 
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScope } from "@/context/scope-context"

interface Card {
    id: string
    card_holder_name: string
    card_network: 'visa' | 'mastercard' | 'verve'
    card_type: 'physical' | 'virtual'
    card_number_masked: string
    limit_pos: number
    limit_web: number
    limit_atm: number
    is_frozen: boolean
    expiry_date: string
    status: string
    account: { id: string; account_number: string } | string
}

interface Account {
    id: string
    account_number: string
    account_type: string
    balance: number
}

export default function MyCardsPage() {
    const { activeScopeId, activeScope } = useScope();
    const [cards, setCards] = React.useState<Card[]>([])
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(true)
    const [activeCardIndex, setActiveCardIndex] = React.useState(0)
    const [showCVV, setShowCVV] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    // Modals & forms
    const [showRequestModal, setShowRequestModal] = React.useState(false)
    const [newCardType, setNewCardType] = React.useState<'virtual' | 'physical'>('virtual')
    const [newCardNetwork, setNewCardNetwork] = React.useState<'visa' | 'mastercard' | 'verve'>('verve')
    const [newCardHolder, setNewCardHolder] = React.useState('')
    const [selectedAccountId, setSelectedAccountId] = React.useState('')

    // Limits
    const [limitPos, setLimitPos] = React.useState(100000)
    const [limitWeb, setLimitWeb] = React.useState(50000)
    const [limitAtm, setLimitAtm] = React.useState(20000)

    // PIN Reset
    const [showPinModal, setShowPinModal] = React.useState(false)
    const [newPin, setNewPin] = React.useState('')
    const [pinSuccess, setPinSuccess] = React.useState(false)

    // Dynamic max values for cap sliders based on scope
    const maxLimits = React.useMemo(() => {
        if (activeScope.type === 'business') {
            return { pos: 10000000, web: 5000000, atm: 1000000 }; // Higher cap for corporate
        }
        if (activeScope.type === 'coop') {
            return { pos: 25000000, web: 10000000, atm: 2000000 }; // Union disbursement caps
        }
        return { pos: 500000, web: 250000, atm: 100000 }; // Personal caps
    }, [activeScopeId]);

    // Load cards and accounts on mount
    React.useEffect(() => {
        const loadData = async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                let fetchedAccounts: Account[] = []
                let fetchedCards: Card[] = []

                if (user) {
                    try {
                        const accRes = await fetch(`/api/accounts?where[user_id][equals]=${user.id}&limit=100`)
                        const accData = await accRes.json()
                        if (accData && accData.docs && accData.docs.length > 0) {
                            fetchedAccounts = accData.docs.map((d: any) => ({
                                id: d.id,
                                account_number: d.account_number,
                                account_type: d.account_type || 'Savings',
                                balance: Number(d.balance || 0)
                            }))
                        }
                    } catch (e) {
                        console.warn('[Cards client] Failed to fetch accounts.', e)
                    }

                    try {
                        const cardRes = await fetch(`/api/smart-cards?where[user_id][equals]=${user.id}&limit=100`)
                        const cardData = await cardRes.json()
                        if (cardData && cardData.docs && cardData.docs.length > 0) {
                            fetchedCards = cardData.docs.map((d: any) => ({
                                id: d.id,
                                card_holder_name: d.card_holder_name,
                                card_network: d.card_network,
                                card_type: d.card_type,
                                card_number_masked: d.card_number_masked,
                                limit_pos: Number(d.limit_pos || 0),
                                limit_web: Number(d.limit_web || 0),
                                limit_atm: Number(d.limit_atm || 0),
                                is_frozen: !!d.is_frozen,
                                expiry_date: d.expiry_date ? new Date(d.expiry_date).toLocaleDateString(undefined, { month: '2-digit', year: '2-digit' }) : '12/29',
                                status: d.status,
                                account: typeof d.account === 'object' ? d.account.id : d.account
                            }))
                        }
                    } catch (e) {
                        console.warn('[Cards client] Failed to fetch cards.', e)
                    }
                }

                if (fetchedAccounts.length === 0) {
                    fetchedAccounts = [
                        { id: '1', account_number: '3086167603', account_type: 'Savings', balance: 45000000 },
                        { id: '2', account_number: '3041889711', account_type: 'Current', balance: 185000000 }
                    ]
                }
                setAccounts(fetchedAccounts)
                setSelectedAccountId(fetchedAccounts[0].id)

                if (fetchedCards.length === 0) {
                    fetchedCards = [
                        {
                            id: 'card_personal_1',
                            card_holder_name: 'CHIDI MGBARA',
                            card_network: 'verve',
                            card_type: 'physical',
                            card_number_masked: '5061-04XX-XXXX-9891',
                            limit_pos: 10000000,
                            limit_web: 5000000,
                            limit_atm: 2000000,
                            is_frozen: false,
                            expiry_date: '12/30',
                            status: 'active',
                            account: '1'
                        },
                        {
                            id: 'card_business_1',
                            card_holder_name: 'ACME CORP - CHIDI MGBARA',
                            card_network: 'visa',
                            card_type: 'virtual',
                            card_number_masked: '4000-12XX-XXXX-4567',
                            limit_pos: 200000000,
                            limit_web: 150000000,
                            limit_atm: 50000000,
                            is_frozen: false,
                            expiry_date: '08/31',
                            status: 'active',
                            account: '2'
                        },
                        {
                            id: 'card_coop_1',
                            card_holder_name: 'ABA UNION - CHIDI M',
                            card_network: 'mastercard',
                            card_type: 'physical',
                            card_number_masked: '5412-75XX-XXXX-8901',
                            limit_pos: 500000000,
                            limit_web: 250000000,
                            limit_atm: 100000000,
                            is_frozen: true,
                            expiry_date: '04/29',
                            status: 'active',
                            account: '1'
                        }
                    ]
                }
                setCards(fetchedCards)

                if (fetchedCards.length > 0) {
                    setLimitPos(fetchedCards[0].limit_pos / 100)
                    setLimitWeb(fetchedCards[0].limit_web / 100)
                    setLimitAtm(fetchedCards[0].limit_atm / 100)
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [])

    // Filter cards dynamically by active scope
    const filteredCards = React.useMemo(() => {
        if (activeScope.type === 'business') {
            return cards.filter(c => String(c.card_holder_name).includes('ACME CORP') || String(c.id).includes('business'));
        }
        if (activeScope.type === 'coop') {
            return cards.filter(c => String(c.card_holder_name).includes('UNION') || String(c.card_holder_name).includes('ABA') || String(c.id).includes('coop'));
        }
        return cards.filter(c => !String(c.card_holder_name).includes('ACME CORP') && !String(c.card_holder_name).includes('UNION') && !String(c.card_holder_name).includes('ABA') && !String(c.id).includes('business') && !String(c.id).includes('coop'));
    }, [cards, activeScope.id, activeScope.type]);

    // Track active card index in the filtered cards subset
    const activeCard = filteredCards[activeCardIndex] || filteredCards[0]

    // Sync limits when active card changes
    React.useEffect(() => {
        if (activeCard) {
            setLimitPos(activeCard.limit_pos / 100)
            setLimitWeb(activeCard.limit_web / 100)
            setLimitAtm(activeCard.limit_atm / 100)
        }
    }, [activeCardIndex, activeCard])

    const handleToggleFreeze = async () => {
        if (!activeCard) return
        setActionLoading('freeze')
        try {
            const nextFreeze = !activeCard.is_frozen
            const res = await fetch('/api/cards/toggle-freeze', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_id: activeCard.id, is_frozen: nextFreeze })
            })
            const data = await res.json()
            if (data.success) {
                const updated = cards.map(c => c.id === activeCard.id ? data.card : c)
                setCards(updated)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setActionLoading(null)
        }
    }

    const handleSaveLimits = async () => {
        if (!activeCard) return
        setActionLoading('limits')
        try {
            const res = await fetch('/api/cards/limits', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    card_id: activeCard.id,
                    limit_pos: limitPos * 100,
                    limit_web: limitWeb * 100,
                    limit_atm: limitAtm * 100
                })
            })
            const data = await res.json()
            if (data.success) {
                const updated = cards.map(c => c.id === activeCard.id ? data.card : c)
                setCards(updated)
                alert('Daily card transaction limits updated successfully!')
            }
        } catch (e) {
            console.error(e)
        } finally {
            setActionLoading(null)
        }
    }

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeCard || String(newPin).length !== 4) return
        setActionLoading('pin')
        try {
            const res = await fetch('/api/cards/reset-pin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ card_id: activeCard.id, new_pin: newPin })
            })
            const data = await res.json()
            if (data.success) {
                setPinSuccess(true)
                setTimeout(() => {
                    setShowPinModal(false)
                    setPinSuccess(false)
                    setNewPin('')
                }, 2000)
            }
        } catch (e) {
            console.error(e)
        } finally {
            setActionLoading(null)
        }
    }

    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCardHolder || !selectedAccountId) return
        setActionLoading('create')
        try {
            // Scope card holder name prefix
            let holderName = newCardHolder.toUpperCase()
            if (activeScope.type === 'business' && !holderName.includes('ACME CORP')) {
                holderName = `ACME CORP - ${holderName}`
            } else if (activeScope.type === 'coop' && !holderName.includes('UNION')) {
                holderName = `ABA UNION - ${holderName}`
            }

            const res = await fetch('/api/cards/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    account_id: selectedAccountId,
                    card_network: newCardNetwork,
                    card_type: newCardType,
                    card_holder_name: holderName
                })
            })
            const data = await res.json()
            if (data.success) {
                setCards([...cards, data.card])
                setShowRequestModal(false)
                setNewCardHolder('')
                setActiveCardIndex(filteredCards.length) // Focus new card
            }
        } catch (e) {
            console.error(e)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Securing your smart cards ledger...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                        {activeScope.type === 'business' ? 'Corporate Expense Cards' : activeScope.type === 'coop' ? 'Union Disbursement Cards' : 'Smart Cards Management'}
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        {activeScope.type === 'business' ? 'Authorize company expenses and distribute custom employee spend caps.' : activeScope.type === 'coop' ? 'Issue guild allocation cards and audit shared rotation spend.' : 'Issue, configure, and instantly lock physical & virtual cards.'}
                    </p>
                </div>
                <Button 
                    onClick={() => setShowRequestModal(true)} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" /> Request {activeScope.type === 'business' ? 'Corporate' : activeScope.type === 'coop' ? 'Union' : 'New'} Card
                </Button>
            </div>

            {filteredCards.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                    <CreditCard className="h-16 w-16 mx-auto text-primary/40 animate-pulse" />
                    <h3 className="text-xl font-bold">No active scoped cards found</h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        Secure instant virtual Visa, Mastercard, or local Verve cards connected directly to your ledger accounts.
                    </p>
                    <Button onClick={() => setShowRequestModal(true)} className="w-full bg-primary font-bold rounded-xl">
                        Launch Your First Card
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Card Slider & Selector */}
                    <div className="lg:col-span-6 space-y-6 flex flex-col items-center">
                        <div className="w-full max-w-[400px] relative">
                            {/* Card Render */}
                            <motion.div 
                                className={`aspect-[1.586/1] w-full rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500 ${
                                    activeCard?.is_frozen 
                                        ? 'bg-gradient-to-br from-slate-700 to-slate-900 filter grayscale brightness-75' 
                                        : activeCard?.card_network === 'visa' 
                                            ? 'bg-gradient-to-br from-blue-700 via-indigo-800 to-indigo-950 text-white' 
                                            : activeCard?.card_network === 'mastercard'
                                                ? 'bg-gradient-to-br from-orange-600 via-rose-700 to-amber-950 text-white'
                                                : 'bg-gradient-to-br from-emerald-600 via-teal-800 to-cyan-950 text-white'
                                }`}
                                layoutId={`card-${activeCard?.id}`}
                            >
                                {/* Card Glassmorphism Ambient Glow */}
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />
                                
                                {/* Top Row */}
                                <div className="flex justify-between items-start z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">{activeCard?.card_type} card</p>
                                        <Shield className="h-5 w-5 opacity-90" />
                                    </div>
                                    <span className="text-lg font-black italic tracking-tighter uppercase opacity-95">
                                        {activeCard?.card_network === 'visa' && 'VISA'}
                                        {activeCard?.card_network === 'mastercard' && 'mastercard'}
                                        {activeCard?.card_network === 'verve' && 'verve'}
                                    </span>
                                </div>
 
                                {/* Frozen Banner Overlay */}
                                <AnimatePresence>
                                    {activeCard?.is_frozen && (
                                        <motion.div 
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute inset-0 bg-background/30 backdrop-blur-md flex flex-col justify-center items-center z-20 gap-2 border border-slate-500/20"
                                        >
                                            <Lock className="h-10 w-10 text-rose-500 fill-rose-500/10" />
                                            <span className="text-xs font-black uppercase tracking-widest text-white bg-rose-600 px-3 py-1 rounded-full shadow-lg shadow-rose-950/40">Frozen / Locked</span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
 
                                {/* Middle Row - Masked Card Number */}
                                <div className="z-10 py-4 flex items-center justify-between">
                                    <p className="text-xl sm:text-2xl font-mono tracking-widest font-black opacity-95">
                                        {showCVV ? activeCard?.card_number_masked.replace(/\*/g, '•') : activeCard?.card_number_masked}
                                    </p>
                                </div>
 
                                {/* Bottom Row */}
                                <div className="flex justify-between items-end z-10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Card Holder</p>
                                        <p className="text-xs font-black tracking-wide truncate max-w-[200px]">{activeCard?.card_holder_name}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Expires</p>
                                            <p className="text-xs font-black">{activeCard?.expiry_date || '12/29'}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">CVV</p>
                                            <p className="text-xs font-black">{showCVV ? '849' : '•••'}</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
 
                        {/* Card Selector / Indicators */}
                        <div className="flex gap-2">
                            {filteredCards.map((c, i) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCardIndex(i)}
                                    className={`h-2.5 rounded-full transition-all ${
                                        activeCardIndex === i ? 'bg-primary w-6' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                                    }`}
                                />
                            ))}
                        </div>
 
                        {/* View Card Tokens */}
                        <div className="flex items-center gap-3 w-full max-w-[400px]">
                            <Button 
                                variant="outline" 
                                onClick={() => setShowCVV(!showCVV)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl h-12 font-bold transition-all hover:bg-muted"
                            >
                                {showCVV ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {showCVV ? 'Hide Security Details' : 'Show Security Details'}
                            </Button>
                        </div>
                    </div>
 
                    {/* Right: Security & Limits Settings Panel */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" /> Security & Controls
                            </h2>
 
                            {/* Card Status & Lock Toggle */}
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Freeze/Lock Asset</p>
                                    <p className="text-xs text-muted-foreground">Instantly block POS, Web, and ATM authorizations.</p>
                                </div>
                                <Button
                                    onClick={handleToggleFreeze}
                                    disabled={actionLoading !== null}
                                    className={`font-black rounded-xl h-11 px-4 flex items-center gap-2 border transition-all ${
                                        activeCard?.is_frozen 
                                            ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20 shadow-none'
                                            : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20 shadow-none'
                                    }`}
                                >
                                    {actionLoading === 'freeze' ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : activeCard?.is_frozen ? (
                                        <>
                                            <Unlock className="h-4 w-4" /> Unfreeze Card
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4" /> Freeze / Lock Card
                                        </>
                                    )}
                                </Button>
                            </div>
 
                            {/* Limits Control */}
                            <div className="space-y-6 border-b pb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Sliders className="h-4 w-4" /> Customized Limits
                                </h3>
 
                                {/* POS limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily POS Terminal Cap</span>
                                        <span className="font-black text-primary">₦ {limitPos.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1000" 
                                        max={maxLimits.pos} 
                                        step="1000"
                                        value={limitPos} 
                                        onChange={(e) => setLimitPos(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>
 
                                {/* Web limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily Web/Online Cap</span>
                                        <span className="font-black text-primary">₦ {limitWeb.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1000" 
                                        max={maxLimits.web} 
                                        step="1000"
                                        value={limitWeb} 
                                        onChange={(e) => setLimitWeb(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>
 
                                {/* ATM limit */}
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily ATM Cash Cap</span>
                                        <span className="font-black text-primary">₦ {limitAtm.toLocaleString()}</span>
                                    </div>
                                    <input 
                                        type="range" 
                                        min="1000" 
                                        max={maxLimits.atm} 
                                        step="1000"
                                        value={limitAtm} 
                                        onChange={(e) => setLimitAtm(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>
 
                                <Button 
                                    onClick={handleSaveLimits}
                                    disabled={actionLoading !== null}
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black rounded-xl h-11 transition-all"
                                >
                                    {actionLoading === 'limits' ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : 'Save Limit Configurations'}
                                </Button>
                            </div>
 
                            {/* PIN Reset button */}
                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Transaction PIN Reset</p>
                                    <p className="text-xs text-muted-foreground font-medium">Reset the securely stored physical PIN immediately.</p>
                                </div>
                                <Button 
                                    onClick={() => setShowPinModal(true)}
                                    className="bg-muted hover:bg-muted/80 text-foreground border border-border/80 font-bold rounded-xl h-11 px-4 flex items-center gap-2 transition-all shadow-none"
                                >
                                    <KeyRound className="h-4 w-4" /> Reset PIN
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
 
            {/* Modal: Request Card */}
            <AnimatePresence>
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRequestModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 relative space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div>
                                <h3 className="text-xl font-black">Request Banking Card</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">Issue secure debit assets connected directly to your core ledger accounts.</p>
                            </div>

                            <form onSubmit={handleCreateCard} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Linked Account</label>
                                    <select 
                                        value={selectedAccountId} 
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_type} Account — {acc.account_number} (₦{(acc.balance / 100).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Card Type</label>
                                        <select 
                                            value={newCardType} 
                                            onChange={(e) => setNewCardType(e.target.value as any)}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="virtual">Virtual (Instant)</option>
                                            <option value="physical">Physical (Delivery)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Card Network</label>
                                        <select 
                                            value={newCardNetwork} 
                                            onChange={(e) => setNewCardNetwork(e.target.value as any)}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                        >
                                            <option value="verve">Verve (Local split)</option>
                                            <option value="visa">Visa (Global)</option>
                                            <option value="mastercard">Mastercard (Global)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Cardholder Name (PAN Display)</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. CHIDI MGBARAMUKO" 
                                        value={newCardHolder} 
                                        onChange={(e) => setNewCardHolder(e.target.value)}
                                        className="w-full bg-muted border border-border/80 rounded-xl h-12 px-4 text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-amber-600 leading-normal">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        Virtual cards are generated instantly and active for online shopping. Physical cards will be deployed to your neighborhood cooperative agent terminal center within 3 business days.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowRequestModal(false)}
                                        className="rounded-xl h-11 font-bold shadow-none"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        type="submit" 
                                        disabled={actionLoading === 'create'}
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md hover:shadow-primary/20"
                                    >
                                        {actionLoading === 'create' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Issuance'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: PIN Reset */}
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        {/* Overlay */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPinModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />

                        {/* Panel */}
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">Reset Card PIN</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">Reset your secure offline ATM/POS PIN instantly.</p>
                            </div>

                            {pinSuccess ? (
                                <motion.div 
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="flex flex-col items-center justify-center p-8 gap-3 text-center"
                                >
                                    <CheckCircle className="h-16 w-16 text-emerald-500 animate-bounce" />
                                    <p className="text-sm font-black text-emerald-500">PIN Reset Completed!</p>
                                    <p className="text-xs text-muted-foreground font-semibold">Your card terminal sync will update immediately.</p>
                                </motion.div>
                            ) : (
                                <form onSubmit={handleResetPin} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">New 4-Digit PIN</label>
                                        <input 
                                            type="password" 
                                            maxLength={4}
                                            required
                                            pattern="[0-9]{4}"
                                            placeholder="••••" 
                                            value={newPin} 
                                            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-14 px-4 text-2xl font-black text-center tracking-widest focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-2xl placeholder:font-black"
                                        />
                                    </div>

                                    <div className="flex gap-3 justify-end pt-4">
                                        <Button 
                                            type="button" 
                                            variant="outline" 
                                            onClick={() => setShowPinModal(false)}
                                            className="rounded-xl h-11 font-bold shadow-none"
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            type="submit" 
                                            disabled={actionLoading === 'pin' || newPin.length !== 4}
                                            className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md"
                                        >
                                            {actionLoading === 'pin' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm New PIN'}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
