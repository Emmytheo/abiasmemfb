'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow, executeEndpointAction } from '@/app/(dashboard)/workflows/[id]/edit/actions'
import { FormField, FieldEvent } from '@/lib/api/types'

// Re-export for compatibility or use locally
export type FormFieldSchema = FormField & {
    // Legacy mapping for fields that haven't transitioned to 'id'
    name?: string;
    triggers_validation?: boolean;
}

// FormFieldSchema is now just an alias for the central FormField type
// with optional legacy field support if needed.

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

    // Initialize with default values if any, or trigger onLoad events
    useEffect(() => {
        fields.forEach(field => {
            if (field.events) {
                const onLoadEvents = field.events.filter(e => e.trigger === 'onLoad')
                onLoadEvents.forEach(evt => handleEvent(field, evt, formData[field.id]))
            }
        })
    }, [fields])

    const resolvePath = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => prev?.[curr], obj)
    }

    const parseOptions = (options: any): { label: string, value: any }[] => {
        if (!options) return []
        
        let processedOptions = options
        
        // 1. If it's a string, try smart parsing
        if (typeof options === 'string') {
            const trimmed = options.trim()
            if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
                try {
                    processedOptions = JSON.parse(trimmed)
                } catch (e) {
                    // Fallback to CSV if JSON parse fails
                }
            }
            
            // If still a string after JSON check, default to CSV
            if (typeof processedOptions === 'string') {
                return processedOptions.split(',').map(o => {
                    const parts = o.split('-').map(s => s.trim())
                    const label = parts[0] || ''
                    const val = parts[1] || label || ''
                    return { label, value: val }
                })
            }
        }

        // 2. If it's an array, normalize it
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

        // 3. If it's an object (key-value map), convert to array
        if (typeof processedOptions === 'object' && processedOptions !== null) {
            return Object.entries(processedOptions).map(([key, val]) => ({
                label: String(val),
                value: key
            }))
        }

        return []
    }

    const validateField = async (field: FormFieldSchema, value: any) => {
        if (field.required && !value) return `"${field.label}" is required`
        
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
                    // v.value here is the endpointId
                    try {
                        const body = { [field.id]: value }
                        const res = await executeEndpointAction(v.value, { body, query: body })
                        if (!res.success) return v.errorMessage || res.error || 'Validation failed'
                    } catch (e) {
                        return 'API Validation error'
                    }
                }
            }
        }
        return null
    }

    const handleEvent = async (field: FormFieldSchema, event: any, value: any) => {
        if (event.action === 'SET_VALUE' && event.mappingConfig) {
            // Simple static set or calculation if needed, but usually it's mapping from API
        }

        if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
            const eid = typeof event.endpointId === 'object' ? (event.endpointId as any).id : event.endpointId
            setActiveValidations(prev => ({ ...prev, [field.id]: true }))
            
            try {
                const result = await executeEndpointAction(eid, { body: { [field.id]: value }, query: { [field.id]: value } })
                if (result.success && result.data && event.mappingConfig) {
                    // Apply mappings: mappingConfig is { "api.path": "formFieldName" }
                    const newMappings: Record<string, any> = {}
                    for (const [apiPath, formKey] of Object.entries(event.mappingConfig)) {
                         const resolvedVal = resolvePath(result.data, apiPath)
                         if (resolvedVal !== undefined) newMappings[formKey as string] = resolvedVal
                    }
                    if (Object.keys(newMappings).length > 0) {
                        setFormData(prev => ({ ...prev, ...newMappings }))
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

    const handleChange = (field: FormFieldSchema, value: any) => {
        setFormData(prev => ({ ...prev, [field.id]: value }))
        
        // Clear error on change
        if (errors[field.id]) {
            setErrors(prev => {
                const newErrs = { ...prev }
                delete newErrs[field.id]
                return newErrs
            })
        }

        // Check for events
        if (field.events) {
            const changeEvents = field.events.filter(e => e.trigger === 'onChange')
            changeEvents.forEach(evt => handleEvent(field, evt, value))

            const conditionEvents = field.events.filter(e => e.trigger === 'onCondition')
            for (const evt of conditionEvents) {
                if (!evt.condition) continue
                const { type, value: targetValue } = evt.condition
                const currentVal = String(value || '')
                let meets = false
                if (type === 'length' && currentVal.length === Number(targetValue)) meets = true
                else if (type === 'regex' && new RegExp(String(targetValue)).test(currentVal)) meets = true
                else if (type === 'regex_not_match' && !new RegExp(String(targetValue)).test(currentVal)) meets = true

                if (meets) {
                    handleEvent(field, evt, value)
                }
            }
        }
    }

    const handleBlur = async (field: FormFieldSchema) => {
        const val = formData[field.id]
        
        // 1. Static & API validation
        setActiveValidations(prev => ({ ...prev, [field.id]: true }))
        const err = await validateField(field, val)
        setActiveValidations(prev => ({ ...prev, [field.id]: false }))

        if (err) {
            setErrors(prev => ({ ...prev, [field.id]: err }))
            return
        }

        // 2. Logic events (onBlur)
        if (field.events) {
            const blurEvents = field.events.filter(e => e.trigger === 'onBlur')
            blurEvents.forEach(evt => handleEvent(field, evt, val))
        }

        // 3. Legacy Service Validation Workflows
        if (field.triggers_validation && validationWorkflowId && val) {
            setActiveValidations(prev => ({ ...prev, [field.id]: true }))
            try {
                const result = await runWorkflow(validationWorkflowId, { [field.id]: val })
                if (result.success && result.executionId) {
                    // Poll for result (simplified for brevity, should use a better utility)
                    let completed = false
                    let attempts = 0
                    while (!completed && attempts < 10) {
                        attempts++
                        await new Promise(r => setTimeout(r, 1000))
                        const res = await fetch(`/api/workflows/executions/${result.executionId}`)
                        const data = await res.json()
                        if (data.success && data.execution?.status === 'COMPLETED') {
                             completed = true
                             if (data.execution.phases?.[data.execution.phases.length-1]?.outputs) {
                                 setFormData(prev => ({ ...prev, ...data.execution.phases[data.execution.phases.length-1].outputs }))
                             }
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

    return (
        <form onSubmit={handleSubmit} className="space-y-6 pb-12 sm:pb-0">
            <div className="grid grid-cols-1 gap-y-6">
                {fields.map(field => {
                    const isValidating = activeValidations[field.id]
                    const hasError = errors[field.id]

                    return (
                        <div key={field.id} className="group flex flex-col gap-2 transition-all">
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
                                {!hasError && formData[field.id] && !isValidating && (
                                    <CheckCircle2 size={12} className="text-emerald-500 animate-in zoom-in" />
                                )}
                            </div>

                            {field.type === 'select' ? (
                                <select
                                    className={`flex h-11 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${hasError ? 'border-rose-500/50 bg-rose-50/10' : 'border-input group-hover:border-primary/30'}`}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                    disabled={isValidating || isSubmitting}
                                    onBlur={() => handleBlur(field)}
                                >
                                    <option value="" disabled>Select {field.label.toLowerCase()}...</option>
                                    {(parseOptions(field.options) || []).map((opt, idx) => (
                                        <option key={`${opt.value}-${idx}`} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <Input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={formData[field.id] || ''}
                                    onChange={(e) => handleChange(field, e.target.value)}
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
                })}
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
