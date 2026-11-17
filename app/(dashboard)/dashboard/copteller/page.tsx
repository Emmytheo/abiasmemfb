"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    ShieldAlert, CheckCircle2, XCircle, RefreshCw, Users, Truck,
    Building2, Award, Activity, BarChart3, TrendingUp, KeyRound,
    AlertCircle, Clock, Download, Plus, Eye, Check, X, Zap,
    Layers, CircleDollarSign, Globe, Lock, ArrowUpRight, Bell
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useSearchParams } from "next/navigation"

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, string> = {
        "Active": "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        "Pending": "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400",
        "Approved": "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        "Rejected": "bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400",
        "Live": "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
        "Open": "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    }
    return (
        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${map[status] ?? 'bg-slate-100 border-slate-200 text-slate-500'}`}>
            {status}
        </span>
    )
}

function WorkflowLog({ steps, active }: { steps: string[], active: number }) {
    return (
        <div className="bg-[#030303] border border-emerald-900/20 rounded-2xl p-4 font-mono text-[11px] space-y-1.5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-900">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Audit Engine</span>
                <div className="ml-auto flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-rose-500/50" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/50" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
                </div>
            </div>
            {steps.map((s, i) => (
                <div key={i} className={`flex items-start gap-2 ${i <= active ? 'text-emerald-400' : 'text-slate-700'}`}>
                    <span className="text-emerald-700">›</span> {s}
                </div>
            ))}
        </div>
    )
}

function CoptellerSuperadminPageContent() {
    const [activeTab, setActiveTab] = React.useState<'overview' | 'unions' | 'grants' | 'assets' | 'vault' | 'compliance'>('overview')
    const [coopsList, setCoopsList] = React.useState<any[]>([])
    const [loansList, setLoansList] = React.useState<any[]>([])
    const [totalCoops, setTotalCoops] = React.useState(47)
    const [workflowRunning, setWorkflowRunning] = React.useState(false)
    const [workflowStep, setWorkflowStep] = React.useState(-1)
    const [loadingData, setLoadingData] = React.useState(true)

    const searchParams = useSearchParams()
    const tab = searchParams?.get('tab')

    React.useEffect(() => {
        if (tab && ['overview', 'unions', 'grants', 'assets', 'vault', 'compliance'].includes(tab)) {
            setActiveTab(tab as any)
        }
    }, [tab])

    React.useEffect(() => {
        const fetchOversightData = async () => {
            try {
                const coopRes = await fetch('/api/cooperatives?limit=100')
                const coopData = await coopRes.json()
                const docs = coopData.cooperatives || coopData.docs || []
                if (docs.length > 0) {
                    setCoopsList(docs)
                    const activeCount = docs.filter((c: any) => c.status === 'active').length
                    if (activeCount > 0) setTotalCoops(activeCount)
                }

                const loanRes = await fetch('/api/loans?limit=100')
                const loanData = await loanRes.json()
                const lDocs = loanData.loans || loanData.docs || []
                if (lDocs.length > 0) {
                    setLoansList(lDocs)
                }
            } catch (err) {
                console.warn('Failed to load oversight records', err)
            } finally {
                setLoadingData(false)
            }
        }
        fetchOversightData()
    }, [])

    // Map database lists to UI lists with demo fallbacks
    const dbPendingCoops = coopsList.filter((c: any) => c.status !== 'active').map((c: any) => ({
        id: c.id,
        name: c.name,
        sponsor: c.description || 'Artisan Sponsor Union',
        members: 42,
        regNo: `COOP-AB-${c.id.slice(-3).toUpperCase()}`
    }))

    const pendingCoops = dbPendingCoops.length > 0 ? dbPendingCoops : [
        { id: "coop_demo_1", name: "Aba North Keke Drivers Cooperative", sponsor: "Aba Transport Guild", members: 42, regNo: "COOP-AB-981" },
        { id: "coop_demo_2", name: "Ariaria Leatherworkers Thrift Union", sponsor: "Aba Leather & Shoe Makers", members: 120, regNo: "COOP-AB-405" },
    ]

    const dbPendingGrants = loansList.filter((l: any) => l.status === 'pending').map((l: any) => ({
        id: l.id,
        name: typeof l.customer === 'object' && l.customer ? `${l.customer.firstName || ''} ${l.customer.lastName || ''}`.trim() : 'Coop Member',
        coop: 'Artisan Alliance Guild',
        type: l.purpose || 'Equipment Expansion Loan',
        amt: (l.principal || 20000000) / 100
    }))

    const pendingGrants = dbPendingGrants.length > 0 ? dbPendingGrants : [
        { id: "loan_demo_101", name: "Chinedu Okafor", coop: "Aba North Keke Drivers", type: "Transport Tooling Grant", amt: 200000 },
        { id: "loan_demo_102", name: "Sarah Johnson", coop: "Daily Footwear Artisans", type: "SME Growth Grant", amt: 200000 },
    ]

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab)
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href)
            url.searchParams.set('tab', tab)
            window.history.pushState({}, '', url.toString())
        }
    }

    const runAuditWorkflow = () => {
        setWorkflowRunning(true)
        setWorkflowStep(-1)
        const steps = [0, 1, 2, 3, 4]
        steps.forEach((s, i) => setTimeout(() => {
            setWorkflowStep(s)
            if (s === 4) setTimeout(() => {
                setWorkflowRunning(false)
                toast.success("Full platform audit complete — all vaults reconciled.")
            }, 800)
        }, i * 1100))
    }

    const approveCoop = async (id: string | number, name: string) => {
        const isDemo = String(id).startsWith('coop_demo')
        if (isDemo) {
            toast.success(`"${name}" approved and registered under the bank license (Simulation).`)
            return
        }

        const tId = toast.loading(`Registering cooperative under license...`)
        try {
            const res = await fetch('/api/copteller/admin/cooperatives', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cooperative_id: id, status: 'active' })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`"${name}" approved and registered under bank license!`, { id: tId })
                setCoopsList(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c))
                setTotalCoops(t => t + 1)
            } else {
                toast.error(data.error || 'Failed to update status', { id: tId })
            }
        } catch (err) {
            toast.error('Network request failed', { id: tId })
        }
    }

    const rejectCoop = async (id: string | number) => {
        const isDemo = String(id).startsWith('coop_demo')
        if (isDemo) {
            toast.error("Cooperative registration rejected (Simulation).")
            return
        }

        const tId = toast.loading(`Suspending cooperative registration...`)
        try {
            const res = await fetch('/api/copteller/admin/cooperatives', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cooperative_id: id, status: 'suspended' })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Cooperative registration rejected.`, { id: tId })
                setCoopsList(prev => prev.map(c => c.id === id ? { ...c, status: 'suspended' } : c))
            } else {
                toast.error(data.error || 'Failed to update status', { id: tId })
            }
        } catch (err) {
            toast.error('Network request failed', { id: tId })
        }
    }

    const disburseGrant = async (id: string | number, name: string, amt: number) => {
        const isDemo = String(id).startsWith('loan_demo')
        if (isDemo) {
            toast.success(`₦${amt.toLocaleString()} disbursed to ${name} via escrow (Simulation).`)
            return
        }

        const tId = toast.loading(`Disbursing ₦${amt.toLocaleString()} via core clearing vault...`)
        try {
            const res = await fetch('/api/copteller/admin/loans', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loan_id: id, status: 'active' })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`₦${amt.toLocaleString()} disbursed to ${name} successfully!`, { id: tId })
                setLoansList(prev => prev.map(l => l.id === id ? { ...l, status: 'active' } : l))
            } else {
                toast.error(data.error || 'Failed to disburse funds', { id: tId })
            }
        } catch (err) {
            toast.error('Network request failed', { id: tId })
        }
    }

    const rejectGrant = async (id: string | number) => {
        const isDemo = String(id).startsWith('loan_demo')
        if (isDemo) {
            toast.error("Grant application rejected (Simulation).")
            return
        }

        const tId = toast.loading(`Rejecting grant application...`)
        try {
            const res = await fetch('/api/copteller/admin/loans', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ loan_id: id, status: 'defaulted' })
            })
            const data = await res.json()
            if (data.success) {
                toast.success(`Grant application rejected successfully.`, { id: tId })
                setLoansList(prev => prev.map(l => l.id === id ? { ...l, status: 'defaulted' } : l))
            } else {
                toast.error(data.error || 'Failed to update status', { id: tId })
            }
        } catch (err) {
            toast.error('Network request failed', { id: tId })
        }
    }

    const tabs = [
        { key: 'overview', label: 'Overview' },
        { key: 'unions', label: `Unions (${pendingCoops.length} pending)`, badge: pendingCoops.length },
        { key: 'grants', label: `Grants (${pendingGrants.length} pending)`, badge: pendingGrants.length },
        { key: 'assets', label: 'HP Assets' },
        { key: 'vault', label: 'Vault & APIs' },
        { key: 'compliance', label: 'Compliance' },
    ] as const

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-rose-500/20">
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 right-[20%] w-[400px] h-[400px] bg-rose-500/3 dark:bg-rose-500/4 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-[15%] w-[350px] h-[350px] bg-emerald-500/3 dark:bg-emerald-500/4 rounded-full blur-[120px]" />
            </div>

            <div className="relative z-10 max-w-6xl mx-auto px-6 py-8 space-y-6">

                {/* ── HEADER ───────────────────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="p-1.5 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                            </div>
                            <p className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">Bank Superadmin Console</p>
                        </div>
                        <h1 className="text-2xl font-black">Copteller Platform Oversight</h1>
                        <p className="text-xs text-muted-foreground font-semibold mt-0.5">Licensed MFB Operations · <span className="text-emerald-600 dark:text-emerald-400">{totalCoops} Active Cooperatives</span></p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button asChild variant="outline" size="sm" className="h-9 rounded-xl border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs gap-2">
                            <a href={`${process.env.NEXT_PUBLIC_COPTELLER_URL || 'http://localhost:3001'}/copteller/superadmin`} target="_blank" rel="noopener noreferrer">
                                <ArrowUpRight className="h-3.5 w-3.5" /> Open Copteller Standalone App
                            </a>
                        </Button>
                        <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2">
                            <Download className="h-3.5 w-3.5" /> CBN Report
                        </Button>
                        <Button
                            onClick={runAuditWorkflow}
                            disabled={workflowRunning}
                            className="h-9 rounded-xl bg-gradient-to-r from-rose-600 to-amber-500 text-white font-black text-xs border-0 gap-2 shadow-lg disabled:opacity-60"
                        >
                            {workflowRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                            {workflowRunning ? 'Running Audit...' : 'Run Platform Audit'}
                        </Button>
                    </div>
                </div>

                {/* Audit workflow console */}
                <AnimatePresence>
                    {workflowRunning && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                            <WorkflowLog
                                steps={[
                                    "Scanning all cooperative escrow vaults...",
                                    "Cross-referencing HP payback ledgers...",
                                    "Validating member credit score deltas...",
                                    "Generating CBN compliance report draft...",
                                    "✓ Audit complete — 47 cooperatives reconciled"
                                ]}
                                active={workflowStep}
                            />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* ── TABS ─────────────────────────────────────────────────── */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl w-fit flex-wrap">
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => handleTabChange(t.key as any)} className={`relative px-4 py-2 rounded-xl text-xs font-black transition-all duration-200 ${activeTab === t.key ? 'bg-white dark:bg-slate-800 text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>
                            {t.label.split(' (')[0]}
                            {('badge' in t) && (t as any).badge > 0 && (
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center">{(t as any).badge}</span>
                            )}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* ── OVERVIEW ─────────────────────────────────────────── */}
                    {activeTab === 'overview' && (
                        <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">

                            {/* KPI grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Active Cooperatives", val: totalCoops.toString(), sub: `+${pendingCoops.length} pending approval`, icon: Building2, color: "emerald" },
                                    { label: "Weekly HP Flow", val: "₦4.8M", sub: "Across all guilds", icon: CircleDollarSign, color: "amber" },
                                    { label: "HP Assets Tracked", val: "1,240+", sub: "Vehicles, tools & equipment", icon: Truck, color: "emerald" },
                                    { label: "Platform Escrow", val: "₦2.4B+", sub: "Total AUM under custody", icon: Lock, color: "rose" },
                                ].map((s, i) => (
                                    <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 space-y-3 hover:shadow-lg transition-all duration-300">
                                        <div className={`p-2 rounded-xl w-fit ${s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : s.color === 'amber' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                            <s.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                                            <p className="text-2xl font-black mt-0.5">{s.val}</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{s.sub}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Main grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Platform sector breakdown */}
                                <div className="lg:col-span-2 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
                                    <h3 className="text-sm font-black">Cooperative Sector Distribution</h3>
                                    {[
                                        { sector: "Transport / Keke", coops: 23, aum: "₦1.4B", color: "emerald", pct: 49 },
                                        { sector: "Artisan / Leatherwork", coops: 12, aum: "₦620M", color: "amber", pct: 26 },
                                        { sector: "Market Traders", coops: 8, aum: "₦280M", color: "emerald", pct: 17 },
                                        { sector: "Agriculture", coops: 4, aum: "₦100M", color: "amber", pct: 8 },
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex justify-between text-xs font-bold">
                                                <span>{s.sector}</span>
                                                <span className="text-muted-foreground">{s.coops} coops · {s.aum}</span>
                                            </div>
                                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                                <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, delay: i * 0.15 }} className={`h-full rounded-full ${s.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Alerts panel */}
                                <div className="space-y-4">
                                    <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 space-y-3">
                                        <h3 className="text-xs font-black flex items-center gap-2"><Bell className="h-4 w-4 text-rose-500" /> Platform Alerts</h3>
                                        {[
                                            { label: `${pendingCoops.length} union approvals pending`, type: "warning" },
                                            { label: `${pendingGrants.length} grant disbursals queued`, type: "warning" },
                                            { label: "3 HP asset defaults flagged", type: "error" },
                                            { label: "Weekly audit cycle due in 2 days", type: "info" },
                                        ].map((a, i) => (
                                            <div key={i} className={`flex items-start gap-2 p-2.5 rounded-xl text-[10px] font-bold ${a.type === 'error' ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400' : a.type === 'warning' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900 text-muted-foreground'}`}>
                                                {a.type === 'error' ? <XCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : a.type === 'warning' ? <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" /> : <Clock className="h-3.5 w-3.5 shrink-0 mt-0.5" />}
                                                {a.label}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Quick stats */}
                                    <div className="bg-gradient-to-br from-slate-950 to-rose-950/20 border border-rose-900/20 rounded-2xl p-5 space-y-3">
                                        <p className="text-[9px] font-black text-rose-400/70 uppercase tracking-widest">Platform Health</p>
                                        {[
                                            { label: "HP Collection Rate", val: "94.2%" },
                                            { label: "Active Escrow Vaults", val: "47" },
                                            { label: "Avg. Credit Score", val: "82.1" },
                                        ].map((s, i) => (
                                            <div key={i} className="flex justify-between text-[10px] font-bold text-slate-400">
                                                <span>{s.label}</span>
                                                <span className="text-emerald-400 font-black">{s.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* ── UNIONS ───────────────────────────────────────────── */}
                    {activeTab === 'unions' && (
                        <motion.div key="unions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black">Union Approval Queue</h2>
                                <span className="text-xs font-bold text-muted-foreground">{pendingCoops.length} pending</span>
                            </div>

                            {pendingCoops.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-40" />
                                    <p className="font-black">All unions cleared</p>
                                    <p className="text-sm">No pending approvals</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingCoops.map(coop => (
                                        <motion.div key={coop.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 50 }} className="bg-white dark:bg-slate-950/60 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black">{coop.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-semibold">Sponsor: {coop.sponsor}</p>
                                                    <p className="text-[10px] text-muted-foreground font-semibold">Reg No: {coop.regNo}</p>
                                                </div>
                                                <StatusBadge status="Pending" />
                                            </div>
                                            <div className="grid grid-cols-3 gap-3 text-center text-[10px]">
                                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2">
                                                    <p className="text-muted-foreground font-bold">Members</p>
                                                    <p className="font-black text-sm">{coop.members}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2">
                                                    <p className="text-muted-foreground font-bold">Reg Number</p>
                                                    <p className="font-black text-sm">{coop.regNo.split('-')[2]}</p>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-2">
                                                    <p className="text-muted-foreground font-bold">Documents</p>
                                                    <p className="font-black text-emerald-600 dark:text-emerald-400 text-sm">3 / 3 ✓</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button onClick={() => rejectCoop(coop.id)} variant="outline" className="flex-1 h-10 rounded-xl border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-black text-xs gap-2">
                                                    <X className="h-3.5 w-3.5" /> Reject
                                                </Button>
                                                <Button onClick={() => approveCoop(coop.id, coop.name)} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-black text-xs border-0 shadow-lg gap-2">
                                                    <Check className="h-3.5 w-3.5" /> Approve & Register
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}

                            {/* Registered list */}
                            <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-3">
                                <h3 className="text-sm font-black">Registered Cooperatives ({totalCoops})</h3>
                                {[
                                    { name: "Aba Motor Tricycle Union", sector: "Transport", members: 320, aum: "₦890M" },
                                    { name: "Ariaria Traders Cooperative", sector: "Commerce", members: 180, aum: "₦240M" },
                                    { name: "Aba Leatherwork & Artisan Guild", sector: "Artisan", members: 95, aum: "₦120M" },
                                ].map((c, i) => (
                                    <div key={i} className="flex items-center gap-4 py-2.5 border-b border-slate-50 dark:border-slate-900 last:border-0">
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-amber-500/20 border border-emerald-500/20 flex items-center justify-center">
                                            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black">{c.name}</p>
                                            <p className="text-[10px] text-muted-foreground font-semibold">{c.sector} · {c.members} members</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">{c.aum}</p>
                                            <StatusBadge status="Active" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── GRANTS ───────────────────────────────────────────── */}
                    {activeTab === 'grants' && (
                        <motion.div key="grants" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black">Grant Disbursement Queue</h2>
                                <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2">
                                    <Download className="h-3.5 w-3.5" /> Export
                                </Button>
                            </div>

                            {pendingGrants.length === 0 ? (
                                <div className="text-center py-16 text-muted-foreground">
                                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-emerald-500 opacity-40" />
                                    <p className="font-black">All grants disbursed</p>
                                    <p className="text-sm">Queue is clear</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {pendingGrants.map(grant => (
                                        <motion.div key={grant.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 50 }} className="bg-white dark:bg-slate-950/60 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-6 space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-sm font-black">{grant.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-semibold">{grant.coop}</p>
                                                    <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">{grant.type}</p>
                                                </div>
                                                <div className="text-right space-y-1">
                                                    <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₦{grant.amt.toLocaleString()}</p>
                                                    <StatusBadge status="Pending" />
                                                </div>
                                            </div>
                                            <div className="flex gap-3">
                                                <Button variant="outline" onClick={() => rejectGrant(grant.id)} className="flex-1 h-10 rounded-xl border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-black text-xs gap-2">
                                                    <X className="h-3.5 w-3.5" /> Reject
                                                </Button>
                                                <Button onClick={() => disburseGrant(grant.id, grant.name, grant.amt)} className="flex-1 h-10 rounded-xl bg-gradient-to-r from-emerald-500 to-amber-500 text-black font-black text-xs border-0 shadow-lg gap-2">
                                                    <Check className="h-3.5 w-3.5" /> Disburse via Vault
                                                </Button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* ── ASSETS ───────────────────────────────────────────── */}
                    {activeTab === 'assets' && (
                        <motion.div key="assets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <h2 className="text-lg font-black">HP Asset Registry</h2>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "Total Assets", val: "1,240", icon: Truck, color: "emerald" },
                                    { label: "Active Contracts", val: "1,180", icon: CheckCircle2, color: "emerald" },
                                    { label: "Defaulting", val: "37", icon: AlertCircle, color: "rose" },
                                    { label: "Ownership Completed", val: "23", icon: Award, color: "amber" },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-5 space-y-3">
                                        <div className={`p-2 rounded-xl w-fit ${s.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : s.color === 'rose' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                                            <s.icon className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                                            <p className="text-2xl font-black">{s.val}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
                                        <tr>
                                            {["Asset", "Cooperative", "Operator", "Paid", "Total", "Status"].map(h => (
                                                <th key={h} className="text-left px-5 py-3 text-[9px] font-black uppercase tracking-widest text-muted-foreground">{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[
                                            { asset: "TVS King ABA-404", coop: "Aba Motor Union", op: "Kalu Onyekachi", paid: "₦420K", total: "₦1.4M", status: "Active" },
                                            { asset: "Haojin ABA-211", coop: "Aba Motor Union", op: "Emeka Obi", paid: "₦700K", total: "₦1.4M", status: "Active" },
                                            { asset: "Bajaj ABA-088", coop: "Aba Motor Union", op: "Ngozi Eze", paid: "₦120K", total: "₦1.2M", status: "Pending" },
                                            { asset: "TVS King ABA-519", coop: "Aba Motor Union", op: "Chukwu Nna", paid: "₦280K", total: "₦1.4M", status: "Rejected" },
                                        ].map((row, i) => (
                                            <tr key={i} className="border-b border-slate-50 dark:border-slate-900 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                <td className="px-5 py-3 font-bold">{row.asset}</td>
                                                <td className="px-5 py-3 font-semibold text-muted-foreground">{row.coop}</td>
                                                <td className="px-5 py-3 font-semibold">{row.op}</td>
                                                <td className="px-5 py-3 font-black text-emerald-600 dark:text-emerald-400">{row.paid}</td>
                                                <td className="px-5 py-3 font-semibold text-muted-foreground">{row.total}</td>
                                                <td className="px-5 py-3"><StatusBadge status={row.status} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {/* ── VAULT ────────────────────────────────────────────── */}
                    {activeTab === 'vault' && (
                        <motion.div key="vault" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <h2 className="text-lg font-black">Service Vault & API Integrations</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { name: "Core Banking API", provider: "Licensed MFB Partner", status: "Live", key: "cbk_live_••••••••", scopes: ["escrow.write", "ledger.read", "audit.log"] },
                                    { name: "Payment Processor", provider: "Paystack / Flutterwave", status: "Live", key: "pk_live_••••••••", scopes: ["charge", "transfer", "verify"] },
                                    { name: "KYC & BVN Verify", provider: "NIBSS / Smile Identity", status: "Live", key: "kyc_live_••••••••", scopes: ["bvn.verify", "id.validate"] },
                                    { name: "Credit Bureau", provider: "CRC / First Central", status: "Live", key: "cr_live_••••••••", scopes: ["score.read", "report.request"] },
                                ].map((api, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-6 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-sm font-black">{api.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-semibold">{api.provider}</p>
                                            </div>
                                            <StatusBadge status={api.status} />
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 flex items-center gap-2">
                                            <KeyRound className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                            <code className="text-[10px] font-bold text-muted-foreground flex-1">{api.key}</code>
                                            <button className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 hover:underline">Reveal</button>
                                        </div>
                                        <div className="flex flex-wrap gap-1.5">
                                            {api.scopes.map(scope => (
                                                <span key={scope} className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                                    {scope}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* ── COMPLIANCE ───────────────────────────────────────── */}
                    {activeTab === 'compliance' && (
                        <motion.div key="compliance" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-5">
                            <div className="flex items-center justify-between">
                                <h2 className="text-lg font-black">Compliance & Audit Logs</h2>
                                <Button variant="outline" size="sm" className="h-9 rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2">
                                    <Download className="h-3.5 w-3.5" /> Export CBN Report
                                </Button>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    { label: "CBN Filings", val: "12", sub: "Current year", color: "emerald" },
                                    { label: "NDIC Reports", val: "4/4", sub: "All submitted", color: "emerald" },
                                    { label: "Open Violations", val: "0", sub: "Clean record", color: "emerald" },
                                    { label: "Audit Score", val: "97/100", sub: "Excellent rating", color: "amber" },
                                ].map((s, i) => (
                                    <div key={i} className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl p-4 text-center space-y-1">
                                        <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">{s.label}</p>
                                        <p className={`text-2xl font-black ${s.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.val}</p>
                                        <p className="text-[9px] text-muted-foreground font-semibold">{s.sub}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-900 rounded-2xl overflow-hidden">
                                <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black">Recent Audit Events</p>
                                </div>
                                <div className="divide-y divide-slate-50 dark:divide-slate-900">
                                    {[
                                        { event: "Weekly HP collection workflow completed", actor: "System", time: "2h ago", type: "success" },
                                        { event: "Cooperative COOP-AB-390 approved", actor: "Superadmin", time: "1d ago", type: "success" },
                                        { event: "HP default flagged: TVS King ABA-519", actor: "System", time: "2d ago", type: "warning" },
                                        { event: "Grant disbursed: ₦200,000 to Kalu O.", actor: "Superadmin", time: "3d ago", type: "success" },
                                        { event: "Quarterly CBN report submitted", actor: "Superadmin", time: "Jul 15", type: "success" },
                                    ].map((log, i) => (
                                        <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${log.type === 'success' ? 'bg-emerald-500' : log.type === 'warning' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                            <p className="flex-1 text-xs font-semibold">{log.event}</p>
                                            <span className="text-[10px] text-muted-foreground font-bold">{log.actor}</span>
                                            <span className="text-[10px] text-muted-foreground font-semibold w-12 text-right">{log.time}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

export default function CoptellerSuperadminPage() {
    return (
        <React.Suspense fallback={<div className="p-8 text-center text-xs font-black text-muted-foreground">Loading bank superadmin workspace...</div>}>
            <CoptellerSuperadminPageContent />
        </React.Suspense>
    )
}
