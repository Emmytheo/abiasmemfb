"use client"

import * as React from "react"
import Link from "next/link"
import {
    Receipt,
    TrendingUp,
    TrendingDown,
    RotateCcw,
    Download,
    Search,
    RefreshCw,
    Loader2,
    BookOpen,
    AlertTriangle,
    ExternalLink,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

interface TxRow {
    id: number
    reference: string
    type: string
    amount: number | string
    status: string
    narration?: string
    channel?: string
    balance_after?: number | string
    from_account_number?: string
    to_account_number?: string
    customer_name?: string
    gl_journal_ref?: string | null
    metadata?: Record<string, any>
    created_at: string
}

const fmtNaira = (kobo: number | string) =>
    `₦${(Number(kobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtCompact = (kobo: number | string) =>
    `₦${(Number(kobo || 0) / 100).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`

export default function TransactionsPage() {
    const [txs, setTxs] = React.useState<TxRow[]>([])
    const [summary, setSummary] = React.useState<any>({})
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [typeFilter, setTypeFilter] = React.useState("all")
    const [statusFilter, setStatusFilter] = React.useState("all")

    // Inspector & Reversal Drawer
    const [selected, setSelected] = React.useState<TxRow | null>(null)
    const [revReason, setRevReason] = React.useState("")
    const [reversing, setReversing] = React.useState(false)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/transactions", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load transaction ledger")
                return
            }
            const rows: TxRow[] = data.transactions || []
            setTxs(rows)
            setSummary(data.summary || {})
            setSelected((prev) => (prev ? rows.find((r) => r.id === prev.id) || null : null))
        } catch {
            toast.error("Failed to fetch transactions")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleReverse = async () => {
        if (!selected) return
        setReversing(true)
        try {
            const res = await fetch("/api/admin/transactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reverse",
                    transaction_id: selected.id,
                    reason: revReason.trim() || "Supervisor ledger reversal",
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Reversal rejected")
                return
            }
            toast.success(data.message || "Transaction reversed atomically!")
            setRevReason("")
            await loadData()
        } finally {
            setReversing(false)
        }
    }

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return txs.filter((tx) => {
            const matchType = typeFilter === "all" || tx.type === typeFilter
            const matchStatus = statusFilter === "all" || tx.status === statusFilter
            const matchQ =
                !q ||
                String(tx.reference || "").toLowerCase().includes(q) ||
                String(tx.narration || "").toLowerCase().includes(q) ||
                String(tx.customer_name || "").toLowerCase().includes(q) ||
                String(tx.from_account_number || "").includes(q) ||
                String(tx.to_account_number || "").includes(q)
            return matchType && matchStatus && matchQ
        })
    }, [txs, search, typeFilter, statusFilter])

    const exportCsv = () => {
        const header = "Reference,Type,Amount_NGN,Status,Channel,From_NUBAN,To_NUBAN,Customer,GL_Ref,Narration,Timestamp\n"
        const lines = filtered
            .map((t) =>
                [
                    t.reference,
                    t.type,
                    (Number(t.amount || 0) / 100).toFixed(2),
                    t.status,
                    t.channel || "portal",
                    t.from_account_number || "",
                    t.to_account_number || "",
                    `"${String(t.customer_name || "").replace(/"/g, '""')}"`,
                    t.gl_journal_ref || "",
                    `"${String(t.narration || "").replace(/"/g, '""')}"`,
                    t.created_at,
                ].join(",")
            )
            .join("\n")
        const blob = new Blob([header + lines], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `banksuite-transactions-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 pb-12">
            <BankPageHeader
                badge="Core Transaction Ledger & Reversal Desk"
                livePill={`${txs.length} Ledger Entries`}
                liveTone="emerald"
                title="Institutional Transaction Ledger"
                subtitle="Audit live credits, debits, interbank NIP transfers, loan disbursements, and repayments with Double-Entry GL references and one-click atomic reversal."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Download className="h-3.5 w-3.5" /> Export CSV
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                    </>
                }
            />

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Total Settled Volume", value: fmtCompact(summary.total_volume_kobo || 0), sub: `${summary.total_count || txs.length} total transactions`, icon: Receipt, tone: "bg-primary/10 text-primary" },
                    { label: "Credits & Repayments", value: fmtCompact(summary.total_credits_kobo || 0), sub: "Cash-in, inflows & loan repayments", icon: TrendingUp, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Debits & Disbursements", value: fmtCompact(summary.total_debits_kobo || 0), sub: "Transfers, withdrawals & payouts", icon: TrendingDown, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Reversed / Exceptions", value: `${summary.reversed_count || 0} / ${summary.exception_count || 0}`, sub: "Reversed vs pending/failed legs", icon: RotateCcw, tone: "bg-amber-500/10 text-amber-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Table Card */}
            <div className="bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reference, NUBAN, customer, narration..."
                            className="pl-10 h-10 rounded-xl bg-background"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold capitalize"
                        >
                            {["all", "credit", "debit", "transfer", "disbursement", "repayment", "fee", "interest"].map((v) => (
                                <option key={v} value={v}>{v === "all" ? "All Types" : v}</option>
                            ))}
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-9 rounded-xl border border-input bg-background px-3 text-xs font-bold capitalize"
                        >
                            {["all", "successful", "reversed", "pending", "failed"].map((v) => (
                                <option key={v} value={v}>{v === "all" ? "All Statuses" : v}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading live ledger...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">No matching transactions.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">Reference &amp; GL</th>
                                    <th className="px-5 py-3.5">Account / Party</th>
                                    <th className="px-5 py-3.5">Type &amp; Narration</th>
                                    <th className="px-5 py-3.5 text-right">Amount</th>
                                    <th className="px-5 py-3.5">Status</th>
                                    <th className="px-5 py-3.5 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.map((tx) => {
                                    const isCredit = ["credit", "repayment", "interest"].includes(tx.type)
                                    return (
                                        <tr key={tx.id} className="hover:bg-muted/25 transition-colors">
                                            <td className="px-5 py-3.5">
                                                <p className="font-mono font-bold text-foreground">{tx.reference}</p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    {new Date(tx.created_at).toLocaleString()}
                                                </p>
                                                {tx.gl_journal_ref && (
                                                    <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[9px] font-bold">
                                                        <BookOpen className="h-2.5 w-2.5" /> {tx.gl_journal_ref}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-foreground truncate max-w-[180px]">{tx.customer_name || "Ledger Entry"}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground">
                                                    {tx.from_account_number ? `DR ${tx.from_account_number}` : ""}
                                                    {tx.from_account_number && tx.to_account_number ? " → " : ""}
                                                    {tx.to_account_number ? `CR ${tx.to_account_number}` : ""}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge variant="outline" className="text-[9px] uppercase font-black mb-1">{tx.type} · {tx.channel}</Badge>
                                                <p className="text-muted-foreground truncate max-w-[260px]">{tx.narration || "—"}</p>
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-mono font-black text-sm tabular-nums-fintech">
                                                <span className={isCredit ? "text-emerald-600" : "text-foreground"}>
                                                    {isCredit ? "+" : "-"}{fmtNaira(tx.amount)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <Badge
                                                    variant={
                                                        tx.status === "successful"
                                                            ? "default"
                                                            : tx.status === "reversed"
                                                                ? "outline"
                                                                : "destructive"
                                                    }
                                                    className={`text-[9px] uppercase font-black ${
                                                        tx.status === "reversed" ? "border-blue-500/40 text-blue-600 bg-blue-500/10" : ""
                                                    }`}
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                <Button size="sm" variant="outline" onClick={() => setSelected(tx)} className="h-8 rounded-xl text-[11px] font-bold">
                                                    Inspect
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Transaction Inspector & Reversal Drawer */}
            <BankSideDrawer
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title={selected ? `Transaction ${selected.reference}` : "Transaction Inspector"}
                subtitle={selected ? `${selected.type.toUpperCase()} · ${new Date(selected.created_at).toLocaleString()}` : undefined}
            >
                {selected && (
                    <div className="space-y-5">
                        <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Settled Amount</p>
                            <p className="text-3xl font-black font-mono tabular-nums-fintech">{fmtNaira(selected.amount)}</p>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <Badge className="uppercase text-[10px]">{selected.status}</Badge>
                                <Badge variant="outline" className="uppercase text-[10px]">{selected.channel}</Badge>
                                {selected.gl_journal_ref && (
                                    <Badge variant="outline" className="font-mono text-[10px] border-emerald-500/40 text-emerald-600">
                                        {selected.gl_journal_ref}
                                    </Badge>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2.5 text-xs p-4 rounded-2xl border border-border/80 bg-card">
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">Customer</span>
                                <span className="font-bold text-right">{selected.customer_name || "—"}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">From Account (DR)</span>
                                <span className="font-mono font-bold">{selected.from_account_number || "External / Vault"}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">To Account (CR)</span>
                                <span className="font-mono font-bold">{selected.to_account_number || "External / Clearing"}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                                <span className="text-muted-foreground">Narration</span>
                                <span className="font-semibold text-right max-w-[220px]">{selected.narration || "—"}</span>
                            </div>
                        </div>

                        {selected.status === "successful" && !selected.reference.startsWith("REV_") && (
                            <div className="p-4 rounded-2xl border border-rose-500/30 bg-rose-500/5 space-y-3">
                                <div className="flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-xs font-black text-rose-700 dark:text-rose-400">Supervisor Atomic Reversal</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Restores debited/credited account balances, posts an offsetting REV_ entry, reverses Double-Entry GL, and logs audit trail.
                                        </p>
                                    </div>
                                </div>
                                <Input
                                    value={revReason}
                                    onChange={(e) => setRevReason(e.target.value)}
                                    placeholder="Mandatory reversal justification..."
                                    className="h-10 rounded-xl text-xs bg-background"
                                />
                                <Button
                                    variant="destructive"
                                    disabled={reversing}
                                    onClick={handleReverse}
                                    className="w-full h-10 rounded-xl font-black text-xs gap-1.5"
                                >
                                    {reversing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                    Execute Atomic Reversal
                                </Button>
                            </div>
                        )}

                        <Button asChild variant="outline" className="w-full h-10 rounded-xl font-bold text-xs">
                            <Link href={`/products/transactions/${selected.id}`}>
                                Open Printable Receipt View <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
