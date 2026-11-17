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
    Loader2,
    Repeat,
    AlertCircle,
    GripVertical
} from "lucide-react";
import { Reorder } from "framer-motion";
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

const ESUSU_MEMBERS = [
    { id: 1, name: "Chinedu Okafor", email: "admin@esusu.com", role: "Group Admin", position: 1, kyc: "Verified", status: "Active" },
    { id: 2, name: "Sarah Johnson", email: "sarah@mail.com", role: "Member", position: 2, kyc: "Verified", status: "Active" },
    { id: 3, name: "Michael Chen", email: "mchen@mail.com", role: "Member", position: 3, kyc: "Pending KYC", status: "Pending" },
    { id: 4, name: "Anita Okoro", email: "anita@mail.com", role: "Member", position: 4, kyc: "Verified", status: "Active" },
];

export default function EsusuManagePage() {
    const { activeScopeId, activeScope } = useScope();
    const [search, setSearch] = useState("");
    const [members, setMembers] = useState(ESUSU_MEMBERS);
    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");

    const filteredMembers = members.filter(member => 
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

    if (activeScope.type !== 'coop') {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl shadow-xl space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Users className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Union Scope Required</h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Group management is exclusive to cooperative union profiles. Please switch your scope.
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
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">{activeScope.name}</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">Cooperative</Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Group Administration</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Invite union members, track their KYC status, and assign rotational payout slots.
                    </p>
                </div>

                <div className="flex gap-3">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button className="h-11 font-black shadow-lg">
                                <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite to Union</DialogTitle>
                                <DialogDescription>
                                    Send an invite link. New members must pass KYC before joining a cycle.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Member Email Address</Label>
                                    <Input 
                                        type="email" 
                                        required 
                                        value={inviteEmail}
                                        onChange={e => setInviteEmail(e.target.value)}
                                        placeholder="member@email.com" 
                                    />
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isInviting}>
                                    {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                    Send Union Invite
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <Card className="lg:col-span-3 shadow-xl shadow-primary/5 border-primary/10">
                    <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" /> Union Roster
                            </CardTitle>
                            <CardDescription>Drag members to re-order the payout rotation schedule.</CardDescription>
                        </div>
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search members..." 
                                className="pl-9 h-10 bg-background"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-4 py-4 w-10"></th>
                                        <th className="px-6 py-4 font-black tracking-wider text-center w-20">Slot</th>
                                        <th className="px-6 py-4 font-black tracking-wider">Member Details</th>
                                        <th className="px-6 py-4 font-black tracking-wider">KYC Status</th>
                                        <th className="px-6 py-4 font-black tracking-wider">Status</th>
                                        <th className="px-6 py-4 font-black tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <Reorder.Group as="tbody" values={members} onReorder={setMembers} className="divide-y divide-border">
                                    {filteredMembers.map((member, index) => (
                                        <Reorder.Item as="tr" key={member.id} value={member} className="hover:bg-muted/20 transition-colors bg-card cursor-grab active:cursor-grabbing">
                                            <td className="px-4 py-4 text-center">
                                                <GripVertical className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="size-8 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center mx-auto shadow-sm">
                                                    {index + 1}
                                                </div>
                                            </td>
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
                                                {member.kyc === 'Verified' ? (
                                                    <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                        <ShieldCheck className="h-4 w-4" /> Verified
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                                                        <AlertCircle className="h-4 w-4" /> Pending
                                                    </div>
                                                )}
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
                                                        <DropdownMenuLabel>Member Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem>Shift Slot Up</DropdownMenuItem>
                                                        <DropdownMenuItem>Shift Slot Down</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-rose-500 focus:text-rose-500">Remove from Union</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </Reorder.Item>
                                    ))}
                                </Reorder.Group>
                            </table>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="shadow-lg shadow-emerald-500/5">
                        <CardHeader>
                            <CardTitle className="text-lg">Cycle Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Total Pool Value</span>
                                <span className="font-black text-emerald-600">₦2,000,000</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Member Contribution</span>
                                <span className="font-bold">₦500,000 / mo</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">Cycle Duration</span>
                                <span className="font-bold">4 Months</span>
                            </div>
                            <div className="pt-4 border-t">
                                <div className="flex items-center gap-2 mb-2">
                                    <Repeat className="h-4 w-4 text-primary" />
                                    <span className="text-xs font-bold uppercase tracking-wider">Next Payout</span>
                                </div>
                                <p className="font-black">Sarah Johnson</p>
                                <p className="text-[10px] text-muted-foreground">Expected: Oct 1, 2026</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
