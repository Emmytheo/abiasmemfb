"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    CreditCard,
    Shield,
    Lock,
    Unlock,
    Sliders,
    Eye,
    EyeOff,
    KeyRound,
    Plus,
    Loader2,
    CheckCircle,
    Info,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { BankPageHeader } from "@/components/banking/page-header"

interface Card {
    id: string
    card_holder_name: string
    card_network: "visa" | "mastercard" | "verve"
    card_type: "physical" | "virtual"
    card_number_masked: string
    limit_pos: number
    limit_web: number
    limit_atm: number
    is_frozen: boolean
    expiry_date: string
    status: string
    account_id?: string | number
    account_number?: string
}

interface Account {
    id: string
    account_number: string
    account_type: string
    balance: number
}

export default function MyCardsPage() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()
    const [cards, setCards] = React.useState<Card[]>([])
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(true)
    const [activeCardIndex, setActiveCardIndex] = React.useState(0)
    const [showMaskedDetails, setShowMaskedDetails] = React.useState(false)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    // Request modal
    const [showRequestModal, setShowRequestModal] = React.useState(false)
    const [newCardType, setNewCardType] = React.useState<"virtual" | "physical">("virtual")
    const [newCardNetwork, setNewCardNetwork] = React.useState<"visa" | "mastercard" | "verve">("verve")
    const [newCardHolder, setNewCardHolder] = React.useState("")
    const [selectedAccountId, setSelectedAccountId] = React.useState("")

    // Limits (in Naira)
    const [limitPos, setLimitPos] = React.useState(100000)
    const [limitWeb, setLimitWeb] = React.useState(50000)
    const [limitAtm, setLimitAtm] = React.useState(20000)

    // PIN Reset
    const [showPinModal, setShowPinModal] = React.useState(false)
    const [newPin, setNewPin] = React.useState("")
    const [pinSuccess, setPinSuccess] = React.useState(false)

    const maxLimits = React.useMemo(() => {
        if (activeScope.type === "business") {
            return { pos: 10000000, web: 5000000, atm: 1000000 }
        }
        if (activeScope.type === "coop") {
            return { pos: 25000000, web: 10000000, atm: 2000000 }
        }
        return { pos: 500000, web: 250000, atm: 100000 }
    }, [activeScope.type])

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/cards", { cache: "no-store" })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to load cards")

            const mappedAccounts: Account[] = (json.accounts || []).map((a: any) => ({
                id: String(a.id),
                account_number: a.account_number,
                account_type: a.account_type || "Savings",
                balance: Number(a.balance || 0),
            }))
            setAccounts(mappedAccounts)
            if (mappedAccounts.length > 0 && !selectedAccountId) {
                setSelectedAccountId(mappedAccounts[0].id)
            }

            const mappedCards: Card[] = (json.cards || []).map((c: any) => ({
                id: String(c.id),
                card_holder_name: c.card_holder_name,
                card_network: (c.card_network || "verve") as Card["card_network"],
                card_type: (c.card_type || "virtual") as Card["card_type"],
                card_number_masked: c.card_number_masked || "****-****-****-****",
                limit_pos: Number(c.limit_pos || 0),
                limit_web: Number(c.limit_web || 0),
                limit_atm: Number(c.limit_atm || 0),
                is_frozen: Boolean(c.is_frozen),
                expiry_date: c.expiry_date
                    ? new Date(c.expiry_date).toLocaleDateString(undefined, { month: "2-digit", year: "2-digit" })
                    : "—",
                status: c.status || "active",
                account_id: c.account_id,
                account_number: c.account_number,
            }))
            setCards(mappedCards)
            if (mappedCards.length > 0) {
                setActiveCardIndex((prev) => Math.min(prev, mappedCards.length - 1))
            }
        } catch (e: any) {
            toast.error(e.message || "Could not load smart cards ledger")
        } finally {
            setLoading(false)
        }
    }, [selectedAccountId])

    React.useEffect(() => {
        loadData()
    }, [])

    const activeCard = cards[activeCardIndex] || cards[0]

    React.useEffect(() => {
        if (activeCard) {
            setLimitPos(Math.max(1000, Math.round(activeCard.limit_pos / 100)))
            setLimitWeb(Math.max(1000, Math.round(activeCard.limit_web / 100)))
            setLimitAtm(Math.max(1000, Math.round(activeCard.limit_atm / 100)))
        }
    }, [activeCardIndex, activeCard])

    const handleToggleFreeze = async () => {
        if (!activeCard) return
        setActionLoading("freeze")
        try {
            const nextFreeze = !activeCard.is_frozen
            const res = await fetch("/api/cards/toggle-freeze", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_id: activeCard.id, is_frozen: nextFreeze }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update card lock state")
            }
            toast.success(nextFreeze ? "Card frozen immediately." : "Card unfrozen and active.")
            await loadData()
        } catch (e: any) {
            toast.error(e.message || "Could not update card status")
        } finally {
            setActionLoading(null)
        }
    }

    const handleSaveLimits = async () => {
        if (!activeCard) return
        setActionLoading("limits")
        try {
            const res = await fetch("/api/cards/limits", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    card_id: activeCard.id,
                    limit_pos: limitPos * 100,
                    limit_web: limitWeb * 100,
                    limit_atm: limitAtm * 100,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to update card limits")
            }
            toast.success("Daily card transaction limits saved to core ledger.")
            await loadData()
        } catch (e: any) {
            toast.error(e.message || "Failed to save limits")
        } finally {
            setActionLoading(null)
        }
    }

    const handleResetPin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeCard || String(newPin).length !== 4) {
            toast.error("Enter a valid 4-digit PIN")
            return
        }
        setActionLoading("pin")
        try {
            const res = await fetch("/api/cards/reset-pin", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ card_id: activeCard.id, new_pin: newPin }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to reset card PIN")
            }
            setPinSuccess(true)
            toast.success("Card PIN updated.")
            setTimeout(() => {
                setShowPinModal(false)
                setPinSuccess(false)
                setNewPin("")
            }, 1500)
        } catch (e: any) {
            toast.error(e.message || "PIN reset failed")
        } finally {
            setActionLoading(null)
        }
    }

    const handleCreateCard = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newCardHolder.trim() || !selectedAccountId) {
            toast.error("Provide cardholder name and select an active funding account.")
            return
        }
        setActionLoading("create")
        try {
            const holderName = newCardHolder.trim().toUpperCase()
            const res = await fetch("/api/cards/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    account_id: selectedAccountId,
                    card_network: newCardNetwork,
                    card_type: newCardType,
                    card_holder_name: holderName,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Card issuance declined")
            }
            toast.success(`${newCardNetwork.toUpperCase()} ${newCardType} card issued successfully!`)
            setShowRequestModal(false)
            setNewCardHolder("")
            await loadData()
            setActiveCardIndex(0)
        } catch (e: any) {
            toast.error(e.message || "Failed to issue card")
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Loading your smart cards ledger...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge={`${activeScope.name} · Card Issuing Switch`}
                livePill={`${cards.filter((c) => !c.is_frozen).length} Active · ${cards.filter((c) => c.is_frozen).length} Frozen`}
                liveTone={cards.some((c) => c.is_frozen) ? "amber" : "emerald"}
                title={
                    activeScope.type === "business"
                        ? "Corporate Expense Cards"
                        : activeScope.type === "coop"
                            ? "Union Disbursement Cards"
                            : "Smart Cards Vault"
                }
                subtitle={`Issue, configure, and instantly lock physical & virtual ${activeProfile.shortName} cards linked directly to your live NUBAN accounts.`}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </Button>
                        <Button
                            size="sm"
                            onClick={() => setShowRequestModal(true)}
                            disabled={accounts.length === 0}
                            className="h-9 rounded-xl font-black text-xs gap-1.5"
                        >
                            <Plus className="h-3.5 w-3.5" /> Issue Card
                        </Button>
                    </>
                }
            />

            {cards.length === 0 ? (
                <div className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-12 text-center max-w-md mx-auto space-y-4">
                    <CreditCard className="h-16 w-16 mx-auto text-primary/40" />
                    <h3 className="text-xl font-bold">No smart cards issued yet</h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        {accounts.length === 0
                            ? "Open an active bank account first before requesting a virtual or physical debit card."
                            : "Issue an instant virtual Visa, Mastercard, or Verve card linked directly to your live account."}
                    </p>
                    <Button
                        onClick={() => setShowRequestModal(true)}
                        disabled={accounts.length === 0}
                        className="w-full bg-primary font-bold rounded-xl"
                    >
                        Issue Your First Card
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left: Card Visual & Selector */}
                    <div className="lg:col-span-6 space-y-6 flex flex-col items-center">
                        <div className="w-full max-w-[400px] relative">
                            <motion.div
                                className={`aspect-[1.586/1] w-full rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all duration-500 ${
                                    activeCard?.is_frozen
                                        ? "bg-gradient-to-br from-slate-700 to-slate-900 filter grayscale brightness-75 text-white"
                                        : activeCard?.card_network === "visa"
                                        ? "bg-gradient-to-br from-blue-700 via-indigo-800 to-indigo-950 text-white"
                                        : activeCard?.card_network === "mastercard"
                                        ? "bg-gradient-to-br from-orange-600 via-rose-700 to-amber-950 text-white"
                                        : "bg-gradient-to-br from-emerald-600 via-teal-800 to-cyan-950 text-white"
                                }`}
                                layoutId={`card-${activeCard?.id}`}
                            >
                                <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px] pointer-events-none" />

                                <div className="flex justify-between items-start z-10">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">
                                            {activeProfile.shortName} · {activeCard?.card_type}
                                        </p>
                                        <Shield className="h-5 w-5 opacity-90" />
                                    </div>
                                    <span className="text-lg font-black italic tracking-tighter uppercase opacity-95">
                                        {activeCard?.card_network === "visa" && "VISA"}
                                        {activeCard?.card_network === "mastercard" && "mastercard"}
                                        {activeCard?.card_network === "verve" && "verve"}
                                    </span>
                                </div>

                                <AnimatePresence>
                                    {activeCard?.is_frozen && (
                                        <motion.div
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="absolute inset-0 bg-background/30 backdrop-blur-md flex flex-col justify-center items-center z-20 gap-2 border border-slate-500/20"
                                        >
                                            <Lock className="h-10 w-10 text-rose-500 fill-rose-500/10" />
                                            <span className="text-xs font-black uppercase tracking-widest text-white bg-rose-600 px-3 py-1 rounded-full shadow-lg">
                                                Frozen / Locked
                                            </span>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <div className="z-10 py-4 flex items-center justify-between">
                                    <p className="text-xl sm:text-2xl font-mono tracking-widest font-black opacity-95">
                                        {showMaskedDetails
                                            ? activeCard?.card_number_masked
                                            : `•••• •••• •••• ${activeCard?.card_number_masked?.slice(-4) || "••••"}`}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end z-10">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Card Holder</p>
                                        <p className="text-xs font-black tracking-wide truncate max-w-[200px]">
                                            {activeCard?.card_holder_name}
                                        </p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Expires</p>
                                            <p className="text-xs font-black">{activeCard?.expiry_date}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[9px] font-bold uppercase tracking-wider opacity-60">Account</p>
                                            <p className="text-xs font-mono font-black">
                                                {activeCard?.account_number ? `••${activeCard.account_number.slice(-4)}` : "Linked"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        <div className="flex gap-2">
                            {cards.map((c, i) => (
                                <button
                                    key={c.id}
                                    onClick={() => setActiveCardIndex(i)}
                                    className={`h-2.5 rounded-full transition-all ${
                                        activeCardIndex === i
                                            ? "bg-primary w-6"
                                            : "bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2.5"
                                    }`}
                                    aria-label={`Select card ${i + 1}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-3 w-full max-w-[400px]">
                            <Button
                                variant="outline"
                                onClick={() => setShowMaskedDetails(!showMaskedDetails)}
                                className="w-full flex items-center justify-center gap-2 rounded-xl h-11 font-bold"
                            >
                                {showMaskedDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {showMaskedDetails ? "Mask Card Number" : "Reveal Masked PAN"}
                            </Button>
                        </div>
                        <p className="text-[11px] text-muted-foreground text-center max-w-[380px]">
                            For PCI-DSS security, full PAN and CVV are never stored in plaintext on web servers.
                        </p>
                    </div>

                    {/* Right: Security & Limits */}
                    <div className="lg:col-span-6 space-y-6">
                        <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-xl space-y-6">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" /> Security &amp; Controls
                            </h2>

                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Freeze / Lock Card</p>
                                    <p className="text-xs text-muted-foreground">
                                        Instantly block POS, Web, and ATM authorizations on this card.
                                    </p>
                                </div>
                                <Button
                                    onClick={handleToggleFreeze}
                                    disabled={actionLoading !== null}
                                    className={`font-black rounded-xl h-11 px-4 flex items-center gap-2 border ${
                                        activeCard?.is_frozen
                                            ? "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border-emerald-500/20 shadow-none"
                                            : "bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border-rose-500/20 shadow-none"
                                    }`}
                                >
                                    {actionLoading === "freeze" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : activeCard?.is_frozen ? (
                                        <>
                                            <Unlock className="h-4 w-4" /> Unfreeze Card
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="h-4 w-4" /> Freeze Card
                                        </>
                                    )}
                                </Button>
                            </div>

                            <div className="space-y-6 border-b pb-6">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                    <Sliders className="h-4 w-4" /> Daily Spending Caps
                                </h3>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily POS Terminal Cap</span>
                                        <span className="font-black text-primary">₦ {limitPos.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max={maxLimits.pos}
                                        step="1000"
                                        value={limitPos}
                                        onChange={(e) => setLimitPos(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily Web / Online Cap</span>
                                        <span className="font-black text-primary">₦ {limitWeb.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max={maxLimits.web}
                                        step="1000"
                                        value={limitWeb}
                                        onChange={(e) => setLimitWeb(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="font-bold">Daily ATM Cash Cap</span>
                                        <span className="font-black text-primary">₦ {limitAtm.toLocaleString()}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1000"
                                        max={maxLimits.atm}
                                        step="1000"
                                        value={limitAtm}
                                        onChange={(e) => setLimitAtm(Number(e.target.value))}
                                        className="w-full accent-primary bg-muted rounded-lg h-2 cursor-pointer"
                                    />
                                </div>

                                <Button
                                    onClick={handleSaveLimits}
                                    disabled={actionLoading !== null}
                                    className="w-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-black rounded-xl h-11"
                                >
                                    {actionLoading === "limits" ? (
                                        <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                                    ) : (
                                        "Save Limit Configurations"
                                    )}
                                </Button>
                            </div>

                            <div className="flex justify-between items-center">
                                <div className="space-y-0.5">
                                    <p className="text-sm font-bold">Card PIN Reset</p>
                                    <p className="text-xs text-muted-foreground font-medium">
                                        Rotate your 4-digit POS / ATM card PIN securely.
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setShowPinModal(true)}
                                    className="bg-muted hover:bg-muted/80 text-foreground border border-border/80 font-bold rounded-xl h-11 px-4 flex items-center gap-2 shadow-none"
                                >
                                    <KeyRound className="h-4 w-4" /> Reset PIN
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Request Card Modal */}
            <AnimatePresence>
                {showRequestModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowRequestModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-lg rounded-3xl p-6 shadow-2xl z-10 relative space-y-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div>
                                <h3 className="text-xl font-black">Request {activeProfile.shortName} Card</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                    Issue a debit card directly linked to one of your active core accounts.
                                </p>
                            </div>
                            <form onSubmit={handleCreateCard} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Linked Account</label>
                                    <select
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                        className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold"
                                    >
                                        {accounts.map((acc) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_type} — {acc.account_number} (₦{(acc.balance / 100).toLocaleString()})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Card Type</label>
                                        <select
                                            value={newCardType}
                                            onChange={(e) => setNewCardType(e.target.value as any)}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold"
                                        >
                                            <option value="virtual">Virtual (Instant)</option>
                                            <option value="physical">Physical (Branch / Delivery)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Card Network</label>
                                        <select
                                            value={newCardNetwork}
                                            onChange={(e) => setNewCardNetwork(e.target.value as any)}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-12 px-3 text-sm font-semibold"
                                        >
                                            <option value="verve">Verve (Domestic)</option>
                                            <option value="visa">Visa (Global)</option>
                                            <option value="mastercard">Mastercard (Global)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Cardholder Name (Embossed)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. ADAEZE OKONKWO"
                                        value={newCardHolder}
                                        onChange={(e) => setNewCardHolder(e.target.value)}
                                        className="w-full bg-muted border border-border/80 rounded-xl h-12 px-4 text-sm font-semibold"
                                    />
                                </div>

                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-amber-600">
                                    <Info className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        Virtual cards activate immediately on the ledger. Physical cards are dispatched to your nearest branch or agent center.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)} className="rounded-xl h-11 font-bold">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={actionLoading === "create"} className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6">
                                        {actionLoading === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Issuance"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* PIN Reset Modal */}
            <AnimatePresence>
                {showPinModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowPinModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-sm rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">Reset Card PIN</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                    Enter a new 4-digit PIN for {activeCard?.card_number_masked}.
                                </p>
                            </div>
                            {pinSuccess ? (
                                <div className="flex flex-col items-center justify-center p-8 gap-3 text-center">
                                    <CheckCircle className="h-14 w-14 text-emerald-500" />
                                    <p className="text-sm font-black text-emerald-500">PIN Reset Completed!</p>
                                </div>
                            ) : (
                                <form onSubmit={handleResetPin} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">New 4-Digit PIN</label>
                                        <input
                                            type="password"
                                            maxLength={4}
                                            required
                                            pattern="[0-9]{4}"
                                            placeholder="••••"
                                            value={newPin}
                                            onChange={(e) => setNewPin(e.target.value.replace(/[^0-9]/g, ""))}
                                            className="w-full bg-muted border border-border/80 rounded-xl h-14 px-4 text-2xl font-black text-center tracking-widest"
                                        />
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <Button type="button" variant="outline" onClick={() => setShowPinModal(false)} className="rounded-xl h-11 font-bold">
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={actionLoading === "pin" || newPin.length !== 4} className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6">
                                            {actionLoading === "pin" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update PIN"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
