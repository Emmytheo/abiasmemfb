import type { ExecutionEnvironment } from '../types/executor'

/**
 * APPROVAL_GATE Executor
 * Pauses the workflow — signals the engine to set status to WAITING_APPROVAL.
 * Returns false with a special sentinel so the engine knows this is intentional.
 */
export const APPROVAL_GATE_PAUSE_SIGNAL = '__APPROVAL_GATE_PAUSE__'

export async function ApprovalGateExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const title = env.getInput('title') as string
    const description = env.getInput('description') as string
    const assigneeRole = env.getInput('assigneeRole') as string

    env.log.info(`ApprovalGate: pausing for role "${assigneeRole}" — "${title}"`)
    env.setOutput('__approvalGatePause__', JSON.stringify({ title, description, assigneeRole }))

    // Returning false signals the engine to stop the phase loop.
    // The engine checks setOutput('__approvalGatePause__') to distinguish this from a hard failure.
    return false
}
