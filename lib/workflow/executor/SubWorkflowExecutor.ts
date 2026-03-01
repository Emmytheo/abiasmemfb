import type { ExecutionEnvironment } from '../types/executor'
import { getPayload } from 'payload'
import config from '@payload-config'
import { executeWorkflow } from '../executeWorkflow'

export async function SubWorkflowExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const workflowId = env.getInput('workflowId') as string
    const inputMapping = env.getInput('inputMapping')
    if (!workflowId) {
        env.log.error('SubWorkflow: workflowId required')
        return false
    }

    const payload = await getPayload({ config })
    const childWf = await payload.findByID({ collection: 'workflows', id: workflowId }).catch(() => null)
    if (!childWf) {
        env.log.error(`SubWorkflow: workflow ${workflowId} not found`)
        return false
    }
    if (childWf.status !== 'PUBLISHED') {
        env.log.error(`SubWorkflow: workflow ${childWf.name} is not PUBLISHED`)
        return false
    }

    const mappedInput = typeof inputMapping === 'string' ? JSON.parse(inputMapping || '{}') : (inputMapping ?? {})
    env.log.info(`SubWorkflow: launching child flow "${childWf.name}"`)

    try {
        // Fire child execution via the engine (creates its own execution record inline)
        const childExecutionId = await executeWorkflow({
            workflowId,
            trigger: 'MANUAL', // internal spawn
            inputData: mappedInput,
        })

        // Wait for it? If synchronous sub-workflows are desired:
        // This requires polling or the engine returning only on completion
        // For now we just log the ID it spawned. To make it truly synchronous,
        // executeWorkflow would need to return the final environment state.

        env.setOutput('output', { childExecutionId })
        env.log.info(`SubWorkflow: triggered successfuly (ID: ${childExecutionId})`)
        return true
    } catch (err: any) {
        env.log.error(`SubWorkflow execution failed: ${err.message}`)
        return false
    }
}
