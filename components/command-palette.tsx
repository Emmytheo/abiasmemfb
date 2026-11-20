"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    Search,
    LayoutDashboard,
    Landmark,
    Globe,
    CreditCard,
    Users,
    Briefcase,
    Receipt,
    Send,
    Wallet,
    FileText,
    ShieldCheck,
    Sliders,
    Workflow,
    Building2,
    Settings,
    RefreshCw,
    ArrowRight,
    Sparkles,
    X,
} from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"
import type { ModuleKey } from "@/lib/banking/bank-profiles"

interface CommandItem {
    id: string
    label: string
    hint: string
    href: string
    group: string
    icon: React.ElementType
    moduleKey?: ModuleKey
    keywords?: string
}

const ADMIN_COMMANDS: CommandItem[] = [
    { id: "adm-home", label: "Central Command Dashboard", hint: "Live KPIs, deposits, loan book & health", href: "/dashboard", group: "Command & Ops", icon: LayoutDashboard, keywords: "home overview kpi" },
    { id: "adm-teller", label: "Teller Cash-In / Cash-Out Desk", hint: "Post live atomic deposits, withdrawals & PND", href: "/dashboard/operations", group: "Command & Ops", icon: Landmark, keywords: "teller deposit withdrawal freeze pnd" },
    { id: "adm-approvals", label: "Maker-Checker Approvals Queue", hint: "Review dual-control items & funding requests", href: "/dashboard/operations?tab=approvals", group: "Command & Ops", icon: ShieldCheck, keywords: "approve checker funding verify" },
    { id: "adm-recon", label: "Trial Balance & Reconciliation", hint: "Run live SQL asset vs liability checks", href: "/dashboard/operations?tab=reconciliation", group: "Command & Ops", icon: RefreshCw, keywords: "balance ledger trial recon" },
    { id: "adm-audit", label: "Immutable Audit Trail (CSV)", hint: "Inspect & export all admin mutations", href: "/dashboard/operations?tab=audit", group: "Command & Ops", icon: FileText, keywords: "logs security compliance cbn" },
    { id: "adm-copteller", label: "Copteller Cooperative Bridge", hint: "Live cooperatives, HP loans & CBN returns", href: "/dashboard/copteller", group: "Digital Hub", icon: Globe, moduleKey: "coptellerBridge", keywords: "coop union copteller hire purchase" },
    { id: "adm-esusu", label: "Esusu Cooperatives Admin", hint: "Manage rotational thrift cycles & payouts", href: "/dashboard/esusu", group: "Digital Hub", icon: Users, moduleKey: "cooperativeEsusu", keywords: "ajo thrift savings" },
    { id: "adm-agency", label: "POS Agency Fleet & Commissions", hint: "Approve POS terminals & agent splits", href: "/dashboard/agency", group: "Digital Hub", icon: Landmark, moduleKey: "agencyPos", keywords: "pos terminal agent" },
    { id: "adm-cards", label: "Smart Cards Registry", hint: "Freeze/unfreeze & monitor issued debit cards", href: "/dashboard/cards", group: "Digital Hub", icon: CreditCard, moduleKey: "smartCards", keywords: "verve visa mastercard" },
    { id: "adm-merchant", label: "Merchant KYB & Settlements", hint: "Verify SME merchants & API gateways", href: "/dashboard/merchant", group: "Digital Hub", icon: Briefcase, moduleKey: "merchantApiAndPayroll", keywords: "sme checkout webhook" },
    { id: "adm-accounts", label: "Customer Accounts Directory", hint: "Inspect NUBAN ledgers & statuses", href: "/products/accounts", group: "Core Ledger", icon: Wallet, keywords: "nuban savings current" },
    { id: "adm-loans", label: "Loan Book & Facilities", hint: "Manage active & pending credit lines", href: "/products/loans", group: "Core Ledger", icon: CreditCard, keywords: "credit facility interest" },
    { id: "adm-apps", label: "Product Applications", hint: "Approve or reject customer applications", href: "/products/applications", group: "Core Ledger", icon: FileText, keywords: "onboarding request" },
    { id: "adm-customers", label: "Customer Registry & KYC", hint: "Customer profiles, BVN & risk tiers", href: "/customers", group: "Core Ledger", icon: Users, keywords: "bvn kyc users" },
    { id: "adm-profiles", label: "White-Label Bank Profile Studio", hint: "Swap active bank, palette & modules globally", href: "/settings/bank-profiles", group: "Configuration", icon: Building2, keywords: "whitelabel template maxitrust navy abia" },
    { id: "adm-workflows", label: "Workflow Orchestration Engine", hint: "Qore endpoints, SDL & scheduled jobs", href: "/workflows", group: "Configuration", icon: Workflow, moduleKey: "workflowEngine", keywords: "automation cron qore" },
]

const CLIENT_COMMANDS: CommandItem[] = [
    { id: "cli-home", label: "Banking Overview", hint: "Portfolio value, accounts & recent activity", href: "/client-dashboard", group: "Banking", icon: LayoutDashboard, keywords: "home balance portfolio" },
    { id: "cli-fund", label: "Fund Account", hint: "NUBAN deposit, Paystack or Teller verification", href: "/pay/fund", group: "Banking", icon: Wallet, keywords: "deposit topup paystack" },
    { id: "cli-transfer", label: "Transfer Funds", hint: "Instant intra-bank & inter-bank transfers", href: "/client-dashboard/transfers", group: "Banking", icon: Send, keywords: "send money nip" },
    { id: "cli-txs", label: "Transaction History", hint: "Receipts & statement audit log", href: "/client-dashboard/transactions", group: "Banking", icon: Receipt, keywords: "history statement" },
    { id: "cli-standing", label: "Standing Orders", hint: "Automated recurring transfers", href: "/client-dashboard/standing-orders", group: "Banking", icon: RefreshCw, keywords: "recurring schedule" },
    { id: "cli-cards", label: "Smart Cards", hint: "Issue virtual cards, freeze & daily caps", href: "/my-cards", group: "Digital Hub", icon: CreditCard, moduleKey: "smartCards", keywords: "atm pos visa verve pin" },
    { id: "cli-esusu", label: "Digital Esusu & Savings Vaults", hint: "Personal Ajo goals & cooperative rotations", href: "/esusu", group: "Digital Hub", icon: Users, moduleKey: "cooperativeEsusu", keywords: "ajo thrift savings" },
    { id: "cli-invoices", label: "SME Invoices & Billing", hint: "Create, share & settle business invoices", href: "/client-dashboard/invoices", group: "Business & Merchant", icon: Receipt, moduleKey: "merchantApiAndPayroll", keywords: "billing client invoice" },
    { id: "cli-merchant", label: "Merchant API & Webhooks", hint: "Cryptographic keys & signed webhook logs", href: "/merchant", group: "Business & Merchant", icon: Briefcase, moduleKey: "merchantApiAndPayroll", keywords: "api key checkout" },
    { id: "cli-payroll", label: "Bulk HR Payroll", hint: "Upload CSV & disburse staff salaries", href: "/merchant/payroll", group: "Business & Merchant", icon: Users, moduleKey: "merchantApiAndPayroll", keywords: "salary csv batch" },
    { id: "cli-team", label: "Team Directory", hint: "Manage business staff roles & access", href: "/merchant/team", group: "Business & Merchant", icon: Building2, moduleKey: "merchantApiAndPayroll", keywords: "staff members" },
    { id: "cli-agency", label: "Agency Banking POS", hint: "POS cash-out & 70/30 commission journal", href: "/agency", group: "Digital Hub", icon: Landmark, moduleKey: "agencyPos", keywords: "pos cashout float" },
    { id: "cli-settings", label: "Security, PIN & Preferences", hint: "Set 4-digit transaction PIN & alerts", href: "/settings", group: "Account", icon: Settings, keywords: "pin security notification" },
]

export function CommandPalette({ role = "admin" }: { role?: "admin" | "client" }) {
    const router = useRouter()
    const { activeProfile } = useBankProfile()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [selectedIdx, setSelectedIdx] = React.useState(0)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const items = React.useMemo(() => {
        const source = role === "admin" ? ADMIN_COMMANDS : CLIENT_COMMANDS
        const mods = activeProfile.enabledModules
        return source.filter((item) => !item.moduleKey || mods[item.moduleKey])
    }, [role, activeProfile.enabledModules])

    const filtered = React.useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return items
        return items.filter(
            (i) =>
                i.label.toLowerCase().includes(q) ||
                i.hint.toLowerCase().includes(q) ||
                i.group.toLowerCase().includes(q) ||
                (i.keywords || "").toLowerCase().includes(q)
        )
    }, [items, query])

    React.useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
                e.preventDefault()
                setOpen((prev) => !prev)
            } else if (e.key === "Escape") {
                setOpen(false)
            }
        }
        window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [])

    React.useEffect(() => {
        if (open) {
            setQuery("")
            setSelectedIdx(0)
            setTimeout(() => inputRef.current?.focus(), 40)
        }
    }, [open])

    React.useEffect(() => {
        setSelectedIdx(0)
    }, [query])

    const handleSelect = (href: string) => {
        setOpen(false)
        router.push(href)
    }

    const handleKeyNav = (e: React.KeyboardEvent) => {
        if (e.key === "ArrowDown") {
            e.preventDefault()
            setSelectedIdx((prev) => Math.min(filtered.length - 1, prev + 1))
        } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setSelectedIdx((prev) => Math.max(0, prev - 1))
        } else if (e.key === "Enter" && filtered[selectedIdx]) {
            e.preventDefault()
            handleSelect(filtered[selectedIdx].href)
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="group inline-flex items-center gap-2 h-9 px-3 rounded-full border border-border/80 bg-muted/40 hover:bg-muted/80 hover:border-primary/30 text-muted-foreground hover:text-foreground transition-all text-xs font-medium"
                aria-label="Open Command Palette"
            >
                <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="hidden lg:inline">Quick jump...</span>
                <kbd className="hidden md:inline-flex items-center gap-0.5 rounded-md bg-background border border-border px-1.5 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                    ⌘K
                </kbd>
            </button>

            {open && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4">
                    <div
                        className="fixed inset-0 bg-background/70 backdrop-blur-md animate-in fade-in duration-150"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        onKeyDown={handleKeyNav}
                        className="relative z-10 w-full max-w-xl rounded-2xl border border-border/90 bg-card/95 backdrop-blur-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
                    >
                        <div className="flex items-center gap-3 px-4 h-14 border-b border-border/70">
                            <Search className="h-4 w-4 text-primary shrink-0" />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder={`Search ${activeProfile.shortName} ${role === "admin" ? "operations, ledgers & tools" : "accounts, transfers & modules"}...`}
                                className="flex-1 bg-transparent text-sm font-medium outline-none placeholder:text-muted-foreground/70"
                            />
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-1">
                            {filtered.length === 0 ? (
                                <div className="py-10 text-center text-xs text-muted-foreground">
                                    No matching views or actions for &ldquo;{query}&rdquo;.
                                </div>
                            ) : (
                                filtered.map((item, idx) => {
                                    const Icon = item.icon
                                    const isSel = idx === selectedIdx
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onMouseEnter={() => setSelectedIdx(idx)}
                                            onClick={() => handleSelect(item.href)}
                                            className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
                                                isSel
                                                    ? "bg-primary/10 text-foreground"
                                                    : "text-muted-foreground hover:bg-muted/60"
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div
                                                    className={`size-8 rounded-lg flex items-center justify-center shrink-0 border ${
                                                        isSel
                                                            ? "bg-primary text-primary-foreground border-primary"
                                                            : "bg-background border-border text-muted-foreground"
                                                    }`}
                                                >
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={`text-xs font-bold truncate ${isSel ? "text-foreground" : "text-foreground/90"}`}>
                                                        {item.label}
                                                    </p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{item.hint}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className="hidden sm:inline text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                                    {item.group}
                                                </span>
                                                <ArrowRight className={`h-3.5 w-3.5 transition-transform ${isSel ? "text-primary translate-x-0.5" : "opacity-30"}`} />
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>

                        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/70 bg-muted/30 text-[10px] text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                                <Sparkles className="h-3 w-3 text-primary" /> {activeProfile.legalName}
                            </span>
                            <span className="hidden sm:inline font-mono">↑↓ navigate · ↵ open · esc close</span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
