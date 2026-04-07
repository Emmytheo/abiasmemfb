"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link2, ShieldCheck, User as UserIcon, Building2, CheckCircle2, ChevronRight, ArrowLeftRight, CreditCard, AlertTriangle } from "lucide-react";
import { api, User, Customer, Account } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

interface IdentityLinkDialogProps {
    customerId: string;
    onLinked: () => void;
}

type Step = 'select' | 'reconcile-profile' | 'reconcile-financials' | 'confirm';

export function IdentityLinkDialog({ customerId, onLinked }: IdentityLinkDialogProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<Step>('select');
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Selection state
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [reconciliation, setReconciliation] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone_number: ''
    });

    // Financial reconciliation state
    const [qoreAccounts, setQoreAccounts] = useState<any[]>([]);
    const [existingAccounts, setExistingAccounts] = useState<Account[]>([]);
    const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
    const [loadingFinancials, setLoadingFinancials] = useState(false);
    
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (open) {
            reset();
            loadInitialData();
        }
    }, [open]);

    const reset = () => {
        setStep('select');
        setSelectedUser(null);
        setSelectedAccounts([]);
        setQoreAccounts([]);
    };

    async function loadInitialData() {
        setLoading(true);
        try {
            const [allUsers, currentCustomer, allAccounts] = await Promise.all([
                api.getAllUsers(),
                api.getCustomerById(customerId),
                api.getAllAccounts()
            ]);
            setUsers(allUsers);
            setCustomer(currentCustomer);
            // Filter accounts belonging to this customer already
            setExistingAccounts(allAccounts.filter(a => 
                typeof a.customer === 'object' ? a.customer?.id === customerId : a.customer === customerId
            ));
        } catch (e) {
            toast.error("Failed to load records for reconciliation");
        } finally {
            setLoading(false);
        }
    }

    const startReconciliation = async (user: User) => {
        setSelectedUser(user);
        setActionLoading(user.id);
        
        // Pre-fill reconciliation with banking data as priority
        setReconciliation({
            firstName: customer?.firstName || user.full_name?.split(' ')[0] || '',
            lastName: customer?.lastName || user.full_name?.split(' ').slice(1).join(' ') || '',
            email: user.email || customer?.email || '',
            phone_number: customer?.phone_number || ''
        });

        // Load financials
        setLoadingFinancials(true);
        setStep('reconcile-profile');
        setActionLoading(null);

        try {
            const accounts = await api.getQoreAccounts(customerId);
            setQoreAccounts(accounts);
            // Auto-select accounts that aren't in Payload yet
            const missing = accounts
                .map((q: any) => q.AccountNo)
                .filter((no: string) => !existingAccounts.some(e => e.account_number === no));
            setSelectedAccounts(missing);
        } catch (e) {
            console.error("Discovery failed", e);
        } finally {
            setLoadingFinancials(false);
        }
    };

    const handleMerge = async () => {
        if (!selectedUser || !customer) return;
        setLoading(true);
        try {
            await api.mergeCustomers({
                primaryCustomerId: customerId,
                supabaseUserId: selectedUser.id,
                profileData: reconciliation,
                selectedAccountNumbers: selectedAccounts
            });
            toast.success("Identity Harmonization Complete");
            onLinked();
            setOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Merge operations failed. Security protocols active.");
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step === 'reconcile-profile') setStep('reconcile-financials');
        else if (step === 'reconcile-financials') setStep('confirm');
    };

    const prevStep = () => {
        if (step === 'reconcile-profile') setStep('select');
        else if (step === 'reconcile-financials') setStep('reconcile-profile');
        else if (step === 'confirm') setStep('reconcile-financials');
    };

    const filtered = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.full_name?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 font-black border-primary/20 hover:bg-primary/5 transition-all text-primary uppercase text-[10px] tracking-widest shadow-none">
                    <Link2 className="h-3 w-3" /> Link Identity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background min-h-[500px] flex flex-col">
                    <DialogHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1">Identity Bridge</DialogTitle>
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                                        {step === 'select' && "1. Select Digital Identity"}
                                        {step === 'reconcile-profile' && "2. Profile Reconciliation"}
                                        {step === 'reconcile-financials' && "3. Financial Mirroring"}
                                        {step === 'confirm' && "4. Final Consolidation"}
                                    </p>
                                </div>
                            </div>
                            {step !== 'select' && (
                                <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 text-[10px] uppercase font-black tracking-tight">
                                    Back
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 p-8 pt-4 overflow-y-auto max-h-[500px]">
                        {/* STEP 1: SELECT USER */}
                        {step === 'select' && (
                            <div className="space-y-6">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search Supabase users..."
                                        className="pl-10 h-12 bg-background/50 border-primary/10 focus-visible:ring-primary/20 rounded-xl text-sm"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {loading ? (
                                        <div className="space-y-2">
                                            {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                        </div>
                                    ) : filtered.length === 0 ? (
                                        <div className="text-center py-12 bg-background/30 rounded-2xl border border-dashed">
                                            <p className="text-sm text-muted-foreground font-medium">No identities found.</p>
                                        </div>
                                    ) : filtered.map(user => (
                                        <div key={user.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/30 transition-all group shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-xs font-black">
                                                    {user.full_name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm tracking-tight">{user.full_name || 'Anonymous'}</p>
                                                    <p className="text-[10px] text-muted-foreground uppercase font-black">{user.email}</p>
                                                </div>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                onClick={() => startReconciliation(user)} 
                                                disabled={!!actionLoading}
                                                variant="secondary"
                                                className="rounded-lg h-8 px-4 font-black transition-all hover:bg-primary hover:text-white uppercase text-[10px] tracking-tighter"
                                            >
                                                {actionLoading === user.id ? 'Loading...' : 'Select'}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* STEP 2: PROFILE RECONCILIATION */}
                        {step === 'reconcile-profile' && selectedUser && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-4">
                                    <div className="flex items-center gap-2 mb-1">
                                        <ArrowLeftRight className="h-4 w-4 text-primary" />
                                        <p className="text-xs font-black uppercase tracking-tight text-primary">Data Conflict Resolution</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">
                                        Identify which fields to preserve. Any conflicting emails will trigger the Soft-Merge archival process for redundant records.
                                    </p>
                                </div>

                                <div className="grid gap-4">
                                    {[
                                        { label: 'First Name', key: 'firstName', qore: customer?.firstName, supa: selectedUser.full_name?.split(' ')[0] },
                                        { label: 'Last Name', key: 'lastName', qore: customer?.lastName, supa: selectedUser.full_name?.split(' ').slice(1).join(' ') },
                                        { label: 'Email Address', key: 'email', qore: customer?.email, supa: selectedUser.email },
                                        { label: 'Phone Number', key: 'phone_number', qore: customer?.phone_number, supa: 'N/A' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button 
                                                    onClick={() => setReconciliation(p => ({ ...p, [field.key]: field.qore || '' }))}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        reconciliation[field.key as keyof typeof reconciliation] === field.qore 
                                                            ? "bg-primary/10 border-primary shadow-sm" 
                                                            : "bg-background border-muted-foreground/10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[8px] font-black uppercase text-primary/60">Banking (Qore)</span>
                                                        {reconciliation[field.key as keyof typeof reconciliation] === field.qore && <CheckCircle2 className="h-3 w-3 text-primary" />}
                                                    </div>
                                                    <p className="text-sm font-bold truncate">{field.qore || 'Empty'}</p>
                                                </button>
                                                <button 
                                                    onClick={() => setReconciliation(p => ({ ...p, [field.key]: field.supa || '' }))}
                                                    className={cn(
                                                        "p-3 rounded-xl border text-left transition-all",
                                                        reconciliation[field.key as keyof typeof reconciliation] === field.supa 
                                                            ? "bg-accent/40 border-accent shadow-sm" 
                                                            : "bg-background border-muted-foreground/10 opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[8px] font-black uppercase text-accent-foreground/60">Digital (Supabase)</span>
                                                        {reconciliation[field.key as keyof typeof reconciliation] === field.supa && <CheckCircle2 className="h-3 w-3 text-accent-foreground" />}
                                                    </div>
                                                    <p className="text-sm font-bold truncate">{field.supa || 'Empty'}</p>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <Button onClick={nextStep} className="w-full h-12 rounded-xl font-black uppercase tracking-widest mt-4">
                                    Continue to Financials <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* STEP 3: FINANCIAL RECONCILIATION */}
                        {step === 'reconcile-financials' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-lg font-black tracking-tight">Product Mirroring</h3>
                                        <p className="text-xs text-muted-foreground font-medium">Select financial products to discover and sync from Core Banking.</p>
                                    </div>
                                    {loadingFinancials && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}
                                </div>

                                <div className="space-y-3">
                                    {qoreAccounts.length === 0 && !loadingFinancials ? (
                                        <div className="text-center py-12 bg-background/30 rounded-2xl border border-dashed">
                                            <p className="text-sm text-muted-foreground font-medium">No unlinked accounts discovered in Qore.</p>
                                        </div>
                                    ) : (
                                        qoreAccounts.map(qAcc => {
                                            const isLinked = existingAccounts.some(e => e.account_number === qAcc.AccountNo);
                                            const isSelected = selectedAccounts.includes(qAcc.AccountNo);

                                            return (
                                                <div 
                                                    key={qAcc.AccountNo}
                                                    onClick={() => !isLinked && setSelectedAccounts(prev => 
                                                        prev.includes(qAcc.AccountNo) ? prev.filter(a => a !== qAcc.AccountNo) : [...prev, qAcc.AccountNo]
                                                    )}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer",
                                                        isLinked ? "bg-muted/40 opacity-70 grayscale pointer-events-none" : 
                                                        isSelected ? "bg-primary/5 border-primary shadow-sm" : "bg-background border-muted-foreground/10"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center">
                                                            <CreditCard className="h-5 w-5 text-accent-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-sm tracking-tight">{qAcc.AccountNo}</p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-black uppercase text-muted-foreground">₦{parseFloat(qAcc.AvailableBalance || '0').toLocaleString()}</span>
                                                                {isLinked && <Badge className="text-[8px] h-4 bg-muted text-muted-foreground font-black px-1 rounded-sm">ALREADY LINKED</Badge>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {!isLinked && (
                                                        <div className={cn(
                                                            "h-5 w-5 rounded-full border flex items-center justify-center transition-all",
                                                            isSelected ? "bg-primary border-primary text-white" : "border-muted-foreground/30"
                                                        )}>
                                                            {isSelected && <CheckCircle2 className="h-3 w-3" />}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>

                                <Button onClick={nextStep} className="w-full h-12 rounded-xl font-black uppercase tracking-widest mt-4">
                                    Review Consolidation <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        )}

                        {/* STEP 4: CONFIRMATION */}
                        {step === 'confirm' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 text-center py-4">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <ShieldCheck className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black tracking-tighter uppercase">Ready to Harmonize</h3>
                                <div className="space-y-4 text-left bg-background border p-6 rounded-2xl shadow-sm">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold">Primary Profile</span>
                                        <span className="font-black text-primary">{reconciliation.email}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold">Supabase Link</span>
                                        <span className="font-black truncate max-w-[200px]">{selectedUser?.full_name}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground font-bold">Mirroring Products</span>
                                        <Badge className="font-black">{selectedAccounts.length} Accounts</Badge>
                                    </div>
                                    <div className="pt-4 mt-4 border-t border-dashed">
                                        <div className="flex items-center gap-2 text-amber-600 mb-2">
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-[10px] font-black uppercase">Soft-Merge Protocol active</span>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                            Redundant records detected with the same email/identity will be <strong>archived and namespaced</strong>.
                                            Financial records will be re-pointed to this primary profile. This action cannot be undone from the dashboard.
                                        </p>
                                    </div>
                                </div>

                                <Button 
                                    onClick={handleMerge} 
                                    disabled={loading}
                                    className="w-full h-14 rounded-xl font-black uppercase tracking-[0.2em] shadow-lg shadow-primary/20 mt-6"
                                >
                                    {loading ? 'Executing Harmonization...' : 'EXECUTE IDENTITY MERGE'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-accent/30 p-4 px-8 border-t flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-black transition-all">
                        <span className="opacity-50">Identity Reconciliation Engine</span>
                        <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20 px-2 h-5 font-black">COLLISION AWARE</Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
