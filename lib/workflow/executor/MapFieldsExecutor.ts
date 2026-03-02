import type { ExecutionEnvironment } from '../types/executor'
import type { WorkflowTask } from '../types/task'

type MapFieldsTaskInfo = WorkflowTask & {
    inputs: [{ name: 'schema', value: any }]
}

export async function MapFieldsExecutor(
    env: ExecutionEnvironment<any> // cast to any temporarily to silence the strict WorkflowTask matching
): Promise<boolean> {
    try {
        const schema = env.getInput('schema')

        if (!schema || typeof schema !== 'object') {
            env.log.error('MapFields requires a valid JSON object schema.')
            return false
        }

        // The values within the schema have already been interpolated by the `resolveVariables`
        // function in executeWorkflow.ts before this executor is called!
        // Therefore, we just need to iterate over the keys and export them as individual outputs.

        for (const [key, value] of Object.entries(schema)) {
            // Set individual output values so downstream nodes can reference {{MAP_FIELDS_ID.keyName}}
            env.setOutput(key, value)
        }

        // Also output the entire mapped object for convenience
        env.setOutput('mappedObject', schema)

        env.log.info(`Mapped fields successfully: ${Object.keys(schema).join(', ')}`)
        return true

    } catch (error: any) {
        env.log.error(`MapFields execution failed: ${error.message}`)
        return false
    }
}
