import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
    Shield, Clock, Fingerprint, EyeOff, AlertTriangle, Key
} from 'lucide-react'
import { format } from 'date-fns'
import { VaultActions } from './client-actions'
import { VaultEditor } from './vault-editor'

export default async function SecretVaultPage({
    searchParams
}: {
    searchParams: Promise<{ id?: string }>
}) {
    const { id: selectedId } = await searchParams
    const payload = await getPayload({ config })

    const secretsRes = await payload.find({
        collection: 'secrets',
        sort: '-updatedAt'
    })

    const secrets = secretsRes.docs as any[]

    const selectedSecret = selectedId ? secrets.find(s => s.id === selectedId) : secrets[0]

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full overflow-hidden bg-muted/30">

            {/* LEFT PANEL: Vault List */}
            <aside className="w-80 border-r bg-background flex flex-col shrink-0">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                        <Shield size={20} />
                        <h2 className="font-semibold tracking-tight text-foreground">Secret Vault</h2>
                    </div>
                    <VaultActions />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {secrets.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground italic">Vault is empty.</div>
                    ) : (
                        secrets.map((s) => {
                            const isActive = s.id === selectedSecret?.id
                            return (
                                <Link
                                    key={s.id}
                                    href={`/workflows/vault?id=${s.id}`}
                                    className={`flex items-center gap-3 p-3 rounded-md transition-colors ${isActive ? 'bg-amber-500/10 text-amber-600' : 'hover:bg-muted text-foreground'
                                        }`}
                                >
                                    <div className={`p-2 rounded-md ${isActive ? 'bg-background' : 'bg-muted'}`}>
                                        <Key size={16} className={isActive ? 'text-amber-500' : 'text-muted-foreground'} />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <div className="font-medium text-sm truncate">{s.name}</div>
                                        <div className="flex text-[10px] items-center gap-1 opacity-70 mt-1 uppercase tracking-wider">
                                            {s.category}
                                            {s.expiresAt && new Date(s.expiresAt) < new Date() && (
                                                <span className="text-red-500 font-bold ml-1">EXPIRED</span>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            )
                        })
                    )}
                </div>
            </aside>

            {/* CENTER PANEL: Configuration Editor */}
            <main className="flex-1 flex flex-col border-r bg-background overflow-hidden relative">
                {selectedId === 'new' ? (
                    <VaultEditor />
                ) : !selectedSecret ? (
                    <div className="m-auto text-center flex flex-col items-center">
                        <Fingerprint className="text-muted-foreground/30 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-muted-foreground">Select a Secret</h3>
                    </div>
                ) : (
                    <VaultEditor secret={selectedSecret} />
                )}
            </main>

            {/* RIGHT PANEL: Status & Health */}
            <aside className="w-80 bg-background flex flex-col shrink-0">
                {selectedSecret ? (
                    <>
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-sm flex items-center gap-2">
                                <Clock size={16} /> Lifecycle Management
                            </h3>
                        </div>
                        <div className="p-4 space-y-6 overflow-y-auto">
                            <div>
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Expiration</div>
                                {selectedSecret.expiresAt ? (
                                    <div className="text-sm font-medium">
                                        {format(new Date(selectedSecret.expiresAt), 'PPP')}
                                    </div>
                                ) : (
                                    <span className="text-sm text-foreground/70 italic">Does not expire</span>
                                )}
                            </div>

                            <div className="border-t pt-4">
                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-4">Rotation History</div>
                                {(!selectedSecret.rotationHistory || selectedSecret.rotationHistory.length === 0) ? (
                                    <div className="text-sm text-muted-foreground italic">No rotations recorded.</div>
                                ) : (
                                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-muted-foreground/20 before:to-transparent">
                                        {selectedSecret.rotationHistory.map((h: any, i: number) => (
                                            <div key={i} className="text-xs flex flex-col gap-1 border border-muted p-2 bg-muted/30 rounded z-10 relative">
                                                <span className="font-semibold">{format(new Date(h.rotatedAt), 'MMM d, yyyy h:mm a')}</span>
                                                <span className="text-muted-foreground font-mono">By: {typeof h.rotatedBy === 'object' ? h.rotatedBy.email : h.rotatedBy}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground m-auto">
                        Select a secret to view auditing and lifecycle
                    </div>
                )}
            </aside>

        </div>
    )
}
