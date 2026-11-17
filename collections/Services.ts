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
                    options: ['text', 'number', 'email', 'select', 'destination_bank_lookup', 'beneficiary_select', 'autocomplete_select', 'api_select', 'hidden'],
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
                        description: 'Comma separated list of static options for a "select" or "autocomplete_select" field (e.g., "Premium - 29500, Compact - 12500").',
                        condition: (data, siblingData) => siblingData.type === 'select' || siblingData.type === 'autocomplete_select',
                    }
                },
                {
                    name: 'options_endpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: {
                        description: 'Endpoint to fetch dynamic options from for an api_select field.',
                        condition: (data, siblingData) => siblingData.type === 'api_select',
                    }
                },
                {
                    name: 'options_text_key',
                    type: 'text',
                    admin: {
                        description: 'Field in API response representing display text (e.g., "name").',
                        condition: (data, siblingData) => siblingData.type === 'api_select',
                    }
                },
                {
                    name: 'options_value_key',
                    type: 'text',
                    admin: {
                        description: 'Field in API response representing option value (e.g., "code").',
                        condition: (data, siblingData) => siblingData.type === 'api_select',
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
                        { 
                            name: 'trigger', 
                            type: 'select', 
                            options: [
                                { label: 'On Change', value: 'onChange' },
                                { label: 'On Blur', value: 'onBlur' },
                                { label: 'On Load', value: 'onLoad' },
                                { label: 'On Condition', value: 'onCondition' }
                            ], 
                            required: true 
                        },
                        {
                            name: 'condition',
                            type: 'group',
                            admin: {
                                condition: (_, siblingData) => siblingData.trigger === 'onCondition'
                            },
                            fields: [
                                { 
                                    name: 'type', 
                                    type: 'select', 
                                    options: [
                                        { label: 'Character Length', value: 'length' },
                                        { label: 'Regex Match', value: 'regex' },
                                        { label: 'Regex Not Match', value: 'regex_not_match' }
                                    ], 
                                    required: true 
                                },
                                { name: 'value', type: 'text', required: true }
                            ]
                        },
                        { name: 'action', type: 'select', options: ['EXECUTE_ENDPOINT', 'SET_VALUE', 'SET_VALUES'], required: true },
                        { name: 'endpointId', type: 'relationship', relationTo: 'endpoints', admin: { condition: (_, siblingData) => siblingData?.action === 'EXECUTE_ENDPOINT' } },
                        { name: 'mappingConfig', type: 'json', admin: { description: 'JSON describing how API response or static data maps back to form fields.' } }
                    ]
                }
            ]
        },
        {
            name: 'description',
            type: 'textarea',
            admin: { description: 'Short summary of what this service does and who can use it.' }
        },
        {
            name: 'icon',
            type: 'text',
            admin: { description: 'Lucide icon name (e.g., "Send", "Zap", "Phone", "Shield", "CreditCard", "PiggyBank").' }
        },
        // ── Copteller Multi-Tenant Access Matrix ───────────────────────────────
        {
            type: 'collapsible',
            label: 'Copteller Access & Persona Matrix',
            admin: {
                initCollapsed: false,
                description: 'Granular visibility and permission controls for Copteller user personas.'
            },
            fields: [
                {
                    name: 'allowed_roles',
                    type: 'json',
                    required: false,
                    defaultValue: ['member', 'coop_admin', 'superadmin'],
                    admin: {
                        description: 'JSON array of roles that can view/execute this service. Valid values: member, coop_admin, investor, superadmin, agent, public. Example: ["member","coop_admin"]'
                    }
                },
                {
                    name: 'sector_tags',
                    type: 'json',
                    required: false,
                    defaultValue: ['all'],
                    admin: {
                        description: 'JSON array of economic sectors this service targets. Use ["all"] for all sectors. Valid: all, transport, agriculture, commerce, artisan, health, education, technology, other.'
                    }
                },
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'cooperative_scope',
                            type: 'select',
                            required: true,
                            defaultValue: 'all_cooperatives',
                            options: [
                                { label: 'All Cooperatives', value: 'all_cooperatives' },
                                { label: 'Specific Cooperatives Only', value: 'specific_cooperatives' },
                            ],
                            admin: { width: '50%' }
                        },
                        {
                            name: 'min_kyc_tier',
                            type: 'select',
                            required: true,
                            defaultValue: 'tier_1',
                            options: [
                                { label: 'Tier 0 (Unverified)', value: 'tier_0' },
                                { label: 'Tier 1 (Basic BVN/NIN)', value: 'tier_1' },
                                { label: 'Tier 2 (Full KYC & Address)', value: 'tier_2' },
                                { label: 'Tier 3 (Enhanced Verification)', value: 'tier_3' },
                            ],
                            admin: { width: '50%' }
                        },
                    ]
                },
                {
                    name: 'cooperatives',
                    type: 'relationship',
                    relationTo: 'cooperatives',
                    hasMany: true,
                    admin: {
                        description: 'Whitelist specific cooperative unions that have access to this service.',
                        condition: (data) => data?.cooperative_scope === 'specific_cooperatives'
                    }
                },
            ]
        },
        // ── Execution & Sandboxing Configuration ──────────────────────────────
        {
            type: 'collapsible',
            label: 'Execution & Settlement Mode',
            admin: {
                initCollapsed: false,
                description: 'Financial settlement mechanics and simulation settings.'
            },
            fields: [
                {
                    type: 'row',
                    fields: [
                        {
                            name: 'settlement_type',
                            type: 'select',
                            required: true,
                            defaultValue: 'wallet_debit',
                            options: [
                                { label: 'Direct Wallet Debit', value: 'wallet_debit' },
                                { label: 'Escrow Vault Clearing', value: 'escrow_clearing' },
                                { label: 'Agent Cash Collection', value: 'cash_agent' },
                                { label: 'Informational / Free Action', value: 'informational' },
                                { label: 'Workflow Direct Only', value: 'workflow_only' },
                            ],
                            admin: { width: '50%', description: 'How funds are debited or held for this service.' }
                        },
                        {
                            name: 'sandbox_enabled',
                            type: 'checkbox',
                            defaultValue: true,
                            admin: { width: '50%', description: 'Allow SuperAdmins and Coop Admins to dry-run test this service in sandbox mode.' }
                        },
                    ]
                },
                {
                    name: 'union_markup_allowed',
                    type: 'checkbox',
                    defaultValue: true,
                    admin: { description: 'Allow cooperative admins to configure custom union commission/markup on top of base fee.' }
                },
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
                { label: 'Airtime Recharge', value: 'bill_airtime' },
                { label: 'Cable TV Subscription', value: 'bill_cable' },
                { label: 'Electricity Bill Payment', value: 'bill_electricity' },
                { label: 'Cooperative Dues Settlement', value: 'coop_dues' },
                { label: 'Ajo Contribution', value: 'ajo_contribution' },
                { label: 'Asset Lease Repayment', value: 'hp_repayment' },
            ],
            admin: {
                description: 'Used by the UI to place this service in specialized layouts (like Transfer Tabs or Quick Actions).',
                position: 'sidebar'
            }
        }
    ],
    timestamps: true,
}
