"use client"

import * as React from "react"
import Link from "next/link"
import {
    Send,
    RefreshCw,
    CheckCircle2,
    Search,
    Users,
    ShieldCheck,
    Printer,
    Loader2,
    Landmark,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { api, Account, Beneficiary } from "@/lib/api"
import { NIGERIAN_BANKS } from "@/lib/data/nigerian-banks"
import { BankPageHeader } from "@/components/banking/page-header"

const fmtFull = (n: number) =>
    `₦${Number(n || 0).toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function TransfersPage() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()

    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [beneficiaries, setBeneficiaries] = React.useState<Beneficiary[]>([])
    const [loading, setLoading] = React.useState(true)
    const [lookingUp, setLookingUp] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)

    const [sourceAccountId, setSourceAccountId] = React.useState("")
    const [transferType, setTransferType] = React.useState<"internal" | "interbank">("internal")
    const [destinationBank, setDestinationBank] = React.useState("058")
    const [destinationAccount, setDestinationAccount] = React.useState("")
    const [destinationName, setDestinationName] = React.useState("")
    const [amount, setAmount] = React.useState("")
    const [narration, setNarration] = React.useState("")
    const [pin, setPin] = React.useState("")
    const [receipt, setReceipt] = React.useState<any>(null)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const [accs, bens] = await Promise.all([
                api.getUserAccounts(user.id).catch(() => []),
                api.getUserBeneficiaries(user.id).catch(() => []),
            ])
            const active = accs.filter((a) => a.status === "active")
            const list = active.length > 0 ? active : accs
            setAccounts(list)
            setBeneficiaries(bens)
            if (!sourceAccountId && list[0]?.id) {
                setSourceAccountId(String(list[0].id))
            }
        } catch {
            toast.error("Failed to load accounts for transfer.")
        } finally {
            setLoading(false)
        }
    }, [sourceAccountId])

    React.useEffect(() => {
        loadData()
    }, [])

    const sourceAccount = accounts.find((a) => String(a.id) === String(sourceAccountId)) || accounts[0] || null
    const feeNaira = transferType === "internal" ? 0 : 10.75
    const numericAmount = Number(amount || 0)
    const totalDebit = numericAmount > 0 ? numericAmount + feeNaira : 0

    const handleLookup = async (acctNum?: string, bankOverride?: string, typeOverride?: "internal" | "interbank") => {
        const target = (acctNum ?? destinationAccount).trim()
        const tType = typeOverride ?? transferType
        if (target.length < 10) return
        setLookingUp(true)
        try {
            const bankParam = tType === "internal" ? activeProfile.shortName.toLowerCase() : (bankOverride ?? destinationBank)
            const res = await fetch(`/api/account-lookup?accountNumber=${encodeURIComponent(target)}&bankCode=${encodeURIComponent(bankParam)}`)
            const data = await res.json()
            if (res.ok && data.accountName) {
                setDestinationName(data.accountName)
                toast.success(`Verified: ${data.accountName}`)
            } else {
                setDestinationName("")
                toast.error(data.error || "Account verification failed")
            }
        } catch {
            toast.error("Unable to verify account name")
        } finally {
            setLookingUp(false)
        }
    }

    const pickBeneficiary = (b: Beneficiary) => {
        const isInternal = !b.bank_code || b.bank_code === "090"
        setTransferType(isInternal ? "internal" : "interbank")
        if (!isInternal && b.bank_code) setDestinationBank(b.bank_code)
        setDestinationAccount(b.account_number)
        setDestinationName(b.account_name)
        toast.info(`Selected beneficiary: ${b.account_name}`)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!sourceAccount) {
            toast.error("Select a source NUBAN account.")
            return
        }
        if (destinationAccount.trim().length < 10) {
            toast.error("Enter a valid 10-digit NUBAN account number.")
            return
        }
        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            toast.error("Enter a valid positive transfer amount.")
            return
        }
        if (pin.length !== 4 || pin === "0000") {
            toast.error("Enter your valid 4-digit transaction PIN.")
            return
        }

        setSubmitting(true)
        try {
            const bankLabel =
                transferType === "internal"
                    ? activeProfile.shortName
                    : NIGERIAN_BANKS.find((b) => b.code === destinationBank)?.name || destinationBank

            const res = await fetch("/api/transfers/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    sourceAccountId: sourceAccount.id,
                    transferType,
                    destinationAccount: destinationAccount.trim(),
                    destinationBank: transferType === "internal" ? activeProfile.shortName : destinationBank,
                    destinationName: destinationName.trim() || "Verified Beneficiary",
                    amount: numericAmount,
                    narration: narration.trim() || `Transfer to ${destinationName || destinationAccount}`,
                    transactionPin: pin,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Transfer execution failed")
                return
            }

            setReceipt({
                reference: data.reference,
                amount: numericAmount,
                fee: data.feeNaira ?? feeNaira,
                destinationName: destinationName || "Beneficiary",
                destinationAccount: destinationAccount.trim(),
                destinationBank: bankLabel,
                sourceAccountNumber: sourceAccount.account_number,
                newBalance: data.newBalanceNaira,
                narration: narration.trim() || `Transfer to ${destinationName || destinationAccount}`,
                timestamp: new Date().toISOString(),
            })
            toast.success(`Transfer settled! Ref: ${data.reference}`)
            setAmount("")
            setNarration("")
            setPin("")
            await loadData()
        } catch (err: any) {
            toast.error(err.message || "Network error executing transfer")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · NIBSS NIP & Internal Rail`}
                livePill="Instant Settlement Active"
                liveTone="emerald"
                title="Fund Transfers"
                subtitle={`Execute zero-fee intra-bank ${activeProfile.shortName} transfers or instant NIBSS NIP interbank transfers with automatic Double-Entry GL settlement and instant receipts.`}
                actions={
                    <Button asChild variant="outline" size="sm" className="h-9 rounded-xl font-bold text-xs gap-1.5">
                        <Link href="/client-dashboard/beneficiaries">
                            <Users className="h-3.5 w-3.5" /> Beneficiaries ({beneficiaries.length})
                        </Link>
                    </Button>
                }
            />

            {loading ? (
                <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading transfer desk...
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left: Transfer Form */}
                    <form onSubmit={handleSubmit} className="lg:col-span-7 bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5">
                        {/* Rail Selector */}
                        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-muted/60">
                            <button
                                type="button"
                                onClick={() => setTransferType("internal")}
                                className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                                    transferType === "internal" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                Internal {activeProfile.shortName} (₦0 Fee)
                            </button>
                            <button
                                type="button"
                                onClick={() => setTransferType("interbank")}
                                className={`py-2.5 rounded-xl text-xs font-black transition-all ${
                                    transferType === "interbank" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                                }`}
                            >
                                Other Nigerian Banks (NIP)
                            </button>
                        </div>

                        {/* Source Account */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Debit Source NUBAN</label>
                            <select
                                value={sourceAccountId}
                                onChange={(e) => setSourceAccountId(e.target.value)}
                                className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                                required
                            >
                                {accounts.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.account_number} · {a.account_type} — {fmtFull(a.balance)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Saved Beneficiaries Quick-Pick */}
                        {beneficiaries.length > 0 && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Quick-Pick Saved Beneficiary</label>
                                <div className="flex flex-wrap gap-1.5">
                                    {beneficiaries.slice(0, 6).map((b) => (
                                        <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => pickBeneficiary(b)}
                                            className="px-3 py-1.5 rounded-xl border bg-muted/30 hover:bg-primary/10 hover:border-primary/40 text-xs font-bold transition-colors"
                                        >
                                            {b.account_name} · <span className="font-mono text-[10px] text-muted-foreground">{b.account_number}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Destination Bank (if Interbank) */}
                        {transferType === "interbank" && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Destination Bank</label>
                                <select
                                    value={destinationBank}
                                    onChange={(e) => setDestinationBank(e.target.value)}
                                    className="w-full h-11 rounded-xl border border-input bg-background px-3 text-xs font-bold"
                                >
                                    {NIGERIAN_BANKS.map((b) => (
                                        <option key={b.code} value={b.code}>{b.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Destination NUBAN + Verify */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Recipient Account Number (10 Digits)</label>
                            <div className="flex gap-2">
                                <Input
                                    value={destinationAccount}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, "").slice(0, 10)
                                        setDestinationAccount(val)
                                        if (val.length === 10) handleLookup(val)
                                    }}
                                    placeholder="e.g. 3041889711"
                                    className="h-11 rounded-xl font-mono font-bold text-sm"
                                    required
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    disabled={lookingUp || destinationAccount.length < 10}
                                    onClick={() => handleLookup()}
                                    className="h-11 rounded-xl font-bold text-xs px-4 shrink-0 gap-1.5"
                                >
                                    {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Verify
                                </Button>
                            </div>
                            {destinationName && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" /> {destinationName}
                                </div>
                            )}
                        </div>

                        {/* Amount & Quick Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Amount (₦)</label>
                                <Input
                                    type="number"
                                    min="1"
                                    step="any"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="h-11 rounded-xl font-mono font-black text-base"
                                    required
                                />
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                    {[1000, 5000, 10000, 50000].map((v) => (
                                        <button
                                            key={v}
                                            type="button"
                                            onClick={() => setAmount(String(v))}
                                            className="px-2 py-0.5 rounded-lg border bg-muted/40 text-[10px] font-mono font-bold"
                                        >
                                            ₦{v.toLocaleString()}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">4-Digit Transaction PIN</label>
                                <Input
                                    type="password"
                                    inputMode="numeric"
                                    maxLength={4}
                                    value={pin}
                                    onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                                    placeholder="••••"
                                    className="h-11 rounded-xl font-mono font-black text-center tracking-[0.5em] text-base"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Narration (Optional)</label>
                            <Input
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                placeholder="What is this payment for?"
                                className="h-10 rounded-xl text-xs"
                            />
                        </div>

                        <Button type="submit" disabled={submitting || !sourceAccount} className="w-full h-11 rounded-xl font-black text-xs gap-2">
                            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            {submitting ? "Settling Atomic Transfer..." : `Authorize & Send ${numericAmount > 0 ? fmtFull(totalDebit) : ""}`}
                        </Button>
                    </form>

                    {/* Right: Live Summary / Instant Receipt */}
                    <div className="lg:col-span-5 space-y-5">
                        {receipt ? (
                            <div className="bg-card border border-emerald-500/35 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                                        <CheckCircle2 className="h-5 w-5" /> Transfer Settled
                                    </div>
                                    <Button size="sm" variant="outline" onClick={() => window.print()} className="h-8 rounded-xl text-[11px] font-bold gap-1">
                                        <Printer className="h-3 w-3" /> Print
                                    </Button>
                                </div>
                                <div className="text-center py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                                    <p className="text-[10px] font-black uppercase text-emerald-700">Amount Transferred</p>
                                    <p className="text-3xl font-black font-mono text-emerald-700 mt-1">{fmtFull(receipt.amount)}</p>
                                </div>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-mono font-bold">{receipt.reference}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Recipient</span><span className="font-bold">{receipt.destinationName}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Account / Bank</span><span className="font-mono">{receipt.destinationAccount} ({receipt.destinationBank})</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Fee</span><span className="font-mono">{fmtFull(receipt.fee)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">New Balance</span><span className="font-mono font-bold">{fmtFull(receipt.newBalance)}</span></div>
                                </div>
                                <Button variant="outline" onClick={() => setReceipt(null)} className="w-full h-9 rounded-xl font-bold text-xs">
                                    Make Another Transfer
                                </Button>
                            </div>
                        ) : (
                            <div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Live Settlement Summary</h2>
                                    <Landmark className="h-4 w-4 text-primary" />
                                </div>
                                {sourceAccount && (
                                    <div className="p-4 rounded-2xl bg-muted/40 border space-y-1">
                                        <p className="text-[10px] font-black uppercase text-muted-foreground">Selected Source Account</p>
                                        <p className="font-mono font-black text-base">{sourceAccount.account_number}</p>
                                        <p className="text-xs font-bold text-emerald-600">Available: {fmtFull(sourceAccount.balance)}</p>
                                    </div>
                                )}
                                <div className="space-y-2 text-xs pt-2 border-t">
                                    <div className="flex justify-between"><span className="text-muted-foreground">Transfer Rail</span><Badge variant="outline" className="text-[10px] uppercase">{transferType}</Badge></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">Transfer Principal</span><span className="font-mono font-bold">{fmtFull(numericAmount)}</span></div>
                                    <div className="flex justify-between"><span className="text-muted-foreground">NIP / Processing Fee</span><span className="font-mono font-bold">{fmtFull(feeNaira)}</span></div>
                                    <div className="flex justify-between text-sm font-black pt-2 border-t">
                                        <span>Total Debit</span>
                                        <span className="font-mono">{fmtFull(totalDebit)}</span>
                                    </div>
                                </div>
                                <div className="p-3 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex items-start gap-2 text-[11px] text-muted-foreground">
                                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                                    Protected by idempotency keys, row-level ledger locking, daily CBN KYC limits, and automatic Double-Entry GL posting.
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
