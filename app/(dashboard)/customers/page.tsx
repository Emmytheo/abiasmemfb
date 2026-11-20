"use client"

import * as React from "react"
import Link from "next/link"
import {
    Users,
    RefreshCw,
    ShieldCheck,
    UserCheck,
    Wallet,
    Loader2,
    Search,
    PlusCircle,
    Landmark,
    ExternalLink,
    CreditCard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

const fmtNaira = (kobo: number) => `₦${(Number(kobo || 0) / 100).toLocaleString()}`

export default function AdminCustomers360Page() {
    const [customers, setCustomers] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [kycFilter, setKycFilter] = React.useState("all")

    // Customer 360 Drawer
    const [drawerLoading, setDrawerLoading] = React.useState(false)
    const [profile360, setProfile360] = React.useState<any | null>(null)
    const [busy, setBusy] = React.useState<string | null>(null)

    // KYC upgrade controls
    const [kycTier, setKycTier] = React.useState(2)
    const [kycStatus, setKycStatus] = React.useState("active")
    const [riskTier, setRiskTier] = React.useState("low")
    const [bvnInput, setBvnInput] = React.useState("")
    const [ninInput, setNinInput] = React.useState("")

    // Open New NUBAN Account controls
    const [newAccType, setNewAccType] = React.useState<"Savings" | "Current" | "Fixed Deposit" | "Corporate">("Savings")
    const [openingDeposit, setOpeningDeposit] = React.useState("0")

    const loadCustomers = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/customers/manage", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load customers")
                return
            }
            setCustomers(data.customers || [])
        } catch {
            toast.error("Failed to fetch customer directory")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadCustomers()
    }, [loadCustomers])

    const openCustomer360 = async (customerId: number) => {
        setDrawerLoading(true)
        setProfile360({ customer: { id: customerId, first_name: "Loading", last_name: "..." } })
        try {
            const res = await fetch(`/api/admin/customers/manage?customerId=${customerId}`, { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Could not load Customer 360")
                setProfile360(null)
                return
            }
            setProfile360(data)
            setKycTier(Number(data.kycProfile?.kyc_tier || 1))
            setKycStatus(data.customer?.kyc_status || "active")
            setRiskTier(data.customer?.risk_tier || "low")
            setBvnInput(data.customer?.bvn || "")
            setNinInput(data.kycProfile?.nin || "")
        } catch {
            toast.error("Failed to fetch Customer 360")
            setProfile360(null)
        } finally {
            setDrawerLoading(false)
        }
    }

    const handleSyncQore = async () => {
        setIsSyncing(true)
        toast.info("Synchronizing customer registry with Qore...")
        try {
            const res = await fetch("/api/sync/customers", { method: "POST" })
            const result = await res.json()
            if (result.success) {
                toast.success(`Synced: ${result.results?.customersCreated || 0} new, ${result.results?.customersUpdated || 0} updated.`)
                await loadCustomers()
            } else {
                toast.error(result.error || "Sync failed")
            }
        } catch {
            toast.error("Sync request failed")
        } finally {
            setIsSyncing(false)
        }
    }

    const handleUpgradeKyc = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile360?.customer?.id) return
        setBusy("kyc")
        try {
            const res = await fetch("/api/admin/customers/manage", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: profile360.customer.id,
                    kyc_tier: kycTier,
                    kyc_status: kycStatus,
                    risk_tier: riskTier,
                    bvn: bvnInput,
                    nin: ninInput,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "KYC tier update failed")
                return
            }
            toast.success(`Updated customer to CBN Tier ${kycTier} (Daily limit synced)!`)
            await Promise.all([openCustomer360(profile360.customer.id), loadCustomers()])
        } finally {
            setBusy(null)
        }
    }

    const handleOpenAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!profile360?.customer?.id) return
        setBusy("open_acc")
        try {
            const res = await fetch("/api/admin/customers/manage", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customer_id: profile360.customer.id,
                    account_type: newAccType,
                    opening_deposit_naira: Number(openingDeposit || 0),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Account opening failed")
                return
            }
            toast.success(`Provisioned ${newAccType} NUBAN ${data.account.account_number}!`)
            setOpeningDeposit("0")
            await Promise.all([openCustomer360(profile360.customer.id), loadCustomers()])
        } finally {
            setBusy(null)
        }
    }

    const filtered = customers.filter((c) => {
        const q = search.toLowerCase()
        const matchQ =
            !q ||
            `${c.first_name || ""} ${c.last_name || ""}`.toLowerCase().includes(q) ||
            String(c.email || "").toLowerCase().includes(q) ||
            String(c.bvn || "").includes(q) ||
            String(c.phone_number || "").includes(q)
        const matchKyc = kycFilter === "all" || c.kyc_status === kycFilter
        return matchQ && matchKyc
    })

    const totalBalancesKobo = customers.reduce((s, c) => s + Number(c.total_balance_kobo || 0), 0)
    const tier2PlusCount = customers.filter((c) => Number(c.kyc_tier || 1) >= 2).length
    const activeKycCount = customers.filter((c) => c.kyc_status === "active").length

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6">
            <BankPageHeader
                badge="Customer 360 & CBN KYC Authority"
                livePill={`${activeKycCount} Verified · ${tier2PlusCount} Tier 2+`}
                liveTone="emerald"
                title="Customer Directory & KYC Tiering Desk"
                subtitle="Inspect unified retail, SME, and Copteller cooperative identities; verify BVN/NIN; enforce CBN Tier 1/2/3 limits; and provision new NUBAN accounts."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadCustomers} disabled={loading} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button size="sm" onClick={handleSyncQore} disabled={isSyncing} className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} /> {isSyncing ? "Syncing Qore..." : "Sync Qore Core"}
                        </Button>
                    </>
                }
            />

            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Customers", val: customers.length.toLocaleString(), sub: "Active non-archived profiles", icon: Users, tone: "bg-primary/10 text-primary" },
                    { label: "Tier 2 & 3 Verified", val: String(tier2PlusCount), sub: "BVN / NIN cleared limits", icon: ShieldCheck, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Active KYC Profiles", val: String(activeKycCount), sub: `${customers.length - activeKycCount} pending/other`, icon: UserCheck, tone: "bg-blue-500/10 text-blue-600" },
                    { label: "Consolidated Balances", val: fmtNaira(totalBalancesKobo), sub: "Across all linked NUBANs", icon: Wallet, tone: "bg-amber-500/10 text-amber-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-xl sm:text-2xl font-black tabular-nums-fintech">{k.val}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative max-w-sm w-full">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, email, phone, or BVN..."
                        className="pl-9 h-10 rounded-xl text-xs"
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {(["all", "active", "pending", "rejected"] as const).map((s) => (
                        <button
                            key={s}
                            type="button"
                            onClick={() => setKycFilter(s)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black capitalize border transition-all ${
                                kycFilter === s ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            {/* Customer Table */}
            <div className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
                {loading ? (
                    <div className="flex h-56 items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading customer profiles...
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5 font-black">Customer</th>
                                    <th className="px-5 py-3.5 font-black">KYC Tier &amp; IDs</th>
                                    <th className="px-5 py-3.5 font-black text-right">Accounts &amp; Balance</th>
                                    <th className="px-5 py-3.5 font-black">Risk / Status</th>
                                    <th className="px-5 py-3.5 font-black text-right">Customer 360</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/70">
                                {filtered.map((c) => (
                                    <tr key={c.id} onClick={() => openCustomer360(c.id)} className="hover:bg-muted/25 cursor-pointer transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="size-9 rounded-full bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
                                                    {(c.first_name?.[0] || "C")}{(c.last_name?.[0] || "")}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-black text-foreground truncate">{c.first_name} {c.last_name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{c.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5">
                                                <Badge variant="outline" className="text-[10px] font-black bg-emerald-500/10 text-emerald-700 border-emerald-500/20">
                                                    Tier {c.kyc_tier || 1}
                                                </Badge>
                                                <span className="font-mono text-[10px] text-muted-foreground">
                                                    {c.bvn ? `BVN ••••${String(c.bvn).slice(-4)}` : "No BVN"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <p className="font-mono font-black text-foreground">{fmtNaira(c.total_balance_kobo || 0)}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {c.accounts_count || 0} acc · {c.active_loans_count || 0} loans
                                            </p>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <Badge variant="outline" className="text-[9px] uppercase font-black mr-1.5">
                                                {c.kyc_status}
                                            </Badge>
                                            <span className="text-[10px] capitalize text-muted-foreground font-bold">{c.risk_tier || "low"} risk</span>
                                        </td>
                                        <td className="px-5 py-3.5 text-right">
                                            <Button size="sm" variant="outline" className="h-8 rounded-xl text-[11px] font-bold">
                                                Open 360 Drawer
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* CUSTOMER 360 SLIDE-OVER DRAWER */}
            <BankSideDrawer
                open={Boolean(profile360)}
                onClose={() => setProfile360(null)}
                title={profile360?.customer ? `${profile360.customer.first_name || ""} ${profile360.customer.last_name || ""}`.trim() : "Customer 360"}
                subtitle={profile360?.customer?.email || ""}
                badge={
                    profile360?.kycProfile ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-[10px] font-black uppercase">
                            CBN KYC Tier {profile360.kycProfile.kyc_tier} · Limit {fmtNaira(profile360.kycProfile.daily_limit_kobo)}/day
                        </Badge>
                    ) : null
                }
            >
                {drawerLoading || !profile360?.kycProfile ? (
                    <div className="flex h-48 items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading Customer 360 &amp; Copteller cross-link...
                    </div>
                ) : (
                    <div className="space-y-5">
                        {/* Linked Copteller Cooperative Standing */}
                        {profile360.coptellerLink?.linked && (
                            <div className="p-4 rounded-2xl bg-emerald-500/[0.06] border border-emerald-500/25 space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5" /> Linked Copteller Cooperative Member
                                    </span>
                                    <span className="font-mono font-black text-xs text-emerald-700">
                                        Trust {profile360.coptellerLink.trustScore850}/850
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Copteller Wallet: <strong className="font-mono text-foreground">{fmtNaira(profile360.coptellerLink.walletBalanceKobo)}</strong> ·{" "}
                                    {profile360.coptellerLink.memberships?.length || 0} union(s) · {profile360.coptellerLink.contracts?.length || 0} active Ajo/HP contract(s)
                                </p>
                            </div>
                        )}

                        {/* Bank Accounts + Open New NUBAN */}
                        <div className="space-y-2.5">
                            <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                <Landmark className="h-3.5 w-3.5 text-primary" /> Bank Accounts ({profile360.accounts?.length || 0})
                            </h3>
                            <div className="space-y-2">
                                {(profile360.accounts || []).map((a: any) => (
                                    <div key={a.id} className="p-3 rounded-2xl border border-border/80 bg-muted/15 flex items-center justify-between text-xs">
                                        <div>
                                            <p className="font-mono font-black text-foreground">{a.account_number}</p>
                                            <p className="text-[10px] text-muted-foreground">{a.account_type} · {a.status}</p>
                                        </div>
                                        <p className="font-mono font-black text-foreground">{fmtNaira(a.balance)}</p>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleOpenAccount} className="p-3.5 rounded-2xl border border-border/80 bg-muted/15 space-y-2.5">
                                <p className="text-[10px] font-black uppercase text-foreground flex items-center gap-1.5">
                                    <PlusCircle className="h-3.5 w-3.5 text-primary" /> Open New NUBAN Account
                                </p>
                                <div className="grid grid-cols-2 gap-2">
                                    <select
                                        value={newAccType}
                                        onChange={(e) => setNewAccType(e.target.value as any)}
                                        className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-bold"
                                    >
                                        <option value="Savings">Savings (5% p.a.)</option>
                                        <option value="Current">Current Account</option>
                                        <option value="Fixed Deposit">Fixed Deposit (12.5%)</option>
                                        <option value="Corporate">Corporate / SME</option>
                                    </select>
                                    <Input
                                        type="number"
                                        min="0"
                                        placeholder="Opening Deposit (₦)"
                                        value={openingDeposit}
                                        onChange={(e) => setOpeningDeposit(e.target.value)}
                                        className="h-9 rounded-xl text-xs font-bold"
                                    />
                                </div>
                                <Button type="submit" size="sm" disabled={busy === "open_acc"} className="w-full h-9 rounded-xl text-xs font-black">
                                    {busy === "open_acc" ? "Provisioning..." : "Provision NUBAN Account"}
                                </Button>
                            </form>
                        </div>

                        {/* CBN KYC Tier Upgrade Panel */}
                        <form onSubmit={handleUpgradeKyc} className="p-4 rounded-2xl border border-border/80 bg-muted/15 space-y-3">
                            <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                                CBN KYC Tier &amp; BVN/NIN Compliance Authority
                            </h3>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { t: 1, label: "Tier 1", sub: "₦50k/day" },
                                    { t: 2, label: "Tier 2", sub: "₦200k/day" },
                                    { t: 3, label: "Tier 3", sub: "₦5M/day" },
                                ].map((opt) => (
                                    <button
                                        key={opt.t}
                                        type="button"
                                        onClick={() => setKycTier(opt.t)}
                                        className={`p-2 rounded-xl border text-center transition-all ${
                                            kycTier === opt.t ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"
                                        }`}
                                    >
                                        <p className="text-xs font-black">{opt.label}</p>
                                        <p className="text-[9px] opacity-80">{opt.sub}</p>
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">BVN (11 Digits)</label>
                                    <Input value={bvnInput} onChange={(e) => setBvnInput(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="221..." className="h-9 rounded-xl font-mono text-xs" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground">NIN (11 Digits)</label>
                                    <Input value={ninInput} onChange={(e) => setNinInput(e.target.value.replace(/\D/g, "").slice(0, 11))} placeholder="11-digit NIN" className="h-9 rounded-xl font-mono text-xs" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <select value={kycStatus} onChange={(e) => setKycStatus(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-bold">
                                    <option value="active">KYC Active</option>
                                    <option value="pending">KYC Pending</option>
                                    <option value="rejected">KYC Rejected</option>
                                </select>
                                <select value={riskTier} onChange={(e) => setRiskTier(e.target.value)} className="h-9 rounded-xl border border-border bg-background px-2.5 text-xs font-bold">
                                    <option value="low">Low Risk</option>
                                    <option value="medium">Medium Risk</option>
                                    <option value="high">High Risk</option>
                                </select>
                            </div>
                            <Button type="submit" disabled={busy === "kyc"} className="w-full h-9 rounded-xl text-xs font-black">
                                {busy === "kyc" ? "Saving KYC Tier..." : "Authorize & Persist KYC Tier"}
                            </Button>
                        </form>

                        <div className="flex justify-between items-center pt-2 border-t border-border/70">
                            <span className="text-[11px] text-muted-foreground">
                                {profile360.loans?.length || 0} loan(s) · {profile360.transactions?.length || 0} recent txs
                            </span>
                            <Button asChild size="sm" variant="outline" className="h-8 rounded-xl text-xs font-bold gap-1">
                                <Link href={`/customers/${profile360.customer.id}`}>
                                    Full Customer Page <ExternalLink className="h-3 w-3" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
