"use client"

import * as React from "react"
import Link from "next/link"
import {
    Smartphone,
    Wifi,
    Zap,
    Tv,
    Landmark,
    CheckCircle2,
    Loader2,
    ShieldCheck,
    Receipt,
    Copy,
    ArrowRight,
    Clock,
    Sparkles,
    Search,
    CreditCard,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface BillCatalogItem {
    id: string
    category: "airtime" | "data" | "electricity" | "cable" | "levies"
    name: string
    providerCode: string
    customerLabel: string
    customerPlaceholder: string
    feeNaira: number
    minAmountNaira: number
    maxAmountNaira: number
    quickAmounts: number[]
    packages?: { label: string; amountNaira: number }[]
}

interface SpendAccount {
    id: string
    account_number: string
    account_type: string
    balanceNaira: number
    availableNaira: number
    status: string
    is_frozen: boolean
    pnd_enabled: boolean
}

interface RecentBill {
    id: string
    reference: string
    amountNaira: number
    status: string
    narration: string
    token: string | null
    billerName: string | null
    customerRef: string | null
    created_at: string
}

const CATEGORY_TABS = [
    { id: "all", label: "All Billers", icon: Sparkles },
    { id: "airtime", label: "Airtime", icon: Smartphone },
    { id: "data", label: "Data Bundles", icon: Wifi },
    { id: "electricity", label: "Electricity", icon: Zap },
    { id: "cable", label: "Cable TV", icon: Tv },
    { id: "levies", label: "IGR & Levies", icon: Landmark },
] as const

const fmtNaira = (n: number) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export function BillPaymentsWorkspace({ initialFilter = "all" }: { initialFilter?: string }) {
    const [loading, setLoading] = React.useState(true)
    const [catalog, setCatalog] = React.useState<BillCatalogItem[]>([])
    const [accounts, setAccounts] = React.useState<SpendAccount[]>([])
    const [recentBills, setRecentBills] = React.useState<RecentBill[]>([])

    const [activeCat, setActiveCat] = React.useState<string>(initialFilter)
    const [search, setSearch] = React.useState("")
    const [selectedBiller, setSelectedBiller] = React.useState<BillCatalogItem | null>(null)

    // Form fields
    const [sourceAccountId, setSourceAccountId] = React.useState("")
    const [customerRef, setCustomerRef] = React.useState("")
    const [amountNaira, setAmountNaira] = React.useState("")
    const [selectedPackage, setSelectedPackage] = React.useState<string | null>(null)
    const [pin, setPin] = React.useState("")
    const [submitting, setSubmitting] = React.useState(false)
    const [receipt, setReceipt] = React.useState<any | null>(null)

    const load = React.useCallback(async () => {
        try {
            const res = await fetch("/api/client/bills/pay", { cache: "no-store" })
            const data = await res.json()
            if (res.ok && data.success) {
                setCatalog(data.catalog || [])
                setAccounts(data.accounts || [])
                setRecentBills(data.recentBills || [])
                if (!selectedBiller && data.catalog?.length > 0) {
                    const match =
                        initialFilter !== "all"
                            ? data.catalog.find((b: BillCatalogItem) => b.category === initialFilter)
                            : data.catalog[0]
                    setSelectedBiller(match || data.catalog[0])
                }
                if (!sourceAccountId && data.accounts?.length > 0) {
                    const activeAcc = data.accounts.find(
                        (a: SpendAccount) => a.status === "active" && !a.is_frozen && !a.pnd_enabled
                    )
                    setSourceAccountId(activeAcc?.id || data.accounts[0].id)
                }
            }
        } catch {
            toast.error("Could not load bill payment providers.")
        } finally {
            setLoading(false)
        }
    }, [initialFilter, selectedBiller, sourceAccountId])

    React.useEffect(() => {
        load()
    }, [])

    const filteredBillers = React.useMemo(() => {
        return catalog.filter((item) => {
            const catOk = activeCat === "all" || item.category === activeCat
            const qOk =
                !search.trim() ||
                item.name.toLowerCase().includes(search.toLowerCase()) ||
                item.providerCode.toLowerCase().includes(search.toLowerCase())
            return catOk && qOk
        })
    }, [catalog, activeCat, search])

    const handleSelectBiller = (biller: BillCatalogItem) => {
        setSelectedBiller(biller)
        setSelectedPackage(null)
        setReceipt(null)
        if (biller.packages?.[0]) {
            setSelectedPackage(biller.packages[0].label)
            setAmountNaira(String(biller.packages[0].amountNaira))
        } else if (biller.quickAmounts?.[0]) {
            setAmountNaira(String(biller.quickAmounts[0]))
        } else {
            setAmountNaira("")
        }
    }

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedBiller) return
        if (!sourceAccountId) {
            toast.error("Select a source NUBAN account first.")
            return
        }
        if (!customerRef.trim()) {
            toast.error(`Enter a valid ${selectedBiller.customerLabel}.`)
            return
        }
        const amt = Number(amountNaira)
        if (!Number.isFinite(amt) || amt < selectedBiller.minAmountNaira) {
            toast.error(`Minimum amount is ${fmtNaira(selectedBiller.minAmountNaira)}.`)
            return
        }

        setSubmitting(true)
        try {
            const res = await fetch("/api/client/bills/pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceAccountId: Number(sourceAccountId),
                    billerId: selectedBiller.id,
                    billerName: selectedBiller.name,
                    category: selectedBiller.category,
                    customerRef: customerRef.trim(),
                    amountNaira: amt,
                    packageLabel: selectedPackage,
                    transactionPin: pin || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Bill payment failed.")
                return
            }
            setReceipt(data.receipt)
            setPin("")
            toast.success(`${selectedBiller.name} settled instantly!`)
            load()
        } catch {
            toast.error("Network error while settling bill.")
        } finally {
            setSubmitting(false)
        }
    }

    const copyText = (val: string, label: string) => {
        navigator.clipboard.writeText(val)
        toast.success(`${label} copied`)
    }

    const totalCharge = Number(amountNaira || 0) + (selectedBiller?.feeNaira || 0)

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm font-semibold">Loading live bill payment rails...</span>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Category Filter Pills + Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_TABS.map((tab) => {
                        const Icon = tab.icon
                        const active = activeCat === tab.id
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveCat(tab.id)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                                    active
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                <Icon className="h-3.5 w-3.5" />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search biller or DISCO..."
                        className="pl-9 h-9 rounded-xl bg-card text-xs"
                    />
                </div>
            </div>

            {/* Main 2-Column Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left: Biller Grid */}
                <div className="lg:col-span-7 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {filteredBillers.map((biller) => {
                            const isSelected = selectedBiller?.id === biller.id
                            const Icon =
                                biller.category === "airtime"
                                    ? Smartphone
                                    : biller.category === "data"
                                      ? Wifi
                                      : biller.category === "electricity"
                                        ? Zap
                                        : biller.category === "cable"
                                          ? Tv
                                          : Landmark

                            return (
                                <button
                                    key={biller.id}
                                    type="button"
                                    onClick={() => handleSelectBiller(biller)}
                                    className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                                        isSelected
                                            ? "bg-primary/5 border-primary ring-1 ring-primary/30 shadow-sm"
                                            : "bg-card border-border/80 hover:border-primary/40"
                                    }`}
                                >
                                    <div
                                        className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                                            isSelected
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-primary"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-sm font-bold text-foreground truncate">{biller.name}</p>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant="outline" className="text-[10px] font-mono uppercase">
                                                {biller.category}
                                            </Badge>
                                            <span className="text-[11px] font-semibold text-muted-foreground">
                                                {biller.feeNaira === 0 ? "Zero Fee" : `₦${biller.feeNaira} fee`}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {/* Recent Settled Bills */}
                    <Card className="border-border/80 rounded-2xl">
                        <CardHeader className="pb-3 border-b border-border/60 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-sm font-black flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-primary" /> Recent Bill Payments
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    Live settled utility debits & prepaid electricity tokens from your ledger.
                                </CardDescription>
                            </div>
                            <Button asChild variant="ghost" size="sm" className="text-xs font-bold">
                                <Link href="/client-dashboard/transactions">
                                    Full Ledger <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {recentBills.length === 0 ? (
                                <div className="p-8 text-center text-xs text-muted-foreground">
                                    No utility bill payments yet. Select a biller above to make an instant payment.
                                </div>
                            ) : (
                                <div className="divide-y divide-border/60">
                                    {recentBills.slice(0, 6).map((b) => (
                                        <div
                                            key={b.id}
                                            className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-muted/20 transition-colors"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-foreground truncate">
                                                    {b.billerName || b.narration}
                                                </p>
                                                <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                                                    <span className="font-mono">{b.reference}</span>
                                                    {b.token && (
                                                        <button
                                                            type="button"
                                                            onClick={() => copyText(b.token!, "Prepaid Token")}
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold hover:bg-emerald-500/20"
                                                        >
                                                            Token: {b.token} <Copy className="h-2.5 w-2.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-xs font-black font-mono text-foreground">
                                                    -{fmtNaira(b.amountNaira)}
                                                </p>
                                                <Link
                                                    href={`/client-dashboard/transactions/${b.id}`}
                                                    className="text-[10px] font-bold text-primary hover:underline"
                                                >
                                                    Receipt →
                                                </Link>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Instant Checkout & Receipt Panel */}
                <div className="lg:col-span-5 space-y-4">
                    {receipt ? (
                        <Card className="border-emerald-500/40 bg-emerald-500/5 rounded-2xl shadow-sm">
                            <CardHeader className="pb-3 border-b border-emerald-500/20">
                                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <CardTitle className="text-base font-black">Payment Settled Instantly</CardTitle>
                                </div>
                                <CardDescription className="text-xs">
                                    Debited from NUBAN {receipt.accountNumber} · GL Ref {receipt.glJournalRef || "Posted"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4 space-y-4 text-xs">
                                <div className="text-center py-3 rounded-xl bg-background border border-border/80">
                                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                                        Total Settled
                                    </p>
                                    <p className="text-3xl font-black font-mono text-foreground mt-0.5">
                                        {fmtNaira(receipt.totalDebitedNaira)}
                                    </p>
                                    <p className="text-[11px] text-muted-foreground mt-1">
                                        {receipt.billerName} · {receipt.customerRef}
                                    </p>
                                </div>

                                {receipt.meterToken && (
                                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                                        <p className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400">
                                            Prepaid Electricity Token ({receipt.unitsKwh} kWh)
                                        </p>
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-sm font-black tracking-wider text-foreground">
                                                {receipt.meterToken}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-[11px] font-bold"
                                                onClick={() => copyText(receipt.meterToken, "Prepaid Token")}
                                            >
                                                <Copy className="h-3 w-3 mr-1" /> Copy
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2 border-t border-border/60 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Reference</span>
                                        <span className="font-mono font-bold">{receipt.reference}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">New Account Balance</span>
                                        <span className="font-mono font-bold text-emerald-600">
                                            {fmtNaira(receipt.balanceAfterNaira)}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-2 pt-2">
                                    <Button asChild variant="outline" className="flex-1 rounded-xl text-xs font-bold">
                                        <Link href={`/client-dashboard/transactions/${receipt.transactionId}`}>
                                            <Receipt className="h-3.5 w-3.5 mr-1.5" /> Official Receipt
                                        </Link>
                                    </Button>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            setReceipt(null)
                                            setCustomerRef("")
                                        }}
                                        className="flex-1 rounded-xl text-xs font-bold"
                                    >
                                        Pay Another Bill
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <Card className="border-border/80 rounded-2xl shadow-sm sticky top-20">
                            <CardHeader className="pb-3 border-b border-border/60 bg-muted/20">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <CardTitle className="text-base font-black">
                                            {selectedBiller ? selectedBiller.name : "Select a Biller"}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-0.5">
                                            Instant atomic debit with Double-Entry GL settlement.
                                        </CardDescription>
                                    </div>
                                    <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                </div>
                            </CardHeader>

                            <CardContent className="pt-5">
                                {accounts.length === 0 ? (
                                    <div className="text-center py-6 space-y-3">
                                        <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/40" />
                                        <p className="text-xs text-muted-foreground">
                                            You need an active NUBAN account to pay bills.
                                        </p>
                                        <Button asChild size="sm" className="rounded-xl">
                                            <Link href="/explore/accounts">Open an Account</Link>
                                        </Button>
                                    </div>
                                ) : selectedBiller ? (
                                    <form onSubmit={handlePay} className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">Pay From Account</Label>
                                            <select
                                                value={sourceAccountId}
                                                onChange={(e) => setSourceAccountId(e.target.value)}
                                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-xs font-semibold outline-none focus:ring-2 focus:ring-primary/30"
                                                required
                                            >
                                                {accounts.map((a) => (
                                                    <option key={a.id} value={a.id} disabled={a.is_frozen || a.pnd_enabled}>
                                                        {a.account_type} · {a.account_number} ({fmtNaira(a.availableNaira)})
                                                        {a.is_frozen ? " [FROZEN]" : a.pnd_enabled ? " [PND]" : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">{selectedBiller.customerLabel}</Label>
                                            <Input
                                                value={customerRef}
                                                onChange={(e) => setCustomerRef(e.target.value)}
                                                placeholder={selectedBiller.customerPlaceholder}
                                                className="h-10 rounded-xl font-mono text-sm"
                                                required
                                            />
                                        </div>

                                        {selectedBiller.packages && selectedBiller.packages.length > 0 && (
                                            <div className="space-y-1.5">
                                                <Label className="text-xs font-bold">Select Package / Plan</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {selectedBiller.packages.map((pkg) => {
                                                        const active = selectedPackage === pkg.label
                                                        return (
                                                            <button
                                                                key={pkg.label}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedPackage(pkg.label)
                                                                    setAmountNaira(String(pkg.amountNaira))
                                                                }}
                                                                className={`p-2.5 rounded-xl border text-left transition-all ${
                                                                    active
                                                                        ? "border-primary bg-primary/10 text-primary"
                                                                        : "border-border hover:border-primary/40"
                                                                }`}
                                                            >
                                                                <p className="text-[11px] font-bold truncate">{pkg.label}</p>
                                                                <p className="text-xs font-black font-mono mt-0.5">
                                                                    ₦{pkg.amountNaira.toLocaleString()}
                                                                </p>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">Amount (NGN)</Label>
                                            <Input
                                                type="number"
                                                min={selectedBiller.minAmountNaira}
                                                max={selectedBiller.maxAmountNaira}
                                                value={amountNaira}
                                                onChange={(e) => {
                                                    setAmountNaira(e.target.value)
                                                    setSelectedPackage(null)
                                                }}
                                                placeholder={`Min ₦${selectedBiller.minAmountNaira.toLocaleString()}`}
                                                className="h-10 rounded-xl font-mono font-bold text-sm"
                                                required
                                            />
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {selectedBiller.quickAmounts.map((amt) => (
                                                    <button
                                                        key={amt}
                                                        type="button"
                                                        onClick={() => setAmountNaira(String(amt))}
                                                        className="px-2.5 py-1 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary text-[11px] font-bold font-mono transition-colors"
                                                    >
                                                        ₦{amt.toLocaleString()}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold">4-Digit Transaction PIN (if enabled)</Label>
                                            <Input
                                                type="password"
                                                inputMode="numeric"
                                                maxLength={4}
                                                value={pin}
                                                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                                placeholder="••••"
                                                className="h-10 rounded-xl font-mono tracking-widest text-sm"
                                            />
                                        </div>

                                        <div className="rounded-xl bg-muted/40 border border-border/70 p-3 text-xs space-y-1">
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Bill Amount</span>
                                                <span className="font-mono font-bold">{fmtNaira(Number(amountNaira || 0))}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-muted-foreground">Convenience Fee</span>
                                                <span className="font-mono font-bold">
                                                    {selectedBiller.feeNaira === 0 ? "Free" : fmtNaira(selectedBiller.feeNaira)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between pt-1.5 border-t border-border/60 font-black">
                                                <span>Total Debit</span>
                                                <span className="font-mono text-primary">{fmtNaira(totalCharge)}</span>
                                            </div>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={submitting}
                                            className="w-full h-11 rounded-xl font-black text-sm"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Settling Bill...
                                                </>
                                            ) : (
                                                <>Pay {fmtNaira(totalCharge)} Instantly</>
                                            )}
                                        </Button>
                                    </form>
                                ) : null}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
