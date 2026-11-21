import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Eye, Info, PlayCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { DeleteRunButton } from './DeleteRunButton'
import { BankPageHeader } from '@/components/banking/page-header'
import { SubsystemNav } from '@/components/banking/subsystem-nav'

export default async function WorkflowRunsPage() {
    const payload = await getPayload({ config })

    const runsRes = await payload.find({
        collection: 'workflow-executions',
        sort: '-startedAt',
        depth: 1, // To get the workflow name
    })

    const runs = runsRes.docs as any[]
    const completed = runs.filter((r) => r.status === 'COMPLETED').length
    const failed = runs.filter((r) => r.status === 'FAILED').length
    const inFlight = runs.filter((r) => r.status === 'PENDING' || r.status === 'RUNNING' || r.status === 'WAITING_APPROVAL').length

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6">
            <BankPageHeader
                badge="Automation Telemetry"
                livePill={`${runs.length} Executions`}
                liveTone={failed > 0 ? "amber" : "emerald"}
                title="Workflow Run History"
                subtitle="Inspect phase-by-phase execution logs, resolved payload inputs, API outputs, and approval gates."
            />

            <SubsystemNav group="automation" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                    { label: "Total Recorded Runs", value: runs.length, sub: "Audit execution ledger" },
                    { label: "Completed", value: completed, sub: "Settled cleanly" },
                    { label: "Failed", value: failed, sub: "Click eye icon to inspect" },
                    { label: "In-Flight / Approval", value: inFlight, sub: "Pending or awaiting gate" },
                ].map((k) => (
                    <div key={k.label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</p>
                        <p className="text-2xl font-black font-mono text-foreground">{k.value}</p>
                        <p className="text-[11px] text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            <div className="border rounded-xl shadow-sm bg-background overflow-x-auto overflow-y-hidden">
                {runs.length === 0 ? (
                    <div className="p-8 sm:p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-base sm:text-lg font-medium text-foreground">No executions recorded</h3>
                        <p className="text-sm sm:text-base mt-1">Workflows will appear here once they are triggered.</p>
                    </div>
                ) : (
                    <div className="min-w-[800px]">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Execution ID</th>
                                    <th className="px-6 py-4 font-medium">Workflow</th>
                                    <th className="px-6 py-4 font-medium">Status</th>
                                    <th className="px-6 py-4 font-medium">Trigger</th>
                                    <th className="px-6 py-4 font-medium">Started At</th>
                                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {runs.map((run) => (
                                    <tr key={run.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4 font-mono text-xs opacity-70">
                                            {String(run.id).slice(0, 8)}...
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium inline-flex items-center gap-2">
                                                <PlayCircle size={14} className="text-muted-foreground" />
                                                {typeof run.workflow === 'object' ? run.workflow.name : 'Unknown Workflow'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge
                                                variant="outline"
                                                className={`font-normal ${run.status === 'COMPLETED' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    run.status === 'FAILED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                        run.status === 'WAITING_APPROVAL' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                            'bg-blue-500/10 text-blue-600 border-blue-500/20'
                                                    }`}
                                            >
                                                {run.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="secondary" className="font-normal">
                                                {run.trigger}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {run.startedAt ? format(new Date(run.startedAt), 'MMM d, h:mm:ss a') : '--'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/workflows/runs/${run.id}`}
                                                    className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-md text-foreground transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye size={16} />
                                                </Link>
                                                <DeleteRunButton id={run.id as string} />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
