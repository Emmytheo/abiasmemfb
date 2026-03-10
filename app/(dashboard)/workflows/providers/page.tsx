import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
    Building2, Shield, Activity, Globe,
    ChevronRight
} from 'lucide-react'
import { ProviderActions } from './client-actions'
import { ProviderEditor } from './provider-editor'

export default async function ProvidersManagerPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const { id: selectedId } = await searchParams
    const payload = await getPayload({ config })

    const [providersRes, secretsRes] = await Promise.all([
        payload.find({ collection: 'service-providers', sort: '-updatedAt' }),
        payload.find({ collection: 'secrets', sort: '-updatedAt' })
    ])

    const providers = providersRes.docs as any[]
    const secrets = secretsRes.docs as any[]

    const selectedProvider = selectedId
        ? providers.find(p => String(p.id) === String(selectedId))
        : providers[0]

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden bg-muted/30">

            {/* LEFT PANEL: Provider List */}
            <aside className="w-80 border-r bg-background flex flex-col shrink-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold tracking-tight">Providers</h2>
                        <p className="text-xs text-muted-foreground">Manage API integrations</p>
                    </div>
                    <ProviderActions />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {providers.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground italic">No providers added yet.</div>
                    ) : (
                        providers.map((p) => {
                            const isActive = p.id === selectedProvider?.id
                            return (
                                <Link
                                    key={p.id}
                                    href={`/workflows/providers?id=${p.id}`}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-background' : 'bg-muted'}`}>
                                        <Building2 size={16} className={isActive ? 'text-primary' : 'text-muted-foreground'} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium text-sm truncate">{p.name}</div>
                                        <div className="text-xs opacity-70 truncate">{p.baseUrl}</div>
                                    </div>
                                    {p.isActive ? (
                                        <div className="w-2 h-2 rounded-full bg-green-500" title="Active" />
                                    ) : (
                                        <div className="w-2 h-2 rounded-full bg-muted-foreground" title="Inactive" />
                                    )}
                                </Link>
                            )
                        })
                    )}
                </div>

                <div className="p-4 border-t bg-muted/20">
                    <Link href="/workflows/vault" className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary transition-colors group text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Shield size={16} className="text-amber-500" />
                            Secret Vault
                        </div>
                        <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </aside>

            {/* CENTER PANEL: Configuration Editor */}
            <main className="flex-1 flex flex-col border-r bg-background overflow-hidden relative">
                {selectedId === 'new' ? (
                    <ProviderEditor key="new" secrets={secrets} />
                ) : !selectedProvider ? (
                    <div className="m-auto text-center flex flex-col items-center">
                        <Globe className="text-muted-foreground/30 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-muted-foreground">Select a Provider</h3>
                    </div>
                ) : (
                    <ProviderEditor key={selectedProvider.id} provider={selectedProvider} secrets={secrets} />
                )}
            </main>

            {/* RIGHT PANEL: Status & Health */}
            <aside className="w-80 bg-background flex flex-col shrink-0">
                {selectedProvider ? (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Activity size={16} /> Status & Health
                            </h3>
                        </div>
                        <div className="p-4 space-y-6 overflow-y-auto">
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Current State</div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${selectedProvider.isActive ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
                                    <span className="font-medium">{selectedProvider.isActive ? 'Active (Routing Traffic)' : 'Inactive / Offline'}</span>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Performance Priority</div>
                                <div className="text-2xl font-bold font-mono">#{selectedProvider.priority || 1}</div>
                                <p className="text-xs text-muted-foreground mt-1">In group "{selectedProvider.groupTag}"</p>
                            </div>

                            {selectedProvider.healthCheckEndpoint && (
                                <div className="border rounded-md p-3 bg-muted/20">
                                    <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Health Probe</div>
                                    <div className="text-xs font-mono break-all bg-background border p-2 rounded">{selectedProvider.healthCheckEndpoint}</div>
                                    <button className="mt-3 w-full py-1.5 bg-secondary text-secondary-foreground text-xs font-medium rounded hover:bg-secondary/80">
                                        Run Diagnostic Ping
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground m-auto">
                        Select a provider to view stats
                    </div>
                )}
            </aside>

        </div>
    )
}
