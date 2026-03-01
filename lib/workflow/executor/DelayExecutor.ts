import type { ExecutionEnvironment } from '../types/executor'

export async function DelayExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const durationMs = Math.min(Number(env.getInput('durationMs') ?? 1000), 30_000)
    env.log.info(`Delay: waiting ${durationMs}ms`)
    await new Promise((resolve) => setTimeout(resolve, durationMs))
    env.log.info('Delay: complete')
    return true
}
