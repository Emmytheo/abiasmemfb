"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
    Store,
    Wallet,
    TrendingUp,
    ArrowDownRight,
    ArrowUpRight,
    Search,
    Activity,
    CreditCard,
    Smartphone,
    Loader2,
    RefreshCw,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

export default function AgentDashboardPage() {
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [terminals, setTerminals] = useState<any[]>([])
    const [commissions, setCommissions] = useState<any>({ total_commission: 0, agent_share: 0, bank_share: 0, items: [] })
    const [floatBalanceNaira, setFloatBalanceNaira] = useState(0)

    const loadData = async () => {
        setLoading(true)
        try {
            const [agencyRes, overviewRes] = await Promise.all([
                fetch("/api/client/agency", { cache: "no-store" }),
                fetch("/api/client/overview", { cache: "no-store" }),
            ])
            if (agencyRes.ok) {
                const a = await agencyRes.json()
                setTerminals(a.terminals || [])
                setCommissions(a.commissions || { total_commission: 0, agent_share: 0, bank_share: 0, items: [] })
            }
            if (overviewRes.ok) {
                const o = await overviewRes.json()
                const totalKobo = (o.accounts || []).reduce((s: number, acc: any) => s + Number(acc.balance || 0), 0)
                setFloatBalanceNaira(totalKobo / 100)
            }
        } catch {
            toast.error("Failed to load live agent metrics")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const items: any[] = commissions.items || []
    const totalVolumeNaira = items.reduce((s, c) => s + Number(c.transaction_amount || 0), 0) / 100
    const filteredItems = items.filter(
        (c) =>
            !search.trim() ||
            String(c.serial_number || "").toLowerCase().includes(search.toLowerCase()) ||
            String(c.id).includes(search)
    )

    if (loading) {
        return (
            <div className="flex h-[55vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="p-4 md:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary/70">Agency Network</p>
                        <Badge variant="outline" className="uppercase text-[10px] tracking-widest bg-primary/5">
                            {terminals.filter((t) => t.status === "active").length} Active Terminals
                        </Badge>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mt-1">Agent Portal</h1>
                    <p className="text-muted-foreground mt-2 max-w-xl">
                        Live float balance, POS settlement volume, and 70/30 commission journal backed by the core ledger.
                    </p>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Button variant="outline" onClick={loadData} className="h-11 font-bold gap-2">
                        <RefreshCw className="h-4 w-4" /> Refresh
                    </Button>
                    <Button asChild className="h-11 font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">
                        <Link href="/pay/fund">
                            <ArrowDownRight className="mr-2 h-4 w-4" /> Fund Float
                        </Link>
                    </Button>
                    <Button asChild className="h-11 font-black shadow-lg">
                        <Link href="/agency">
                            <ArrowUpRight className="mr-2 h-4 w-4" /> Process POS Cash-Out
                        </Link>
                    </Button>
                </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="shadow-lg border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Wallet className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200">Live Float</Badge>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Available E-Value</p>
                        <h2 className="text-3xl font-black">₦{floatBalanceNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-emerald-500/10 bg-emerald-500/5">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <Badge variant="outline" className="border-emerald-200 text-emerald-700">70% Split</Badge>
                        </div>
                        <p className="text-xs font-bold text-emerald-800/70 dark:text-emerald-300/80 uppercase tracking-widest mb-1">Earned Commissions</p>
                        <h2 className="text-3xl font-black text-emerald-600">
                            ₦{(Number(commissions.agent_share || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </h2>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Activity className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">POS Volume Processed</p>
                        <h2 className="text-3xl font-black">₦{totalVolumeNaira.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
                    </CardContent>
                </Card>

                <Card className="shadow-lg border-primary/10">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                <Smartphone className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Settlements Logged</p>
                        <h2 className="text-3xl font-black">{items.length}</h2>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6">
                    <Card className="shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-lg">Agency Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button variant="outline" asChild className="w-full h-14 justify-start font-bold">
                                <Link href="/agency">
                                    <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-3">
                                        <CreditCard className="h-4 w-4" />
                                    </div>
                                    Card Withdrawal (POS Terminal)
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full h-14 justify-start font-bold">
                                <Link href="/agent/terminals">
                                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 mr-3">
                                        <Smartphone className="h-4 w-4" />
                                    </div>
                                    Manage POS Fleet ({terminals.length})
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="w-full h-14 justify-start font-bold">
                                <Link href="/client-dashboard/transfers">
                                    <div className="size-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 mr-3">
                                        <Store className="h-4 w-4" />
                                    </div>
                                    Bank Transfers &amp; Float Settlement
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2 shadow-xl border-primary/10">
                    <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg">Commission Settlement Log</CardTitle>
                            <CardDescription>Audited OTC cash-out transactions on your terminals.</CardDescription>
                        </div>
                        <div className="relative max-w-xs w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search terminal serial..."
                                className="pl-9 h-10 bg-background"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                    <tr>
                                        <th className="px-6 py-4 font-black">Terminal &amp; Time</th>
                                        <th className="px-6 py-4 font-black text-right">Volume</th>
                                        <th className="px-6 py-4 font-black text-right">Agent Share</th>
                                        <th className="px-6 py-4 font-black text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-10 text-center text-muted-foreground text-xs">
                                                No commission transactions recorded yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredItems.map((tx: any) => (
                                            <tr key={tx.id} className="hover:bg-muted/20">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold font-mono text-foreground">{tx.serial_number || `Terminal #${tx.terminal_id}`}</p>
                                                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleString()}</p>
                                                </td>
                                                <td className="px-6 py-4 text-right font-black">
                                                    ₦{(Number(tx.transaction_amount || 0) / 100).toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-emerald-600">
                                                    +₦{(Number(tx.agent_share || 0) / 100).toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Badge variant="outline" className="uppercase text-[10px]">
                                                        {tx.status}
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
            </div>
        </div>
    )
}
