"use client";

import React, { useState } from "react";
import { 
    Users, 
    UserPlus, 
    ShieldCheck, 
    MoreVertical, 
    Mail, 
    Briefcase,
    Search,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useScope } from "@/context/scope-context";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const TEAM_MEMBERS = [
    { id: 1, name: "Chinedu Okafor", email: "admin@acmecorp.com", role: "Owner", status: "Active" },
    { id: 2, name: "Sarah Johnson", email: "sarah.j@acmecorp.com", role: "Admin", status: "Active" },
    { id: 3, name: "Michael Chen", email: "m.chen@acmecorp.com", role: "Cashier", status: "Pending" },
    { id: 4, name: "Anita Okoro", email: "a.okoro@acmecorp.com", role: "Analyst", status: "Active" },
];

export default function MerchantTeamPage() {
    const { activeScopeId, activeScope } = useScope();
    const [search, setSearch] = useState("");
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("Cashier");

    const filteredTeam = TEAM_MEMBERS.filter(member => 
        member.name.toLowerCase().includes(search.toLowerCase()) || 
        member.email.toLowerCase().includes(search.toLowerCase())
    );

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault();
        setIsInviting(true);
        setTimeout(() => {
            toast.success(`Invitation sent to ${inviteEmail}`);
            setIsInviting(false);
            setInviteEmail("");
        }, 1200);
    };

    if (activeScope.type !== 'business') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Briefcase className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Business Scope Required</h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Team management is exclusive to corporate profiles.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Organization</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">Corporate</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Team Directory</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Manage your staff, assign access roles, and control corporate dashboard permissions.
                    </p>
                </div>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button className="h-11 font-black shadow-lg">
                            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite to Corporate Account</DialogTitle>
                            <DialogDescription>
                                An invitation link will be sent to the user's email.
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label>Email Address</Label>
                                <Input 
                                    type="email" 
                                    required 
                                    value={inviteEmail}
                                    onChange={e => setInviteEmail(e.target.value)}
                                    placeholder="colleague@company.com" 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Access Role</Label>
                                <select 
                                    value={inviteRole}
                                    onChange={e => setInviteRole(e.target.value)}
                                    className="w-full h-10 bg-background border border-input rounded-md px-3 text-sm focus:ring-1 focus:ring-ring"
                                >
                                    <option>Admin</option>
                                    <option>Cashier</option>
                                    <option>Analyst</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full h-11" disabled={isInviting}>
                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Send Invitation
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Card className="shadow-xl shadow-primary/5 border-primary/10">
                <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" /> Active Personnel
                        </CardTitle>
                        <CardDescription>Currently managing {TEAM_MEMBERS.length} team members.</CardDescription>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input 
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search staff..." 
                            className="pl-9 h-10 bg-background"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-black tracking-wider">Employee</th>
                                    <th className="px-6 py-4 font-black tracking-wider">Role</th>
                                    <th className="px-6 py-4 font-black tracking-wider">Status</th>
                                    <th className="px-6 py-4 font-black tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filteredTeam.map((member) => (
                                    <tr key={member.id} className="hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground">{member.name}</p>
                                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                {member.role === 'Owner' || member.role === 'Admin' ? (
                                                    <ShieldCheck className="h-4 w-4 text-primary" />
                                                ) : (
                                                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                <span className="font-semibold">{member.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={member.status === 'Active' ? 'default' : 'secondary'} className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">
                                                {member.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem>Edit Role</DropdownMenuItem>
                                                    <DropdownMenuItem>View Activity Log</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-rose-500 focus:text-rose-500">Revoke Access</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {filteredTeam.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground">
                                No staff members found matching "{search}".
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
