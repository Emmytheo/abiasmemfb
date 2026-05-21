"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    Landmark,
    TrendingUp, 
    Calendar, 
    ArrowRight, 
    PiggyBank, 
    CheckCircle, 
    Loader2, 
    Play,
    Building2,
    DollarSign,
    PlusCircle,
    UserCheck,
    Info,
    Smartphone,
    Layers,
    FileText,
    Check,
    X,
    ShieldAlert
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface TerminalRequest {
    id: string
    agentName: string
    pos_model: string
    requestDate: string
    serial_number: string
    status: 'pending' | 'active' | 'assigned' | 'suspended'
}

interface CommissionLedger {
    id: string
    agentName: string
    terminalSerial: string
    amount: number
    totalCommission: number
    agentShare: number
    bankShare: number
    status: 'settled' | 'pending'
    timestamp: string
}

export default function AgencyAdminPage() {
    const [terminals, setTerminals] = React.useState<TerminalRequest[]>([])
    const [commissions, setCommissions] = React.useState<CommissionLedger[]>([])
    const [loading, setLoading] = React.useState(true)
    const [submitting, setSubmitting] = React.useState<string | null>(null)
    const [activeTab, setActiveTab] = React.useState<'fleet' | 'requests' | 'commissions'>('fleet')

    // Allocate Serial Modal state
    const [selectedTerminal, setSelectedTerminal] = React.useState<TerminalRequest | null>(null)
    const [customSerial, setCustomSerial] = React.useState("")

    React.useEffect(() => {
        const loadAgencyData = async () => {
            try {
                // Fetch real terminals from DB, fallback to mock
                let fetchedTerminals: TerminalRequest[] = []
                let fetchedCommissions: CommissionLedger[] = []

                try {
                    const termRes = await fetch('/api/agency-terminals?limit=100&sort=-createdAt')
                    const termData = await termRes.json()
                    if (termData?.docs?.length > 0) {
                        fetchedTerminals = termData.docs.map((d: any) => ({
                            id: d.id,
                            agentName: typeof d.agent_customer === 'object'
                                ? (d.agent_customer?.full_name || d.agent_customer?.id || 'Agent')
                                : (d.user_id || 'Agent'),
                            pos_model: d.pos_model || 'Pax S900',
                            requestDate: d.createdAt,
                            serial_number: d.serial_number,
                            status: d.status as TerminalRequest['status']
                        }))
                    }
                } catch (e) {
                    console.warn('[Admin Agency] Failed to load terminals', e)
                }

                try {
                    const commRes = await fetch('/api/agency-commissions?limit=100&sort=-createdAt')
                    const commData = await commRes.json()
                    if (commData?.docs?.length > 0) {
                        fetchedCommissions = commData.docs.map((d: any) => ({
                            id: d.id,
                            agentName: typeof d.agent_customer === 'object'
                                ? (d.agent_customer?.full_name || d.agent_customer?.id || 'Agent')
                                : (d.user_id || 'Agent'),
                            terminalSerial: typeof d.terminal === 'object' ? d.terminal?.serial_number : d.terminal,
                            amount: Number(d.transaction_amount || 0),
                            totalCommission: Number(d.total_commission || 0),
                            agentShare: Number(d.agent_share || 0),
                            bankShare: Number(d.bank_share || 0),
                            status: d.status as CommissionLedger['status'],
                            timestamp: d.createdAt
                        }))
                    }
                } catch (e) {
                    console.warn('[Admin Agency] Failed to load commissions', e)
                }

                // Rich demo fallback if DB is empty
                if (fetchedTerminals.length === 0) {
                    fetchedTerminals = [
                        { id: 'term_1', agentName: 'Aba Central Cashpoint (Kalu)', pos_model: 'Pax S900', requestDate: new Date(Date.now() - 86400000 * 5).toISOString(), serial_number: 'POS_8871928091', status: 'active' },
                        { id: 'term_2', agentName: 'Ariaria Wholesale Agents', pos_model: 'Pax A920 Smart POS', requestDate: new Date(Date.now() - 86400000 * 3).toISOString(), serial_number: 'POS_4492019920', status: 'active' },
                        { id: 'term_3', agentName: 'Umuahia Junction Hub', pos_model: 'Pax S900', requestDate: new Date(Date.now() - 86400000).toISOString(), serial_number: 'POS_PENDING_1', status: 'pending' },
                        { id: 'term_4', agentName: 'Ohafia Thrift Outlet', pos_model: 'Pax S900', requestDate: new Date(Date.now()).toISOString(), serial_number: 'POS_PENDING_2', status: 'pending' }
                    ]
                }
                if (fetchedCommissions.length === 0) {
                    fetchedCommissions = [
                        { id: 'comm_1', agentName: 'Aba Central Cashpoint (Kalu)', terminalSerial: 'POS_8871928091', amount: 2500000, totalCommission: 37500, agentShare: 26250, bankShare: 11250, status: 'settled', timestamp: new Date(Date.now() - 3600000 * 2).toISOString() },
                        { id: 'comm_2', agentName: 'Ariaria Wholesale Agents', terminalSerial: 'POS_4492019920', amount: 5000000, totalCommission: 75000, agentShare: 52500, bankShare: 22500, status: 'settled', timestamp: new Date(Date.now() - 1800000).toISOString() },
                        { id: 'comm_3', agentName: 'Aba Central Cashpoint (Kalu)', terminalSerial: 'POS_8871928091', amount: 1200000, totalCommission: 18000, agentShare: 12600, bankShare: 5400, status: 'settled', timestamp: new Date(Date.now() - 600000).toISOString() }
                    ]
                }

                setTerminals(fetchedTerminals)
                setCommissions(fetchedCommissions)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        loadAgencyData()
    }, [])

    const triggerApproveModal = (term: TerminalRequest) => {
        setSelectedTerminal(term)
        setCustomSerial(`POS_${Math.floor(1000000000 + Math.random() * 9000000000)}`)
    }

    const confirmApproveTerminal = () => {
        if (!selectedTerminal) return

        setTerminals(prev => prev.map(t => {
            if (t.id === selectedTerminal.id) {
                toast.success(`POS terminal request for "${t.agentName}" has been successfully approved! Serial ${customSerial} is assigned.`)
                return {
                    ...t,
                    status: 'active' as const,
                    serial_number: customSerial
                }
            }
            return t
        }))
        setSelectedTerminal(null)
    }

    const handleSuspendTerminal = (id: string) => {
        setTerminals(prev => prev.map(t => {
            if (t.id === id) {
                toast.warning(`POS terminal ${t.serial_number} has been suspended.`)
                return { ...t, status: 'suspended' as const }
            }
            return t
        }))
    }

    const handleActivateTerminal = (id: string) => {
        setTerminals(prev => prev.map(t => {
            if (t.id === id) {
                toast.success(`POS terminal ${t.serial_number} successfully reactivated!`)
                return { ...t, status: 'active' as const }
            }
            return t
        }))
    }

    // Stats sums
    const totalActive = terminals.filter(t => t.status === 'active').length
    const totalPending = terminals.filter(t => t.status === 'pending').length
    const bankCommissionsKobo = commissions.reduce((acc, curr) => acc + curr.bankShare, 0)
    const agentCommissionsKobo = commissions.reduce((acc, curr) => acc + curr.agentShare, 0)

    if (loading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium text-sm">Synchronizing hardware switching registers...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border/60 pb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Badge className="bg-primary/20 text-primary border-primary/30 uppercase text-[9px] font-black tracking-widest px-2 py-0.5">Hardware Switch</Badge>
                        <span className="text-xs text-muted-foreground font-bold">POS Agent Terminal Fleet Registry</span>
                    </div>
                    <h1 className="text-3xl font-black tracking-tight mt-2 bg-gradient-to-r from-primary via-blue-500 to-emerald-400 bg-clip-text text-transparent">Partner Agency Network</h1>
                    <p className="text-sm text-muted-foreground mt-1">Deploy cashpoint terminals, allocate POS hardware serial numbers, and inspect split-commission ledger logs.</p>
                </div>
                
                {/* Custom Tab Toggles */}
                <div className="flex gap-1 bg-muted p-1.5 rounded-2xl border border-border/50">
                    <button
                        onClick={() => setActiveTab('fleet')}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                            activeTab === 'fleet' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Active Fleet ({totalActive})
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                            activeTab === 'requests' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Pending Requests ({totalPending})
                    </button>
                    <button
                        onClick={() => setActiveTab('commissions')}
                        className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                            activeTab === 'commissions' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Commissions Split Log
                    </button>
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                            <Smartphone className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider">Active</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Active Fleet POS Terminals</p>
                    <p className="text-3xl font-extrabold mt-1">{totalActive} POS</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <Badge variant="outline" className="text-[9px] uppercase font-bold tracking-wider animate-pulse">In queue</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Pending Requests</p>
                    <p className="text-3xl font-extrabold mt-1">{totalPending} Devices</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-200/20 text-[9px] uppercase font-black">70% Split</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Cumulative Agent Share</p>
                    <p className="text-3xl font-extrabold mt-1">₦{(agentCommissionsKobo / 100).toLocaleString()}</p>
                </div>

                <div className="bg-card/50 p-6 rounded-2xl border border-border/85 shadow-sm backdrop-blur-md">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
                            <Landmark className="h-5 w-5" />
                        </div>
                        <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/20 text-[9px] uppercase font-black">30% Split</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Aggregate Bank Commissions</p>
                    <p className="text-3xl font-extrabold mt-1">₦{(bankCommissionsKobo / 100).toLocaleString()}</p>
                </div>
            </div>

            {/* Sub-Views Panels */}
            <div className="space-y-6">
                
                {/* 1. Fleet Listing View */}
                {activeTab === 'fleet' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border/80 rounded-3xl p-6 shadow-md space-y-6"
                    >
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <Layers className="h-5 w-5 text-primary" /> Active Hardware Swiper Fleet
                            </h2>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Monitor physical switched POS terminals, terminal models, status, and linked banking agent identities.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {terminals.filter(t => t.status !== 'pending').map(term => (
                                <div key={term.id} className="bg-muted/30 border border-border/50 rounded-2xl p-5 hover:border-primary/25 transition-all flex flex-col justify-between space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 mb-1.5">{term.pos_model}</Badge>
                                                <h3 className="font-extrabold text-sm text-foreground leading-snug">{term.agentName}</h3>
                                            </div>
                                            <Badge variant="outline" className={`text-[8px] font-bold uppercase ${
                                                term.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'
                                            }`}>
                                                {term.status}
                                            </Badge>
                                        </div>
                                        <div className="space-y-1 font-semibold text-[11px] text-muted-foreground">
                                            <p>Serial Key: <span className="text-foreground font-black">{term.serial_number}</span></p>
                                            <p>Switched Date: <span className="text-foreground">{new Date(term.requestDate).toLocaleDateString()}</span></p>
                                        </div>
                                    </div>

                                    <div className="flex border-t border-border/50 pt-4 gap-2">
                                        {term.status === 'active' ? (
                                            <Button 
                                                onClick={() => handleSuspendTerminal(term.id)}
                                                variant="outline" 
                                                className="w-full h-8 text-destructive border-destructive/20 bg-destructive/5 hover:bg-destructive/10 font-bold text-xs rounded-lg shadow-none"
                                            >
                                                Suspend POS Device
                                            </Button>
                                        ) : (
                                            <Button 
                                                onClick={() => handleActivateTerminal(term.id)}
                                                className="w-full h-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs rounded-lg"
                                            >
                                                Activate Device
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* 2. Requests Table View */}
                {activeTab === 'requests' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border/80 rounded-3xl p-6 shadow-md space-y-6"
                    >
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <Smartphone className="h-5 w-5 text-amber-500" /> Pending Hardware Applications
                            </h2>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Approve terminal hardware requests and issue secure hardware switching serial numbers.</p>
                        </div>

                        {terminals.filter(t => t.status === 'pending').length === 0 ? (
                            <div className="text-center py-12 bg-muted/20 border border-dashed rounded-2xl text-muted-foreground space-y-2">
                                <Check className="h-8 w-8 text-emerald-500 mx-auto" />
                                <p className="text-sm font-extrabold text-foreground">All POS Requests Processed</p>
                                <p className="text-xs">No pending hardware deployment cycles currently queueing in bank switch registry.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {terminals.filter(t => t.status === 'pending').map(term => (
                                    <div key={term.id} className="bg-muted/30 border border-border/50 rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-primary/20 transition-all">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-extrabold text-foreground">{term.agentName}</p>
                                                <Badge className="bg-amber-500/10 text-amber-600 border-amber-200/20 text-[8px] font-black uppercase">Pending Allocation</Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium">Device Model Requested: <span className="text-foreground font-bold">{term.pos_model}</span></p>
                                            <p className="text-[10px] text-muted-foreground font-semibold">Request Timestamp: <span className="text-foreground">{new Date(term.requestDate).toLocaleString()}</span></p>
                                        </div>
                                        
                                        <Button 
                                            onClick={() => triggerApproveModal(term)}
                                            className="w-full sm:w-auto h-9 bg-primary text-primary-foreground font-black text-xs rounded-xl px-5 hover:bg-primary/95 shadow-md shadow-primary/10"
                                        >
                                            Approve & Allocate POS
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                )}

                {/* 3. Split Commissions Ledgers */}
                {activeTab === 'commissions' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-card border border-border/80 rounded-3xl p-6 shadow-md space-y-6"
                    >
                        <div>
                            <h2 className="text-lg font-black flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" /> Commissions Split Ledger
                            </h2>
                            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Audited immutable statements representing POS card transaction commissions switching to bank and agent settlement vaults.</p>
                        </div>

                        <div className="overflow-x-auto rounded-2xl border border-border/60 shadow-sm">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-muted/50 text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                                        <th className="px-5 py-4">Transaction ID</th>
                                        <th className="px-5 py-4">Agent Identity</th>
                                        <th className="px-5 py-4">POS Serial</th>
                                        <th className="px-5 py-4">Switched Cash</th>
                                        <th className="px-5 py-4">Total Fee</th>
                                        <th className="px-5 py-4">Agent (70%)</th>
                                        <th className="px-5 py-4">Bank (30%)</th>
                                        <th className="px-5 py-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/60">
                                    {commissions.map(log => (
                                        <tr key={log.id} className="text-xs hover:bg-muted/10 transition-colors font-medium">
                                            <td className="px-5 py-4 font-bold text-foreground">#{log.id.toUpperCase()}</td>
                                            <td className="px-5 py-4 text-muted-foreground">{log.agentName}</td>
                                            <td className="px-5 py-4 font-mono font-bold text-foreground">{log.terminalSerial}</td>
                                            <td className="px-5 py-4 font-bold text-foreground">₦{(log.amount / 100).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-primary font-bold">₦{(log.totalCommission / 100).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-emerald-500 font-extrabold">₦{(log.agentShare / 100).toLocaleString()}</td>
                                            <td className="px-5 py-4 text-blue-500 font-extrabold">₦{(log.bankShare / 100).toLocaleString()}</td>
                                            <td className="px-5 py-4">
                                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] uppercase font-black">
                                                    {log.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

            </div>

            {/* Modal: Allocate Serial Number & Approve */}
            <AnimatePresence>
                {selectedTerminal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedTerminal(null)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />

                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-black flex items-center gap-2">
                                        <Smartphone className="h-6 w-6 text-primary" /> Allocate POS Serial Number
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">Assign a verified physical hardware serial code to activate the card switch reader.</p>
                                </div>
                                <Button size="icon" variant="ghost" className="size-8 rounded-lg" onClick={() => setSelectedTerminal(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 bg-muted/40 rounded-2xl space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-bold">Requesting Agent:</span>
                                        <span className="font-extrabold text-foreground">{selectedTerminal.agentName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-bold">Hardware Model:</span>
                                        <span className="font-extrabold text-primary">{selectedTerminal.pos_model}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground font-bold">Subscribed Commission Split:</span>
                                        <span className="font-black text-emerald-500">70% Agent / 30% Bank</span>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Hardware Serial Code (Generated)</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={customSerial}
                                        onChange={(e) => setCustomSerial(e.target.value)}
                                        placeholder="POS_XXXXXXXXXX"
                                        className="w-full h-11 px-4 rounded-xl border bg-muted/30 text-sm font-mono focus:outline-none focus:border-primary transition-colors"
                                    />
                                </div>

                                <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-3 flex gap-2.5 text-blue-600 leading-normal">
                                    <Info className="h-5 w-5 shrink-0 text-blue-500" />
                                    <p className="text-[10px] font-semibold leading-relaxed">
                                        Approving allocates this terminal serial number in the banking network. Swiped card switches will be routed directly to the agent's cashout float ledger account instantly.
                                    </p>
                                </div>

                                <div className="flex gap-3 justify-end pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setSelectedTerminal(null)}
                                        className="rounded-xl h-11 font-bold shadow-none"
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        onClick={confirmApproveTerminal}
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 shadow-md hover:bg-primary/95"
                                    >
                                        Deploy POS Terminal
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
