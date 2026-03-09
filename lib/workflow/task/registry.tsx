import {
    Zap, GitBranch, RefreshCw, Clock, Globe, ToggleLeft, ToggleRight,
    Mail, MessageSquare, ArrowRightLeft, CheckCircle, XCircle,
    Layout, FileText, Shield, CreditCard, Boxes, Workflow,
} from 'lucide-react'
import type { WorkflowTask } from '../types/task'
import { TaskType, TaskCategory, TaskParamType } from '../types/task'

type Registry = { [K in TaskType]: WorkflowTask & { type: K } }

export const TaskRegistry: Registry = {
    // ── Flow Control ──────────────────────────────────────────────
    TRIGGER: {
        type: TaskType.TRIGGER,
        label: 'Trigger',
        icon: Zap,
        category: TaskCategory.FLOW_CONTROL,
        isEntryPoint: true,
        description: 'Entry point for the workflow. Captures the trigger event payload.',
        inputs: [
            {
                name: 'triggerType', type: TaskParamType.SELECT, required: false,
                options: [
                    { label: 'Manual', value: 'MANUAL' },
                    { label: 'Application Submit', value: 'APPLICATION_SUBMIT' },
                    { label: 'Webhook', value: 'WEBHOOK' },
                    { label: 'Cron', value: 'CRON' },
                ],
                hideHandle: true,
            },
            {
                name: 'cronExpression', type: TaskParamType.STRING, required: false,
                helperText: 'e.g. 0 0 * * * (Every midnight)',
                hideHandle: true,
            },
            {
                name: 'applicationType', type: TaskParamType.STRING, required: false,
                helperText: 'Bind to a specific Product Type (Optional)',
                hideHandle: true,
            },
            {
                name: 'webhookSecret', type: TaskParamType.STRING, required: false,
                helperText: 'Secret phrase for verifying inbound webhook payloads',
                hideHandle: true,
            },
        ],
        outputs: [
            { name: 'triggerPayload', type: TaskParamType.JSON },
        ],
    },

    CONDITIONAL: {
        type: TaskType.CONDITIONAL,
        label: 'Conditional',
        icon: GitBranch,
        category: TaskCategory.FLOW_CONTROL,
        description: 'Branch flow based on a JavaScript expression. Returns true/false paths.',
        inputs: [
            { name: 'inputData', type: TaskParamType.JSON, required: true },
            {
                name: 'expression', type: TaskParamType.TEXTAREA, required: true,
                helperText: 'e.g. input.amount > 50000 && input.type === "loan"'
            },
        ],
        outputs: [
            { name: 'trueBranch', type: TaskParamType.JSON },
            { name: 'falseBranch', type: TaskParamType.JSON },
        ],
    },

    LOOP: {
        type: TaskType.LOOP,
        label: 'Loop',
        icon: RefreshCw,
        category: TaskCategory.FLOW_CONTROL,
        description: 'Iterate over an array of items.',
        inputs: [
            { name: 'items', type: TaskParamType.JSON, required: true },
            { name: 'maxIterations', type: TaskParamType.NUMBER, required: false, value: '100' },
        ],
        outputs: [
            { name: 'currentItem', type: TaskParamType.JSON },
            { name: 'index', type: TaskParamType.NUMBER },
        ],
    },

    DELAY: {
        type: TaskType.DELAY,
        label: 'Delay',
        icon: Clock,
        category: TaskCategory.FLOW_CONTROL,
        description: 'Pause execution for a specified number of milliseconds.',
        inputs: [
            {
                name: 'durationMs', type: TaskParamType.NUMBER, required: true, value: '1000',
                helperText: 'Milliseconds to wait (max 30000)'
            },
        ],
        outputs: [],
    },

    GROUP: {
        type: TaskType.GROUP,
        label: 'Group',
        icon: Boxes,
        category: TaskCategory.FLOW_CONTROL,
        description: 'Visual container for grouping related nodes. Executes child nodes as a scoped sub-plan.',
        inputs: [],
        outputs: [],
    },

    // ── API Integration ───────────────────────────────────────────
    API_CALL: {
        type: TaskType.API_CALL,
        label: 'API Call',
        icon: Globe,
        category: TaskCategory.API_INTEGRATION,
        description: 'Make an HTTP request to a registered service provider.',
        inputs: [
            {
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured service provider'
            },
            {
                name: 'endpoint', type: TaskParamType.STRING, required: true,
                helperText: 'Relative path e.g. /transaction/verify'
            },
            {
                name: 'method', type: TaskParamType.SELECT, required: true, value: 'POST',
                options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))
            },
            { name: 'body', type: TaskParamType.JSON, required: false },
            {
                name: 'headers', type: TaskParamType.JSON, required: false,
                helperText: 'Additional headers (merged with provider defaults)'
            },
        ],
        outputs: [
            { name: 'response', type: TaskParamType.JSON },
            { name: 'statusCode', type: TaskParamType.NUMBER },
        ],
    },

    API_SWITCH: {
        type: TaskType.API_SWITCH,
        label: 'API Switch',
        icon: ArrowRightLeft,
        category: TaskCategory.API_INTEGRATION,
        description: 'Try providers in priority order; auto-failover to next on error.',
        inputs: [
            {
                name: 'groupTag', type: TaskParamType.STRING, required: true,
                helperText: 'Provider group tag for the failover chain'
            },
            { name: 'endpoint', type: TaskParamType.STRING, required: true },
            {
                name: 'method', type: TaskParamType.SELECT, required: true, value: 'POST',
                options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map((m) => ({ label: m, value: m }))
            },
            { name: 'body', type: TaskParamType.JSON, required: false },
        ],
        outputs: [
            { name: 'response', type: TaskParamType.JSON },
            { name: 'activeProvider', type: TaskParamType.STRING },
            { name: 'statusCode', type: TaskParamType.NUMBER },
        ],
    },

    WEBHOOK_DELIVER: {
        type: TaskType.WEBHOOK_DELIVER,
        label: 'Webhook Deliver',
        icon: Globe,
        category: TaskCategory.API_INTEGRATION,
        description: 'POST a JSON payload to an external webhook URL.',
        inputs: [
            { name: 'url', type: TaskParamType.STRING, required: true },
            { name: 'payload', type: TaskParamType.JSON, required: true },
            {
                name: 'secretRef', type: TaskParamType.CREDENTIAL, required: false,
                helperText: 'Optionally sign request with HMAC using this secret'
            },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'responseCode', type: TaskParamType.NUMBER },
        ],
    },

    // ── Approval ──────────────────────────────────────────────────
    APPROVAL_GATE: {
        type: TaskType.APPROVAL_GATE,
        label: 'Approval Gate',
        icon: Shield,
        category: TaskCategory.APPROVAL,
        description: 'Pause execution and wait for a human decision. Resumes when approved or rejected.',
        inputs: [
            { name: 'title', type: TaskParamType.STRING, required: true },
            { name: 'description', type: TaskParamType.TEXTAREA, required: false },
            {
                name: 'assigneeRole', type: TaskParamType.STRING, required: true,
                helperText: 'User role that can make this decision (e.g. "loan-officer")'
            },
        ],
        outputs: [
            { name: 'decision', type: TaskParamType.STRING },
            { name: 'notes', type: TaskParamType.STRING },
            { name: 'approvedBy', type: TaskParamType.STRING },
        ],
    },

    AUTO_APPROVE: {
        type: TaskType.AUTO_APPROVE,
        label: 'Auto Approve',
        icon: CheckCircle,
        category: TaskCategory.APPROVAL,
        description: 'Automatically approve based on conditions.',
        inputs: [
            { name: 'inputData', type: TaskParamType.JSON, required: true },
            {
                name: 'conditions', type: TaskParamType.TEXTAREA, required: false,
                helperText: 'JS expression that must be truthy to approve'
            },
        ],
        outputs: [
            { name: 'approved', type: TaskParamType.BOOLEAN },
            { name: 'reason', type: TaskParamType.STRING },
        ],
    },

    AUTO_REJECT: {
        type: TaskType.AUTO_REJECT,
        label: 'Auto Reject',
        icon: XCircle,
        category: TaskCategory.APPROVAL,
        description: 'Reject with a provided reason.',
        inputs: [
            { name: 'reason', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'rejected', type: TaskParamType.BOOLEAN },
            { name: 'reason', type: TaskParamType.STRING },
        ],
    },

    // ── Data ───────────────────────────────────────────────────
    MAP_FIELDS: {
        type: TaskType.MAP_FIELDS,
        label: 'Map Fields',
        icon: ArrowRightLeft,
        category: TaskCategory.DATA,
        description: 'Extract and map fields from a specific source object and expose them as custom outputs.',
        inputs: [
            {
                name: 'inputData',
                type: TaskParamType.JSON,
                required: false,
                helperText: 'Optional: Wire an object here (e.g. API response) to map from.'
            },
            {
                name: 'schema',
                type: TaskParamType.JSON,
                required: true,
                helperText: 'Array of keys ["id", "name"] to extract, OR an object mapping {"newKey": "oldKey"}'
            },
        ],
        outputs: [
            // Outputs will be evaluated dynamically based on the input schema keys by the NodeComponent
            { name: 'mappedObject', type: TaskParamType.JSON }
        ],
    },

    // ── Notification ──────────────────────────────────────────────
    SEND_EMAIL: {
        type: TaskType.SEND_EMAIL,
        label: 'Send Email',
        icon: Mail,
        category: TaskCategory.NOTIFICATION,
        description: 'Send an email via an SMTP secret.',
        inputs: [
            {
                name: 'secretRef', type: TaskParamType.CREDENTIAL, required: true,
                helperText: 'SMTP secret with host/user/pass/port'
            },
            { name: 'to', type: TaskParamType.STRING, required: true },
            { name: 'subject', type: TaskParamType.STRING, required: true },
            { name: 'body', type: TaskParamType.TEXTAREA, required: true },
            { name: 'isHtml', type: TaskParamType.BOOLEAN, required: false },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'messageId', type: TaskParamType.STRING },
        ],
    },

    SEND_SMS: {
        type: TaskType.SEND_SMS,
        label: 'Send SMS',
        icon: MessageSquare,
        category: TaskCategory.NOTIFICATION,
        description: 'Send an SMS via an API provider (Termii, Twilio, etc.).',
        inputs: [
            { name: 'providerId', type: TaskParamType.PROVIDER, required: true },
            { name: 'to', type: TaskParamType.STRING, required: true },
            { name: 'message', type: TaskParamType.TEXTAREA, required: true },
            {
                name: 'senderId', type: TaskParamType.STRING, required: false,
                helperText: 'Optional sender ID / alphanumeric tag'
            },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'messageId', type: TaskParamType.STRING },
        ],
    },

    // ── Data ──────────────────────────────────────────────────────
    TRANSFORM_DATA: {
        type: TaskType.TRANSFORM_DATA,
        label: 'Transform Data',
        icon: ArrowRightLeft,
        category: TaskCategory.DATA,
        description: 'Transform JSON using a JavaScript expression or mapping template.',
        inputs: [
            { name: 'inputData', type: TaskParamType.JSON, required: true },
            {
                name: 'expression', type: TaskParamType.TEXTAREA, required: true,
                helperText: 'Return the transformed object, e.g. ({ name: input.full_name })'
            },
        ],
        outputs: [
            { name: 'outputData', type: TaskParamType.JSON },
        ],
    },

    VALIDATE_DATA: {
        type: TaskType.VALIDATE_DATA,
        label: 'Validate Data',
        icon: CheckCircle,
        category: TaskCategory.DATA,
        description: 'Validate a JSON payload against a schema or custom rules.',
        inputs: [
            { name: 'inputData', type: TaskParamType.JSON, required: true },
            {
                name: 'schema', type: TaskParamType.JSON, required: false,
                helperText: 'JSON Schema object (optional). Falls back to expression.'
            },
            {
                name: 'expression', type: TaskParamType.TEXTAREA, required: false,
                helperText: 'Custom validation: return { isValid, errors }'
            },
        ],
        outputs: [
            { name: 'isValid', type: TaskParamType.BOOLEAN },
            { name: 'errors', type: TaskParamType.JSON },
        ],
    },

    // ── Document ──────────────────────────────────────────────────
    GENERATE_DOCUMENT: {
        type: TaskType.GENERATE_DOCUMENT,
        label: 'Generate Document',
        icon: FileText,
        category: TaskCategory.DOCUMENT,
        description: 'Generate a PDF or document from a template and data.',
        inputs: [
            { name: 'templateId', type: TaskParamType.STRING, required: true },
            { name: 'data', type: TaskParamType.JSON, required: true },
            {
                name: 'outputFormat', type: TaskParamType.SELECT, required: false, value: 'pdf',
                options: [{ label: 'PDF', value: 'pdf' }, { label: 'DOCX', value: 'docx' }]
            },
        ],
        outputs: [
            { name: 'documentUrl', type: TaskParamType.STRING },
        ],
    },

    // ── Compliance ────────────────────────────────────────────────
    KYC_CHECK: {
        type: TaskType.KYC_CHECK,
        label: 'KYC Check',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Run a KYC (Know Your Customer) verification via a provider.',
        inputs: [
            { name: 'providerId', type: TaskParamType.PROVIDER, required: true },
            { name: 'applicantData', type: TaskParamType.JSON, required: true },
            {
                name: 'verificationType', type: TaskParamType.SELECT, required: false, value: 'BVN',
                options: ['BVN', 'NIN', 'PASSPORT', 'DRIVERS_LICENSE'].map((v) => ({ label: v, value: v }))
            },
        ],
        outputs: [
            { name: 'verified', type: TaskParamType.BOOLEAN },
            { name: 'score', type: TaskParamType.NUMBER },
            { name: 'flags', type: TaskParamType.JSON },
            { name: 'report', type: TaskParamType.JSON },
        ],
    },

    CREDIT_SCORE_CHECK: {
        type: TaskType.CREDIT_SCORE_CHECK,
        label: 'Credit Score Check',
        icon: CreditCard,
        category: TaskCategory.COMPLIANCE,
        description: 'Fetch a credit score report from a credit bureau.',
        inputs: [
            { name: 'providerId', type: TaskParamType.PROVIDER, required: true },
            {
                name: 'applicantRef', type: TaskParamType.STRING, required: true,
                helperText: 'BVN, account number, or reference to look up'
            },
        ],
        outputs: [
            { name: 'score', type: TaskParamType.NUMBER },
            { name: 'band', type: TaskParamType.STRING },
            { name: 'report', type: TaskParamType.JSON },
        ],
    },

    // ── Digital Ledger ───────────────────────────────────────────
    CREATE_ACCOUNT: {
        type: TaskType.CREATE_ACCOUNT,
        label: 'Create Account',
        icon: CreditCard,
        category: TaskCategory.COMPLIANCE,
        description: 'Open a new bank account for a customer. Generates a NUBAN account number and creates a ledger record.',
        inputs: [
            { name: 'user_id', type: TaskParamType.STRING, required: true, helperText: 'Customer user ID' },
            {
                name: 'account_type', type: TaskParamType.SELECT, required: true,
                options: [
                    { label: 'Savings', value: 'Savings' },
                    { label: 'Current', value: 'Current' },
                    { label: 'Fixed Deposit', value: 'Fixed Deposit' },
                    { label: 'Corporate', value: 'Corporate' },
                ],
            },
            { name: 'interest_rate', type: TaskParamType.NUMBER, required: false, helperText: 'Annual rate (%)' },
            { name: 'product_type_id', type: TaskParamType.STRING, required: false, helperText: 'Payload ID of the linked product type' },
            { name: 'application_id', type: TaskParamType.STRING, required: false, helperText: 'Payload ID of the originating application' },
        ],
        outputs: [
            { name: 'created_account_id', type: TaskParamType.STRING },
            { name: 'account_number', type: TaskParamType.STRING },
        ],
    },

    DISBURSE_LOAN: {
        type: TaskType.DISBURSE_LOAN,
        label: 'Disburse Loan',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Disburse an approved loan amount into a customer account. Creates loan record and repayment schedule.',
        inputs: [
            { name: 'user_id', type: TaskParamType.STRING, required: true },
            { name: 'account_id', type: TaskParamType.STRING, required: true, helperText: 'Target account Payload ID (use output of CREATE_ACCOUNT)' },
            { name: 'principal_naira', type: TaskParamType.NUMBER, required: true, helperText: 'Loan amount in Naira' },
            { name: 'interest_rate', type: TaskParamType.NUMBER, required: false, helperText: 'Annual rate (%) — defaults to 10' },
            { name: 'duration_months', type: TaskParamType.NUMBER, required: false, helperText: 'Repayment period in months — defaults to 12' },
            { name: 'purpose', type: TaskParamType.STRING, required: false },
            { name: 'application_id', type: TaskParamType.STRING, required: false },
            { name: 'product_type_id', type: TaskParamType.STRING, required: false },
        ],
        outputs: [
            { name: 'loan_id', type: TaskParamType.STRING },
            { name: 'loan_reference', type: TaskParamType.STRING },
            { name: 'monthly_installment_naira', type: TaskParamType.STRING },
        ],
    },

    INTRA_ACCOUNT_TRANSFER: {
        type: TaskType.INTRA_ACCOUNT_TRANSFER,
        label: 'Intra-Bank Transfer',
        icon: ArrowRightLeft,
        category: TaskCategory.COMPLIANCE,
        description: 'Transfers funds internally between two accounts. Creates Debit and Credit ledger entries.',
        inputs: [
            { name: 'sourceAccountId', type: TaskParamType.STRING, required: true, helperText: 'Payload ID of the Source Account' },
            { name: 'destinationAccountId', type: TaskParamType.STRING, required: true, helperText: 'Payload ID of the Destination Account' },
            { name: 'amountNaira', type: TaskParamType.NUMBER, required: true, helperText: 'Transfer amount (₦)' },
            { name: 'narration', type: TaskParamType.STRING, required: false },
            { name: 'externalApiUrl', type: TaskParamType.STRING, required: false, helperText: 'Optional: Gateway URL to ping before authorizing internal ledger movement' },
            { name: 'externalApiPayload', type: TaskParamType.JSON, required: false, helperText: 'Optional: JSON payload to pass to gateway URL' },
        ],
        outputs: [
            { name: 'transfer_reference', type: TaskParamType.STRING },
            { name: 'status', type: TaskParamType.STRING },
            { name: 'api_response', type: TaskParamType.JSON },
        ],
    },

    INTERBANK_TRANSFER: {
        type: TaskType.INTERBANK_TRANSFER,
        label: 'Interbank Transfer (NIP)',
        icon: ArrowRightLeft,
        category: TaskCategory.COMPLIANCE,
        description: 'Transfers funds to outside banks via configured NIP Provider. Computes ledger deduct and fees.',
        inputs: [
            { name: 'sourceAccountId', type: TaskParamType.STRING, required: true, helperText: 'Payload ID of the Source Account' },
            { name: 'destinationAccount', type: TaskParamType.STRING, required: true, helperText: 'NUBAN Number' },
            { name: 'destinationBank', type: TaskParamType.STRING, required: true, helperText: 'Bank Code / Name' },
            { name: 'destinationName', type: TaskParamType.STRING, required: false, helperText: 'Resolved Full Name' },
            { name: 'amountNaira', type: TaskParamType.NUMBER, required: true, helperText: 'Transfer amount (₦)' },
            { name: 'narration', type: TaskParamType.STRING, required: false },
            { name: 'nipProviderId', type: TaskParamType.PROVIDER, required: false, helperText: 'The designated routing gateway provider' },
        ],
        outputs: [
            { name: 'transferReference', type: TaskParamType.STRING },
            { name: 'feeApplied', type: TaskParamType.NUMBER },
        ],
    },

    INTERNATIONAL_TRANSFER: {
        type: TaskType.INTERNATIONAL_TRANSFER,
        label: 'International Transfer (SWIFT)',
        icon: Globe,
        category: TaskCategory.COMPLIANCE,
        description: 'Transfers funds cross-border via SWIFT Gateway. Calculates live FX equivalent reductions.',
        inputs: [
            { name: 'sourceAccountId', type: TaskParamType.STRING, required: true, helperText: 'Payload ID of the Source Account' },
            { name: 'iban', type: TaskParamType.STRING, required: true, helperText: 'Recipient IBAN or Account' },
            { name: 'swift', type: TaskParamType.STRING, required: true, helperText: 'Bank SWIFT/BIC Code' },
            { name: 'accountName', type: TaskParamType.STRING, required: true, helperText: 'Beneficiary Name' },
            { name: 'amount', type: TaskParamType.NUMBER, required: true, helperText: 'Amount in Foreign Currency' },
            { name: 'currency', type: TaskParamType.STRING, required: true, value: 'USD', helperText: 'e.g., USD, GBP, EUR' },
            { name: 'narration', type: TaskParamType.STRING, required: false },
        ],
        outputs: [
            { name: 'transferReference', type: TaskParamType.STRING },
            { name: 'exchangeRateApplied', type: TaskParamType.NUMBER },
        ],
    },

    FUND_ACCOUNT: {
        type: TaskType.FUND_ACCOUNT,
        label: 'Fund Account',
        icon: CreditCard,
        category: TaskCategory.COMPLIANCE,
        description: 'Deposits funds into a target account from an external source (e.g. Card, USSD). Creates a Credit ledger entry.',
        inputs: [
            { name: 'targetAccountId', type: TaskParamType.STRING, required: true, helperText: 'Payload ID of the target Account' },
            { name: 'amountNaira', type: TaskParamType.NUMBER, required: true, helperText: 'Deposit amount (₦)' },
            { name: 'reference', type: TaskParamType.STRING, required: true, helperText: 'The external reference from Paystack/Flutterwave/WebHook' },
            { name: 'externalApiUrl', type: TaskParamType.STRING, required: false, helperText: 'Optional: Gateway verification URL' },
        ],
        outputs: [
            { name: 'deposit_reference', type: TaskParamType.STRING },
            { name: 'new_balance', type: TaskParamType.STRING },
        ],
    },

    // ── Sub-flows & Custom ────────────────────────────────────────
    SUB_WORKFLOW: {
        type: TaskType.SUB_WORKFLOW,
        label: 'Sub-Workflow',
        icon: Workflow,
        category: TaskCategory.FLOW_CONTROL,
        description: 'Execute another published workflow and pass its output to the next node.',
        inputs: [
            {
                name: 'workflowId', type: TaskParamType.STRING, required: true,
                helperText: 'Payload document ID of the target workflow'
            },
            {
                name: 'inputMapping', type: TaskParamType.JSON, required: false,
                helperText: 'Map current scope vars to child workflow input'
            },
        ],
        outputs: [
            { name: 'output', type: TaskParamType.JSON },
        ],
    },

    CUSTOM_BLOCK: {
        type: TaskType.CUSTOM_BLOCK,
        label: 'Custom Block',
        icon: Boxes,
        category: TaskCategory.CUSTOM,
        description: 'A user-defined reusable block. Inputs/outputs are defined by the block schema.',
        inputs: [],  // populated dynamically from custom-blocks collection at render time
        outputs: [],
    },
}

