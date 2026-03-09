'use client'

import React, { useState } from 'react'
import { Shield, Key, AlertTriangle, Fingerprint, EyeOff, Eye } from 'lucide-react'
import { saveSecret, deleteSecret } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function VaultEditor({ secret }: { secret?: any }) {
    const isNew = secret?.id === 'new' || !secret
    const [formData, setFormData] = useState({
        name: secret?.name || '',
        category: secret?.category || 'API_KEY',
        description: secret?.description || '',
        expiresAt: secret?.expiresAt || '',
        // The unencrypted value ONLY exists in state until saved.
        // Payload's beforeChange hook catches it and encrypts it safely before DB commit.
        value: ''
    })

    const [isSaving, setIsSaving] = useState(false)
    const [showValue, setShowValue] = useState(false)
    const router = useRouter()

    const handleSave = async () => {
        if (!formData.name) {
            toast.error('Name is required.')
            return
        }
        if (isNew && !formData.value) {
            toast.error('A secret value must be provided for new entries.')
            return
        }

        setIsSaving(true)
        try {
            // If it's an existing secret and the user left the 'value' input empty,
            // we strip it so Payload doesn't overwrite the existing encrypted data with an empty string.
            const { value, ...rest } = formData
            const payloadData = (!isNew && !formData.value) ? rest : formData


            await saveSecret(isNew ? null : secret.id, payloadData)
            toast.success("Secret saved successfully.")
            if (isNew) {
                router.push('/workflows/vault')
            }
        } catch (e: any) {
            toast.error(e.message || "Failed to save secret.")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to permanently delete this secret? Providers using it will fail.')) return
        setIsSaving(true)
        try {
            await deleteSecret(secret.id)
            toast.success("Secret deleted.")
            router.push('/workflows/vault')
        } catch (e: any) {
            toast.error(e.message || "Failed to delete secret.")
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <>
            <div className="p-6 border-b flex items-center justify-between bg-card shrink-0">
                <div>
                    {isNew ? (
                        <h1 className="text-2xl font-bold">New Vault Secret</h1>
                    ) : (
                        <>
                            <h1 className="text-2xl font-bold">{secret?.name}</h1>
                            <p className="text-sm text-muted-foreground mt-1 max-w-xl truncate">
                                {secret?.description || 'No description provided'}
                            </p>
                        </>
                    )}
                </div>
                <div className="flex gap-2">
                    {!isNew && (
                        <button onClick={handleDelete} disabled={isSaving} className="px-4 py-2 border text-red-500 border-red-200 hover:bg-red-50 font-medium rounded-md text-sm">
                            Delete
                        </button>
                    )}
                    <button onClick={handleSave} disabled={isSaving} className="px-4 py-2 bg-amber-500 text-white font-medium rounded-md text-sm hover:bg-amber-600 transition-colors">
                        {isSaving ? "Encrypting..." : (isNew ? "Save & Encrypt" : "Update Secret")}
                    </button>
                </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-8 pb-20">
                <section className="space-y-4 max-w-2xl">
                    {!isNew ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex gap-3 text-red-600">
                            <AlertTriangle size={20} className="shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <strong>Secure Value</strong><br />
                                The current encrypted value is safely stored using AES-256-GCM. We never transmit the unencrypted value to your browser. Type a new value below ONLY if you want to overwrite it.
                            </div>
                        </div>
                    ) : (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 flex gap-3 text-amber-600">
                            <Shield size={20} className="shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <strong>AES-256 Validated</strong><br />
                                Your raw secret value will only exist in RAM during the transaction. It will be encrypted natively inside Payload CMS before resting in the Postgres Database.
                            </div>
                        </div>
                    )}

                    <div className="grid gap-6">
                        <div>
                            <label className="text-sm font-medium">Secret Name</label>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="e.g. Live Paystack Secret Key" />
                        </div>

                        <div>
                            <label className="text-sm font-medium">{isNew ? "Sensitive Value" : "Overwrite Value"}</label>
                            <div className="relative">
                                <input
                                    type={showValue ? "text" : "password"}
                                    value={formData.value}
                                    onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono pr-10"
                                    placeholder={!isNew ? "••••••••••••••••••••••••" : "sk_live_..."}
                                />
                                <button type="button" onClick={() => setShowValue(!showValue)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Category</label>
                                <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1">
                                    <option value="API_KEY">API Key</option>
                                    <option value="SMTP">SMTP / Email</option>
                                    <option value="OAUTH_TOKEN">OAuth Token</option>
                                    <option value="DATABASE_URI">Database URI</option>
                                    <option value="WEBHOOK_SECRET">Webhook Secret</option>
                                    <option value="CUSTOM">Custom</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Expiry Date (Optional)</label>
                                <input type="date" value={formData.expiresAt ? formData.expiresAt.split('T')[0] : ''} onChange={e => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full mt-1 flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Internal Description</label>
                            <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="flex min-h-[80px] w-full mt-1 rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm" placeholder="Notes tracking where this key is used..." />
                        </div>
                    </div>
                </section>
            </div>
        </>
    )
}
