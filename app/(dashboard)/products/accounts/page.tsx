"use client"

import * as React from "react"
import Link from "next/link"
import {
    Landmark,
    Wallet,
    Snowflake,
    Shield,
    Search,
    RefreshCw,
    PlusCircle,
    ArrowDownLeft,
    ArrowUpRight,
    ExternalLink,
    Lock,
    Unlock,
    Loader2,
    Database,
    Copy,
    Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

interface AccountRow {
    id: number
    account_number: string
    account_type: string
    balance: number | string
    lien_amount: number | string
    is_frozen: boolean
    pnd_enabled: boolean
    status: string
    source: string
    user_id: string
    holder_name: string
    holder_email?: string
    kyc_status?: string
}

const fmtNaira = (kobo: number | string) =>
    `₦${(Number(kobo || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const fmtCompact = (kobo: number | string) =>
    `₦${(Number(kobo || 0) / 100).toLocaleString(undefined, { notation: "compact", maximumFractionDigits: 2 })}`

export default function AdminAccountsPage() {
    const [accounts, setAccounts] = React.useState<AccountRow[]>([])
    const [customers, setCustomers] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [statusFilter, setStatusFilter] = React.useState<"all" | "active" | "restricted" | "qore">("all")
    const [copiedId, setCopiedId] = React.useState<number | null>(null)

    // Slide-over Inspector & Operational Controls
    const [selected, setSelected] = React.useState<AccountRow | null>(null)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [postDir, setPostDir] = React.useState<"deposit" | "withdrawal">("deposit")
    const [postAmount, setPostAmount] = React.useState("")
    const [postNarration, setPostNarration] = React.useState("")
    const [lienInput, setLienInput] = React.useState("")

    // Provision New NUBAN drawer
    const [showOpenDrawer, setShowOpenDrawer] = React.useState(false)
    const [newCustomerId, setNewCustomerId] = React.useState("")
    const [newAccType, setNewAccType] = React.useState<"Savings" | "Current" | "Corporate" | "Fixed Deposit">("Savings")
    const [newOpeningNaira, setNewOpeningNaira] = React.useState("")

    const loadAll = React.useCallback(async () => {
        setLoading(true)
        try {
            const [tellerRes, custRes] = await Promise.all([
                fetch("/api/admin/teller", { cache: "no-store" }),
                fetch("/api/admin/customers/manage", { cache: "no-store" }),
            ])
            const [tellerData, custData] = await Promise.all([tellerRes.json(), custRes.json()])
            if (tellerData.success) {
                const list: AccountRow[] = tellerData.accounts || []
                setAccounts(list)
                setSelected((prev) => (prev ? list.find((a) => a.id === prev.id) || null : null))
            }
            if (custData.success) {
                setCustomers(custData.customers || [])
                if (!newCustomerId && custData.customers?.[0]?.id) {
                    setNewCustomerId(String(custData.customers[0].id))
                }
            }
        } catch {
            toast.error("Failed to load NUBAN account directory")
        } finally {
            setLoading(false)
        }
    }, [newCustomerId])

    React.useEffect(() => {
        loadAll()
    }, [])

    const copyNuban = (acc: AccountRow) => {
        navigator.clipboard.writeText(acc.account_number)
        setCopiedId(acc.id)
        toast.success(`Copied NUBAN ${acc.account_number}`)
        setTimeout(() => setCopiedId(null), 1500)
    }

    const handleQuickPost = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selected || !postAmount || Number(postAmount) <= 0) {
            toast.error("Enter a positive Naira amount.")
            return
        }
        setBusy("post")
        try {
            const res = await fetch("/api/admin/teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: postDir,
                    account_id: selected.id,
                    amount_naira: Number(postAmount),
                    narration: postNarration.trim() || `Branch Desk ${postDir === "deposit" ? "Cash-In" : "Cash-Out"}`,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Teller posting failed")
                return
            }
            toast.success(
                data.queued
                    ? "Queued in Maker-Checker Approvals"
                    : `Posted ${postDir === "deposit" ? "+" : "-"}₦${Number(postAmount).toLocaleString()} (GL ${data.posting?.glJournalRef || "posted"})`
            )
            setPostAmount("")
            setPostNarration("")
            await loadAll()
        } finally {
            setBusy(null)
        }
    }

    const handleControlUpdate = async (patch: { is_frozen?: boolean; pnd_enabled?: boolean; lien_naira?: number }) => {
        if (!selected) return
        setBusy("ctrl")
        try {
            const res = await fetch("/api/admin/teller", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "update_controls", account_id: selected.id, ...patch }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Control update failed")
                return
            }
            toast.success("Account compliance control persisted & audited.")
            await loadAll()
        } finally {
            setBusy(null)
        }
    }

    const handleOpenAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCustomerId) {
            toast.error("Select a customer first.")
            return
        }
        setBusy("open")
        try {
            const res = await fetch("/api/admin/customers/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "open_account",
                    customer_id: Number(newCustomerId),
                    account_type: newAccType,
                    opening_deposit_naira: Number(newOpeningNaira || 0),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to provision account")
                return
            }
            toast.success(`Provisioned ${newAccType} NUBAN ${data.account?.account_number}!`)
            setShowOpenDrawer(false)
            setNewOpeningNaira("")
            await loadAll()
        } finally {
            setBusy(null)
        }
    }

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return accounts.filter((a) => {
            const matchFilter =
                statusFilter === "all" ||
                (statusFilter === "active" && a.status === "active" && !a.is_frozen && !a.pnd_enabled) ||
                (statusFilter === "restricted" && (a.is_frozen || a.pnd_enabled || a.status !== "active" || Number(a.lien_amount) > 0)) ||
                (statusFilter === "qore" && a.source === "qore")
            const matchSearch =
                !q ||
                String(a.account_number || "").toLowerCase().includes(q) ||
                String(a.holder_name || "").toLowerCase().includes(q) ||
                String(a.holder_email || "").toLowerCase().includes(q) ||
                String(a.account_type || "").toLowerCase().includes(q)
            return matchFilter && matchSearch
        })
    }, [accounts, search, statusFilter])

    const totalDepositsKobo = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)
    const activeCount = accounts.filter((a) => a.status === "active" && !a.is_frozen).length
    const restrictedCount = accounts.filter((a) => a.is_frozen || a.pnd_enabled || a.status !== "active").length
    const totalLienKobo = accounts.reduce((s, a) => s + Number(a.lien_amount || 0), 0)

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 pb-12">
            <BankPageHeader
                badge="Core Deposit Ledger · GL 2000"
                livePill={`${accounts.length} NUBANs Live`}
                liveTone="emerald"
                title="Customer Accounts & NUBAN Directory"
                subtitle="Real-time CASA & Fixed Deposit sub-ledger with instant teller cash posting, compliance locks (Freeze, PND, Lien), and one-click NUBAN provisioning."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadAll} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button size="sm" onClick={() => setShowOpenDrawer(true)} className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5" /> Provision NUBAN
                        </Button>
                    </>
                }
            />

            {/* KPI Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Total Deposit Liability", value: fmtCompact(totalDepositsKobo), sub: fmtNaira(totalDepositsKobo), icon: Wallet, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Active NUBAN Accounts", value: String(activeCount), sub: `of ${accounts.length} total accounts`, icon: Landmark, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Compliance Locks", value: String(restrictedCount), sub: "Frozen, PND, or dormant", icon: Shield, tone: restrictedCount > 0 ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground" },
                    { label: "Total Active Liens", value: fmtCompact(totalLienKobo), sub: "Ring-fenced collateral holds", icon: Snowflake, tone: "bg-violet-500/10 text-violet-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground truncate">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search NUBAN, customer name, or email..."
                            className="pl-10 h-10 rounded-xl bg-background"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-2xl">
                        {[
                            { id: "all", label: `All (${accounts.length})` },
                            { id: "active", label: `Active (${activeCount})` },
                            { id: "restricted", label: `Restricted (${restrictedCount})` },
                            { id: "qore", label: `Qore Synced (${accounts.filter((a) => a.source === "qore").length})` },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    statusFilter === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading live account sub-ledger...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">No accounts match your filter.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">NUBAN</th>
                                    <th className="px-5 py-3.5">Account Holder</th>
                                    <th className="px-5 py-3.5">Product Class</th>
                                    <th className="px-5 py-3.5 text-right">Ledger Balance</th>
                                    <th className="px-5 py-3.5">Controls &amp; Source</th>
                                    <th className="px-5 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.map((acc) => (
                                    <tr key={acc.id} className="hover:bg-muted/25 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <button
                                                onClick={() => copyNuban(acc)}
                                                className="inline-flex items-center gap-1.5 font-mono font-black text-foreground hover:text-primary"
                                            >
                                                {acc.account_number}
                                                {copiedId === acc.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-50" />}
                                            </button>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <p className="font-bold text-foreground">{acc.holder_name}</p>
                                            <p className="text-[11px] text-muted-foreground">{acc.holder_email || acc.user_id}</p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Badge variant="outline" className="text-[10px] font-bold">{acc.account_type}</Badge>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <p className="font-mono font-black text-sm tabular-nums-fintech">{fmtNaira(acc.balance)}</p>
                                            {Number(acc.lien_amount || 0) > 0 && (
                                                <p className="text-[10px] text-amber-600 font-bold">Lien: {fmtNaira(acc.lien_amount)}</p>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <Badge
                                                    variant={acc.status === "active" && !acc.is_frozen ? "default" : "destructive"}
                                                    className="text-[9px] uppercase font-black"
                                                >
                                                    {acc.is_frozen ? "Frozen" : acc.status}
                                                </Badge>
                                                {acc.pnd_enabled && (
                                                    <Badge variant="outline" className="text-[9px] uppercase font-black border-amber-500/40 text-amber-600 bg-amber-500/10">
                                                        PND
                                                    </Badge>
                                                )}
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase">
                                                    <Database className="h-3 w-3" /> {acc.source}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelected(acc)
                                                    setLienInput(String(Number(acc.lien_amount || 0) / 100))
                                                }}
                                                className="h-8 rounded-xl text-[11px] font-bold"
                                            >
                                                Operate
                                            </Button>
                                            <Button size="sm" variant="ghost" asChild className="h-8 rounded-xl text-[11px] font-bold">
                                                <Link href={`/products/accounts/${acc.id}`}>
                                                    Detail <ExternalLink className="h-3 w-3 ml-1" />
                                                </Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Slide-Over Account Operations Drawer */}
            <BankSideDrawer
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title={selected ? `NUBAN ${selected.account_number}` : "Account Operations"}
                subtitle={selected ? `${selected.holder_name} · ${selected.account_type}` : undefined}
            >
                {selected && (
                    <div className="space-y-6">
                        <div className="p-5 rounded-2xl bg-muted/40 border border-border/80 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Live Ledger Balance</p>
                            <p className="text-3xl font-black font-mono tabular-nums-fintech">{fmtNaira(selected.balance)}</p>
                            <div className="flex flex-wrap gap-2 pt-1 text-[11px]">
                                <Badge variant={selected.is_frozen ? "destructive" : "default"} className="uppercase text-[10px]">
                                    {selected.is_frozen ? "Frozen" : selected.status}
                                </Badge>
                                {selected.pnd_enabled && <Badge variant="outline" className="text-amber-600 border-amber-500/40">PND Active</Badge>}
                                <Badge variant="outline" className="font-mono">Lien: {fmtNaira(selected.lien_amount)}</Badge>
                            </div>
                        </div>

                        {/* Quick Teller Cash-In / Cash-Out (GL-Backed) */}
                        <form onSubmit={handleQuickPost} className="space-y-3 p-4 rounded-2xl border border-border/80 bg-card">
                            <p className="text-xs font-black uppercase tracking-wider text-foreground">Instant GL-Backed Teller Posting</p>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setPostDir("deposit")}
                                    className={`py-2.5 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 ${
                                        postDir === "deposit" ? "bg-emerald-600 text-white border-emerald-600" : "bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <ArrowDownLeft className="h-3.5 w-3.5" /> Cash-In (CR)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setPostDir("withdrawal")}
                                    className={`py-2.5 rounded-xl text-xs font-black border flex items-center justify-center gap-1.5 ${
                                        postDir === "withdrawal" ? "bg-rose-600 text-white border-rose-600" : "bg-muted/40 text-muted-foreground"
                                    }`}
                                >
                                    <ArrowUpRight className="h-3.5 w-3.5" /> Cash-Out (DR)
                                </button>
                            </div>
                            <Input
                                type="number"
                                min="1"
                                step="any"
                                value={postAmount}
                                onChange={(e) => setPostAmount(e.target.value)}
                                placeholder="Amount in Naira (₦)"
                                className="h-10 rounded-xl font-mono font-bold"
                                required
                            />
                            <Input
                                value={postNarration}
                                onChange={(e) => setPostNarration(e.target.value)}
                                placeholder="Narration (e.g. Branch Cash Deposit)"
                                className="h-10 rounded-xl"
                            />
                            <Button type="submit" disabled={busy !== null} className="w-full h-10 rounded-xl font-black text-xs">
                                {busy === "post" ? "Posting to GL 1000/2000..." : `Post ${postDir === "deposit" ? "Credit" : "Debit"}`}
                            </Button>
                        </form>

                        {/* Compliance Controls */}
                        <div className="space-y-3 p-4 rounded-2xl border border-border/80 bg-card">
                            <p className="text-xs font-black uppercase tracking-wider text-foreground">Compliance &amp; Lien Controls</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant={selected.is_frozen ? "default" : "destructive"}
                                    disabled={busy !== null}
                                    onClick={() => handleControlUpdate({ is_frozen: !selected.is_frozen })}
                                    className="h-10 rounded-xl font-bold text-xs gap-1.5"
                                >
                                    {selected.is_frozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                    {selected.is_frozen ? "Unfreeze" : "Freeze Account"}
                                </Button>
                                <Button
                                    variant="outline"
                                    disabled={busy !== null}
                                    onClick={() => handleControlUpdate({ pnd_enabled: !selected.pnd_enabled })}
                                    className="h-10 rounded-xl font-bold text-xs gap-1.5"
                                >
                                    <Shield className="h-3.5 w-3.5" />
                                    {selected.pnd_enabled ? "Lift PND" : "Place PND"}
                                </Button>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Input
                                    type="number"
                                    min="0"
                                    value={lienInput}
                                    onChange={(e) => setLienInput(e.target.value)}
                                    placeholder="Lien amount (₦)"
                                    className="h-9 rounded-xl font-mono text-xs"
                                />
                                <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={busy !== null}
                                    onClick={() => handleControlUpdate({ lien_naira: Number(lienInput || 0) })}
                                    className="h-9 rounded-xl font-bold text-xs shrink-0"
                                >
                                    Update Lien
                                </Button>
                            </div>
                        </div>

                        <Button asChild variant="outline" className="w-full h-10 rounded-xl font-bold text-xs">
                            <Link href={`/products/accounts/${selected.id}`}>
                                Open Full Account History &amp; Statement <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                            </Link>
                        </Button>
                    </div>
                )}
            </BankSideDrawer>

            {/* Provision New NUBAN Drawer */}
            <BankSideDrawer
                open={showOpenDrawer}
                onClose={() => setShowOpenDrawer(false)}
                title="Provision New NUBAN Account"
                subtitle="Opens a live deposit ledger account with instant NUBAN generation."
            >
                <form onSubmit={handleOpenAccount} className="space-y-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select Customer</label>
                        <select
                            value={newCustomerId}
                            onChange={(e) => setNewCustomerId(e.target.value)}
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                            required
                        >
                            {customers.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.first_name || ""} {c.last_name || ""} ({c.email || `ID #${c.id}`})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Account Product Class</label>
                        <select
                            value={newAccType}
                            onChange={(e) => setNewAccType(e.target.value as any)}
                            className="w-full h-10 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                        >
                            <option value="Savings">Savings (Retail CASA)</option>
                            <option value="Current">Current (Checking)</option>
                            <option value="Corporate">Corporate / SME Operating</option>
                            <option value="Fixed Deposit">Fixed Deposit Vault</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Opening Deposit (₦ Optional)</label>
                        <Input
                            type="number"
                            min="0"
                            value={newOpeningNaira}
                            onChange={(e) => setNewOpeningNaira(e.target.value)}
                            placeholder="0"
                            className="h-10 rounded-xl font-mono"
                        />
                    </div>
                    <Button type="submit" disabled={busy === "open"} className="w-full h-11 rounded-xl font-black text-xs">
                        {busy === "open" ? "Provisioning NUBAN..." : "Provision Live NUBAN Account"}
                    </Button>
                </form>
            </BankSideDrawer>
        </div>
    )
}
