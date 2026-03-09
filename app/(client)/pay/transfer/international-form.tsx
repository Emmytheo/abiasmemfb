'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Globe2, Send, Save, CreditCard, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Service } from '@/lib/api/types'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'


export function InternationalTransferForm({ service }: { service: Service | null }) {
    const router = useRouter()
    const [amount, setAmount] = useState('')
    const [currency, setCurrency] = useState('USD')
    const [iban, setIban] = useState('')
    const [swift, setSwift] = useState('')
    const [accountName, setAccountName] = useState('')
    const [narration, setNarration] = useState('')
    const [isExecuting, setIsExecuting] = useState(false)
    const [sourceAccounts, setSourceAccounts] = useState<any[]>([])
    const [selectedSourceId, setSelectedSourceId] = useState('')

    useEffect(() => {
        async function fetchAccounts() {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const accs = await api.getUserAccounts(user.id)
                setSourceAccounts(accs)
                if (accs.length > 0) {
                    setSelectedSourceId(String(accs[0].id))
                }
            }
        }
        fetchAccounts()
    }, [])
    
    // NGN equivalence state
    const exchangeRate = 1650 // Mock dynamic FX rate
    const totalNgn = parseFloat(amount || '0') * exchangeRate

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!service) {
            toast.error("Service not configured on backend.")
            return
        }
        if (!selectedSourceId) {
             toast.error("Please select a source account.")
             return
        }
        
        setIsExecuting(true)
        try {
            const payload = {
                sourceAccountId: selectedSourceId,
                iban,
                swift,
                accountName,
                amount: Number(amount),
                currency,
                narration
            }
            
            const executionId = await api.executeServiceWorkflow(service.id, payload)
            toast.success("International wire submitted for processing")
            router.push(`/pay/receipt/${executionId}`)
            
        } catch (error: any) {
             toast.error(error.message || "Failed to execute transfer")
             setIsExecuting(false)
        }
    }

    if (!service) {
         return <div className="p-4 text-center text-sm text-destructive border border-destructive/20 rounded-md bg-destructive/10 mt-4">International Transfer Service is not configured in Payload CMS.</div>
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            
            <Card className="p-4 bg-amber-500/5 border-amber-500/20 mb-6 font-mono text-sm flex justify-between">
                <span>Current FX Rate:</span>
                <span className="font-semibold text-amber-600">1 {currency} = ₦ {exchangeRate.toLocaleString()}</span>
            </Card>

            <div className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium">Pay From (Source Account)</label>
                    <select 
                        value={selectedSourceId} 
                        onChange={(e) => setSelectedSourceId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        required
                    >
                        <option value="" disabled>Select an account...</option>
                        {sourceAccounts.map(acc => (
                            <option key={acc.id} value={acc.id}>
                                {acc.account_type} - {acc.account_number} (₦{acc.balance.toLocaleString()})
                            </option>
                        ))}
                    </select>
                </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Amount to Send</label>
                         <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input 
                                type="number" 
                                placeholder="0.00" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)}
                                className="pl-7 text-lg font-semibold"
                                required
                            />
                        </div>
                         <p className="text-xs text-muted-foreground text-right mt-1">
                            Debit roughly: ₦ {totalNgn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                         </p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Send Currency</label>
                        <select 
                            value={currency} 
                            onChange={(e) => setCurrency(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        >
                            <option value="USD">USD - US Dollar</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="EUR">EUR - Euro</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2 pt-2 border-t">
                    <label className="text-sm font-medium">Beneficiary Full Name</label>
                    <Input 
                        placeholder="John Doe" 
                        value={accountName} 
                        onChange={(e) => setAccountName(e.target.value)}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">IBAN / Account No.</label>
                        <Input 
                            placeholder="GB00AABB..." 
                            value={iban} 
                            onChange={(e) => setIban(e.target.value)}
                            className="uppercase font-mono"
                            required
                        />
                    </div>
                     <div className="space-y-2">
                        <label className="text-sm font-medium">SWIFT / BIC Code</label>
                        <Input 
                            placeholder="BOFAUS3N" 
                            value={swift} 
                            onChange={(e) => setSwift(e.target.value)}
                            className="uppercase font-mono"
                            maxLength={11}
                            required
                        />
                    </div>
                </div>
                
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Purpose of Transfer</label>
                    <Input 
                        placeholder="Family support, tuition, etc." 
                        value={narration} 
                        onChange={(e) => setNarration(e.target.value)}
                        required
                    />
                </div>

            </div>

             <div className="flex items-center justify-between text-sm text-muted-foreground pb-2">
                <span className="flex items-center gap-1"><CreditCard size={14}/> Wire fees may apply</span>
             </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={!amount || !iban || !swift || !accountName || isExecuting}>
                {isExecuting ? <Loader2 className="animate-spin" size={18} /> : <Globe2 size={18} />}
                Initiate Wire Transfer
            </Button>
        </form>
    )
}
