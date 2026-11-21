"use client"

import * as React from "react"
import Link from "next/link"
import {
    Landmark,
    Wallet,
    Plus,
    ArrowRight,
    ArrowDownLeft,
    Send,
    Copy,
    Check,
    Loader2,
    Shield,
    Snowflake,
    Clock,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { Account, ProductApplication, ProductType } from "@/lib/api/types"
import { createClient } from "@/lib/supabase/client"
import { useScope } from "@/context/scope-context"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

const fmtFull = (n: number) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function MyProductsPage() {
    const { activeScope } = useScope()
    const [applications, setApplications] = React.useState<(ProductApplication & { product?: ProductType })[]>([])
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [fundingRequests, setFundingRequests] = React.useState<any[]>([])
    const [loading, setLoading] = React.useState(true)
    const [copiedAcc, setCopiedAcc] = React.useState<string | null>(null)

    // Fund Account Drawer
    const [fundAcc, setFundAcc] = React.useState<Account | null>(null)
    const [fundAmount, setFundAmount] = React.useState("")
    const [fundMethod, setFundMethod] = React.useState<"bank_transfer" | "card" | "ussd">("bank_transfer")
    const [fundNarration, setFundNarration] = React.useState("")
    const [submittingFund, setSubmittingFund] = React.useState(false)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const supabase = createClient()
            const { data: { user: supaUser } } = await supabase.auth.getUser()
            if (!supaUser) return

            const [apps, types, allAccounts, fundRes] = await Promise.all([
                api.getUserApplications(supaUser.id).catch(() => []),
                api.getAllProductTypes().catch(() => []),
                api.getUserAccounts(supaUser.id).catch(() => []),
                fetch("/api/client/funding", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
            ])

            const enrichedApps = apps
                .map((app) => ({ ...app, product: types.find((t) => t.id === app.product_type_id) }))
                .filter((app) => {
                    const blockType = (app.product?.financial_terms?.[0] as any)?.blockType
                    return !blockType || blockType === "savings-terms" || blockType === "fixed-deposit-terms"
                })

            let filteredAccounts = allAccounts
            if (activeScope.type === "business") {
                const biz = allAccounts.filter((a) => String(a.account_type) === "Current" || String(a.account_type) === "Corporate" || a.metadata?.is_corporate)
                if (biz.length > 0) filteredAccounts = biz
            } else if (activeScope.type === "coop") {
                const coop = allAccounts.filter((a) => a.metadata?.is_coop)
                if (coop.length > 0) filteredAccounts = coop
            }

            setAccounts(filteredAccounts)
            setApplications(enrichedApps)
            if (fundRes?.success) setFundingRequests(fundRes.requests || [])
        } finally {
            setLoading(false)
        }
    }, [activeScope.type])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const copyNuban = (num: string) => {
        navigator.clipboard.writeText(num)
        setCopiedAcc(num)
        toast.success(`Copied NUBAN ${num}`)
        setTimeout(() => setCopiedAcc(null), 1600)
    }

    const handleFundSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fundAcc || !fundAmount || Number(fundAmount) < 100) {
            toast.error("Enter at least ₦100 to fund your account.")
            return
        }
        setSubmittingFund(true)
        try {
            const res = await fetch("/api/client/funding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    account_id: Number(fundAcc.id),
                    amount_naira: Number(fundAmount),
                    method: fundMethod,
                    narration: fundNarration.trim() || `Inbound ${fundMethod} funding`,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Funding request failed")
                return
            }
            if (data.authorizationUrl) {
                toast.success("Redirecting to Paystack checkout...")
                window.location.href = data.authorizationUrl
                return
            }
            toast.success(data.message || "Deposit notice submitted to Teller Operations!")
            setFundAcc(null)
            setFundAmount("")
            setFundNarration("")
            await loadData()
        } finally {
            setSubmittingFund(false)
        }
    }

    const totalBalance = accounts.reduce((s, a) => s + Number(a.balance || 0), 0)
    const pendingApps = applications.filter((a) => a.status !== "approved")
    const pendingFunding = fundingRequests.filter((r) => r.status === "pending")

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Deposit Portfolio`}
                livePill={`${accounts.length} Active NUBAN${accounts.length === 1 ? "" : "s"}`}
                liveTone="emerald"
                title="My Assets & Deposit Accounts"
                subtitle="Manage your regulated NUBAN deposit accounts, initiate inbound funding requests, copy account details, and track pending account applications."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button asChild size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <Link href="/explore/accounts">
                                <Plus className="h-3.5 w-3.5" /> Open Account
                            </Link>
                        </Button>
                    </>
                }
            />

            {/* Portfolio KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Total Liquid Balance</span>
                        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600"><Wallet className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums-fintech">{fmtFull(totalBalance)}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Across {accounts.length} active deposit account(s)</p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Pending Deposit Notices</span>
                        <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600"><ArrowDownLeft className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums-fintech">{pendingFunding.length}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Awaiting teller clearing confirmation</p>
                </div>
                <div className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-1.5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Open Applications</span>
                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600"><Clock className="h-4 w-4" /></div>
                    </div>
                    <p className="text-2xl sm:text-3xl font-black tabular-nums-fintech">{pendingApps.length}</p>
                    <p className="text-[11px] text-muted-foreground font-medium">Account requests under review</p>
                </div>
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading your accounts...
                </div>
            ) : (
                <div className="space-y-8">
                    {accounts.length === 0 ? (
                        <div className="bg-card border border-border/80 rounded-3xl p-12 text-center space-y-4">
                            <Landmark className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                            <div>
                                <p className="font-black text-base">No Active Deposit Accounts Yet</p>
                                <p className="text-xs text-muted-foreground mt-1">Open a regulated Savings, Current, or Corporate NUBAN account in minutes.</p>
                            </div>
                            <Button asChild className="rounded-xl font-black text-xs">
                                <Link href="/explore/accounts">Browse Available Accounts</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {accounts.map((acc) => (
                                <div key={acc.id} className="bg-card border border-border/80 hover:border-primary/40 rounded-3xl p-6 shadow-sm transition-all flex flex-col justify-between gap-5">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-2">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-wider text-primary border-primary/25 bg-primary/5">
                                                {acc.account_type} Account
                                            </Badge>
                                            <div className="flex items-center gap-1">
                                                {acc.is_frozen && <Snowflake className="h-3.5 w-3.5 text-blue-500" />}
                                                {acc.pnd_enabled && <Shield className="h-3.5 w-3.5 text-amber-500" />}
                                                <Badge variant={acc.status === "active" && !acc.is_frozen ? "default" : "destructive"} className="text-[9px] uppercase font-black">
                                                    {acc.is_frozen ? "Frozen" : acc.status}
                                                </Badge>
                                            </div>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Available Balance</p>
                                            <p className="text-2xl sm:text-3xl font-black font-mono tabular-nums-fintech tracking-tight mt-0.5">
                                                {fmtFull(acc.balance)}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => copyNuban(acc.account_number)}
                                            className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl bg-muted/50 hover:bg-muted border border-border/60 text-xs font-mono font-bold transition-colors"
                                        >
                                            <span>NUBAN · {acc.account_number}</span>
                                            {copiedAcc === acc.account_number ? (
                                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                            ) : (
                                                <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="space-y-2 pt-3 border-t border-border/60">
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setFundAcc(acc)}
                                                className="h-9 rounded-xl font-bold text-xs gap-1.5"
                                            >
                                                <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" /> Fund
                                            </Button>
                                            <Button asChild size="sm" variant="outline" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                                                <Link href="/client-dashboard/transfers">
                                                    <Send className="h-3.5 w-3.5 text-primary" /> Transfer
                                                </Link>
                                            </Button>
                                        </div>
                                        <Button asChild size="sm" className="w-full h-9 rounded-xl font-black text-xs justify-between">
                                            <Link href={`/my-products/${acc.id}`}>
                                                Manage Account &amp; Statement <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Recent Funding Notices */}
                    {fundingRequests.length > 0 && (
                        <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                            <h2 className="text-base font-black">Recent Account Funding Requests</h2>
                            <div className="divide-y divide-border/60">
                                {fundingRequests.slice(0, 6).map((f) => (
                                    <div key={f.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                                        <div>
                                            <p className="font-mono font-bold text-foreground">{f.reference}</p>
                                            <p className="text-[11px] text-muted-foreground">
                                                NUBAN {f.account_number} · {String(f.method || "").toUpperCase()} · {new Date(f.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-mono font-black text-sm">₦{(Number(f.amount_kobo || 0) / 100).toLocaleString()}</p>
                                            <Badge variant={f.status === "completed" ? "default" : f.status === "rejected" ? "destructive" : "secondary"} className="text-[9px] uppercase">
                                                {f.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pending Applications */}
                    {pendingApps.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-base font-black text-foreground">Pending Account Applications</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingApps.map((app) => (
                                    <div key={app.id} className="bg-card border border-dashed border-border rounded-3xl p-5 flex flex-col justify-between gap-4">
                                        <div>
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <span className="text-xs font-black uppercase text-muted-foreground">{app.product?.name || "Account Application"}</span>
                                                <Badge variant="outline" className="text-[9px] uppercase border-amber-500/40 text-amber-600 bg-amber-500/10">
                                                    {app.workflow_stage || app.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <Button asChild size="sm" variant="outline" className="w-full h-9 rounded-xl text-xs font-bold justify-between">
                                            <Link href={`/applications/${app.id}`}>
                                                View Status Timeline <ArrowRight className="h-3.5 w-3.5" />
                                            </Link>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Fund Account Slide-Over Drawer */}
            <BankSideDrawer
                open={Boolean(fundAcc)}
                onClose={() => setFundAcc(null)}
                title={fundAcc ? `Fund NUBAN ${fundAcc.account_number}` : "Fund Account"}
                subtitle="Submit a verified deposit notice or launch Paystack card funding."
            >
                {fundAcc && (
                    <form onSubmit={handleFundSubmit} className="space-y-4">
                        <div className="p-4 rounded-2xl bg-muted/40 border text-xs space-y-1">
                            <p className="text-[10px] font-black uppercase text-muted-foreground">Destination NUBAN</p>
                            <p className="font-mono font-black text-lg">{fundAcc.account_number}</p>
                            <p className="text-muted-foreground">{fundAcc.account_type} · Current Balance {fmtFull(fundAcc.balance)}</p>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Funding Channel</label>
                            <div className="grid grid-cols-3 gap-2">
                                {[
                                    { id: "bank_transfer", label: "NIP Transfer" },
                                    { id: "card", label: "Debit Card" },
                                    { id: "ussd", label: "USSD" },
                                ].map((m) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setFundMethod(m.id as any)}
                                        className={`py-2.5 rounded-xl text-xs font-black border transition-all ${
                                            fundMethod === m.id ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground"
                                        }`}
                                    >
                                        {m.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
                            <Input
                                type="number"
                                min="100"
                                step="any"
                                value={fundAmount}
                                onChange={(e) => setFundAmount(e.target.value)}
                                placeholder="e.g. 25000"
                                className="h-11 rounded-xl font-mono font-bold text-base"
                                required
                            />
                            <div className="flex flex-wrap gap-1.5 pt-1">
                                {[5000, 10000, 25000, 50000, 100000].map((v) => (
                                    <button
                                        key={v}
                                        type="button"
                                        onClick={() => setFundAmount(String(v))}
                                        className="px-2.5 py-1 rounded-lg border bg-muted/40 hover:bg-muted text-[11px] font-mono font-bold"
                                    >
                                        ₦{v.toLocaleString()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Sender / Reference Note (Optional)</label>
                            <Input
                                value={fundNarration}
                                onChange={(e) => setFundNarration(e.target.value)}
                                placeholder="e.g. GTBank transfer ref / teller slip"
                                className="h-10 rounded-xl text-xs"
                            />
                        </div>

                        <Button type="submit" disabled={submittingFund} className="w-full h-11 rounded-xl font-black text-xs">
                            {submittingFund ? "Submitting Funding Notice..." : "Submit Deposit / Fund Account"}
                        </Button>
                    </form>
                )}
            </BankSideDrawer>
        </div>
    )
}
