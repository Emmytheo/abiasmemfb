"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Users, 
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
    Info
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

interface Cooperative {
    id: string
    name: string
    description: string
    status: 'active' | 'suspended'
}

interface EsusuCycle {
    id: string
    name: string
    contribution_amount: number
    frequency: 'daily' | 'weekly' | 'monthly'
    total_slots: number
    current_payout_index: number
    platform_fee_percent: number
    status: 'draft' | 'active' | 'completed'
    cooperative: Cooperative | string
}

interface EsusuMember {
    id: string
    payout_order_index: number
    status: 'active' | 'exited'
    customer: { id: string; customer_name?: string } | string
    user_id: string
}

export default function EsusuClientPage() {
    const [cooperatives, setCooperatives] = React.useState<Cooperative[]>([])
    const [activeCycles, setActiveCycles] = React.useState<EsusuCycle[]>([])
    const [myMemberships, setMyMemberships] = React.useState<Record<string, EsusuMember>>({}) // cycle_id -> member details
    const [contributions, setContributions] = React.useState<any[]>([])
    const [payouts, setPayouts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState<string | null>(null)
    const [activeCycleTab, setActiveCycleTab] = React.useState<number>(0)

    // Form states
    const [showJoinModal, setShowJoinModal] = React.useState(false)
    const [selectedCycleForJoin, setSelectedCycleForJoin] = React.useState<EsusuCycle | null>(null)
    const [contributionAmount, setContributionAmount] = React.useState(0)

    // Stats calculations
    const totalContributed = React.useMemo(() => {
        return contributions.reduce((sum, c) => sum + (c.amount || 0), 0)
    }, [contributions])

    React.useEffect(() => {
        const loadEsusuData = async () => {
            try {
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()

                // Fetch cooperatives
                let coops: Cooperative[] = []
                try {
                    const coopRes = await fetch('/api/cooperatives?limit=100')
                    const coopData = await coopRes.json()
                    if (coopData && coopData.docs && coopData.docs.length > 0) {
                        coops = coopData.docs.map((d: any) => ({
                            id: d.id,
                            name: d.name,
                            description: d.description,
                            status: d.status
                        }))
                    }
                } catch (e) {
                    console.warn('[Esusu client] Failed to fetch cooperatives from API. Falling back to mocks.', e)
                }

                if (coops.length === 0) {
                    coops = [
                        { id: 'coop_1', name: 'Abia Agro-Traders Association', description: 'Empowering small-scale local farmers across Aba North.', status: 'active' },
                        { id: 'coop_2', name: 'Aba Leather & Shoe Makers Union', description: 'Funding machinery and bulk raw material procurement.', status: 'active' },
                        { id: 'coop_3', name: 'Ariaria Market General Traders', description: 'Retailers cooperative group for quick microfinance access.', status: 'active' }
                    ]
                }
                setCooperatives(coops)

                // Fetch active cycles
                let cycles: EsusuCycle[] = []
                try {
                    const cycleRes = await fetch('/api/esusu-cycles?limit=100')
                    const cycleData = await cycleRes.json()
                    if (cycleData && cycleData.docs && cycleData.docs.length > 0) {
                        cycles = cycleData.docs.map((d: any) => ({
                            id: d.id,
                            name: d.name,
                            contribution_amount: Number(d.contribution_amount || 0),
                            frequency: d.frequency,
                            total_slots: Number(d.total_slots || 0),
                            current_payout_index: Number(d.current_payout_index || 0),
                            platform_fee_percent: Number(d.platform_fee_percent || 0),
                            status: d.status,
                            cooperative: typeof d.cooperative === 'object' ? d.cooperative.id : d.cooperative
                        }))
                    }
                } catch (e) {
                    console.warn('[Esusu client] Failed to fetch cycles from API. Falling back to mocks.', e)
                }

                if (cycles.length === 0) {
                    cycles = [
                        {
                            id: 'cycle_1',
                            name: 'Traders Daily Rotation (A)',
                            contribution_amount: 500000, // ₦5,000 in kobo
                            frequency: 'daily',
                            total_slots: 5,
                            current_payout_index: 2,
                            platform_fee_percent: 2.5,
                            status: 'active',
                            cooperative: 'coop_1'
                        },
                        {
                            id: 'cycle_2',
                            name: 'Shoemakers Weekly High Yield',
                            contribution_amount: 2500000, // ₦25,000 in kobo
                            frequency: 'weekly',
                            total_slots: 6,
                            current_payout_index: 0,
                            platform_fee_percent: 2.0,
                            status: 'active',
                            cooperative: 'coop_2'
                        }
                    ]
                }
                setActiveCycles(cycles)

                // Fetch memberships & contributions for current user if logged in
                if (user) {
                    try {
                        const memRes = await fetch(`/api/esusu-members?where[user_id][equals]=${user.id}&limit=100`)
                        const memData = await memRes.json()
                        if (memData && memData.docs && memData.docs.length > 0) {
                            const membershipMap: Record<string, EsusuMember> = {}
                            memData.docs.forEach((d: any) => {
                                const cycleId = typeof d.cycle === 'object' ? d.cycle.id : d.cycle
                                membershipMap[cycleId] = {
                                    id: d.id,
                                    payout_order_index: Number(d.payout_order_index || 0),
                                    status: d.status,
                                    customer: d.customer,
                                    user_id: d.user_id
                                }
                            })
                            setMyMemberships(membershipMap)
                        } else {
                            // Fallback default member slot
                            setMyMemberships({
                                'cycle_1': {
                                    id: 'mem_1',
                                    payout_order_index: 2,
                                    status: 'active',
                                    customer: '5',
                                    user_id: user.id
                                }
                            })
                        }

                        const contribRes = await fetch(`/api/esusu-contributions?where[user_id][equals]=${user.id}&limit=100`)
                        const contribData = await contribRes.json()
                        if (contribData && contribData.docs && contribData.docs.length > 0) {
                            setContributions(contribData.docs.map((d: any) => ({
                                id: d.id,
                                cycle: typeof d.cycle === 'object' ? d.cycle.id : d.cycle,
                                amount: Number(d.amount || 0),
                                paid_at: d.createdAt || d.updatedAt || new Date().toISOString()
                            })))
                        } else {
                            setContributions([
                                { id: 'contrib_1', cycle: 'cycle_1', amount: 500000, paid_at: new Date().toISOString() }
                            ])
                        }
                    } catch (e) {
                        console.warn('[Esusu client] Failed to fetch memberships or contributions.', e)
                    }
                } else {
                    // Fallback mock membership for demo
                    setMyMemberships({
                        'cycle_1': {
                            id: 'mem_1',
                            payout_order_index: 2,
                            status: 'active',
                            customer: '1',
                            user_id: 'user_supa'
                        }
                    })
                    setContributions([
                        { id: 'contrib_1', cycle: 'cycle_1', amount: 500000, paid_at: new Date().toISOString() }
                    ])
                }
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        loadEsusuData()
    }, [])

    const handleJoinCycle = async (cycle: EsusuCycle) => {
        setSubmitting('join')
        try {
            const res = await fetch('/api/esusu/cycles/join', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cycle_id: cycle.id })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Successfully joined the Esusu rotation cycle!')
                setMyMemberships(prev => ({
                    ...prev,
                    [cycle.id]: data.member
                }))
                setShowJoinModal(false)
            } else {
                toast.error(data.error || 'Failed to join esusu cycle')
            }
        } catch (e) {
            toast.error('Network request failed')
        } finally {
            setSubmitting(null)
        }
    }

    const handleSubmitContribution = async (cycle: EsusuCycle) => {
        setSubmitting('contribution')
        try {
            const res = await fetch('/api/esusu/contributions/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cycle_id: cycle.id, amount: cycle.contribution_amount })
            })
            const data = await res.json()
            if (data.success) {
                toast.success('Esusu contribution processed successfully!')
                setContributions(prev => [
                    ...prev,
                    { id: `contrib_${Date.now()}`, cycle: cycle.id, amount: cycle.contribution_amount, paid_at: new Date().toISOString() }
                ])
            } else {
                toast.error(data.error || 'Failed to submit contribution')
            }
        } catch (e) {
            toast.error('Transaction sync error')
        } finally {
            setSubmitting(null)
        }
    }

    const triggerPayoutCronSimulator = async (cycle: EsusuCycle) => {
        setSubmitting('cron')
        const tId = toast.loading('Dispatching rotational Esusu payout cron scheduler...')
        try {
            const res = await fetch('/api/esusu/cycles/payout-cron', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cycle_id: cycle.id })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(data.message || 'Payout cycle distributed successfully!', { id: tId })
                
                // Dynamically update UI rotation index
                setActiveCycles(prev => prev.map(c => {
                    if (c.id === cycle.id) {
                        return {
                            ...c,
                            current_payout_index: (c.current_payout_index + 1) % c.total_slots
                        }
                    }
                    return c
                }))
            } else {
                toast.error(data.error || 'Cron rejected: Rotational funds pending collection.', { id: tId })
            }
        } catch (e) {
            toast.error('Trigger request failed', { id: tId })
        } finally {
            setSubmitting(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Securing trade cooperative ledger vaults...</p>
            </div>
        )
    }

    const currentSelectedCycle = activeCycles[activeCycleTab]

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Digital Esusu & Cooperative Thrift</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Automate rotational savings, join trade unions, and receive platform payout loans.</p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <PiggyBank className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase bg-emerald-50 text-emerald-600 border-emerald-200">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">My Total Savings</p>
                    <p className="text-2xl font-black mt-1">₦{(totalContributed / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Users className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500 flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3" /> Net Plus
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Linked Cooperatives</p>
                    <p className="text-2xl font-black mt-1">{cooperatives.length}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">Daily Sync</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Rotational Cycles</p>
                    <p className="text-2xl font-black mt-1">{activeCycles.length} Active</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">CBN Audited</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Est. Platform Fee</p>
                    <p className="text-2xl font-black mt-1">2.0% - 2.5%</p>
                </div>
            </div>

            {/* Rotational Tracking Timeline & Cycle details */}
            {activeCycles.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Active Cycle Tracker & Timeline */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" /> Active Esusu Rotation
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">Track your rotation queue index and live platform payouts.</p>
                                </div>

                                {/* Custom Cycle Tab Buttons */}
                                <div className="flex gap-1 bg-muted p-1 rounded-xl w-full sm:w-auto">
                                    {activeCycles.map((c, i) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setActiveCycleTab(i)}
                                            className={`flex-1 sm:flex-none text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                activeCycleTab === i ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                        >
                                            {c.name.split(' ')[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {currentSelectedCycle && (
                                <div className="space-y-6">
                                    {/* Cycle Parameters */}
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl text-center sm:text-left">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Due Amount</p>
                                            <p className="text-sm font-black text-primary">₦{(currentSelectedCycle.contribution_amount / 100).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Frequency</p>
                                            <p className="text-sm font-black capitalize">{currentSelectedCycle.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Pool</p>
                                            <p className="text-sm font-black text-emerald-500">₦{((currentSelectedCycle.contribution_amount * currentSelectedCycle.total_slots) / 100).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Platform Cut</p>
                                            <p className="text-sm font-black">{currentSelectedCycle.platform_fee_percent}%</p>
                                        </div>
                                    </div>

                                    {/* ROTATION QUEUE STEP CHART */}
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Rotational Timeline Queue</h3>
                                        <div className="relative flex flex-col sm:flex-row items-center justify-between gap-8 pt-4 pb-6 px-4">
                                            
                                            {/* Line running through steps */}
                                            <div className="absolute left-[23px] sm:left-4 sm:right-4 top-4 bottom-4 sm:bottom-auto sm:h-0.5 bg-muted-foreground/20 z-0 w-0.5 sm:w-auto" />

                                            {Array.from({ length: currentSelectedCycle.total_slots }).map((_, slotIdx) => {
                                                const isActive = currentSelectedCycle.current_payout_index === slotIdx
                                                const isUserSlot = myMemberships[currentSelectedCycle.id]?.payout_order_index === slotIdx
                                                const isCompleted = slotIdx < currentSelectedCycle.current_payout_index

                                                return (
                                                    <div key={slotIdx} className="flex sm:flex-col items-center gap-4 sm:gap-2 z-10 w-full sm:w-auto">
                                                        <motion.div
                                                            className={`size-12 rounded-full flex flex-col justify-center items-center font-black text-sm border-2 relative transition-all ${
                                                                isActive 
                                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-110'
                                                                    : isCompleted
                                                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                                        : 'bg-card text-muted-foreground border-border'
                                                            }`}
                                                            animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                                                            transition={{ repeat: Infinity, duration: 2 }}
                                                        >
                                                            {slotIdx + 1}

                                                            {/* User label tag */}
                                                            {isUserSlot && (
                                                                <span className="absolute -bottom-6 sm:bottom-auto sm:-top-6 bg-purple-600 text-[8px] font-black tracking-widest text-white px-2 py-0.5 rounded-full uppercase border border-purple-500/20 shadow-sm shrink-0 whitespace-nowrap">
                                                                    MY SLOT
                                                                </span>
                                                            )}
                                                        </motion.div>
                                                        
                                                        <div className="text-left sm:text-center">
                                                            <p className="text-xs font-bold leading-none">
                                                                {isActive ? 'Current Pool' : isCompleted ? 'Payout Done' : 'Queued'}
                                                            </p>
                                                            <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                                                                Slot Index {slotIdx}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Buttons Panel */}
                                    <div className="flex flex-col sm:flex-row gap-4 border-t pt-4">
                                        {myMemberships[currentSelectedCycle.id] ? (
                                            <>
                                                <Button
                                                    onClick={() => handleSubmitContribution(currentSelectedCycle)}
                                                    disabled={submitting !== null}
                                                    className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-xl h-12 flex items-center justify-center gap-2"
                                                >
                                                    {submitting === 'contribution' ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <PiggyBank className="h-5 w-5" /> Submit Contribution Dues
                                                        </>
                                                    )}
                                                </Button>

                                                <Button
                                                    variant="outline"
                                                    onClick={() => triggerPayoutCronSimulator(currentSelectedCycle)}
                                                    disabled={submitting !== null}
                                                    className="flex-1 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-black rounded-xl h-12 flex items-center justify-center gap-2"
                                                >
                                                    {submitting === 'cron' ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Play className="h-4 w-4" /> Simulate Payout Distribution
                                                        </>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={() => {
                                                    setSelectedCycleForJoin(currentSelectedCycle)
                                                    setShowJoinModal(true)
                                                }}
                                                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-black rounded-xl h-12"
                                            >
                                                Register & Join Cycle Rotation
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Available Cooperatives List */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                            <h3 className="font-extrabold text-lg flex items-center gap-2 text-foreground">
                                <Building2 className="h-5 w-5 text-primary" /> Cooperative Trade Guilds
                            </h3>
                            <p className="text-xs text-muted-foreground font-medium">Join local trade associations to qualify for esusu group rotations.</p>

                            <div className="space-y-4 divide-y">
                                {cooperatives.map(coop => (
                                    <div key={coop.id} className="pt-4 first:pt-0 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-extrabold text-foreground leading-snug">{coop.name}</p>
                                            <Badge variant="outline" className="text-[9px] uppercase tracking-tighter bg-emerald-50 text-emerald-600 border-emerald-100">Verified</Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed">{coop.description}</p>
                                        <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold">
                                            <span>Active Cycles: 1</span>
                                            <span className="text-primary hover:underline cursor-pointer flex items-center gap-0.5">Explore <ArrowRight className="h-3 w-3" /></span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Join Esusu Cycle */}
            <AnimatePresence>
                {showJoinModal && selectedCycleForJoin && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowJoinModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black flex items-center gap-2">
                                    <UserCheck className="h-6 w-6 text-primary" /> Join Savings Rotation
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Join {selectedCycleForJoin.name} by linking your micro-banking account.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/50 rounded-xl space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Cycle Rotational Target:</span>
                                        <span className="font-black text-primary">₦{(selectedCycleForJoin.contribution_amount / 100).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Dues Timing:</span>
                                        <span className="font-black capitalize">{selectedCycleForJoin.frequency}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Assigned Rotation Slot:</span>
                                        <span className="font-black text-purple-600">Pending allocation (Ajo)</span>
                                    </div>
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-amber-600 leading-normal">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        By joining, you consent to automatic daily/weekly savings vault withdrawals and agree to platform rotational splits. KYC identity verification and BVN checks are required.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setShowJoinModal(false)}
                                        className="rounded-xl h-11 font-bold shadow-none"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={() => handleJoinCycle(selectedCycleForJoin)}
                                        disabled={submitting === 'join'}
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md hover:shadow-primary/20"
                                    >
                                        {submitting === 'join' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Joining Cycle'}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
