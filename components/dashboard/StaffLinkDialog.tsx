"use client";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Link2, ShieldCheck, User as UserIcon, CheckCircle2, Loader2 } from "lucide-react";
import { api, User, AccountOfficer } from "@/lib/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StaffLinkDialogProps {
    officer: AccountOfficer | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function StaffLinkDialog({ officer, isOpen, onClose, onSuccess }: StaffLinkDialogProps) {
    const [search, setSearch] = useState("");
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [linking, setLinking] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadAdmins();
        }
    }, [isOpen]);

    async function loadAdmins() {
        setLoading(true);
        try {
            const allUsers = await api.getAllUsers();
            // Filter for admins since only they can be account officers
            setUsers(allUsers.filter(u => u.role === 'admin'));
        } catch (e) {
            toast.error("Failed to load admin users");
        } finally {
            setLoading(false);
        }
    }

    const handleLink = async (user: User) => {
        if (!officer) return;
        setLinking(user.id);
        try {
            const success = await api.linkOfficerToUser(officer.id, user.id);
            if (success) {
                toast.success(`Account Officer ${officer.name} linked to ${user.full_name}`);
                onSuccess();
                onClose();
            } else {
                toast.error("Linking failed.");
            }
        } catch (e) {
            toast.error("An error occurred during linking.");
        } finally {
            setLinking(null);
        }
    };

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(search.toLowerCase()) || 
        (u.full_name?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="w-full max-w-[500px] p-0 overflow-hidden sm:rounded-2xl border-none shadow-2xl">
                <div className="bg-gradient-to-br from-primary/10 via-background to-background p-6 md:p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/20 rounded-xl">
                                <Link2 className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight leading-none mb-1">Staff Association</DialogTitle>
                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                    Link {officer?.name} to a Platform Admin
                                </p>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search admins by name or email..."
                                className="pl-10 h-12 bg-background/50 border-primary/10 rounded-xl text-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 scrollbar-hide">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-2">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                                    <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">Fetching Admins...</p>
                                </div>
                            ) : filteredUsers.length === 0 ? (
                                <p className="text-center py-8 text-xs text-muted-foreground italic font-medium">No admin users found.</p>
                            ) : (
                                filteredUsers.map(user => (
                                    <div key={user.id} className="flex items-center justify-between p-4 bg-background border rounded-xl hover:border-primary/30 transition-all shadow-sm group">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-black text-primary">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm tracking-tight">{user.full_name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-black">{user.email}</p>
                                            </div>
                                        </div>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleLink(user)} 
                                            disabled={linking !== null}
                                            variant={officer?.linked_user_id === user.id ? "ghost" : "secondary"} 
                                            className="rounded-lg h-8 px-4 font-black uppercase text-[10px]"
                                        >
                                            {linking === user.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 
                                             officer?.linked_user_id === user.id ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : 
                                             "Link User"}
                                        </Button>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl">
                            <p className="text-[10px] text-amber-700 font-bold leading-relaxed">
                                <span className="uppercase text-[9px] block mb-1">Impact Analysis:</span>
                                Linking an admin to this officer record will automatically assign their Staff Code to any account applications they approve in the core banking system.
                            </p>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
