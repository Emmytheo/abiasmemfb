import type { ExecutionEnvironment } from '../types/executor'

export async function GroupExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    // Group is a visual container — no runtime logic needed.
    // Child nodes are planned separately by the execution plan as peers.
    env.log.info('Group node processed (visual container — child nodes run independently)')
    return true
}
