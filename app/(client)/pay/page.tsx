import Link from "next/link"
import { api } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Lightbulb,
    Hash,
    Tag,
    Send,
    Wallet,
    Tv,
    ArrowRight,
    Zap,
} from "lucide-react"
import { BankPageHeader } from "@/components/banking/page-header"
import { BillPaymentsWorkspace } from "@/components/banking/bill-payments-workspace"

export const dynamic = "force-dynamic"

export default async function ExploreServicesPage() {
    const categories = await api.getServiceCategories().catch(() => [])
    const activeCategories = categories.filter((c) => c.status !== "inactive")
    const billsSlug =
        activeCategories.find((c) => c.slug.toLowerCase().includes("bill"))?.slug || "bills"
    const transfersSlug =
        activeCategories.find((c) => c.slug.toLowerCase().includes("transfer"))?.slug || "transfers"

    const quickRails = [
        {
            title: "Electricity & Utilities",
            description: "EEDC, Aba Power, IKEDC prepaid tokens & state levies",
            href: `/pay/${billsSlug}?filter=electricity`,
            icon: Zap,
            tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
        },
        {
            title: "Airtime & Mobile Data",
            description: "MTN, Airtel, Glo & 9mobile instant VTU & bundles",
            href: `/pay/${billsSlug}?filter=airtime`,
            icon: Hash,
            tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
        },
        {
            title: "Cable TV & Subscriptions",
            description: "DStv, GOtv & Startimes instant renewal",
            href: `/pay/${billsSlug}?filter=cable`,
            icon: Tv,
            tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
        },
        {
            title: "Transfers & Remittances",
            description: "Intra-bank, NIP Interbank & SWIFT wires",
            href: "/client-dashboard/transfers",
            icon: Send,
            tone: "bg-primary/10 text-primary",
        },
    ]

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-8 animate-in fade-in duration-500">
            <BankPageHeader
                badge="Payments & Utilities Hub"
                livePill="Instant Settlement Active"
                title="Services & Bill Payments"
                subtitle="Pay electricity, airtime, mobile data, cable TV, and IGR levies directly from your NUBAN account with instant Double-Entry GL settlement."
                actions={
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
                            <Link href="/pay/fund">
                                <Wallet className="h-4 w-4 mr-1.5" /> Fund Account
                            </Link>
                        </Button>
                        <Button asChild size="sm" className="rounded-xl font-bold">
                            <Link href={`/pay/${transfersSlug}`}>
                                <Send className="h-4 w-4 mr-1.5" /> Send Money
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* Quick Category Rail Cards — ALL real clickable links */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {quickRails.map((rail) => {
                    const Icon = rail.icon
                    return (
                        <Link key={rail.title} href={rail.href} className="group block">
                            <Card className="h-full border-border/80 rounded-2xl hover:border-primary/50 hover:shadow-md transition-all">
                                <CardHeader className="p-5 pb-3">
                                    <div className={`size-11 rounded-2xl flex items-center justify-center mb-3 transition-transform group-hover:scale-105 ${rail.tone}`}>
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <CardTitle className="text-base font-black flex items-center justify-between">
                                        {rail.title}
                                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                                    </CardTitle>
                                    <CardDescription className="text-xs leading-relaxed">
                                        {rail.description}
                                    </CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    )
                })}
            </div>

            {/* Active CMS Service Categories strip */}
            {activeCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground mr-1">
                        Configured Rails:
                    </span>
                    {activeCategories.map((cat) => (
                        <Link
                            key={cat.id}
                            href={`/pay/${cat.slug}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-card border border-border hover:border-primary/50 text-xs font-bold transition-colors"
                        >
                            <Tag className="h-3 w-3 text-primary" />
                            {cat.name}
                        </Link>
                    ))}
                </div>
            )}

            {/* Embedded Instant Bill Payments Checkout */}
            <BillPaymentsWorkspace />
        </div>
    )
}
