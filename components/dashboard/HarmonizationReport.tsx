"use client";
import React, { useState, useEffect } from "react";
import { 
    Users, 
    Link2, 
    ShieldAlert, 
    UserPlus, 
    RefreshCw, 
    Search,
    ArrowRightLeft,
    CheckCircle2,
    Trash2,
    AlertTriangle,
    Undo2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { api, Customer, User } from "@/lib/api";
import { toast } from "sonner";
import { IdentityLinkDialog } from "./IdentityLinkDialog";
import { CustomerAuditModal } from "./CustomerAuditModal";

export function HarmonizationReport() {
    const [loading, setLoading] = useState(true);
    const [selectedAuditCustomer, setSelectedAuditCustomer] = useState<Customer | null>(null);
    const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [search, setSearch] = useState("");

    const loadData = async () => {
        setLoading(true);
        try {
            const [custs, usrs] = await Promise.all([
                api.getAllCustomers(),
                api.getAllUsers()
            ]);
            setCustomers(custs);
            setUsers(usrs);
        } catch (e) {
            toast.error("Failed to load harmonization data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    // Shadow Banking Clients: Active Customers in Payload/Qore with NO Supabase ID
    const shadowClients = customers.filter(c => !c.supabase_id && !c.is_archived);

    // Orphaned Digital Users: Unique Supabase Users with NO explicit association in Payload
    const orphanedUsers = Array.from(new Map(users.map(u => [u.id, u])).values())
        .filter(u => !customers.some(c => c.supabase_id === u.id));

    // Archived Records: For maintenance/purging
    const archivedRecords = customers.filter(c => c.is_archived);

    const handleDelete = async (id: string) => {
        try {
            const success = await api.deleteCustomer(id);
            if (success) {
                toast.success("Record purged permanently");
                loadData();
            } else {
                toast.error("Failed to purge record");
            }
        } catch (e) {
            toast.error("An error occurred during deletion");
        }
    };

    const cleanArchivedEmail = (email: string) => {
        return email.replace(/^archived_\d+_/, '');
    };

    const filteredShadow = shadowClients.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
        c.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleLinkIdentity = (customer: Customer) => {
        setSelectedCustomer(customer);
        setIsLinkDialogOpen(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-xl font-bold tracking-tight flex items-center gap-2">
                        <ArrowRightLeft className="h-5 w-5 text-primary" />
                        Identity Disparity Report
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">Cross-system audit of banking profiles vs digital identities.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative grow md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            placeholder="Filter by name or email..." 
                            className="pl-9 h-10 rounded-xl bg-background/50 border-primary/10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={loadData} disabled={loading} className="shrink-0 h-10 w-10 border-primary/10">
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Shadow Clients Card */}
                <Card className="border-primary/5 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-amber-500/[0.03] border-b p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Shadow Banking Clients</CardTitle>
                                    <CardDescription className="text-xs">Customers in core banking with no digital account.</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-amber-500/5 text-amber-600 border-amber-500/10">{shadowClients.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto divide-y scrollbar-hide">
                            {loading ? (
                                <p className="text-center py-12 text-xs uppercase tracking-widest text-muted-foreground font-black animate-pulse">Analyzing Registry...</p>
                            ) : filteredShadow.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
                                    <p className="text-sm font-medium">No shadow clients found.</p>
                                </div>
                            ) : filteredShadow.map(cust => (
                                <div key={cust.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm">{cust.firstName} {cust.lastName}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{cust.email}</p>
                                    </div>
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 hover:text-primary" 
                                        onClick={() => handleLinkIdentity(cust)}
                                    >
                                        Link Identity
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Orphaned Digital Users Card */}
                <Card className="border-primary/5 shadow-xl shadow-primary/5 rounded-2xl overflow-hidden">
                    <CardHeader className="bg-blue-500/[0.03] border-b p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <UserPlus className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-lg">Orphaned Digital Users</CardTitle>
                                    <CardDescription className="text-xs">Digital accounts with no linked banking profile.</CardDescription>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-blue-500/5 text-blue-600 border-blue-500/10">{orphanedUsers.length}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="max-h-[400px] overflow-y-auto divide-y scrollbar-hide">
                            {loading ? (
                                <p className="text-center py-12 text-xs uppercase tracking-widest text-muted-foreground font-black animate-pulse">Scanning Supabase...</p>
                            ) : orphanedUsers.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-2">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-500 opacity-20" />
                                    <p className="text-sm font-medium">All digital users are linked.</p>
                                </div>
                            ) : orphanedUsers.map(user => (
                                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-accent/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div>
                                            <p className="font-bold text-sm tracking-tight">{user.full_name || 'Anonymous User'}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">{user.email}</p>
                                                {customers.some(c => c.email.toLowerCase() === user.email.toLowerCase()) && (
                                                   <Badge variant="outline" className="h-4 border-emerald-500/20 text-emerald-600 bg-emerald-500/5 text-[7px] font-black uppercase px-1.5 flex items-center gap-1">
                                                       <Link2 className="h-1.5 w-1.5" /> Potential Match
                                                   </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/5 h-8">
                                        Invite to Onboard
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Archived Maintenance Section */}
            <Card className="border-destructive/10 shadow-xl shadow-destructive/5 rounded-2xl overflow-hidden mt-8">
                <CardHeader className="bg-destructive/[0.02] border-b p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-destructive/10 rounded-xl">
                                <Trash2 className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <CardTitle className="text-lg">Archived Registry Maintenance</CardTitle>
                                <CardDescription className="text-xs">Purge legacy test data and archived identity fragments.</CardDescription>
                            </div>
                        </div>
                        <Badge variant="outline" className="bg-destructive/5 text-destructive border-destructive/10">{archivedRecords.length}</Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="max-h-[300px] overflow-y-auto divide-y scrollbar-hide">
                        {archivedRecords.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-1">
                                <p className="text-sm font-medium">Archived registry is clean.</p>
                            </div>
                        ) : archivedRecords.map(cust => (
                            <div 
                                key={cust.id} 
                                className="p-4 flex items-center justify-between hover:bg-destructive/[0.02] transition-colors cursor-pointer group"
                                onClick={() => {
                                    setSelectedAuditCustomer(cust);
                                    setIsAuditModalOpen(true);
                                }}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center group-hover:bg-destructive/10 transition-colors">
                                        <Undo2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm font-black group-hover:text-destructive transition-colors">{cust.firstName} {cust.lastName}</p>
                                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tight">
                                            {cleanArchivedEmail(cust.email)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Badge variant="outline" className="text-[8px] border-destructive/20 text-destructive h-5">Audit & Purge</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-zinc-950 border-zinc-900 text-white p-6 rounded-2xl shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Users className="h-32 w-32" />
                 </div>
                 <h4 className="text-sm uppercase tracking-[0.3em] font-black text-zinc-500 mb-4">Harmonization Logic</h4>
                 <div className="space-y-4 text-xs leading-relaxed text-zinc-400 max-w-2xl font-medium">
                    <p>The **Identity Bridge** engine prioritizes Qore attributes for banking state and Supabase UUIDs for digital access. Disparities occur when manual core entries lack secondary contact matching or digital leads haven't completed account opening workflows.</p>
                    <p>Manual linking establishes a bilateral link in the Payload orchestrator, enabling immediate balance visibility and transaction history access for the digital user.</p>
                 </div>
            </Card>

            <IdentityLinkDialog
                customerId={selectedCustomer?.id || null}
                isOpen={isLinkDialogOpen}
                onClose={() => setIsLinkDialogOpen(false)}
                onSuccess={loadData}
            />

            <CustomerAuditModal
                customer={selectedAuditCustomer}
                isOpen={isAuditModalOpen}
                onClose={() => setIsAuditModalOpen(false)}
                onPurge={async (id) => {
                    await handleDelete(id);
                    setIsAuditModalOpen(false);
                }}
            />
        </div>
    );
}
