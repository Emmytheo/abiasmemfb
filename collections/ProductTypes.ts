import type { CollectionConfig, Block } from 'payload'

const LoanTermsBlock: Block = {
    slug: 'loan-terms',
    labels: {
        singular: 'Loan Terms',
        plural: 'Loan Terms',
    },
    fields: [
        { name: 'interest_rate', type: 'number', label: 'Interest Rate (%)', required: true },
        { name: 'min_amount', type: 'number', label: 'Minimum Loan Amount', required: true },
        { name: 'max_amount', type: 'number', label: 'Maximum Loan Amount', required: true },
        { name: 'min_duration', type: 'number', label: 'Minimum Repayment Duration', admin: { description: 'In months' } },
        { name: 'max_duration', type: 'number', label: 'Maximum Repayment Duration', admin: { description: 'In months' } },
    ]
}

const SavingsTermsBlock: Block = {
    slug: 'savings-terms',
    labels: {
        singular: 'Savings Terms',
        plural: 'Savings Terms',
    },
    fields: [
        { name: 'interest_rate', type: 'number', label: 'Interest Rate (%)', admin: { description: 'Annual percentage yield' } },
        { name: 'min_balance', type: 'number', label: 'Minimum Opening Balance', required: true },
        { name: 'monthly_maintenance_fee', type: 'number', label: 'Monthly Maintenance Fee' },
    ]
}

const FixedDepositTermsBlock: Block = {
    slug: 'fixed-deposit-terms',
    labels: {
        singular: 'Fixed Deposit Terms',
        plural: 'Fixed Deposit Terms',
    },
    fields: [
        { name: 'interest_rate', type: 'number', label: 'Fixed Interest Rate (%)', required: true },
        { name: 'min_amount', type: 'number', label: 'Minimum Deposit Amount', required: true },
        { name: 'lockup_period', type: 'number', label: 'Lockup Period', admin: { description: 'In days or months (specify in description)' }, required: true },
        { name: 'penalty_rate', type: 'number', label: 'Early Withdrawal Penalty Rate (%)' },
    ]
}

export const ProductTypes: CollectionConfig = {
    slug: 'product-types',
    admin: {
        useAsTitle: 'name',
        group: 'Business Settings',
        defaultColumns: ['name', 'category', 'status'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'product-categories',
            required: true,
        },
        {
            name: 'tagline',
            type: 'text',
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            options: ['active', 'draft', 'archived'],
            defaultValue: 'active',
            required: true,
        },
        {
            name: 'financial_terms',
            type: 'blocks',
            admin: {
                description: 'Add the specific terms for this product based on its category (e.g., Loan Terms vs Savings Terms)'
            },
            minRows: 0,
            maxRows: 1,
            blocks: [LoanTermsBlock, SavingsTermsBlock, FixedDepositTermsBlock],
        },
        {
            name: 'image_url',
            type: 'text',
            admin: {
                description: 'Provide an external image URL or local representation'
            }
        },
        {
            name: 'form_schema',
            type: 'array',
            admin: { description: 'Dynamic fields for the application form' },
            fields: [
                { name: 'label', type: 'text', required: true },
                { name: 'type', type: 'select', options: ['text', 'number', 'email', 'select', 'file'], required: true },
                { name: 'required', type: 'checkbox', defaultValue: false },
                { name: 'placeholder', type: 'text' },
                { name: 'description', type: 'text' },
                { name: 'options', type: 'json' },
                {
                    name: 'validations',
                    type: 'array',
                    admin: { description: 'Client & Server side validations for this field.' },
                    fields: [
                        { name: 'type', type: 'select', options: ['regex', 'min', 'max', 'api_lookup'], required: true },
                        { name: 'value', type: 'text', admin: { description: 'Regex pattern, numeric limit, or Endpoint ID depending on type.' } },
                        { name: 'errorMessage', type: 'text' }
                    ]
                },
                {
                    name: 'events',
                    type: 'array',
                    admin: { description: 'Dynamic actions triggered when interacting with this field.' },
                    fields: [
                        { name: 'trigger', type: 'select', options: ['onChange', 'onBlur', 'onLoad'], required: true },
                        { name: 'action', type: 'select', options: ['EXECUTE_ENDPOINT', 'SET_VALUE'], required: true },
                        { name: 'endpointId', type: 'relationship', relationTo: 'endpoints', admin: { condition: (_, siblingData) => siblingData?.action === 'EXECUTE_ENDPOINT' } },
                        { name: 'mappingConfig', type: 'json', admin: { description: 'JSON describing how API response or static data maps back to form fields.' } }
                    ]
                }
            ],
        },
        {
            name: 'workflow',
            type: 'relationship',
            relationTo: 'workflows',
            admin: {
                description: 'The automated workflow executed when a user applies for this product.'
            }
        },
        {
            name: 'workflow_stages',
            type: 'array',
            admin: {
                description: 'The human-readable stage names shown to customers in the application tracker (e.g. Submitted, Under Review, Approved).'
            },
            defaultValue: [
                { stage: 'Submitted' },
                { stage: 'Under Review' },
                { stage: 'Approved' },
            ],
            fields: [
                { name: 'stage', type: 'text', required: true },
            ]
        },
    ],
}
