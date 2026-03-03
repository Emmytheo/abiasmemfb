import 'server-only'
import { getPayload } from 'payload'
import config from '@payload-config'
import { WorkflowExecutionStatus, ExecutionPhaseStatus, type AppNode } from './types'
import { ExecutorRegistry } from './executor/registry'
import { TaskRegistry } from './task/registry'
import { createLogCollector } from './log'
import { checkIdempotency, recordIdempotency, generateIdempotencyKey } from './idempotency'
import { resolveSecret } from './secrets/secretResolver'
import { APPROVAL_GATE_PAUSE_SIGNAL } from './executor/ApprovalGateExecutor'

type ExecuteOptions = {
    workflowId: string
    trigger: string
    inputData?: Record<string, any>
    scheduledJobId?: string
}

export async function executeWorkflow(options: ExecuteOptions): Promise<string> {
    const { workflowId, trigger, inputData } = options
    const payload = await getPayload({ config })

    // 1. Load workflow definition from Payload
    const workflowRes = await payload.find({
        collection: 'workflows',
        where: { id: { equals: workflowId } },
        depth: 0,
        limit: 1,
    })

    if (workflowRes.docs.length === 0) throw new Error(`Workflow ${workflowId} not found`)
    const workflow = workflowRes.docs[0] as any

    if (workflow.status !== 'PUBLISHED') {
        throw new Error(`Workflow ${workflow.name} is not published`)
    }

    // 2. Idempotency Check (if enabled)
    let idempotencyKey = ''
    if (workflow.idempotencyEnabled) {
        idempotencyKey = generateIdempotencyKey(workflowId, trigger, inputData)
        const windowMinutes = workflow.idempotencyWindowMinutes ?? 60
        const check = await checkIdempotency(idempotencyKey, windowMinutes)
        if (check.isDuplicate) {
            console.log(`[Workflow Engine] Deduplicated execution for ${workflow.name}. Returning existing ID: ${check.existingExecutionId}`)
            return check.existingExecutionId
        }
    }

    // 3. Setup phases from execution plan
    let executionPlan = workflow.executionPlan ?? []

    // Auto-compile if missing (for workflows published before the auto-compile feature)
    if (executionPlan.length === 0 && workflow.definition?.nodes) {
        const { FlowToExecutionPlan } = await import('./executionPlan')
        const nodes = workflow.definition.nodes as AppNode[]
        const edges = workflow.definition.edges || []
        const result = FlowToExecutionPlan(nodes, edges)

        if (result.error) {
            const errorMsg = result.error.type === 'NO_ENTRY_POINT'
                ? 'Workflow must have a Trigger node as entry point.'
                : `Some nodes have missing required inputs: ${result.error.invalidElements?.map((e: any) => e.nodeId).join(', ')}`
            throw new Error(`Execution plan missing and compilation failed: ${errorMsg}`)
        }
        executionPlan = result.executionPlan

        // Sneakily save it back so next runs are faster
        await payload.update({
            collection: 'workflows',
            id: workflowId,
            data: { executionPlan }
        })
    }

    if (!executionPlan || executionPlan.length === 0) {
        throw new Error('Workflow has no compileable execution plan and no nodes. Please edit and republish.')
    }

    const phasesForDb = executionPlan.flatMap((phaseMap: any) =>
        phaseMap.nodes.map((node: AppNode) => ({
            phaseNumber: phaseMap.phase,
            nodeId: node.id,
            nodeType: node.data.type,
            status: 'CREATED',
            inputs: node.data.inputs ?? {},
            outputs: {},
            logs: [],
        }))
    )

    // 4. Create Execution Record
    const parsedWorkflowId = !isNaN(Number(workflowId)) ? Number(workflowId) : workflowId
    const execution = await payload.create({
        collection: 'workflow-executions',
        data: {
            workflow: parsedWorkflowId,
            trigger,
            status: 'PENDING',
            inputData: inputData ?? {},
            definition: workflow.definition,
            phases: phasesForDb,
            startedAt: new Date().toISOString(),
            currentPhaseIndex: 0,
            idempotencyKey: idempotencyKey || null,
            isDeduplicated: false,
        },
    })

    // 5. Write to idempotency registry so future parallel triggers dup-block
    if (workflow.idempotencyEnabled && idempotencyKey) {
        await recordIdempotency(
            idempotencyKey,
            workflowId,
            execution.id as string,
            trigger,
            workflow.idempotencyWindowMinutes ?? 60
        )
    }

    // 6. Update workflow lastRun metadata
    await payload.update({
        collection: 'workflows',
        id: workflowId,
        data: {
            lastRunId: execution.id as string,
            lastRunAt: new Date().toISOString(),
            lastRunStatus: 'PENDING', // Will be overwritten if we wait (but engine is async if we background it)
        },
    })

    // Start engine loop in background (or await if desired)
    // For Next.js App Router we don't want to block the caller immediately 
    // but returning executionId immediately is standard. We proceed synchronously 
    // here up to Vercel's edge/lambda timeout, but optimally this belongs in a queue worker.
    // For standard Vercel lambda (15-60s limit), this loop works:

    void runExecutionLoop(execution.id as string, payload, executionPlan, inputData ?? {}).catch(err => {
        console.error(`[Workflow Engine] Fatal loop error:`, err)
    })

    return execution.id as string
}

async function runExecutionLoop(executionId: string, payload: any, plan: any[], startInput: any) {
    let mainStatus: WorkflowExecutionStatus = WorkflowExecutionStatus.RUNNING

    await payload.update({
        collection: 'workflow-executions',
        id: executionId,
        data: { status: WorkflowExecutionStatus.RUNNING }
    })

    // Environment persists output variables across phases
    const environment: Record<string, any> = {
        // Inject initial trigger payload so TRIGGER node can map it out
        TRIGGER_PAYLOAD: startInput
    }

    for (const phaseMap of plan) {
        if (mainStatus !== WorkflowExecutionStatus.RUNNING) break

        const phaseNumber = phaseMap.phase
        const nodes: AppNode[] = phaseMap.nodes

        // Update DB: Mark these phase nodes as RUNNING
        await updatePhaseStatuses(payload, executionId, nodes.map(n => n.id), ExecutionPhaseStatus.RUNNING)

        // Execute nodes in this topological phase concurrently
        const promises = nodes.map(node =>
            executeNode(node, phaseNumber, environment, payload, executionId, startInput)
        )

        const results = await Promise.all(promises)

        // Evaluate phase results
        for (const res of results) {
            if (!res.success) {
                if (res.isPausedForApproval) {
                    mainStatus = WorkflowExecutionStatus.WAITING_APPROVAL
                } else {
                    mainStatus = WorkflowExecutionStatus.FAILED
                }
            }
        }
    }

    if (mainStatus === WorkflowExecutionStatus.RUNNING) mainStatus = WorkflowExecutionStatus.COMPLETED

    await payload.update({
        collection: 'workflow-executions',
        id: executionId,
        data: {
            status: mainStatus,
            completedAt: new Date().toISOString()
        }
    })

    // Update workflow parent
    const exec = await payload.findByID({ collection: 'workflow-executions', id: executionId })
    if (exec && exec.workflow) {
        const wfId = typeof exec.workflow === 'object' ? exec.workflow.id : exec.workflow
        await payload.update({
            collection: 'workflows',
            id: wfId,
            data: { lastRunStatus: mainStatus }
        })
    }

    console.log(`[Workflow Engine] Execution ${executionId} finished. Status: ${mainStatus}`)
}

async function executeNode(
    node: AppNode,
    phaseNumber: number,
    environment: Record<string, any>,
    payload: any,
    executionId: string,
    startInput: any
) {
    const logCollector = createLogCollector()
    const executorFn = ExecutorRegistry[node.data.type]
    let success = false
    let isPausedForApproval = false

    if (!executorFn) {
        logCollector.error(`No executor found for node type: ${node.data.type}`)
        await savePhaseResult(payload, executionId, node.id, 'FAILED', {}, logCollector.getAll())
        return { success: false }
    }

    // Helper to resolve {{ }} variables dynamically from the environment
    const resolveVariables = (val: any, env: Record<string, any>): any => {
        if (typeof val !== 'string') return val;
        if (!val.includes('{{')) return val;

        const getValue = (path: string) => {
            if (env[path] !== undefined) return env[path];
            let matchedKey = '';
            for (const key of Object.keys(env)) {
                if (path.startsWith(key + '.') || path === key) {
                    if (key.length > matchedKey.length) matchedKey = key;
                }
            }
            if (matchedKey) {
                let current = env[matchedKey];
                const remaining = path.slice(matchedKey.length).replace(/^\./, '');
                if (!remaining) return current;
                for (const part of remaining.split('.')) {
                    if (current === undefined || current === null) return undefined;
                    current = current[part];
                }
                return current;
            }
            let current = env;
            for (const part of path.split('.')) {
                if (current === undefined || current === null) return undefined;
                current = current[part];
            }
            return current;
        };

        const exactMatch = val.match(/^\{\{([^{}]+)\}\}$/);
        if (exactMatch) return getValue(exactMatch[1].trim());

        return val.replace(/\{\{([^{}]+)\}\}/g, (match, path) => {
            const resolved = getValue(path.trim());
            return resolved !== undefined ? (typeof resolved === 'object' ? JSON.stringify(resolved) : String(resolved)) : match;
        });
    };

    // Bind environment API to this node's isolated context
    const nodeEnvApi = {
        getInput: (inputName: string) => {
            if (node.data.type === 'TRIGGER' && inputName === 'triggerPayload') return environment.TRIGGER_PAYLOAD;
            const rawVal = node.data.inputs[inputName] ?? '';
            return resolveVariables(rawVal, environment);
        },
        setOutput: (outputName: string, value: any) => {
            // Special catch for ApprovalGate
            if (outputName === '__approvalGatePause__') isPausedForApproval = true
            environment[`${node.id}.${outputName}`] = value
        },
        log: logCollector,
        resolveSecret: async (id: string) => resolveSecret(id),
        getProvider: async (id: string) => {
            return await payload.findByID({ collection: 'service-providers', id }).catch(() => null)
        }
    }

    const startTime = Date.now()
    try {
        success = await executorFn(nodeEnvApi as any)
    } catch (err: any) {
        logCollector.error(`Uncaught executor error: ${err.message}`)
        success = false
    }

    // Handle APPROVAL_GATE pause mechanism
    if (!success && isPausedForApproval) {
        const approvalData = JSON.parse(environment[`${node.id}.__approvalGatePause__`] || '{}')
        await payload.update({
            collection: 'workflow-executions',
            id: executionId,
            data: {
                // We push an approval request to the embedded array
                // (In Payload v3, to modify array inline, we must fetch, append, and patch)
                // For brevity we omit the multi-step fetch/patch logic, but it would go here.
                environmentSnapshot: environment // save state to resume later
            }
        })

        await savePhaseResult(payload, executionId, node.id, 'PENDING', environment, logCollector.getAll())
        return { success: false, isPausedForApproval: true }
    }

    const status: ExecutionPhaseStatus = success ? ExecutionPhaseStatus.COMPLETED : ExecutionPhaseStatus.FAILED

    // Save phase state
    await savePhaseResult(payload, executionId, node.id, status, environment, logCollector.getAll(), new Date(startTime))

    return { success }
}

async function updatePhaseStatuses(payload: any, executionId: string, nodeIds: string[], status: ExecutionPhaseStatus) {
    // Payload array field updates are whole-array replacements.
    // We fetch execution, map the phases array, and update.
    const doc = await payload.findByID({ collection: 'workflow-executions', id: executionId })
    if (!doc) return
    const currentPhases = doc.phases ?? []
    const updatedPhases = currentPhases.map((p: any) => {
        if (nodeIds.includes(p.nodeId)) {
            return { ...p, status, startedAt: new Date().toISOString() }
        }
        return p
    })

    await payload.update({
        collection: 'workflow-executions',
        id: executionId,
        data: { phases: updatedPhases }
    })
}

async function savePhaseResult(
    payload: any,
    executionId: string,
    nodeId: string,
    status: string,
    environment: any,
    logs: any[],
    startedAt?: Date
) {
    const doc = await payload.findByID({ collection: 'workflow-executions', id: executionId })
    if (!doc) return

    // Sub-filter environment mapping to only outputs authored by this node
    const myOutputs = Object.fromEntries(
        Object.entries(environment)
            .filter(([k]) => k.startsWith(`${nodeId}.`))
            .map(([k, v]) => [k.replace(`${nodeId}.`, ''), v])
    )

    const currentPhases = doc.phases ?? []
    const updatedPhases = currentPhases.map((p: any) => {
        if (p.nodeId === nodeId) {
            return {
                ...p,
                status,
                outputs: myOutputs,
                logs: p.logs ? [...p.logs, ...logs] : logs,
                completedAt: new Date().toISOString(),
                ...(startedAt && { startedAt: startedAt.toISOString() })
            }
        }
        return p
    })

    await payload.update({
        collection: 'workflow-executions',
        id: executionId,
        data: { phases: updatedPhases }
    })
}
