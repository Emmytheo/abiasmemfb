import type { CollectionConfig } from 'payload'

export const CustomBlocks: CollectionConfig = {
    slug: 'custom-blocks',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'updatedAt'],
        description: 'User-defined reusable workflow node blocks with dynamic inputs/outputs.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin' ?? false,
        create: ({ req }) => req.user?.role === 'admin' ?? false,
        update: ({ req }) => req.user?.role === 'admin' ?? false,
        delete: ({ req }) => req.user?.role === 'admin' ?? false,
    },
    fields: [
        { name: 'name', type: 'text', required: true },
        { name: 'description', type: 'textarea' },
        { name: 'icon', type: 'text', admin: { description: 'Lucide icon name, e.g. "zap", "shield", "database".' } },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'Flow Control', value: 'FLOW_CONTROL' },
                { label: 'API Integration', value: 'API_INTEGRATION' },
                { label: 'Approval', value: 'APPROVAL' },
                { label: 'Notification', value: 'NOTIFICATION' },
                { label: 'Data', value: 'DATA' },
                { label: 'Compliance', value: 'COMPLIANCE' },
                { label: 'Custom', value: 'CUSTOM' },
            ],
            defaultValue: 'CUSTOM',
        },
        {
            name: 'inputs',
            type: 'array',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'type', type: 'select', options: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON', 'SELECT', 'CREDENTIAL', 'PROVIDER'] },
                { name: 'required', type: 'checkbox', defaultValue: false },
                { name: 'helperText', type: 'text' },
                { name: 'hideHandle', type: 'checkbox', defaultValue: false },
            ],
        },
        {
            name: 'outputs',
            type: 'array',
            fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'type', type: 'select', options: ['STRING', 'NUMBER', 'BOOLEAN', 'JSON'] },
            ],
        },
        {
            name: 'internalDefinition',
            type: 'json',
            admin: {
                description: 'If this block is composed of sub-nodes, their ReactFlow definition lives here.',
            },
        },
        {
            name: 'executorCode',
            type: 'textarea',
            admin: {
                description: 'Optional server-side JS executor (runs in sandbox). Leave empty to use internalDefinition sub-flow.',
            },
        },
        { name: 'version', type: 'number', defaultValue: 1, admin: { readOnly: true } },
        {
            name: 'usedInWorkflows',
            type: 'relationship',
            relationTo: 'workflows',
            hasMany: true,
            admin: { readOnly: true, description: 'Auto-tracked: workflows that reference this block.' },
        },
    ],
    timestamps: true,
}
