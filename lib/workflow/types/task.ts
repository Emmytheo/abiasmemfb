import { LucideProps } from 'lucide-react'
import React from 'react'

// ─── Task Categories ────────────────────────────────────────────────────────
export enum TaskCategory {
    FLOW_CONTROL = 'FLOW_CONTROL',
    API_INTEGRATION = 'API_INTEGRATION',
    APPROVAL = 'APPROVAL',
    NOTIFICATION = 'NOTIFICATION',
    DATA = 'DATA',
    DOCUMENT = 'DOCUMENT',
    COMPLIANCE = 'COMPLIANCE',
    CUSTOM = 'CUSTOM',
}

// ─── Task Types ──────────────────────────────────────────────────────────────
export enum TaskType {
    // Flow Control
    TRIGGER = 'TRIGGER',
    CONDITIONAL = 'CONDITIONAL',
    LOOP = 'LOOP',
    DELAY = 'DELAY',
    GROUP = 'GROUP',
    // API Integration
    API_CALL = 'API_CALL',
    API_SWITCH = 'API_SWITCH',
    WEBHOOK_DELIVER = 'WEBHOOK_DELIVER',
    // Approval
    APPROVAL_GATE = 'APPROVAL_GATE',
    AUTO_APPROVE = 'AUTO_APPROVE',
    AUTO_REJECT = 'AUTO_REJECT',
    // Notification
    SEND_EMAIL = 'SEND_EMAIL',
    SEND_SMS = 'SEND_SMS',
    // Data
    TRANSFORM_DATA = 'TRANSFORM_DATA',
    VALIDATE_DATA = 'VALIDATE_DATA',
    MAP_FIELDS = 'MAP_FIELDS',
    // Document
    GENERATE_DOCUMENT = 'GENERATE_DOCUMENT',
    // Compliance
    KYC_CHECK = 'KYC_CHECK',
    CREDIT_SCORE_CHECK = 'CREDIT_SCORE_CHECK',
    // Digital Ledger
    CREATE_ACCOUNT = 'CREATE_ACCOUNT',
    DISBURSE_LOAN = 'DISBURSE_LOAN',
    // Sub-flows & Custom
    SUB_WORKFLOW = 'SUB_WORKFLOW',
    CUSTOM_BLOCK = 'CUSTOM_BLOCK',
}

// ─── Param Types ─────────────────────────────────────────────────────────────
export enum TaskParamType {
    STRING = 'STRING',
    NUMBER = 'NUMBER',
    BOOLEAN = 'BOOLEAN',
    SELECT = 'SELECT',
    TEXTAREA = 'TEXTAREA',
    JSON = 'JSON',
    CREDENTIAL = 'CREDENTIAL',
    PROVIDER = 'PROVIDER',
}

export interface TaskParam {
    name: string
    type: TaskParamType
    helperText?: string
    required?: boolean
    hideHandle?: boolean
    value?: string
    options?: { label: string; value: string }[]
    [key: string]: any
}

// ─── WorkflowTask (UI definition per task type) ──────────────────────────────
export type WorkflowTask = {
    label: string
    icon: React.FC<LucideProps>
    type: TaskType
    category?: TaskCategory
    isEntryPoint?: boolean
    inputs: TaskParam[]
    outputs: TaskParam[]
    description?: string
}
