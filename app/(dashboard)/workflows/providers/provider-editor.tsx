'use client'

import React, { useState } from 'react'
import { Globe, Lock, Key, Database, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { saveProvider, deleteProvider } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

const KNOWN_META_FIELDS: Record<string, string> = {
    institutionCode: 'Institution/MFB code (e.g. 0017). Auto-injected as ?mfbCode= in API calls.',
    authMode: 'Auth injection mode: QUERY_PARAM or BODY_FIELD',
    authQueryParamKey: 'Query param key for auth token (e.g. authToken)',
    authBodyFieldKey: 'Body field name for auth token (e.g. AuthenticationCode)',
    bankOneVersion: 'BankOne API version suffix (e.g. 2)',
    responseWrapper: 'Response envelope type (e.g. BankOne-Standard)',
    successPath: 'JSON path to success flag in response (e.g. IsSuccessful)',
    dataPath: 'JSON path to payload data (e.g. Payload)',
}

type MetaEntry = { key: string; value: string }

function metaToEntries(obj: Record<string, any>): MetaEntry[] {
    return Object.entries(obj ?? {}).map(([key, value]) => ({ key, value: String(value) }))
}
function entriesToMeta(entries: MetaEntry[]): Record<string, string> {
    return Object.fromEntries(entries.filter(e => e.key.trim()).map(e => [e.key.trim(), e.value]))
}

export function ProviderEditor({ provider, secrets }: { provider?: any, secrets: any[] }) {
    const isNew = provider?.id === 'new' || !provider
    const [formData, setFormData] = useState({
        name: provider?.name || '',
        slug: provider?.slug || '',
        category: provider?.category || 'PAYMENT',
        baseUrl: provider?.baseUrl || '',
        authType: provider?.authType || 'API_KEY',
        secret: typeof provider?.secret === 'object' && provider.secret !== null ? provider.secret.id : provider?.secret || '',
        isActive: provider?.isActive ?? true,
        priority: provider?.priority || 1,
        groupTag: provider?.groupTag || ''
    })

    const [metaEntries, setMetaEntries] = useState<MetaEntry[]>(
        metaToEntries(provider?.metadata ?? {})
    )

    const addMeta = () => setMetaEntries(prev => [...prev, { key: '', value: '' }])
    const updateMeta = (i: number, field: 'key' | 'value', v: string) =>
        setMetaEntries(prev => { const e = [...prev]; e[i] = { ...e[i], [field]: v }; return e })
    const removeMeta = (i: number) => setMetaEntries(prev => prev.filter((_, idx) => idx !== i))
    const addKnownMeta = (key: string) => {
        if (metaEntries.some(e => e.key === key)) return
        setMetaEntries(prev => [...prev, { key, value: '' }])
    }

    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        if (!formData.name || !formData.slug || !formData.baseUrl) {
            toast.error('Name, Slug, and Base URL are required.')
            return
        }

        const payloadData: any = { ...formData, metadata: entriesToMeta(metaEntries) }
        if (payloadData.authType === 'NONE' || !payloadData.secret) {
            payloadData.secret = null
        } else if (typeof payloadData.secret === 'string' && !isNaN(Number(payloadData.secret))) {
            payloadData.secret = Number(payloadData.secret)
        }

        setIsSaving(true)
        try {
            await saveProvider(isNew ? null : provider.id, payloadData)
            toast.success("Provider saved successfully.")
            if (isNew) {
                router.push('/workflows/providers')
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to save provider.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this provider?')) return
        setIsSaving(true)
        try {
            await deleteProvider(provider.id)
            toast.success("Provider deleted.")
            router.push('/workflows/providers')
        } catch (e: any) {
            toast.error(e.message || "Failed to delete provider.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <div className="shrink-0 border-b bg-background px-4 h-14 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Globe size={15} className="text-primary shrink-0" />
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold truncate leading-tight">
                            {isNew ? 'New Provider' : provider?.name}
                        </h1>
                        {!isNew && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate leading-tight mt-0.5 hidden sm:flex">
                                <span className="font-mono">{provider?.category}</span>
                                <span>&bull;</span>
                                <span className="font-mono truncate">{provider?.slug}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {!isNew && (
                        <button
                            onClick={handleDelete}
                            disabled={isSaving}
                            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border border-red-200 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50"
                        >
                            <Trash2 size={13} />
                            <span className="hidden sm:inline">Delete</span>
                        </button>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        <span className="hidden sm:inline">
                            {isSaving ? 'Saving…' : 'Save Changes'}
                        </span>
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 pb-20">
                <section className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                        <Globe size={18} /> Basic Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4 max-w-2xl">
                        <div>
                            <label className="text-sm font-medium">Provider Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="e.g. NIBSS Gateway" />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Slug (Unique ID)</label>
                            <input type="text" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })} className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono" placeholder="e.g. nibss-live" />
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                        <Globe size={18} /> Network Settings
                    </h3>
                    <div className="grid gap-4 max-w-2xl">
                        <div>
                            <label className="text-sm font-medium">Base URL</label>
                            <input type="url" value={formData.baseUrl} onChange={e => setFormData({ ...formData, baseUrl: e.target.value })} className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono" placeholder="https://api.example.com/v1" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Status</label>
                                <select value={formData.isActive ? 'true' : 'false'} onChange={e => setFormData({ ...formData, isActive: e.target.value === 'true' })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1">
                                    <option value="true">Active</option>
                                    <option value="false">Inactive</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1">
                                    <option value="SMS">SMS</option>
                                    <option value="EMAIL">Email</option>
                                    <option value="PAYMENT">Payment</option>
                                    <option value="KYC">KYC</option>
                                    <option value="CREDIT_BUREAU">Credit Bureau</option>
                                    <option value="WEBHOOK">Webhook</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                        <Lock size={18} /> Authentication
                    </h3>
                    <div className="bg-muted/30 border rounded-lg p-4 max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-1/2">
                                <label className="text-sm font-medium">Auth Type</label>
                                <select value={formData.authType} onChange={e => setFormData({ ...formData, authType: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1">
                                    <option value="NONE">None</option>
                                    <option value="API_KEY">API Key</option>
                                    <option value="BEARER">Bearer Token</option>
                                    <option value="BASIC">Basic Auth</option>
                                    <option value="OAUTH2">OAuth 2.0</option>
                                </select>
                            </div>
                        </div>

                        {formData.authType !== 'NONE' && (
                            <div className="border border-dashed rounded-md p-4 bg-background">
                                <label className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-2 block">Referenced Secret</label>
                                <div className="flex items-center gap-3">
                                    <Key size={16} className="text-amber-500" />
                                    <select value={formData.secret || ''} onChange={e => setFormData({ ...formData, secret: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm font-mono mt-1">
                                        <option value="">-- Select Vault Secret --</option>
                                        {secrets.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                {/* ── Metadata ─────────────────────────────────── */}
                <section className="space-y-4">
                    <h3 className="text-base font-semibold flex items-center gap-2 border-b pb-2">
                        <Database size={18} /> Provider Metadata
                    </h3>
                    <p className="text-xs text-muted-foreground -mt-2">
                        Key-value config injected into API calls at runtime.
                        E.g. <code className="bg-muted px-1 rounded">institutionCode</code> → auto-appended as <code className="bg-muted px-1 rounded">?mfbCode=</code> on matching endpoints.
                    </p>

                    {/* Quick-add known fields */}
                    {(() => {
                        const unused = Object.keys(KNOWN_META_FIELDS).filter(k => !metaEntries.some(e => e.key === k))
                        return unused.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pb-1">
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider self-center">Quick add:</span>
                                {unused.map(key => (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => addKnownMeta(key)}
                                        className="text-[11px] font-mono px-2 py-0.5 rounded-full border border-dashed hover:border-primary hover:text-primary transition-colors text-muted-foreground"
                                    >
                                        + {key}
                                    </button>
                                ))}
                            </div>
                        ) : null
                    })()}

                    <div className="space-y-2 max-w-2xl">
                        {metaEntries.map((entry, i) => (
                            <div key={i} className="space-y-0.5">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2 sm:p-0 bg-muted/20 sm:bg-transparent border sm:border-transparent rounded-lg">
                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-[0_0_38%]">
                                        <input
                                            list="known-meta-keys"
                                            className="flex h-9 rounded-md border border-input bg-background sm:bg-transparent px-3 py-1 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full"
                                            value={entry.key}
                                            onChange={e => updateMeta(i, 'key', e.target.value)}
                                            placeholder="key"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMeta(i)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors shrink-0 sm:hidden"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 w-full sm:w-auto sm:flex-1">
                                        <input
                                            className="flex h-9 rounded-md border border-input bg-background sm:bg-transparent px-3 py-1 text-sm font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-full"
                                            value={entry.value}
                                            onChange={e => updateMeta(i, 'value', e.target.value)}
                                            placeholder="value"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => removeMeta(i)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-muted rounded-md transition-colors shrink-0 hidden sm:flex"
                                        >
                                            <Trash2 size={15} />
                                        </button>
                                    </div>
                                </div>
                                {KNOWN_META_FIELDS[entry.key] && (
                                    <p className="text-[10px] text-muted-foreground px-2 sm:px-1">
                                        {KNOWN_META_FIELDS[entry.key]}
                                    </p>
                                )}
                            </div>
                        ))}
                        <datalist id="known-meta-keys">
                            {Object.keys(KNOWN_META_FIELDS).map(k => <option key={k} value={k} />)}
                        </datalist>
                    </div>

                    <button
                        type="button"
                        onClick={addMeta}
                        className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors mt-1"
                    >
                        <Plus size={13} /> Add Field
                    </button>
                </section>
            </div>
        </>
    )
}
