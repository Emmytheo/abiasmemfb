'use client'
import React, { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { 
    PlayCircle, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ChevronRight, 
    FileText,
    Terminal,
    AlertCircle,
    Loader2
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Execution {
    id: string
    status: string
    trigger: string
    startedAt: string
    completedAt?: string
    logs?: any[]
    input?: any
    output?: any
}

interface WorkflowRunHistoryTabProps {
    workflowId: string
    refreshKey?: number // Used to trigger reload after a test run
}

export function WorkflowRunHistoryTab({ workflowId, refreshKey }: WorkflowRunHistoryTabProps) {
    const [runs, setRuns] = useState<Execution[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedRun, setSelectedRun] = useState<Execution | null>(null)

    useEffect(() => {
        const fetchRuns = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/workflow-executions?where[workflow][equals]=${workflowId}&sort=-startedAt&limit=20`)
                const data = await res.json()
                setRuns(data.docs || [])
            } catch (e) {
                console.error("Failed to fetch runs", e)
            } finally {
                setLoading(false)
            }
        }
        if (workflowId !== 'new') fetchRuns()
    }, [workflowId, refreshKey])

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground animate-in fade-in duration-500">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-xs font-medium uppercase tracking-widest">Loading Execution Ledger...</p>
        </div>
    )

    if (runs.length === 0) return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8 text-muted-foreground animate-in zoom-in-95 duration-500">
            <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <PlayCircle className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-bold text-foreground">No Runs Yet</h3>
            <p className="text-sm max-w-[280px] mt-1 italic">Workflows that have been triggered or tested will appear here with detailed telemetry.</p>
        </div>
    )

    return (
        <div className="flex flex-col h-full bg-background/50 backdrop-blur-sm">
            <div className="flex flex-1 min-h-0 overflow-hidden divide-x border-t">
                {/* Runs List */}
                <div className={cn(
                    "flex flex-col transition-all duration-300 min-h-0",
                    selectedRun ? "w-0 md:w-[380px] overflow-hidden" : "w-full"
                )}>
                    <div className="flex-1 overflow-y-auto scrollbar-hide">
                        <div className="p-2 space-y-1">
                            {runs.map((run) => (
                                <button
                                    key={run.id}
                                    onClick={() => setSelectedRun(run)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-xl transition-all group relative border border-transparent hover:border-primary/10",
                                        selectedRun?.id === run.id ? "bg-primary/5 border-primary/20 shadow-sm" : "hover:bg-muted/50"
                                    )}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-2">
                                            {run.status === 'COMPLETED' ? <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> :
                                             run.status === 'FAILED' ? <XCircle size={16} className="text-destructive shrink-0" /> :
                                             <Clock size={16} className="text-amber-500 shrink-0 animate-pulse" />}
                                            <span className="font-mono text-[10px] font-bold text-primary opacity-60">RUN #{String(run.id).slice(0, 6).toUpperCase()}</span>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] px-1.5 py-0 uppercase border-none bg-muted font-black tracking-tighter">
                                            {run.trigger}
                                        </Badge>
                                    </div>
                                    <div className="mt-2 flex items-end justify-between">
                                        <div>
                                            <p className="text-xs font-bold truncate max-w-[200px]">Pulse Execution Trace</p>
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {format(new Date(run.startedAt), 'MMM d, HH:mm:ss')}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className={cn(
                                            "text-muted-foreground transition-transform",
                                            selectedRun?.id === run.id ? "rotate-90 text-primary" : "group-hover:translate-x-0.5"
                                        )} />
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Log Detail Sub-view */}
                {selectedRun && (
                    <div className="flex-1 flex flex-col min-w-0 bg-background/80 animate-in slide-in-from-right-4 duration-300">
                        <header className="h-14 border-b px-4 flex items-center justify-between bg-muted/10 shrink-0">
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="icon" onClick={() => setSelectedRun(null)} className="md:hidden h-8 w-8 -ml-2">
                                    <ChevronRight className="rotate-180" size={18} />
                                </Button>
                                <div className="flex items-center gap-2">
                                    <Terminal size={14} className="text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Execution Telemetry</span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedRun(null)} className="h-8 text-[10px] font-black uppercase hidden md:flex">Close Trace</Button>
                        </header>
                        
                    <div className="flex-1 overflow-y-auto p-4 space-y-6">
                        {/* Trace Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 rounded-xl bg-muted/30 border border-muted/50">
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Stability</p>
                                <div className="flex items-center gap-2">
                                    <Badge className={cn(
                                        "uppercase text-[10px] border-none font-bold",
                                        selectedRun.status === 'COMPLETED' ? "bg-emerald-500 text-white" : "bg-destructive text-white"
                                    )}>
                                        {selectedRun.status}
                                    </Badge>
                                </div>
                            </div>
                            <div className="p-3 rounded-xl bg-muted/30 border border-muted/50">
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-1">Latency</p>
                                <p className="text-xs font-mono font-bold">-- ms</p>
                            </div>
                        </div>

                        {/* Logs Section */}
                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">
                                <FileText size={12} /> Log Stream
                            </h4>
                            <div className="space-y-2 font-mono text-[11px] leading-relaxed">
                                {selectedRun.logs && selectedRun.logs.length > 0 ? (
                                    selectedRun.logs.map((log, idx) => (
                                        <div key={idx} className="flex gap-3 text-foreground/80 group">
                                            <span className="text-muted-foreground opacity-50 shrink-0">{format(new Date(log.timestamp), 'HH:mm:ss.SSS')}</span>
                                            <span className={cn(
                                                "px-1 rounded font-bold uppercase text-[9px]",
                                                log.level === 'error' ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10"
                                            )}>{log.level}</span>
                                            <span className="group-hover:text-foreground transition-colors">{log.message}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                                        <AlertCircle size={20} className="mb-2 opacity-20" />
                                        <p className="text-[10px] font-bold italic">No log signals emitted during this pulse.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Data Inspect */}
                        <div className="space-y-4 pt-4 border-t">
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-2">Input Payload</p>
                                <pre className="p-4 rounded-xl bg-muted/50 text-[10px] overflow-auto border font-mono">
                                    {JSON.stringify(selectedRun.input || {}, null, 2)}
                                </pre>
                            </div>
                            <div>
                                <p className="text-[9px] uppercase tracking-widest text-muted-foreground font-black mb-2">Result Manifest</p>
                                <pre className="p-4 rounded-xl bg-muted/50 text-[10px] overflow-auto border font-mono">
                                    {JSON.stringify(selectedRun.output || {}, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    </div>
)
}
