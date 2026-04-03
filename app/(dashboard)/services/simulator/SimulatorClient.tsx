'use client'

import React, { useState } from 'react'
import { DynamicServiceForm } from '@/components/forms/DynamicServiceForm'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'

type ServiceData = {
    id: string
    name: string
    form_schema: any[]
    validation_workflow: string | null
    execution_workflow: string | null
}

export function SimulatorClient({ availableServices }: { availableServices: ServiceData[] }) {
    const [selectedId, setSelectedId] = useState<string>('')
    const [isExecuting, setIsExecuting] = useState(false)
    const [executionResult, setExecutionResult] = useState<any>(null)

    const selectedService = availableServices.find(s => s.id === selectedId)

    const handleSubmit = async (data: Record<string, any>) => {
        if (!selectedService?.execution_workflow) {
            toast.error('This service has no execution workflow configured.')
            return
        }

        setIsExecuting(true)
        setExecutionResult(null)
        try {
            toast.info('Initiating Execution Workflow...')
            const result = await runWorkflow(selectedService.execution_workflow, data)
            
            if (result.success && result.executionId) {
                // Poll for completion to show result
                let completed = false
                let attempts = 0
                while (!completed && attempts < 20) {
                    attempts++
                    await new Promise(r => setTimeout(r, 1000))
                    const pollRes = await fetch(`/api/workflows/executions/${result.executionId}`)
                    const pollData = await pollRes.json()
                    
                    if (pollData.success && pollData.execution) {
                        const status = pollData.execution.status
                        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
                            completed = true
                            setExecutionResult(pollData.execution)
                            toast[status === 'COMPLETED' ? 'success' : 'error'](`Workflow finished with status: ${status}`)
                        }
                    }
                }
                if (!completed) toast.warning('Workflow is taking a long time. Check executions tab.')
            } else {
                throw new Error(result.error || 'Execution failed to start')
            }
        } catch (e: any) {
            toast.error(e.message || 'Error executing service')
        } finally {
            setIsExecuting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div>
                    <label className="text-sm font-medium mb-1.5 block">Select Service to Simulate</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedId}
                        onChange={e => {
                            setSelectedId(e.target.value)
                            setExecutionResult(null)
                        }}
                    >
                        <option value="">— Select a Service —</option>
                        {availableServices.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>

                {selectedService && (
                    <div className="pt-4 border-t">
                        <h3 className="text-sm font-semibold mb-4 text-primary">Simulated App Form</h3>
                        {selectedService.form_schema.length > 0 ? (
                            <DynamicServiceForm 
                                fields={selectedService.form_schema}
                                validationWorkflowId={selectedService.validation_workflow}
                                onSubmit={handleSubmit}
                                submitLabel={`Execute ${selectedService.name}`}
                                isSubmitting={isExecuting}
                            />
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No form fields defined for this service.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="bg-muted/30 border rounded-lg p-4 font-mono text-xs overflow-auto max-h-[500px]">
                <h4 className="font-semibold text-muted-foreground mb-3 uppercase tracking-wider text-[10px]">Execution Result Output</h4>
                {executionResult ? (
                    <pre className="text-primary/90 whitespace-pre-wrap">
                        {JSON.stringify(executionResult.phases || executionResult, null, 2)}
                    </pre>
                ) : (
                    <p className="text-muted-foreground/50">Submit the form to see output...</p>
                )}
            </div>
        </div>
    )
}
