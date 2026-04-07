"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link2, ShieldCheck, ArrowLeftRight, CreditCard, AlertTriangle, Trash2, User as UserIcon, Building2, CheckCircle2, ChevronRight } from "lucide-react";
import { api, User, Customer, Account } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card } from "../ui/card";

interface IdentityLinkDialogProps {
    customerId: string | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isLinked?: boolean;
}

type Step = 'select' | 'reconcile-profile' | 'reconcile-financials' | 'confirm' | 'manage';
type SearchMode = 'supabase' | 'banking';

export function IdentityLinkDialog({ customerId, isOpen, onClose, onSuccess, isLinked }: IdentityLinkDialogProps) {
    const [step, setStep] = useState<Step>(isLinked ? 'manage' : 'select');
    const [searchMode, setSearchMode] = useState<SearchMode>('supabase');
    const [search, setSearch] = useState("");
    
    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [currentCustomer, setCurrentCustomer] = useState<Customer | null>(null);
    const [loading, setLoading] = useState(false);
    
    // Selection state
    const [selectedTarget, setSelectedTarget] = useState<User | Customer | null>(null);
    const [keepTargetAsPrimary, setKeepTargetAsPrimary] = useState(false);
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
    const [confirmUnlink, setConfirmUnlink] = useState(false);

    useEffect(() => {
        if (isOpen && customerId) {
            reset();
            loadInitialData();
        }
    }, [isOpen, customerId]);

    const reset = () => {
        setStep(isLinked ? 'manage' : 'select');
        setSearchMode('supabase');
        setSelectedTarget(null);
        setSelectedAccounts([]);
        setQoreAccounts([]);
        setConfirmUnlink(false);
        setKeepTargetAsPrimary(false);
    };

    async function loadInitialData() {
        if (!customerId) return;
        setLoading(true);
        try {
            const [allUsers, allCustomers, customer, allAccounts] = await Promise.all([
                api.getAllUsers(),
                api.getAllCustomers(),
                api.getCustomerById(customerId),
                api.getAllAccounts()
            ]);
            setUsers(allUsers);
            setCustomers(allCustomers.filter(c => c.id !== customerId));
            setCurrentCustomer(customer);
            
            if (customer?.is_associated && !isLinked) {
                setStep('manage');
            }

            setExistingAccounts(allAccounts.filter(a => 
                typeof a.customer === 'object' ? a.customer?.id === customerId : a.customer === customerId
            ));
        } catch (e) {
            toast.error("Failed to load records for reconciliation");
        } finally {
            setLoading(false);
        }
    }

    const startReconciliation = async (target: User | Customer) => {
        if (!customerId) return;
        setSelectedTarget(target);
        setActionLoading(target.id);
        
        const isCustomer = 'qore_customer_id' in target;
        const targetName = isCustomer ? `${(target as Customer).firstName} ${(target as Customer).lastName}` : (target as User).full_name;
        const targetEmail = target.email;

        setReconciliation({
            firstName: currentCustomer?.firstName || targetName?.split(' ')[0] || '',
            lastName: currentCustomer?.lastName || targetName?.split(' ').slice(1).join(' ') || '',
            email: currentCustomer?.email || targetEmail || '',
            phone_number: currentCustomer?.phone_number || (isCustomer ? (target as Customer).phone_number : '') || ''
        });

        setLoadingFinancials(true);
        setStep('reconcile-profile');
        setActionLoading(null);

        try {
            // Discovery: Fetch accounts for BOTH records if they are customers
            const accounts = await api.getQoreAccounts(customerId);
            let targetAccounts: any[] = [];
            if (isCustomer) {
                targetAccounts = await api.getQoreAccounts(target.id);
            }
            
            const combined = [...accounts, ...targetAccounts].filter((v, i, a) => a.findIndex(t => t.AccountNo === v.AccountNo) === i);
            setQoreAccounts(combined);
            
            const missing = combined
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
        if (!selectedTarget || !currentCustomer || !customerId) return;
        setLoading(true);
        try {
            const isCustomerToCustomer = 'qore_customer_id' in selectedTarget;
            const success = await api.mergeCustomers({
                primaryCustomerId: customerId,
                supabaseUserId: selectedTarget.id,
                profileData: reconciliation,
                selectedAccountNumbers: selectedAccounts,
                isCustomerToCustomer,
                keepTargetAsPrimary
            } as any);
            
            if (success) {
                toast.success("Identity reconciled successfully");
                onSuccess();
                onClose();
            } else {
                throw new Error("Merge operations failed.");
            }
        } catch (e: any) {
            toast.error(e.message || "Merge operations failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async () => {
        if (!customerId) return;
        setLoading(true);
        try {
            await api.unlinkCustomer(customerId);
            toast.success("Identity Bridge Severed");
            onSuccess();
            reset();
            onClose();
        } catch (e: any) {
            toast.error("Failed to decouple identity.");
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

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.full_name?.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredCustomers = customers.filter(c => 
        c.email.toLowerCase().includes(search.toLowerCase()) || 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.qore_customer_id?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background min-h-[550px] flex flex-col">
                    <DialogHeader className="p-8 pb-0">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/20 rounded-xl">
                                    <ShieldCheck className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight leading-none mb-1">Identity Bridge</DialogTitle>
                                    <p className="text-muted-foreground text-[10px] uppercase tracking-widest font-bold">
                                        {step === 'select' && "1. Bi-directional Discovery"}
                                        {step === 'reconcile-profile' && "2. Profile Reconciliation"}
                                        {step === 'reconcile-financials' && "3. Financial Mirroring"}
                                        {step === 'confirm' && "4. Hardware Merge & Primary Selection"}
                                        {step === 'manage' && "Active Identity Connection"}
                                    </p>
                                </div>
                            </div>
                            {step !== 'select' && step !== 'manage' && (
                                <Button variant="ghost" size="sm" onClick={prevStep} className="h-8 text-[10px] uppercase font-black tracking-tight">
                                    Back
                                </Button>
                            )}
                        </div>
                    </DialogHeader>

                    <div className="flex-1 p-8 pt-4 overflow-y-auto max-h-[550px]">
                        {/* MANAGE STEP */}
                        {step === 'manage' && (
                            <div className="space-y-6 animate-in fade-in zoom-in-95">
                                <div className="bg-primary/5 border border-primary/20 p-6 rounded-2xl flex flex-col items-center text-center">
                                    <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                                        <ShieldCheck className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-black tracking-tight uppercase mb-1">Connection Active</h3>
                                    <p className="text-xs text-muted-foreground font-medium mb-4">This record is bridged correctly.</p>
                                    
                                    <div className="w-full space-y-2 text-left bg-background p-4 rounded-xl border border-primary/10 mb-6">
                                        <div className="flex justify-between items-center text-[10px] font-black uppercase text-muted-foreground border-b pb-2 mb-2">
                                            <span>Bridge Data</span>
                                            <span>Identity Handle</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold">{currentCustomer?.email}</span>
                                            <Badge className="font-black text-[10px] bg-muted text-muted-foreground rounded uppercase tracking-tighter max-w-[150px] truncate">{currentCustomer?.supabase_id || currentCustomer?.qore_customer_id}</Badge>
                                        </div>
                                    </div>

                                    {!confirmUnlink ? (
                                        <Button variant="destructive" className="w-full h-12 rounded-xl font-black uppercase tracking-widest gap-2" onClick={() => setConfirmUnlink(true)}>
                                            <Trash2 className="h-4 w-4" /> Sever Identity Bridge
                                        </Button>
                                    ) : (
                                        <div className="w-full space-y-3 animate-in slide-in-from-top-2">
                                            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-xl mb-1 text-left">
                                                <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
                                                <p className="text-[10px] font-bold text-destructive uppercase tracking-tight">Confirm: This removes the link without deleting data records.</p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="outline" className="rounded-xl h-12 font-black" onClick={() => setConfirmUnlink(false)}>Cancel</Button>
                                                <Button variant="destructive" className="rounded-xl h-12 font-black" onClick={handleUnlink} disabled={loading}>
                                                    {loading ? 'Severing...' : 'Sever Bridge'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STEP 1: BI-DIRECTIONAL SEARCH */}
                        {step === 'select' && (
                            <div className="space-y-6">
                                <Tabs value={searchMode} onValueChange={(v) => setSearchMode(v as SearchMode)} className="w-full">
                                    <TabsList className="grid grid-cols-2 h-12 bg-muted/50 p-1 rounded-xl mb-6">
                                        <TabsTrigger value="supabase" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background">
                                            <UserIcon className="h-3 w-3 mr-2" /> Digital Identity
                                        </TabsTrigger>
                                        <TabsTrigger value="banking" className="rounded-lg font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-background">
                                            <Building2 className="h-3 w-3 mr-2" /> Banking Record
                                        </TabsTrigger>
                                    </TabsList>
                                    
                                    <div className="relative mb-6">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder={searchMode === 'supabase' ? "Search digital identities..." : "Search banking records (Name, ID)..."}
                                            className="pl-10 h-12 bg-background/50 border-primary/10 rounded-xl text-sm"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        {loading ? (
                                            <div className="space-y-2">
                                                {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                                            </div>
                                        ) : searchMode === 'supabase' ? (
                                            filteredUsers.length === 0 ? <p className="text-center py-8 text-xs text-muted-foreground italic font-medium">No digital identities matched.</p> :
                                            filteredUsers.map(user => (
                                                <div key={user.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">{user.email.charAt(0).toUpperCase()}</div>
                                                        <div>
                                                            <p className="font-bold text-sm tracking-tight">{user.full_name || 'Anonymous'}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">{user.email}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => startReconciliation(user)} variant="secondary" className="rounded-lg h-8 px-4 font-black uppercase text-[10px]">Select</Button>
                                                </div>
                                            ))
                                        ) : (
                                            filteredCustomers.length === 0 ? <p className="text-center py-8 text-xs text-muted-foreground italic font-medium">No banking records matched.</p> :
                                            filteredCustomers.map(cust => (
                                                <div key={cust.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/30 transition-all shadow-sm">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-black text-secondary-foreground"><Building2 className="h-4 w-4" /></div>
                                                        <div>
                                                            <p className="font-bold text-sm tracking-tight">{cust.firstName} {cust.lastName}</p>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black italic">{cust.qore_customer_id}</p>
                                                        </div>
                                                    </div>
                                                    <Button size="sm" onClick={() => startReconciliation(cust)} variant="secondary" className="rounded-lg h-8 px-4 font-black uppercase text-[10px]">Merge</Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Tabs>
                            </div>
                        )}

                        {/* STEP 2: PROFILE RECONCILIATION */}
                        {step === 'reconcile-profile' && selectedTarget && (
                            <div className="space-y-6">
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                    <div className="flex items-center gap-2 mb-1 text-primary">
                                        <ArrowLeftRight className="h-4 w-4" />
                                        <p className="text-xs font-black uppercase tracking-tight">Data Harmonizer</p>
                                    </div>
                                    <p className="text-[11px] text-muted-foreground font-medium leading-relaxed">Pick values to survive the merge. All conflicting IDs will trigger Soft-Merge protocol.</p>
                                </div>

                                <div className="grid gap-3">
                                    {[
                                        { label: 'First Name', key: 'firstName', cur: currentCustomer?.firstName, tgt: 'full_name' in selectedTarget ? (selectedTarget as User).full_name?.split(' ')[0] : (selectedTarget as Customer).firstName },
                                        { label: 'Last Name', key: 'lastName', cur: currentCustomer?.lastName, tgt: 'full_name' in selectedTarget ? (selectedTarget as User).full_name?.split(' ').slice(1).join(' ') : (selectedTarget as Customer).lastName },
                                        { label: 'Email Address', key: 'email', cur: currentCustomer?.email, tgt: selectedTarget.email },
                                        { label: 'Phone Number', key: 'phone_number', cur: currentCustomer?.phone_number, tgt: 'qore_customer_id' in selectedTarget ? (selectedTarget as Customer).phone_number : '' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-1.5">
                                            <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">{field.label}</label>
                                            <div className="grid grid-cols-2 gap-2">
                                                <button onClick={() => setReconciliation(p => ({ ...p, [field.key]: field.cur || '' }))} className={cn("p-2.5 rounded-xl border text-left transition-all", reconciliation[field.key as keyof typeof reconciliation] === field.cur ? "bg-primary/10 border-primary shadow-sm" : "bg-background border-muted-foreground/10 opacity-60")}>
                                                    <div className="flex items-center justify-between mb-0.5"><span className="text-[7px] font-black uppercase text-primary/60">Currently Viewed</span>{reconciliation[field.key as keyof typeof reconciliation] === field.cur && <CheckCircle2 className="h-3 w-3 text-primary" />}</div>
                                                    <p className="text-xs font-bold truncate">{field.cur || 'Empty'}</p>
                                                </button>
                                                <button onClick={() => setReconciliation(p => ({ ...p, [field.key]: field.tgt || '' }))} className={cn("p-2.5 rounded-xl border text-left transition-all", reconciliation[field.key as keyof typeof reconciliation] === field.tgt ? "bg-secondary/20 border-secondary shadow-sm" : "bg-background border-muted-foreground/10 opacity-60")}>
                                                    <div className="flex items-center justify-between mb-0.5"><span className="text-[7px] font-black uppercase text-secondary-foreground/60">Selected Record</span>{reconciliation[field.key as keyof typeof reconciliation] === field.tgt && <CheckCircle2 className="h-3 w-3 text-secondary-foreground" />}</div>
                                                    <p className="text-xs font-bold truncate">{field.tgt || 'Empty'}</p>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={nextStep} className="w-full h-12 rounded-xl font-black uppercase mt-2">Harmonize & Discover Financials <ChevronRight className="ml-2 h-4 w-4" /></Button>
                            </div>
                        )}

                        {/* STEP 3 & 4 */}
                        {step === 'reconcile-financials' && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between"><h3 className="text-lg font-black tracking-tight">Product Mirroring</h3>{loadingFinancials && <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />}</div>
                                <div className="space-y-2">
                                    {qoreAccounts.map(qAcc => (
                                        <div key={qAcc.AccountNo} onClick={() => setSelectedAccounts(prev => prev.includes(qAcc.AccountNo) ? prev.filter(a => a !== qAcc.AccountNo) : [...prev, qAcc.AccountNo])} className={cn("flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer", selectedAccounts.includes(qAcc.AccountNo) ? "bg-primary/5 border-primary" : "bg-background border-muted-foreground/10")}>
                                            <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center text-accent-foreground"><CreditCard className="h-5 w-5" /></div><div><p className="font-bold text-sm">{qAcc.AccountNo}</p><p className="text-[10px] uppercase font-black text-muted-foreground">₦{parseFloat(qAcc.AvailableBalance).toLocaleString()}</p></div></div>
                                            {selectedAccounts.includes(qAcc.AccountNo) && <CheckCircle2 className="h-4 w-4 text-primary" />}
                                        </div>
                                    ))}
                                </div>
                                <Button onClick={nextStep} className="w-full h-12 rounded-xl font-black uppercase mt-4">Review Consolidation</Button>
                            </div>
                        )}

                        {step === 'confirm' && (
                            <div className="space-y-6 text-center py-4">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"><ShieldCheck className="h-10 w-10 text-primary" /></div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Identity Harmonization</h3>
                                
                                <Card className="p-6 text-left space-y-4 rounded-2xl bg-background border-primary/10 shadow-sm">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Primary Survival Strategy</Label>
                                            <Badge variant="outline" className="text-[8px] h-5 font-black uppercase">Configurable</Badge>
                                        </div>
                                        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border">
                                            <div className="space-y-1">
                                                <p className="text-xs font-black uppercase">Retain Current Record ID</p>
                                                <p className="text-[9px] text-muted-foreground leading-none">The selected target record will be archived as redundant.</p>
                                            </div>
                                            <Switch checked={keepTargetAsPrimary} onCheckedChange={setKeepTargetAsPrimary} />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-dashed space-y-1.5 text-[10px] text-muted-foreground font-medium leading-relaxed">
                                        <p>• <strong>{reconciliation.email}</strong> will become the primary identity handle.</p>
                                        <p>• <strong>{selectedAccounts.length}</strong> financial products will be mirrored/re-pointed.</p>
                                        <p>• Secondary records will be renamed for audit (Collision-Safe).</p>
                                    </div>
                                </Card>

                                <Button onClick={handleMerge} disabled={loading} className="w-full h-14 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 mt-4">
                                    {loading ? 'Executing Protocol...' : 'EXECUTE UNIVERSAL MERGE'}
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="bg-accent/30 p-4 px-8 border-t flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-black">
                        <span className="opacity-50">Universal Identity Bridge V3</span>
                        <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20 h-5 font-black">BI-DIRECTIONAL</Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
