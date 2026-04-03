import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
    Shield, Activity, Globe, ChevronRight, Plug, Lock, CheckCircle2, XCircle, ArrowLeft, Info
} from 'lucide-react'
import { ProviderActions } from './client-actions'
import { ProviderEditor } from './provider-editor'

const CATEGORY_COLORS: Record<string, string> = {
    PAYMENT: 'bg-blue-500',
    SMS: 'bg-purple-500',
    EMAIL: 'bg-indigo-500',
    KYC: 'bg-amber-500',
    CREDIT_BUREAU: 'bg-rose-500',
    WEBHOOK: 'bg-teal-500',
    CUSTOM: 'bg-muted-foreground',
}

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-blue-600 dark:text-blue-400',
    POST: 'text-green-600 dark:text-green-400',
    PUT: 'text-amber-600 dark:text-amber-400',
    PATCH: 'text-orange-500',
    DELETE: 'text-red-600 dark:text-red-400',
}

export default async function ProvidersManagerPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const { id: selectedId } = await searchParams
    const payload = await getPayload({ config })

    const [providersRes, secretsRes, endpointsRes] = await Promise.all([
        payload.find({ collection: 'service-providers', sort: 'priority', limit: 200 }),
        payload.find({ collection: 'secrets', sort: '-updatedAt', limit: 200 }),
        payload.find({ collection: 'endpoints', sort: 'name', limit: 500, depth: 0 }),
    ])

    const providers = providersRes.docs as any[]
    const secrets = secretsRes.docs as any[]
    const endpoints = endpointsRes.docs as any[]

    const endpointsByProvider: Record<string, any[]> = {}
    for (const ep of endpoints) {
        const pid = String(typeof ep.provider === 'object' ? ep.provider?.id : ep.provider)
        if (!endpointsByProvider[pid]) endpointsByProvider[pid] = []
        endpointsByProvider[pid].push(ep)
    }

    const selectedProvider = selectedId
        ? providers.find(p => String(p.id) === String(selectedId))
        : undefined  // on mobile, don't auto-select — stay on list

    const selectedEndpoints = selectedProvider
        ? (endpointsByProvider[String(selectedProvider.id)] ?? [])
        : []

    const isDetailView = !!selectedId // mobile: are we in detail mode?

    return (
        /**
         * Layout strategy:
         * mobile  — full-screen list OR full-screen editor (never both)
         * md      — 2-panel: list (fixed) + editor (flex)
         * lg      — 3-panel: list + editor + info panel
         */
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden bg-muted/30">

            {/* ── LEFT: Provider List ──────────────────────────────────
                On mobile: full width, hidden when a provider is selected.
                On md+: fixed-width sidebar, always visible.
            ──────────────────────────────────────────────────────── */}
            <aside className={`
                flex flex-col bg-background border-r
                w-full md:w-64 lg:w-72 shrink-0
                ${isDetailView ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold tracking-tight">Service Providers</h2>
                        <p className="text-xs text-muted-foreground">{providers.length} integration{providers.length !== 1 ? 's' : ''}</p>
                    </div>
                    <ProviderActions />
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                    {providers.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground italic">
                            No providers yet.<br />Run bootstrap or add one manually.
                        </div>
                    ) : providers.map((p) => {
                        const isSelected = String(p.id) === String(selectedId)
                        const epCount = endpointsByProvider[String(p.id)]?.length ?? 0
                        const catColor = CATEGORY_COLORS[p.category] ?? CATEGORY_COLORS.CUSTOM
                        return (
                            <Link
                                key={p.id}
                                href={`/workflows/providers?id=${p.id}`}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-all border ${
                                    isSelected
                                        ? 'bg-primary/8 border-primary/20 shadow-sm'
                                        : 'border-transparent hover:bg-muted hover:border-border'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${catColor}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-primary' : ''}`}>
                                            {p.name}
                                        </span>
                                        {p.isActive
                                            ? <CheckCircle2 size={13} className="text-green-500 shrink-0" />
                                            : <XCircle size={13} className="text-muted-foreground/50 shrink-0" />
                                        }
                                    </div>
                                    <div className="font-mono text-[10px] text-muted-foreground truncate mt-0.5">{p.baseUrl}</div>
                                    <div className="flex items-center gap-2 mt-1.5">
                                        <span className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded">{p.authType}</span>
                                        <span className="text-[10px] text-muted-foreground">{epCount} endpoint{epCount !== 1 ? 's' : ''}</span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-muted-foreground/50 shrink-0 mt-1 md:hidden" />
                            </Link>
                        )
                    })}
                </div>

                <div className="p-3 border-t bg-muted/20">
                    <Link href="/workflows/vault" className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors group text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Shield size={15} className="text-amber-500" />
                            Secret Vault
                        </div>
                        <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </aside>

            {/* ── CENTER: Editor ───────────────────────────────────────
                On mobile: full screen when a provider is selected.
                On md+: flex-1, always visible (shows empty state if nothing selected).
            ──────────────────────────────────────────────────────── */}
            <main className={`
                flex-col border-r bg-background overflow-hidden
                w-full md:flex-1
                ${isDetailView ? 'flex' : 'hidden md:flex'}
            `}>
                {/* Mobile back button */}
                {isDetailView && (
                    <div className="flex items-center gap-3 px-4 h-12 border-b bg-background md:hidden shrink-0">
                        <Link
                            href="/workflows/providers"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} />
                            All Providers
                        </Link>
                        {selectedProvider && (
                            <span className="text-sm font-medium text-foreground truncate">{selectedProvider.name}</span>
                        )}
                    </div>
                )}

                {selectedId === 'new' ? (
                    <ProviderEditor key="new" secrets={secrets} />
                ) : !selectedProvider ? (
                    <div className="m-auto text-center flex flex-col items-center gap-3 text-muted-foreground p-8">
                        <Plug size={40} className="opacity-20" />
                        <div>
                            <p className="font-medium text-foreground">No provider selected</p>
                            <p className="text-sm mt-1">Pick one from the list or add a new integration.</p>
                        </div>
                    </div>
                ) : (
                    <ProviderEditor key={selectedProvider.id} provider={selectedProvider} secrets={secrets} />
                )}
            </main>

            {/* ── RIGHT: Info Panel ────────────────────────────────────
                Hidden on mobile and tablet (md). Shown only on lg+.
                Info is accessible on mobile via the editor's metadata section.
            ──────────────────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-72 bg-background flex-col shrink-0 overflow-hidden">
                {selectedProvider ? (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Info size={15} /> Provider Details
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* Status */}
                            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${selectedProvider.isActive ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                                    {selectedProvider.isActive ? 'Active' : 'Inactive'}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                    #{selectedProvider.priority ?? 1}
                                    {selectedProvider.groupTag ? ` · ${selectedProvider.groupTag}` : ''}
                                </div>
                            </div>

                            {/* Auth */}
                            <div>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Authentication</div>
                                <div className="flex items-center gap-2 p-2.5 bg-muted/30 rounded-md border">
                                    <Lock size={13} className="text-amber-500 shrink-0" />
                                    <span className="text-sm font-mono">{selectedProvider.authType}</span>
                                    {typeof selectedProvider.secret === 'object' && selectedProvider.secret?.name && (
                                        <span className="ml-auto text-[10px] font-mono text-muted-foreground truncate">{selectedProvider.secret.name}</span>
                                    )}
                                </div>
                            </div>

                            {/* Metadata */}
                            {selectedProvider.metadata && Object.keys(selectedProvider.metadata).length > 0 && (
                                <div>
                                    <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Metadata</div>
                                    <div className="space-y-1">
                                        {Object.entries(selectedProvider.metadata as Record<string, any>).map(([key, val]) => (
                                            <div key={key} className="flex items-center justify-between gap-2 bg-muted/30 rounded px-2 py-1.5">
                                                <span className="font-mono text-[10px] text-muted-foreground shrink-0">{key}</span>
                                                <span className="font-mono text-[10px] text-foreground truncate text-right max-w-[110px]">{String(val)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Endpoints */}
                            <div>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                    <span>Endpoints</span>
                                    <span className="bg-muted rounded-full px-1.5 py-0.5 font-mono text-[10px]">{selectedEndpoints.length}</span>
                                </div>
                                {selectedEndpoints.length === 0 ? (
                                    <p className="text-xs text-muted-foreground italic">No endpoints linked. Run bootstrap to provision.</p>
                                ) : (
                                    <div className="space-y-0.5">
                                        {selectedEndpoints.slice(0, 14).map((ep: any) => (
                                            <Link
                                                key={ep.id}
                                                href={`/endpoints/${ep.id}`}
                                                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted transition-colors group"
                                            >
                                                <span className={`font-mono text-[10px] font-bold w-10 shrink-0 ${METHOD_COLORS[ep.method] ?? 'text-muted-foreground'}`}>
                                                    {ep.method}
                                                </span>
                                                <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors">
                                                    {ep.name}
                                                </span>
                                            </Link>
                                        ))}
                                        {selectedEndpoints.length > 14 && (
                                            <Link href={`/endpoints`} className="text-[11px] text-primary hover:underline pl-2 block mt-1">
                                                +{selectedEndpoints.length - 14} more →
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="m-auto p-6 text-center text-sm text-muted-foreground">
                        <Activity size={28} className="mx-auto mb-2 opacity-20" />
                        Select a provider
                    </div>
                )}
            </aside>
        </div>
    )
}
