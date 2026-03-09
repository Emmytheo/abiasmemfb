"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, Account } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Loader2, ArrowLeft, CreditCard, Building, Smartphone } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function FundAccountPage() {
    const router = useRouter();
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(true);
    const [isFunding, setIsFunding] = useState(false);
    const [method, setMethod] = useState<'card' | 'transfer' | 'ussd'>('card');

    useEffect(() => {
        async function loadAccounts() {
            try {
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    router.push("/auth/login");
                    return;
                }
                const userAccounts = await api.getUserAccounts(user.id);
                setAccounts(userAccounts);
                if (userAccounts.length > 0) {
                    setSelectedAccountId(String(userAccounts[0].id));
                }
            } catch (err) {
                console.error("Failed to fetch accounts:", err);
            } finally {
                setLoading(false);
            }
        }
        loadAccounts();
    }, [router]);

    const handleFundAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedAccountId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) {
            toast.error("Please provide a valid account and amount to fund.");
            return;
        }

        setIsFunding(true);
        toast.message(`Processing deposit of ₦${amount}... simulating ${method} gateway`);

        try {
            // Simulate external payment gateway delay
            await new Promise(r => setTimeout(r, 2000));

            const result = await api.processAccountFunding(selectedAccountId, Number(amount));

            if (result.success) {
                toast.success("Account funded successfully!");
                router.push(`/my-products/${selectedAccountId}`);
            } else {
                toast.error(result.error || "Funding failed. Please try again.");
            }
        } catch (err: any) {
            toast.error(err.message || "An unexpected error occurred.");
        } finally {
            setIsFunding(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[60vh] w-full items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-primary/50" />
            </div>
        );
    }

    return (
        <div className="container max-w-xl py-12 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" asChild className="rounded-full bg-muted/50 hover:bg-muted">
                    <Link href="/my-products">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Fund Account</h1>
                    <p className="text-sm text-muted-foreground mt-1">Add money to your account instantly.</p>
                </div>
            </div>

            <Card className="p-6 border shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/40" />
                <form onSubmit={handleFundAccount} className="space-y-6 pt-4">

                    <div className="space-y-3">
                        <label className="text-sm font-medium tracking-wide uppercase text-muted-foreground flex justify-between">
                            <span>Destination Account</span>
                            {selectedAccountId && (
                                <span className="font-semibold text-primary">
                                    Bal: ₦{accounts.find(a => String(a.id) === selectedAccountId)?.balance?.toLocaleString() || '0'}
                                </span>
                            )}
                        </label>
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="flex h-12 w-full rounded-md border border-input bg-background px-4 py-2 text-base ring-offset-background md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            required
                        >
                            <option value="" disabled>Select an account to fund</option>
                            {accounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                    {acc.account_type} - {acc.account_number}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Amount (NGN)</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">₦</span>
                            <Input
                                type="number"
                                placeholder="0.00"
                                className="pl-10 h-14 text-xl font-bold rounded-xl"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                required
                                min="100"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <label className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            <div
                                onClick={() => setMethod('card')}
                                className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 cursor-pointer transition-all ${method === 'card' ? 'bg-primary/5 border-primary text-primary' : 'hover:bg-muted'}`}
                            >
                                <CreditCard size={20} />
                                <span className="text-xs font-semibold">Card</span>
                            </div>
                            <div
                                onClick={() => setMethod('transfer')}
                                className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 cursor-pointer transition-all ${method === 'transfer' ? 'bg-primary/5 border-primary text-primary' : 'hover:bg-muted'}`}
                            >
                                <Building size={20} />
                                <span className="text-xs font-semibold">Bank</span>
                            </div>
                            <div
                                onClick={() => setMethod('ussd')}
                                className={`flex flex-col items-center justify-center p-4 border rounded-xl gap-2 cursor-pointer transition-all ${method === 'ussd' ? 'bg-primary/5 border-primary text-primary' : 'hover:bg-muted'}`}
                            >
                                <Smartphone size={20} />
                                <span className="text-xs font-semibold">USSD</span>
                            </div>
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-14 text-base font-semibold gap-2 mt-4" disabled={isFunding}>
                        {isFunding && <Loader2 className="animate-spin h-5 w-5" />}
                        {isFunding ? 'Processing...' : 'Deposit Funds'}
                    </Button>
                </form>
            </Card>
        </div>
    );
}
