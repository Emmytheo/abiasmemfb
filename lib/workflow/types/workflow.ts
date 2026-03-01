import { AppNode } from './appNode'

export enum WorkflowStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

export enum WorkflowTrigger {
    MANUAL = 'MANUAL',
    APPLICATION_SUBMIT = 'APPLICATION_SUBMIT',
    CRON = 'CRON',
    WEBHOOK = 'WEBHOOK',
}

export enum WorkflowExecutionStatus {
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    WAITING_APPROVAL = 'WAITING_APPROVAL',
    PAUSED = 'PAUSED',
    CANCELLED = 'CANCELLED',
}

export enum ExecutionPhaseStatus {
    CREATED = 'CREATED',
    PENDING = 'PENDING',
    RUNNING = 'RUNNING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
    SKIPPED = 'SKIPPED',
}

export type WorkflowExecutionPlanPhase = {
    phase: number
    nodes: AppNode[]
}

export type WorkflowExecutionPlan = WorkflowExecutionPlanPhase[]

export type WorkflowDefinition = {
    nodes: AppNode[]
    edges: import('@xyflow/react').Edge[]
    viewport?: { x: number; y: number; zoom: number }
}
