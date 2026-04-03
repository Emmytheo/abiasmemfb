'use client'

import React, { useState } from 'react'
import { UniversalDynamicForm } from '@/components/forms/UniversalDynamicForm'
import { toast } from 'sonner'
import { runWorkflow } from '@/app/(dashboard)/workflows/[id]/edit/actions'

type ProductData = {
    id: string
    name: string
    category?: string
    form_schema: any[]
    workflowId: string | null
}

export function ProductSimulatorClient({ availableProducts }: { availableProducts: ProductData[] }) {
    const [selectedId, setSelectedId] = useState<string>('')
    const [isExecuting, setIsExecuting] = useState(false)
    const [applicationResult, setApplicationResult] = useState<any>(null)

    const selectedProduct = availableProducts.find(p => p.id === selectedId)

    const handleSubmit = async (data: Record<string, any>) => {
        if (!selectedProduct?.workflowId) {
            toast.warning('No automated workflow is associated with this product. Showing application data only.')
            setApplicationResult({ status: 'MOCK_SUBMITTED', data })
            return
        }

        setIsExecuting(true)
        setApplicationResult(null)
        try {
            toast.info(`Executing ${selectedProduct.name} application workflow...`)
            const result = await runWorkflow(selectedProduct.workflowId, data)
            
            if (result.success && result.executionId) {
                let completed = false
                let attempts = 0
                while (!completed && attempts < 15) {
                    attempts++
                    await new Promise(r => setTimeout(r, 1000))
                    const pollRes = await fetch(`/api/workflows/executions/${result.executionId}`)
                    const pollData = await pollRes.json()
                    
                    if (pollData.success && pollData.execution) {
                        const status = pollData.execution.status
                        if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
                            completed = true
                            setApplicationResult({
                                status,
                                execution: pollData.execution,
                                inputData: data
                            })
                            toast[status === 'COMPLETED' ? 'success' : 'error'](`Application processed: ${status}`)
                        }
                    }
                }
                if (!completed) toast.warning('Application processing is ongoing. Check tracker.')
            } else {
                throw new Error(result.error || 'Failed to start application flow')
            }
        } catch (e: any) {
            toast.error(e.message || 'Error processing application')
        } finally {
            setIsExecuting(false)
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-5 space-y-6">
                <div className="bg-muted/30 p-5 rounded-xl border border-dashed border-primary/20">
                    <label className="text-[10px] font-bold text-primary uppercase tracking-widest mb-3 block">Product Selection</label>
                    <select
                        className="flex h-12 w-full items-center justify-between rounded-lg border border-input bg-background/50 px-4 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        value={selectedId}
                        onChange={e => {
                            setSelectedId(e.target.value)
                            setApplicationResult(null)
                        }}
                    >
                        <option value="">— Select a Banking Product —</option>
                        {availableProducts.map(p => (
                            <option key={p.id} value={p.id}>[{p.category}] {p.name}</option>
                        ))}
                    </select>
                </div>

                {selectedProduct && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="h-8 w-1 bg-primary rounded-full" />
                            <h3 className="text-lg font-bold tracking-tight">Application Form</h3>
                        </div>
                        
                        <div className="bg-background rounded-2xl border p-6 shadow-sm border-primary/5">
                            {selectedProduct.form_schema.length > 0 ? (
                                <UniversalDynamicForm 
                                    fields={selectedProduct.form_schema}
                                    onSubmit={handleSubmit}
                                    submitLabel={`Submit Application`}
                                    isSubmitting={isExecuting}
                                />
                            ) : (
                                <div className="py-12 text-center">
                                    <p className="text-sm text-muted-foreground italic">No application fields defined.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="lg:col-span-7 flex flex-col space-y-4">
                 <div className="flex items-center justify-between">
                    <h4 className="font-bold text-primary uppercase tracking-widest text-[10px]">Processing Pipeline Monitor</h4>
                    {isExecuting && <span className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse font-bold bg-primary/5 px-3 py-1 rounded-full italic"><span className="h-1.5 w-1.5 rounded-full bg-primary" /> VALIDATING APPLICATION...</span>}
                </div>

                <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-8 font-mono text-[11px] overflow-auto shadow-sm min-h-[600px] relative">
                    <div className="absolute top-0 right-0 p-4">
                        <div className="h-2 w-2 rounded-full bg-zinc-800" />
                    </div>
                    {applicationResult ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-zinc-800/50">
                                <div>
                                    <div className="text-zinc-500 mb-1 text-[9px]">LIFECYCLE STATUS</div>
                                    <div className={`font-bold ${applicationResult.status === 'COMPLETED' ? 'text-emerald-400' : 'text-zinc-300'}`}>
                                        {applicationResult.status}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-zinc-500 mb-1 text-[9px]">PRODUCT ID</div>
                                    <div className="text-zinc-400">#MB-PRD-{selectedId.slice(0,6)}</div>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <div>
                                    <div className="text-[9px] text-zinc-500 mb-2 uppercase">Captured Application Data</div>
                                    <pre className="text-zinc-300 bg-zinc-900/50 p-4 rounded-lg border border-zinc-800/50 whitespace-pre-wrap leading-relaxed">
                                        {JSON.stringify(applicationResult.inputData || applicationResult.data, null, 2)}
                                    </pre>
                                </div>

                                {applicationResult.execution && (
                                    <div>
                                        <div className="text-[9px] text-zinc-500 mb-2 uppercase">Workflow Engine Resolution (Phases)</div>
                                        <pre className="text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                            {JSON.stringify(applicationResult.execution.phases, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-700 space-y-4 opacity-40">
                             <div className="h-16 w-16 rounded-full border border-zinc-800 flex items-center justify-center">
                                <span className="text-2xl">📋</span>
                             </div>
                             <div className="text-center space-y-1">
                                <p className="font-bold uppercase tracking-widest text-[9px]">Monitor Offline</p>
                                <p className="text-[10px]">Complete the application form to initiate processing.</p>
                             </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
