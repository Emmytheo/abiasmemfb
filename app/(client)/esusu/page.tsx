"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
    Users,
    TrendingUp,
    Calendar,
    PiggyBank,
    CheckCircle,
    Loader2,
    Play,
    DollarSign,
    PlusCircle,
    Wallet,
    Plus,
    RefreshCw,
    ArrowUpRight,
    ArrowDownLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"

interface Cooperative {
    id: string
    name: string
    description: string
    status: string
}

interface EsusuCycle {
    id: string
    name: string
    contribution_amount: number
    frequency: "daily" | "weekly" | "monthly"
    total_slots: number
    current_payout_index: number
    platform_fee_percent: number
    status: string
    cooperative_id: string
    vault_balance_kobo?: number
}

interface EsusuMember {
    id: string
    cycle_id: string
    payout_order_index: number
    status: string
}

interface PersonalSavingPlan {
    id: number
    name: string
    deduction_amount_kobo: number
    target_amount_kobo: number
    saved_amount_kobo: number
    frequency: "daily" | "weekly" | "monthly"
    source_account_number: string | null
    status: string
}

interface UserAccount {
    id: number
    account_number: string
    account_type: string
    balance: number
}

export default function EsusuClientPage() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()

    // Cooperative state
    const [cooperatives, setCooperatives] = React.useState<Cooperative[]>([])
    const [activeCycles, setActiveCycles] = React.useState<EsusuCycle[]>([])
    const [myMemberships, setMyMemberships] = React.useState<Record<string, EsusuMember>>({})
    const [contributions, setContributions] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState<string | null>(null)
    const [activeCycleTab, setActiveCycleTab] = React.useState<number>(0)

    // Personal Savings (Ajo) state
    const [personalPlans, setPersonalPlans] = React.useState<PersonalSavingPlan[]>([])
    const [userAccounts, setUserAccounts] = React.useState<UserAccount[]>([])
    const [showCreatePlanModal, setShowCreatePlanModal] = React.useState(false)
    const [planName, setPlanName] = React.useState("")
    const [planAmount, setPlanAmount] = React.useState("")
    const [planFrequency, setPlanFrequency] = React.useState<"daily" | "weekly" | "monthly">("daily")
    const [planTarget, setPlanTarget] = React.useState("")
    const [selectedSourceAccountId, setSelectedSourceAccountId] = React.useState("")

    // Cooperative Group Creation modal
    const [showGroupCreateModal, setShowGroupCreateModal] = React.useState(false)
    const [newGroupName, setNewGroupName] = React.useState("")
    const [newGroupDescription, setNewGroupDescription] = React.useState("")
    const [memberQuery, setMemberQuery] = React.useState("")
    const [groupMembersToAdd, setGroupMembersToAdd] = React.useState<Array<{ name: string; accountNumber: string }>>([])
    const [validatingMember, setValidatingMember] = React.useState(false)

    const loadAllData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [esusuRes, plansRes] = await Promise.all([
                fetch("/api/client/esusu", { cache: "no-store" }),
                fetch("/api/client/savings-plans", { cache: "no-store" }),
            ])

            if (esusuRes.ok) {
                const d = await esusuRes.json()
                setCooperatives(
                    (d.cooperatives || []).map((c: any) => ({
                        id: String(c.id),
                        name: c.name,
                        description: c.description || "",
                        status: c.status || "active",
                    }))
                )
                setActiveCycles(
                    (d.cycles || []).map((c: any) => ({
                        id: String(c.id),
                        name: c.name,
                        contribution_amount: Number(c.contribution_amount || 0),
                        frequency: c.frequency || "daily",
                        total_slots: Number(c.total_slots || 0),
                        current_payout_index: Number(c.current_payout_index || 0),
                        platform_fee_percent: Number(c.platform_fee_percent || 0),
                        status: c.status || "active",
                        cooperative_id: String(c.cooperative_id || ""),
                        vault_balance_kobo: Number(c.vault_balance_kobo || 0),
                    }))
                )
                const memMap: Record<string, EsusuMember> = {}
                for (const m of d.memberships || []) {
                    memMap[String(m.cycle_id)] = {
                        id: String(m.id),
                        cycle_id: String(m.cycle_id),
                        payout_order_index: Number(m.payout_order_index || 0),
                        status: m.status,
                    }
                }
                setMyMemberships(memMap)
                setContributions(d.contributions || [])
            }

            if (plansRes.ok) {
                const p = await plansRes.json()
                setPersonalPlans(p.plans || [])
                setUserAccounts(p.accounts || [])
                if ((p.accounts || []).length > 0 && !selectedSourceAccountId) {
                    setSelectedSourceAccountId(String(p.accounts[0].id))
                }
            }
        } catch (err) {
            console.error("Failed to load Esusu data:", err)
            toast.error("Failed to load Esusu vaults from core ledger")
        } finally {
            setLoading(false)
        }
    }, [selectedSourceAccountId])

    React.useEffect(() => {
        loadAllData()
    }, [])

    const totalContributedKobo = React.useMemo(
        () => contributions.reduce((sum, c) => sum + Number(c.amount || 0), 0),
        [contributions]
    )

    // Personal Savings Actions
    const handleCreatePersonalPlan = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!planName.trim() || !planAmount || !planTarget) return
        setSubmitting("create_plan")
        try {
            const res = await fetch("/api/client/savings-plans", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: planName.trim(),
                    deduction_amount_naira: Number(planAmount),
                    target_amount_naira: Number(planTarget),
                    frequency: planFrequency,
                    source_account_id: selectedSourceAccountId ? Number(selectedSourceAccountId) : null,
                }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) throw new Error(json.error || "Failed to create savings plan")
            toast.success(`Savings plan "${planName}" persisted to core ledger.`)
            setPlanName("")
            setPlanAmount("")
            setPlanTarget("")
            setShowCreatePlanModal(false)
            await loadAllData()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(null)
        }
    }

    const handlePlanAction = async (planId: number, action: "toggle_status" | "topup" | "liquidate") => {
        setSubmitting(`${action}_${planId}`)
        try {
            const res = await fetch("/api/client/savings-plans", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: planId, action }),
            })
            const json = await res.json()
            if (!res.ok || !json.success) throw new Error(json.error || `Action ${action} failed`)
            toast.success(
                action === "topup"
                    ? "Savings plan topped up atomically from linked bank account!"
                    : action === "liquidate"
                    ? "Saved funds liquidated back into your bank account!"
                    : "Auto-deduction status updated."
            )
            await loadAllData()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(null)
        }
    }

    // Cooperative Actions
    const handleJoinCycle = async (cycle: EsusuCycle) => {
        setSubmitting(`join_${cycle.id}`)
        try {
            const res = await fetch("/api/esusu/cycles/join", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cycle_id: cycle.id }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to join cycle")
            toast.success("Joined rotational Esusu cycle!")
            await loadAllData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSubmitting(null)
        }
    }

    const handleSubmitContribution = async (cycle: EsusuCycle) => {
        setSubmitting(`contrib_${cycle.id}`)
        try {
            const res = await fetch("/api/esusu/contributions/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cycle_id: cycle.id, amount: cycle.contribution_amount }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Contribution failed")
            toast.success("Esusu contribution posted atomically to holding vault!")
            await loadAllData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setSubmitting(null)
        }
    }

    const handleValidateMemberForDraft = async (e: React.FormEvent) => {
        e.preventDefault()
        const acc = memberQuery.trim()
        if (!acc) return
        setValidatingMember(true)
        try {
            const res = await fetch(`/api/account-lookup?accountNumber=${encodeURIComponent(acc)}`)
            const data = await res.json()
            if (!res.ok || !data.accountName) {
                toast.error(data.error || "No active customer account matches that number.")
                return
            }
            if (groupMembersToAdd.some((m) => m.accountNumber === acc)) {
                toast.warning("Member already validated in draft.")
                return
            }
            setGroupMembersToAdd((prev) => [...prev, { name: data.accountName, accountNumber: acc }])
            toast.success(`Verified: ${data.accountName}`)
            setMemberQuery("")
        } catch {
            toast.error("Core ledger lookup failed")
        } finally {
            setValidatingMember(false)
        }
    }

    const handleCreateCooperative = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName.trim()) {
            toast.error("Enter a cooperative union name")
            return
        }
        setSubmitting("create_coop")
        try {
            const res = await fetch("/api/esusu/cooperatives/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newGroupName.trim(),
                    description:
                        newGroupDescription.trim() ||
                        `Registered cooperative group (${groupMembersToAdd.length} verified founding members)`,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to register cooperative")
            toast.success(`Cooperative "${newGroupName}" registered on ${activeProfile.shortName}!`)
            setNewGroupName("")
            setNewGroupDescription("")
            setGroupMembersToAdd([])
            setShowGroupCreateModal(false)
            await loadAllData()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setSubmitting(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Loading trade cooperative ledger vaults...</p>
            </div>
        )
    }

    // Personal Scope: Individual Savings Vaults (Ajo)
    if (activeScope.type === "personal") {
        const totalPersonalSavedKobo = personalPlans.reduce((sum, p) => sum + Number(p.saved_amount_kobo || 0), 0)
        return (
            <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                            Individual Esusu Savings (Ajo)
                        </h1>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">
                            Persist targeted thrift wallets, top up atomically from your accounts, and liquidate on demand.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={loadAllData} className="rounded-xl h-11 font-bold gap-2">
                            <RefreshCw className="h-4 w-4" /> Refresh
                        </Button>
                        <Button
                            onClick={() => setShowCreatePlanModal(true)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 h-11 shadow-lg flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" /> New Savings Plan
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">Core Ledger</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Ajo Vault Balance</p>
                        <p className="text-3xl font-black mt-1">₦{(totalPersonalSavedKobo / 100).toLocaleString()}</p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <span className="text-xs text-emerald-500 font-bold uppercase">Live DB</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Savings Plans</p>
                        <p className="text-3xl font-black mt-1">
                            {personalPlans.filter((p) => p.status === "active").length} active
                        </p>
                    </div>

                    <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                                {userAccounts.length} Accounts
                            </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Funding Accounts</p>
                        <p className="text-xl font-black mt-2 truncate">
                            {userAccounts[0]
                                ? `${userAccounts[0].account_type} · ${userAccounts[0].account_number}`
                                : "No active account"}
                        </p>
                    </div>
                </div>

                {personalPlans.length === 0 ? (
                    <div className="bg-card border border-dashed rounded-2xl p-12 text-center space-y-3">
                        <PiggyBank className="h-12 w-12 text-primary/40 mx-auto" />
                        <h3 className="text-lg font-bold">No personal savings plans yet</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                            Create a dedicated Ajo vault for rent, inventory restocking, or school fees and fund it directly from your bank account.
                        </p>
                        <Button onClick={() => setShowCreatePlanModal(true)} className="rounded-xl font-bold mt-2">
                            Create First Savings Plan
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {personalPlans.map((plan) => {
                            const savedNaira = Number(plan.saved_amount_kobo) / 100
                            const targetNaira = Math.max(1, Number(plan.target_amount_kobo) / 100)
                            const deductNaira = Number(plan.deduction_amount_kobo) / 100
                            const percent = Math.min(100, Math.floor((savedNaira / targetNaira) * 100))
                            return (
                                <div key={plan.id} className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            <h3 className="text-lg font-black">{plan.name}</h3>
                                            <p className="text-xs text-muted-foreground font-semibold">
                                                ₦{deductNaira.toLocaleString()} {plan.frequency} · Source:{" "}
                                                <span className="font-mono">{plan.source_account_number || "Primary Account"}</span>
                                            </p>
                                        </div>
                                        <Badge
                                            variant="outline"
                                            className={`text-[10px] uppercase font-bold ${
                                                plan.status === "active"
                                                    ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    : "bg-amber-50 text-amber-600 border-amber-100"
                                            }`}
                                        >
                                            {plan.status}
                                        </Badge>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-bold">
                                            <span className="text-muted-foreground">Progress ({percent}%)</span>
                                            <span>
                                                ₦{savedNaira.toLocaleString()} / ₦{targetNaira.toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                                            <div className="bg-primary h-full rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2 pt-2">
                                        <Button
                                            size="sm"
                                            onClick={() => handlePlanAction(plan.id, "topup")}
                                            disabled={submitting !== null || plan.status === "completed"}
                                            className="h-9 font-bold rounded-xl gap-1"
                                        >
                                            <ArrowUpRight className="h-3.5 w-3.5" /> Top Up ₦{deductNaira.toLocaleString()}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handlePlanAction(plan.id, "liquidate")}
                                            disabled={submitting !== null || savedNaira <= 0}
                                            className="h-9 font-bold rounded-xl gap-1"
                                        >
                                            <ArrowDownLeft className="h-3.5 w-3.5" /> Liquidate
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePlanAction(plan.id, "toggle_status")}
                                            disabled={submitting !== null || plan.status === "completed"}
                                            className="h-9 font-bold rounded-xl"
                                        >
                                            {plan.status === "active" ? "Pause" : "Resume"}
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {showCreatePlanModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowCreatePlanModal(false)} />
                        <div className="bg-card border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6">
                            <div>
                                <h3 className="text-xl font-black">Create Personal Savings Vault</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                                    Backed by live core ledger balances on {activeProfile.shortName}.
                                </p>
                            </div>
                            <form onSubmit={handleCreatePersonalPlan} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Goal Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Shop Rent, Inventory Float"
                                        value={planName}
                                        onChange={(e) => setPlanName(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Contribution Step (₦)</label>
                                        <input
                                            type="number"
                                            min="100"
                                            required
                                            placeholder="2000"
                                            value={planAmount}
                                            onChange={(e) => setPlanAmount(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Frequency</label>
                                        <select
                                            value={planFrequency}
                                            onChange={(e) => setPlanFrequency(e.target.value as any)}
                                            className="w-full bg-muted border rounded-xl h-11 px-3 text-xs font-semibold"
                                        >
                                            <option value="daily">Daily</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Target Goal (₦)</label>
                                        <input
                                            type="number"
                                            min="500"
                                            required
                                            placeholder="100000"
                                            value={planTarget}
                                            onChange={(e) => setPlanTarget(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Funding Account</label>
                                        <select
                                            value={selectedSourceAccountId}
                                            onChange={(e) => setSelectedSourceAccountId(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-11 px-3 text-xs font-semibold"
                                        >
                                            {userAccounts.length === 0 && <option value="">Primary Account</option>}
                                            {userAccounts.map((a) => (
                                                <option key={a.id} value={String(a.id)}>
                                                    {a.account_type} ({a.account_number})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" className="rounded-xl h-10 font-bold" onClick={() => setShowCreatePlanModal(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={submitting === "create_plan"} className="bg-primary text-primary-foreground font-black rounded-xl h-10 px-5">
                                        {submitting === "create_plan" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Savings Plan"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        )
    }

    // Cooperative Scope
    const currentSelectedCycle = activeCycles[activeCycleTab]

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                        Cooperative Rotational Esusu
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Participate in verified rotational cycles, validate members against the live core register, and register new cooperative unions.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadAllData} className="rounded-xl h-11 font-bold gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button
                        onClick={() => setShowGroupCreateModal(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 h-11 shadow-lg flex items-center gap-2"
                    >
                        <PlusCircle className="h-5 w-5" /> Register Cooperative
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <PiggyBank className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase bg-emerald-50 text-emerald-600 border-emerald-200">
                            Verified
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">My Total Contributions</p>
                    <p className="text-2xl font-black mt-1">₦{(totalContributedKobo / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Users className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Registered Cooperatives</p>
                    <p className="text-2xl font-black mt-1">{cooperatives.length}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Calendar className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Rotational Cycles</p>
                    <p className="text-2xl font-black mt-1">{activeCycles.length} Active</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-lg text-amber-500">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase">Ledger Vault</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">My Active Slots</p>
                    <p className="text-2xl font-black mt-1">{Object.keys(myMemberships).length}</p>
                </div>
            </div>

            {activeCycles.length === 0 ? (
                <div className="bg-card border border-dashed rounded-2xl p-12 text-center space-y-3">
                    <Users className="h-12 w-12 text-primary/40 mx-auto" />
                    <h3 className="text-lg font-bold">No active Esusu rotational cycles</h3>
                    <p className="text-xs text-muted-foreground">
                        Register a cooperative group or ask your bank administrator to activate a rotational thrift cycle.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 gap-4">
                                <div>
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-primary" /> Active Esusu Rotation
                                    </h2>
                                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">
                                        Live rotation queue backed by holding vault accounts.
                                    </p>
                                </div>
                                <div className="flex gap-1 bg-muted p-1 rounded-xl flex-wrap">
                                    {activeCycles.map((c, i) => (
                                        <button
                                            key={c.id}
                                            onClick={() => setActiveCycleTab(i)}
                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                                                activeCycleTab === i
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            {c.name.split(" ")[0]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {currentSelectedCycle && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl">
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Contribution</p>
                                            <p className="text-sm font-black text-primary">
                                                ₦{(currentSelectedCycle.contribution_amount / 100).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Frequency</p>
                                            <p className="text-sm font-black capitalize">{currentSelectedCycle.frequency}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Target Pool</p>
                                            <p className="text-sm font-black text-emerald-500">
                                                ₦{((currentSelectedCycle.contribution_amount * currentSelectedCycle.total_slots) / 100).toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase">Vault Balance</p>
                                            <p className="text-sm font-black">
                                                ₦{((currentSelectedCycle.vault_balance_kobo || 0) / 100).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                                            Rotational Queue ({currentSelectedCycle.total_slots} Slots)
                                        </h3>
                                        <div className="flex flex-wrap gap-4 py-3 px-4 bg-muted/15 rounded-xl border">
                                            {Array.from({ length: Math.min(currentSelectedCycle.total_slots, 12) }).map((_, slotIdx) => {
                                                const isActive = currentSelectedCycle.current_payout_index === slotIdx
                                                const isUserSlot = myMemberships[currentSelectedCycle.id]?.payout_order_index === slotIdx
                                                const isCompleted = slotIdx < currentSelectedCycle.current_payout_index
                                                return (
                                                    <div key={slotIdx} className="flex flex-col items-center gap-1.5 min-w-[68px]">
                                                        <motion.div
                                                            className={`size-11 rounded-full flex items-center justify-center font-black text-sm border-2 ${
                                                                isActive
                                                                    ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                                    : isCompleted
                                                                    ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                                                                    : "bg-card text-muted-foreground border-border"
                                                            }`}
                                                        >
                                                            {isCompleted ? <CheckCircle className="h-5 w-5" /> : slotIdx + 1}
                                                        </motion.div>
                                                        <span className="text-[10px] font-bold">
                                                            {isUserSlot ? "YOU" : `Slot ${slotIdx + 1}`}
                                                        </span>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        {myMemberships[currentSelectedCycle.id] ? (
                                            <Button
                                                onClick={() => handleSubmitContribution(currentSelectedCycle)}
                                                disabled={submitting !== null}
                                                className="flex-1 bg-primary text-primary-foreground font-black h-12 rounded-xl gap-2"
                                            >
                                                {submitting === `contrib_${currentSelectedCycle.id}` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Play className="h-4 w-4" />
                                                )}
                                                Pay ₦{(currentSelectedCycle.contribution_amount / 100).toLocaleString()} Contribution
                                            </Button>
                                        ) : (
                                            <Button
                                                onClick={() => handleJoinCycle(currentSelectedCycle)}
                                                disabled={submitting !== null}
                                                className="flex-1 bg-primary text-primary-foreground font-black h-12 rounded-xl"
                                            >
                                                {submitting === `join_${currentSelectedCycle.id}` ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    "Join This Rotational Cycle"
                                                )}
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Registered Cooperatives & Recent Contributions */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Registered Cooperatives</h3>
                            <div className="space-y-3">
                                {cooperatives.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No cooperatives registered yet.</p>
                                ) : (
                                    cooperatives.map((c) => (
                                        <div key={c.id} className="p-3 bg-muted/30 rounded-xl border space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-xs font-black">{c.name}</p>
                                                <Badge variant="outline" className="text-[9px] uppercase">
                                                    {c.status}
                                                </Badge>
                                            </div>
                                            {c.description && <p className="text-[11px] text-muted-foreground">{c.description}</p>}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
                            <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">My Recent Contributions</h3>
                            <div className="divide-y text-xs">
                                {contributions.length === 0 ? (
                                    <p className="text-muted-foreground py-2">No contributions posted yet.</p>
                                ) : (
                                    contributions.slice(0, 6).map((c) => (
                                        <div key={c.id} className="py-2.5 flex justify-between items-center">
                                            <span className="font-semibold text-muted-foreground">
                                                {new Date(c.created_at).toLocaleDateString()}
                                            </span>
                                            <span className="font-black text-emerald-600">
                                                ₦{(Number(c.amount || 0) / 100).toLocaleString()}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Register Cooperative Group */}
            {showGroupCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowGroupCreateModal(false)} />
                    <div className="bg-card border w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 relative space-y-5 max-h-[90vh] overflow-y-auto">
                        <div>
                            <h3 className="text-xl font-black">Register Cooperative Union</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                Persist a new cooperative union in the core ledger and verify founding members by account number.
                            </p>
                        </div>

                        <form onSubmit={handleCreateCooperative} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold">Cooperative Union Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder={`e.g. ${activeProfile.demoCoopName}`}
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    className="w-full bg-muted border rounded-xl h-11 px-4 text-xs font-semibold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold">Description / Charter</label>
                                <textarea
                                    rows={2}
                                    placeholder="Describe membership criteria and contribution schedule..."
                                    value={newGroupDescription}
                                    onChange={(e) => setNewGroupDescription(e.target.value)}
                                    className="w-full bg-muted border rounded-xl p-3 text-xs font-semibold"
                                />
                            </div>

                            <div className="space-y-2 border-t pt-3">
                                <label className="text-xs font-bold">Verify Founding Member Account (Optional)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Enter 10-digit account number"
                                        value={memberQuery}
                                        onChange={(e) => setMemberQuery(e.target.value)}
                                        className="flex-1 bg-muted border rounded-xl h-10 px-3 text-xs font-mono"
                                    />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        disabled={validatingMember}
                                        onClick={handleValidateMemberForDraft}
                                        className="rounded-xl h-10 text-xs font-bold"
                                    >
                                        {validatingMember ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
                                    </Button>
                                </div>
                                {groupMembersToAdd.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {groupMembersToAdd.map((m) => (
                                            <Badge key={m.accountNumber} variant="outline" className="text-[10px]">
                                                {m.name} ({m.accountNumber})
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowGroupCreateModal(false)} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={submitting === "create_coop"} className="rounded-xl font-black">
                                    {submitting === "create_coop" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Register Cooperative"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
