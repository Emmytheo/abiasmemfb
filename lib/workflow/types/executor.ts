import { WorkflowTask } from './task'
import { LogCollector } from './log'

export type Environment = {
    phases: Record<string, {
        inputs: Record<string, any>
        outputs: Record<string, any>
    }>
    /** Current resolution of credentials/secrets: secretId → plaintext value */
    secrets?: Record<string, string>
}

export type ExecutionEnvironment<T extends WorkflowTask> = {
    getInput: (name: string) => any
    setOutput: (name: string, value: any) => void
    log: LogCollector
    /** Resolve a Secret from the vault by its Payload collection ID */
    resolveSecret: (secretId: string) => Promise<string>
    /** Fetch a ServiceProvider by its Payload collection ID */
    getProvider: (providerId: string) => Promise<import('./provider').ServiceProvider | null>
}
