"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Landmark,
    TrendingUp,
    ShieldCheck,
    Smartphone,
    Plus,
    Loader2,
    Sliders,
    CheckCircle,
    DollarSign,
    RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { useBankProfile } from "@/context/bank-profile-context"

interface Terminal {
    id: string
    serial_number: string
    pos_model: string
    status: "pending" | "assigned" | "active" | "suspended" | "damaged"
    created_at: string
}

interface SmartCardOption {
    id: string
    card_holder_name: string
    card_network: string
    card_number_masked: string
}

interface CommissionReport {
    total_commission: number
    agent_share: number
    bank_share: number
    items: any[]
}

export default function AgencyClientPage() {
    const { activeProfile } = useBankProfile()
    const [terminals, setTerminals] = React.useState<Terminal[]>([])
    const [commissions, setCommissions] = React.useState<CommissionReport>({
        total_commission: 0,
        agent_share: 0,
        bank_share: 0,
        items: [],
    })
    const [cards, setCards] = React.useState<SmartCardOption[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    // POS Terminal Execution state
    const [selectedTerminalId, setSelectedTerminalId] = React.useState<string>("")
    const [selectedCardId, setSelectedCardId] = React.useState<string>("")
    const [withdrawalAmount, setWithdrawalAmount] = React.useState<string>("")
    const [pinBlock, setPinBlock] = React.useState<string>("")
    const [posScreen, setPosScreen] = React.useState<"idle" | "swipe" | "pin" | "processing" | "success" | "error">("idle")
    const [terminalLog, setTerminalLog] = React.useState<string>("")

    // Request terminal modal
    const [showRequestModal, setShowRequestModal] = React.useState(false)
    const [businessAddress, setBusinessAddress] = React.useState("")
    const [estimatedVolume, setEstimatedVolume] = React.useState("500,000")
    const [posModel, setPosModel] = React.useState("Smart Android POS (Nexgo)")

    const loadAgencyData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/agency", { cache: "no-store" })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to load agency portal")

            const fetchedTerminals: Terminal[] = (json.terminals || []).map((t: any) => ({
                id: String(t.id),
                serial_number: t.serial_number,
                pos_model: t.pos_model || "Smart Android POS",
                status: t.status,
                created_at: t.created_at,
            }))
            setTerminals(fetchedTerminals)
            const firstActive = fetchedTerminals.find((t) => t.status === "active") || fetchedTerminals[0]
            if (firstActive && !selectedTerminalId) setSelectedTerminalId(firstActive.id)

            const fetchedCards: SmartCardOption[] = (json.cards || []).map((c: any) => ({
                id: String(c.id),
                card_holder_name: c.card_holder_name,
                card_network: c.card_network || "verve",
                card_number_masked: c.card_number_masked,
            }))
            setCards(fetchedCards)
            if (fetchedCards.length > 0 && !selectedCardId) setSelectedCardId(fetchedCards[0].id)

            setCommissions({
                total_commission: Number(json.commissions?.total_commission || 0),
                agent_share: Number(json.commissions?.agent_share || 0),
                bank_share: Number(json.commissions?.bank_share || 0),
                items: json.commissions?.items || [],
            })
        } catch (e: any) {
            toast.error(e.message || "Could not load agency banking data")
        } finally {
            setLoading(false)
        }
    }, [selectedTerminalId, selectedCardId])

    React.useEffect(() => {
        loadAgencyData()
    }, [])

    const handleRequestTerminal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessAddress.trim()) return
        setActionLoading("request")
        try {
            const res = await fetch("/api/agency/terminals/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_address: businessAddress.trim(),
                    pos_type: posModel,
                    monthly_volume_est: parseInt(estimatedVolume.replace(/[^0-9]/g, "") || "0", 10) * 100,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to submit POS request")
            toast.success("POS hardware request registered in core ledger!")
            setShowRequestModal(false)
            setBusinessAddress("")
            await loadAgencyData()
        } catch (e: any) {
            toast.error(e.message)
        } finally {
            setActionLoading(null)
        }
    }

    const executePosCashOut = async () => {
        const amtNaira = parseFloat(withdrawalAmount)
        if (!selectedTerminalId || !selectedCardId || !Number.isFinite(amtNaira) || amtNaira <= 0 || pinBlock.length !== 4) {
            toast.error("Select an active terminal, a valid card, withdrawal amount, and 4-digit PIN")
            return
        }

        setPosScreen("processing")
        setTerminalLog("Authorizing cardholder debit & agent float credit...")

        try {
            const cardObj = cards.find((c) => c.id === selectedCardId)
            const res = await fetch("/api/agency/transactions/cash-out", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    terminal_id: selectedTerminalId,
                    card_id: selectedCardId,
                    card_number_masked: cardObj?.card_number_masked,
                    pin_block: pinBlock,
                    amount: Math.round(amtNaira * 100),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                setPosScreen("error")
                setTerminalLog(data.error || "Transaction declined by core ledger")
                toast.error(data.error || "Cash-out declined")
                return
            }

            setPosScreen("success")
            setTerminalLog(
                `Approved! Agent commission: +₦${(Number(data.commission?.agent_share || 0) / 100).toFixed(2)}`
            )
            toast.success("POS Cash-out settled atomically!")
            await loadAgencyData()
        } catch {
            setPosScreen("error")
            setTerminalLog("Network timeout")
        }
    }

    const handleKeypadPress = (val: string) => {
        if (posScreen === "idle") {
            setPosScreen("swipe")
        }
        if (posScreen === "swipe") {
            if (val === "clear") setWithdrawalAmount("")
            else if (val === "enter") {
                if (parseFloat(withdrawalAmount) > 0) setPosScreen("pin")
            } else setWithdrawalAmount((prev) => prev + val)
        } else if (posScreen === "pin") {
            if (val === "clear") setPinBlock("")
            else if (val === "enter") {
                if (pinBlock.length === 4) executePosCashOut()
            } else if (pinBlock.length < 4) {
                setPinBlock((prev) => prev + val)
            }
        }
    }

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Loading agent POS switching registers...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-cyan-500 bg-clip-text text-transparent">
                        Agency Banking POS Network
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Manage assigned POS terminals, process verified card cash-outs, and track live 70/30 commission settlements.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={loadAgencyData} className="rounded-xl h-11 font-bold gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button
                        onClick={() => setShowRequestModal(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 h-11 shadow-lg flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" /> Request POS Terminal
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[10px] uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                            Live Ledger
                        </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Commission Pool</p>
                    <p className="text-2xl font-black mt-1">₦{(commissions.total_commission / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                            <TrendingUp className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-emerald-500">70% split</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">My Earned Split</p>
                    <p className="text-2xl font-black mt-1 text-emerald-500">₦{(commissions.agent_share / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                            <Landmark className="h-5 w-5" />
                        </div>
                        <span className="text-xs font-bold text-purple-600">30% split</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Bank Revenue Share</p>
                    <p className="text-2xl font-black mt-1 text-purple-600">₦{(commissions.bank_share / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card p-6 rounded-xl border border-border shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                            <Smartphone className="h-5 w-5" />
                        </div>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Terminals</p>
                    <p className="text-2xl font-black mt-1">
                        {terminals.filter((t) => t.status === "active").length} / {terminals.length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-primary" /> Assigned POS Fleet
                        </h2>
                        {terminals.length === 0 ? (
                            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                                No POS terminals assigned yet. Request your first terminal above.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {terminals.map((t) => (
                                    <div key={t.id} className="p-4 bg-muted/30 rounded-xl border space-y-2 relative">
                                        <div className="absolute top-2 right-2">
                                            <Badge
                                                variant="outline"
                                                className={`text-[9px] uppercase ${
                                                    t.status === "active"
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-amber-50 text-amber-600 border-amber-100"
                                                }`}
                                            >
                                                {t.status}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-muted-foreground font-bold uppercase">{t.pos_model}</p>
                                        <p className="text-sm font-black font-mono">{t.serial_number}</p>
                                        <p className="text-[10px] text-muted-foreground font-semibold">
                                            Registered: {new Date(t.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-md space-y-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-primary" /> Commission Settlement Journal
                        </h2>
                        <div className="bg-muted/10 rounded-xl border divide-y">
                            {commissions.items.length === 0 ? (
                                <div className="p-8 text-center text-sm text-muted-foreground font-semibold">
                                    No commission settlements logged yet.
                                </div>
                            ) : (
                                commissions.items.map((c: any) => (
                                    <div key={c.id} className="p-4 flex justify-between items-center gap-4 text-xs font-semibold">
                                        <div>
                                            <p className="font-extrabold text-foreground">
                                                Cash-Out Split ({c.serial_number || `Terminal #${c.terminal_id}`})
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                {new Date(c.created_at).toLocaleString()} · {c.status}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-emerald-500">
                                                +₦{(Number(c.agent_share || 0) / 100).toFixed(2)}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Vol: ₦{(Number(c.transaction_amount || 0) / 100).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Live POS Cash-Out Terminal */}
                <div className="lg:col-span-5 flex flex-col items-center">
                    <div className="w-full max-w-[350px] bg-slate-900 border-4 border-slate-700 rounded-[36px] shadow-2xl p-6 flex flex-col items-center">
                        <div className="w-24 h-1.5 bg-slate-700 rounded-full mb-4" />

                        <div className="aspect-[4/3] w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between font-mono select-none">
                            <div className="flex justify-between items-center text-[10px] text-blue-400 font-bold">
                                <span>{activeProfile.posBrandName}</span>
                                <span>LIVE LEDGER</span>
                            </div>

                            <div className="flex-1 flex flex-col justify-center items-center text-center py-2 px-1 text-white">
                                {posScreen === "idle" && (
                                    <div className="space-y-1">
                                        <p className="text-sm font-black text-emerald-400">READY FOR CASH-OUT</p>
                                        <p className="text-[9px] text-slate-400">Key in amount (₦) below</p>
                                    </div>
                                )}
                                {posScreen === "swipe" && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-400 font-black uppercase">WITHDRAWAL AMOUNT</p>
                                        <p className="text-xl font-bold text-white tracking-widest">₦ {withdrawalAmount || "0"}</p>
                                        <p className="text-[8px] text-emerald-400 font-black uppercase">Press [ENTER] for PIN</p>
                                    </div>
                                )}
                                {posScreen === "pin" && (
                                    <div className="space-y-1">
                                        <p className="text-[9px] text-slate-400 font-black uppercase">CARDHOLDER 4-DIGIT PIN</p>
                                        <p className="text-lg font-bold tracking-widest">
                                            {pinBlock.split("").map(() => "•").join("") || "••••"}
                                        </p>
                                        <p className="text-[8px] text-amber-400 font-black uppercase">Press [ENTER] to authorize</p>
                                    </div>
                                )}
                                {posScreen === "processing" && (
                                    <div className="space-y-2 flex flex-col items-center">
                                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                                        <p className="text-[9px] text-slate-400">{terminalLog}</p>
                                    </div>
                                )}
                                {posScreen === "success" && (
                                    <div className="space-y-1 flex flex-col items-center">
                                        <CheckCircle className="h-7 w-7 text-emerald-400" />
                                        <p className="text-[10px] text-emerald-400 font-bold">APPROVED</p>
                                        <p className="text-[8px] text-slate-400">{terminalLog}</p>
                                    </div>
                                )}
                                {posScreen === "error" && (
                                    <div className="space-y-1 flex flex-col items-center text-rose-400">
                                        <p className="text-xs font-black">DECLINED</p>
                                        <p className="text-[8px] text-slate-400">{terminalLog}</p>
                                    </div>
                                )}
                            </div>
                            <div className="text-[9px] text-slate-600 text-right">ATOMIC POS</div>
                        </div>

                        <div className="w-full mt-4 space-y-2">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Terminal</label>
                                <select
                                    value={selectedTerminalId}
                                    onChange={(e) => setSelectedTerminalId(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-2 text-xs font-semibold"
                                >
                                    {terminals.length === 0 && <option value="">No terminals assigned</option>}
                                    {terminals.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            {t.serial_number} ({t.status})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Card</label>
                                <select
                                    value={selectedCardId}
                                    onChange={(e) => setSelectedCardId(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg h-9 px-2 text-xs font-semibold"
                                >
                                    {cards.length === 0 && <option value="">No active cards on core ledger</option>}
                                    {cards.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.card_holder_name} ({c.card_network.toUpperCase()} {c.card_number_masked})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5 w-full mt-5">
                            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((val) => (
                                <button
                                    key={val}
                                    onClick={() => handleKeypadPress(val)}
                                    className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-sm border border-slate-700 active:scale-95"
                                >
                                    {val}
                                </button>
                            ))}
                            <button
                                onClick={() => handleKeypadPress("clear")}
                                className="bg-rose-900/40 border border-rose-900/60 text-rose-400 font-bold h-11 rounded-xl text-xs"
                            >
                                CLEAR
                            </button>
                            <button
                                onClick={() => handleKeypadPress("0")}
                                className="bg-slate-800 hover:bg-slate-700 text-white font-bold h-11 rounded-xl text-sm border border-slate-700"
                            >
                                0
                            </button>
                            <button
                                onClick={() => handleKeypadPress("enter")}
                                className="bg-emerald-900/40 border border-emerald-900/60 text-emerald-400 font-bold h-11 rounded-xl text-xs"
                            >
                                ENTER
                            </button>
                        </div>

                        <button
                            onClick={() => {
                                setPosScreen("idle")
                                setWithdrawalAmount("")
                                setPinBlock("")
                                setTerminalLog("")
                            }}
                            className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mt-4 hover:underline"
                        >
                            Reset Terminal
                        </button>
                    </div>
                </div>
            </div>

            {/* Request Terminal Modal */}
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
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div>
                                <h3 className="text-xl font-black">Request POS Hardware</h3>
                                <p className="text-xs text-muted-foreground mt-0.5 font-semibold">
                                    Submit a terminal provisioning request to {activeProfile.shortName} Operations.
                                </p>
                            </div>
                            <form onSubmit={handleRequestTerminal} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold">Business Physical Address</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Shop 24, Main Market"
                                        value={businessAddress}
                                        onChange={(e) => setBusinessAddress(e.target.value)}
                                        className="w-full bg-muted border rounded-xl h-12 px-4 text-sm font-semibold"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">POS Model</label>
                                        <select
                                            value={posModel}
                                            onChange={(e) => setPosModel(e.target.value)}
                                            className="w-full bg-muted border rounded-xl h-12 px-3 text-sm font-semibold"
                                        >
                                            <option value="Smart Android POS (Nexgo)">Smart Android Nexgo</option>
                                            <option value="Desktop POS (Pax S90)">Desktop Pax S90</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold">Est. Monthly Vol (₦)</label>
                                        <input
                                            type="text"
                                            required
                                            value={estimatedVolume}
                                            onChange={(e) => setEstimatedVolume(e.target.value.replace(/[^0-9,]/g, ""))}
                                            className="w-full bg-muted border rounded-xl h-12 px-3 text-sm font-semibold"
                                        />
                                    </div>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2 text-amber-600">
                                    <ShieldCheck className="h-5 w-5 shrink-0" />
                                    <p className="text-[10px] font-semibold">
                                        Terminal requests enter the Admin Agency Queue for serial assignment and activation.
                                    </p>
                                </div>
                                <div className="flex gap-3 justify-end pt-2">
                                    <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)} className="rounded-xl h-11 font-bold">
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={actionLoading === "request"} className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6">
                                        {actionLoading === "request" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
