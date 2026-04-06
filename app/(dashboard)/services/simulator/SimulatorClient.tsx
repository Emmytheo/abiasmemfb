'use client'

import React, { useState } from 'react'
import { DynamicServiceForm } from '@/components/forms/DynamicServiceForm'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'
import { Loader2 } from 'lucide-react'

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
    const [logs, setLogs] = useState<{timestamp: string, type: string, message: string, status: string}[]>([])

    const addLog = (type: string, message: string, status: string = 'info') => {
        setLogs(prev => [{
            timestamp: new Date().toLocaleTimeString(),
            type,
            message,
            status
        }, ...prev].slice(0, 50))
    }

    const selectedService = availableServices.find(s => s.id === selectedId)

    const handleSubmit = async (data: Record<string, any>) => {
        if (!selectedService?.execution_workflow) {
            toast.error('This service has no execution workflow configured.')
            return
        }

        setIsExecuting(true)
        setExecutionResult(null)
        addLog('workflow', `Initiating execution for ${selectedService.name}`, 'start')
        
        try {
            const result = await runWorkflow(selectedService.execution_workflow, data)
            
            if (result.success && result.executionId) {
                addLog('workflow', `Workflow started (ID: ${result.executionId})`, 'success')
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
                            addLog('workflow', `Workflow finished with status: ${status}`, status === 'COMPLETED' ? 'success' : 'error')
                        }
                    }
                }
            } else {
                throw new Error(result.error || 'Execution failed to start')
            }
        } catch (e: any) {
            addLog('error', e.message, 'error')
            toast.error(e.message || 'Error executing service')
        } finally {
            setIsExecuting(false)
        }
    }

    const handleFormEvent = (event: any) => {
        const statusMap: Record<string, string> = {
            'start': 'info',
            'success': 'success',
            'error': 'error'
        }
        addLog(event.type, `${event.field}: ${event.message || event.status}`, statusMap[event.status])
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
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-primary">Simulated App Form</h3>
                            {isExecuting && (
                                <div className="flex items-center gap-2 text-[10px] text-primary animate-pulse">
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                    EXT_WORKFLOW_RUNNING
                                </div>
                            )}
                        </div>
                        {selectedService.form_schema.length > 0 ? (
                            <DynamicServiceForm 
                                fields={selectedService.form_schema}
                                validationWorkflowId={selectedService.validation_workflow}
                                onSubmit={handleSubmit}
                                onEvent={handleFormEvent}
                                submitLabel={`Execute ${selectedService.name}`}
                                isSubmitting={isExecuting}
                            />
                        ) : (
                            <p className="text-xs text-muted-foreground italic">No form fields defined for this service.</p>
                        )}
                    </div>
                )}
            </div>

            <div className="space-y-6">
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 font-mono text-[11px] h-[300px] flex flex-col shadow-2xl">
                    <div className="flex items-center justify-between mb-3 border-b border-zinc-800 pb-2">
                        <h4 className="text-zinc-500 uppercase tracking-widest text-[9px] font-black">Event Stream</h4>
                        <div className="flex gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-1.5 custom-scrollbar pr-2">
                        {logs.length === 0 && <p className="text-zinc-700 italic">Awaiting interactions...</p>}
                        {logs.map((log, i) => (
                            <div key={i} className="flex gap-3 animate-in slide-in-from-left-1 duration-200">
                                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                                <span className={`uppercase font-bold shrink-0 ${
                                    log.status === 'error' ? 'text-rose-500' : 
                                    log.status === 'success' ? 'text-emerald-500' : 'text-blue-400'
                                }`}>{log.type}</span>
                                <span className="text-zinc-300 break-all">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-muted/30 border rounded-xl p-4 font-mono text-xs h-[250px] overflow-auto flex flex-col">
                    <h4 className="font-semibold text-muted-foreground mb-3 uppercase tracking-wider text-[10px] border-b pb-2">Execution Output</h4>
                    {executionResult ? (
                        <pre className="text-primary/90 whitespace-pre-wrap flex-1">
                            {JSON.stringify(executionResult.phases || executionResult, null, 2)}
                        </pre>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground/30 italic">
                            No workflow data captured
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
