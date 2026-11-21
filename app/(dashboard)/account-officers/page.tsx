"use client"

import * as React from "react"
import { api, AccountOfficer, User } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    RefreshCw,
    UserCheck,
    ShieldAlert,
    UserSquare2,
    Link2,
    Ghost,
    Search,
    Building2,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { StaffLinkDialog } from "@/components/dashboard/StaffLinkDialog"
import { useBankProfile } from "@/context/bank-profile-context"
import { BankPageHeader } from "@/components/banking/page-header"

export default function AccountOfficersPage() {
    const { activeProfile } = useBankProfile()
    const [data, setData] = React.useState<AccountOfficer[]>([])
    const [users, setUsers] = React.useState<User[]>([])
    const [loading, setLoading] = React.useState(true)
    const [isSyncing, setIsSyncing] = React.useState(false)
    const [search, setSearch] = React.useState("")
    const [selectedOfficer, setSelectedOfficer] = React.useState<AccountOfficer | null>(null)
    const [isLinkDialogOpen, setIsLinkDialogOpen] = React.useState(false)

    const loadData = React.useCallback(async () => {
        setLoading(true)
        try {
            const [officers, allUsers] = await Promise.all([
                api.getAllAccountOfficers(),
                api.getAllUsers(),
            ])
            setData(officers)
            setUsers(allUsers)
        } catch {
            toast.error("Failed to load staff records.")
        } finally {
            setLoading(false)
        }
    }, [])

    React.useEffect(() => {
        loadData()
    }, [loadData])

    const handleSync = async () => {
        setIsSyncing(true)
        toast.info("Establishing Account Officer Sync Stream...", {
            description: "Connecting to Core Banking staff registry.",
        })

        const eventSource = new EventSource("/api/sync/officers/stream")
        eventSource.onmessage = (event) => {
            try {
                const log = JSON.parse(event.data)
                if (log.type === "success") {
                    toast.success("Staff sync complete.")
                    loadData()
                    eventSource.close()
                    setIsSyncing(false)
                }
            } catch {}
        }
        eventSource.onerror = () => {
            eventSource.close()
            setIsSyncing(false)
            toast.error("Officer sync stream disconnected.")
        }
    }

    const getLinkedUser = (userId?: string) => (userId ? users.find((u) => u.id === userId) : null)

    const linkedCount = data.filter((o) => Boolean(getLinkedUser(o.linked_user_id))).length
    const unlinkedCount = data.length - linkedCount

    const filtered = React.useMemo(() => {
        const q = search.trim().toLowerCase()
        if (!q) return data
        return data.filter(
            (o) =>
                String(o.name || "").toLowerCase().includes(q) ||
                String(o.code || "").toLowerCase().includes(q) ||
                String(o.branch || "").toLowerCase().includes(q) ||
                String(o.email || "").toLowerCase().includes(q)
        )
    }, [data, search])

    return (
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-6 space-y-6 pb-12">
            <BankPageHeader
                badge="Branch Operations & Relationship Officers"
                livePill={`${linkedCount} Linked · ${unlinkedCount} Shadow`}
                liveTone={unlinkedCount > 0 ? "amber" : "emerald"}
                title="Account Officers & Staff Registry"
                subtitle={`Associate core banking relationship officers with digital ${activeProfile.shortName} administrator profiles for branch origination, credit attribution, and audit accountability.`}
                actions={
                    <>
                        <Button variant="outline" size="sm" onClick={loadData} className="h-9 rounded-xl font-bold text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                        </Button>
                        <Button size="sm" onClick={handleSync} disabled={isSyncing} className="h-9 rounded-xl font-black text-xs gap-1.5">
                            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
                            {isSyncing ? "Syncing..." : "Sync Core Officers"}
                        </Button>
                    </>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Account Officers", value: data.length, sub: "Synced core staff profiles", icon: UserSquare2, tone: "bg-primary/10 text-primary" },
                    { label: "Linked Digital Admins", value: linkedCount, sub: "Active portal access bound", icon: UserCheck, tone: "bg-emerald-500/10 text-emerald-600" },
                    { label: "Unlinked Shadow Records", value: unlinkedCount, sub: "Awaiting portal association", icon: ShieldAlert, tone: "bg-amber-500/10 text-amber-600" },
                ].map((k, idx) => (
                    <div key={idx} className="bg-card border border-border/80 rounded-3xl p-5 shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</span>
                            <div className={`p-2 rounded-xl ${k.tone}`}><k.icon className="h-4 w-4" /></div>
                        </div>
                        <p className="text-2xl sm:text-3xl font-black tabular-nums-fintech">{k.value}</p>
                        <p className="text-[11px] text-muted-foreground font-medium">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="bg-card border border-border/80 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-border/70 flex items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="h-4 w-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search staff name, officer code, or branch..."
                            className="pl-10 h-10 rounded-xl bg-background"
                        />
                    </div>
                    <Badge variant="outline" className="text-[10px] font-bold">{filtered.length} officers</Badge>
                </div>

                {loading ? (
                    <div className="py-16 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading staff directory...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-14 text-center text-sm text-muted-foreground">No account officers matched your query.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-muted/40 border-b text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                                <tr>
                                    <th className="px-5 py-3.5">Officer &amp; Code</th>
                                    <th className="px-5 py-3.5">Branch / Unit</th>
                                    <th className="px-5 py-3.5">Digital Portal Link</th>
                                    <th className="px-5 py-3.5 text-right">Association</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60">
                                {filtered.map((item) => {
                                    const linkedUser = getLinkedUser(item.linked_user_id)
                                    return (
                                        <tr key={item.id} className="hover:bg-muted/25">
                                            <td className="px-5 py-3.5">
                                                <p className="font-bold text-foreground">{item.name}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.code}</p>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <p className="font-semibold flex items-center gap-1.5">
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {item.branch || `${activeProfile.shortName} HQ`}
                                                </p>
                                                {item.email && <p className="text-[11px] text-muted-foreground">{item.email}</p>}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                {linkedUser ? (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-black text-[10px]">
                                                        <UserCheck className="h-3 w-3 mr-1" /> {linkedUser.full_name}
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 font-black text-[10px]">
                                                        <Ghost className="h-3 w-3 mr-1" /> Unlinked
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOfficer(item)
                                                        setIsLinkDialogOpen(true)
                                                    }}
                                                    className="h-8 rounded-xl text-[11px] font-bold gap-1.5"
                                                >
                                                    <Link2 className="h-3.5 w-3.5" />
                                                    {item.linked_user_id ? "Change Link" : "Link Admin"}
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

            <StaffLinkDialog
                officer={selectedOfficer}
                isOpen={isLinkDialogOpen}
                onClose={() => setIsLinkDialogOpen(false)}
                onSuccess={loadData}
            />
        </div>
    )
}
