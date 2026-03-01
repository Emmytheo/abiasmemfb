import type { ExecutionEnvironment } from '../types/executor'

export async function TransformDataExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const inputData = env.getInput('inputData')
    const expression = env.getInput('expression') as string
    if (!expression) { env.log.error('TransformData: expression required'); return false }
    try {
        const input = typeof inputData === 'string' ? JSON.parse(inputData) : inputData
        const fn = new Function('input', `"use strict"; return (${expression})`)
        const output = fn(input)
        env.setOutput('outputData', output)
        env.log.info('TransformData: success')
        return true
    } catch (err: any) { env.log.error(`TransformData: ${err.message}`); return false }
}
