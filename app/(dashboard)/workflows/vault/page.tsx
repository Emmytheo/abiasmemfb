import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import {
    Shield, Plus, Key, Clock, Fingerprint, EyeOff, AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

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
                    <button className="p-1.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 rounded-md transition-colors">
                        <Plus size={16} />
                    </button>
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
                {!selectedSecret ? (
                    <div className="m-auto text-center flex flex-col items-center">
                        <Fingerprint className="text-muted-foreground/30 mb-4" size={48} />
                        <h3 className="text-lg font-medium text-muted-foreground">Select a Secret</h3>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b flex items-center justify-between bg-card shrink-0">
                            <div>
                                <h1 className="text-2xl font-bold">{selectedSecret.name}</h1>
                                <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate">
                                    {selectedSecret.description || 'No description provided'}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-4 py-2 bg-amber-500 text-white font-medium rounded-md text-sm hover:bg-amber-600 transition-colors">
                                    Rotate Value
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-8 pb-20">
                            <section className="space-y-4 max-w-2xl">
                                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 text-red-600">
                                    <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                                    <div className="text-sm">
                                        <strong>Secure Value</strong><br />
                                        The current encrypted value is safely stored using AES-256-GCM. We never transmit the unencrypted value to your browser. Use the Rotate button above if you need to update it.
                                    </div>
                                </div>

                                <div className="grid gap-6">
                                    <div>
                                        <label className="text-sm font-medium">Secret Key (Slug)</label>
                                        <input type="text" value={selectedSecret.key} readOnly className="w-full mt-1 p-2 bg-muted/50 border rounded-md text-sm font-mono flex h-10 focus-visible:outline-none" />
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium flex items-center justify-between">
                                            Value Preview
                                            <span className="text-xs text-muted-foreground font-normal flex items-center gap-1">
                                                <EyeOff size={12} /> Masked
                                            </span>
                                        </label>
                                        <div className="w-full mt-1 p-2 bg-muted/80 border rounded-md font-mono text-sm tracking-widest text-muted-foreground flex h-10 items-center select-none">
                                            ••••••••••••••••••••••••••••••••
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium">Category</label>
                                            <input type="text" value={selectedSecret.category} readOnly className="w-full mt-1 p-2 bg-muted/50 border rounded-md text-sm font-mono flex h-10" />
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    </>
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
