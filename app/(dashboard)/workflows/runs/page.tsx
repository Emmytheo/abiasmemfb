import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { Eye, Info, PlayCircle } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default async function WorkflowRunsPage() {
    const payload = await getPayload({ config })

    const runsRes = await payload.find({
        collection: 'workflow-executions',
        sort: '-startedAt',
        depth: 1, // To get the workflow name
    })

    const runs = runsRes.docs as any[]

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Run History</h1>
                    <p className="text-muted-foreground mt-2">
                        View execution results, inputs, and phase-by-phase logs.
                    </p>
                </div>
            </div>

            <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
                {runs.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No executions recorded</h3>
                        <p className="mt-1">Workflows will appear here once they are triggered.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Execution ID</th>
                                <th className="px-6 py-4 font-medium">Workflow</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Trigger</th>
                                <th className="px-6 py-4 font-medium">Started At</th>
                                <th className="px-6 py-4 font-medium text-right">Details</th>
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
                                        <Link
                                            href={`/workflows/runs/${run.id}`}
                                            className="inline-flex items-center justify-center p-2 hover:bg-muted rounded-md text-foreground transition-colors"
                                            title="View Details"
                                        >
                                            <Eye size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
