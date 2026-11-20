"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Loader2,
    ArrowLeft,
    CreditCard,
    Building,
    Smartphone,
    Copy,
    Check,
    ShieldCheck,
    Clock,
} from "lucide-react"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"

export default function FundAccountPage() {
    const { activeProfile } = useBankProfile()
    const [accounts, setAccounts] = useState<any[]>([])
    const [requests, setRequests] = useState<any[]>([])
    const [paystackEnabled, setPaystackEnabled] = useState(false)
    const [selectedAccountId, setSelectedAccountId] = useState("")
    const [amount, setAmount] = useState("")
    const [narration, setNarration] = useState("")
    const [method, setMethod] = useState<"bank_transfer" | "card" | "ussd">("bank_transfer")
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [copied, setCopied] = useState(false)

    const loadFundingData = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/funding")
            const data = await res.json()
            if (res.ok && data.success) {
                setAccounts(data.accounts || [])
                setRequests(data.requests || [])
                setPaystackEnabled(Boolean(data.paystackEnabled))
                if (!selectedAccountId && data.accounts?.[0]?.id) {
                    setSelectedAccountId(String(data.accounts[0].id))
                }
            }
        } catch {
            toast.error("Failed to load accounts")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadFundingData()
    }, [])

    const selectedAccount = accounts.find((a) => String(a.id) === selectedAccountId)

    const copyAccount = () => {
        if (!selectedAccount?.account_number) return
        navigator.clipboard.writeText(selectedAccount.account_number)
        setCopied(true)
        toast.success("Account NUBAN copied!")
        setTimeout(() => setCopied(false), 2000)
    }

    const handleSubmitFunding = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedAccountId || !amount || Number(amount) < 100) {
            toast.error("Select an account and enter at least ₦100.")
            return
        }
        setSubmitting(true)
        try {
            const res = await fetch("/api/client/funding", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    account_id: Number(selectedAccountId),
                    amount_naira: Number(amount),
                    method,
                    narration: narration.trim() || undefined,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Funding request failed")
                return
            }
            if (data.authorizationUrl) {
                toast.success(data.message)
                window.location.href = data.authorizationUrl
                return
            }
            toast.success(data.message || "Funding notice logged for Teller verification!")
            setAmount("")
            setNarration("")
            await loadFundingData()
        } catch {
            toast.error("Network error submitting funding request")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading funding rails...
            </div>
        )
    }

    return (
        <div className="container max-w-3xl py-10 space-y-8">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50">
                    <Link href="/my-products">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Fund Account</h1>
                    <p className="text-sm text-muted-foreground">
                        Deposit via NIP Bank Transfer, USSD ({activeProfile.ussdCode}), or verified Card Gateway.
                    </p>
                </div>
            </div>

            {selectedAccount && (
                <Card className="p-5 border-primary/20 bg-primary/5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                            Direct Inbound Transfer NUBAN · {activeProfile.legalName}
                        </p>
                        <p className="text-2xl font-mono font-black tracking-wider mt-1">
                            {selectedAccount.account_number}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            {selectedAccount.account_type} · Available Balance: ₦{(Number(selectedAccount.balance || 0) / 100).toLocaleString()}
                        </p>
                    </div>
                    <Button variant="outline" onClick={copyAccount} className="rounded-xl font-bold gap-2 bg-background">
                        {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                        {copied ? "Copied" : "Copy NUBAN"}
                    </Button>
                </Card>
            )}

            <Card className="p-6 border rounded-2xl shadow-sm">
                <form onSubmit={handleSubmitFunding} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Destination Account</label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="flex h-12 w-full rounded-xl border bg-background px-4 text-sm font-semibold"
                            required
                        >
                            {accounts.map((acc) => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_type} — {acc.account_number} (₦{(Number(acc.balance || 0) / 100).toLocaleString()})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Amount (NGN)</label>
                            <Input
                                type="number"
                                min="100"
                                step="0.01"
                                required
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 25000"
                                className="h-12 text-lg font-bold rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground">Sender Reference / Note</label>
                            <Input
                                type="text"
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                placeholder="e.g. NIP from GTBank / Slip Ref"
                                className="h-12 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-muted-foreground">Funding Rail</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: "bank_transfer", label: "Bank Transfer", icon: Building },
                                { id: "card", label: paystackEnabled ? "Card (Paystack)" : "Card / POS", icon: CreditCard },
                                { id: "ussd", label: `USSD ${activeProfile.ussdCode}`, icon: Smartphone },
                            ].map((opt) => (
                                <button
                                    type="button"
                                    key={opt.id}
                                    onClick={() => setMethod(opt.id as any)}
                                    className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 transition-all ${
                                        method === opt.id
                                            ? "bg-primary/10 border-primary text-primary font-bold"
                                            : "hover:bg-muted text-muted-foreground"
                                    }`}
                                >
                                    <opt.icon className="h-5 w-5" />
                                    <span className="text-xs font-semibold text-center">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-xl bg-muted/40 border p-3.5 flex items-start gap-2.5 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <p>
                            For regulatory compliance, deposits are only posted to your ledger after automated Paystack HMAC verification or Bank Teller reconciliation.
                        </p>
                    </div>

                    <Button type="submit" disabled={submitting || accounts.length === 0} className="w-full h-12 rounded-xl font-black">
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        {method === "card" && paystackEnabled
                            ? "Proceed to Verified Paystack Checkout"
                            : "Log Deposit Notification for Verification"}
                    </Button>
                </form>
            </Card>

            {/* Real Funding Requests History */}
            <Card className="p-6 border rounded-2xl space-y-4">
                <h2 className="text-base font-black flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" /> Funding Requests & Deposit History ({requests.length})
                </h2>
                {requests.length === 0 ? (
                    <p className="text-xs text-muted-foreground py-4">No funding notifications submitted yet.</p>
                ) : (
                    <div className="divide-y">
                        {requests.map((r) => (
                            <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-mono font-bold">{r.reference}</p>
                                    <p className="text-muted-foreground">
                                        {r.method.toUpperCase()} · {r.account_number} · {new Date(r.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black">₦{(Number(r.amount_kobo) / 100).toLocaleString()}</p>
                                    <Badge variant={r.status === "completed" ? "default" : r.status === "rejected" ? "destructive" : "secondary"} className="text-[9px] uppercase">
                                        {r.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
