"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useScope } from "@/context/scope-context"
import { Receipt, Plus, Search, Building2, TrendingUp, Filter, AlertCircle, X, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { api, Invoice } from "@/lib/api"

export default function InvoicesPage() {
    const { activeScope, activeScopeId } = useScope();
    
    const [invoices, setInvoices] = React.useState<Invoice[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState<string | null>(null)

    const [showInvoiceModal, setShowInvoiceModal] = React.useState(false)
    const [newClient, setNewClient] = React.useState('')
    const [newAmount, setNewAmount] = React.useState('')

    React.useEffect(() => {
        async function loadData() {
            setLoading(true)
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                
                if (user) {
                    if (activeScope.type === 'business') {
                        // In reality, this would fetch invoices associated with this activeScopeId (the business).
                        // For the mock, we just fetch using the API.
                        const profileRes = await fetch(`/api/merchant-profiles?where[user_id][equals]=${user.id}`)
                        const profileData = await profileRes.json()
                        const profile = profileData.docs?.[0]
                        
                        const invs = await api.getInvoices(profile ? profile.id : user.id)
                        setInvoices(invs)
                    } else {
                        // Fetch general invoices if needed, or fallback.
                        setInvoices([])
                    }
                }
            } catch (err) {
                console.error("Failed to load invoices", err)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [activeScope.id, activeScope.type])

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        setActionLoading('invoice')
        try {
            const { createClient } = await import("@/lib/supabase/client")
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            
            if (user) {
                const newInv = await api.createInvoice({
                    user_id: user.id,
                    client_name: newClient,
                    amount: Number(newAmount),
                    status: 'unpaid',
                    issue_date: new Date().toISOString()
                })
                setInvoices(prev => [newInv, ...prev])
                toast.success('Invoice published successfully!')
                setShowInvoiceModal(false)
                setNewClient('')
                setNewAmount('')
            }
        } catch (e) {
            toast.error('Failed to create invoice')
        } finally {
            setActionLoading(null)
        }
    }

    if (activeScope.type !== 'business') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 animate-in fade-in zoom-in duration-500">
                <div className="h-24 w-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black mb-2 tracking-tight">Scope Not Supported</h2>
                <p className="text-muted-foreground font-medium max-w-md">
                    Invoices & Billing are exclusive to Business / Merchant profiles. Please switch your active organization scope to access this module.
                </p>
            </div>
        );
    }

    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const unpaidSum = invoices.filter(i => i.status === 'unpaid').reduce((sum, inv) => sum + inv.amount, 0);
    
    return (
        <div className="max-w-7xl mx-auto p-1 md:p-10 space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-muted-foreground text-sm font-bold uppercase tracking-widest">{activeScope.name}</h2>
                    <h3 className="text-4xl md:text-5xl font-black tracking-tight mt-1 flex items-center gap-3">
                        <Receipt className="h-10 w-10 text-primary" />
                        Invoices & Billing
                    </h3>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-12 px-6 rounded-xl font-bold shadow-sm">
                        <Filter className="h-4 w-4 mr-2" /> Filter
                    </Button>
                    <Button onClick={() => setShowInvoiceModal(true)} className="h-12 px-6 rounded-xl font-black bg-primary text-primary-foreground shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 transition-all">
                        <Plus className="h-5 w-5 mr-1.5" /> Issue Invoice
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl border hover:border-primary/30 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
                            <Receipt className="h-6 w-6" />
                        </div>
                        <Badge variant="secondary" className="font-bold">{invoices.length} Issued</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Total Invoiced (All Time)</p>
                    <p className="text-3xl font-black mt-2 tracking-tight">₦{totalInvoiced.toLocaleString()}</p>
                </div>
                
                <div className="bg-card p-6 rounded-2xl border hover:border-rose-500/30 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-rose-500/10 rounded-xl text-rose-500 group-hover:scale-110 transition-transform">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <Badge className="bg-rose-50 text-rose-600 border-rose-200 font-bold uppercase">{invoices.filter(i => i.status === 'unpaid').length} Overdue</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Outstanding Payments</p>
                    <p className="text-3xl font-black mt-2 tracking-tight text-rose-600">₦{unpaidSum.toLocaleString()}</p>
                </div>
                
                <div className="bg-card p-6 rounded-2xl border hover:border-emerald-500/30 transition-all shadow-sm group">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 group-hover:scale-110 transition-transform">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 font-bold uppercase">72% Collection Rate</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Collected Revenue</p>
                    <p className="text-3xl font-black mt-2 tracking-tight text-emerald-600">₦{(totalInvoiced - unpaidSum).toLocaleString()}</p>
                </div>
            </div>

            <div className="bg-card border rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 border-b bg-muted/20 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <h3 className="text-lg font-black">Billing Ledger</h3>
                        <p className="text-xs text-muted-foreground font-semibold">Track and manage client invoices and collections.</p>
                    </div>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                            type="text" 
                            placeholder="Search invoices..." 
                            className="w-full h-10 pl-9 pr-4 rounded-xl bg-background border text-sm font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>
                
                <div className="p-0">
                    {loading ? (
                        <div className="p-10 flex justify-center">
                            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : invoices.length === 0 ? (
                        <div className="p-16 text-center">
                            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-bold">No Invoices Found</h3>
                            <p className="text-sm text-muted-foreground font-medium max-w-sm mx-auto mt-2">You haven't issued any billing statements yet. Click 'Issue Invoice' to generate your first bill.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {invoices.map((inv) => (
                                <div key={inv.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-muted/10 transition-colors">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-extrabold text-base">{inv.client_name}</p>
                                            <div className="flex gap-2 items-center text-xs text-muted-foreground mt-0.5 font-semibold">
                                                <span>ID: #{inv.id.substring(0, 8).toUpperCase()}</span>
                                                <span>•</span>
                                                <span>Issued {new Date(inv.issue_date).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center">
                                        <p className="text-lg font-black tracking-tight">₦{inv.amount.toLocaleString()}</p>
                                        <Badge variant="outline" className={`text-[10px] uppercase tracking-widest px-2 py-0.5 mt-1 border-0 font-bold ${
                                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                        }`}>
                                            {inv.status}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal: Create SME Invoice */}
            <AnimatePresence>
                {showInvoiceModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInvoiceModal(false)}
                            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-card border border-border w-full max-w-md rounded-3xl p-6 shadow-2xl z-10 relative space-y-6"
                        >
                            <div className="absolute top-4 right-4 cursor-pointer p-2 hover:bg-muted rounded-full transition-colors"
                                onClick={() => setShowInvoiceModal(false)}
                            >
                                <X className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div>
                                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                                    <Receipt className="h-6 w-6" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tight">Issue New Invoice</h3>
                                <p className="text-xs text-muted-foreground mt-1 font-semibold">Generate a billing statement to collect payments from your clients.</p>
                            </div>
                            <form onSubmit={handleCreateInvoice} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Client / Company Name</label>
                                    <input 
                                        type="text" required placeholder="e.g. Aba Leather Guild" value={newClient} onChange={(e) => setNewClient(e.target.value)}
                                        className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-sm font-bold placeholder:text-muted-foreground/60 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Invoice Amount (₦)</label>
                                    <input 
                                        type="number" required placeholder="e.g. 50000" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                                        className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-sm font-bold placeholder:text-muted-foreground/60 focus:outline-none transition-colors"
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-4">
                                    <Button type="button" variant="outline" className="rounded-xl h-12 px-6 font-bold" onClick={() => setShowInvoiceModal(false)}>Cancel</Button>
                                    <Button type="submit" disabled={actionLoading === 'invoice'} className="bg-primary text-primary-foreground font-black rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all text-sm">
                                        {actionLoading === 'invoice' ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Publish Invoice'}
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
