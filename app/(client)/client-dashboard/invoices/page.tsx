"use client"

import * as React from "react"
import { useScope } from "@/context/scope-context"
import {
    Receipt,
    Plus,
    Search,
    Building2,
    TrendingUp,
    AlertCircle,
    X,
    RefreshCw,
    CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function InvoicesPage() {
    const { activeScope } = useScope()
    const [invoices, setInvoices] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<"all" | "unpaid" | "paid">("all")

    const [showModal, setShowModal] = React.useState(false)
    const [clientName, setClientName] = React.useState("")
    const [clientEmail, setClientEmail] = React.useState("")
    const [amountNaira, setAmountNaira] = React.useState("")
    const [description, setDescription] = React.useState("")

    const loadInvoices = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/invoices")
            const data = await res.json()
            if (res.ok && data.success) {
                setInvoices(data.invoices || [])
            }
        } catch {
            toast.error("Failed to load business invoices")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        if (activeScope.type === "business") {
            loadInvoices()
        } else {
            setLoading(false)
        }
    }, [activeScope.type, loadInvoices])

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault()
        setBusy("create")
        try {
            const res = await fetch("/api/client/invoices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    client_name: clientName.trim(),
                    client_email: clientEmail.trim() || undefined,
                    amount_naira: Number(amountNaira),
                    description: description.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to issue invoice")
                return
            }
            toast.success(`Issued invoice ${data.invoice.invoice_number}!`)
            setClientName("")
            setClientEmail("")
            setAmountNaira("")
            setDescription("")
            setShowModal(false)
            await loadInvoices()
        } finally {
            setBusy(null)
        }
    }

    const handleMarkStatus = async (id: number, status: "paid" | "unpaid" | "void") => {
        setBusy(`inv-${id}`)
        try {
            const res = await fetch("/api/client/invoices", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, status }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to update invoice")
                return
            }
            toast.success(`Invoice marked as ${status}.`)
            await loadInvoices()
        } finally {
            setBusy(null)
        }
    }

    if (activeScope.type !== "business") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <AlertCircle className="h-12 w-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-black mb-2">Business Scope Required</h2>
                <p className="text-muted-foreground max-w-md text-sm">
                    Switch your active workspace scope to Business / Merchant to manage corporate billing and invoices.
                </p>
            </div>
        )
    }

    const filtered = invoices.filter((inv) => {
        const matchStatus = statusFilter === "all" || inv.status === statusFilter
        const q = search.toLowerCase()
        const matchSearch =
            !q ||
            String(inv.client_name || "").toLowerCase().includes(q) ||
            String(inv.invoice_number || "").toLowerCase().includes(q)
        return matchStatus && matchSearch
    })

    const totalKobo = invoices.reduce((s, i) => s + Number(i.amount_kobo || 0), 0)
    const unpaidKobo = invoices
        .filter((i) => i.status === "unpaid")
        .reduce((s, i) => s + Number(i.amount_kobo || 0), 0)
    const paidKobo = invoices
        .filter((i) => i.status === "paid")
        .reduce((s, i) => s + Number(i.amount_kobo || 0), 0)
    const collectionRate = totalKobo > 0 ? Math.round((paidKobo / totalKobo) * 100) : 0

    return (
        <div className="max-w-7xl mx-auto p-2 md:p-8 space-y-8">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{activeScope.name}</p>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mt-1 flex items-center gap-3">
                        <Receipt className="h-8 w-8 text-primary" /> Invoices & Billing
                    </h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadInvoices} className="rounded-xl font-bold">
                        <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
                    </Button>
                    <Button onClick={() => setShowModal(true)} className="rounded-xl font-black">
                        <Plus className="h-4 w-4 mr-1.5" /> Issue Invoice
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-card p-6 rounded-2xl border">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Total Invoiced</p>
                    <p className="text-3xl font-black mt-2">₦{(totalKobo / 100).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">{invoices.length} invoices issued</p>
                </div>
                <div className="bg-card p-6 rounded-2xl border">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Outstanding Unpaid</p>
                    <p className="text-3xl font-black mt-2 text-rose-600">₦{(unpaidKobo / 100).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        {invoices.filter((i) => i.status === "unpaid").length} awaiting settlement
                    </p>
                </div>
                <div className="bg-card p-6 rounded-2xl border">
                    <p className="text-xs text-muted-foreground font-bold uppercase">Collected Revenue</p>
                    <p className="text-3xl font-black mt-2 text-emerald-600">₦{(paidKobo / 100).toLocaleString()}</p>
                    <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5" /> {collectionRate}% Collection Rate
                    </p>
                </div>
            </div>

            <div className="bg-card border rounded-2xl overflow-hidden">
                <div className="p-5 border-b flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex gap-1 bg-muted p-1 rounded-xl">
                        {(["all", "unpaid", "paid"] as const).map((st) => (
                            <button
                                key={st}
                                onClick={() => setStatusFilter(st)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize ${
                                    statusFilter === st ? "bg-background shadow-sm" : "text-muted-foreground"
                                }`}
                            >
                                {st}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search client or invoice #..."
                            className="w-full h-9 pl-9 pr-3 rounded-xl bg-background border text-xs"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 flex justify-center">
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-sm text-muted-foreground">
                        No invoices found. Click "Issue Invoice" to create your first persisted billing statement.
                    </div>
                ) : (
                    <div className="divide-y">
                        {filtered.map((inv) => (
                            <div key={inv.id} className="p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{inv.client_name}</p>
                                        <p className="text-xs text-muted-foreground font-mono">
                                            {inv.invoice_number} · Issued {new Date(inv.created_at).toLocaleDateString()}
                                        </p>
                                        {inv.description && <p className="text-xs text-muted-foreground mt-0.5">{inv.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-black text-base">₦{(Number(inv.amount_kobo) / 100).toLocaleString()}</p>
                                        <Badge variant={inv.status === "paid" ? "default" : "secondary"} className="text-[9px] uppercase">
                                            {inv.status}
                                        </Badge>
                                    </div>
                                    {inv.status === "unpaid" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={busy !== null}
                                            onClick={() => handleMarkStatus(inv.id, "paid")}
                                            className="rounded-xl text-xs font-bold gap-1"
                                        >
                                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> Mark Paid
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleCreate} className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Issue New Corporate Invoice</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setShowModal(false)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <input required placeholder="Client / Organization Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full h-11 px-3 rounded-xl border bg-background text-sm" />
                        <input type="email" placeholder="Client Billing Email (optional)" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className="w-full h-11 px-3 rounded-xl border bg-background text-sm" />
                        <input type="number" required min="1" step="0.01" placeholder="Amount (NGN)" value={amountNaira} onChange={(e) => setAmountNaira(e.target.value)} className="w-full h-11 px-3 rounded-xl border bg-background text-sm font-mono font-bold" />
                        <input placeholder="Line Item Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full h-11 px-3 rounded-xl border bg-background text-sm" />
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button type="submit" disabled={busy === "create"}>Publish Invoice</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
