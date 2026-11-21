"use client"

import * as React from "react"
import Link from "next/link"
import {
    ArrowDownLeft,
    ArrowUpRight,
    Receipt,
    Search,
    X,
    Download,
    Printer,
    RefreshCw,
    Loader2,
    ExternalLink,
} from "lucide-react"
import { api, Transaction } from "@/lib/api"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useScope } from "@/context/scope-context"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

const fmtFull = (n: number) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function groupByDate(txs: Transaction[]): Record<string, Transaction[]> {
    const groups: Record<string, Transaction[]> = {}
    for (const tx of txs) {
        const key = new Date(tx.created_at).toLocaleDateString("en-NG", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        })
        if (!groups[key]) groups[key] = []
        groups[key].push(tx)
    }
    return groups
}

export default function ClientTransactionsPage() {
    const { activeScope } = useScope()
    const [transactions, setTransactions] = React.useState<Transaction[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [typeFilter, setTypeFilter] = React.useState("all")
    const [selectedTx, setSelectedTx] = React.useState<Transaction | null>(null)

    const loadHistory = React.useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load ALL real user transactions without hiding entries via legacy amount heuristics
            const data = await api.getUserTransactions(user.id)
            setTransactions(data)
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadHistory()
    }, [loadHistory])

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return transactions.filter((tx) => {
            const matchType = typeFilter === "all" || tx.type === typeFilter
            const matchQ =
                !q ||
                String(tx.reference || "").toLowerCase().includes(q) ||
                String(tx.narration || "").toLowerCase().includes(q) ||
                String(tx.category || "").toLowerCase().includes(q)
            return matchType && matchQ
        })
    }, [transactions, typeFilter, search])

    const grouped = React.useMemo(() => groupByDate(filtered), [filtered])
    const totalCredits = filtered.filter((t) => t.type === "credit").reduce((s, t) => s + Number(t.amount || 0), 0)
    const totalDebits = filtered.filter((t) => t.type !== "credit").reduce((s, t) => s + Number(t.amount || 0), 0)
    const netFlow = totalCredits - totalDebits

    const exportCsv = () => {
        const header = "Date,Reference,Type,Amount_NGN,Status,Narration\n"
        const body = filtered
            .map((t) =>
                [
                    t.created_at,
                    t.reference || "",
                    t.type,
                    Number(t.amount || 0).toFixed(2),
                    t.status,
                    `"${String(t.narration || "").replace(/"/g, '""')}"`,
                ].join(",")
            )
            .join("\n")
        const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `statement-${new Date().toISOString().slice(0, 10)}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Account Statement`}
                livePill={`${filtered.length} Entry${filtered.length === 1 ? "" : "s"}`}
                liveTone="emerald"
                title="Transaction History & Receipts"
                subtitle="Complete real-time ledger of your credits, transfers, loan disbursements, repayments, and bills with downloadable CSV statements and official receipts."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={exportCsv} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <Download className="h-3.5 w-3.5" /> Export Statement
                        </Button>
                        <Button variant="outline" size="sm" onClick={loadHistory} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                    </>
                }
            />

            {/* Cashflow KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Inflow</p>
                    <p className="text-2xl font-black font-mono text-emerald-600 mt-1 tabular-nums-fintech">+{fmtFull(totalCredits)}</p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Outflow</p>
                    <p className="text-2xl font-black font-mono text-foreground mt-1 tabular-nums-fintech">-{fmtFull(totalDebits)}</p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm">
                    <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Net Movement</p>
                    <p className={`text-2xl font-black font-mono mt-1 tabular-nums-fintech ${netFlow >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                        {netFlow >= 0 ? "+" : "-"}{fmtFull(Math.abs(netFlow))}
                    </p>
                </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by reference or narration..."
                        className="pl-10 h-10 rounded-xl bg-card"
                    />
                    {search && (
                        <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-2xl">
                    {[
                        { label: "All", value: "all" },
                        { label: "Credits", value: "credit" },
                        { label: "Debits", value: "debit" },
                        { label: "Transfers", value: "transfer" },
                        { label: "Repayments", value: "repayment" },
                    ].map((f) => (
                        <button
                            key={f.value}
                            onClick={() => setTypeFilter(f.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                typeFilter === f.value ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading statement...
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-3">
                    <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <p className="text-sm font-bold text-muted-foreground">No transactions match your filters.</p>
                </div>
            ) : (
                <div className="space-y-5">
                    {Object.entries(grouped).map(([date, txs]) => (
                        <div key={date} className="space-y-2">
                            <div className="flex items-center gap-3 px-1">
                                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">{date}</span>
                                <div className="flex-1 h-px bg-border/70" />
                                <span className="text-[11px] font-bold text-muted-foreground">{txs.length}</span>
                            </div>
                            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden divide-y divide-border/60 shadow-sm">
                                {txs.map((tx) => {
                                    const isCredit = tx.type === "credit"
                                    return (
                                        <button
                                            key={tx.id}
                                            type="button"
                                            onClick={() => setSelectedTx(tx)}
                                            className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`size-10 rounded-2xl flex items-center justify-center shrink-0 ${isCredit ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                                                    {isCredit ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-bold text-foreground truncate">{tx.narration || tx.type}</p>
                                                        {tx.status !== "successful" && (
                                                            <Badge variant="outline" className="text-[9px] uppercase">{tx.status}</Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                                                        {new Date(tx.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                                        {tx.reference ? ` · ${tx.reference}` : ""}
                                                    </p>
                                                </div>
                                            </div>
                                            <p className={`text-sm font-mono font-black shrink-0 tabular-nums-fintech ${isCredit ? "text-emerald-600" : "text-foreground"}`}>
                                                {isCredit ? "+" : "-"}{fmtFull(tx.amount)}
                                            </p>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Official Receipt Drawer */}
            <BankSideDrawer
                open={Boolean(selectedTx)}
                onClose={() => setSelectedTx(null)}
                title="Official Transaction Receipt"
                subtitle={selectedTx?.reference || undefined}
            >
                {selectedTx && (
                    <div className="space-y-5">
                        <div className="p-5 rounded-2xl bg-muted/40 border text-center space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">{selectedTx.type}</p>
                            <p className={`text-3xl font-black font-mono ${selectedTx.type === "credit" ? "text-emerald-600" : "text-foreground"}`}>
                                {selectedTx.type === "credit" ? "+" : "-"}{fmtFull(selectedTx.amount)}
                            </p>
                            <Badge className="uppercase text-[10px] mt-1">{selectedTx.status}</Badge>
                        </div>
                        <div className="space-y-2.5 text-xs p-4 rounded-2xl border bg-card">
                            <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono font-bold">{selectedTx.reference}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Timestamp</span><span className="font-semibold">{new Date(selectedTx.created_at).toLocaleString()}</span></div>
                            <div className="flex justify-between gap-3"><span className="text-muted-foreground">Narration</span><span className="font-semibold text-right">{selectedTx.narration || "—"}</span></div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="outline" onClick={() => window.print()} className="h-10 rounded-xl font-bold text-xs gap-1.5">
                                <Printer className="h-3.5 w-3.5" /> Print Receipt
                            </Button>
                            <Button asChild className="h-10 rounded-xl font-black text-xs gap-1.5">
                                <Link href={`/client-dashboard/transactions/${selectedTx.id}`}>
                                    Full Page <ExternalLink className="h-3.5 w-3.5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
