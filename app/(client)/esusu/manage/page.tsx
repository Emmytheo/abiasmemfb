"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
    Users,
    ShieldCheck,
    Search,
    Loader2,
    Repeat,
    AlertCircle,
    RefreshCw,
    ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useScope } from "@/context/scope-context"
import { toast } from "sonner"

export default function EsusuManagePage() {
    const { activeScope, setScopeId } = useScope()
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [cycles, setCycles] = useState<any[]>([])
    const [selectedCycleId, setSelectedCycleId] = useState<string>("")
    const [roster, setRoster] = useState<any[]>([])

    const loadData = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/esusu", { cache: "no-store" })
            const json = await res.json()
            if (!res.ok) throw new Error(json.error || "Failed to load cooperative roster")
            const fetchedCycles = json.cycles || []
            setCycles(fetchedCycles)
            if (fetchedCycles.length > 0 && !selectedCycleId) {
                setSelectedCycleId(String(fetchedCycles[0].id))
            }
            setRoster(json.roster || [])
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    if (activeScope.type !== "coop") {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl shadow-xl space-y-6">
                <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Users className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black">Union Scope Required</h2>
                    <p className="text-xs text-muted-foreground font-semibold leading-relaxed">
                        Group administration is exclusive to cooperative union profiles. Switch to Cooperative scope to inspect cycle rosters.
                    </p>
                </div>
                <Button onClick={() => setScopeId("coop")} className="w-full rounded-xl font-black">
                    Switch to Cooperative Scope
                </Button>
            </div>
        )
    }

    const activeCycle = cycles.find((c) => String(c.id) === selectedCycleId) || cycles[0]
    const cycleMembers = roster
        .filter((m) => !activeCycle || String(m.cycle_id) === String(activeCycle.id))
        .filter(
            (m) =>
                !search.trim() ||
                String(m.member_name || "").toLowerCase().includes(search.toLowerCase()) ||
                String(m.email || "").toLowerCase().includes(search.toLowerCase())
        )

    const nextRecipient = cycleMembers.find(
        (m) => activeCycle && Number(m.payout_order_index) === Number(activeCycle.current_payout_index)
    )

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">{activeScope.name}</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">
                            Live Ledger Roster
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Group Administration</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Audit enrolled union members, KYC verification states, and live payout rotation order.
                    </p>
                </div>

                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadData} className="h-11 font-bold gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button asChild className="h-11 font-black gap-2">
                        <Link href="/esusu">
                            Cycles &amp; Contributions <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            </header>

            {cycles.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {cycles.map((c) => (
                        <Button
                            key={c.id}
                            size="sm"
                            variant={String(c.id) === String(activeCycle?.id) ? "default" : "outline"}
                            onClick={() => setSelectedCycleId(String(c.id))}
                            className="rounded-xl font-bold"
                        >
                            {c.name}
                        </Button>
                    ))}
                </div>
            )}

            {loading ? (
                <div className="py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Card className="lg:col-span-3 shadow-xl border-primary/10">
                        <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" /> {activeCycle?.name || "Union Roster"}
                                </CardTitle>
                                <CardDescription>Live enrolled slots ordered by payout index.</CardDescription>
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
                                            <th className="px-6 py-4 font-black text-center w-20">Slot</th>
                                            <th className="px-6 py-4 font-black">Member Details</th>
                                            <th className="px-6 py-4 font-black">KYC Status</th>
                                            <th className="px-6 py-4 font-black">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {cycleMembers.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground text-xs">
                                                    No enrolled members found for this rotational cycle.
                                                </td>
                                            </tr>
                                        ) : (
                                            cycleMembers.map((member) => (
                                                <tr key={member.id} className="hover:bg-muted/20">
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="size-8 rounded-lg bg-primary text-primary-foreground font-black flex items-center justify-center mx-auto">
                                                            {Number(member.payout_order_index) + 1}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className="size-9 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                                                                {String(member.member_name || "M").charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-foreground">{member.member_name}</p>
                                                                <p className="text-xs text-muted-foreground">{member.email || "Registered Member"}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {member.kyc_status === "active" || member.kyc_status === "verified" ? (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                                                                <ShieldCheck className="h-4 w-4" /> Verified
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold capitalize">
                                                                <AlertCircle className="h-4 w-4" /> {member.kyc_status}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <Badge variant="outline" className="uppercase text-[10px]">
                                                            {member.status}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        <Card className="shadow-lg">
                            <CardHeader>
                                <CardTitle className="text-lg">Cycle Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Target Pool</span>
                                    <span className="font-black text-emerald-600">
                                        ₦{activeCycle ? ((Number(activeCycle.contribution_amount) * Number(activeCycle.total_slots)) / 100).toLocaleString() : "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Vault Balance</span>
                                    <span className="font-bold">
                                        ₦{activeCycle ? (Number(activeCycle.vault_balance_kobo || 0) / 100).toLocaleString() : "0"}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Contribution</span>
                                    <span className="font-bold capitalize">
                                        ₦{activeCycle ? (Number(activeCycle.contribution_amount) / 100).toLocaleString() : "0"} / {activeCycle?.frequency || "cycle"}
                                    </span>
                                </div>
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Repeat className="h-4 w-4 text-primary" />
                                        <span className="text-xs font-bold uppercase tracking-wider">Next Payout Slot</span>
                                    </div>
                                    <p className="font-black">{nextRecipient?.member_name || `Slot #${Number(activeCycle?.current_payout_index || 0) + 1}`}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                        {cycleMembers.length} of {activeCycle?.total_slots || 0} slots filled
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    )
}
