import 'server-only'
import parser from 'cron-parser'
const { parseExpression } = parser as any
import { getPayload } from 'payload'
import config from '@payload-config'
import { clearTimer, setTimer } from './cronRegistry'
import { executeWorkflow } from '../executeWorkflow'
import type { ScheduledJob, ScheduleType } from '../types'

export async function rescheduleAll() {
    console.log('[Scheduler] Initializing global schedule registry...')
    const payload = await getPayload({ config })

    // Find all ACTIVE schedules
    const jobsRes = await payload.find({
        collection: 'scheduled-jobs',
        where: { status: { equals: 'ACTIVE' } },
        limit: 1000,
    })

    let count = 0
    for (const doc of jobsRes.docs) {
        scheduleJob(doc as any)
        count++
    }
    console.log(`[Scheduler] ${count} active schedules loaded into memory.`)
}

export function unscheduleJob(jobId: string) {
    clearTimer(jobId)
    console.log(`[Scheduler] Unscheduled job: ${jobId}`)
}

export function scheduleJob(job: ScheduledJob) {
    clearTimer(job.id)

    if (job.status !== 'ACTIVE') return

    const now = new Date()
    let delayMs = 0

    if (job.type === 'CRON' && job.cronExpression) {
        try {
            const interval = parseExpression(job.cronExpression)
            const nextDate = interval.next().toDate()
            delayMs = nextDate.getTime() - now.getTime()
        } catch (err: any) {
            console.error(`[Scheduler] Invalid cron expression for job ${job.id}: ${err.message}`)
            pauseJob(job.id, 'FAILED')
            return
        }
    } else if (job.type === 'ONE_TIME' && job.runAt) {
        delayMs = new Date(job.runAt).getTime() - now.getTime()
        if (delayMs <= 0) {
            // Past due
            console.warn(`[Scheduler] One-Time job ${job.id} is past due. Firing now.`)
            delayMs = 0
        }
    } else if (job.type === 'INTERVAL' && job.intervalMs) {
        delayMs = job.intervalMs
    } else {
        // Cannot schedule
        return
    }

    // Next.js dev server hot-reloads cause memory leaks with setTimeout if not tracked.
    // Our cronRegistry maps handle cleanup when rescheduled.
    const timer = setTimeout(() => {
        void fireJobRoutine(job.id)
    }, delayMs)

    setTimer(job.id, timer)
}

async function fireJobRoutine(jobId: string) {
    const payload = await getPayload({ config })
    const doc = await payload.findByID({ collection: 'scheduled-jobs', id: jobId }).catch(() => null)

    if (!doc) {
        clearTimer(jobId)
        return
    }

    const job = doc as any

    if (job.status !== 'ACTIVE') {
        clearTimer(jobId)
        return
    }

    // 1. Verify workflow is still published
    const wfId = typeof job.workflow === 'object' ? job.workflow.id : job.workflow
    const wf = await payload.findByID({ collection: 'workflows', id: wfId }).catch(() => null)

    if (!wf || (wf as any).status !== 'PUBLISHED') {
        console.warn(`[Scheduler] Workflow ${wfId} not published. Pausing job ${job.id}.`)
        await pauseJob(job.id, 'PAUSED')
        return
    }

    // 2. Fire the engine
    let executionId = ''
    let finalStatus = 'COMPLETED'
    try {
        executionId = await executeWorkflow({
            workflowId: wfId,
            trigger: 'CRON',
            inputData: job.inputData ?? {},
        })
    } catch (err: any) {
        console.error(`[Scheduler] Failed to fire execution for job ${job.id}: ${err.message}`)
        finalStatus = 'FAILED'
    }

    // 3. Update job counts
    const runCount = (job.runCount || 0) + 1
    let newStatus = job.status

    if (job.type === 'ONE_TIME') {
        newStatus = 'COMPLETED'
    } else if (job.maxRuns && runCount >= job.maxRuns) {
        console.log(`[Scheduler] Job ${job.id} reached max runs (${job.maxRuns}). Pausing.`)
        newStatus = 'COMPLETED'
    }

    // 4. Update job record
    let nextRunAt: Date | undefined
    if (newStatus === 'ACTIVE') {
        if (job.type === 'CRON' && job.cronExpression) {
            nextRunAt = parseExpression(job.cronExpression).next().toDate()
        } else if (job.type === 'INTERVAL' && job.intervalMs) {
            nextRunAt = new Date(Date.now() + job.intervalMs)
        }
    }

    const updatedDoc = await payload.update({
        collection: 'scheduled-jobs',
        id: job.id,
        data: {
            runCount,
            status: newStatus,
            lastRunAt: new Date().toISOString(),
            lastRunStatus: finalStatus,
            ...(nextRunAt && { nextRunAt: nextRunAt.toISOString() })
        }
    })

    // 5. Re-schedule next tick if still active
    if (newStatus === 'ACTIVE') {
        scheduleJob(updatedDoc as any)
    } else {
        clearTimer(job.id)
    }
}

async function pauseJob(jobId: string, status: string) {
    const payload = await getPayload({ config })
    await payload.update({
        collection: 'scheduled-jobs',
        id: jobId,
        data: { status }
    }).catch(() => null)
    clearTimer(jobId)
}
