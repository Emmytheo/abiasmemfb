'use client'

import React, { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'

export type FormFieldSchema = {
    name: string
    label: string
    type: 'text' | 'number' | 'email' | 'select' | 'destination_bank_lookup' | 'file'
    required?: boolean
    placeholder?: string
    options?: any
    triggers_validation?: boolean // Service specific
    validations?: any[] // Product Type specific
    events?: any[] // Product Type specific
}

export interface DynamicServiceFormProps {
    fields: FormFieldSchema[]
    validationWorkflowId?: string | null
    onSubmit: (data: Record<string, any>) => void
    submitLabel?: string
    isSubmitting?: boolean
}

export function DynamicServiceForm({
    fields,
    validationWorkflowId,
    onSubmit,
    submitLabel = 'Submit',
    isSubmitting = false
}: DynamicServiceFormProps) {
    const [formData, setFormData] = useState<Record<string, any>>({})
    const [isEvaluating, setIsEvaluating] = useState<string | null>(null) // specific field being evaluated
    const [isValidatingWorkflow, setIsValidatingWorkflow] = useState(false)

    // Handle standard field edits
    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    // Handle blur events (e.g. triggers_validation for Services)
    const handleBlur = async (field: FormFieldSchema) => {
        if (!field.triggers_validation || !validationWorkflowId || isEvaluating) return

        const val = formData[field.name]
        if (!val) return

        setIsEvaluating(field.name)
        try {
            // 1. Trigger the workflow locally via server action
            const result = await runWorkflow(validationWorkflowId, { [field.name]: val })
            if (!result.success || !result.executionId) {
                throw new Error(result.error || 'Failed to trigger validation workflow')
            }

            // 2. Poll execution until complete
            const executionId = result.executionId
            let completed = false
            let attempts = 0
            while (!completed && attempts < 15) { // 15s absolute max
                attempts++
                await new Promise(r => setTimeout(r, 1000))
                
                const pollRes = await fetch(`/api/workflows/executions/${executionId}`)
                const data = await pollRes.json()

                if (data.success && data.execution) {
                    const status = data.execution.status
                    if (status === 'COMPLETED') {
                        completed = true
                        // Extract output from the final node (or mapping) and assign it to the form
                        // Here we assume the workflow outputs standard key-values that map back exactly to form fields 
                        // (e.g. outputting "accountName": "John Doe" updates the "accountName" field)
                        if (data.execution.phases) {
                            const lastPhase = data.execution.phases[data.execution.phases.length - 1]
                            if (lastPhase?.outputs) {
                                // Merge outputs into formData dynamically!
                                setFormData(prev => ({ ...prev, ...lastPhase.outputs }))
                            }
                        }
                        toast.success(`${field.label} validated successfully`)
                    } else if (status === 'FAILED' || status === 'CANCELLED') {
                        completed = true
                        toast.error(`Validation failed for ${field.name}`)
                    }
                }
            }
            if (!completed) toast.error(`Validation timed out for ${field.name}`)

        } catch (e: any) {
            toast.error(e.message || 'Validation error')
        } finally {
            setIsEvaluating(null)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Client-side required check
        for (const f of fields) {
            if (f.required && !formData[f.name]) {
                toast.error(`"${f.label}" is required`)
                return
            }
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
                                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                disabled={field.name === isEvaluating || isSubmitting}
                                onBlur={() => handleBlur(field)}
                            >
                                <option value="" disabled>Select option...</option>
                                {typeof field.options === 'string' ? (
                                    field.options.split(',').map(o => {
                                        const parts = o.split('-')
                                        const label = parts[0]?.trim()
                                        const val = parts[1]?.trim() || label
                                        return <option key={val} value={val}>{label}</option>
                                    })
                                ) : (
                                    <option value="" disabled>Invalid options format</option>
                                )}
                            </select>
                        ) : (
                            <Input
                                type={field.type === 'number' ? 'number' : 'text'}
                                value={formData[field.name] || ''}
                                onChange={(e) => handleChange(field.name, e.target.value)}
                                placeholder={field.placeholder || ''}
                                disabled={field.name === isEvaluating || isSubmitting}
                                onBlur={() => handleBlur(field)}
                                className={isLoading ? 'pr-8 border-primary/50 ring-1 ring-primary/20' : ''}
                            />
                        )}

                        {field.triggers_validation && (
                            <p className="text-[10px] text-muted-foreground italic">
                                This field triggers automatic validation when you finish typing.
                            </p>
                        )}
                        {field.events && field.events.length > 0 && (
                            <p className="text-[10px] text-muted-foreground italic">
                                Interacting triggers dynamic API data checks.
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
