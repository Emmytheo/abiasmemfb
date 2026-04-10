"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { refreshCustomerLedger } from "@/lib/api/adapters/payload/actions";
import { Customer, Account } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
    ArrowLeft, 
    User, 
    CreditCard, 
    ShieldCheck, 
    ShieldAlert, 
    History, 
    Lock, 
    Unlock, 
    Ban, 
    DollarSign,
    RefreshCw,
    Loader2,
    Database,
    Star,
    Archive,
    ArchiveRestore,
    Shield,
    Globe,
    Link2
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Pencil } from "lucide-react";
import { LienDialog } from "@/components/dashboard/LienDialog";
import { IdentityLinkDialog } from "@/components/dashboard/IdentityLinkDialog";

interface PageProps {
    params: Promise<{ id: string }>;
}

const customerSchema = z.object({
    firstName: z.string().min(2, "First name is too short"),
    lastName: z.string().min(2, "Last name is too short"),
    email: z.string().email("Invalid email address"),
    phone_number: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    kyc_status: z.enum(['pending', 'active', 'inactive', 'rejected']),
    risk_tier: z.enum(['low', 'medium', 'high']),
});

export default function AdminCustomerDetailPage({ params }: PageProps) {
    const { id } = use(params);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editData, setEditData] = useState<Partial<Customer>>({});
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [isLienOpen, setIsLienOpen] = useState(false);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [showArchived, setShowArchived] = useState(false);

    async function loadData() {
        setLoading(true);
        try {
            const cust = await api.getCustomerById(id);
            if (cust) {
                setCustomer(cust);
                // Bilateral Lookup: Fetch accounts/loans by both Customer ID and Digital UUID/Email
                const [allAccounts, allLoans] = await Promise.all([
                    api.getAllAccounts(),
                    api.getAllLoans()
                ]);

                const linkedAccounts = allAccounts.filter(acc => 
                    (typeof acc.customer === 'object' ? acc.customer?.id === id : acc.customer === id) ||
                    (acc.user_id === cust.email || acc.user_id === cust.supabase_id)
                );
                
                const linkedLoans = allLoans.filter(loan => 
                    (typeof loan.customer === 'object' ? loan.customer?.id === id : loan.customer === id) ||
                    (loan.user_id === cust.email || loan.user_id === cust.supabase_id)
                );

                setAccounts(linkedAccounts);
                setLoans(linkedLoans);
            }
        } catch (error) {
            toast.error("Failed to load customer details.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadData();
    }, [id]);

    const handleSync = async () => {
        if (!customer) return;
        setActionLoading('sync');
        toast.info(`Full ledger reconciliation for ${customer.firstName}...`, {
            description: "Fetching accounts from Qore and syncing transaction history."
        });
        try {
            const result = await refreshCustomerLedger(customer.id);
            
            if (result.success) {
                toast.success("Ledger unified successfully", {
                    description: "Balances refreshed and product metadata updated."
                });
                loadData();
            } else {
                toast.error("Sync failed", {
                    description: result.message
                });
            }
        } catch (err: any) {
            toast.error("Network error during sync");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!customer) return;

        // Perform Zod validation
        const validation = customerSchema.safeParse(editData);
        if (!validation.success) {
            const firstError = validation.error.issues[0]?.message;
            toast.error(firstError || "Invalid form data");
            return;
        }

        setActionLoading('update');
        try {
            const updated = await api.updateCustomer(customer.id, validation.data as any);
            if (updated) {
                setCustomer(updated);
                setIsEditOpen(false);
                toast.success("Profile synchronized with registry.");
            }
        } catch (error) {
            toast.error("Update failed. Please check registry connectivity.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleFreeze = async (account: Account) => {
        setActionLoading(`freeze-${account.id}`);
        try {
            const nextStatus = account.is_frozen ? false : true;
            await api.updateAccount(account.id, { is_frozen: nextStatus, status: nextStatus ? 'frozen' : 'active' });
            toast.success(`Account ${nextStatus ? 'frozen' : 'unfrozen'} successfully.`);
            loadData();
        } catch (error) {
            toast.error("Failed to update account status.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleTogglePND = async (account: Account) => {
        setActionLoading(`pnd-${account.id}`);
        try {
            const nextStatus = !account.pnd_enabled;
            await api.updateAccount(account.id, { pnd_enabled: nextStatus });
            toast.success(`PND ${nextStatus ? 'enabled' : 'disabled'} successfully.`);
            loadData();
        } catch (error) {
            toast.error("Failed to update PND status.");
        } finally {
            setActionLoading(null);
        }
    };

    const handleUpdateLien = async (amount: number) => {
        if (!selectedAccount) return;
        setActionLoading(`lien-${selectedAccount.id}`);
        try {
            await api.updateAccount(selectedAccount.id, { lien_amount: amount });
            toast.success("Lien amount updated successfully");
            loadData();
        } catch (e) {
            toast.error("Failed to update lien");
        } finally {
            setActionLoading(null);
            setIsLienOpen(false);
        }
    };

    const handleSetPrimary = async (accId: string) => {
        setActionLoading(`primary-${accId}`);
        try {
            await api.updateAccount(accId, { is_primary: true });
            toast.success("Primary account updated");
            loadData();
        } catch (e) {
            toast.error("Failed to set primary account");
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleArchive = async (acc: Account) => {
        const action = acc.is_archived ? 'restore' : 'archive';
        setActionLoading(`${action}-${acc.id}`);
        try {
            await api.updateAccount(acc.id, { is_archived: !acc.is_archived });
            toast.success(`Account ${action}d successfully`);
            loadData();
        } catch (e) {
            toast.error(`Failed to ${action} account`);
        } finally {
            setActionLoading(null);
        }
    };

    const openEdit = () => {
        if (!customer) return;
        setEditData({
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone_number: customer.phone_number,
            address: customer.address,
            kyc_status: customer.kyc_status,
            risk_tier: customer.risk_tier,
        });
        setIsEditOpen(true);
    };

    if (loading) return <div className="p-8">Loading profile...</div>;
    if (!customer) return <div className="p-8">Customer not found.</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-8">
            {/* Header - Stacked on Mobile */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                        <Link href="/customers"><ArrowLeft className="h-5 w-5" /></Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center flex-wrap gap-3">
                            {customer.firstName} {customer.lastName}
                            {customer.is_test_account && <Badge variant="secondary" className="bg-purple-100 text-purple-700 font-bold px-2 py-0">TEST</Badge>}
                        </h1>
                        <p className="text-sm md:text-base text-muted-foreground flex items-center gap-2 mt-1">
                            {customer.email} • {customer.phone_number}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleSync} disabled={actionLoading === 'sync'} className="flex-1 md:flex-none">
                        <RefreshCw className={`h-4 w-4 mr-2 ${actionLoading === 'sync' ? 'animate-spin' : ''}`} />
                        Sync from Core
                    </Button>
                    <Button variant="outline" onClick={openEdit} className="flex-1 md:flex-none">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Profile
                    </Button>
                    <Button 
                        variant={customer.is_associated ? "secondary" : "outline"}
                        onClick={() => setIsLinkDialogOpen(true)}
                        className="w-full md:w-auto md:flex-none gap-2"
                    >
                        {customer.is_associated ? (
                            <><ShieldCheck className="h-4 w-4" /> Manage Identity</>
                        ) : (
                            <><Link2 className="h-4 w-4" /> Link Identity</>
                        )}
                    </Button>

                    <IdentityLinkDialog 
                        customerId={customer.id} 
                        isOpen={isLinkDialogOpen}
                        onClose={() => setIsLinkDialogOpen(false)}
                        onSuccess={loadData}
                        isLinked={customer.is_associated} 
                    />

                    <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                        <DialogContent className="w-[95vw] max-w-[500px] p-4 md:p-8 rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Edit Customer Profile</DialogTitle>
                                <DialogDescription>
                                    Update the core registry details for this customer.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleUpdate} className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="firstName">First Name</Label>
                                        <Input 
                                            id="firstName" 
                                            value={editData.firstName || ""} 
                                            onChange={e => setEditData({...editData, firstName: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="lastName">Last Name</Label>
                                        <Input 
                                            id="lastName" 
                                            value={editData.lastName || ""} 
                                            onChange={e => setEditData({...editData, lastName: e.target.value})}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input 
                                            id="email" 
                                            type="email"
                                            value={editData.email || ""} 
                                            onChange={e => setEditData({...editData, email: e.target.value})}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input 
                                            id="phone" 
                                            value={editData.phone_number || ""} 
                                            onChange={e => setEditData({...editData, phone_number: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Residential Address</Label>
                                    <Textarea 
                                        id="address" 
                                        value={editData.address || ""} 
                                        onChange={e => setEditData({...editData, address: e.target.value})}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>KYC Status</Label>
                                        <Select 
                                            value={editData.kyc_status} 
                                            onValueChange={v => setEditData({...editData, kyc_status: v as any})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="active">Active</SelectItem>
                                                <SelectItem value="pending">Pending</SelectItem>
                                                <SelectItem value="rejected">Rejected</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Risk Tier</Label>
                                        <Select 
                                            value={editData.risk_tier} 
                                            onValueChange={v => setEditData({...editData, risk_tier: v as any})}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select tier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low Risk</SelectItem>
                                                <SelectItem value="medium">Medium Risk</SelectItem>
                                                <SelectItem value="high">High Risk</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter className="pt-4">
                                    <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>Cancel</Button>
                                    <Button type="submit" disabled={actionLoading === 'update'}>
                                        {actionLoading === 'update' ? 'Saving...' : 'Update Profile'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview (Left) */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="rounded-2xl shadow-sm border-primary/10">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                Profile Details
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <span className="text-muted-foreground">KYC Status</span>
                                <Badge variant={customer.kyc_status === 'active' ? 'default' : 'secondary'} className="w-fit capitalize">
                                    {customer.kyc_status}
                                </Badge>
                                
                                <span className="text-muted-foreground">BVN</span>
                                <span className="font-mono">{customer.bvn || 'Not Provided'}</span>
                                
                                <span className="text-muted-foreground">Qore ID</span>
                                <span className="font-mono text-xs">{customer.qore_customer_id}</span>
                                
                                <span className="text-muted-foreground">Risk Tier</span>
                                <span className="capitalize font-medium">{customer.risk_tier}</span>

                                <span className="text-muted-foreground">Supabase Link</span>
                                <span className="truncate text-xs text-primary">{customer.supabase_id ? 'Linked ✅' : 'None (Shadow)'}</span>
                            </div>

                            {customer.address && (
                                <div className="pt-4 border-t">
                                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-2">Primary Address</p>
                                    <p className="text-sm leading-relaxed">{customer.address}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl bg-muted/30 border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Risk & Compliance</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* KYC Status — driven by real customer.kyc_status */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {customer.kyc_status === 'active' ? (
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span>KYC Status</span>
                                </div>
                                <span className={`text-xs font-bold uppercase ${
                                    customer.kyc_status === 'active' ? 'text-emerald-500' :
                                    customer.kyc_status === 'pending' ? 'text-yellow-500' :
                                    'text-destructive'
                                }`}>
                                    {customer.kyc_status}
                                </span>
                            </div>

                            {/* BVN Verification — present = verified, absent = unverified */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {customer.bvn ? (
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <ShieldAlert className="h-4 w-4 text-yellow-500" />
                                    )}
                                    <span>BVN Verification</span>
                                </div>
                                <span className={`text-xs font-bold ${customer.bvn ? 'text-emerald-500' : 'text-yellow-500'}`}>
                                    {customer.bvn ? 'VERIFIED' : 'PENDING'}
                                </span>
                            </div>

                            {/* Supabase Digital Link */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    {customer.supabase_id ? (
                                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <ShieldAlert className="h-4 w-4 text-muted-foreground" />
                                    )}
                                    <span>Digital Identity</span>
                                </div>
                                <span className={`text-xs font-bold ${customer.supabase_id ? 'text-emerald-500' : 'text-muted-foreground'}`}>
                                    {customer.supabase_id ? 'LINKED' : 'NOT LINKED'}
                                </span>
                            </div>

                            {/* Risk Tier */}
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <ShieldAlert className={`h-4 w-4 ${
                                        customer.risk_tier === 'low' ? 'text-emerald-500' :
                                        customer.risk_tier === 'medium' ? 'text-yellow-500' :
                                        'text-destructive'
                                    }`} />
                                    <span>Risk Tier</span>
                                </div>
                                <span className={`text-xs font-bold uppercase ${
                                    customer.risk_tier === 'low' ? 'text-emerald-500' :
                                    customer.risk_tier === 'medium' ? 'text-yellow-500' :
                                    'text-destructive'
                                }`}>
                                    {customer.risk_tier}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Accounts & Activity (Right) */}
                <div className="lg:col-span-2 space-y-8">
                    <Tabs defaultValue="accounts" className="w-full">
                        <TabsList className="bg-muted/50 !h-full p-2 rounded-xl mb-6 flex-wrap h-auto">
                            <TabsTrigger value="accounts" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <CreditCard className="h-4 w-4" /> Banking Accounts
                            </TabsTrigger>
                            <TabsTrigger value="loans" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <DollarSign className="h-4 w-4" /> Credit Products
                            </TabsTrigger>
                            <TabsTrigger value="activity" className="flex items-center gap-2 rounded-lg py-2 px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <History className="h-4 w-4" /> Audit Activity
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="accounts" className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-xs text-muted-foreground font-medium">Viewing {showArchived ? 'Archived' : 'Active'} Ledger Accounts</p>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => setShowArchived(!showArchived)}
                                    className="text-[10px] uppercase tracking-widest font-black text-primary hover:bg-primary/5"
                                >
                                    {showArchived ? 'Show Active' : 'View Archived'}
                                </Button>
                            </div>
                            {accounts.filter(acc => !!acc.is_archived === showArchived).length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground italic text-sm">
                                    No {showArchived ? 'archived' : 'active'} accounts found.
                                </div>
                            ) : (
                                accounts.filter(acc => !!acc.is_archived === showArchived).map((acc) => (
                                    <Card key={acc.id} className={`rounded-2xl border-primary/5 hover:border-primary/20 transition-all overflow-hidden group ${acc.is_archived ? 'opacity-70 grayscale-[0.5]' : ''}`}>
                                        <div className="p-4 sm:p-6">
                                            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
                                                <div className="space-y-2 min-w-0 flex-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className="text-lg sm:text-xl font-bold uppercase tracking-tight truncate">{acc.account_type} Account</h3>
                                                        <div className="flex gap-2">
                                                            {acc.is_primary && (
                                                                <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-none gap-1 px-2 whitespace-nowrap">
                                                                    <Star className="h-3 w-3 fill-current" /> Primary
                                                                </Badge>
                                                            )}
                                                            <Badge variant="outline" className={`gap-1 px-2 whitespace-nowrap ${acc.source === 'qore' ? 'border-primary/20 text-primary' : 'border-purple-500/20 text-purple-600'}`}>
                                                                {acc.source === 'qore' ? <Globe className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
                                                                {acc.source === 'qore' ? 'Qore' : 'Local'}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <p className="text-xs sm:text-sm font-mono text-primary mt-1 tracking-[0.2em] font-bold break-all">{acc.account_number}</p>
                                                </div>
                                                <div className="text-left sm:text-right w-full sm:w-auto shrink-0 border-t sm:border-t-0 pt-4 sm:pt-0">
                                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Available Balance</p>
                                                    <p className="text-xl sm:text-2xl font-black truncate">₦{acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t mb-4">
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Status</p>
                                                    <Badge variant={acc.status === 'active' ? 'default' : 'destructive'} className="capitalize">{acc.status}</Badge>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Post-No-Debit</p>
                                                    <span className={`text-sm font-bold ${acc.pnd_enabled ? 'text-destructive' : 'text-emerald-500'}`}>
                                                        {acc.pnd_enabled ? 'Enabled 🚫' : 'Disabled ✅'}
                                                    </span>
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Lien Amount</p>
                                                    <span className="text-sm font-bold">₦{(acc.lien_amount || 0).toLocaleString()}</span>
                                                </div>
                                                <div className="space-y-1 text-right md:text-left">
                                                    <p className="text-[10px] uppercase text-muted-foreground font-bold">Source Sync</p>
                                                    <span className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-end md:justify-start gap-1">
                                                        <Database className="h-3 w-3" />
                                                        {acc.source === 'qore' ? 'Synchronized' : 'Standalone'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 pt-2 flex-wrap">
                                                {!acc.is_archived && (
                                                    <>
                                                        <Button 
                                                            size="sm" 
                                                            variant={acc.is_frozen ? "outline" : "destructive"} 
                                                            className="gap-2 text-xs h-9"
                                                            onClick={() => handleToggleFreeze(acc)}
                                                            disabled={!!actionLoading}
                                                        >
                                                            {actionLoading === `freeze-${acc.id}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : acc.is_frozen ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                                            {acc.is_frozen ? 'Unfreeze' : 'Freeze'}
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="outline" 
                                                            className="gap-2 text-xs h-9"
                                                            onClick={() => handleTogglePND(acc)}
                                                            disabled={!!actionLoading}
                                                        >
                                                            <Ban className={`h-3.5 w-3.5 ${actionLoading === `pnd-${acc.id}` ? 'animate-spin' : ''}`} /> PND
                                                        </Button>
                                                        {!acc.is_primary && (
                                                            <Button 
                                                                size="sm" 
                                                                variant="outline" 
                                                                className="gap-2 text-xs h-9 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                                                onClick={() => handleSetPrimary(acc.id)}
                                                                disabled={!!actionLoading}
                                                            >
                                                                <Star className="h-3.5 w-3.5" /> Make Primary
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                                
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="gap-2 text-xs h-9 ml-auto"
                                                    onClick={() => handleToggleArchive(acc)}
                                                    disabled={!!actionLoading}
                                                >
                                                    {acc.is_archived ? <ArchiveRestore className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
                                                    {acc.is_archived ? 'Restore' : 'Archive'}
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}

                            {selectedAccount && (
                                <LienDialog 
                                    open={isLienOpen}
                                    onOpenChange={setIsLienOpen}
                                    account={selectedAccount}
                                    onConfirm={handleUpdateLien}
                                />
                            )}
                        </TabsContent>

                        <TabsContent value="loans" className="space-y-4">
                            {loans.length === 0 ? (
                                <div className="text-center py-12 border-2 border-dashed rounded-2xl text-muted-foreground bg-muted/10">
                                    <p className="font-medium">No active loan products found.</p>
                                    <p className="text-xs">Digital ledger credit history is clear.</p>
                                </div>
                            ) : (
                                loans.map((loan) => (
                                    <Card key={loan.id} className="rounded-2xl border-primary/5 p-6 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-0.5">{loan.status}</Badge>
                                                <h4 className="font-bold text-lg">Personal Credit Line</h4>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Principal</p>
                                                <p className="text-xl font-black">₦{loan.amount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t">
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Interest Rate</p>
                                                <p className="text-sm font-bold">{loan.interest_rate}% Annually</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Outstanding</p>
                                                <p className="text-sm font-bold text-destructive">₦{loan.outstanding_balance?.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold">Duration</p>
                                                <p className="text-sm font-bold">{loan.duration_months} Months</p>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </TabsContent>

                        <TabsContent value="activity">
                            <Card className="rounded-2xl border-primary/5 p-6 md:p-10">
                                <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
                                    <History className="h-5 w-5 text-primary" />
                                    Chronological Audit Log
                                </h3>
                                <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted before:to-transparent">
                                    {/* Timeline Item 1 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-primary/20 bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-primary">
                                            <RefreshCw className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">Identity Recovery Sync</div>
                                                <time className="font-mono text-[10px] text-primary">JUST NOW</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Manual identity bridge executed for digital-only profile reconstruction (System Audit).</div>
                                        </div>
                                    </div>

                                    {/* Timeline Item 2 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-muted bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-emerald-500">
                                            <ShieldCheck className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">KYC Activated</div>
                                                <time className="font-mono text-[10px] text-muted-foreground mr-1">3 HOURS AGO</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Digital-first KYC profile successfully verified and promoted to active status.</div>
                                        </div>
                                    </div>

                                    {/* Timeline Item 3 */}
                                    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-muted bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 text-muted-foreground">
                                            <User className="h-4 w-4" />
                                        </div>
                                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-primary/5 bg-muted/5 group-hover:bg-muted/10 transition-colors">
                                            <div className="flex items-center justify-between space-x-2 mb-1">
                                                <div className="font-bold text-sm">Registration</div>
                                                <time className="font-mono text-[10px] text-muted-foreground">2026-03-24</time>
                                            </div>
                                            <div className="text-xs text-muted-foreground">Supabase digital identity created via mobile application channel.</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-8 pt-6 border-t text-center">
                                    <Button variant="ghost" size="sm" className="text-xs text-primary font-bold">
                                        Load Extended History
                                    </Button>
                                </div>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
