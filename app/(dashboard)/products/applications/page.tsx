"use client"

import * as React from "react"
import Link from "next/link"
import {
    FileText,
    CheckCircle2,
    AlertTriangle,
    Clock,
    XCircle,
    RefreshCw,
    Search,
    Sparkles,
    ExternalLink,
    Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { BankPageHeader } from "@/components/banking/page-header"
import { BankSideDrawer } from "@/components/banking/side-drawer"

interface ApplicationRow {
    id: number
    user_id: string
    product_type_id?: number
    product_name?: string
    product_category?: string
    status: string
    workflow_stage?: string
    requested_amount?: number | string | null
    applicant_name: string
    applicant_email?: string
    applicant_phone?: string
    kyc_status?: string
    latest_account_number?: string
    customer_account_count?: number
    metadata?: Record<string, any>
    created_at: string
}

export default function AdminApplicationsPage() {
    const [applications, setApplications] = React.useState<ApplicationRow[]>([])
    const [counts, setCounts] = React.useState<any>({ total: 0, pending_count: 0, retrying_count: 0, approved_count: 0, rejected_count: 0 })
    const [loading, setLoading] = React.useState(true)
    const [search, setSearch] = React.useState("")
    const [filter, setFilter] = React.useState<"all" | "pending" | "retrying" | "approved" | "rejected">("all")

    // Underwriting Drawer
    const [selected, setSelected] = React.useState<ApplicationRow | null>(null)
    const [busy, setBusy] = React.useState<string | null>(null)
    const [principalNaira, setPrincipalNaira] = React.useState("100000")
    const [interestRate, setInterestRate] = React.useState("18")
    const [durationMonths, setDurationMonths] = React.useState("6")
    const [rejectReason, setRejectReason] = React.useState("")

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/applications", { cache: "no-store" })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Failed to load applications")
                return
            }
            const rows: ApplicationRow[] = data.applications || []
            setApplications(rows)
            setCounts(data.counts || {})
            setSelected((prev) => (prev ? rows.find((r) => r.id === prev.id) || null : null))
        } catch {
            toast.error("Network error loading application pipeline")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleApproveAndProvision = async (app: ApplicationRow) => {
        setBusy(`prov-${app.id}`)
        try {
            const res = await fetch("/api/admin/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "approve_and_provision",
                    application_id: app.id,
                    principal_naira: Number(principalNaira || app.requested_amount || 100000),
                    interest_rate: Number(interestRate || 18),
                    duration_months: Number(durationMonths || 6),
                    disburse_now: true,
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Provisioning failed")
                return
            }
            toast.success(data.message || "Approved & provisioned live on core ledger!")
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const handleReject = async (app: ApplicationRow) => {
        setBusy(`rej-${app.id}`)
        try {
            const res = await fetch("/api/admin/applications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "reject",
                    application_id: app.id,
                    reason: rejectReason.trim() || "Declined by Underwriting Desk",
                }),
            })
            const data = await res.json()
            if (!res.ok || !data.success) {
                toast.error(data.error || "Rejection failed")
                return
            }
            toast.success(`Application #${app.id} rejected & audited.`)
            setRejectReason("")
            await loadData()
        } finally {
            setBusy(null)
        }
    }

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        return applications.filter((a) => {
            const isRetrying = /retry|fail/i.test(a.workflow_stage || "")
            const matchTab =
                filter === "all" ||
                (filter === "pending" && ["pending", "under_review"].includes(a.status)) ||
                (filter === "retrying" && isRetrying) ||
                (filter === "approved" && a.status === "approved" && !isRetrying) ||
                (filter === "rejected" && a.status === "rejected")
            const matchQ =
                !q ||
                String(a.id).includes(q) ||
                String(a.applicant_name || "").toLowerCase().includes(q) ||
                String(a.product_name || "").toLowerCase().includes(q) ||
                String(a.workflow_stage || "").toLowerCase().includes(q)
            return matchTab && matchQ
        })
    }, [applications, search, filter])

    const isLoanApp = (app: ApplicationRow) =>
        `${app.product_name || ""} ${app.product_category || ""}`.toLowerCase().match(/loan|credit|facility/) !== null

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 pb-12">
            <BankPageHeader
                badge="Product Origination & Underwriting"
                livePill={`${Number(counts.pending_count || 0) + Number(counts.retrying_count || 0)} Needs Action`}
                liveTone={Number(counts.pending_count || 0) + Number(counts.retrying_count || 0) > 0 ? "amber" : "emerald"}
                title="Customer Product Applications"
                subtitle="Approve deposit & credit applications with deterministic NUBAN generation, instant loan disbursement, Double-Entry GL booking, and one-click retry for stuck provisions."
                actions={
                    <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
                    </Button>
                }
            />

            {/* Pipeline KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: "Pending Review", value: Number(counts.pending_count || 0), sub: "Awaiting underwriter decision", icon: Clock, tone: "bg-amber-500/10 text-amber-600" },
                    { label: "Stuck / Retrying", value: Number(counts.retrying_count || 0), sub: "Ready for 1-click provisioning", icon: AlertTriangle, tone: Number(counts.retrying_count || 0) > 0 ? "bg-rose-500/10 text-rose-600" : "bg-muted text-muted-foreground" },
                    { label: "Approved & Provisioned", value: Number(counts.approved_count || 0), sub: "Live on core ledger", icon: CheckCircle2, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Declined / Rejected", value: Number(counts.rejected_count || 0), sub: "Audited underwriting exits", icon: XCircle, tone: "bg-slate-500/10 text-slate-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tracking-tight tabular-nums-fintech">{k.value}</p>
                        <p className="text-[11px] font-medium text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            {/* Applications Table */}
            <div className="bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/70 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search by applicant, product, or app ID..."
                            className="pl-10 h-10 rounded-xl bg-background"
                        />
                    </div>
                    <div className="flex flex-wrap gap-1.5 bg-muted/60 p-1 rounded-2xl">
                        {[
                            { id: "all", label: `All (${applications.length})` },
                            { id: "pending", label: `Pending (${counts.pending_count || 0})` },
                            { id: "retrying", label: `Retrying (${counts.retrying_count || 0})` },
                            { id: "approved", label: "Provisioned" },
                            { id: "rejected", label: "Rejected" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setFilter(tab.id as any)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    filter === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading application queue...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">No applications in this queue.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">App Ref</th>
                                    <th className="px-5 py-3.5">Applicant</th>
                                    <th className="px-5 py-3.5">Product</th>
                                    <th className="px-5 py-3.5">Stage &amp; Status</th>
                                    <th className="px-5 py-3.5">Date</th>
                                    <th className="px-5 py-3.5 text-right">Underwriting</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.map((app) => {
                                    const isRetrying = /retry|fail/i.test(app.workflow_stage || "")
                                    const needsProvision = app.status !== "rejected" && (app.status !== "approved" || isRetrying)
                                    return (
                                        <tr key={app.id} className="hover:bg-muted/25 transition-colors">
                                            <td className="px-5 py-3.5 font-mono font-black text-foreground">APP-{String(app.id).padStart(4, "0")}</td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-foreground">{app.applicant_name}</p>
                                                <p className="text-[11px] text-muted-foreground">{app.applicant_email || app.user_id}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-foreground">{app.product_name || `Product #${app.product_type_id || "—"}`}</p>
                                                {app.requested_amount ? (
                                                    <p className="text-[11px] font-mono text-primary font-bold">
                                                        Requested: ₦{Number(app.requested_amount).toLocaleString()}
                                                    </p>
                                                ) : null}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <Badge
                                                        variant={
                                                            app.status === "rejected"
                                                                ? "destructive"
                                                                : isRetrying
                                                                    ? "outline"
                                                                    : app.status === "approved"
                                                                        ? "default"
                                                                        : "secondary"
                                                        }
                                                        className={`text-[9px] uppercase font-black ${isRetrying ? "border-rose-500/40 text-rose-600 bg-rose-500/10" : ""}`}
                                                    >
                                                        {isRetrying ? "Retrying Provisioning" : app.status}
                                                    </Badge>
                                                    <span className="text-[11px] text-muted-foreground font-medium">{app.workflow_stage}</span>
                                                </div>
                                                {app.metadata?.provisioned_account_number && (
                                                    <p className="text-[10px] font-mono text-emerald-600 font-bold mt-0.5">
                                                        NUBAN: {app.metadata.provisioned_account_number}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap">
                                                {new Date(app.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-5 py-3.5 text-right space-x-2 whitespace-nowrap">
                                                {needsProvision && (
                                                    <Button
                                                        size="sm"
                                                        disabled={busy !== null}
                                                        onClick={() => {
                                                            setSelected(app)
                                                            setPrincipalNaira(String(app.requested_amount || 100000))
                                                        }}
                                                        className="h-8 rounded-xl text-[11px] font-black gap-1"
                                                    >
                                                        <Sparkles className="h-3 w-3" /> {isRetrying ? "Complete Provision" : "Review & Approve"}
                                                    </Button>
                                                )}
                                                <Button size="sm" variant="ghost" asChild className="h-8 rounded-xl text-[11px] font-bold">
                                                    <Link href={`/products/applications/${app.id}`}>
                                                        Full File <ExternalLink className="h-3 w-3 ml-1" />
                                                    </Link>
                                                </Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Underwriting & Provisioning Slide-Over Drawer */}
            <BankSideDrawer
                open={Boolean(selected)}
                onClose={() => setSelected(null)}
                title={selected ? `Application APP-${String(selected.id).padStart(4, "0")}` : "Underwriting Review"}
                subtitle={selected ? `${selected.applicant_name} · ${selected.product_name || "Banking Product"}` : undefined}
            >
                {selected && (
                    <div className="space-y-5">
                        <div className="p-4 rounded-2xl bg-muted/40 border border-border/80 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">Applicant</span>
                                <span className="font-black">{selected.applicant_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">Current Stage</span>
                                <span className="font-bold text-primary">{selected.workflow_stage}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">Existing Accounts</span>
                                <span className="font-mono font-bold">{selected.customer_account_count || 0} ({selected.latest_account_number || "None"})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground font-semibold">KYC Status</span>
                                <Badge variant="outline" className="uppercase text-[9px]">{selected.kyc_status || "pending"}</Badge>
                            </div>
                        </div>

                        {isLoanApp(selected) && (
                            <div className="p-4 rounded-2xl border border-border/80 bg-card space-y-3">
                                <p className="text-xs font-black uppercase tracking-wider">Loan Origination Terms</p>
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground">Principal (₦)</label>
                                        <Input type="number" value={principalNaira} onChange={(e) => setPrincipalNaira(e.target.value)} className="h-9 rounded-xl font-mono text-xs mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground">Rate (% p.a)</label>
                                        <Input type="number" value={interestRate} onChange={(e) => setInterestRate(e.target.value)} className="h-9 rounded-xl font-mono text-xs mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-muted-foreground">Tenor (Mo)</label>
                                        <Input type="number" value={durationMonths} onChange={(e) => setDurationMonths(e.target.value)} className="h-9 rounded-xl font-mono text-xs mt-1" />
                                    </div>
                                </div>
                            </div>
                        )}

                        <Button
                            disabled={busy !== null}
                            onClick={() => handleApproveAndProvision(selected)}
                            className="w-full h-11 rounded-xl font-black text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                        >
                            {busy === `prov-${selected.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            {isLoanApp(selected)
                                ? "Approve, Originate Loan & Disburse (GL 1200/2000)"
                                : "Approve & Provision Live NUBAN Account"}
                        </Button>

                        <div className="pt-3 border-t border-border/70 space-y-2.5">
                            <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Decline Application</p>
                            <Input
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Reason for decline (recorded in audit log)..."
                                className="h-10 rounded-xl text-xs"
                            />
                            <Button
                                variant="destructive"
                                disabled={busy !== null}
                                onClick={() => handleReject(selected)}
                                className="w-full h-10 rounded-xl font-bold text-xs"
                            >
                                Reject Application
                            </Button>
                        </div>
                    </div>
                )}
            </BankSideDrawer>
        </div>
    )
}
