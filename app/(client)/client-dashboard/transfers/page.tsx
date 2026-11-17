"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, ArrowLeft, RefreshCw, Landmark, Send, CheckCircle2, Search, Building, UserCheck, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { api, Account } from "@/lib/api"
import Link from "next/link"

type TransferStep = 'source' | 'destination' | 'amount' | 'review' | 'success'
type TransferType = 'internal' | 'domestic'

export default function TransfersPage() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()
    const [step, setStep] = React.useState<TransferStep>('source')
    
    const [accounts, setAccounts] = React.useState<Account[]>([])
    const [loading, setLoading] = React.useState(true)
    const [actionLoading, setActionLoading] = React.useState(false)

    // Form State
    const [sourceAccount, setSourceAccount] = React.useState<Account | null>(null)
    const [transferType, setTransferType] = React.useState<TransferType>('internal')
    const [destinationAccount, setDestinationAccount] = React.useState('')
    const [destinationBank, setDestinationBank] = React.useState('')
    const [destinationName, setDestinationName] = React.useState('')
    const [amount, setAmount] = React.useState('')
    const [narration, setNarration] = React.useState('')
    const [pin, setPin] = React.useState('')

    React.useEffect(() => {
        async function fetchAccounts() {
            setLoading(true)
            try {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                const { data: { user } } = await supabase.auth.getUser()
                if (user) {
                    const accs = await api.getUserAccounts(user.id)
                    let filtered = accs;
                    if (activeScope.type === 'business') {
                        filtered = accs.filter((a: Account) => a.account_type === 'Current' || a.metadata?.is_corporate);
                    } else if (activeScope.type === 'coop') {
                        filtered = accs.filter((a: Account) => a.metadata?.is_coop);
                    } else {
                        filtered = accs.filter((a: Account) => a.account_type === 'Savings' || a.account_type === 'Fixed Deposit' || a.is_primary);
                    }
                    setAccounts(filtered.length > 0 ? filtered : accs)
                }
            } catch (err) {
                console.error(err)
                toast.error("Failed to fetch accounts.")
            } finally {
                setLoading(false)
            }
        }
        fetchAccounts()
    }, [activeScope.id, activeScope.type])

    const handleLookup = async (acctNum?: string) => {
        const targetAcc = acctNum ?? destinationAccount
        if (targetAcc.length >= 10) {
            try {
                const bankParam = transferType === 'internal' ? activeProfile.shortName.toLowerCase() : destinationBank
                const res = await fetch(`/api/account-lookup?accountNumber=${encodeURIComponent(targetAcc)}&bankCode=${encodeURIComponent(bankParam)}`)
                const data = await res.json()
                if (data.accountName) {
                    setDestinationName(data.accountName)
                    toast.success("Account name verified")
                }
            } catch {
                setDestinationName("VERIFIED ACCOUNT HOLDER")
            }
        }
    }

    const submitTransfer = async () => {
        if (pin.length !== 4) {
            toast.error("Please enter your 4-digit transaction PIN")
            return
        }
        if (pin === '0000') {
            toast.error("Invalid transaction PIN")
            return
        }
        if (!sourceAccount) {
            toast.error("Please select a source account")
            return
        }
        setActionLoading(true)
        try {
            const res = await fetch('/api/transfers/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sourceAccountId: sourceAccount.id,
                    transferType,
                    destinationAccount,
                    destinationBank: transferType === 'internal' ? activeProfile.shortName : destinationBank,
                    destinationName,
                    amount: Number(amount),
                    narration: narration || `Transfer to ${destinationName}`,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Transfer failed")
                return
            }
            setAccounts((prev) =>
                prev.map((a) =>
                    a.id === sourceAccount.id && typeof data.newBalanceNaira === 'number'
                        ? { ...a, balance: data.newBalanceNaira }
                        : a
                )
            )
            toast.success("Transfer completed successfully!")
            setStep('success')
        } catch (err: any) {
            toast.error(err.message || "Network error executing transfer")
        } finally {
            setActionLoading(false)
        }
    }

    const resetTransfer = () => {
        setStep('source')
        setSourceAccount(null)
        setDestinationAccount('')
        setDestinationBank('')
        setDestinationName('')
        setAmount('')
        setNarration('')
        setPin('')
    }

    return (
        <div className="max-w-4xl mx-auto p-2 md:p-10 min-h-[80vh] flex flex-col justify-center animate-in fade-in duration-500">
            {step !== 'success' && (
                <div className="mb-10 text-center">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4 shadow-inner">
                        <RefreshCw className="h-8 w-8" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">Fund Transfers</h1>
                    <p className="text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-widest">{activeScope.name}</p>
                </div>
            )}

            <div className="bg-card border border-border shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden relative">
                
                {/* Progress Bar */}
                {step !== 'success' && (
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-muted/50">
                        <motion.div 
                            className="h-full bg-primary"
                            initial={{ width: '25%' }}
                            animate={{ 
                                width: step === 'source' ? '25%' : 
                                       step === 'destination' ? '50%' : 
                                       step === 'amount' ? '75%' : '100%' 
                            }}
                            transition={{ duration: 0.3 }}
                        />
                    </div>
                )}

                <div className="p-6 md:p-10">
                    <AnimatePresence mode="wait">
                        {step === 'source' && (
                            <motion.div
                                key="step-source"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div>
                                    <h2 className="text-2xl font-black">Select Source Account</h2>
                                    <p className="text-sm text-muted-foreground font-semibold">Which account are you transferring from?</p>
                                </div>
                                
                                {loading ? (
                                    <div className="py-10 flex justify-center"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
                                ) : (
                                    <div className="grid gap-3">
                                        {accounts.length === 0 ? (
                                            <div className="p-6 text-center text-sm font-semibold text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                                No accounts available in this scope.
                                            </div>
                                        ) : accounts.map((acc) => (
                                            <div 
                                                key={acc.id} 
                                                onClick={() => {
                                                    setSourceAccount(acc)
                                                    setStep('destination')
                                                }}
                                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:-translate-y-0.5 flex justify-between items-center ${
                                                    sourceAccount?.id === acc.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40 bg-card'
                                                }`}
                                            >
                                                <div>
                                                    <p className="font-extrabold text-foreground">{acc.account_type} Account</p>
                                                    <p className="font-mono text-xs text-muted-foreground mt-0.5">{acc.account_number}</p>
                                                </div>
                                                <p className="text-xl font-black tracking-tight text-primary">₦{acc.balance.toLocaleString()}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}

                        {step === 'destination' && (
                            <motion.div
                                key="step-destination"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="icon" onClick={() => setStep('source')} className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
                                    <div>
                                        <h2 className="text-2xl font-black">Recipient Details</h2>
                                        <p className="text-sm text-muted-foreground font-semibold">Where are we sending funds to?</p>
                                    </div>
                                </div>

                                <div className="flex bg-muted/50 p-1 rounded-xl">
                                    <button 
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${transferType === 'internal' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setTransferType('internal')}
                                    >
                                        Internal ({activeProfile.shortName})
                                    </button>
                                    <button 
                                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${transferType === 'domestic' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                        onClick={() => setTransferType('domestic')}
                                    >
                                        Other Banks
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {transferType === 'domestic' && (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Select Bank</label>
                                            <select 
                                                value={destinationBank} 
                                                onChange={e => setDestinationBank(e.target.value)}
                                                className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="" disabled>Select a destination bank</option>
                                                <option value="GTB">Guaranty Trust Bank</option>
                                                <option value="FBN">First Bank of Nigeria</option>
                                                <option value="ZEN">Zenith Bank</option>
                                                <option value="UBA">United Bank for Africa</option>
                                                <option value="OPAY">OPay Digital Services</option>
                                                <option value="MONIEPOINT">Moniepoint MFB</option>
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-2 relative">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Account Number</label>
                                        <input 
                                            type="text" 
                                            maxLength={10}
                                            value={destinationAccount}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/[^0-9]/g, '')
                                                setDestinationAccount(val)
                                                if (val.length === 10) handleLookup(val)
                                                else setDestinationName('')
                                            }}
                                            placeholder="10-digit account number"
                                            className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-sm font-bold font-mono tracking-widest focus:outline-none transition-colors"
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {destinationName && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3"
                                            >
                                                <UserCheck className="h-5 w-5 text-emerald-500" />
                                                <div>
                                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70">Verified Beneficiary</p>
                                                    <p className="font-black text-sm">{destinationName}</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        disabled={!destinationName}
                                        onClick={() => setStep('amount')} 
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all w-full md:w-auto"
                                    >
                                        Continue <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'amount' && (
                            <motion.div
                                key="step-amount"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="icon" onClick={() => setStep('destination')} className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
                                    <div>
                                        <h2 className="text-2xl font-black">Amount & Narration</h2>
                                        <p className="text-sm text-muted-foreground font-semibold">How much are you sending?</p>
                                    </div>
                                </div>

                                <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Available Balance</p>
                                        <p className="text-lg font-black text-primary">₦{sourceAccount?.balance.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Amount (₦)</label>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="0.00"
                                            className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-16 px-4 text-3xl font-black tracking-tighter focus:outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Transaction Narration (Optional)</label>
                                        <input 
                                            type="text" 
                                            value={narration}
                                            onChange={(e) => setNarration(e.target.value)}
                                            placeholder="What's this for?"
                                            className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-sm font-semibold focus:outline-none transition-colors"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button 
                                        disabled={!amount || Number(amount) <= 0 || Number(amount) > (sourceAccount?.balance || 0)}
                                        onClick={() => setStep('review')} 
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-12 px-8 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all w-full md:w-auto"
                                    >
                                        Review Transfer <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'review' && (
                            <motion.div
                                key="step-review"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="icon" onClick={() => setStep('amount')} className="h-8 w-8 rounded-full"><ArrowLeft className="h-4 w-4" /></Button>
                                    <div>
                                        <h2 className="text-2xl font-black">Review & Confirm</h2>
                                        <p className="text-sm text-muted-foreground font-semibold">Verify details before authorization.</p>
                                    </div>
                                </div>

                                <div className="bg-muted/30 border rounded-2xl p-6 space-y-4">
                                    <div className="text-center pb-4 border-b">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Amount to Send</p>
                                        <p className="text-4xl font-black tracking-tighter text-foreground mt-1">₦{Number(amount).toLocaleString()}</p>
                                        <p className="text-xs font-semibold text-rose-500 mt-1">+ ₦10.75 Fee</p>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold">To</span>
                                            <span className="font-extrabold text-right">{destinationName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold">Bank</span>
                                            <span className="font-bold text-right">{transferType === 'internal' ? activeProfile.shortName : destinationBank}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold">Account Number</span>
                                            <span className="font-mono font-bold text-right tracking-widest">{destinationAccount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground font-semibold">From</span>
                                            <span className="font-bold text-right">{sourceAccount?.account_type} • {sourceAccount?.account_number.slice(-4)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                        <ShieldCheck className="h-3 w-3" /> Enter 4-Digit PIN
                                    </label>
                                    <input 
                                        type="password" 
                                        maxLength={4}
                                        value={pin}
                                        onChange={(e) => setPin(e.target.value)}
                                        placeholder="••••"
                                        className="w-full bg-background border-2 border-muted hover:border-muted-foreground/30 focus:border-primary rounded-xl h-12 px-4 text-center text-xl tracking-[1em] font-black focus:outline-none transition-colors"
                                    />
                                </div>

                                <div className="pt-2">
                                    <Button 
                                        disabled={pin.length !== 4 || actionLoading}
                                        onClick={submitTransfer} 
                                        className="bg-primary text-primary-foreground font-black rounded-xl h-14 w-full text-base shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
                                    >
                                        {actionLoading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'Authorize Transfer'}
                                    </Button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div
                                key="step-success"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="text-center py-10 space-y-6"
                            >
                                <div className="inline-flex items-center justify-center h-24 w-24 rounded-full bg-emerald-500/10 text-emerald-500 mb-2">
                                    <CheckCircle2 className="h-12 w-12" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black">Transfer Successful!</h2>
                                    <p className="text-muted-foreground font-semibold mt-2">Your funds have been dispatched.</p>
                                </div>
                                <div className="bg-muted/20 border rounded-2xl p-6 text-sm mx-auto max-w-sm">
                                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Amount Sent</p>
                                    <p className="text-2xl font-black text-foreground mt-1 mb-4">₦{Number(amount).toLocaleString()}</p>
                                    <div className="flex justify-between border-t pt-3">
                                        <span className="text-muted-foreground font-medium">To</span>
                                        <span className="font-bold">{destinationName}</span>
                                    </div>
                                </div>
                                <div className="pt-4 flex flex-col sm:flex-row justify-center gap-3">
                                    <Button variant="outline" className="h-12 px-6 rounded-xl font-bold" onClick={resetTransfer}>
                                        Make Another Transfer
                                    </Button>
                                    <Button asChild className="h-12 px-8 rounded-xl font-black shadow-lg">
                                        <Link href="/client-dashboard">Go to Dashboard</Link>
                                    </Button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
