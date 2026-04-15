import type { CollectionConfig } from 'payload'

export const Services: CollectionConfig = {
    slug: 'services',
    admin: {
        useAsTitle: 'name',
        group: 'Services Engine',
        defaultColumns: ['name', 'category', 'status'],
        description: 'Individual executables for bill payments, transfers, or utilities.',
    },
    access: {
        read: () => true, // Client needs to read available services
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
            admin: { description: 'E.g., "DSTV Premium", "Intra-Bank Transfer"' }
        },
        {
            name: 'category',
            type: 'relationship',
            relationTo: 'service-categories',
            required: true,
            index: true,
        },
        {
            name: 'provider',
            type: 'relationship',
            relationTo: 'service-providers',
            admin: {
                description: 'Optional. The 3rd party API handling this service. Leave blank for purely internal services (like an Intra-bank transfer).',
            },
        },
        {
            name: 'provider_service_code',
            type: 'text',
            admin: {
                description: 'Optional. The specific ID or Biller Code the 3rd party API requires (e.g., "dstv_ng").',
            },
        },
        {
            name: 'validation_workflow',
            type: 'relationship',
            relationTo: 'workflows',
            admin: {
                description: 'Optional. Workflow triggered immediately when a specific target field is filled (e.g., to resolve an Account Name or validate a Meter Number).',
            },
        },
        {
            name: 'execution_workflow',
            type: 'relationship',
            relationTo: 'workflows',
            admin: {
                description: 'The Workflow triggered when the user clicks the final "Submit/Pay" button.',
            },
        },
        {
            name: 'fee_type',
            type: 'select',
            required: true,
            defaultValue: 'none',
            options: [
                { label: 'Free', value: 'none' },
                { label: 'Flat Fee', value: 'flat' },
                { label: 'Percentage', value: 'percentage' },
                { label: 'Tiered (Dynamic)', value: 'tiered' },
            ],
            admin: {
                description: 'How the convenience fee or markup is calculated on top of the principal.'
            }
        },
        {
            name: 'fee_value',
            type: 'number',
            admin: {
                description: 'The exact Flat Fee (in units) or Percentage (e.g., 1.5). Ignored if Free or Tiered.',
                condition: (data) => data.fee_type === 'flat' || data.fee_type === 'percentage',
            }
        },
        {
            name: 'form_schema',
            type: 'array',
            admin: {
                description: 'Defines the exact inputs the user must provide on the client interface to execute this service.',
            },
            fields: [
                {
                    name: 'name',
                    type: 'text',
                    required: true,
                    admin: { description: 'The exact variable name sent to the workflow engine (e.g., "accountNumber", "amount"). No spaces.' }
                },
                {
                    name: 'label',
                    type: 'text',
                    required: true,
                    admin: { description: 'The human-readable label shown on the form.' }
                },
                {
                    name: 'type',
                    type: 'select',
                    required: true,
                    options: ['text', 'number', 'email', 'select', 'destination_bank_lookup', 'beneficiary_select'],
                },
                {
                    name: 'required',
                    type: 'checkbox',
                    defaultValue: true,
                },
                {
                    name: 'placeholder',
                    type: 'text',
                },
                {
                    name: 'options',
                    type: 'text',
                    admin: {
                        description: 'Comma separated list of static options for a "select" field (e.g., "Premium - 29500, Compact - 12500").',
                        condition: (data, siblingData) => siblingData.type === 'select',
                    }
                },
                {
                    name: 'triggers_validation',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: {
                        description: 'Legacy. Use the "events" array below for modern API-driven validation logic.',
                        hidden: true
                    }
                },
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
                        { name: 'action', type: 'select', options: ['EXECUTE_ENDPOINT', 'SET_VALUE', 'SET_VALUES'], required: true },
                        { name: 'endpointId', type: 'relationship', relationTo: 'endpoints', admin: { condition: (_, siblingData) => siblingData?.action === 'EXECUTE_ENDPOINT' } },
                        { name: 'mappingConfig', type: 'json', admin: { description: 'JSON describing how API response or static data maps back to form fields.' } }
                    ]
                }
            ]
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
            ],
        },
        {
            name: 'service_intent',
            type: 'select',
            required: true,
            defaultValue: 'none',
            options: [
                { label: 'Generic / None', value: 'none' },
                { label: 'Intra-bank Transfer', value: 'transfer_intra' },
                { label: 'Inter-bank Transfer', value: 'transfer_interbank' },
                { label: 'International Transfer', value: 'transfer_international' },
            ],
            admin: {
                description: 'Used by the UI to place this service in specialized layouts (like Transfer Tabs).',
                position: 'sidebar'
            }
        }
    ],
    timestamps: true,
}
