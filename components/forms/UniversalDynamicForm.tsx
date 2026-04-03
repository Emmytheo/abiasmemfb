'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow, executeEndpointAction } from '@/app/(dashboard)/workflows/[id]/edit/actions'

export type FormFieldSchema = {
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'select' | 'destination_bank_lookup' | 'file'
    required?: boolean
    placeholder?: string
    options?: any
    description?: string
    // Legacy Service Fields
    triggers_validation?: boolean 
    // New Product Type Fields
    validations?: Array<{
        type: 'regex' | 'min' | 'max' | 'api_lookup'
        value?: string
        errorMessage?: string
    }>
    events?: Array<{
        trigger: 'onChange' | 'onBlur' | 'onLoad'
        action: 'EXECUTE_ENDPOINT' | 'SET_VALUE'
        endpointId?: string | { id: string }
        mappingConfig?: Record<string, string>
    }>
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

    // Initialize with default values if any, or trigger onLoad events
    useEffect(() => {
        fields.forEach(field => {
            if (field.events) {
                const onLoadEvents = field.events.filter(e => e.trigger === 'onLoad')
                onLoadEvents.forEach(evt => handleEvent(field, evt, formData[field.name]))
            }
        })
    }, [fields])

    const resolvePath = (obj: any, path: string) => {
        return path.split('.').reduce((prev, curr) => prev?.[curr], obj)
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
                        const res = await executeEndpointAction(v.value, { body: { [field.name]: value }, query: { [field.name]: value } })
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
            const eid = typeof event.endpointId === 'object' ? event.endpointId.id : event.endpointId
            setActiveValidations(prev => ({ ...prev, [field.name]: true }))
            
            try {
                const result = await executeEndpointAction(eid, { body: { [field.name]: value }, query: { [field.name]: value } })
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
                    setErrors(prev => ({ ...prev, [field.name]: result.error || 'Validation API failed' }))
                }
            } catch (e: any) {
                console.error(e)
            } finally {
                setActiveValidations(prev => ({ ...prev, [field.name]: false }))
            }
        }
    }

    const handleChange = (field: FormFieldSchema, value: any) => {
        setFormData(prev => ({ ...prev, [field.name]: value }))
        
        // Clear error on change
        if (errors[field.name]) {
            setErrors(prev => {
                const newErrs = { ...prev }
                delete newErrs[field.name]
                return newErrs
            })
        }

        // Check for onChange events
        if (field.events) {
            const changeEvents = field.events.filter(e => e.trigger === 'onChange')
            changeEvents.forEach(evt => handleEvent(field, evt, value))
        }
    }

    const handleBlur = async (field: FormFieldSchema) => {
        const val = formData[field.name]
        
        // 1. Static & API validation
        setActiveValidations(prev => ({ ...prev, [field.name]: true }))
        const err = await validateField(field, val)
        setActiveValidations(prev => ({ ...prev, [field.name]: false }))

        if (err) {
            setErrors(prev => ({ ...prev, [field.name]: err }))
            return
        }

        // 2. Logic events (onBlur)
        if (field.events) {
            const blurEvents = field.events.filter(e => e.trigger === 'onBlur')
            blurEvents.forEach(evt => handleEvent(field, evt, val))
        }

        // 3. Legacy Service Validation Workflows
        if (field.triggers_validation && validationWorkflowId && val) {
            setActiveValidations(prev => ({ ...prev, [field.name]: true }))
            try {
                const result = await runWorkflow(validationWorkflowId, { [field.name]: val })
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
                            setErrors(prev => ({ ...prev, [field.name]: 'Verification failed' }))
                        }
                    }
                }
            } catch (e) {
                console.error(e)
            } finally {
                setActiveValidations(prev => ({ ...prev, [field.name]: false }))
            }
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const newErrors: Record<string, string> = {}
        
        for (const f of fields) {
            const err = await validateField(f, formData[f.name])
            if (err) newErrors[f.name] = err
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
                    const isValidating = activeValidations[field.name]
                    const hasError = errors[field.name]

                    return (
                        <div key={field.name} className="group flex flex-col gap-2 transition-all">
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
                                {!hasError && formData[field.name] && !isValidating && (
                                    <CheckCircle2 size={12} className="text-emerald-500 animate-in zoom-in" />
                                )}
                            </div>

                            {field.type === 'select' ? (
                                <select
                                    className={`flex h-11 w-full rounded-xl border bg-background/50 px-3 py-2 text-sm shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/10 ${hasError ? 'border-rose-500/50 bg-rose-50/10' : 'border-input group-hover:border-primary/30'}`}
                                    value={formData[field.name] || ''}
                                    onChange={(e) => handleChange(field, e.target.value)}
                                    disabled={isValidating || isSubmitting}
                                    onBlur={() => handleBlur(field)}
                                >
                                    <option value="" disabled>Select {field.label.toLowerCase()}...</option>
                                    {typeof field.options === 'string' ? (
                                        field.options.split(',').map(o => {
                                            const parts = o.split('-')
                                            const label = parts[0]?.trim()
                                            const val = parts[1]?.trim() || label
                                            return <option key={val} value={val}>{label}</option>
                                        })
                                    ) : Array.isArray(field.options) ? (
                                        field.options.map((o: any) => (
                                            <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
                                        ))
                                    ) : (
                                        <option value="" disabled>No options</option>
                                    )}
                                </select>
                            ) : (
                                <Input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    value={formData[field.name] || ''}
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
