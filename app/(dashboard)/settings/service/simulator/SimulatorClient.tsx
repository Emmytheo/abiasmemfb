'use client'

import React, { useState } from 'react'
import { UniversalDynamicForm } from '@/components/forms/UniversalDynamicForm'
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-muted/30 p-4 rounded-lg border border-dashed">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Configuration</label>
                    <select
                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
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
                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-primary uppercase tracking-tight">Interactive Form Preview</h3>
                            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">Draft Mode</span>
                        </div>
                        {selectedService.form_schema.length > 0 ? (
                            <UniversalDynamicForm 
                                fields={selectedService.form_schema}
                                validationWorkflowId={selectedService.validation_workflow}
                                onSubmit={handleSubmit}
                                submitLabel={`Execute ${selectedService.name}`}
                                isSubmitting={isExecuting}
                            />
                        ) : (
                            <div className="p-8 text-center border rounded-xl bg-muted/10">
                                <p className="text-sm text-muted-foreground italic">No form fields defined for this service.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="lg:col-span-7 flex flex-col min-h-[500px]">
                <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-muted-foreground uppercase tracking-wider text-[10px]">Workflow Execution Monitor</h4>
                    {isExecuting && <span className="flex items-center gap-1.5 text-[10px] text-amber-500 animate-pulse font-bold"><span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> POLLING STATUS...</span>}
                </div>
                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl p-6 font-mono text-xs overflow-auto shadow-2xl">
                    {executionResult ? (
                        <div className="space-y-4">
                             <div className="flex gap-4 border-b border-zinc-800 pb-4">
                                <div><span className="text-zinc-500">STATUS:</span> <span className={executionResult.status === 'COMPLETED' ? 'text-emerald-400' : 'text-rose-400'}>{executionResult.status}</span></div>
                                <div><span className="text-zinc-500">ID:</span> <span className="text-zinc-300">{executionResult.id.slice(0,8)}...</span></div>
                             </div>
                             <pre className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                {JSON.stringify(executionResult.phases || executionResult, null, 2)}
                             </pre>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 space-y-2 opacity-50">
                            <div className="h-12 w-12 rounded-full border-2 border-zinc-800 border-t-zinc-700 flex items-center justify-center">
                                <span className="text-lg">⚙️</span>
                            </div>
                            <p className="font-medium">Awaiting execution data...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
