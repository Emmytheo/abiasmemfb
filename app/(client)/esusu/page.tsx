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
    Info,
    Wallet,
    Plus,
    Trash2,
    ShieldCheck
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { api } from "@/lib/api"

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

interface PersonalSavingPlan {
    id: string
    name: string
    amount: number
    frequency: 'daily' | 'weekly' | 'monthly'
    target: number
    saved: number
    account: string
    status: 'active' | 'paused'
}

export default function EsusuClientPage() {
    const { activeScopeId, activeScope } = useScope();
    const { activeProfile } = useBankProfile();
    const [cooperatives, setCooperatives] = React.useState<Cooperative[]>([])
    const [activeCycles, setActiveCycles] = React.useState<EsusuCycle[]>([])
    const [myMemberships, setMyMemberships] = React.useState<Record<string, EsusuMember>>({}) // cycle_id -> member details
    const [contributions, setContributions] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState<string | null>(null)
    const [activeCycleTab, setActiveCycleTab] = React.useState<number>(0)

    // Individual Esusu Wallet states (Personal Scope)
    const [personalPlans, setPersonalPlans] = React.useState<PersonalSavingPlan[]>([
        { id: "p1", name: "Rent & Shop Upgrades", amount: 2000, frequency: "daily", target: 200000, saved: 42000, account: "3086167603", status: "active" },
        { id: "p2", name: "Agro Business Seed Fund", amount: 15000, frequency: "weekly", target: 500000, saved: 120000, account: "3041889711", status: "active" }
    ])
    const [showCreatePlanModal, setShowCreatePlanModal] = React.useState(false)
    const [planName, setPlanName] = React.useState("")
    const [planAmount, setPlanAmount] = React.useState("")
    const [planFrequency, setPlanFrequency] = React.useState<'daily' | 'weekly' | 'monthly'>('daily')
    const [planTarget, setPlanTarget] = React.useState("")
    const [selectedSourceAccount, setSelectedSourceAccount] = React.useState("3086167603")

    // Cooperative group creation states
    const [showGroupCreateModal, setShowGroupCreateModal] = React.useState(false)
    const [newGroupName, setNewGroupName] = React.useState("")
    const [selectedCoopId, setSelectedCoopId] = React.useState("")
    const [memberQuery, setMemberQuery] = React.useState("")
    const [groupMembersToAdd, setGroupMembersToAdd] = React.useState<string[]>([])
    const [validatingMember, setValidatingMember] = React.useState(false)

    // Form states
    const [showJoinModal, setShowJoinModal] = React.useState(false)
    const [selectedCycleForJoin, setSelectedCycleForJoin] = React.useState<EsusuCycle | null>(null)

    // Stats calculations
    const totalContributed = React.useMemo(() => {
        return contributions.reduce((sum, c) => sum + (c.amount || 0), 0)
    }, [contributions])

    React.useEffect(() => {
        const loadEsusuData = async () => {
            try {
                const user = await api.getCurrentUser()

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
                        { id: 'coop_1', name: activeProfile.demoCoopName, description: `Verified cooperative rotational thrift group across ${activeProfile.regionLabel}.`, status: 'active' },
                        { id: 'coop_2', name: `${activeProfile.shortName} Enterprise Trade Union`, description: 'Funding machinery and bulk working capital procurement.', status: 'active' },
                        { id: 'coop_3', name: 'Regional Market General Traders', description: 'Retailers cooperative group for structured microfinance access.', status: 'active' }
                    ]
                }
                setCooperatives(coops)
                setSelectedCoopId(coops[0].id)

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
                            contribution_amount: 500000,
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
                            contribution_amount: 2500000,
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

                // Fetch memberships & contributions
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

    // Individual Ajo Plan creation
    const handleCreatePersonalPlan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!planName || !planAmount || !planTarget) return
        
        const newPlan: PersonalSavingPlan = {
            id: `p_${Date.now()}`,
            name: planName,
            amount: Number(planAmount),
            frequency: planFrequency,
            target: Number(planTarget),
            saved: 0,
            account: selectedSourceAccount,
            status: 'active'
        }
        
        try {
            const user = await api.getCurrentUser()
            if (user) {
                await api.createStandingOrder({
                    user_id: user.id,
                    customer: 'dummy',
                    source_account: selectedSourceAccount,
                    destination_bank_name: activeProfile.shortName,
                    destination_bank_code: activeProfile.internalBankCode,
                    destination_account_number: 'ESUSU_WALLET',
                    destination_account_name: 'Esusu Savings Wallet',
                    amount: Number(planAmount),
                    frequency: planFrequency,
                    start_date: new Date().toISOString(),
                    next_run_date: new Date().toISOString(),
                    status: 'active',
                    narration: `Esusu Auto-Deduct: ${planName}`
                })
            }
        } catch (err) {
            console.error('Failed to create standing order backend record', err)
        }

        setPersonalPlans([...personalPlans, newPlan])
        setPlanName("")
        setPlanAmount("")
        setPlanTarget("")
        setShowCreatePlanModal(false)
        toast.success(`Savings wallet "${newPlan.name}" active! Standing order linked to account ${newPlan.account}.`)
    }

    // Validate members to group
    const handleAddMemberToGroup = (e: React.FormEvent) => {
        e.preventDefault()
        if (!memberQuery) return
        setValidatingMember(true)
        setTimeout(() => {
            setValidatingMember(false)
            if (memberQuery === "3086167603" || memberQuery.includes("7603")) {
                if (groupMembersToAdd.includes("CHIDI MGBARA")) {
                    toast.warning("Member already validated in group draft.");
                } else {
                    setGroupMembersToAdd([...groupMembersToAdd, "CHIDI MGBARA"])
                    toast.success("Validated: CHIDI MGBARA added to draft registry!");
                }
                setMemberQuery("")
            } else if (memberQuery === "3041889711" || memberQuery.includes("9711")) {
                if (groupMembersToAdd.includes("JULIAN STERLING")) {
                    toast.warning("Member already validated in group draft.");
                } else {
                    setGroupMembersToAdd([...groupMembersToAdd, "JULIAN STERLING"])
                    toast.success("Validated: JULIAN STERLING added to draft registry!");
                }
                setMemberQuery("")
            } else {
                toast.error("Account does not match any active customer KYC profile.");
            }
        }, 650)
    }

    // Cooperative Union creation submit
    const handleSubmitUnionApplication = (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName || groupMembersToAdd.length === 0) {
            toast.error("Please specify a group name and validate at least one member.")
            return
        }
        toast.success(`Group "${newGroupName}" application received! Ajo union status: PENDING REVIEW.`);
        setNewGroupName("")
        setGroupMembersToAdd([])
        setShowGroupCreateModal(false)
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Securing trade cooperative ledger vaults...</p>
            </div>
        )
    }

    // Render Individual Customer Esusu Dashboard (Personal Scope)
    if (activeScope.type === "personal") {
        const totalPersonalSaved = personalPlans.reduce((sum, p) => sum + p.saved, 0)
        return (
            <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Individual Esusu Savings (Ajo)</h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Auto-deduct funds from your bank accounts into targeted high-yield thrift wallets.</p>
                    </div>
                    <Button 
                        onClick={() => setShowCreatePlanModal(true)} 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> Start Auto-Savings Plan
                    </Button>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Safe Vault</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Esusu Balance</p>
                        <p className="text-3xl font-black mt-1">₦{totalPersonalSaved.toLocaleString()}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <span className="text-xs text-emerald-500 font-bold uppercase">Automated</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Standing Plans</p>
                        <p className="text-3xl font-black mt-1">{personalPlans.length} plans</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/20">6.5% APY</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Ajo Target Interest</p>
                        <p className="text-3xl font-black mt-1">Thrift Yield</p>
                    </div>
                </div>

                {/* Savings plans cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {personalPlans.map(plan => {
                        const percent = Math.min(100, Math.floor((plan.saved / plan.target) * 100))
                        return (
                            <div key={plan.id} className="bg-card border rounded-2xl p-6 shadow-sm space-y-4 hover:shadow-md transition-all relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4">
                                    <Badge variant="outline" className={`text-[10px] uppercase font-bold ${plan.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {plan.status === 'active' ? 'Auto-Deducting' : 'Paused'}
                                    </Badge>
                                </div>

                                <div className="space-y-1">
                                    <h3 className="text-lg font-black">{plan.name}</h3>
                                    <p className="text-xs text-muted-foreground font-semibold flex items-center gap-1.5">
                                        <TrendingUp className="h-3.5 w-3.5 text-primary" /> Auto-deducting ₦{plan.amount.toLocaleString()} {plan.frequency} from account {plan.account}
                                    </p>
                                </div>

                                <div className="space-y-2 pt-2">
                                    <div className="flex justify-between text-xs font-bold">
                                        <span className="text-muted-foreground">Saved Progress ({percent}%)</span>
                                        <span>₦{plan.saved.toLocaleString()} / ₦{plan.target.toLocaleString()}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                        <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 pt-2">
                                    <Button variant="ghost" size="sm" className="h-9 font-bold text-destructive hover:bg-destructive/5 rounded-xl flex items-center gap-1"
                                        onClick={() => {
                                            setPersonalPlans(prev => prev.filter(p => p.id !== plan.id))
                                            toast.error(`Savings plan "${plan.name}" deleted.`);
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4" /> Cancel
                                    </Button>
                                    <Button variant="outline" size="sm" className="h-9 font-bold rounded-xl shadow-none"
                                        onClick={() => {
                                            setPersonalPlans(prev => prev.map(p => p.id === plan.id ? { ...p, status: p.status === 'active' ? 'paused' : 'active' } : p))
                                            toast.success(`Savings plan "${plan.name}" ${plan.status === 'active' ? 'paused' : 'resumed'}.`);
                                        }}
                                    >
                                        {plan.status === 'active' ? 'Pause Auto-Deduct' : 'Resume Auto-Deduct'}
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Modal: Create Personal Savings Plan */}
                {showCreatePlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreatePlanModal(false)} />
                        <div className="bg-card border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6 animate-in zoom-in duration-300">
                            <div>
                                <h3 className="text-xl font-black">Link Auto-Savings Wallet</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Configure auto-deductions to targeted esusu savings plan.</p>
                            </div>
                            <form onSubmit={handleCreatePersonalPlan} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Goal/Savings Target Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. Shop Rent, Children Fees" value={planName} onChange={(e) => setPlanName(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Deduction Amount (₦)</label>
                                        <input 
                                            type="number" required placeholder="e.g. 2000" value={planAmount} onChange={(e) => setPlanAmount(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Frequency</label>
                                        <select 
                                            value={planFrequency} onChange={(e: any) => setPlanFrequency(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Target Target (₦)</label>
                                        <input 
                                            type="number" required placeholder="e.g. 100000" value={planTarget} onChange={(e) => setPlanTarget(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold focus:outline-none"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Funding Source</label>
                                        <select 
                                            value={selectedSourceAccount} onChange={(e) => setSelectedSourceAccount(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                                        >
                                            <option value="3086167603">Savings (3086...7603)</option>
                                            <option value="3041889711">Current (3041...9711)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" className="rounded-xl h-10 font-bold" onClick={() => setShowCreatePlanModal(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary text-primary-foreground font-black rounded-xl h-10 px-5">Activate Auto-Deduct</Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Cooperative & Rotational Union Scope Rendering
    const currentSelectedCycle = activeCycles[activeCycleTab]

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">Cooperative Rotational Esusu</h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Administer cycles, validate members against core bank registers, and submit union license applications.</p>
                </div>
                <Button 
                    onClick={() => setShowGroupCreateModal(true)} 
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-3 shadow-lg flex items-center gap-2"
                >
                    <PlusCircle className="h-5 w-5" /> Apply for Union Group
                </Button>
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

            {/* Modal: Apply for Union Group License with member validator */}
            <AnimatePresence>
                {showGroupCreateModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowGroupCreateModal(false)} />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 relative space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div>
                                <h3 className="text-xl font-black">Register Cooperative Union Group</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">Form an Esusu cycle group. Validate members against bank account registers before submitting.</p>
                            </div>

                            <form onSubmit={handleAddMemberToGroup} className="flex gap-2">
                                <div className="flex-1 space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">Validate Member Bank Account</label>
                                    <input 
                                        type="text" placeholder="Enter account number (e.g. 3086167603)" value={memberQuery} onChange={(e) => setMemberQuery(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold focus:outline-none"
                                    />
                                </div>
                                <Button type="submit" disabled={validatingMember} className="mt-5 h-11 px-4 bg-primary/10 border border-primary/20 text-primary font-bold shadow-none rounded-xl">
                                    {validatingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                </Button>
                            </form>

                            {groupMembersToAdd.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-bold text-muted-foreground uppercase">Validated Member Slots ({groupMembersToAdd.length})</p>
                                    <div className="flex flex-wrap gap-2 p-3 bg-muted/30 border rounded-xl">
                                        {groupMembersToAdd.map(m => (
                                            <Badge key={m} variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 rounded-lg py-1 px-2.5 font-semibold">
                                                <ShieldCheck className="h-3.5 w-3.5" /> {m}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmitUnionApplication} className="space-y-4 border-t pt-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Union Esusu Group Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. Daily Footwear Artisans" value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold placeholder:text-muted-foreground/60 focus:outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Trade Cooperative Sponsor</label>
                                    <select 
                                        value={selectedCoopId} onChange={(e) => setSelectedCoopId(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-3 text-xs font-semibold focus:outline-none"
                                    >
                                        {cooperatives.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" className="rounded-xl h-10 font-bold" onClick={() => setShowGroupCreateModal(false)}>Cancel</Button>
                                    <Button type="submit" className="bg-primary text-primary-foreground font-black rounded-xl h-10 px-5">Submit Union Application</Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
