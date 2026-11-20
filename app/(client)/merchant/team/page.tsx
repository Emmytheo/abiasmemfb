"use client"

import React, { useState, useEffect, useCallback } from "react"
import {
    Users,
    UserPlus,
    ShieldCheck,
    Mail,
    Briefcase,
    Search,
    Loader2,
    Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useScope } from "@/context/scope-context"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export default function MerchantTeamPage() {
    const { activeScope } = useScope()
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isInviting, setIsInviting] = useState(false)
    const [inviteName, setInviteName] = useState("")
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("Cashier")
    const [dialogOpen, setDialogOpen] = useState(false)

    const loadTeam = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/team")
            const data = await res.json()
            if (res.ok && data.success) {
                setMembers(data.members || [])
            }
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (activeScope.type === "business") loadTeam()
        else setLoading(false)
    }, [activeScope.type, loadTeam])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsInviting(true)
        try {
            const res = await fetch("/api/client/team", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    full_name: inviteName.trim() || inviteEmail.split("@")[0],
                    email: inviteEmail.trim(),
                    role: inviteRole,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to invite team member")
                return
            }
            toast.success(`Team invite saved for ${inviteEmail.trim()} (${inviteRole}).`)
            setInviteName("")
            setInviteEmail("")
            setDialogOpen(false)
            await loadTeam()
        } finally {
            setIsInviting(false)
        }
    }

    const handleChangeRole = async (id: number, role: string) => {
        const res = await fetch("/api/client/team", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, role }),
        })
        if (res.ok) {
            toast.success(`Role updated to ${role}.`)
            await loadTeam()
        }
    }

    const handleRevoke = async (id: number, email: string) => {
        const res = await fetch(`/api/client/team?id=${id}`, { method: "DELETE" })
        if (res.ok) {
            toast.success(`Revoked access for ${email}.`)
            await loadTeam()
        }
    }

    if (activeScope.type !== "business") {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl space-y-4">
                <Briefcase className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-black">Business Scope Required</h2>
                <p className="text-xs text-muted-foreground">Team directory is exclusive to Business / Merchant profiles.</p>
            </div>
        )
    }

    const filteredTeam = members.filter(
        (m) =>
            String(m.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
            String(m.email || "").toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-2 md:p-8 space-y-8 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-widest mb-2">
                        Corporate Access Control
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Team Directory</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Invite personnel, assign RBAC roles, and revoke corporate ledger access.
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="h-11 rounded-xl font-black">
                            <UserPlus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Invite to Corporate Account</DialogTitle>
                            <DialogDescription>Persist role-based access in your organization directory.</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleInvite} className="space-y-4 pt-2">
                            <div className="space-y-1.5">
                                <Label>Full Name</Label>
                                <Input required value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="e.g. Chinedu Okafor" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Email Address</Label>
                                <Input type="email" required value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
                            </div>
                            <div className="space-y-1.5">
                                <Label>Access Role</Label>
                                <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full h-10 bg-background border rounded-md px-3 text-sm">
                                    <option>Admin</option>
                                    <option>Approver</option>
                                    <option>Cashier</option>
                                    <option>Analyst</option>
                                </select>
                            </div>
                            <Button type="submit" className="w-full h-11" disabled={isInviting}>
                                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                                Save & Invite Member
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </header>

            <Card className="rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" /> Personnel ({members.length})
                        </CardTitle>
                        <CardDescription>Persisted organization roles and permissions.</CardDescription>
                    </div>
                    <div className="relative max-w-xs w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search staff..." className="pl-9 h-9 bg-background" />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                    ) : filteredTeam.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">No corporate team members added yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs uppercase bg-muted/40 border-b text-muted-foreground">
                                    <tr>
                                        <th className="px-6 py-3">Employee</th>
                                        <th className="px-6 py-3">Role</th>
                                        <th className="px-6 py-3">Status</th>
                                        <th className="px-6 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {filteredTeam.map((m) => (
                                        <tr key={m.id}>
                                            <td className="px-6 py-4">
                                                <p className="font-bold">{m.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{m.email}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={m.role}
                                                    onChange={(e) => handleChangeRole(m.id, e.target.value)}
                                                    className="h-8 rounded-lg border bg-background px-2 text-xs font-semibold"
                                                >
                                                    <option>Admin</option>
                                                    <option>Approver</option>
                                                    <option>Cashier</option>
                                                    <option>Analyst</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Badge variant="outline" className="text-[10px] uppercase">{m.status}</Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button size="sm" variant="ghost" onClick={() => handleRevoke(m.id, m.email)} className="text-destructive">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
