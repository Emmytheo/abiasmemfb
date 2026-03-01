import type { ExecutionEnvironment } from '../types/executor'

export async function TriggerExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    // The trigger node simply passes through whatever payload arrived
    const triggerPayload = env.getInput('triggerPayload') ?? {}
    env.setOutput('triggerPayload', triggerPayload)
    env.log.info(`Trigger fired. Payload: ${JSON.stringify(triggerPayload).slice(0, 200)}`)
    return true
}
