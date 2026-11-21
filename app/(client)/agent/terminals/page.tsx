"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
    Smartphone,
    WifiOff,
    PlusCircle,
    AlertTriangle,
    RefreshCw,
    Loader2,
    ArrowRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { BankPageHeader } from "@/components/banking/page-header"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"

export default function AgentTerminalsPage() {
    const [terminals, setTerminals] = useState<any[]>([])
    const [commissions, setCommissions] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [isRequesting, setIsRequesting] = useState(false)
    const [posModel, setPosModel] = useState("Android Smart POS (MoreFun MF919)")
    const [businessAddress, setBusinessAddress] = useState("")

    const loadTerminals = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/agency", { cache: "no-store" })
            const json = await res.json()
            if (res.ok && json.success) {
                setTerminals(json.terminals || [])
                setCommissions(json.commissions?.items || [])
            }
        } catch {
            toast.error("Failed to fetch POS terminals")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadTerminals()
    }, [])

    const handleRequestTerminal = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!businessAddress.trim()) return
        setIsRequesting(true)
        try {
            const res = await fetch("/api/agency/terminals/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    business_address: businessAddress.trim(),
                    pos_type: posModel,
                    monthly_volume_est: 50000000,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) throw new Error(data.error || "Request failed")
            toast.success("Hardware request submitted to Agency Operations.")
            setBusinessAddress("")
            setDialogOpen(false)
            await loadTerminals()
        } catch (err: any) {
            toast.error(err.message)
        } finally {
            setIsRequesting(false)
        }
    }

    const volumeForTerminal = (terminalId: number) =>
        commissions
            .filter((c) => Number(c.terminal_id) === Number(terminalId))
            .reduce((sum, c) => sum + Number(c.transaction_amount || 0), 0) / 100

    return (
        <div className="space-y-6 pb-12">
            <BankPageHeader
                badge="POS Agency Hardware Registry"
                livePill={`${terminals.length} Registered Terminal${terminals.length === 1 ? "" : "s"}`}
                liveTone="emerald"
                title="POS Terminals & Hardware"
                subtitle="Live hardware registry synced from the core agency ledger. Track volumes, terminal status, and request new POS devices."
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadTerminals} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </Button>
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-9 rounded-xl font-black text-xs gap-1.5">
                                    <PlusCircle className="h-3.5 w-3.5" /> Request New POS
                                </Button>
                            </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Hardware Request</DialogTitle>
                                <DialogDescription>
                                    Apply for additional POS hardware assigned to your agent account.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleRequestTerminal} className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Preferred Model</Label>
                                    <select
                                        value={posModel}
                                        onChange={(e) => setPosModel(e.target.value)}
                                        className="w-full h-10 bg-background border border-input rounded-md px-3 text-sm"
                                    >
                                        <option value="Android Smart POS (MoreFun MF919)">Android Smart POS (MoreFun MF919)</option>
                                        <option value="Traditional POS (PAX S920)">Traditional POS (PAX S920)</option>
                                        <option value="Smart Android POS (Nexgo)">Smart Android POS (Nexgo)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Deployment Location / Store Address</Label>
                                    <Input
                                        required
                                        value={businessAddress}
                                        onChange={(e) => setBusinessAddress(e.target.value)}
                                        placeholder="e.g. Shop 14, Main Market"
                                    />
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg flex items-start gap-2 border">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                    <p className="text-xs text-muted-foreground">
                                        Requests enter the Admin Agency approval queue for serial provisioning and activation.
                                    </p>
                                </div>
                                <Button type="submit" className="w-full h-11" disabled={isRequesting}>
                                    {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Smartphone className="mr-2 h-4 w-4" />}
                                    Submit Request
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                    </>
                }
            />

            {loading ? (
                <div className="py-16 flex justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {terminals.map((t) => {
                        const isOnline = t.status === "active"
                        const vol = volumeForTerminal(t.id)
                        return (
                            <Card key={t.id} className={`relative overflow-hidden shadow-lg ${isOnline ? "border-primary/20" : "border-border"}`}>
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                            <Smartphone className="size-6" />
                                        </div>
                                        {isOnline ? (
                                            <Badge className="bg-emerald-500 text-white border-0 flex items-center gap-1.5">
                                                <div className="size-1.5 rounded-full bg-white animate-pulse" /> Active
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-muted-foreground bg-muted flex items-center gap-1.5 uppercase text-[10px]">
                                                <WifiOff className="size-3" /> {t.status}
                                            </Badge>
                                        )}
                                    </div>
                                    <CardTitle className="text-lg font-mono">{t.serial_number}</CardTitle>
                                    <CardDescription className="font-medium text-foreground">{t.pos_model}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 pb-4">
                                    <div className="pt-4 border-t border-border/50 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground mb-1">Settled Volume</p>
                                            <p className="font-black text-lg">₦{vol.toLocaleString()}</p>
                                        </div>
                                        <p className="text-[11px] text-muted-foreground">
                                            Issued {new Date(t.created_at).toLocaleDateString()}
                                        </p>
                                    </div>
                                </CardContent>
                                <CardFooter className="bg-muted/30 border-t py-3 flex items-center justify-between text-xs text-muted-foreground">
                                    <span>Terminal ID #{t.id}</span>
                                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs font-bold">
                                        <Link href="/agency">
                                            Open Cash-Out <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                        </Link>
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}

                    <Card
                        onClick={() => setDialogOpen(true)}
                        className="border-dashed border-2 border-primary/20 bg-primary/[0.02] flex flex-col items-center justify-center p-8 text-center min-h-[260px] shadow-none hover:bg-primary/5 transition-colors cursor-pointer"
                    >
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4">
                            <PlusCircle className="size-8" />
                        </div>
                        <h3 className="text-lg font-bold">Expand POS Fleet</h3>
                        <p className="text-sm text-muted-foreground max-w-[220px] mt-2 mb-4">
                            Request a new hardware terminal for an additional cashpoint location.
                        </p>
                        <Button variant="outline" className="font-bold border-primary/30 text-primary">
                            Request Hardware
                        </Button>
                    </Card>
                </div>
            )}
        </div>
    )
}
