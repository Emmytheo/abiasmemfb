'use client'

import React, { useState } from 'react'
import { Globe, Lock, Key } from 'lucide-react'
import { saveProvider, deleteProvider } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'

export function ProviderEditor({ provider, secrets }: { provider?: any, secrets: any[] }) {
    const isNew = provider?.id === 'new' || !provider
    const [formData, setFormData] = useState({
        name: provider?.name || '',
        slug: provider?.slug || '',
        category: provider?.category || 'PAYMENT',
        baseUrl: provider?.baseUrl || '',
        authType: provider?.authType || 'API_KEY',
        secret: typeof provider?.secret === 'object' ? provider.secret.id : provider?.secret || '',
        isActive: provider?.isActive ?? true,
        priority: provider?.priority || 1,
        groupTag: provider?.groupTag || ''
    })

    const [isSaving, setIsSaving] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        if (!formData.name || !formData.slug || !formData.baseUrl) {
            toast.error('Name, Slug, and Base URL are required.')
            return
        }

        setIsSaving(true)
        try {
            await saveProvider(isNew ? null : provider.id, formData)
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
            <div className="p-6 border-b flex items-center justify-between bg-card shrink-0">
                <div>
                    {isNew ? (
                        <h1 className="text-2xl font-bold">New Provider</h1>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold">{provider?.name}</h1>
                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                <Badge variant="outline">{provider?.category}</Badge>
                                <span>&bull;</span>
                                <span className="font-mono">{provider?.slug}</span>
                            </div>
                        </>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <button onClick={handleDelete} disabled={isSaving} className="px-4 py-2 border text-red-500 border-red-200 hover:bg-red-50 font-medium rounded-md text-sm">
                            Delete
                        </button>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-md text-sm hover:bg-primary/90">
                        {isSaving ? "Saving..." : "Save Changes"}
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
            </div>
        </>
    )
}
