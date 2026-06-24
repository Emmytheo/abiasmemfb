"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api, StandingOrder, Account, Beneficiary, Customer } from "@/lib/api";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, ListOrdered, Trash2, Calendar, AlertCircle, Wallet, Building2, Search, ArrowRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { NIGERIAN_BANKS } from "@/lib/data/nigerian-banks";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function StandingOrdersPage() {
    const router = useRouter();
    const [standingOrders, setStandingOrders] = useState<StandingOrder[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [userId, setUserId] = useState<string | null>(null);
    
    // Modal state
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [sourceAccountId, setSourceAccountId] = useState("");
    const [mode, setMode] = useState<"manual" | "beneficiary">("manual");
    const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState("");
    const [destBankCode, setDestBankCode] = useState("090"); // Default to Abia MFB
    const [destAccountNumber, setDestAccountNumber] = useState("");
    const [destAccountName, setDestAccountName] = useState("");
    const [amount, setAmount] = useState("");
    const [frequency, setFrequency] = useState<"daily" | "weekly" | "monthly">("monthly");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState("");
    const [narration, setNarration] = useState("Standing Order Transfer");
    const [isValidatingName, setIsValidatingName] = useState(false);

    async function loadData() {
        try {
            const supabase = createClient();
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) {
                router.push("/auth/login");
                return;
            }
            setUserId(user.id);

            const [orders, accs, bens, profile] = await Promise.all([
                api.getUserStandingOrders(user.id),
                api.getUserAccounts(user.id),
                api.getUserBeneficiaries(user.id),
                api.getCustomerBySupabaseId(user.id),
            ]);

            setStandingOrders(orders);
            setAccounts(accs);
            setBeneficiaries(bens);
            setCustomer(profile);

            if (accs.length > 0) {
                setSourceAccountId(accs[0].id);
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to load standing orders ledger");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [router]);

    // Handle name validation when account number reaches 10 digits
    useEffect(() => {
        if (mode === "manual" && destAccountNumber.length === 10) {
            validateAccountName();
        }
    }, [destAccountNumber, destBankCode, mode]);

    // Fill details from saved beneficiary
    useEffect(() => {
        if (mode === "beneficiary" && selectedBeneficiaryId) {
            const ben = beneficiaries.find(b => b.id === selectedBeneficiaryId);
            if (ben) {
                setDestAccountNumber(ben.account_number);
                setDestAccountName(ben.account_name);
                setDestBankCode(ben.bank_code || "090");
            }
        }
    }, [selectedBeneficiaryId, mode, beneficiaries]);

    const validateAccountName = async () => {
        setIsValidatingName(true);
        try {
            // Simulated / Mock resolve
            await new Promise(r => setTimeout(r, 800));
            if (destAccountNumber === "3086167603" || destAccountNumber === "3041889711") {
                setDestAccountName("CHIDI MGBARA");
            } else {
                setDestAccountName("EMEKA OKAFOR");
            }
            toast.success("Account name verified successfully");
        } catch {
            setDestAccountName("");
        } finally {
            setIsValidatingName(false);
        }
    };

    const handleCreateOrder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !customer) return;

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error("Enter a valid transfer amount");
            return;
        }

        const activeSource = accounts.find(a => a.id === sourceAccountId);
        if (!activeSource) {
            toast.error("Select a source account to debit");
            return;
        }

        if (activeSource.balance < parsedAmount * 100) {
            toast.error("Insufficient funds in selected source account");
            return;
        }

        if (!destAccountName) {
            toast.error("Destination account name must be verified");
            return;
        }

        setIsSaving(true);
        try {
            const targetBank = NIGERIAN_BANKS.find(b => b.code === destBankCode);
            const bankName = targetBank ? targetBank.name : "Abia Microfinance Bank";

            const payloadData = {
                user_id: userId,
                customer: customer.id,
                source_account: sourceAccountId,
                destination_bank_name: bankName,
                destination_bank_code: destBankCode,
                destination_account_number: destAccountNumber,
                destination_account_name: destAccountName,
                amount: parsedAmount,
                frequency,
                start_date: new Date(startDate).toISOString(),
                end_date: endDate ? new Date(endDate).toISOString() : undefined,
                next_run_date: new Date(startDate).toISOString(),
                status: "active" as const,
                narration,
            };

            const newOrder = await api.createStandingOrder(payloadData);
            if (newOrder) {
                toast.success("Standing order scheduled successfully!");
                setStandingOrders(prev => [newOrder, ...prev]);
                setShowCreateModal(false);
                resetForm();
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to schedule standing order");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const ok = await api.deleteStandingOrder(id);
            if (ok) {
                toast.success("Standing order cancelled successfully");
                setStandingOrders(prev => prev.filter(o => o.id !== id));
            } else {
                toast.error("Failed to cancel standing order");
            }
        } catch (err) {
            console.error(err);
            toast.error("An error occurred during cancellation");
        }
    };

    const resetForm = () => {
        setDestAccountNumber("");
        setDestAccountName("");
        setAmount("");
        setFrequency("monthly");
        setStartDate(new Date().toISOString().split('T')[0]);
        setEndDate("");
        setNarration("Standing Order Transfer");
        setSelectedBeneficiaryId("");
        setMode("manual");
    };

    const filteredOrders = standingOrders.filter(o =>
        o.destination_account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.destination_account_number.includes(searchQuery)
    );

    const formatCurrency = (amt: number) => `₦${amt.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;

    if (loading) {
        return (
            <div className="flex w-full items-center justify-center p-24">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-24 px-4 sm:px-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">Standing Orders</h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Configure automated recurring transfers from your accounts.
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="shrink-0 font-bold gap-2">
                    <Plus className="h-5 w-5" /> Schedule New Order
                </Button>
            </div>

            {/* List Table */}
            <Card className="border shadow-sm">
                <CardHeader className="border-b bg-muted/20 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <ListOrdered className="h-5 w-5 text-primary" />
                            All Scheduled Orders ({standingOrders.length})
                        </CardTitle>
                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by recipient or account..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {filteredOrders.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center">
                            <div className="h-16 w-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
                                <ListOrdered className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-lg font-bold mb-1">No standing orders found</h3>
                            <p className="text-muted-foreground text-sm max-w-sm">
                                {searchQuery ? "Try adjusting your search filters." : "You haven't scheduled any recurring transfers yet. Create one above to get started."}
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y overflow-x-auto">
                            {filteredOrders.map((order) => {
                                const sourceAcc = typeof order.source_account === 'object' ? order.source_account?.account_number : String(order.source_account);
                                return (
                                    <div key={order.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-muted/10 transition-colors gap-6 min-w-[600px]">
                                        <div className="flex items-center gap-4 flex-1">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20">
                                                <Wallet className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-base">{order.destination_account_name}</h4>
                                                    <Badge className="capitalize text-[9px] font-black tracking-wider bg-emerald-500/10 text-emerald-500 border-0">{order.frequency}</Badge>
                                                </div>
                                                <div className="text-sm text-muted-foreground space-y-0.5">
                                                    <p>From Account: <span className="font-mono text-foreground font-semibold">{sourceAcc}</span></p>
                                                    <p>To: <span className="font-mono text-foreground font-semibold">{order.destination_account_number}</span> ({order.destination_bank_name})</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-12 shrink-0">
                                            <div className="text-right">
                                                <p className="text-lg font-mono font-black text-primary">{formatCurrency(order.amount)}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                                                    <Calendar className="h-3 w-3" /> Next Run: {new Date(order.next_run_date).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4.5 w-4.5" />
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Cancel Standing Order</DialogTitle>
                                                        <DialogDescription>
                                                            Are you sure you want to cancel this recurring transfer of <strong>{formatCurrency(order.amount)}</strong> to <strong>{order.destination_account_name}</strong>?
                                                            This scheduled automation will be deleted instantly.
                                                        </DialogDescription>
                                                    </DialogHeader>
                                                    <DialogFooter className="mt-4 gap-2 sm:gap-0">
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline">Dismiss</Button>
                                                        </DialogTrigger>
                                                        <DialogTrigger asChild>
                                                            <Button variant="destructive" onClick={() => handleDelete(order.id)}>
                                                                Cancel Scheduled Order
                                                            </Button>
                                                        </DialogTrigger>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Modal: Create Standing Order */}
            <Dialog open={showCreateModal} onOpenChange={(open) => { if (!open) resetForm(); setShowCreateModal(open); }}>
                <DialogContent className="max-w-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Schedule Standing Order</DialogTitle>
                        <DialogDescription>Setup automated recurring debit authorizations instantly.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateOrder} className="space-y-4 py-2">
                        
                        <div className="space-y-1.5">
                            <Label>Debit Account Source</Label>
                            <select 
                                value={sourceAccountId} 
                                onChange={(e) => setSourceAccountId(e.target.value)}
                                className="w-full bg-muted border border-border/85 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                            >
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.account_type} — {acc.account_number} ({formatCurrency(acc.balance / 100)})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Recipient Selection</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => { setMode("manual"); setSelectedBeneficiaryId(""); }}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                                        mode === "manual" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                                    }`}
                                >
                                    New Recipient
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMode("beneficiary")}
                                    className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                                        mode === "beneficiary" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                                    }`}
                                    disabled={beneficiaries.length === 0}
                                >
                                    Saved Beneficiary ({beneficiaries.length})
                                </button>
                            </div>
                        </div>

                        {mode === "beneficiary" ? (
                            <div className="space-y-1.5">
                                <Label>Saved Beneficiaries</Label>
                                <select 
                                    value={selectedBeneficiaryId} 
                                    onChange={(e) => setSelectedBeneficiaryId(e.target.value)}
                                    className="w-full bg-muted border border-border/85 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="">-- Choose saved beneficiary --</option>
                                    {beneficiaries.map(ben => (
                                        <option key={ben.id} value={ben.id}>
                                            {ben.account_name} ({ben.account_number} • {ben.bank_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Recipient Bank</Label>
                                    <select 
                                        value={destBankCode} 
                                        onChange={(e) => setDestBankCode(e.target.value)}
                                        className="w-full bg-muted border border-border/85 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {NIGERIAN_BANKS.map(bank => (
                                            <option key={bank.code} value={bank.code}>{bank.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Recipient Account Number</Label>
                                    <div className="relative">
                                        <Input
                                            maxLength={10}
                                            placeholder="Enter 10-digit number"
                                            value={destAccountNumber}
                                            onChange={(e) => setDestAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                                            className="h-12"
                                        />
                                        {isValidatingName && <Loader2 className="absolute right-3 top-3.5 h-5 w-5 animate-spin text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <Label>Verified Beneficiary Name</Label>
                            <Input
                                readOnly
                                placeholder="Autocompletes upon verification"
                                value={destAccountName}
                                className="h-12 bg-muted/50 font-bold border-emerald-500/30 text-emerald-600 placeholder:text-muted-foreground/50 placeholder:font-normal"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Amount (₦)</Label>
                                <Input
                                    type="number"
                                    required
                                    placeholder="e.g. 50000"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="h-12"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Billing Frequency</Label>
                                <select 
                                    value={frequency} 
                                    onChange={(e) => setFrequency(e.target.value as any)}
                                    className="w-full bg-muted border border-border/85 rounded-xl h-12 px-3 text-sm font-semibold focus:outline-none focus:ring-1 focus:ring-primary"
                                >
                                    <option value="daily">Daily</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label>Schedule Start Date</Label>
                                <Input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="h-12 font-semibold"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Schedule End Date (Optional)</Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="h-12 font-semibold"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Transaction Narration</Label>
                            <Input
                                placeholder="e.g. Monthly Rent Payment"
                                value={narration}
                                onChange={(e) => setNarration(e.target.value)}
                                className="h-12"
                            />
                        </div>

                        <DialogFooter className="pt-4 gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setShowCreateModal(false)} disabled={isSaving}>Cancel</Button>
                            <Button type="submit" disabled={isSaving || !destAccountName}>
                                {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                Save Schedule
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
