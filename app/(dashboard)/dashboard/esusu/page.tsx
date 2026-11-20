"use client"

import * as React from "react"
import Link from "next/link"
import {
    Users,
    TrendingUp,
    Calendar,
    Building2,
    DollarSign,
    PlusCircle,
    Loader2,
    X,
    ShieldAlert,
    RefreshCw,
    Play,
    Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"

export default function EsusuAdminPage() {
    const { activeProfile } = useBankProfile()
    const [cooperatives, setCooperatives] = React.useState<any[]>([])
    const [cycles, setCycles] = React.useState<any[]>([])
    const [membersByCycle, setMembersByCycle] = React.useState<Record<string, any[]>>({})
    const [payouts, setPayouts] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [selectedCycleIdx, setSelectedCycleIdx] = React.useState(0)

    const [showCoopModal, setShowCoopModal] = React.useState(false)
    const [showCycleModal, setShowCycleModal] = React.useState(false)
    const [newCoopName, setNewCoopName] = React.useState("")
    const [newCoopDesc, setNewCoopDesc] = React.useState("")

    const [newCycleName, setNewCycleName] = React.useState("")
    const [newCycleCoopId, setNewCycleCoopId] = React.useState("")
    const [newCycleAmountNaira, setNewCycleAmountNaira] = React.useState("5000")
    const [newCycleFreq, setNewCycleFreq] = React.useState<"daily" | "weekly" | "monthly">("weekly")
    const [newCycleSlots, setNewCycleSlots] = React.useState("5")
    const [newCycleFee, setNewCycleFee] = React.useState("2.0")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/esusu")
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load Esusu data")
                return
            }
            setCooperatives(data.cooperatives || [])
            setCycles(data.cycles || [])
            setMembersByCycle(data.membersByCycle || {})
            setPayouts(data.payouts || [])
            if (!newCycleCoopId && data.cooperatives?.[0]?.id) {
                setNewCycleCoopId(String(data.cooperatives[0].id))
            }
        } catch {
            toast.error("Failed to fetch Esusu ledgers")
        } finally {
            setLoading(false)
        }
    }, [newCycleCoopId])

    React.useEffect(() => {
        loadData()
    }, [])

    const handleCoopStatus = async (id: number, status: "active" | "suspended") => {
        setBusy(`coop-${id}`)
        try {
            const res = await fetch("/api/admin/esusu", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cooperative_id: id, status }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Status update failed")
                return
            }
            toast.success(`Cooperative status updated to ${status}.`)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleCreateCoop = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create-coop")
        try {
            const res = await fetch("/api/esusu/cooperatives/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newCoopName.trim(), description: newCoopDesc.trim() }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to create cooperative")
                return
            }
            toast.success(`Created cooperative "${newCoopName.trim()}"!`)
            setNewCoopName("")
            setNewCoopDesc("")
            setShowCoopModal(false)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleCreateCycle = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create-cycle")
        try {
            const res = await fetch("/api/esusu/cycles/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    cooperative_id: newCycleCoopId,
                    name: newCycleName.trim(),
                    contribution_amount: Math.round(Number(newCycleAmountNaira) * 100),
                    frequency: newCycleFreq,
                    total_slots: Number(newCycleSlots),
                    platform_fee_percent: Number(newCycleFee),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to launch Esusu cycle")
                return
            }
            toast.success(`Launched cycle "${newCycleName.trim()}"!`)
            setNewCycleName("")
            setShowCycleModal(false)
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleRunCollection = async (cycleId: number) => {
        setBusy(`collect-${cycleId}`)
        try {
            const res = await fetch("/api/cooperatives/run-collection", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cycle_id: cycleId }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Collection run failed")
                return
            }
            toast.success("Atomic cycle collection & payout completed!")
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleForcePayout = async (cycleId: number) => {
        setBusy(`payout-${cycleId}`)
        try {
            const res = await fetch("/api/esusu/cycles/payout-cron", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cycle_id: cycleId }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Vault payout rejected")
                return
            }
            toast.success(data.message || "Rotational payout executed!")
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const currentCycle = cycles[selectedCycleIdx] || cycles[0]
    const totalMembers = Object.values(membersByCycle).reduce((s, list) => s + list.length, 0)
    const totalPaidKobo = payouts.reduce((s, p) => s + Number(p.amount || 0), 0)

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading Native Esusu Ledgers...
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
                <div>
                    <Badge className="bg-primary/15 text-primary border-primary/30 uppercase text-[10px] font-black tracking-widest mb-2">
                        Native Thrift Engine · Atomic Settlement
                    </Badge>
                    <h1 className="text-3xl font-black tracking-tight">Digital Esusu & Cooperative Controller</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Approve cooperative unions, launch vault-backed rotational cycles, and execute atomic member collections.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {activeProfile.enabledModules.coptellerBridge && (
                        <Button asChild variant="outline" className="rounded-xl font-bold gap-1.5 border-emerald-500/30 text-emerald-600">
                            <Link href="/dashboard/copteller">
                                <Globe className="h-4 w-4" /> Open Copteller Bridge
                            </Link>
                        </Button>
                    )}
                    <Button variant="outline" onClick={() => setShowCoopModal(true)} className="rounded-xl font-bold gap-1.5">
                        <PlusCircle className="h-4 w-4" /> New Cooperative
                    </Button>
                    <Button onClick={() => setShowCycleModal(true)} className="rounded-xl font-black gap-1.5">
                        <PlusCircle className="h-4 w-4" /> Launch Cycle
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-card p-5 rounded-2xl border">
                    <Building2 className="h-5 w-5 text-primary mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Active Cooperatives</p>
                    <p className="text-3xl font-black mt-1">{cooperatives.filter((c) => c.status === "active").length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <Calendar className="h-5 w-5 text-purple-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Rotational Cycles</p>
                    <p className="text-3xl font-black mt-1">{cycles.length}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <Users className="h-5 w-5 text-amber-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Enrolled Members</p>
                    <p className="text-3xl font-black mt-1">{totalMembers}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <DollarSign className="h-5 w-5 text-emerald-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Total Payouts Settled</p>
                    <p className="text-3xl font-black mt-1">₦{(totalPaidKobo / 100).toLocaleString()}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-card border rounded-2xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-black">Cooperative Licenses ({cooperatives.length})</h2>
                            <Button variant="ghost" size="sm" onClick={loadData}><RefreshCw className="h-4 w-4" /></Button>
                        </div>
                        {cooperatives.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">No cooperatives created yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {cooperatives.map((c) => (
                                    <div key={c.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-muted/20">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-sm">{c.name}</p>
                                                <Badge variant={c.status === "active" ? "default" : "secondary"} className="text-[9px] uppercase">
                                                    {c.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-0.5">{c.description || "Registered guild"}</p>
                                            <p className="text-[10px] text-muted-foreground mt-1">Leader: {c.union_leader}</p>
                                        </div>
                                        {c.status === "active" ? (
                                            <Button size="sm" variant="outline" disabled={busy !== null} onClick={() => handleCoopStatus(c.id, "suspended")} className="text-destructive">
                                                Suspend
                                            </Button>
                                        ) : (
                                            <Button size="sm" disabled={busy !== null} onClick={() => handleCoopStatus(c.id, "active")}>
                                                Approve License
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card border rounded-2xl p-6 space-y-4">
                        <h2 className="text-lg font-black">Settled Payout Journal ({payouts.length})</h2>
                        {payouts.length === 0 ? (
                            <p className="text-sm text-muted-foreground py-6 text-center">No payouts distributed yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-muted/40 border-b text-[10px] uppercase text-muted-foreground">
                                        <tr>
                                            <th className="px-3 py-2.5">Cycle</th>
                                            <th className="px-3 py-2.5">Recipient</th>
                                            <th className="px-3 py-2.5">Net Paid</th>
                                            <th className="px-3 py-2.5">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {payouts.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-3 py-2.5 font-bold">{p.cycle_name}</td>
                                                <td className="px-3 py-2.5">{p.recipient}</td>
                                                <td className="px-3 py-2.5 font-black text-emerald-600">₦{(Number(p.amount) / 100).toLocaleString()}</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Active Cycle Queue & Execution */}
                <div className="lg:col-span-5 bg-card border rounded-2xl p-6 space-y-5 h-fit">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-lg font-black flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" /> Cycle Operations
                        </h2>
                        <div className="flex gap-1 flex-wrap">
                            {cycles.map((c, idx) => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelectedCycleIdx(idx)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                                        selectedCycleIdx === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                                    }`}
                                >
                                    #{c.id}
                                </button>
                            ))}
                        </div>
                    </div>

                    {!currentCycle ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No Esusu cycles launched yet.</p>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-4 rounded-xl bg-muted/30 border space-y-2 text-xs">
                                <p className="font-black text-sm">{currentCycle.name}</p>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Contribution / Slot:</span>
                                    <span className="font-bold">₦{(Number(currentCycle.contribution_amount) / 100).toLocaleString()} ({currentCycle.frequency})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Holding Vault Balance:</span>
                                    <span className="font-black text-emerald-600">₦{(Number(currentCycle.vault_balance_kobo || 0) / 100).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Current Payout Turn:</span>
                                    <span className="font-bold">Slot {Number(currentCycle.current_payout_index || 0) + 1} / {currentCycle.total_slots}</span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <p className="text-[10px] uppercase font-black text-muted-foreground">Enrolled Slots</p>
                                {(membersByCycle[String(currentCycle.id)] || []).length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No members enrolled in this cycle yet.</p>
                                ) : (
                                    (membersByCycle[String(currentCycle.id)] || []).map((m) => (
                                        <div key={m.id} className="p-2.5 rounded-xl border flex justify-between items-center text-xs">
                                            <span className="font-bold">
                                                #{Number(m.payout_order_index) + 1} · {m.customer_name}
                                            </span>
                                            <Badge variant={Number(m.payout_order_index) === Number(currentCycle.current_payout_index) ? "default" : "outline"} className="text-[9px] uppercase">
                                                {Number(m.payout_order_index) === Number(currentCycle.current_payout_index)
                                                    ? "Next Payout"
                                                    : Number(m.payout_order_index) < Number(currentCycle.current_payout_index)
                                                        ? "Paid"
                                                        : "Queued"}
                                            </Badge>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="space-y-2 pt-2 border-t">
                                <Button
                                    onClick={() => handleRunCollection(currentCycle.id)}
                                    disabled={busy !== null}
                                    className="w-full rounded-xl font-black gap-1.5"
                                >
                                    <Play className="h-4 w-4" /> Run Atomic Collection & Payout
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleForcePayout(currentCycle.id)}
                                    disabled={busy !== null}
                                    className="w-full rounded-xl font-bold gap-1.5"
                                >
                                    <ShieldAlert className="h-4 w-4 text-amber-500" /> Payout Existing Holding Vault
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showCoopModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleCreateCoop} className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Register Cooperative Union</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowCoopModal(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <input required placeholder="Cooperative Name" value={newCoopName} onChange={(e) => setNewCoopName(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm" />
                        <textarea placeholder="Charter & Sector Description" value={newCoopDesc} onChange={(e) => setNewCoopDesc(e.target.value)} className="w-full rounded-xl border bg-background p-3 text-sm" rows={3} />
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowCoopModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={busy === "create-coop"}>Create Cooperative</Button>
                        </div>
                    </form>
                </div>
            )}

            {showCycleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleCreateCycle} className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Launch Rotational Esusu Cycle</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowCycleModal(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <select required value={newCycleCoopId} onChange={(e) => setNewCycleCoopId(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm">
                            {cooperatives.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input required placeholder="Cycle Name" value={newCycleName} onChange={(e) => setNewCycleName(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" required min="100" placeholder="Contribution (NGN)" value={newCycleAmountNaira} onChange={(e) => setNewCycleAmountNaira(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm" />
                            <select value={newCycleFreq} onChange={(e) => setNewCycleFreq(e.target.value as any)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm">
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input type="number" required min="2" placeholder="Total Slots" value={newCycleSlots} onChange={(e) => setNewCycleSlots(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm" />
                            <input type="number" step="0.1" required min="0" placeholder="Fee %" value={newCycleFee} onChange={(e) => setNewCycleFee(e.target.value)} className="w-full h-10 rounded-xl border bg-background px-3 text-sm" />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowCycleModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={busy === "create-cycle"}>Launch Cycle</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
