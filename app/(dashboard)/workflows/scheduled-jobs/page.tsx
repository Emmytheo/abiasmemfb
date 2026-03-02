import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { Info, Clock } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default async function ScheduledJobsPage() {
    const payload = await getPayload({ config })

    const jobsRes = await payload.find({
        collection: 'scheduled-jobs',
        sort: '-createdAt',
        depth: 1, // To get the workflow name
    })

    const jobs = jobsRes.docs as any[]

    return (
        <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Scheduled Jobs</h1>
                    <p className="text-muted-foreground mt-2">
                        View active CRON schedules, background timers, and recurring logic tasks.
                    </p>
                </div>
            </div>

            <div className="border rounded-xl shadow-sm bg-background overflow-hidden">
                {jobs.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Info size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No active schedules</h3>
                        <p className="mt-1">Workflows with trigger nodes containing CRON or interval schedules will appear here.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Workflow</th>
                                <th className="px-6 py-4 font-medium">Type</th>
                                <th className="px-6 py-4 font-medium">Schedule Info</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium">Runs</th>
                                <th className="px-6 py-4 font-medium">Next Run</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {jobs.map((job) => (
                                <tr key={job.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium inline-flex items-center gap-2">
                                            <Clock size={14} className="text-muted-foreground" />
                                            {typeof job.workflow === 'object' && job.workflow ? job.workflow.name : 'Unknown Workflow'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="secondary" className="font-normal text-[10px] tracking-wider uppercase">
                                            {job.type}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs opacity-80">
                                        {job.type === 'CRON' ? job.cronExpression
                                            : job.type === 'INTERVAL' ? `${job.intervalMs}ms`
                                                : job.runAt ? format(new Date(job.runAt), 'MMM d, h:mm a')
                                                    : '--'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant="outline"
                                            className={`font-normal ${job.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                                                    job.status === 'FAILED' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                                                        job.status === 'PAUSED' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                                            'bg-muted text-muted-foreground border-border'
                                                }`}
                                        >
                                            {job.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                        {job.runCount || 0}{job.maxRuns ? ` / ${job.maxRuns}` : ''}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-muted-foreground">
                                        {job.nextRunAt ? format(new Date(job.nextRunAt), 'MMM d, h:mm:ss a') : '--'}
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
