import { Node } from '@xyflow/react'
import { TaskType, TaskParam } from './task'

export interface AppNodeData {
    type: TaskType
    inputs: Record<string, string>
    /** For CUSTOM_BLOCK: references the custom-blocks collection id */
    customBlockId?: string
    /** For SUB_WORKFLOW: references the workflows collection id */
    subWorkflowId?: string
    /** For GROUP: human label */
    groupLabel?: string
    /** For APPROVAL_GATE: role required to approve */
    approverRole?: string
    [key: string]: any
}

export interface AppNode extends Node {
    data: AppNodeData
}

export interface ParamProps {
    param: TaskParam
    value: string
    updateNodeParamValue: (newValue: string) => void
    disabled?: boolean
}

export type AppNodeMissingInputs = {
    nodeId: string
    inputs: string[]
}
