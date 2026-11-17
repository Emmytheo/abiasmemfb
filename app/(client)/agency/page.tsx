"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Landmark, 
    TrendingUp, 
    ShieldCheck, 
    Smartphone, 
    ArrowRight, 
    Plus, 
    Loader2, 
    Sliders,
    Calculator,
    CheckCircle,
    UserCheck,
    CreditCard,
    DollarSign
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"

interface Terminal {
    id: string
    serial_number: string
    pos_model: string
    status: 'pending' | 'assigned' | 'active' | 'suspended' | 'damaged'
    registered_at: string
}

interface CommissionReport {
    total_commission: number
    agent_share: number
    bank_share: number
    commissions: any[]
}

export default function AgencyClientPage() {
    const { activeProfile } = useBankProfile()
    const [terminals, setTerminals] = React.useState<Terminal[]>([])
    const [commissions, setCommissions] = React.useState<CommissionReport>({
        total_commission: 0,
        agent_share: 0,
        bank_share: 0,
        commissions: []
    })
    const [cards, setCards] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    // POS Simulator state
    const [selectedSimulatorTerminal, setSelectedSimulatorTerminal] = React.useState<string>('')
    const [withdrawalAmount, setWithdrawalAmount] = React.useState<string>('')
    const [cardToken, setCardToken] = React.useState<string>('5061********9891')
    const [pinBlock, setPinBlock] = React.useState<string>('')
    const [posScreen, setPosScreen] = React.useState<'idle' | 'swipe' | 'pin' | 'processing' | 'success' | 'error'>('idle')
    const [simulatorLog, setSimulatorLog] = React.useState<string>('')

    // Form modal
    const [showRequestModal, setShowRequestModal] = React.useState(false)
    const [businessAddress, setBusinessAddress] = React.useState('')
    const [estimatedVolume, setEstimatedVolume] = React.useState('500,000')
    const [posModel, setPosModel] = React.useState('Smart Android POS (Nexgo)')

    React.useEffect(() => {
        const loadAgencyData = async () => {
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                let fetchedTerminals: Terminal[] = []
                let fetchedCommissions: any[] = []
                let totalComm = 0
                let agentS = 0
                let bankS = 0

                if (user) {
                    // Fetch terminals
                    try {
                        const termRes = await fetch(`/api/agency-terminals?where[user_id][equals]=${user.id}&limit=100`)
                        const termData = await termRes.json()
                        if (termData && termData.docs && termData.docs.length > 0) {
                            fetchedTerminals = termData.docs.map((d: any) => ({
                                id: d.id,
                                serial_number: d.serial_number,
                                pos_model: d.pos_model || 'Smart Android Nexgo',
                                status: d.status,
                                registered_at: d.createdAt || new Date().toISOString()
                            }))
                        }
                    } catch (e) {
                        console.warn('[Agency Client] Failed to fetch terminals', e)
                    }

                    // Fetch commissions
                    try {
                        const commRes = await fetch(`/api/agency-commissions?where[user_id][equals]=${user.id}&limit=100&sort=-createdAt`)
                        const commData = await commRes.json()
                        if (commData && commData.docs && commData.docs.length > 0) {
                            fetchedCommissions = commData.docs.map((d: any) => {
                                totalComm += Number(d.total_commission || 0)
                                agentS += Number(d.agent_share || 0)
                                bankS += Number(d.bank_share || 0)
                                return {
                                    id: d.id,
                                    terminal: typeof d.terminal === 'object' ? d.terminal.id : d.terminal,
                                    transaction_amount: Number(d.transaction_amount || 0),
                                    total_commission: Number(d.total_commission || 0),
                                    agent_share: Number(d.agent_share || 0),
                                    settled_at: d.createdAt || new Date().toISOString()
                                }
                            })
                        }
                    } catch (e) {
                        console.warn('[Agency Client] Failed to fetch commissions', e)
                    }

                    // Fetch smart cards for simulator option dropdown
                    try {
                        const cardRes = await fetch(`/api/smart-cards?where[user_id][equals]=${user.id}&limit=100`)
                        const cardData = await cardRes.json()
                        if (cardData && cardData.docs && cardData.docs.length > 0) {
                            setCards(cardData.docs)
                            setCardToken(cardData.docs[0].card_number_masked)
                        }
                    } catch (e) {
                        console.warn('[Agency Client] Failed to fetch smart cards for simulator', e)
                    }
                }

                if (fetchedTerminals.length === 0) {
                    fetchedTerminals = [
                        { id: 'term_1', serial_number: 'AB-POS-90283', pos_model: 'Android Smart POS Nexgo N5', status: 'active', registered_at: new Date().toISOString() },
                        { id: 'term_2', serial_number: 'AB-POS-10928', pos_model: 'Dynamic Desktop POS Pax S90', status: 'pending', registered_at: new Date().toISOString() }
                    ]
                }
                setTerminals(fetchedTerminals)
                setSelectedSimulatorTerminal(fetchedTerminals[0].id)

                setCommissions({
                    total_commission: totalComm > 0 ? totalComm : 8500000,
                    agent_share: agentS > 0 ? agentS : 5950000,
                    bank_share: bankS > 0 ? bankS : 2550000,
                    commissions: fetchedCommissions.length > 0 ? fetchedCommissions : [
                        { id: 'comm_1', terminal: 'term_1', transaction_amount: 5000000, total_commission: 50000, agent_share: 35000, settled_at: new Date().toISOString() },
                        { id: 'comm_2', terminal: 'term_1', transaction_amount: 15000000, total_commission: 150000, agent_share: 105000, settled_at: new Date().toISOString() }
                    ]
                })
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadAgencyData()
    }, [])

    const handleRequestTerminal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessAddress) return
        setActionLoading('request')
        try {
            const res = await fetch('/api/agency/terminals/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    business_address: businessAddress,
                    pos_type: posModel,
                    monthly_volume_est: parseInt(estimatedVolume.replace(/[^0-9]/g, '')) * 100
                })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('POS hardware request registered successfully!')
                setTerminals([...terminals, data.terminal])
                setShowRequestModal(false)
                setBusinessAddress('')
            } else {
                toast.error(data.error || 'Failed to submit POS request')
            }
        } catch (e) {
            toast.error('Network request failed')
        } finally {
            setActionLoading(null)
        }
    }

    const runPOSSimulatorWithdrawal = async () => {
        if (!selectedSimulatorTerminal || !withdrawalAmount || parseInt(withdrawalAmount) <= 0 || pinBlock.length !== 4) {
            toast.error('Please input terminal, withdrawal amount, and 4-digit card PIN')
            return
        }

        setPosScreen('processing')
        setSimulatorLog('Connecting to regional switching network...')

        setTimeout(async () => {
            try {
                const res = await fetch('/api/agency/transactions/cash-out', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        terminal_id: selectedSimulatorTerminal,
                        card_number_masked: cardToken,
                        pin_block: pinBlock,
                        amount: parseFloat(withdrawalAmount) * 100 // Convert Naira to kobo
                    })
                })
                const data = await res.json()
                if (data.success) {
                    setPosScreen('success')
                    setSimulatorLog(`Cash-out approved! Commission split added: +₦${(data.commission.agent_share / 100).toFixed(2)}`)
                    toast.success('Simulator cash-out transaction approved!')

                    // Dynamically refresh commission totals in UI
                    setCommissions(prev => ({
                        ...prev,
                        total_commission: prev.total_commission + data.commission.total_commission,
                        agent_share: prev.agent_share + data.commission.agent_share,
                        bank_share: prev.bank_share + data.commission.bank_share,
                        commissions: [
                            {
                                id: data.commission.id,
                                terminal: selectedSimulatorTerminal,
                                transaction_amount: parseFloat(withdrawalAmount) * 100,
                                total_commission: data.commission.total_commission,
                                agent_share: data.commission.agent_share,
                                settled_at: new Date().toISOString()
                            },
                            ...prev.commissions
                        ]
                    }))
                } else {
                    setPosScreen('error')
                    setSimulatorLog(`Transaction declined: ${data.error || 'Check balance or PIN'}`)
                }
            } catch (e) {
                setPosScreen('error')
                setSimulatorLog('Network connection timed out')
            }
        }, 1500)
    }

    const handleKeypadPress = (val: string) => {
        if (posScreen === 'idle') {
            setPosScreen('swipe')
        }
        if (posScreen === 'swipe') {
            if (val === 'clear') {
                setWithdrawalAmount('')
            } else if (val === 'enter') {
                if (parseFloat(withdrawalAmount) > 0) {
                    setPosScreen('pin')
                }
            } else {
                setWithdrawalAmount(prev => prev + val)
            }
        } else if (posScreen === 'pin') {
            if (val === 'clear') {
                setPinBlock('')
            } else if (val === 'enter') {
                if (pinBlock.length === 4) {
                    runPOSSimulatorWithdrawal()
                }
            } else {
                if (pinBlock.length < 4) {
                    setPinBlock(prev => prev + val)
                }
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Securing agent POS switching registers...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">Agency Banking POS Network</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Earn commissions by conducting neighborhood card withdrawals and cash deposits.</p>
                </div>
                <Button 
                    onClick={() => setShowRequestModal(true)} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg hover:shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" /> Request POS Terminal
                </Button>
            </div>

            {/* Commission Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase bg-emerald-50 text-emerald-700 border-emerald-200">Daily</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Commission Pool</p>
                    <p className="text-2xl font-black mt-1">₦{(commissions.total_commission / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500">70% split</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">My Earned Split (70%)</p>
                    <p className="text-2xl font-black mt-1 text-emerald-500">₦{(commissions.agent_share / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Landmark className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-purple-600">30% split</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Bank Revenue Share (30%)</p>
                    <p className="text-2xl font-black mt-1 text-purple-600">₦{(commissions.bank_share / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">CBN POS</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Fleet Terminals</p>
                    <p className="text-2xl font-black mt-1">{terminals.filter(t => t.status === 'active').length} Hardware</p>
                </div>
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left side: Terminal hardware and recent commission ledger */}
                <div className="lg:col-span-7 space-y-6">
                    
                    {/* Active Hardware POS Fleet */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" /> POS Fleet & Hardware Assets
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {terminals.map(t => (
                                <div key={t.id} className="p-4 bg-muted/30 rounded-xl border border-border/60 space-y-2 relative overflow-hidden group">
                                    <div className="absolute top-2 right-2">
                                        <Badge 
                                            variant="outline" 
                                            className={`text-[9px] uppercase tracking-wider ${
                                                t.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                                            }`}
                                        >
                                            {t.status}
                                        </Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">{t.pos_model}</p>
                                    <p className="text-sm font-black text-foreground font-mono">{t.serial_number}</p>
                                    <p className="text-[10px] text-muted-foreground font-semibold">Registered: {new Date(t.registered_at).toLocaleDateString()}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Commissions ledger list */}
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-primary" /> Commissions Settlement Journal
                        </h2>
                        <div className="bg-muted/10 rounded-xl border divide-y overflow-x-auto">
                            {commissions.commissions.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                                    No commission settlements logged yet.
                                </div>
                            ) : (
                                commissions.commissions.map(c => (
                                    <div key={c.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 text-xs font-semibold">
                                        <div>
                                            <p className="font-extrabold text-foreground leading-normal">Commission split transaction</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold">Ref: {String(c.id).substring(0, 10)}</p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="font-black text-emerald-500">+₦{(c.agent_share / 100).toFixed(2)}</p>
                                            <p className="text-[10px] text-muted-foreground">Volume: ₦{(c.transaction_amount / 100).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right side: High-fidelity tactile physical POS Device Simulator */}
                <div className="lg:col-span-5 space-y-6 flex flex-col items-center">
                    
                    {/* The POS Device Wrapper */}
                    <div className="w-full max-w-[340px] bg-slate-900 border-4 border-slate-700 rounded-[36px] shadow-2xl p-6 relative flex flex-col items-center">
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full mb-4 shrink-0" />
                        
                        {/* Device LCD Screen */}
                        <div className="aspect-[4/3] w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between font-mono relative overflow-hidden select-none">
                            {/* Screen glow overlay */}
                            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />

                            <div className="flex justify-between items-center text-[10px] text-blue-500 font-bold shrink-0">
                                <span>{activeProfile.posBrandName}</span>
                                <span>ONLINE 📶</span>
                            </div>

                            {/* Dynamic screen views */}
                            <div className="flex-1 flex flex-col justify-center items-center text-center py-2 px-1 text-white">
                                {posScreen === 'idle' && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-emerald-400">WELCOME AGENT</p>
                                        <p className="text-[9px] text-muted-foreground">Key in amount to start</p>
                                    </div>
                                )}
                                
                                {posScreen === 'swipe' && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-muted-foreground font-black uppercase">WITHDRAWAL AMOUNT</p>
                                        <p className="text-xl font-bold text-white tracking-widest">₦ {withdrawalAmount || '0.00'}</p>
                                        <p className="text-[8px] text-emerald-500/80 blink font-black uppercase tracking-tight">Press [ENTER] to continue</p>
                                    </div>
                                )}

                                {posScreen === 'pin' && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-muted-foreground font-black uppercase">ENTER SECURITY PIN</p>
                                        <p className="text-lg font-bold text-white tracking-widest">{pinBlock.split('').map(() => '•').join('') || 'PIN BLOCK'}</p>
                                        <p className="text-[8px] text-amber-500/80 blink font-black uppercase tracking-tight">Press [ENTER] to swipe</p>
                                    </div>
                                )}

                                {posScreen === 'processing' && (
                                    <div className="space-y-2 flex flex-col items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="text-[9px] text-muted-foreground font-bold shrink-0">{simulatorLog}</p>
                                    </div>
                                )}

                                {posScreen === 'success' && (
                                    <div className="space-y-1 flex flex-col items-center">
                                        <CheckCircle className="h-7 w-7 text-emerald-400 fill-emerald-950/20" />
                                        <p className="text-[10px] text-emerald-400 font-bold leading-normal">WITHDRAWAL APPROVED</p>
                                        <p className="text-[8px] text-muted-foreground leading-normal mt-0.5">Slip printed.</p>
                                    </div>
                                )}

                                {posScreen === 'error' && (
                                    <div className="space-y-1 flex flex-col items-center text-rose-500">
                                        <p className="text-xs font-black">DECLINED ❌</p>
                                        <p className="text-[8px] text-muted-foreground leading-relaxed mt-0.5">{simulatorLog}</p>
                                    </div>
                                )}
                            </div>

                            <div className="text-[9px] text-muted-foreground/60 text-right shrink-0">
                                V1.02
                            </div>
                        </div>

                        {/* Card selection dropdown inside the simulator */}
                        <div className="w-full mt-4 space-y-1.5 shrink-0">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase">Simulator Funding Source</label>
                            <select 
                                value={cardToken} 
                                onChange={(e) => setCardToken(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {cards.length > 0 ? (
                                    cards.map(c => (
                                        <option key={c.id} value={c.card_number_masked}>
                                            {c.card_holder_name} ({c.card_network?.toUpperCase()} - {c.card_number_masked})
                                        </option>
                                    ))
                                ) : (
                                    <>
                                        <option value="5061********9891">CHIDI MGBARA (VERVE - 5061********9891)</option>
                                        <option value="4111********4902">CHIDI MGBARA (VISA - 4111********4902)</option>
                                    </>
                                )}
                            </select>
                        </div>

                        {/* Physical Tactile Dial Keypad */}
                        <div className="grid grid-cols-3 gap-3 w-full mt-6 shrink-0 font-sans">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(val => (
                                <button
                                    key={val}
                                    onClick={() => handleKeypadPress(val)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-sm transition-all border border-slate-700 active:scale-95 shadow-md flex justify-center items-center"
                                >
                                    {val}
                                </button>
                            ))}
                            <button
                                onClick={() => handleKeypadPress('clear')}
                                className="bg-rose-900/40 border border-rose-900/60 hover:bg-rose-900/60 text-rose-400 font-bold h-11 rounded-xl text-xs transition-all flex justify-center items-center active:scale-95"
                            >
                                CLEAR
                            </button>
                            <button
                                onClick={() => handleKeypadPress('0')}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-sm transition-all border border-slate-700 active:scale-95 flex justify-center items-center"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handleKeypadPress('enter')}
                                className="bg-emerald-900/40 border border-emerald-900/60 hover:bg-emerald-900/60 text-emerald-400 font-bold h-11 rounded-xl text-xs transition-all flex justify-center items-center active:scale-95"
                            >
                                ENTER
                            </button>
                        </div>

                        {/* Clear Screen Reset link */}
                        <button 
                            onClick={() => {
                                setPosScreen('idle')
                                setWithdrawalAmount('')
                                setPinBlock('')
                                setSimulatorLog('')
                            }}
                            className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-4 hover:underline focus:outline-none"
                        >
                            Reset POS terminal
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: POS Terminal Request Wizard */}
            <AnimatePresence>
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRequestModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">Request POS Hardware</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Apply for an active cashpoint swiper terminal connected directly to your Agent ledger account.</p>
                            </div>

                            <form onSubmit={handleRequestTerminal} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Business Physical Address</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="e.g. Shop 24, Ariaria Market, Aba" 
                                        value={businessAddress} 
                                        onChange={(e) => setBusinessAddress(e.target.value)}
                                        className="w-full bg-muted border border-border/80 rounded-xl h-12 px-4 text-sm font-semibold placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">POS Terminal Model</label>
                                        <select 
                                            value={posModel} 
                                            onChange={(e) => setPosModel(e.target.value)}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none"
                                        >
                                            <option value="Smart Android POS (Nexgo)">Smart Android Nexgo</option>
                                            <option value="Desktop POS (Pax S90)">Desktop Pax S90</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Estimated Monthly Volume (₦)</label>
                                        <input 
                                            type="text" 
                                            required
                                            value={estimatedVolume} 
                                            onChange={(e) => setEstimatedVolume(e.target.value.replace(/[^0-9,]/g, ''))}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-amber-600 leading-normal">
                                    <ShieldCheck className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        Approved agents must maintain a minimum daily transactional cash-out volume of ₦20,000 to keep their terminal registration. Terminals will deploy within 4 business days.
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
                                        disabled={actionLoading === 'request'}
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md hover:shadow-primary/20"
                                    >
                                        {actionLoading === 'request' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm POS Request'}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
