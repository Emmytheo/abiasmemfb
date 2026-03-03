import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { PlusCircle, Play, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { WorkflowActions, InlineRename, TriggerBadge } from './WorkflowListActions'

export default async function WorkflowsPage() {
    const payload = await getPayload({ config })

    const workflowsRes = await payload.find({
        collection: 'workflows',
        sort: '-updatedAt',
    })

    const workflows = workflowsRes.docs

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage automation pipelines, approvals, and API integrations.
                    </p>
                </div>
                <Link
                    href="/workflows/new/edit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 px-4 py-2 rounded-md shadow-sm gap-2"
                >
                    <PlusCircle size={18} />
                    Create Workflow
                </Link>
            </div>

            <div className="border rounded-xl shadow-sm bg-background overflow-visible">
                {workflows.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Play size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No workflows found</h3>
                        <p className="mt-1">Get started by creating your first workflow pipeline.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Trigger</th>
                                <th className="px-6 py-4 font-medium">Nodes</th>
                                <th className="px-6 py-4 font-medium">Last Run</th>
                                <th className="px-6 py-4 font-medium">Updated</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {workflows.map((wf) => {
                                // Derive dynamic info from the saved definition
                                const def = wf.definition as any
                                const nodeCount = def?.nodes?.length || 0
                                // Try to get trigger type from the trigger node in the definition
                                const triggerNode = def?.nodes?.find((n: any) => n.data?.type === 'TRIGGER')
                                const resolvedTrigger = triggerNode?.data?.inputs?.triggerType || wf.trigger || 'MANUAL'

                                return (
                                    <tr key={wf.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <InlineRename workflowId={String(wf.id)} currentName={wf.name} />
                                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={wf.description || ''}>
                                                {wf.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={wf.status === 'PUBLISHED' ? 'default' : 'secondary'} className="font-normal">
                                                {wf.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <TriggerBadge trigger={resolvedTrigger} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-muted-foreground text-xs">{nodeCount} node{nodeCount !== 1 ? 's' : ''}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {wf.lastRunAt ? (
                                                <div>
                                                    <div className="text-foreground text-xs">{format(new Date(wf.lastRunAt), 'MMM d, yyyy h:mm a')}</div>
                                                    <div className={`text-xs mt-1 ${wf.lastRunStatus === 'COMPLETED' ? 'text-green-600' : wf.lastRunStatus === 'FAILED' ? 'text-red-500' : 'text-amber-500'}`}>
                                                        {wf.lastRunStatus}
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground italic text-xs">Never run</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-muted-foreground text-xs">
                                                {wf.updatedAt ? format(new Date(wf.updatedAt), 'MMM d, yyyy') : '—'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/workflows/${wf.id}/edit`}
                                                    className="p-2 hover:bg-muted rounded-md text-foreground transition-colors"
                                                    title="Edit Workflow"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>
                                                <WorkflowActions
                                                    workflowId={String(wf.id)}
                                                    currentName={wf.name}
                                                    currentStatus={wf.status}
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}

