import { Suspense } from "react";
import { GlobalContentTable } from "@/components/dashboard/content/global-content-table";
import { Globe, LayoutTemplate, Settings2 } from "lucide-react";
import Link from "next/link";

function ContentStat({ icon: Icon, label, value, color }: any) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:border-primary/30 transition-all group">
            <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform shrink-0`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-2xl font-bold tracking-tight">{value}</p>
                <p className="text-sm text-muted-foreground font-medium">{label}</p>
            </div>
        </div>
    );
}

export default function GlobalContentPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 sm:p-4 md:p-8">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">Site Administration</p>
                    <h1 className="text-3xl font-black tracking-tight">Global Content</h1>
                    <p className="text-muted-foreground mt-1 max-w-xl">
                        Manage banners, hero text, CTAs, and all configurable content zones across the public website.
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Link
                        href="/admin/globals"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-muted border border-border text-foreground rounded-xl font-semibold text-sm hover:bg-muted/80 transition-all duration-200"
                    >
                        <Settings2 className="h-4 w-4" />
                        Open in CMS
                    </Link>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <ContentStat icon={Globe} label="Active Globals" value="5" color="bg-primary/10 text-primary" />
                <ContentStat icon={LayoutTemplate} label="Page Layouts" value="3" color="bg-violet-500/10 text-violet-500" />
                <ContentStat icon={Settings2} label="Config Keys" value="12+" color="bg-amber-500/10 text-amber-500" />
            </div>

            {/* Globals table - this is a fully async server component */}
            <Suspense fallback={
                <div className="bg-card border rounded-2xl overflow-hidden">
                    <div className="p-6 border-b space-y-2">
                        <div className="h-6 w-48 bg-muted/50 rounded-lg animate-pulse" />
                        <div className="h-4 w-72 bg-muted/30 rounded-lg animate-pulse" />
                    </div>
                    <div className="p-6 space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-16 bg-muted/20 rounded-xl animate-pulse" />
                        ))}
                    </div>
                </div>
            }>
                <GlobalContentTable />
            </Suspense>

            {/* Page Builder Section */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-5 border-b border-border bg-muted/10">
                    <h2 className="text-lg font-bold">Page Builder</h2>
                    <p className="text-sm text-muted-foreground">Create and manage CMS-driven page layouts using the Block editor.</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                        { title: "Homepage", slug: "home", description: "Hero section, stats, features, and CTA sections.", href: "/admin/collections/pages" },
                        { title: "About Page", slug: "about", description: "Company background and leadership content.", href: "/admin/collections/pages" },
                        { title: "Contact Page", slug: "contact", description: "Contact details and form content.", href: "/admin/collections/pages" },
                    ].map((page) => (
                        <div key={page.slug} className="border border-border rounded-xl p-5 hover:border-primary/30 hover:bg-muted/10 transition-all group">
                            <div className="flex items-start justify-between mb-3">
                                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                    <LayoutTemplate className="h-4 w-4" />
                                </div>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-xs font-semibold border border-emerald-200/50">Live</span>
                            </div>
                            <h3 className="font-bold text-foreground mb-1">{page.title}</h3>
                            <p className="text-xs text-muted-foreground mb-4">{page.description}</p>
                            <Link
                                href={page.href}
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                            >
                                Edit in CMS →
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
