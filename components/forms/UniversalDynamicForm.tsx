'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2, Upload, Search, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow, executeEndpointAction } from '@/app/(dashboard)/workflows/[id]/edit/actions'
import { FormField, FieldEvent } from '@/lib/api/types'
import { NIGERIAN_BANKS } from '@/lib/data/nigerian-banks'
import { applyMappingConfig, resolvePath, normalizeOptionsData } from '@/lib/utils/form-mapper'

// Re-export for compatibility or use locally
export type FormFieldSchema = FormField & {
    // Legacy mapping for fields that haven't transitioned to 'id'
    name?: string;
    triggers_validation?: boolean;
}

export interface UniversalDynamicFormProps {
    fields: FormFieldSchema[]
    validationWorkflowId?: string | null
    onSubmit: (data: Record<string, any>) => void
    submitLabel?: string
    isSubmitting?: boolean
}

export function UniversalDynamicForm({
    fields,
    validationWorkflowId,
    onSubmit,
    submitLabel = 'Submit',
    isSubmitting = false
}: UniversalDynamicFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [activeValidations, setActiveValidations] = useState<Record<string, boolean>>({})

    // api_select: store fetched options per field id
    const [apiOptions, setApiOptions] = useState<Record<string, { label: string; value: any }[]>>({})
    const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({})

    // autocomplete_select: store the current search query per field id
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Initialize with default values if any, or trigger onLoad events
    useEffect(() => {
        fields.forEach(field => {
            if (field.events) {
                const onLoadEvents = field.events.filter(e => e.trigger === 'onLoad')
                onLoadEvents.forEach(evt => handleEvent(field, evt, formData[field.id]))
            }
            // For api_select fields — pre-fetch options on mount
            if (field.type === 'api_select' && field.options_endpoint) {
                fetchApiOptions(field)
            }
        })
    }, [fields])

    // ── Fetch options for api_select fields ──────────────────────────────────
    const fetchApiOptions = useCallback(async (field: FormFieldSchema) => {
        const endpointId = typeof field.options_endpoint === 'object'
            ? field.options_endpoint?.id
            : field.options_endpoint
        if (!endpointId) return

        setLoadingOptions(prev => ({ ...prev, [field.id]: true }))
        try {
            const res = await fetch('/api/endpoints/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ endpointId, dynamicPayload: {} })
            })
            const data = await res.json()
            const rawData = data?.data ?? data?.Payload ?? data ?? []
            const opts = normalizeOptionsData(
                rawData,
                field.options_text_key || 'name',
                field.options_value_key || 'id'
            )
            setApiOptions(prev => ({ ...prev, [field.id]: opts }))
        } catch (e) {
            console.error(`[UDF] Failed to fetch options for field ${field.id}:`, e)
        } finally {
            setLoadingOptions(prev => ({ ...prev, [field.id]: false }))
        }
    }, [])

    // ── Options parser for static select / autocomplete_select ───────────────
    const parseOptions = (options: any): { label: string; value: any }[] => {
        if (!options) return []
        let processedOptions = options

        if (typeof options === 'string') {
            const trimmed = options.trim()
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try { processedOptions = JSON.parse(trimmed) } catch (_) {}
            }
            if (typeof processedOptions === 'string') {
                return processedOptions.split(',').map(o => {
                    const parts = o.split('-').map(s => s.trim())
                    const label = parts[0] || ''
                    const val = parts[1] || label || ''
                    return { label, value: val }
                })
            }
        }

        if (Array.isArray(processedOptions)) {
            return processedOptions.map(o => {
                if (typeof o === 'object' && o !== null) {
                    return {
                        label: String(o.label || o.name || o.text || Object.values(o)[0] || 'Unknown'),
                        value: o.value !== undefined ? o.value : o.id !== undefined ? o.id : o
                    }
                }
                return { label: String(o), value: o }
            })
        }

        if (typeof processedOptions === 'object' && processedOptions !== null) {
            return Object.entries(processedOptions).map(([key, val]) => ({
                label: String(val),
                value: key
            }))
        }

        return []
    }

    // ── Field validation ─────────────────────────────────────────────────────
    const validateField = async (field: FormFieldSchema, value: any) => {
        // hidden fields are not shown — skip visible validation
        if (field.type === 'hidden') return null
        if (field.required && (value === undefined || value === null || value === '')) {
            return `"${field.label}" is required`
        }
        if (field.validations) {
            for (const v of field.validations) {
                if (v.type === 'regex' && v.value) {
                    const re = new RegExp(v.value)
                    if (!re.test(String(value))) return v.errorMessage || 'Invalid format'
                }
                if (v.type === 'min' && v.value && Number(value) < Number(v.value)) {
                    return v.errorMessage || `Minimum value is ${v.value}`
                }
                if (v.type === 'max' && v.value && Number(value) > Number(v.value)) {
                    return v.errorMessage || `Maximum value is ${v.value}`
                }
                if (v.type === 'api_lookup' && v.value && value) {
                    try {
                        const body = { [field.id]: value }
                        const res = await executeEndpointAction(v.value, { body, query: body })
                        if (!res.success) return v.errorMessage || res.error || 'Validation failed'
                    } catch (_) {
                        return 'API Validation error'
                    }
                }
            }
        }
        return null
    }

    // ── Event handler (EXECUTE_ENDPOINT / SET_VALUE / SET_VALUES) ─────────────
    const handleEvent = async (field: FormFieldSchema, event: any, value: any, extraData?: any) => {
        if ((event.action === 'SET_VALUE' || event.action === 'SET_VALUES') && event.mappingConfig) {
            const updates = applyMappingConfig(event.mappingConfig, null, value, extraData)
            if (Object.keys(updates).length > 0) {
                setFormData(prev => ({ ...prev, ...updates }))
            }
            return
        }

        if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
            const eid = typeof event.endpointId === 'object' ? (event.endpointId as any).id : event.endpointId
            setActiveValidations(prev => ({ ...prev, [field.id]: true }))
            try {
                const enquiryPayload = { ...formData, [field.id]: value }
                const result = await executeEndpointAction(eid, { body: enquiryPayload, query: enquiryPayload })

                if (result.success && event.mappingConfig) {
                    const responseData = result.data
                    const updates = applyMappingConfig(event.mappingConfig, responseData, value, extraData)
                    if (Object.keys(updates).length > 0) {
                        setFormData(prev => ({ ...prev, ...updates }))
                        toast.success(`Data retrieved for ${field.label}`)
                    }
                } else if (!result.success) {
                    setErrors(prev => ({ ...prev, [field.id]: result.error || 'Validation API failed' }))
                }
            } catch (e: any) {
                console.error(e)
            } finally {
                setActiveValidations(prev => ({ ...prev, [field.id]: false }))
            }
        }
    }

    // ── Change handler ───────────────────────────────────────────────────────
    const handleChange = (field: FormFieldSchema, value: any, extraData?: any) => {
        setFormData(prev => ({ ...prev, [field.id]: value }))

        if (errors[field.id]) {
            setErrors(prev => {
                const n = { ...prev }
                delete n[field.id]
                return n
            })
        }

        if (field.events) {
            field.events
                .filter(e => e.trigger === 'onChange')
                .forEach(evt => handleEvent(field, evt, value, extraData))

            field.events
                .filter(e => e.trigger === 'onCondition')
                .forEach(evt => {
                    if (!evt.condition) return
                    const { type, value: targetValue } = evt.condition
                    const currentVal = String(value || '')
                    let meets = false
                    if (type === 'length' && currentVal.length === Number(targetValue)) meets = true
                    else if (type === 'regex' && new RegExp(String(targetValue)).test(currentVal)) meets = true
                    else if (type === 'regex_not_match' && !new RegExp(String(targetValue)).test(currentVal)) meets = true
                    if (meets) handleEvent(field, evt, value, extraData)
                })
        }
    }

    // ── Blur handler ─────────────────────────────────────────────────────────
    const handleBlur = async (field: FormFieldSchema) => {
        const val = formData[field.id]

        setActiveValidations(prev => ({ ...prev, [field.id]: true }))
        const err = await validateField(field, val)
        setActiveValidations(prev => ({ ...prev, [field.id]: false }))

        if (err) {
            setErrors(prev => ({ ...prev, [field.id]: err }))
            return
        }

        if (field.events) {
            field.events
                .filter(e => e.trigger === 'onBlur')
                .forEach(evt => handleEvent(field, evt, val))
        }

        // Legacy workflow-based validation
        if (field.triggers_validation && validationWorkflowId && val) {
            setActiveValidations(prev => ({ ...prev, [field.id]: true }))
            try {
                const result = await runWorkflow(validationWorkflowId, { [field.id]: val })
                if (result.success && result.executionId) {
                    let completed = false
                    let attempts = 0
                    while (!completed && attempts < 10) {
                        attempts++
                        await new Promise(r => setTimeout(r, 1000))
                        const res = await fetch(`/api/workflows/executions/${result.executionId}`)
                        const data = await res.json()
                        if (data.success && data.execution?.status === 'COMPLETED') {
                            completed = true
                            const lastPhase = data.execution.phases?.[data.execution.phases.length - 1]
                            if (lastPhase?.outputs) setFormData(prev => ({ ...prev, ...lastPhase.outputs }))
                            toast.success(`${field.label} verified`)
                        } else if (data.execution?.status === 'FAILED') {
                            completed = true
                            setErrors(prev => ({ ...prev, [field.id]: 'Verification failed' }))
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            } finally {
                setActiveValidations(prev => ({ ...prev, [field.id]: false }))
            }
        }
    }

    // ── Submit handler ───────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: Record<string, string> = {}
        for (const f of fields) {
            const err = await validateField(f, formData[f.id])
            if (err) newErrors[f.id] = err
        }
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            toast.error('Please fix form errors before submitting')
            return
        }
        onSubmit(formData)
    }

    // ── Field renderer ───────────────────────────────────────────────────────
    const renderField = (field: FormFieldSchema) => {
        const fieldKey = field.id || (field as any).name
        const isValidating = activeValidations[fieldKey]
        const hasError = errors[fieldKey]

        // ── Hidden field — kept in state but not rendered ──────────────────
        if (field.type === 'hidden') {
            return (
                <input
                    key={fieldKey}
                    type="hidden"
                    name={fieldKey}
                    value={formData[fieldKey] ?? ''}
                    readOnly
                />
            )
        }

        return (
            <div key={fieldKey} className="group flex flex-col gap-2 transition-all">
                <div className="flex items-center justify-between">
                    <label className="text-[13px] font-semibold text-foreground/80 flex items-center gap-2">
                        {field.label}
                        {field.required && <span className="text-rose-500">*</span>}
                        {isValidating && <Loader2 size={12} className="animate-spin text-primary" />}
                    </label>
                    {hasError && (
                        <span className="text-[10px] font-medium text-rose-500 flex items-center gap-1 animate-in fade-in slide-in-from-right-1">
                            <AlertCircle size={10} /> {hasError}
                        </span>
                    )}
                    {!hasError && formData[fieldKey] && !isValidating && (
                        <CheckCircle2 size={12} className="text-emerald-500 animate-in zoom-in" />
                    )}
                </div>

                {/* ── File ─────────────────────────────────────────────────── */}
                {field.type === 'file' ? (
                    <div className="relative">
                        <label
                            htmlFor={`udf-file-${fieldKey}`}
                            className={`flex items-center gap-3 h-11 w-full rounded-xl border px-4 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                                hasError ? 'border-rose-500/50' : 'border-input group-hover:border-primary/30'
                            }`}
                        >
                            <Upload size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                                {formData[fieldKey]?.name || field.placeholder || 'Choose file...'}
                            </span>
                        </label>
                        <input
                            id={`udf-file-${fieldKey}`}
                            type="file"
                            className="sr-only"
                            disabled={isSubmitting}
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleChange(field, file)
                            }}
                        />
                    </div>

                /* ── Destination Bank Lookup ────────────────────────────── */
                ) : field.type === 'destination_bank_lookup' ? (
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select
                            className={`flex h-11 w-full rounded-xl border bg-background/50 pl-9 pr-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${
                                hasError ? 'border-rose-500/50 bg-rose-50/10' : 'border-input group-hover:border-primary/30'
                            }`}
                            value={formData[fieldKey] || ''}
                            onChange={e => handleChange(field, e.target.value)}
                            disabled={isValidating || isSubmitting}
                            onBlur={() => handleBlur(field)}
                        >
                            <option value="" disabled>Select bank...</option>
                            {NIGERIAN_BANKS.map(bank => (
                                <option key={bank.code} value={bank.code}>
                                    {bank.name} ({bank.code})
                                </option>
                            ))}
                        </select>
                    </div>

                /* ── Static Select ─────────────────────────────────────── */
                ) : field.type === 'select' ? (
                    <select
                        className={`flex h-11 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${
                            hasError ? 'border-rose-500/50 bg-rose-50/10' : 'border-input group-hover:border-primary/30'
                        }`}
                        value={formData[fieldKey] || ''}
                        onChange={e => handleChange(field, e.target.value)}
                        disabled={isValidating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                    >
                        <option value="" disabled>Select {field.label.toLowerCase()}...</option>
                        {(parseOptions(field.options) || []).map((opt, idx) => (
                            <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                /* ── API Select — async fetched options ────────────────── */
                ) : field.type === 'api_select' ? (
                    <div className="relative">
                        {loadingOptions[fieldKey] && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin pointer-events-none" />
                        )}
                        <select
                            className={`flex h-11 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${
                                hasError ? 'border-rose-500/50 bg-rose-50/10' : 'border-input group-hover:border-primary/30'
                            } ${loadingOptions[fieldKey] ? 'opacity-60' : ''}`}
                            value={formData[fieldKey] || ''}
                            onChange={e => handleChange(field, e.target.value)}
                            disabled={isValidating || isSubmitting || loadingOptions[fieldKey]}
                            onBlur={() => handleBlur(field)}
                        >
                            <option value="" disabled>
                                {loadingOptions[fieldKey] ? 'Loading options...' : `Select ${field.label.toLowerCase()}...`}
                            </option>
                            {(apiOptions[fieldKey] || []).map((opt, idx) => (
                                <option key={`${opt.value}-${idx}`} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>

                /* ── Autocomplete Select — client-side filtered ─────────── */
                ) : field.type === 'autocomplete_select' ? (() => {
                    const allOptions = parseOptions(field.options)
                    const searchTerm = searchTerms[fieldKey] || ''
                    const filtered = searchTerm
                        ? allOptions.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
                        : allOptions
                    const selectedLabel = allOptions.find(o => String(o.value) === String(formData[fieldKey]))?.label

                    return (
                        <div className="relative" ref={openDropdown === fieldKey ? dropdownRef : undefined}>
                            <div
                                className={`flex h-11 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm shadow-sm transition-all cursor-pointer ${
                                    hasError ? 'border-rose-500/50' : 'border-input group-hover:border-primary/30'
                                }`}
                                onClick={() => setOpenDropdown(openDropdown === fieldKey ? null : fieldKey)}
                            >
                                <span className={`flex-1 truncate ${selectedLabel ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {selectedLabel || `Select ${field.label.toLowerCase()}...`}
                                </span>
                                {formData[fieldKey] ? (
                                    <X
                                        size={14}
                                        className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5 mr-1"
                                        onClick={e => {
                                            e.stopPropagation()
                                            handleChange(field, '')
                                            setSearchTerms(prev => ({ ...prev, [fieldKey]: '' }))
                                        }}
                                    />
                                ) : (
                                    <ChevronDown size={14} className="text-muted-foreground shrink-0 mt-0.5" />
                                )}
                            </div>
                            {openDropdown === fieldKey && (
                                <div className="absolute z-50 mt-1 w-full rounded-xl border bg-popover shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 border-b">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                autoFocus
                                                className="w-full h-8 pl-7 pr-3 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary/30"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerms(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-52 overflow-y-auto py-1">
                                        {filtered.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-4">No options found</p>
                                        ) : filtered.map((opt, idx) => (
                                            <div
                                                key={`${opt.value}-${idx}`}
                                                className={`px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-primary/5 ${
                                                    String(formData[fieldKey]) === String(opt.value) ? 'bg-primary/10 font-semibold text-primary' : ''
                                                }`}
                                                onClick={() => {
                                                    handleChange(field, opt.value)
                                                    setOpenDropdown(null)
                                                    setSearchTerms(prev => ({ ...prev, [fieldKey]: '' }))
                                                }}
                                            >
                                                {opt.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })()

                /* ── Beneficiary Select (text input) ──────────────────────── */
                : field.type === 'beneficiary_select' ? (
                    <Input
                        type="text"
                        value={formData[fieldKey] || ''}
                        onChange={e => handleChange(field, e.target.value)}
                        placeholder={field.placeholder || 'Enter account number...'}
                        disabled={isValidating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                        className={`h-11 rounded-xl px-4 transition-all ${hasError ? 'border-rose-500/50 focus-visible:ring-rose-500/10' : 'focus-visible:ring-primary/10'}`}
                    />

                /* ── Default text / number / email ────────────────────────── */
                ) : (
                    <Input
                        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                        value={formData[fieldKey] || ''}
                        onChange={e => handleChange(field, e.target.value)}
                        placeholder={field.placeholder || field.label}
                        disabled={isValidating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                        className={`h-11 rounded-xl px-4 transition-all ${hasError ? 'border-rose-500/50 focus-visible:ring-rose-500/10' : 'focus-visible:ring-primary/10'}`}
                    />
                )}

                {field.description && (
                    <p className="text-[11px] text-muted-foreground/70 pl-1 leading-relaxed">
                        {field.description}
                    </p>
                )}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12 sm:pb-0">
            <div className="grid grid-cols-1 gap-y-6">
                {fields.map(field => renderField(field))}
            </div>

            <div className="pt-6">
                <button
                    type="submit"
                    disabled={isSubmitting || Object.values(activeValidations).some(Boolean)}
                    className="group relative w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <span>{submitLabel}</span>
                    )}
                </button>
            </div>
        </form>
    )
}
