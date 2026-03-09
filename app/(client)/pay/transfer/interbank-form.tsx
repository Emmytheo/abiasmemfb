'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Building2, Save, Send, RefreshCcw, UserRound, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Service } from '@/lib/api/types'
import { api } from '@/lib/api'
import { createClient } from '@/lib/supabase/client'
import { useEffect } from 'react'

export function InterbankTransferForm({ service }: { service: Service | null }) {
    const router = useRouter()
    const [amount, setAmount] = useState('')
    const [account, setAccount] = useState('')
    const [bank, setBank] = useState('')
    const [narration, setNarration] = useState('')
    const [isResolving, setIsResolving] = useState(false)
    const [isExecuting, setIsExecuting] = useState(false)
    const [resolvedName, setResolvedName] = useState<string | null>(null)
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

    // Helper specific to Nigeria/Local NIP routing concepts to mock the resolution phase
    const handleResolve = async () => {
        if (!account || !bank) {
            toast.error("Please enter account number and select a bank.")
            return
        }
        setIsResolving(true)
        setResolvedName(null)

        try {
            // Here we will eventually wire up the NIP name enquiry Service Integration.
            // For now, simulating the network delay.
            await new Promise(r => setTimeout(r, 1200))
            if (account.length === 10) {
                setResolvedName(`Mock User ${account.substring(6)}`)
                toast.success("Account resolved successfully")
            } else {
                toast.error("Invalid NUBAN account number")
            }
        } finally {
            setIsResolving(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!resolvedName) {
            toast.error("Please resolve the account name first.")
            return
        }

        // This will eventually push to payload transactions via server action
        toast.message(`Initiating transfer of NGN ${amount} to ${resolvedName}`)
        setTimeout(() => {
            router.push('/client-dashboard')
            toast.success("Transfer completed successfully")
        }, 2000)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Recipient Bank</label>
                        <select
                            value={bank}
                            onChange={(e) => setBank(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            required
                        >
                            <option value="">Select Bank...</option>
                            <option value="access">Access Bank</option>
                            <option value="gtb">Guaranty Trust Bank</option>
                            <option value="zenith">Zenith Bank</option>
                            <option value="first">First Bank</option>
                            <option value="uba">UBA</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Account Number</label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="10 digits NUBAN"
                                value={account}
                                onChange={(e) => {
                                    setAccount(e.target.value)
                                    setResolvedName(null) // reset on change
                                }}
                                maxLength={10}
                                required
                            />
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={handleResolve}
                                disabled={isResolving || account.length < 10 || !bank}
                            >
                                {isResolving ? <RefreshCcw className="animate-spin" size={16} /> : "Verify"}
                            </Button>
                        </div>
                    </div>
                </div>

                {resolvedName && (
                    <Card className="p-3 bg-primary/5 border-primary/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-full text-primary">
                                <UserRound size={16} />
                            </div>
                            <div>
                                <p className="text-sm font-medium">{resolvedName}</p>
                                <p className="text-xs text-muted-foreground">Verified Account</p>
                            </div>
                        </div>
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-2">
                            <Save size={14} />
                            <span className="text-xs">Save Beneficiary</span>
                        </Button>
                    </Card>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (NGN)</label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="text-lg font-semibold"
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Narration / Remark</label>
                    <Input
                        maxLength={50}
                        placeholder="Optional note for the receiver"
                        value={narration}
                        onChange={(e) => setNarration(e.target.value)}
                    />
                </div>

            </div>

            <Button type="submit" className="w-full gap-2" size="lg" disabled={!resolvedName || !amount || isExecuting}>
                {isExecuting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                Send Money
            </Button>
        </form>
    )
}
