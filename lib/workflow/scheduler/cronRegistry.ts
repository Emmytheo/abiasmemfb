import type { ScheduledJob } from '../types'

/** NodeJS global timer registry (workflowId -> NodeJS.Timeout) */
const cronRegistry = new Map<string, NodeJS.Timeout>()

export function setTimer(workflowId: string, timer: NodeJS.Timeout) {
    cronRegistry.set(workflowId, timer)
}

export function clearTimer(workflowId: string) {
    const timer = cronRegistry.get(workflowId)
    if (timer) {
        clearTimeout(timer)
        clearInterval(timer) // safe to call both
        cronRegistry.delete(workflowId)
    }
}

export function hasTimer(workflowId: string): boolean {
    return cronRegistry.has(workflowId)
}

export function getAllScheduledWorkflowIds(): string[] {
    return Array.from(cronRegistry.keys())
}
