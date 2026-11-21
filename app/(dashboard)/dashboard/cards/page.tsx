"use client"

import * as React from "react"
import {
    CreditCard,
    CheckCircle,
    Loader2,
    Shield,
    Lock,
    Unlock,
    Sliders,
    X,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"

interface CardRow {
    id: number
    card_holder_name: string
    customer_email?: string
    account_number?: string
    card_network: string
    card_type: string
    card_number_masked: string
    card_token: string
    limit_pos: number
    limit_web: number
    limit_atm: number
    is_frozen: boolean
    status: string
}

export default function CardsAdminPage() {
    const [cards, setCards] = React.useState<CardRow[]>([])
    const [loading, setLoading] = React.useState(true)
    const [busyId, setBusyId] = React.useState<string | null>(null)

    const [selectedCard, setSelectedCard] = React.useState<CardRow | null>(null)
    const [posNaira, setPosNaira] = React.useState(100000)
    const [webNaira, setWebNaira] = React.useState(50000)
    const [atmNaira, setAtmNaira] = React.useState(20000)

    const loadCards = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/cards")
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load smart cards")
                return
            }
            setCards(data.cards || [])
        } catch {
            toast.error("Failed to fetch card registry")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadCards()
    }, [loadCards])

    const handleToggleFreeze = async (card: CardRow) => {
        setBusyId(`freeze-${card.id}`)
        try {
            const res = await fetch("/api/admin/cards", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_id: card.id, is_frozen: !card.is_frozen }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Card freeze update failed")
                return
            }
            toast.success(`Card ${card.card_number_masked} is now ${!card.is_frozen ? "Frozen" : "Active"}.`)
            await loadCards()
        } finally {
            setBusyId(null)
        }
    }

    const handleSaveLimits = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedCard) return
        setBusyId(`limits-${selectedCard.id}`)
        try {
            const res = await fetch("/api/admin/cards", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    card_id: selectedCard.id,
                    limit_pos: Math.round(posNaira * 100),
                    limit_web: Math.round(webNaira * 100),
                    limit_atm: Math.round(atmNaira * 100),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to update channel limits")
                return
            }
            toast.success("Channel spending limits persisted to card ledger!")
            setSelectedCard(null)
            await loadCards()
        } finally {
            setBusyId(null)
        }
    }

    const totalActive = cards.filter((c) => !c.is_frozen).length
    const totalFrozen = cards.filter((c) => c.is_frozen).length
    const avgPosLimit =
        cards.length > 0
            ? cards.reduce((s, c) => s + Number(c.limit_pos || 0), 0) / cards.length
            : 0

    if (loading) {
        return (
            <div className="flex h-[60vh] items-center justify-center gap-3 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" /> Loading Smart Card Registry...
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12 max-w-[1440px] mx-auto px-4 md:px-8 pt-6">
            <BankPageHeader
                badge="Card Issuing Switch · Live Controls"
                livePill={`${totalActive} Active · ${totalFrozen} Frozen`}
                liveTone={totalFrozen > 0 ? "amber" : "emerald"}
                title="Smart Card Registry"
                subtitle="Enforce real-time card freezes and manage POS, Web, and ATM daily spending limits with immutable audit logging."
                actions={
                    <Button variant="outline" size="sm" onClick={loadCards} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                        <RefreshCw className="h-3.5 w-3.5" /> Refresh Registry
                    </Button>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Issued Cards", val: String(cards.length), sub: "Physical & virtual fleet", icon: CreditCard, tone: "bg-primary/10 text-primary" },
                    { label: "Active Cards", val: String(totalActive), sub: "Authorized on switch", icon: CheckCircle, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Security Frozen", val: String(totalFrozen), sub: "Blocked from POS/Web/ATM", icon: Lock, tone: totalFrozen > 0 ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground" },
                    { label: "Avg Daily POS Limit", val: `₦${(avgPosLimit / 100).toLocaleString()}`, sub: "Channel spending cap", icon: Sliders, tone: "bg-blue-500/10 text-blue-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.val}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card border rounded-2xl p-6 space-y-4">
                <h2 className="text-lg font-black flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" /> Issued Debit & Virtual Cards
                </h2>
                {cards.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-12 text-center">No smart cards issued yet.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3">Cardholder & Account</th>
                                    <th className="px-4 py-3">Scheme / Type</th>
                                    <th className="px-4 py-3">Masked PAN</th>
                                    <th className="px-4 py-3">POS / WEB / ATM Limits</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Controls</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {cards.map((c) => (
                                    <tr key={c.id} className="hover:bg-muted/20">
                                        <td className="px-4 py-3">
                                            <p className="font-bold">{c.card_holder_name}</p>
                                            <p className="text-[11px] text-muted-foreground font-mono">
                                                {c.account_number || "—"} · {c.customer_email || ""}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant="outline" className="uppercase text-[10px] font-black">
                                                {c.card_network} · {c.card_type}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 font-mono font-bold">{c.card_number_masked}</td>
                                        <td className="px-4 py-3 font-mono text-[11px]">
                                            POS ₦{(Number(c.limit_pos || 0) / 100).toLocaleString()} · WEB ₦{(Number(c.limit_web || 0) / 100).toLocaleString()} · ATM ₦{(Number(c.limit_atm || 0) / 100).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge variant={c.is_frozen ? "destructive" : "default"} className="text-[9px] uppercase">
                                                {c.is_frozen ? "frozen" : c.status}
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right space-x-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setSelectedCard(c)
                                                    setPosNaira(Number(c.limit_pos || 0) / 100)
                                                    setWebNaira(Number(c.limit_web || 0) / 100)
                                                    setAtmNaira(Number(c.limit_atm || 0) / 100)
                                                }}
                                                className="h-8 text-[11px] font-bold"
                                            >
                                                <Sliders className="h-3 w-3 mr-1" /> Limits
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={c.is_frozen ? "default" : "destructive"}
                                                disabled={busyId !== null}
                                                onClick={() => handleToggleFreeze(c)}
                                                className="h-8 text-[11px] font-bold"
                                            >
                                                {c.is_frozen ? <Unlock className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                                                {c.is_frozen ? "Unfreeze" : "Freeze"}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Limit Editor Modal */}
            {selectedCard && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                    <form onSubmit={handleSaveLimits} className="bg-card border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black">Adjust 3-Channel Spending Limits</h3>
                            <Button type="button" size="icon" variant="ghost" onClick={() => setSelectedCard(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {selectedCard.card_holder_name} · <span className="font-mono">{selectedCard.card_number_masked}</span>
                        </p>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold">Daily POS Limit (NGN)</label>
                                <input type="number" min="0" required value={posNaira} onChange={(e) => setPosNaira(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-xl border bg-background font-mono" />
                            </div>
                            <div>
                                <label className="text-xs font-bold">Daily Web/Online Limit (NGN)</label>
                                <input type="number" min="0" required value={webNaira} onChange={(e) => setWebNaira(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-xl border bg-background font-mono" />
                            </div>
                            <div>
                                <label className="text-xs font-bold">Daily ATM Cash Limit (NGN)</label>
                                <input type="number" min="0" required value={atmNaira} onChange={(e) => setAtmNaira(Number(e.target.value))} className="w-full h-10 mt-1 px-3 rounded-xl border bg-background font-mono" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="outline" onClick={() => setSelectedCard(null)}>Cancel</Button>
                            <Button type="submit" disabled={busyId !== null}>Persist Limits</Button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}
