import {
    Zap, GitBranch, RefreshCw, Clock, Globe, ToggleLeft, ToggleRight,
    Mail, MessageSquare, ArrowRightLeft, CheckCircle, XCircle,
    Layout, FileText, Shield, CreditCard, Boxes, Workflow,
    UserPlus, Search,
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
    
    API_EXECUTION: {
        type: TaskType.API_EXECUTION,
        label: 'Dynamic API Execute',
        icon: Globe,
        category: TaskCategory.API_INTEGRATION,
        description: 'Execute a pre-defined dynamic endpoint with variable hydration.',
        inputs: [
            {
                name: 'endpointId', type: TaskParamType.STRING, required: true,
                helperText: 'Select an Endpoint specification by ID or Name'
            },
            {
                name: 'dynamicPayload', type: TaskParamType.JSON, required: false,
                helperText: 'Variables to hydrate the request body and path'
            },
        ],
        outputs: [
            { name: 'response', type: TaskParamType.JSON },
            { name: 'statusCode', type: TaskParamType.NUMBER },
            { name: 'success', type: TaskParamType.BOOLEAN },
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

    // ── Qore Native Features ──────────────────────────────────────
    QORE_REQUEST_CARD: {
        type: TaskType.QORE_REQUEST_CARD,
        label: 'Request Card (Qore)',
        icon: CreditCard,
        category: TaskCategory.COMPLIANCE,
        description: 'Issues a new physical or virtual card linked to a specific account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'userId', type: TaskParamType.STRING, required: true },
            { name: 'accountId', type: TaskParamType.STRING, required: true },
            { 
                name: 'cardType', type: TaskParamType.SELECT, required: true,
                options: [{ label: 'Virtual', value: 'VIRTUAL' }, { label: 'Physical', value: 'PHYSICAL' }]
            },
        ],
        outputs: [
            { name: 'cardId', type: TaskParamType.STRING },
            { name: 'status', type: TaskParamType.STRING },
        ],
    },

    QORE_FREEZE_CARD: {
        type: TaskType.QORE_FREEZE_CARD,
        label: 'Freeze Card (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Temporarily freezes a previously issued card.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'cardId', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_UPDATE_CARD_LIMITS: {
        type: TaskType.QORE_UPDATE_CARD_LIMITS,
        label: 'Update Card Limit (Qore)',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Modify spending limits on a card per channel (ATM, POS, Web).',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'cardId', type: TaskParamType.STRING, required: true },
            { 
                name: 'channel', type: TaskParamType.SELECT, required: true,
                options: [{ label: 'ATM', value: 'ATM' }, { label: 'POS', value: 'POS' }, { label: 'Web', value: 'WEB' }]
            },
            { name: 'limitAmount', type: TaskParamType.NUMBER, required: true },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_FREEZE_ACCOUNT: {
        type: TaskType.QORE_FREEZE_ACCOUNT,
        label: 'Freeze Account (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Freezes an entire account prohibiting debit operations.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_MANAGE_LIEN: {
        type: TaskType.QORE_MANAGE_LIEN,
        label: 'Manage Lien (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Place or remove a lien on a specific amount of funds in an account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
            { name: 'amount', type: TaskParamType.NUMBER, required: true },
            { 
                name: 'action', type: TaskParamType.SELECT, required: true,
                options: [{ label: 'Place Lien', value: 'PLACE' }, { label: 'Remove Lien', value: 'REMOVE' }]
            },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'lienId', type: TaskParamType.STRING },
        ],
    },

    QORE_VALIDATE_BILL: {
        type: TaskType.QORE_VALIDATE_BILL,
        label: 'Validate Bill (Qore)',
        icon: CheckCircle,
        category: TaskCategory.COMPLIANCE,
        description: 'Pre-validate a customer identifier with a biller (e.g., check Meter Name).',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'billerCode', type: TaskParamType.STRING, required: true },
            { name: 'customerId', type: TaskParamType.STRING, required: true, helperText: 'Meter Number, Phone Number, etc.' },
        ],
        outputs: [
            { name: 'isValid', type: TaskParamType.BOOLEAN },
            { name: 'customerName', type: TaskParamType.STRING },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    QORE_PAY_BILL: {
        type: TaskType.QORE_PAY_BILL,
        label: 'Pay Bill (Qore)',
        icon: ArrowRightLeft,
        category: TaskCategory.COMPLIANCE,
        description: 'Execute payment for a specific biller.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'billerCode', type: TaskParamType.STRING, required: true },
            { name: 'amount', type: TaskParamType.NUMBER, required: true },
            { name: 'accountId', type: TaskParamType.STRING, required: true, helperText: 'Account to debit from' },
            { name: 'customerId', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'transactionReference', type: TaskParamType.STRING },
        ],
    },

    QORE_CREATE_FIXED_DEPOSIT: {
        type: TaskType.QORE_CREATE_FIXED_DEPOSIT,
        label: 'Create Fixed Deposit (Qore)',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Opens a fixed term deposit account for the user.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'userId', type: TaskParamType.STRING, required: true },
            { name: 'sourceAccountId', type: TaskParamType.STRING, required: true, helperText: 'Account to move principal from' },
            { name: 'amount', type: TaskParamType.NUMBER, required: true },
            { name: 'durationMonths', type: TaskParamType.NUMBER, required: true },
        ],
        outputs: [
            { name: 'depositId', type: TaskParamType.STRING },
            { name: 'expectedMaturityDate', type: TaskParamType.STRING },
        ],
    },

    QORE_LIQUIDATE_FIXED_DEPOSIT: {
        type: TaskType.QORE_LIQUIDATE_FIXED_DEPOSIT,
        label: 'Liquidate Fixed Deposit (Qore)',
        icon: ArrowRightLeft,
        category: TaskCategory.COMPLIANCE,
        description: 'Prematurely or punctually liquidates a fixed deposit.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'depositId', type: TaskParamType.STRING, required: true },
            { name: 'destinationAccountId', type: TaskParamType.STRING, required: true, helperText: 'Where to deposit principal + interest' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
            { name: 'liquidatedAmount', type: TaskParamType.NUMBER },
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

    // ── Qore Account Lifecycle ────────────────────────────────────────────────
    QORE_UNFREEZE_ACCOUNT: {
        type: TaskType.QORE_UNFREEZE_ACCOUNT,
        label: 'Unfreeze Account (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Reverses a freeze on an account, fully restoring debit operations.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number to unfreeze' },
            { name: 'referenceId', type: TaskParamType.STRING, required: true, helperText: 'Unique reference ID for this operation' },
            { name: 'reason', type: TaskParamType.STRING, required: false, helperText: 'Optional reason for unfreezing' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_CHECK_FREEZE_STATUS: {
        type: TaskType.QORE_CHECK_FREEZE_STATUS,
        label: 'Check Freeze Status (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Returns the current freeze status of an account. Use before a Conditional node to branch logic.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number to check' },
        ],
        outputs: [
            { name: 'isFrozen', type: TaskParamType.BOOLEAN },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_CHECK_LIEN_STATUS: {
        type: TaskType.QORE_CHECK_LIEN_STATUS,
        label: 'Check Lien Status (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Returns whether a lien is currently active on an account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number to check' },
        ],
        outputs: [
            { name: 'isLocked', type: TaskParamType.BOOLEAN },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_ACTIVATE_PND: {
        type: TaskType.QORE_ACTIVATE_PND,
        label: 'Activate PND (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Activates Post-No-Debit (PND) on an account, blocking all outgoing transactions.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_DEACTIVATE_PND: {
        type: TaskType.QORE_DEACTIVATE_PND,
        label: 'Deactivate PND (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Deactivates Post-No-Debit (PND) on an account, restoring normal debit operations.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    // ── Qore Account Reporting ────────────────────────────────────────────────
    QORE_GET_ACCOUNT_TRANSACTIONS: {
        type: TaskType.QORE_GET_ACCOUNT_TRANSACTIONS,
        label: 'Get Transactions (Qore)',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Fetches transaction history for an account within a date range from the Qore core banking system.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
            { name: 'fromDate', type: TaskParamType.STRING, required: true, helperText: 'Start date — format: dd-mm-yyyy' },
            { name: 'toDate', type: TaskParamType.STRING, required: true, helperText: 'End date — format: dd-mm-yyyy' },
            { name: 'numberOfItems', type: TaskParamType.NUMBER, required: false, value: '50', helperText: 'Max number of records to return' },
        ],
        outputs: [
            { name: 'transactions', type: TaskParamType.JSON },
            { name: 'count', type: TaskParamType.NUMBER },
        ],
    },

    QORE_GENERATE_STATEMENT: {
        type: TaskType.QORE_GENERATE_STATEMENT,
        label: 'Generate Statement (Qore)',
        icon: FileText,
        category: TaskCategory.DOCUMENT,
        description: 'Generates a Base64-encoded PDF account statement for a given date range.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
            { name: 'fromDate', type: TaskParamType.STRING, required: true, helperText: 'Start date — format: dd-mm-yyyy' },
            { name: 'toDate', type: TaskParamType.STRING, required: true, helperText: 'End date — format: dd-mm-yyyy' },
        ],
        outputs: [
            { name: 'statementBase64', type: TaskParamType.STRING },
            { name: 'fileName', type: TaskParamType.STRING },
        ],
    },

    // ── Qore Account Admin ────────────────────────────────────────────────────
    QORE_UPGRADE_ACCOUNT_TIER: {
        type: TaskType.QORE_UPGRADE_ACCOUNT_TIER,
        label: 'Upgrade Account Tier (Qore)',
        icon: CreditCard,
        category: TaskCategory.COMPLIANCE,
        description: 'Upgrades an account to Tier 2 or Tier 3, enabling higher transaction and balance limits.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
            {
                name: 'accountTier', type: TaskParamType.SELECT, required: true,
                options: [{ label: 'Tier 2', value: '2' }, { label: 'Tier 3', value: '3' }],
            },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_UPLOAD_DOCUMENT: {
        type: TaskType.QORE_UPLOAD_DOCUMENT,
        label: 'Upload Document (Qore)',
        icon: FileText,
        category: TaskCategory.DOCUMENT,
        description: 'Uploads a KYC supporting document (Base64-encoded image) and attaches it to an account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number' },
            {
                name: 'documentType', type: TaskParamType.SELECT, required: true,
                options: [
                    { label: 'Passport Photo', value: '1' },
                    { label: 'ID Card', value: '2' },
                    { label: 'Signature', value: '3' },
                    { label: 'Utility Bill', value: '4' },
                ],
            },
            { name: 'imageBase64', type: TaskParamType.STRING, required: true, helperText: 'Base64-encoded image string' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_CLOSE_ACCOUNT: {
        type: TaskType.QORE_CLOSE_ACCOUNT,
        label: 'Close Account (Qore)',
        icon: XCircle,
        category: TaskCategory.COMPLIANCE,
        description: 'Permanently closes a bank account. Irreversible — always precede with an Approval Gate node.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true, helperText: 'NUBAN account number to close' },
            { name: 'narration', type: TaskParamType.STRING, required: true, helperText: 'Reason for closure (e.g. "Customer Request")' },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_RETRIEVE_BVN: {
        type: TaskType.QORE_RETRIEVE_BVN,
        label: 'Retrieve BVN Details (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Fetches name and identity details from the NIN/BVN registry for KYC verification.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'bvn', type: TaskParamType.STRING, required: true, helperText: '11-digit Bank Verification Number' },
        ],
        outputs: [
            { name: 'firstName', type: TaskParamType.STRING },
            { name: 'lastName', type: TaskParamType.STRING },
            { name: 'isSuccessful', type: TaskParamType.BOOLEAN },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    // ── Qore Account Creation & Management ────────────────────────────────────
    QORE_CREATE_ACCOUNT_QUICK: {
        type: TaskType.QORE_CREATE_ACCOUNT_QUICK,
        label: 'Create Account Quick (Qore)',
        icon: UserPlus,
        category: TaskCategory.COMPLIANCE,
        description: 'Quickly creates a bank account with minimal KYC data.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'transactionTrackingRef', type: TaskParamType.STRING, required: true },
            { name: 'accountOpeningTrackingRef', type: TaskParamType.STRING, required: true },
            { name: 'productCode', type: TaskParamType.STRING, required: true },
            { name: 'lastName', type: TaskParamType.STRING, required: true },
            { name: 'otherNames', type: TaskParamType.STRING, required: true },
            { name: 'phoneNo', type: TaskParamType.STRING, required: true },
            { name: 'gender', type: TaskParamType.NUMBER, required: true, helperText: '0: Male, 1: Female' },
            { name: 'dateOfBirth', type: TaskParamType.STRING, required: true, helperText: 'format: YYYY-MM-DD' },
            { name: 'address', type: TaskParamType.STRING, required: true },
            { name: 'placeOfBirth', type: TaskParamType.STRING, required: false },
            { name: 'nin', type: TaskParamType.STRING, required: false },
            { name: 'email', type: TaskParamType.STRING, required: false },
            { name: 'bvn', type: TaskParamType.STRING, required: false },
        ],
        outputs: [
            { name: 'accountNumber', type: TaskParamType.STRING },
            { name: 'customerId', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_CREATE_CUSTOMER_AND_ACCOUNT: {
        type: TaskType.QORE_CREATE_CUSTOMER_AND_ACCOUNT,
        label: 'Create Customer & Account (Qore)',
        icon: UserPlus,
        category: TaskCategory.COMPLIANCE,
        description: 'Creates both a customer profile and a bank account in one operation.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'lastName', type: TaskParamType.STRING, required: true },
            { name: 'otherNames', type: TaskParamType.STRING, required: true },
            { name: 'phoneNo', type: TaskParamType.STRING, required: true },
            { name: 'gender', type: TaskParamType.NUMBER, required: true },
            { name: 'dateOfBirth', type: TaskParamType.STRING, required: true },
            { name: 'address', type: TaskParamType.STRING, required: true },
            { name: 'productCode', type: TaskParamType.STRING, required: true },
            { name: 'transactionTrackingRef', type: TaskParamType.STRING, required: true },
            { name: 'bvn', type: TaskParamType.STRING, required: false },
            { name: 'email', type: TaskParamType.STRING, required: false },
            { name: 'homeAddress', type: TaskParamType.STRING, required: false },
            { name: 'city', type: TaskParamType.STRING, required: false },
            { name: 'lga', type: TaskParamType.STRING, required: false },
            { name: 'state', type: TaskParamType.STRING, required: false },
        ],
        outputs: [
            { name: 'accountNumber', type: TaskParamType.STRING },
            { name: 'customerId', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_ACCOUNT_ENQUIRY: {
        type: TaskType.QORE_ACCOUNT_ENQUIRY,
        label: 'Account Enquiry (Qore)',
        icon: Search,
        category: TaskCategory.COMPLIANCE,
        description: 'Fetches real-time status and balance for a specific account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'accountNumber', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
            { name: 'availableBalance', type: TaskParamType.NUMBER },
            { name: 'status', type: TaskParamType.STRING },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    QORE_ACCOUNT_SUMMARY: {
        type: TaskType.QORE_ACCOUNT_SUMMARY,
        label: 'Account Summary (Qore)',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Fetches high-level summary including branch and balance details.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'accountNumber', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
            { name: 'accountBalance', type: TaskParamType.NUMBER },
            { name: 'branchName', type: TaskParamType.STRING },
            { name: 'summary', type: TaskParamType.JSON },
        ],
    },

    QORE_GET_ACCOUNTS_BY_CUSTOMER: {
        type: TaskType.QORE_GET_ACCOUNTS_BY_CUSTOMER,
        label: 'Get Customer Accounts (Qore)',
        icon: Layout,
        category: TaskCategory.COMPLIANCE,
        description: 'Lists all bank accounts associated with a specific customer ID.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'customerId', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'accounts', type: TaskParamType.JSON },
            { name: 'count', type: TaskParamType.NUMBER },
        ],
    },

    QORE_CHECK_PND_STATUS: {
        type: TaskType.QORE_CHECK_PND_STATUS,
        label: 'Check PND Status (Qore)',
        icon: Shield,
        category: TaskCategory.COMPLIANCE,
        description: 'Checks if Post-No-Debit (PND) is active on an account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'isLocked', type: TaskParamType.BOOLEAN },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_UPDATE_NOTIFICATION_PREFERENCE: {
        type: TaskType.QORE_UPDATE_NOTIFICATION_PREFERENCE,
        label: 'Update Notifications (Qore)',
        icon: Mail,
        category: TaskCategory.COMPLIANCE,
        description: 'Updates how the customer receives alerts for an account.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'accountNumber', type: TaskParamType.STRING, required: true },
            {
                name: 'notificationPreference', type: TaskParamType.SELECT, required: true,
                options: [
                    { label: 'None', value: '0' },
                    { label: 'Email', value: '1' },
                    { label: 'SMS', value: '2' },
                    { label: 'Both', value: '3' },
                ],
            },
        ],
        outputs: [
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },

    QORE_GET_ACCOUNT_BY_TRACKING_REF: {
        type: TaskType.QORE_GET_ACCOUNT_BY_TRACKING_REF,
        label: 'Find Account by Tracking Ref (Qore)',
        icon: Search,
        category: TaskCategory.COMPLIANCE,
        description: 'Retrieves account details using the unique transaction tracking reference used during creation.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'transactionTrackingRef', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'accountNumber', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
            { name: 'accountBalance', type: TaskParamType.NUMBER },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    // ── Qore Customer Management ────────────────────────────────────────────────
    QORE_CREATE_CUSTOMER: {
        type: TaskType.QORE_CREATE_CUSTOMER,
        label: 'Create Customer (Qore)',
        icon: UserPlus,
        category: TaskCategory.COMPLIANCE,
        description: 'Registers a new customer profile on the Qore platform.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'lastName', type: TaskParamType.STRING, required: true },
            { name: 'otherNames', type: TaskParamType.STRING, required: true },
            { name: 'dateOfBirth', type: TaskParamType.STRING, required: true, helperText: 'format: YYYY-MM-DD' },
            { name: 'phoneNo', type: TaskParamType.STRING, required: true },
            { name: 'address', type: TaskParamType.STRING, required: true },
            { name: 'bvn', type: TaskParamType.STRING, required: false },
            { name: 'email', type: TaskParamType.STRING, required: false },
        ],
        outputs: [
            { name: 'customerId', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
        ],
    },

    QORE_GET_CUSTOMER_BY_BVN: {
        type: TaskType.QORE_GET_CUSTOMER_BY_BVN,
        label: 'Find Customer by BVN (Qore)',
        icon: Search,
        category: TaskCategory.COMPLIANCE,
        description: 'Searches for a customer record using their Bank Verification Number.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'bvn', type: TaskParamType.STRING, required: true },
        ],
        outputs: [
            { name: 'customerId', type: TaskParamType.STRING },
            { name: 'fullName', type: TaskParamType.STRING },
            { name: 'phoneNo', type: TaskParamType.STRING },
            { name: 'email', type: TaskParamType.STRING },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    // ── Qore Transaction Management ─────────────────────────────────────────────
    QORE_TRANSACTION_STATUS_QUERY: {
        type: TaskType.QORE_TRANSACTION_STATUS_QUERY,
        label: 'Query Transaction Status (Qore)',
        icon: RefreshCw,
        category: TaskCategory.COMPLIANCE,
        description: 'Queries the status of a previous transaction using its retrieval reference ID.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'retrievalReference', type: TaskParamType.STRING, required: true, helperText: '12-character retrieval reference' },
        ],
        outputs: [
            { name: 'status', type: TaskParamType.STRING },
            { name: 'transactionReference', type: TaskParamType.STRING },
            { name: 'isSuccessful', type: TaskParamType.BOOLEAN },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    QORE_INTRA_BANK_TRANSFER: {
        type: TaskType.QORE_INTRA_BANK_TRANSFER,
        label: 'Intra-Bank Transfer (Qore)',
        icon: ArrowRightLeft,
        category: TaskCategory.COMPLIANCE,
        description: 'Transfers funds between two accounts within Abia MFB via Qore.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'fromAccountNumber', type: TaskParamType.STRING, required: true },
            { name: 'toAccountNumber', type: TaskParamType.STRING, required: true },
            { name: 'amount', type: TaskParamType.NUMBER, required: true, helperText: 'Amount in Naira' },
            { name: 'narration', type: TaskParamType.STRING, required: true },
            { name: 'retrievalReference', type: TaskParamType.STRING, required: false, helperText: '12-char unique reference' },
        ],
        outputs: [
            { name: 'isSuccessful', type: TaskParamType.BOOLEAN },
            { name: 'transactionReference', type: TaskParamType.STRING },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },

    QORE_INTER_BANK_TRANSFER: {
        type: TaskType.QORE_INTER_BANK_TRANSFER,
        label: 'Inter-Bank Transfer (Qore)',
        icon: Globe,
        category: TaskCategory.COMPLIANCE,
        description: 'Transfers funds from an Abia MFB account to another bank via Qore.',
        inputs: [
            { 
                name: 'providerId', type: TaskParamType.PROVIDER, required: true,
                helperText: 'Select a configured Qore service provider' 
            },
            { 
                name: 'institutionCode', type: TaskParamType.STRING, required: false,
                helperText: 'Optional: Override the provider-level institution code' 
            },
            { name: 'fromAccountNumber', type: TaskParamType.STRING, required: true },
            { name: 'toAccountNumber', type: TaskParamType.STRING, required: true },
            { name: 'destinationBankCode', type: TaskParamType.STRING, required: true, helperText: 'CBN Bank Code' },
            { name: 'amount', type: TaskParamType.NUMBER, required: true, helperText: 'Amount in Naira' },
            { name: 'narration', type: TaskParamType.STRING, required: true },
            { name: 'retrievalReference', type: TaskParamType.STRING, required: false, helperText: '12-char unique reference' },
        ],
        outputs: [
            { name: 'isSuccessful', type: TaskParamType.BOOLEAN },
            { name: 'transactionReference', type: TaskParamType.STRING },
            { name: 'details', type: TaskParamType.JSON },
        ],
    },
    REGISTRY_SYNC: {
        type: TaskType.REGISTRY_SYNC,
        label: 'Registry Sync',
        icon: RefreshCw,
        category: TaskCategory.DATA,
        description: 'Synchronize a Provider Mapping with external platform metadata.',
        inputs: [
            {
                name: 'mappingId', type: TaskParamType.STRING, required: true,
                helperText: 'Select a Provider Mapping by ID or Name'
            },
        ],
        outputs: [
            { name: 'externalCode', type: TaskParamType.STRING },
            { name: 'success', type: TaskParamType.BOOLEAN },
        ],
    },
}
