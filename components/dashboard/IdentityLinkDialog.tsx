"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link2, ShieldCheck } from "lucide-react";
import { api, User } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface IdentityLinkDialogProps {
    customerId: string;
    onLinked: () => void;
}

export function IdentityLinkDialog({ customerId, onLinked }: IdentityLinkDialogProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState(false);

    useEffect(() => {
        if (open) {
            loadUsers();
        }
    }, [open]);

    async function loadUsers() {
        setLoading(true);
        try {
            // Fetch all users to find potential digital identities
            const all = await api.getAllUsers();
            setUsers(all);
        } catch (e) {
            toast.error("Failed to load digital identities");
        } finally {
            setLoading(false);
        }
    }

    const filtered = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.full_name?.toLowerCase().includes(search.toLowerCase()))
    );

    async function handleLink(user: User) {
        setLinking(true);
        try {
            // Update the customer record with the selected Supabase ID
            await api.updateCustomer(customerId, {
                supabase_id: user.id,
                is_associated: true
            });
            toast.success(`Identity bridge established for ${user.email}`);
            onLinked();
            setOpen(false);
        } catch (e) {
            toast.error("Linking operations failed. Please check network logs.");
        } finally {
            setLinking(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 font-black border-primary/20 hover:bg-primary/5 transition-all text-primary uppercase text-[10px] tracking-widest shadow-none">
                    <Link2 className="h-3 w-3" /> Link Identity
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden rounded-2xl border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-8">
                    <DialogHeader>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight">Identity Bridge</DialogTitle>
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">
                            Map this core banking profile to an existing Supabase digital account.
                        </p>
                    </DialogHeader>

                    <div className="mt-8 space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by email or name..."
                                className="pl-10 h-12 bg-background/50 border-primary/10 focus-visible:ring-primary/20 rounded-xl text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide py-1">
                            {loading ? (
                                <div className="text-center py-12">
                                    <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-black">Scanning Records...</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-center py-10 text-muted-foreground text-sm italic">No digital identities found matching your query.</p>
                            ) : filtered.map(user => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/30 transition-all group shadow-sm">
                                    <div>
                                        <p className="font-bold text-sm tracking-tight">{user.full_name || 'Anonymous User'}</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-tight font-medium">{user.email}</p>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        onClick={() => handleLink(user)} 
                                        disabled={linking}
                                        variant="secondary"
                                        className="rounded-lg h-8 px-4 font-black transition-all hover:bg-primary hover:text-white uppercase text-[10px] tracking-tighter"
                                    >
                                        {linking ? 'LINKING...' : 'CONNECT'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-accent/30 p-4 px-8 border-t flex justify-between items-center text-[10px] uppercase tracking-widest text-muted-foreground font-black transition-all">
                    <span className="opacity-50">Identity Harmonization Engine</span>
                    <Badge variant="outline" className="text-[8px] bg-primary/5 text-primary border-primary/20 px-2 h-5 font-black">STABLE V2</Badge>
                </div>
            </DialogContent>
        </Dialog>
    );
}
