import type { ExecutionEnvironment } from '../types/executor'

export async function ConditionalExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const inputData = env.getInput('inputData')
    const expression = env.getInput('expression') as string

    if (!expression) {
        env.log.error('Conditional: no expression provided')
        return false
    }

    try {
        // Safe-ish eval using Function constructor (sandboxed to input data)
        const fn = new Function('input', `"use strict"; return !!(${expression})`)
        const result = fn(typeof inputData === 'string' ? JSON.parse(inputData) : inputData)
        env.log.info(`Conditional evaluated: ${result} (expression: ${expression})`)
        env.setOutput('trueBranch', result ? inputData : null)
        env.setOutput('falseBranch', result ? null : inputData)
        return true
    } catch (err: any) {
        env.log.error(`Conditional expression error: ${err.message}`)
        return false
    }
}
