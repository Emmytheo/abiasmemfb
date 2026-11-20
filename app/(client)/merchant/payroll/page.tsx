"use client"

import React, { useState, useEffect, useRef } from "react"
import {
    Briefcase,
    Upload,
    FileSpreadsheet,
    Play,
    CheckCircle2,
    Loader2,
    Download,
    Plus,
    Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useScope } from "@/context/scope-context"
import { useBankProfile } from "@/context/bank-profile-context"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface PayrollRow {
    id: string
    name: string
    account: string
    bank: string
    amount: number
    status?: string
}

export default function MerchantPayrollPage() {
    const { activeScope } = useScope()
    const { activeProfile } = useBankProfile()
    const fileRef = useRef<HTMLInputElement>(null)

    const [accounts, setAccounts] = useState<any[]>([])
    const [batches, setBatches] = useState<any[]>([])
    const [sourceAccountId, setSourceAccountId] = useState("")
    const [batchName, setBatchName] = useState(`Monthly Payroll ${new Date().toISOString().slice(0, 7)}`)
    const [rows, setRows] = useState<PayrollRow[]>([])
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)

    // Quick add employee row
    const [empName, setEmpName] = useState("")
    const [empAcc, setEmpAcc] = useState("")
    const [empBank, setEmpBank] = useState(activeProfile.shortName)
    const [empAmt, setEmpAmt] = useState("")

    const loadPayroll = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/client/payroll")
            const data = await res.json()
            if (res.ok && data.success) {
                setAccounts(data.accounts || [])
                setBatches(data.batches || [])
                if (!sourceAccountId && data.accounts?.[0]?.id) {
                    setSourceAccountId(String(data.accounts[0].id))
                }
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (activeScope.type === "business") {
            loadPayroll()
        } else {
            setLoading(false)
        }
    }, [activeScope.type])

    const downloadCsvTemplate = () => {
        const csv = [
            "employee_name,account_number,bank_name,amount_naira",
            `Adaeze Okonkwo,1100321535,${activeProfile.shortName},150000`,
            "Tunde Balogun,0123456789,GTBank,200000",
        ].join("\n")
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${activeProfile.id}-payroll-template.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        const text = await file.text()
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
        const parsed: PayrollRow[] = []
        for (let i = 0; i < lines.length; i++) {
            const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
            if (i === 0 && cols[0].toLowerCase().includes("name")) continue
            const [name, account, bank, amtStr] = cols
            const amount = Number(amtStr)
            if (name && account && Number.isFinite(amount) && amount > 0) {
                parsed.push({
                    id: `csv-${i}-${Date.now()}`,
                    name,
                    account,
                    bank: bank || activeProfile.shortName,
                    amount,
                    status: "pending",
                })
            }
        }
        if (parsed.length === 0) {
            toast.error("No valid rows found in CSV. Use format: name,account_number,bank_name,amount_naira")
            return
        }
        setRows(parsed)
        toast.success(`Parsed ${parsed.length} employee salary rows from ${file.name}.`)
    }

    const handleAddManualRow = (e: React.FormEvent) => {
        e.preventDefault()
        if (!empName.trim() || !empAcc.trim() || Number(empAmt) <= 0) return
        setRows((prev) => [
            ...prev,
            {
                id: `row-${Date.now()}`,
                name: empName.trim(),
                account: empAcc.replace(/\s/g, ""),
                bank: empBank.trim() || activeProfile.shortName,
                amount: Number(empAmt),
                status: "pending",
            },
        ])
        setEmpName("")
        setEmpAcc("")
        setEmpAmt("")
    }

    const handleRunPayroll = async () => {
        if (!sourceAccountId || rows.length === 0) {
            toast.error("Select a corporate funding account and add at least one employee.")
            return
        }
        setIsProcessing(true)
        try {
            const res = await fetch("/api/client/payroll", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source_account_id: Number(sourceAccountId),
                    batch_name: batchName.trim() || "Corporate Payroll",
                    items: rows.map((r) => ({
                        name: r.name,
                        account: r.account,
                        bank: r.bank,
                        amount: r.amount,
                    })),
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Payroll disbursement declined")
                return
            }
            toast.success(`Disbursed batch ${data.batch.batch_reference} (${rows.length} employees)!`)
            setRows((prev) => prev.map((r) => ({ ...r, status: "paid" })))
            await loadPayroll()
        } finally {
            setIsProcessing(false)
        }
    }

    if (activeScope.type !== "business") {
        return (
            <div className="max-w-md mx-auto my-12 text-center p-8 bg-card border rounded-3xl space-y-4">
                <Briefcase className="h-10 w-10 text-primary mx-auto" />
                <h2 className="text-2xl font-black">Business Scope Required</h2>
                <p className="text-xs text-muted-foreground">
                    Switch to your Business / Merchant profile to execute corporate bulk payroll runs.
                </p>
            </div>
        )
    }

    const totalNaira = rows.reduce((s, r) => s + r.amount, 0)
    const allPaid = rows.length > 0 && rows.every((r) => r.status === "paid")

    return (
        <div className="p-2 md:p-8 space-y-8 max-w-6xl mx-auto">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <Badge variant="outline" className="uppercase text-[10px] tracking-widest mb-2">
                        Corporate HR & Atomic Disbursement
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight">Bulk Payroll Engine</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload a real CSV schedule or add staff below to execute atomic corporate salary disbursements.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={downloadCsvTemplate} className="rounded-xl font-bold">
                        <Download className="mr-2 h-4 w-4" /> CSV Template
                    </Button>
                    <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleCsvFileChange} />
                    <Button onClick={() => fileRef.current?.click()} className="rounded-xl font-black">
                        <Upload className="mr-2 h-4 w-4" /> Upload CSV
                    </Button>
                </div>
            </header>

            {/* Funding Account & Batch Config */}
            <Card className="p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Funding Corporate Account</label>
                    <select
                        value={sourceAccountId}
                        onChange={(e) => setSourceAccountId(e.target.value)}
                        className="w-full h-11 rounded-xl border bg-background px-3 text-sm font-semibold"
                    >
                        {accounts.map((a) => (
                            <option key={a.id} value={a.id}>
                                {a.account_type} — {a.account_number} (₦{(Number(a.balance || 0) / 100).toLocaleString()})
                            </option>
                        ))}
                    </select>
                </div>
                <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase text-muted-foreground">Batch Title</label>
                    <Input value={batchName} onChange={(e) => setBatchName(e.target.value)} className="h-11 rounded-xl" />
                </div>
            </Card>

            {/* Manual Row Builder */}
            <Card className="p-6 rounded-2xl space-y-4">
                <h2 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Add Staff Recipient</h2>
                <form onSubmit={handleAddManualRow} className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                    <Input required placeholder="Employee Name" value={empName} onChange={(e) => setEmpName(e.target.value)} className="rounded-xl" />
                    <Input required placeholder="10-Digit NUBAN" value={empAcc} onChange={(e) => setEmpAcc(e.target.value)} className="rounded-xl font-mono" />
                    <Input required placeholder="Bank Name" value={empBank} onChange={(e) => setEmpBank(e.target.value)} className="rounded-xl" />
                    <Input type="number" required min="1" placeholder="Salary (NGN)" value={empAmt} onChange={(e) => setEmpAmt(e.target.value)} className="rounded-xl font-mono" />
                    <Button type="submit" className="rounded-xl font-bold gap-1">
                        <Plus className="h-4 w-4" /> Add Row
                    </Button>
                </form>
            </Card>

            {/* Active Schedule */}
            {rows.length > 0 && (
                <Card className="rounded-2xl overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-primary" /> Active Schedule ({rows.length} Staff · ₦{totalNaira.toLocaleString()})
                            </CardTitle>
                            <CardDescription>Debits your funding account atomically and credits internal accounts immediately.</CardDescription>
                        </div>
                        <Button onClick={handleRunPayroll} disabled={isProcessing || allPaid} className="rounded-xl font-black gap-2">
                            {isProcessing ? (
                                <><Loader2 className="h-4 w-4 animate-spin" /> Disbursing...</>
                            ) : allPaid ? (
                                <><CheckCircle2 className="h-4 w-4" /> Disbursed</>
                            ) : (
                                <><Play className="h-4 w-4" /> Execute Atomic Payroll</>
                            )}
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs uppercase bg-muted/40 border-b text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3">Employee</th>
                                    <th className="px-5 py-3">Account / Bank</th>
                                    <th className="px-5 py-3 text-right">Amount</th>
                                    <th className="px-5 py-3 text-right">Status</th>
                                    <th className="px-5 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-5 py-3 font-bold">{r.name}</td>
                                        <td className="px-5 py-3 font-mono text-xs">{r.account} · {r.bank}</td>
                                        <td className="px-5 py-3 text-right font-mono font-black">₦{r.amount.toLocaleString()}</td>
                                        <td className="px-5 py-3 text-right">
                                            <Badge variant={r.status === "paid" ? "default" : "secondary"} className="text-[10px] uppercase">
                                                {r.status || "pending"}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3 text-right">
                                            {r.status !== "paid" && (
                                                <Button size="icon" variant="ghost" onClick={() => setRows((p) => p.filter((x) => x.id !== r.id))}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </CardContent>
                </Card>
            )}

            {/* Historical Batches */}
            <Card className="p-6 rounded-2xl space-y-4">
                <h2 className="text-lg font-black">Disbursed Payroll History ({batches.length})</h2>
                {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : batches.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No payroll batches executed yet.</p>
                ) : (
                    <div className="divide-y">
                        {batches.map((b) => (
                            <div key={b.id} className="py-3 flex justify-between items-center text-xs">
                                <div>
                                    <p className="font-bold text-sm">{b.batch_name}</p>
                                    <p className="text-muted-foreground font-mono">
                                        {b.batch_reference} · {b.total_employees} staff · {new Date(b.created_at).toLocaleString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-base">₦{(Number(b.total_amount_kobo) / 100).toLocaleString()}</p>
                                    <Badge variant="outline" className="text-[9px] uppercase">{b.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    )
}
