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
    API_EXECUTION = 'API_EXECUTION',
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
    INTRA_ACCOUNT_TRANSFER = 'INTRA_ACCOUNT_TRANSFER',
    INTERBANK_TRANSFER = 'INTERBANK_TRANSFER',
    INTERNATIONAL_TRANSFER = 'INTERNATIONAL_TRANSFER',
    FUND_ACCOUNT = 'FUND_ACCOUNT',
    
    // Qore Native Features
    QORE_REQUEST_CARD = 'QORE_REQUEST_CARD',
    QORE_FREEZE_CARD = 'QORE_FREEZE_CARD',
    QORE_UPDATE_CARD_LIMITS = 'QORE_UPDATE_CARD_LIMITS',
    QORE_FREEZE_ACCOUNT = 'QORE_FREEZE_ACCOUNT',
    QORE_MANAGE_LIEN = 'QORE_MANAGE_LIEN',
    QORE_VALIDATE_BILL = 'QORE_VALIDATE_BILL',
    QORE_PAY_BILL = 'QORE_PAY_BILL',
    QORE_CREATE_FIXED_DEPOSIT = 'QORE_CREATE_FIXED_DEPOSIT',
    QORE_LIQUIDATE_FIXED_DEPOSIT = 'QORE_LIQUIDATE_FIXED_DEPOSIT',

    // Qore Account Lifecycle
    QORE_UNFREEZE_ACCOUNT = 'QORE_UNFREEZE_ACCOUNT',
    QORE_CHECK_FREEZE_STATUS = 'QORE_CHECK_FREEZE_STATUS',
    QORE_CHECK_LIEN_STATUS = 'QORE_CHECK_LIEN_STATUS',
    QORE_ACTIVATE_PND = 'QORE_ACTIVATE_PND',
    QORE_DEACTIVATE_PND = 'QORE_DEACTIVATE_PND',

    // Qore Account Reporting  
    QORE_GET_ACCOUNT_TRANSACTIONS = 'QORE_GET_ACCOUNT_TRANSACTIONS',
    QORE_GENERATE_STATEMENT = 'QORE_GENERATE_STATEMENT',

    // Qore Account Admin
    QORE_UPGRADE_ACCOUNT_TIER = 'QORE_UPGRADE_ACCOUNT_TIER',
    QORE_UPLOAD_DOCUMENT = 'QORE_UPLOAD_DOCUMENT',
    QORE_CLOSE_ACCOUNT = 'QORE_CLOSE_ACCOUNT',
    QORE_RETRIEVE_BVN = 'QORE_RETRIEVE_BVN',

    // Qore Account Creation & Management
    QORE_CREATE_ACCOUNT_QUICK = 'QORE_CREATE_ACCOUNT_QUICK',
    QORE_CREATE_CUSTOMER_AND_ACCOUNT = 'QORE_CREATE_CUSTOMER_AND_ACCOUNT',
    QORE_ACCOUNT_ENQUIRY = 'QORE_ACCOUNT_ENQUIRY',
    QORE_ACCOUNT_SUMMARY = 'QORE_ACCOUNT_SUMMARY',
    QORE_GET_ACCOUNTS_BY_CUSTOMER = 'QORE_GET_ACCOUNTS_BY_CUSTOMER',
    QORE_CHECK_PND_STATUS = 'QORE_CHECK_PND_STATUS',
    QORE_UPDATE_NOTIFICATION_PREFERENCE = 'QORE_UPDATE_NOTIFICATION_PREFERENCE',
    QORE_GET_ACCOUNT_BY_TRACKING_REF = 'QORE_GET_ACCOUNT_BY_TRACKING_REF',

    // Qore Customer Management
    QORE_CREATE_CUSTOMER = 'QORE_CREATE_CUSTOMER',
    QORE_GET_CUSTOMER_BY_BVN = 'QORE_GET_CUSTOMER_BY_BVN',

    // Qore Transaction Management
    QORE_TRANSACTION_STATUS_QUERY = 'QORE_TRANSACTION_STATUS_QUERY',
    QORE_INTRA_BANK_TRANSFER = 'QORE_INTRA_BANK_TRANSFER',
    QORE_INTER_BANK_TRANSFER = 'QORE_INTER_BANK_TRANSFER',

    // Sub-flows & Custom
    SUB_WORKFLOW = 'SUB_WORKFLOW',
    CUSTOM_BLOCK = 'CUSTOM_BLOCK',
    REGISTRY_SYNC = 'REGISTRY_SYNC',
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
