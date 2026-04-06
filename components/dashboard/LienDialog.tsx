import React, { useState } from 'react'
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription,
    DialogFooter 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ShieldAlert, Loader2, Info } from 'lucide-react'
import { Account } from '@/lib/api/types'

interface LienDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    account: Account
    onConfirm: (amount: number, reason: string) => Promise<void>
}

export function LienDialog({ open, onOpenChange, account, onConfirm }: LienDialogProps) {
    const [amount, setAmount] = useState<string>(String(account.lien_amount || 0))
    const [reason, setReason] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleConfirm = async () => {
        const numAmount = parseFloat(amount)
        if (isNaN(numAmount) || numAmount < 0) return
        
        setIsSubmitting(true)
        try {
            await onConfirm(numAmount, reason)
            onOpenChange(false)
        } catch (error) {
            console.error("Lien update failed", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-full bg-amber-100 text-amber-600">
                            <ShieldAlert className="h-5 w-5" />
                        </div>
                        <DialogTitle>Manage Account Lien</DialogTitle>
                    </div>
                    <DialogDescription>
                        Set or adjust the lien amount for account <span className="font-mono font-bold text-foreground">{account.account_number}</span>. This amount will be frozen and unavailable for withdrawal.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="grid grid-cols-1 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="amount" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lien Amount (NGN)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-bold text-sm">₦</span>
                                <Input 
                                    id="amount" 
                                    type="number" 
                                    className="pl-7 font-mono text-lg h-12"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                />
                            </div>
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1">
                                <Info className="h-3 w-3" />
                                Current available balance: ₦{(account.balance - (account.lien_amount || 0)).toLocaleString()}
                            </p>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="reason" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Reason for Lien / Reference</Label>
                            <Textarea 
                                id="reason" 
                                placeholder="e.g. Court Order #123, Loan Collateral, Pending Investigation..." 
                                className="resize-none h-24"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="p-3 rounded-lg bg-muted/50 border flex items-start gap-3">
                        <ShieldAlert className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Liens are enforced at the ledger level. Funds will remain in the account but cannot be moved via any channel until the lien is reduced or removed.
                        </p>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={isSubmitting}
                        className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            'Update Lien'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
