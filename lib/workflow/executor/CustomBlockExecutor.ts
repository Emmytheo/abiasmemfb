import type { ExecutionEnvironment } from '../types/executor'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function CustomBlockExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    // The appNode data contains the reference to the customBlockId
    // Because ExecutionEnvironment hides the raw node, we'd need to fetch 
    // via a special input or pass it in. For simplicity, we assume 'customBlockId' 
    // is passed in as a hidden input by the engine when running a CUSTOM_BLOCK node.
    const customBlockId = env.getInput('customBlockId') as string
    if (!customBlockId) {
        env.log.error('CustomBlock: customBlockId missing from node inputs')
        return false
    }

    const payload = await getPayload({ config })
    const block = await payload.findByID({ collection: 'custom-blocks', id: customBlockId }).catch(() => null) as any

    if (!block) {
        env.log.error(`CustomBlock: block ${customBlockId} not found`)
        return false
    }

    env.log.info(`CustomBlock: running custom logic for "${block.name}"`)

    if (block.executorCode) {
        try {
            // Very unsafe eval of arbitrary block code — for admin use only
            // A full implementation would use isolated-vm
            const fn = new Function('env', `"use strict"; return (async () => { ${block.executorCode} })();`)
            await fn(env)
            env.log.info(`CustomBlock: executorCode completed`)
            return true
        } catch (err: any) {
            env.log.error(`CustomBlock logic error: ${err.message}`)
            return false
        }
    } else if (block.internalDefinition) {
        // To handle an internal visual graph, we would run the execution engine recursively 
        // over block.internalDefinition.
        env.log.warn('CustomBlock: visual sub-graphs inside blocks are not yet implemented in this stub. Add executorCode instead.')
        return true
    }

    env.log.info('CustomBlock: no executorCode or internalDefinition found. Passing.')
    return true
}
