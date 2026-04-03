'use client'

import React, { useState } from 'react'
import { Shield, AlertTriangle, Eye, EyeOff, Trash2, Save, Loader2, Lock } from 'lucide-react'
import { saveSecret, deleteSecret } from './actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

const CATEGORIES = [
    { value: 'API_KEY',        label: 'API Key' },
    { value: 'QORE_API_TOKEN', label: 'Qore API Token' },
    { value: 'SMTP',           label: 'SMTP / Email' },
    { value: 'OAUTH_TOKEN',    label: 'OAuth Token' },
    { value: 'DATABASE_URI',   label: 'Database URI' },
    { value: 'WEBHOOK_SECRET', label: 'Webhook Secret' },
    { value: 'CUSTOM',         label: 'Custom' },
]

const inp = 'flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50'

export function VaultEditor({ secret }: { secret?: any }) {
    const isNew = !secret || secret?.id === 'new'
    const router = useRouter()

    const [form, setForm] = useState({
        name: secret?.name ?? '',
        category: secret?.category ?? 'API_KEY',
        description: secret?.description ?? '',
        expiresAt: secret?.expiresAt ? secret.expiresAt.split('T')[0] : '',
        value: '',
    })

    const [isSaving, setIsSaving] = useState(false)
    const [showValue, setShowValue] = useState(false)

    const set = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }))

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error('Name is required.'); return }
        if (isNew && !form.value.trim()) { toast.error('A secret value is required for new entries.'); return }

        setIsSaving(true)
        try {
            const { value, ...rest } = form
            const data = !isNew && !value ? rest : form
            await saveSecret(isNew ? null : secret.id, data)
            toast.success(isNew ? 'Secret encrypted and stored.' : 'Secret updated.')
            if (isNew) router.push('/workflows/vault')
        } catch (e: any) {
            toast.error(e.message || 'Failed to save secret.')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!confirm('Permanently delete this secret? Any provider using it will stop working.')) return
        setIsSaving(true)
        try {
            await deleteSecret(secret.id)
            toast.success('Secret deleted.')
            router.push('/workflows/vault')
        } catch (e: any) {
            toast.error(e.message || 'Failed to delete.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="shrink-0 border-b bg-background px-4 h-14 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <Lock size={15} className="text-amber-500 shrink-0" />
                    <div className="min-w-0">
                        <h1 className="text-sm font-semibold truncate leading-tight">
                            {isNew ? 'New Secret' : form.name}
                        </h1>
                        {!isNew && (
                            <p className="text-[11px] text-muted-foreground truncate leading-tight hidden sm:block">
                                {form.description || 'No description'}
                            </p>
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
                        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                        <span className="hidden sm:inline">
                            {isSaving ? 'Encrypting…' : isNew ? 'Save & Encrypt' : 'Update'}
                        </span>
                    </button>
                </div>
            </div>

            {/* ── Body ───────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6">
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* Security notice */}
                    <div className={`flex gap-3 p-4 rounded-xl border text-sm ${
                        isNew
                            ? 'bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400'
                            : 'bg-muted/50 border-border text-muted-foreground'
                    }`}>
                        {isNew
                            ? <Shield size={18} className="shrink-0 mt-0.5 text-amber-500" />
                            : <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                        }
                        <div>
                            <div className="font-semibold mb-0.5">
                                {isNew ? 'End-to-end encrypted (AES-256-GCM)' : 'Value is encrypted at rest'}
                            </div>
                            <div className="text-xs leading-relaxed">
                                {isNew
                                    ? 'Your raw secret lives only in RAM during this request. It is encrypted by Payload before being committed to the database — never stored in plaintext.'
                                    : 'The current value is stored encrypted. Leave the field below empty to keep the existing value, or type a new one to rotate it.'
                                }
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium flex items-center gap-1">
                            Name <span className="text-destructive">*</span>
                        </label>
                        <input
                            className={inp}
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            placeholder="e.g. QORE_API_TOKEN (prod)"
                        />
                    </div>

                    {/* Secret value */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium flex items-center gap-1">
                            {isNew ? 'Secret Value' : 'Rotate Value'}
                            {isNew && <span className="text-destructive">*</span>}
                        </label>
                        <div className="relative">
                            <input
                                type={showValue ? 'text' : 'password'}
                                className={`${inp} font-mono pr-10`}
                                value={form.value}
                                onChange={e => set('value', e.target.value)}
                                placeholder={isNew ? 'sk_live_••••••••' : '(leave empty to keep existing)'}
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                onClick={() => setShowValue(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                {showValue ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                        </div>
                    </div>

                    {/* Category + Expiry */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Category</label>
                            <select
                                className={`${inp} cursor-pointer`}
                                value={form.category}
                                onChange={e => set('category', e.target.value)}
                            >
                                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium">Expiry Date <span className="text-muted-foreground font-normal">(optional)</span></label>
                            <input
                                type="date"
                                className={inp}
                                value={form.expiresAt}
                                onChange={e => set('expiresAt', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium">Description</label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            placeholder="Where is this key used? Any rotation notes…"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
