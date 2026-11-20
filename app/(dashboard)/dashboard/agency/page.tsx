"use client"

import * as React from "react"
import {
    Landmark,
    Calendar,
    DollarSign,
    Smartphone,
    Layers,
    FileText,
    Check,
    X,
    Loader2,
    PlusCircle,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"

interface TerminalRow {
    id: number
    agent_name: string
    agent_email?: string
    pos_model: string
    serial_number: string
    status: "pending" | "active" | "assigned" | "suspended" | "damaged"
    created_at: string
}

interface CommissionRow {
    id: number
    agent_name: string
    terminal_serial: string
    transaction_amount: number
    total_commission: number
    agent_share: number
    bank_share: number
    status: string
    created_at: string
}

export default function AgencyAdminPage() {
    const [terminals, setTerminals] = React.useState<TerminalRow[]>([])
    const [commissions, setCommissions] = React.useState<CommissionRow[]>([])
    const [customers, setCustomers] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState<"fleet" | "requests" | "commissions">("fleet")

    // Approve & Allocate modal
    const [selectedTerminal, setSelectedTerminal] = React.useState<TerminalRow | null>(null)
    const [customSerial, setCustomSerial] = React.useState("")

    // Provision New Terminal modal
    const [showNewModal, setShowNewModal] = React.useState(false)
    const [newCustomerId, setNewCustomerId] = React.useState("")
    const [newSerial, setNewSerial] = React.useState("")
    const [newModel, setNewModel] = React.useState("Pax S900")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/agency")
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load agency registry")
                return
            }
            setTerminals(data.terminals || [])
            setCommissions(data.commissions || [])
            setCustomers(data.customers || [])
            if (!newCustomerId && data.customers?.[0]?.id) {
                setNewCustomerId(String(data.customers[0].id))
            }
        } catch {
            toast.error("Network error loading agency data")
        } finally {
            setLoading(false)
        }
    }, [newCustomerId])

    React.useEffect(() => {
        loadData()
    }, [])

    const updateTerminal = async (
        id: number,
        payload: { status: string; serial_number?: string },
        successMsg: string
    ) => {
        setBusyId(`term-${id}`)
        try {
            const res = await fetch("/api/admin/agency", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, ...payload }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to update terminal")
                return false
            }
            toast.success(successMsg)
            await loadData()
            return true
        } finally {
            setBusyId(null)
        }
    }

    const handleProvisionNew = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newSerial.trim()) return
        setBusyId("new-term")
        try {
            const res = await fetch("/api/admin/agency", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    agent_customer_id: newCustomerId ? Number(newCustomerId) : undefined,
                    serial_number: newSerial.trim(),
                    pos_model: newModel,
                    status: "active",
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to provision terminal")
                return
            }
            toast.success(`Provisioned POS terminal ${newSerial.trim()}`)
            setShowNewModal(false)
            setNewSerial("")
            await loadData()
        } finally {
            setBusyId(null)
        }
    }

    const totalActive = terminals.filter((t) => t.status === "active" || t.status === "assigned").length
    const totalPending = terminals.filter((t) => t.status === "pending").length
    const agentCommKobo = commissions.reduce((s, c) => s + Number(c.agent_share || 0), 0)
    const bankCommKobo = commissions.reduce((s, c) => s + Number(c.bank_share || 0), 0)

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading live POS hardware fleet...
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 max-w-[1440px] mx-auto px-4 md:px-8 pt-6">
            <BankPageHeader
                badge="POS Agency Network & Copteller Cash-In Rail"
                livePill={`${totalActive} Active Terminals · ${totalPending} Pending`}
                liveTone={totalPending > 0 ? "amber" : "emerald"}
                title="Partner Agency Network"
                subtitle="Provision POS terminals, approve hardware serial allocations, monitor cooperative cash-in agents, and audit live 70/30 commission splits."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => {
                                setNewSerial(`POS_${Math.floor(1000000000 + Math.random() * 9000000000)}`)
                                setShowNewModal(true)
                            }}
                            className="h-9 rounded-xl font-black text-xs gap-1.5"
                        >
                            <PlusCircle className="h-3.5 w-3.5" /> Provision Terminal
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-card p-5 rounded-2xl border">
                    <Smartphone className="h-5 w-5 text-primary mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Active Fleet Terminals</p>
                    <p className="text-3xl font-black mt-1">{totalActive}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <Calendar className="h-5 w-5 text-amber-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Pending Requests</p>
                    <p className="text-3xl font-black mt-1">{totalPending}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <DollarSign className="h-5 w-5 text-emerald-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Agent Share (70%)</p>
                    <p className="text-3xl font-black mt-1">₦{(agentCommKobo / 100).toLocaleString()}</p>
                </div>
                <div className="bg-card p-5 rounded-2xl border">
                    <Landmark className="h-5 w-5 text-blue-500 mb-3" />
                    <p className="text-[10px] font-black uppercase text-muted-foreground">Bank Revenue (30%)</p>
                    <p className="text-3xl font-black mt-1">₦{(bankCommKobo / 100).toLocaleString()}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-muted p-1 rounded-2xl w-fit">
                {[
                    { id: "fleet", label: `Fleet (${terminals.filter((t) => t.status !== "pending").length})` },
                    { id: "requests", label: `Pending Requests (${totalPending})` },
                    { id: "commissions", label: `Commission Ledger (${commissions.length})` },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                            activeTab === tab.id ? "bg-background shadow-sm" : "text-muted-foreground"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Fleet */}
            {activeTab === "fleet" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <Layers className="h-5 w-5 text-primary" /> Assigned POS Hardware Fleet
                    </h2>
                    {terminals.filter((t) => t.status !== "pending").length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No active or suspended terminals in database.</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {terminals
                                .filter((t) => t.status !== "pending")
                                .map((t) => (
                                    <div key={t.id} className="border rounded-2xl p-5 flex flex-col justify-between gap-4 bg-muted/20">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-start gap-2">
                                                <div>
                                                    <Badge variant="secondary" className="text-[9px] uppercase mb-1">{t.pos_model}</Badge>
                                                    <h3 className="font-bold text-sm">{t.agent_name}</h3>
                                                </div>
                                                <Badge variant={t.status === "active" ? "default" : "destructive"} className="text-[9px] uppercase">
                                                    {t.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-mono font-bold">Serial: {t.serial_number}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                Registered: {new Date(t.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        {t.status === "active" || t.status === "assigned" ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={busyId !== null}
                                                onClick={() => updateTerminal(t.id, { status: "suspended" }, `Suspended terminal ${t.serial_number}`)}
                                                className="w-full text-destructive border-destructive/30 font-bold"
                                            >
                                                Suspend Device
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={busyId !== null}
                                                onClick={() => updateTerminal(t.id, { status: "active" }, `Reactivated terminal ${t.serial_number}`)}
                                                className="w-full font-bold"
                                            >
                                                Reactivate Device
                                            </Button>
                                        )}
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Pending Requests */}
            {activeTab === "requests" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black">Pending Hardware Applications</h2>
                    {totalPending === 0 ? (
                        <div className="py-10 text-center text-sm text-muted-foreground">
                            <Check className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                            No pending POS terminal requests in queue.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {terminals
                                .filter((t) => t.status === "pending")
                                .map((t) => (
                                    <div key={t.id} className="border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div>
                                            <p className="font-bold text-sm">{t.agent_name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Model: {t.pos_model} · Requested {new Date(t.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => {
                                                setSelectedTerminal(t)
                                                setCustomSerial(
                                                    t.serial_number && !t.serial_number.includes("PENDING")
                                                        ? t.serial_number
                                                        : `POS_${Math.floor(1000000000 + Math.random() * 9000000000)}`
                                                )
                                            }}
                                            className="rounded-xl font-bold"
                                        >
                                            Approve & Allocate Serial
                                        </Button>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            )}

            {/* Commissions */}
            {activeTab === "commissions" && (
                <div className="bg-card border rounded-2xl p-6 space-y-4">
                    <h2 className="text-lg font-black flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" /> Real Commission Split Ledger
                    </h2>
                    {commissions.length === 0 ? (
                        <p className="text-sm text-muted-foreground py-8 text-center">No settled POS cash-out commissions yet.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-muted/40 border-b text-[10px] uppercase text-muted-foreground">
                                    <tr>
                                        <th className="px-4 py-3">ID</th>
                                        <th className="px-4 py-3">Agent</th>
                                        <th className="px-4 py-3">POS Serial</th>
                                        <th className="px-4 py-3">Volume</th>
                                        <th className="px-4 py-3">Agent (70%)</th>
                                        <th className="px-4 py-3">Bank (30%)</th>
                                        <th className="px-4 py-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {commissions.map((c) => (
                                        <tr key={c.id}>
                                            <td className="px-4 py-3 font-mono font-bold">#{c.id}</td>
                                            <td className="px-4 py-3">{c.agent_name}</td>
                                            <td className="px-4 py-3 font-mono">{c.terminal_serial || "—"}</td>
                                            <td className="px-4 py-3 font-bold">₦{(Number(c.transaction_amount) / 100).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-bold text-emerald-600">₦{(Number(c.agent_share) / 100).toLocaleString()}</td>
                                            <td className="px-4 py-3 font-bold text-blue-600">₦{(Number(c.bank_share) / 100).toLocaleString()}</td>
                                            <td className="px-4 py-3"><Badge variant="outline" className="text-[9px] uppercase">{c.status}</Badge></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Modal: Approve & Allocate */}
            {selectedTerminal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <div className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Allocate Hardware Serial</h3>
                            <Button size="icon" variant="ghost" onClick={() => setSelectedTerminal(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Agent: <strong>{selectedTerminal.agent_name}</strong> ({selectedTerminal.pos_model})
                        </p>
                        <input
                            type="text"
                            value={customSerial}
                            onChange={(e) => setCustomSerial(e.target.value)}
                            className="w-full h-11 px-4 rounded-xl border bg-background font-mono text-sm"
                        />
                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setSelectedTerminal(null)}>Cancel</Button>
                            <Button
                                disabled={busyId !== null}
                                onClick={async () => {
                                    const ok = await updateTerminal(
                                        selectedTerminal.id,
                                        { status: "active", serial_number: customSerial },
                                        `Allocated ${customSerial} and activated terminal!`
                                    )
                                    if (ok) setSelectedTerminal(null)
                                }}
                            >
                                Confirm & Deploy
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Provision New */}
            {showNewModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleProvisionNew} className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Provision POS Terminal</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowNewModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold">Assign to Agent Customer</label>
                            <select
                                value={newCustomerId}
                                onChange={(e) => setNewCustomerId(e.target.value)}
                                className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
                            >
                                {customers.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.first_name} {c.last_name} ({c.email})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold">Hardware Model</label>
                            <input
                                type="text"
                                required
                                value={newModel}
                                onChange={(e) => setNewModel(e.target.value)}
                                className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold">Serial Number</label>
                            <input
                                type="text"
                                required
                                value={newSerial}
                                onChange={(e) => setNewSerial(e.target.value)}
                                className="w-full h-10 rounded-xl border bg-background px-3 font-mono text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => setShowNewModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={busyId === "new-term"}>Provision & Activate</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
