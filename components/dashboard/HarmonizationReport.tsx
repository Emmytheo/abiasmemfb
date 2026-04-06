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
    CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { api, Customer, User } from "@/lib/api";
import { toast } from "sonner";
import { IdentityLinkDialog } from "./IdentityLinkDialog";

export function HarmonizationReport() {
    const [loading, setLoading] = useState(true);
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

    // Shadow Banking Clients: Customers in Payload/Qore with NO Supabase ID
    const shadowClients = customers.filter(c => !c.supabase_id);

    // Orphaned Digital Users: Supabase Users with NO matching Customer email
    const orphanedUsers = users.filter(u => 
        !customers.some(c => c.supabase_id === u.id || c.email.toLowerCase() === u.email.toLowerCase())
    );

    const filteredShadow = shadowClients.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) || 
        c.email.toLowerCase().includes(search.toLowerCase())
    );

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
                                    <IdentityLinkDialog customerId={cust.id as string} onLinked={loadData} />
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
                                    <div>
                                        <p className="font-bold text-sm">{user.full_name || 'Anonymous User'}</p>
                                        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{user.email}</p>
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
        </div>
    );
}
