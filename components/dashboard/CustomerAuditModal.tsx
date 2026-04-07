"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
    User, 
    Mail, 
    Phone, 
    CreditCard, 
    Briefcase, 
    AlertTriangle, 
    Trash2, 
    History,
    ShieldAlert,
    ExternalLink,
    CheckCircle2,
    XCircle,
    Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { api, Customer, CustomerAudit } from "@/lib/api";
import { toast } from "sonner";

interface CustomerAuditModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onPurge: (id: string) => Promise<void>;
}

export function CustomerAuditModal({ 
  customer, 
  isOpen, 
  onClose,
  onPurge
}: CustomerAuditModalProps) {
  const [audit, setAudit] = useState<CustomerAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (isOpen && customer?.id) {
      loadAudit();
    }
  }, [isOpen, customer]);

  const loadAudit = async () => {
    if (!customer?.id) return;
    setLoading(true);
    try {
      const data = await api.getCustomerAudit(customer.id);
      setAudit(data);
    } catch (e) {
      toast.error("Failed to fetch relationship audit");
    } finally {
      setLoading(false);
    }
  };

  if (!customer) return null;

  const totalOrphans = (audit?.accounts || 0) + (audit?.loans || 0) + (audit?.applications || 0);
  const isHighRisk = totalOrphans > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-zinc-200">
        <DialogHeader className="p-6 bg-muted/30 border-b">
          <div className="flex items-center gap-4">
             <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
             </div>
             <div>
                <DialogTitle className="text-xl font-bold">{customer.firstName} {customer.lastName}</DialogTitle>
                <DialogDescription className="text-xs uppercase font-black tracking-widest opacity-60">
                    System Audit & Impact Analysis
                </DialogDescription>
             </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 border-b bg-muted/10">
                <TabsList className="bg-transparent h-12 w-full justify-start gap-4 p-0">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-bold uppercase tracking-tight">Overview</TabsTrigger>
                    <TabsTrigger value="banking" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-bold uppercase tracking-tight">Banking Assets</TabsTrigger>
                    <TabsTrigger value="impact" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-0 h-full text-xs font-bold uppercase tracking-tight flex items-center gap-2">
                        Impact
                        {isHighRisk && <Badge variant="destructive" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] animate-pulse">!</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="purge" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none px-0 h-full text-xs font-bold uppercase tracking-tight text-destructive">Danger Zone</TabsTrigger>
                </TabsList>
            </div>

            <ScrollArea className="h-[400px]">
                <div className="p-6">
                    <TabsContent value="overview" className="mt-0 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Status</p>
                                <div className="flex items-center gap-2">
                                    <Badge variant={customer.is_archived ? "outline" : "default"} className="rounded-lg h-5 text-[10px]">
                                        {customer.is_archived ? "Archived" : "Active"}
                                    </Badge>
                                    <Badge variant="outline" className="rounded-lg h-5 text-[10px] bg-primary/5 text-primary border-primary/10">
                                        {customer.merger_status || 'Standalone'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-4 rounded-2xl border bg-muted/5 space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground">Identity Bridge</p>
                                <div className="flex items-center gap-2">
                                    {customer.supabase_id ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 h-5 text-[10px] flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Linked
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/10 h-5 text-[10px] flex items-center gap-1">
                                            <XCircle className="h-3 w-3" /> Digital Disparity
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-tight">Core Demographics</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" /> Email
                                    </div>
                                    <span className="font-medium">{customer.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" /> Phone
                                    </div>
                                    <span className="font-medium">{customer.phone_number || "N/A"}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <ShieldAlert className="h-4 w-4" /> BVN
                                    </div>
                                    <span className="font-mono font-bold tracking-widest">{customer.bvn || "UNAVAILABLE"}</span>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        <div className="space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-tight">Financial Summary</h4>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-2xl bg-muted/20 border flex flex-col items-center justify-center gap-1">
                                    <span className="text-xl font-bold">{audit?.accounts || 0}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight opacity-50">Accounts</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted/20 border flex flex-col items-center justify-center gap-1">
                                    <span className="text-xl font-bold">{audit?.loans || 0}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight opacity-50">Loans</span>
                                </div>
                                <div className="p-4 rounded-2xl bg-muted/20 border flex flex-col items-center justify-center gap-1">
                                    <span className="text-xl font-bold">{audit?.applications || 0}</span>
                                    <span className="text-[10px] font-black uppercase tracking-tight opacity-50">Apps</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="banking" className="mt-0 space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-black uppercase tracking-tight">Active Banking Handles</h4>
                                <Badge variant="outline" className="text-[10px]">Mapped in Payload</Badge>
                            </div>
                            
                            {audit?.financialData.accounts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2 border-2 border-dashed rounded-3xl">
                                    <CreditCard className="h-8 w-8 opacity-20" />
                                    <p className="text-xs font-medium">No accounts linked to this profile.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {audit?.financialData.accounts.map(acc => (
                                        <div key={acc.id} className="p-4 rounded-2xl border bg-muted/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <CreditCard className="h-4 w-4 text-primary" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">{acc.account_number}</p>
                                                    <p className="text-[10px] text-muted-foreground">{acc.account_type}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black">₦{acc.balance.toLocaleString()}</p>
                                                <Badge className="h-4 text-[8px] bg-emerald-500/10 text-emerald-600 border-none">{acc.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <Separator />

                            <h4 className="text-xs font-black uppercase tracking-tight">Loan Facilities</h4>
                            {audit?.financialData.loans.length === 0 ? (
                                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2 border-2 border-dashed rounded-3xl">
                                    <p className="text-xs font-medium">No active loan facilities.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {audit?.financialData.loans.map(loan => (
                                        <div key={loan.id} className="p-4 rounded-2xl border bg-muted/5 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                                                    <Briefcase className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold">₦{loan.amount.toLocaleString()}</p>
                                                    <p className="text-[10px] text-muted-foreground">{loan.duration_months} Months</p>
                                                </div>
                                            </div>
                                            <Badge className="h-5 text-[10px] bg-amber-500 text-white">{loan.status}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="impact" className="mt-0 space-y-6">
                        <Alert variant={isHighRisk ? "destructive" : "default"} className="rounded-2xl border-destructive/20 bg-destructive/5">
                            <AlertTriangle className={isHighRisk ? "h-5 w-5 text-destructive" : "h-5 w-5"} />
                            <AlertTitle className="text-sm font-black uppercase tracking-widest">Orphan Risk Analysis</AlertTitle>
                            <AlertDescription className="text-xs leading-relaxed opacity-80 mt-1">
                                {isHighRisk 
                                    ? `Deleting this record will result in ${totalOrphans} orphaned financial assets. These records will lose their primary identifier and may become inaccessible in the dashboard.`
                                    : "This record has no linked financial assets. It is safe to purge without orphaning banking data."}
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="h-4 w-4 text-primary" />
                                <h4 className="text-xs font-black uppercase tracking-tight">Impact Surface Area</h4>
                            </div>
                            
                            <div className="space-y-3">
                                <div className="p-4 rounded-2xl border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full ${audit?.accounts ? 'bg-destructive/10' : 'bg-muted'} flex items-center justify-center`}>
                                            <CreditCard className={`h-4 w-4 ${audit?.accounts ? 'text-destructive' : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className="text-sm font-medium">Banking Accounts</span>
                                    </div>
                                    <span className={`text-sm font-bold ${audit?.accounts ? 'text-destructive' : ''}`}>{audit?.accounts || 0} Affected</span>
                                </div>
                                <div className="p-4 rounded-2xl border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full ${audit?.loans ? 'bg-destructive/10' : 'bg-muted'} flex items-center justify-center`}>
                                            <Briefcase className={`h-4 w-4 ${audit?.loans ? 'text-destructive' : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className="text-sm font-medium">Loan Portfolios</span>
                                    </div>
                                    <span className={`text-sm font-bold ${audit?.loans ? 'text-destructive' : ''}`}>{audit?.loans || 0} Affected</span>
                                </div>
                                <div className="p-4 rounded-2xl border flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`h-8 w-8 rounded-full ${audit?.applications ? 'bg-destructive/10' : 'bg-muted'} flex items-center justify-center`}>
                                            <History className={`h-4 w-4 ${audit?.applications ? 'text-destructive' : 'text-muted-foreground'}`} />
                                        </div>
                                        <span className="text-sm font-medium">Digital Applications</span>
                                    </div>
                                    <span className={`text-sm font-bold ${audit?.applications ? 'text-destructive' : ''}`}>{audit?.applications || 0} Affected</span>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 space-y-2">
                             <div className="flex items-center gap-2">
                                <Info className="h-4 w-4 text-primary" />
                                <p className="text-xs font-bold uppercase tracking-widest text-primary">Recommendation</p>
                             </div>
                             <p className="text-xs leading-relaxed text-slate-600">
                                {isHighRisk 
                                    ? "Close the modal and use the 'Identity Harminozation' flow to merge this record into a primary profile. This will migrate all assets instead of orphaning them."
                                    : "This record appears to be a redundant test duplicate or a failed registration. You may proceed with the purge safely."}
                             </p>
                        </div>
                    </TabsContent>

                    <TabsContent value="purge" className="mt-0 space-y-6">
                        <div className="text-center space-y-4 py-8">
                            <div className="h-20 w-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                                <Trash2 className="h-10 w-10 text-destructive animate-bounce" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-destructive">Confirm Permanent Purge</h3>
                                <p className="text-sm text-slate-500 max-w-sm mx-auto">
                                    This action is final. All local banking pointers and demogrpahic history for this record will be wiped from the registry.
                                </p>
                            </div>
                            
                            <div className="p-4 border border-destructive/20 bg-destructive/[0.02] rounded-3xl space-y-3">
                                <div className="flex items-center gap-2 text-xs text-destructive font-black uppercase tracking-widest justify-center">
                                    <ShieldAlert className="h-4 w-4" /> Final Warnings
                                </div>
                                <ul className="text-[10px] text-slate-500 space-y-1 text-left list-disc list-inside">
                                    <li>Destroys Payload Customer ID: <span className="font-mono font-bold">{customer.id}</span></li>
                                    <li>Irreversible demographic data loss</li>
                                    {isHighRisk && <li className="text-destructive font-bold">Orphans {totalOrphans} linked banking records</li>}
                                </ul>
                            </div>
                        </div>
                    </TabsContent>
                </div>
            </ScrollArea>

            <DialogFooter className="p-6 bg-muted/30 border-t flex items-center gap-3">
                <Button variant="outline" onClick={onClose} className="flex-1 rounded-xl h-11 text-xs font-bold uppercase tracking-tight">Close Audit</Button>
                {activeTab === "purge" ? (
                    <Button 
                        variant="destructive" 
                        className="flex-1 rounded-xl h-11 text-xs font-bold uppercase tracking-tight gap-2"
                        onClick={() => onPurge(customer.id as string)}
                    >
                        <Trash2 className="h-4 w-4" /> Purge Permanently
                    </Button>
                ) : (
                    <Button 
                        variant="default" 
                        onClick={() => setActiveTab("impact")} 
                        className="flex-1 rounded-xl h-11 text-xs font-bold uppercase tracking-tight gap-2"
                    >
                        Analyze Impact <ExternalLink className="h-4 w-4" />
                    </Button>
                )}
            </DialogFooter>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
