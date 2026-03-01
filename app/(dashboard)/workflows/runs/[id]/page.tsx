import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default async function WorkflowRunDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const payload = await getPayload({ config })

    const run = await payload.findByID({
        collection: 'workflow-executions',
        id,
        depth: 1,
    }).catch(() => null) as any

    if (!run) notFound()

    const phases = run.phases || []
    const wfName = typeof run.workflow === 'object' ? run.workflow.name : 'Deleted Workflow'

    const StatusIcon = ({ status }: { status: string }) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle className="text-green-500" size={18} />
            case 'FAILED': return <XCircle className="text-red-500" size={18} />
            case 'WAITING_APPROVAL': return <AlertCircle className="text-amber-500" size={18} />
            case 'RUNNING': return <Clock className="text-blue-500 animate-pulse" size={18} />
            default: return <Clock className="text-muted-foreground" size={18} />
        }
    }

    return (
        <div className="p-8 max-w-5xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-4 border-b pb-4">
                <Link href="/workflows/runs" className="p-2 hover:bg-muted rounded-full transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold tracking-tight">Execution Details</h1>
                        <Badge variant="outline" className="font-mono text-xs opacity-70 border-dashed">
                            {id}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <span>Workflow: <strong>{wfName}</strong></span>
                        <span>&bull;</span>
                        <span>Trigger: {run.trigger}</span>
                        <span>&bull;</span>
                        <span>Started: {format(new Date(run.startedAt), 'PP pp')}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold">Execution Timeline</h2>
                    <div className="space-y-4">
                        {phases.length === 0 ? (
                            <p className="text-muted-foreground italic text-sm">No phases recorded.</p>
                        ) : (
                            phases.map((phase: any, index: number) => (
                                <div key={`${phase.nodeId}-${index}`} className="border rounded-lg bg-card overflow-hidden shadow-sm">
                                    <div className="p-4 flex items-center justify-between bg-muted/20 border-b">
                                        <div className="flex items-center gap-3">
                                            <StatusIcon status={phase.status} />
                                            <div>
                                                <div className="font-semibold">{phase.nodeType}</div>
                                                <div className="text-xs text-muted-foreground font-mono">Node: {phase.nodeId}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <Badge variant="secondary" className="font-normal text-[10px] uppercase tracking-wider">
                                                Phase {phase.phaseNumber}
                                            </Badge>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {Math.max(0, new Date(phase.completedAt || new Date()).getTime() - new Date(phase.startedAt).getTime())}ms
                                            </div>
                                        </div>
                                    </div>

                                    {/* Phase Body */}
                                    <div className="p-4 space-y-4 text-sm">
                                        {/* Outputs */}
                                        {Object.keys(phase.outputs || {}).length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Outputs</div>
                                                <pre className="bg-muted/50 p-3 rounded-md overflow-x-auto text-[11px] font-mono border">
                                                    {JSON.stringify(phase.outputs, null, 2)}
                                                </pre>
                                            </div>
                                        )}

                                        {/* Logs */}
                                        {phase.logs && phase.logs.length > 0 && (
                                            <div>
                                                <div className="text-xs font-semibold text-muted-foreground uppercase mb-2">Logs</div>
                                                <div className="bg-black text-green-400 p-3 rounded-md overflow-x-auto text-[11px] font-mono space-y-1">
                                                    {phase.logs.map((log: any, i: number) => (
                                                        <div key={i} className={`flex gap-3 ${log.level === 'error' ? 'text-red-400' : log.level === 'warn' ? 'text-amber-400' : ''}`}>
                                                            <span className="opacity-50 select-none">[{format(new Date(log.timestamp), 'HH:mm:ss')}]</span>
                                                            <span className="opacity-50 w-12 select-none">[{log.level.toUpperCase()}]</span>
                                                            <span>{log.message}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="col-span-1 space-y-6">
                    <div className="border rounded-lg bg-card p-4 shadow-sm">
                        <h3 className="font-semibold text-sm mb-4">Input Data</h3>
                        <pre className="bg-muted p-3 rounded-md overflow-x-auto text-[11px] font-mono border">
                            {JSON.stringify(run.inputData, null, 2)}
                        </pre>
                    </div>

                    <div className="border rounded-lg bg-card p-4 shadow-sm">
                        <h3 className="font-semibold text-sm mb-4">Meta Properties</h3>
                        <ul className="text-sm space-y-2 text-muted-foreground">
                            <li className="flex justify-between">
                                <span>Final Status</span>
                                <span className="font-medium text-foreground">{run.status}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Deduplicated</span>
                                <span className="font-medium text-foreground">{run.isDeduplicated ? 'Yes' : 'No'}</span>
                            </li>
                            {run.idempotencyKey && (
                                <li className="flex justify-between items-center gap-2">
                                    <span>De-dup Key</span>
                                    <span className="font-mono text-[10px] truncate max-w-[120px]">{run.idempotencyKey}</span>
                                </li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
