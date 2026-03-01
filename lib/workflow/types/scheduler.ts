export type ScheduleType = 'CRON' | 'ONE_TIME' | 'INTERVAL'
export type SchedulerJobStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export interface ScheduledJob {
    id: string
    workflowId: string
    workflowName?: string
    type: ScheduleType
    /** For CRON: standard cron expression e.g. "0 9 * * 1-5" */
    cronExpression?: string
    /** For ONE_TIME: ISO date of single run */
    runAt?: string
    /** For INTERVAL: milliseconds between runs */
    intervalMs?: number
    /** Max number of executions (null = unlimited) */
    maxRuns?: number | null
    runCount: number
    status: SchedulerJobStatus
    nextRunAt?: string
    lastRunAt?: string
    lastRunStatus?: string
    /** Namespace used to scope idempotency checks for scheduled runs */
    idempotencyNamespace?: string
    metadata?: Record<string, any>
    createdAt: string
    updatedAt: string
}

export interface SchedulerTick {
    jobId: string
    firedAt: Date
    executionId?: string
}
