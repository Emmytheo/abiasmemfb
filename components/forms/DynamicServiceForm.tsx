'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, Upload, Search, ChevronDown, X } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'
import { NIGERIAN_BANKS } from '@/lib/data/nigerian-banks'
import { FieldValidation, FieldEvent } from '@/lib/api/types'
import { applyMappingConfig, normalizeOptionsData } from '@/lib/utils/form-mapper'

export type FormFieldSchema = {
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'select' | 'destination_bank_lookup' | 'file'
         | 'beneficiary_select' | 'autocomplete_select' | 'api_select' | 'hidden'
    required?: boolean
    placeholder?: string
    description?: string
    options?: any
    options_endpoint?: string | any
    options_text_key?: string
    options_value_key?: string
    triggers_validation?: boolean
    validations?: FieldValidation[]
    events?: FieldEvent[]
}

export interface DynamicServiceFormProps {
    fields: FormFieldSchema[]
    validationWorkflowId?: string | null
    onSubmit: (data: Record<string, any>) => void
    onEvent?: (event: {
        type: 'validation' | 'api_event' | 'workflow'
        field: string
        status: 'start' | 'success' | 'error'
        message?: string
    }) => void
    submitLabel?: string
    isSubmitting?: boolean
}

export function DynamicServiceForm({
    fields,
    validationWorkflowId,
    onSubmit,
    onEvent,
    submitLabel = 'Submit',
    isSubmitting = false
}: DynamicServiceFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [fieldErrors, setFieldErrors] = useState<Record<string, string | null>>({})
    const [isEvaluating, setIsEvaluating] = useState<string | null>(null)

    // api_select: fetched options per field name
    const [apiOptions, setApiOptions] = useState<Record<string, { label: string; value: any }[]>>({})
    const [loadingOptions, setLoadingOptions] = useState<Record<string, boolean>>({})

    // autocomplete_select: per-field search state
    const [searchTerms, setSearchTerms] = useState<Record<string, string>>({})
    const [openDropdown, setOpenDropdown] = useState<string | null>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close autocomplete dropdown on outside click
    useEffect(() => {
        function handle(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpenDropdown(null)
            }
        }
        document.addEventListener('mousedown', handle)
        return () => document.removeEventListener('mousedown', handle)
    }, [])

    // Pre-fetch options for api_select fields on mount
    const fetchApiOptions = useCallback(async (field: FormFieldSchema) => {
        const endpointId = typeof field.options_endpoint === 'object'
            ? field.options_endpoint?.id
            : field.options_endpoint
        if (!endpointId) return

        setLoadingOptions(prev => ({ ...prev, [field.name]: true }))
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
            setApiOptions(prev => ({ ...prev, [field.name]: opts }))
        } catch (e) {
            console.error(`[DSF] Failed to fetch options for field ${field.name}:`, e)
        } finally {
            setLoadingOptions(prev => ({ ...prev, [field.name]: false }))
        }
    }, [])

    useEffect(() => {
        fields.forEach(field => {
            if (field.type === 'api_select' && field.options_endpoint) {
                fetchApiOptions(field)
            }
        })
    }, [fields, fetchApiOptions])

    // ── Static options parser ─────────────────────────────────────────────
    const parseOptions = (options: any): { label: string; value: any }[] => {
        if (!options) return []
        if (typeof options === 'string') {
            const trimmed = options.trim()
            if (trimmed.startsWith('[')) {
                try {
                    const arr = JSON.parse(trimmed)
                    return arr.map((o: any) =>
                        typeof o === 'object'
                            ? { label: o.label ?? o.name ?? o.value, value: o.value ?? o }
                            : { label: String(o), value: o }
                    )
                } catch (_) {}
            }
            return trimmed.split(',').map(o => {
                const parts = o.split('-').map((s: string) => s.trim())
                return { label: parts[0], value: parts[1] || parts[0] }
            })
        }
        if (Array.isArray(options)) {
            return options.map(o =>
                typeof o === 'object'
                    ? { label: o.label ?? o.name ?? String(o.value), value: o.value ?? o }
                    : { label: String(o), value: o }
            )
        }
        return []
    }

    // ── Validation ────────────────────────────────────────────────────────
    const validateField = async (field: FormFieldSchema, value: any): Promise<boolean> => {
        if (field.type === 'hidden') return true

        if (field.required && (value === undefined || value === null || value === '')) {
            setFieldErrors(prev => ({ ...prev, [field.name]: `${field.label} is required` }))
            return false
        }

        if (!field.validations || field.validations.length === 0) return true

        for (const v of field.validations) {
            if (v.type === 'regex' && v.value) {
                const re = new RegExp(v.value)
                if (!re.test(String(value))) {
                    const msg = v.errorMessage || 'Invalid format'
                    setFieldErrors(prev => ({ ...prev, [field.name]: msg }))
                    onEvent?.({ type: 'validation', field: field.name, status: 'error', message: msg })
                    return false
                }
            }
            if (v.type === 'min' && v.value !== undefined) {
                const num = parseFloat(value)
                if (isNaN(num) || num < parseFloat(v.value)) {
                    const msg = v.errorMessage || `Minimum value is ${v.value}`
                    setFieldErrors(prev => ({ ...prev, [field.name]: msg }))
                    onEvent?.({ type: 'validation', field: field.name, status: 'error', message: msg })
                    return false
                }
            }
            if (v.type === 'max' && v.value !== undefined) {
                const num = parseFloat(value)
                if (isNaN(num) || num > parseFloat(v.value)) {
                    const msg = v.errorMessage || `Maximum value is ${v.value}`
                    setFieldErrors(prev => ({ ...prev, [field.name]: msg }))
                    onEvent?.({ type: 'validation', field: field.name, status: 'error', message: msg })
                    return false
                }
            }
        }

        setFieldErrors(prev => ({ ...prev, [field.name]: null }))
        onEvent?.({ type: 'validation', field: field.name, status: 'success' })
        return true
    }

    // ── Event execution ───────────────────────────────────────────────────
    const handleEvents = async (
        field: FormFieldSchema,
        trigger: 'onChange' | 'onBlur' | 'onLoad' | 'onCondition',
        value: any,
        extraData?: any
    ) => {
        const events = field.events?.filter(e => e.trigger === trigger)
        if (!events || events.length === 0) return

        for (const event of events) {
            // SET_VALUES / SET_VALUE
            if ((event.action === 'SET_VALUES' || event.action === 'SET_VALUE') && event.mappingConfig) {
                const updates = applyMappingConfig(event.mappingConfig, null, value, extraData)
                setFormData(prev => ({ ...prev, ...updates }))
                continue
            }

            if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
                const eid = typeof event.endpointId === 'object' ? (event.endpointId as any).id : event.endpointId
                setIsEvaluating(field.name)
                onEvent?.({ type: 'api_event', field: field.name, status: 'start', message: `Executing ${eid}` })
                try {
                    const endpointRes = await fetch('/api/endpoints/execute', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            endpointId: eid,
                            dynamicPayload: { ...formData, [field.name]: value }
                        })
                    })
                    const apiData = await endpointRes.json()
                    const responseData = apiData.data ?? apiData.Payload ?? apiData

                    if ((apiData.success !== false) && event.mappingConfig) {
                        const updates = applyMappingConfig(event.mappingConfig, responseData, value, extraData)
                        if (Object.keys(updates).length > 0) {
                            setFormData(prev => ({ ...prev, ...updates }))
                            onEvent?.({ type: 'api_event', field: field.name, status: 'success', message: `Mapped ${Object.keys(updates).length} fields` })
                        }
                    } else if (apiData.success === false) {
                        const msg = apiData.error || 'Validation failed'
                        setFieldErrors(prev => ({ ...prev, [field.name]: msg }))
                        onEvent?.({ type: 'api_event', field: field.name, status: 'error', message: msg })
                    }
                } catch (e: any) {
                    onEvent?.({ type: 'api_event', field: field.name, status: 'error', message: e.message })
                } finally {
                    setIsEvaluating(null)
                }
            }
        }
    }

    // ── Change handler ────────────────────────────────────────────────────
    const handleChange = (name: string, value: any, extraData?: any) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        if (fieldErrors[name]) setFieldErrors(prev => ({ ...prev, [name]: null }))

        const field = fields.find(f => f.name === name)
        if (field?.events) {
            handleEvents(field, 'onChange', value, extraData)

            field.events.filter(e => e.trigger === 'onCondition').forEach(evt => {
                if (!evt.condition) return
                const { type, value: targetValue } = evt.condition
                const currentVal = String(value || '')
                let meets = false
                if (type === 'length' && currentVal.length === Number(targetValue)) meets = true
                else if (type === 'regex' && new RegExp(String(targetValue)).test(currentVal)) meets = true
                else if (type === 'regex_not_match' && !new RegExp(String(targetValue)).test(currentVal)) meets = true
                if (meets) handleEvents(field, 'onCondition', value, extraData)
            })
        }
    }

    // ── Blur handler ──────────────────────────────────────────────────────
    const handleBlur = async (field: FormFieldSchema) => {
        const value = formData[field.name]
        const isValid = await validateField(field, value)
        if (!isValid) return

        await handleEvents(field, 'onBlur', value)

        // Legacy workflow validation
        if (field.triggers_validation && validationWorkflowId && !isEvaluating) {
            if (!value) return
            setIsEvaluating(field.name)
            onEvent?.({ type: 'workflow', field: field.name, status: 'start', message: 'Triggering validation workflow' })
            try {
                const result = await runWorkflow(validationWorkflowId, { [field.name]: value })
                if (result.success && result.executionId) {
                    let completed = false
                    let attempts = 0
                    while (!completed && attempts < 15) {
                        attempts++
                        await new Promise(r => setTimeout(r, 1000))
                        const pollRes = await fetch(`/api/workflows/executions/${result.executionId}`)
                        const data = await pollRes.json()
                        if (data.success && data.execution?.status === 'COMPLETED') {
                            completed = true
                            const lastPhase = data.execution.phases?.[data.execution.phases.length - 1]
                            if (lastPhase?.outputs) setFormData(prev => ({ ...prev, ...lastPhase.outputs }))
                            onEvent?.({ type: 'workflow', field: field.name, status: 'success' })
                        } else if (data.execution?.status === 'FAILED') {
                            completed = true
                            setFieldErrors(prev => ({ ...prev, [field.name]: 'Advanced validation failed' }))
                            onEvent?.({ type: 'workflow', field: field.name, status: 'error', message: 'Workflow Failed' })
                        }
                    }
                }
            } finally {
                setIsEvaluating(null)
            }
        }
    }

    // ── Submit handler ────────────────────────────────────────────────────
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        let hasErrors = false
        for (const f of fields) {
            const isValid = await validateField(f, formData[f.name])
            if (!isValid) hasErrors = true
        }
        if (hasErrors) {
            toast.error('Please fix form errors before submitting')
            return
        }
        onSubmit(formData)
    }

    // ── Field renderer ────────────────────────────────────────────────────
    const renderField = (field: FormFieldSchema) => {
        const isLoading = isEvaluating === field.name

        // ── Hidden — rendered as invisible input only ──────────────────
        if (field.type === 'hidden') {
            return (
                <input
                    key={field.name}
                    type="hidden"
                    name={field.name}
                    value={formData[field.name] ?? ''}
                    readOnly
                />
            )
        }

        return (
            <div key={field.name} className="flex flex-col gap-1.5 relative">
                <label className="text-sm font-medium flex items-center gap-1">
                    {field.label}
                    {field.required && <span className="text-destructive">*</span>}
                    {isLoading && <Loader2 size={12} className="animate-spin text-muted-foreground ml-2" />}
                </label>

                {/* File */}
                {field.type === 'file' ? (
                    <div className="relative">
                        <label
                            htmlFor={`file-${field.name}`}
                            className={`flex items-center gap-3 h-10 w-full rounded-md border px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${
                                fieldErrors[field.name] ? 'border-destructive' : 'border-input'
                            }`}
                        >
                            <Upload size={14} className="text-muted-foreground shrink-0" />
                            <span className="text-muted-foreground truncate">
                                {formData[field.name]?.name || field.placeholder || 'Choose file...'}
                            </span>
                        </label>
                        <input
                            id={`file-${field.name}`}
                            type="file"
                            className="sr-only"
                            disabled={isSubmitting}
                            onChange={e => {
                                const file = e.target.files?.[0]
                                if (file) handleChange(field.name, file)
                            }}
                        />
                    </div>

                /* Destination bank lookup */
                ) : field.type === 'destination_bank_lookup' ? (
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <select
                            className={`flex h-10 w-full rounded-md border bg-transparent pl-8 pr-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                                fieldErrors[field.name] ? 'border-destructive' : 'border-input'
                            }`}
                            value={formData[field.name] || ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            disabled={isSubmitting}
                            onBlur={() => handleBlur(field)}
                        >
                            <option value="" disabled>Select bank...</option>
                            {NIGERIAN_BANKS.map(bank => (
                                <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>
                            ))}
                        </select>
                    </div>

                /* Static select */
                ) : field.type === 'select' ? (
                    <select
                        className={`flex h-10 w-full items-center rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                            fieldErrors[field.name] ? 'border-destructive' : 'border-input'
                        }`}
                        value={formData[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        disabled={field.name === isEvaluating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                    >
                        <option value="" disabled>Select option...</option>
                        {parseOptions(field.options).map((o, idx) => (
                            <option key={`${o.value}-${idx}`} value={o.value}>{o.label}</option>
                        ))}
                    </select>

                /* API Select — async fetched options */
                ) : field.type === 'api_select' ? (
                    <div className="relative">
                        {loadingOptions[field.name] && (
                            <Loader2 size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin pointer-events-none" />
                        )}
                        <select
                            className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring ${
                                fieldErrors[field.name] ? 'border-destructive' : 'border-input'
                            } ${loadingOptions[field.name] ? 'opacity-60' : ''}`}
                            value={formData[field.name] || ''}
                            onChange={e => handleChange(field.name, e.target.value)}
                            disabled={field.name === isEvaluating || isSubmitting || loadingOptions[field.name]}
                            onBlur={() => handleBlur(field)}
                        >
                            <option value="" disabled>
                                {loadingOptions[field.name] ? 'Loading...' : `Select ${field.label.toLowerCase()}...`}
                            </option>
                            {(apiOptions[field.name] || []).map((o, idx) => (
                                <option key={`${o.value}-${idx}`} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>

                /* Autocomplete Select */
                ) : field.type === 'autocomplete_select' ? (() => {
                    const allOptions = parseOptions(field.options)
                    const searchTerm = searchTerms[field.name] || ''
                    const filtered = searchTerm
                        ? allOptions.filter(o => o.label.toLowerCase().includes(searchTerm.toLowerCase()))
                        : allOptions
                    const selectedLabel = allOptions.find(o => String(o.value) === String(formData[field.name]))?.label

                    return (
                        <div
                            className="relative"
                            ref={openDropdown === field.name ? dropdownRef : undefined}
                        >
                            <div
                                className={`flex h-10 w-full rounded-md border bg-transparent px-3 py-2 text-sm cursor-pointer ${
                                    fieldErrors[field.name] ? 'border-destructive' : 'border-input'
                                }`}
                                onClick={() => setOpenDropdown(openDropdown === field.name ? null : field.name)}
                            >
                                <span className={`flex-1 truncate ${selectedLabel ? '' : 'text-muted-foreground'}`}>
                                    {selectedLabel || `Select ${field.label.toLowerCase()}...`}
                                </span>
                                {formData[field.name] ? (
                                    <X
                                        size={13}
                                        className="text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
                                        onClick={e => {
                                            e.stopPropagation()
                                            handleChange(field.name, '')
                                            setSearchTerms(prev => ({ ...prev, [field.name]: '' }))
                                        }}
                                    />
                                ) : (
                                    <ChevronDown size={13} className="text-muted-foreground shrink-0 mt-0.5" />
                                )}
                            </div>
                            {openDropdown === field.name && (
                                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1">
                                    <div className="p-1.5 border-b">
                                        <div className="relative">
                                            <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                autoFocus
                                                className="w-full h-7 pl-6 pr-2 text-xs rounded border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                                placeholder="Search..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerms(prev => ({ ...prev, [field.name]: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filtered.length === 0 ? (
                                            <p className="text-xs text-muted-foreground text-center py-3">No options found</p>
                                        ) : filtered.map((o, idx) => (
                                            <div
                                                key={`${o.value}-${idx}`}
                                                className={`px-3 py-1.5 text-sm cursor-pointer hover:bg-muted transition-colors ${
                                                    String(formData[field.name]) === String(o.value) ? 'bg-muted font-medium' : ''
                                                }`}
                                                onClick={() => {
                                                    handleChange(field.name, o.value)
                                                    setOpenDropdown(null)
                                                    setSearchTerms(prev => ({ ...prev, [field.name]: '' }))
                                                }}
                                            >
                                                {o.label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })()

                /* Beneficiary select */
                : field.type === 'beneficiary_select' ? (
                    <Input
                        type="text"
                        value={formData[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || 'Enter account number...'}
                        disabled={field.name === isEvaluating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                        className={`${isLoading ? 'pr-8 border-primary/50 ring-1 ring-primary/20' : ''} ${fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />

                /* Default text / number / email */
                ) : (
                    <Input
                        type={field.type === 'number' ? 'number' : field.type === 'email' ? 'email' : 'text'}
                        value={formData[field.name] || ''}
                        onChange={e => handleChange(field.name, e.target.value)}
                        placeholder={field.placeholder || ''}
                        disabled={field.name === isEvaluating || isSubmitting}
                        onBlur={() => handleBlur(field)}
                        className={`${isLoading ? 'pr-8 border-primary/50 ring-1 ring-primary/20' : ''} ${fieldErrors[field.name] ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                    />
                )}

                {fieldErrors[field.name] && (
                    <p className="text-[11px] text-destructive font-medium mt-0.5">
                        {fieldErrors[field.name]}
                    </p>
                )}

                {field.description && !fieldErrors[field.name] && (
                    <p className="text-[11px] text-muted-foreground italic">{field.description}</p>
                )}

                {!fieldErrors[field.name] && field.triggers_validation && (
                    <p className="text-[10px] text-muted-foreground italic">
                        This field triggers automatic validation.
                    </p>
                )}
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(field => renderField(field))}

            <div className="pt-4 border-t">
                <button
                    type="submit"
                    disabled={isSubmitting || isEvaluating !== null}
                    className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                    {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                    {submitLabel}
                </button>
            </div>
        </form>
    )
}
