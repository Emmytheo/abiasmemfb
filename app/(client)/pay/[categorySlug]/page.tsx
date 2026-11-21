import Link from "next/link"
import { api } from "@/lib/api"
import { ArrowLeft, Layers, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BankPageHeader } from "@/components/banking/page-header"
import { ServiceSelectionView } from "@/components/service-selection-view"
import { TransferTabs } from "../transfer/transfer-tabs"
import { BillPaymentsWorkspace } from "@/components/banking/bill-payments-workspace"

export const dynamic = "force-dynamic"

const BILL_ALIASES = new Set(["bills", "utilities", "pay-bills", "bill-payments", "e-pins", "airtime", "cable"])

export default async function DynamicServiceCategoryPage({
    params,
    searchParams,
}: {
    params: Promise<{ categorySlug: string }>
    searchParams: Promise<{ filter?: string }>
}) {
    const { categorySlug } = await params
    const { filter } = await searchParams
    const normalized = String(categorySlug || "").trim().toLowerCase()

    const allCategories = await api.getServiceCategories().catch(() => [])
    const activeCategories = allCategories.filter((c) => c.status !== "inactive")

    // Resolve exact slug first, then active alias fallback (never silently bounce back to /client-dashboard!)
    const currentCategory =
        activeCategories.find((c) => c.slug.toLowerCase() === normalized) ||
        allCategories.find((c) => c.slug.toLowerCase() === normalized) ||
        (BILL_ALIASES.has(normalized)
            ? activeCategories.find(
                  (c) =>
                      c.slug.toLowerCase().includes("bill") ||
                      c.slug.toLowerCase().includes("utilit")
              ) || {
                  id: "bills-default",
                  name: "Bill Payments & Utilities",
                  slug: "bills",
                  description: "Pay electricity, airtime, mobile data, cable TV, and IGR levies instantly.",
                  icon: "lightbulb",
                  status: "active" as const,
                  ui_layout: "default" as const,
                  created_at: new Date().toISOString(),
              }
            : normalized.includes("transfer")
              ? activeCategories.find((c) => c.slug.toLowerCase().includes("transfer"))
              : null)

    const isBillsRoute =
        BILL_ALIASES.has(normalized) ||
        Boolean(currentCategory?.slug?.toLowerCase().includes("bill")) ||
        Boolean(currentCategory?.name?.toLowerCase().includes("bill"))

    const services = currentCategory
        ? await api.getServicesByCategory(currentCategory.slug).catch(() => [])
        : []

    return (
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-4 space-y-6 animate-in fade-in duration-500">
            <BankPageHeader
                badge={isBillsRoute ? "Utility & Biller Settlement" : "Service Rail"}
                livePill={isBillsRoute ? "Instant GL Clearing" : `${services.length} Active Services`}
                title={currentCategory?.name || "Services & Bill Payments"}
                subtitle={
                    currentCategory?.description ||
                    "Execute instant utility bill payments, transfers, and configured banking services from your NUBAN account."
                }
                actions={
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
                            <Link href="/pay">
                                <ArrowLeft className="h-4 w-4 mr-1.5" /> Services Hub
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold">
                            <Link href="/pay/fund">
                                <Wallet className="h-4 w-4 mr-1.5" /> Fund Account
                            </Link>
                        </Button>
                    </div>
                }
            />

            {/* Category Switcher Pills */}
            {activeCategories.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    {activeCategories.map((cat) => {
                        const active = cat.slug.toLowerCase() === currentCategory?.slug?.toLowerCase()
                        return (
                            <Link
                                key={cat.id}
                                href={`/pay/${cat.slug}`}
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                    active
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                }`}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                {cat.name}
                            </Link>
                        )
                    })}
                </div>
            )}

            {currentCategory?.ui_layout === "transfer_tabs" ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 border-r border-border/60 pr-6 hidden lg:block space-y-3">
                        <p className="text-sm font-black">Transfer Services</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Choose Intra-Bank, NIP Interbank, or SWIFT wire transfer tabs on the right, or switch to the{" "}
                            <Link href="/client-dashboard/transfers" className="text-primary font-bold hover:underline">
                                Express Atomic Transfer Desk →
                            </Link>
                        </p>
                    </div>
                    <div className="lg:col-span-2">
                        <TransferTabs services={services} />
                    </div>
                </div>
            ) : isBillsRoute ? (
                <div className="space-y-8">
                    {/* Primary Instant Bill Payments Workspace (Airtime, Data, Electricity, Cable, IGR) */}
                    <BillPaymentsWorkspace initialFilter={filter || "all"} />

                    {/* Configured Dynamic CMS Workflow Services (if any additional custom services are active) */}
                    {services.length > 0 && currentCategory && (
                        <div className="pt-6 border-t border-border/70 space-y-3">
                            <div>
                                <h2 className="text-base font-black tracking-tight">
                                    Workflow-Driven Custom Services ({services.length})
                                </h2>
                                <p className="text-xs text-muted-foreground">
                                    Additional dynamic billers configured in BankSuite Service Management.
                                </p>
                            </div>
                            <ServiceSelectionView category={currentCategory} services={services} />
                        </div>
                    )}
                </div>
            ) : currentCategory ? (
                <ServiceSelectionView category={currentCategory} services={services} />
            ) : (
                <BillPaymentsWorkspace />
            )}
        </div>
    )
}
