import type { CollectionConfig } from 'payload'

export const Workflows: CollectionConfig = {
    slug: 'workflows',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'name',
        defaultColumns: ['name', 'status', 'trigger', 'lastRunStatus', 'updatedAt'],
        description: 'Visual workflow definitions for automating product and service processes.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin' ?? false,
        create: ({ req }) => req.user?.role === 'admin' ?? false,
        update: ({ req }) => req.user?.role === 'admin' ?? false,
        delete: ({ req }) => req.user?.role === 'admin' ?? false,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: { description: 'Unique human-readable name for this workflow.' },
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Draft', value: 'DRAFT' },
                { label: 'Published', value: 'PUBLISHED' },
            ],
            defaultValue: 'DRAFT',
            required: true,
        },
        {
            name: 'trigger',
            type: 'select',
            options: [
                { label: 'Manual', value: 'MANUAL' },
                { label: 'Application Submit', value: 'APPLICATION_SUBMIT' },
                { label: 'Cron Schedule', value: 'CRON' },
                { label: 'Webhook', value: 'WEBHOOK' },
            ],
            defaultValue: 'MANUAL',
            required: true,
        },
        {
            name: 'cronExpression',
            type: 'text',
            admin: {
                condition: (data) => data.trigger === 'CRON',
                description: 'Standard cron expression e.g. "0 9 * * 1-5" for Mon-Fri at 9am.',
            },
        },
        {
            name: 'definition',
            type: 'json',
            admin: {
                description: 'ReactFlow canvas definition: { nodes, edges, viewport }. Managed by the visual editor.',
            },
        },
        {
            name: 'executionPlan',
            type: 'json',
            admin: {
                description: 'Compiled topological phase plan. Auto-computed on publish.',
                readOnly: true,
            },
        },
        {
            name: 'idempotencyEnabled',
            type: 'checkbox',
            defaultValue: true,
            admin: {
                description: 'Prevent duplicate runs: identical triggers within the dedup window return the existing execution.',
            },
        },
        {
            name: 'idempotencyWindowMinutes',
            type: 'number',
            defaultValue: 60,
            admin: {
                condition: (data) => data.idempotencyEnabled,
                description: 'How long (in minutes) an idempotency record is valid.',
            },
        },
        {
            name: 'tags',
            type: 'array',
            fields: [{ name: 'tag', type: 'text' }],
        },
        // Run metadata (server-written, read-only in admin)
        {
            name: 'lastRunAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastRunId',
            type: 'text',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastRunStatus',
            type: 'text',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'nextRunAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'createdBy',
            type: 'relationship',
            relationTo: 'users',
            admin: { readOnly: true, position: 'sidebar' },
        },
    ],
    timestamps: true,
}
