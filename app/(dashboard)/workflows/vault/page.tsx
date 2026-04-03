import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Shield, Clock, Fingerprint, Key, AlertTriangle, ChevronRight, ArrowLeft, CheckCircle2, RefreshCw } from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { VaultActions } from './client-actions'
import { VaultEditor } from './vault-editor'

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
    API_KEY:        { bg: 'bg-blue-500/10',   text: 'text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500' },
    QORE_API_TOKEN: { bg: 'bg-amber-500/10',  text: 'text-amber-600 dark:text-amber-400', dot: 'bg-amber-500' },
    SMTP:           { bg: 'bg-purple-500/10', text: 'text-purple-600',                    dot: 'bg-purple-500' },
    OAUTH_TOKEN:    { bg: 'bg-green-500/10',  text: 'text-green-600',                     dot: 'bg-green-500' },
    DATABASE_URI:   { bg: 'bg-rose-500/10',   text: 'text-rose-600',                      dot: 'bg-rose-500' },
    WEBHOOK_SECRET: { bg: 'bg-teal-500/10',   text: 'text-teal-600',                      dot: 'bg-teal-500' },
    CUSTOM:         { bg: 'bg-muted',         text: 'text-muted-foreground',               dot: 'bg-muted-foreground' },
}

export default async function SecretVaultPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const { id: selectedId } = await searchParams
    const payload = await getPayload({ config })

    const [secretsRes, providersRes] = await Promise.all([
        payload.find({ collection: 'secrets', sort: '-updatedAt', limit: 200 }),
        payload.find({ collection: 'service-providers', limit: 200, depth: 0 }),
    ])

    const secrets = secretsRes.docs as any[]
    const providers = providersRes.docs as any[]

    // Build "used by" map: secretId → provider names
    const usedByMap: Record<string, string[]> = {}
    for (const p of providers) {
        const sid = String(typeof p.secret === 'object' ? p.secret?.id : p.secret)
        if (sid && sid !== 'undefined') {
            if (!usedByMap[sid]) usedByMap[sid] = []
            usedByMap[sid].push(p.name)
        }
    }

    const selectedSecret = selectedId
        ? secrets.find(s => String(s.id) === String(selectedId))
        : undefined

    const isDetailView = !!selectedId
    const now = new Date()

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden bg-muted/30">

            {/* ── LEFT: Secret List ────────────────────────────────────
                Mobile: full-width list, hidden when a secret is selected
                md+: fixed sidebar, always visible
            ──────────────────────────────────────────────────────── */}
            <aside className={`
                flex flex-col bg-background border-r
                w-full md:w-64 lg:w-72 shrink-0
                ${isDetailView ? 'hidden md:flex' : 'flex'}
            `}>
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield size={18} className="text-amber-500" />
                        <div>
                            <h2 className="font-semibold tracking-tight leading-none">Secret Vault</h2>
                            <p className="text-xs text-muted-foreground mt-0.5">{secrets.length} credential{secrets.length !== 1 ? 's' : ''} stored</p>
                        </div>
                    </div>
                    <VaultActions />
                </div>

                <div className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                    {secrets.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground italic">
                            Vault is empty.<br />Add your first secret to get started.
                        </div>
                    ) : secrets.map((s) => {
                        const isSelected = String(s.id) === String(selectedId)
                        const style = CATEGORY_STYLES[s.category] ?? CATEGORY_STYLES.CUSTOM
                        const isExpired = s.expiresAt && isPast(new Date(s.expiresAt))
                        const expiresDistance = s.expiresAt ? formatDistanceToNow(new Date(s.expiresAt), { addSuffix: true }) : null
                        const usedBy = usedByMap[String(s.id)] ?? []

                        return (
                            <Link
                                key={s.id}
                                href={`/workflows/vault?id=${s.id}`}
                                className={`flex items-start gap-3 p-3 rounded-lg transition-all border ${
                                    isSelected
                                        ? 'bg-amber-500/8 border-amber-500/20 shadow-sm'
                                        : 'border-transparent hover:bg-muted hover:border-border'
                                }`}
                            >
                                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${style.dot}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1 justify-between">
                                        <span className={`text-sm font-medium truncate ${isSelected ? 'text-amber-600 dark:text-amber-400' : ''}`}>
                                            {s.name}
                                        </span>
                                        {isExpired
                                            ? <AlertTriangle size={12} className="text-red-500 shrink-0" />
                                            : <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                        }
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-1">
                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                                            {s.category}
                                        </span>
                                        {usedBy.length > 0 && (
                                            <span className="text-[10px] text-muted-foreground truncate">· {usedBy[0]}{usedBy.length > 1 ? ` +${usedBy.length - 1}` : ''}</span>
                                        )}
                                    </div>
                                    {isExpired && (
                                        <div className="text-[10px] text-red-500 font-medium mt-1">Expired {expiresDistance}</div>
                                    )}
                                </div>
                                <ChevronRight size={14} className="text-muted-foreground/50 shrink-0 mt-1 md:hidden" />
                            </Link>
                        )
                    })}
                </div>

                <div className="p-3 border-t bg-muted/20">
                    <Link href="/workflows/providers" className="flex items-center justify-between p-3 bg-card border rounded-lg hover:border-primary/50 transition-colors group text-sm">
                        <div className="flex items-center gap-2 font-medium">
                            <Key size={15} className="text-primary" />
                            Service Providers
                        </div>
                        <ChevronRight size={15} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    </Link>
                </div>
            </aside>

            {/* ── CENTER: Editor ───────────────────────────────────────
                Mobile: full screen when secret is selected
                md+: flex-1, always visible
            ──────────────────────────────────────────────────────── */}
            <main className={`
                flex-col bg-background overflow-hidden
                w-full md:flex-1 border-r
                ${isDetailView ? 'flex' : 'hidden md:flex'}
            `}>
                {/* Mobile back bar */}
                {isDetailView && (
                    <div className="flex items-center gap-3 px-4 h-12 border-b bg-background md:hidden shrink-0">
                        <Link
                            href="/workflows/vault"
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Secret Vault
                        </Link>
                        {selectedSecret && (
                            <span className="text-sm font-medium text-foreground truncate">{selectedSecret.name}</span>
                        )}
                    </div>
                )}

                {selectedId === 'new' ? (
                    <VaultEditor key="new" />
                ) : !selectedSecret ? (
                    <div className="m-auto text-center flex flex-col items-center gap-3 text-muted-foreground p-8">
                        <Fingerprint size={40} className="opacity-20" />
                        <div>
                            <p className="font-medium text-foreground">No secret selected</p>
                            <p className="text-sm mt-1">Pick a credential from the list or add a new one.</p>
                        </div>
                    </div>
                ) : (
                    <VaultEditor key={selectedSecret.id} secret={selectedSecret} />
                )}
            </main>

            {/* ── RIGHT: Lifecycle Panel ───────────────────────────────
                Hidden on mobile/tablet — lg+ only
            ──────────────────────────────────────────────────────── */}
            <aside className="hidden lg:flex w-72 bg-background flex-col shrink-0 overflow-hidden">
                {selectedSecret ? (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Clock size={15} /> Lifecycle
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-5">
                            {/* Expiry status */}
                            <div>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Expiration</div>
                                {selectedSecret.expiresAt ? (
                                    <div className={`flex items-start gap-2 p-3 rounded-lg border ${isPast(new Date(selectedSecret.expiresAt)) ? 'bg-red-500/10 border-red-500/20' : 'bg-muted/40'}`}>
                                        {isPast(new Date(selectedSecret.expiresAt))
                                            ? <AlertTriangle size={14} className="text-red-500 shrink-0 mt-0.5" />
                                            : <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />
                                        }
                                        <div>
                                            <div className="text-sm font-medium">{format(new Date(selectedSecret.expiresAt), 'PPP')}</div>
                                            <div className={`text-[11px] mt-0.5 ${isPast(new Date(selectedSecret.expiresAt)) ? 'text-red-500' : 'text-muted-foreground'}`}>
                                                {formatDistanceToNow(new Date(selectedSecret.expiresAt), { addSuffix: true })}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/30 border text-sm text-muted-foreground">
                                        <CheckCircle2 size={14} className="text-green-500" />
                                        Does not expire
                                    </div>
                                )}
                            </div>

                            {/* Used by */}
                            {(() => {
                                const usedBy = usedByMap[String(selectedSecret.id)] ?? []
                                return (
                                    <div>
                                        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                                            <span>Used by Providers</span>
                                            <span className="bg-muted rounded-full px-1.5 py-0.5 font-mono text-[10px]">{usedBy.length}</span>
                                        </div>
                                        {usedBy.length === 0 ? (
                                            <p className="text-xs text-muted-foreground italic">Not linked to any provider yet.</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {usedBy.map(name => (
                                                    <div key={name} className="flex items-center gap-2 px-2 py-1.5 bg-muted/30 rounded-md">
                                                        <Key size={11} className="text-amber-500 shrink-0" />
                                                        <span className="text-xs truncate">{name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )
                            })()}

                            {/* Rotation history */}
                            <div>
                                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <RefreshCw size={11} /> Rotation History
                                </div>
                                {(!selectedSecret.rotationHistory || selectedSecret.rotationHistory.length === 0) ? (
                                    <p className="text-xs text-muted-foreground italic">No rotations recorded.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {selectedSecret.rotationHistory.map((h: any, i: number) => (
                                            <div key={i} className="text-xs p-2 rounded-md bg-muted/30 border">
                                                <div className="font-semibold">{format(new Date(h.rotatedAt), 'MMM d, yyyy')}</div>
                                                <div className="text-muted-foreground font-mono text-[10px] mt-0.5">
                                                    {typeof h.rotatedBy === 'object' ? h.rotatedBy?.email : h.rotatedBy}
                                                </div>
                                                {h.note && <div className="text-muted-foreground mt-1 italic">{h.note}</div>}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Last updated */}
                            {selectedSecret.updatedAt && (
                                <div className="text-[10px] text-muted-foreground border-t pt-4">
                                    Last modified {formatDistanceToNow(new Date(selectedSecret.updatedAt), { addSuffix: true })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="m-auto p-6 text-center text-sm text-muted-foreground">
                        <Shield size={28} className="mx-auto mb-2 opacity-20 text-amber-500" />
                        Select a secret to view its lifecycle
                    </div>
                )}
            </aside>
        </div>
    )
}
