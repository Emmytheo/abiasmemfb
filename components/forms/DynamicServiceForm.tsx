'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'

import { FieldValidation, FieldEvent } from '@/lib/api/types'

export type FormFieldSchema = {
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'select' | 'destination_bank_lookup' | 'file'
    required?: boolean
    placeholder?: string
    options?: any
    triggers_validation?: boolean // Legacy Service specific
    validations?: FieldValidation[]
    events?: FieldEvent[]
}

export interface DynamicServiceFormProps {
    fields: FormFieldSchema[]
    validationWorkflowId?: string | null
    onSubmit: (data: Record<string, any>) => void
    onEvent?: (event: { type: 'validation' | 'api_event' | 'workflow', field: string, status: 'start' | 'success' | 'error', message?: string }) => void
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
    const [isEvaluating, setIsEvaluating] = useState<string | null>(null) // specific field being evaluated
    const [isValidatingWorkflow, setIsValidatingWorkflow] = useState(false)

    // Handle standard field edits
    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }))
        // Clear error when user types
        if (fieldErrors[name]) {
            setFieldErrors(prev => ({ ...prev, [name]: null }))
        }
        
        // Handle onChange events
        const field = fields.find(f => f.name === name)
        if (field?.events) {
            handleEvents(field, 'onChange', value)
        }
    }

    const validateField = async (field: FormFieldSchema, value: any): Promise<boolean> => {
        if (field.required && !value) {
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

    const handleEvents = async (field: FormFieldSchema, trigger: 'onChange' | 'onBlur' | 'onLoad', value: any) => {
        const events = field.events?.filter(e => e.trigger === trigger)
        if (!events || events.length === 0) return

        for (const event of events) {
            if (event.action === 'EXECUTE_ENDPOINT' && event.endpointId) {
                setIsEvaluating(field.name)
                onEvent?.({ type: 'api_event', field: field.name, status: 'start', message: `Executing endpoint ${event.endpointId}` })
                try {
                    const endpointRes = await fetch(`/api/endpoints/execute/${event.endpointId}`, {
                        method: 'POST',
                        body: JSON.stringify({ ...formData, [field.name]: value })
                    })
                    const apiData = await endpointRes.json()
                    
                    if (apiData.success && event.mappingConfig) {
                        const newUpdates: Record<string, any> = {}
                        Object.entries(event.mappingConfig).forEach(([apiKey, formKey]) => {
                            if (apiData.data[apiKey] !== undefined) {
                                newUpdates[formKey] = apiData.data[apiKey]
                            }
                        })
                        setFormData(prev => ({ ...prev, ...newUpdates }))
                        onEvent?.({ type: 'api_event', field: field.name, status: 'success', message: `Mapped ${Object.keys(newUpdates).length} fields` })
                    } else if (!apiData.success) {
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

    // Handle blur events
    const handleBlur = async (field: FormFieldSchema) => {
        const value = formData[field.name]
        
        // 1. Run local validations
        const isValid = await validateField(field, value)
        if (!isValid) return

        // 2. Trigger events (onBlur)
        await handleEvents(field, 'onBlur', value)

        // 3. Legacy triggers_validation (Workflow)
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
                            if (data.execution.phases) {
                                const lastPhase = data.execution.phases[data.execution.phases.length - 1]
                                if (lastPhase?.outputs) setFormData(prev => ({ ...prev, ...lastPhase.outputs }))
                            }
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        // Run all validations
        let hasErrors = false
        for (const f of fields) {
            const isValid = await validateField(f, formData[f.name])
            if (!isValid) hasErrors = true
        }

        if (hasErrors) {
            toast.error("Please fix form errors before submitting")
            return
        }

        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {fields.map(field => {
                const isLoading = isEvaluating === field.name

                return (
                    <div key={field.name} className="flex flex-col gap-1.5 relative">
                        <label className="text-sm font-medium flex items-center gap-1">
                            {field.label}
                            {field.required && <span className="text-destructive">*</span>}
                            {isLoading && <Loader2 size={12} className="animate-spin text-muted-foreground ml-2" />}
                        </label>
                        
                        {field.type === 'select' ? (
                            <select
                                className={`flex h-10 w-full items-center justify-between rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${fieldErrors[field.name] ? 'border-destructive' : 'border-input'}`}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                disabled={field.name === isEvaluating || isSubmitting}
                                onBlur={() => handleBlur(field)}
                            >
                                <option value="" disabled>Select option...</option>
                                {typeof field.options === 'string' ? (
                                    field.options.split(',').map((o: string) => {
                                        const parts = o.split('-')
                                        const label = parts[0]?.trim()
                                        const val = parts[1]?.trim() || label
                                        return <option key={val} value={val}>{label}</option>
                                    })
                                ) : Array.isArray(field.options) ? (
                                    field.options.map((o: any) => (
                                        <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
                                    ))
                                ) : null}
                            </select>
                        ) : (
                            <Input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
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

                        {!fieldErrors[field.name] && field.triggers_validation && (
                            <p className="text-[10px] text-muted-foreground italic">
                                This field triggers automatic validation.
                            </p>
                        )}
                    </div>
                )
            })}

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
