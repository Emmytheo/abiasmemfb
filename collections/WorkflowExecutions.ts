import type { CollectionConfig } from 'payload'

export const WorkflowExecutions: CollectionConfig = {
    slug: 'workflow-executions',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'id',
        defaultColumns: ['workflowId', 'status', 'trigger', 'startedAt', 'duration'],
        description: 'Individual run records for every workflow execution.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: () => true,  // internal server actions create records
        update: () => true,
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'workflow',
            type: 'relationship',
            relationTo: 'workflows',
            required: true,
        },
        {
            name: 'trigger',
            type: 'select',
            options: [
                { label: 'Manual', value: 'MANUAL' },
                { label: 'Application Submit', value: 'APPLICATION_SUBMIT' },
                { label: 'Cron', value: 'CRON' },
                { label: 'Webhook', value: 'WEBHOOK' },
            ],
            required: true,
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Pending', value: 'PENDING' },
                { label: 'Running', value: 'RUNNING' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Failed', value: 'FAILED' },
                { label: 'Waiting Approval', value: 'WAITING_APPROVAL' },
                { label: 'Paused', value: 'PAUSED' },
                { label: 'Cancelled', value: 'CANCELLED' },
            ],
            defaultValue: 'PENDING',
            required: true,
        },
        {
            name: 'triggeredBy',
            type: 'relationship',
            relationTo: 'users',
            admin: { position: 'sidebar' },
        },
        /** Snapshot of workflow definition at time of execution */
        {
            name: 'definition',
            type: 'json',
            admin: { readOnly: true },
        },
        {
            name: 'inputData',
            type: 'json',
            admin: { description: 'Input context passed when the workflow was triggered (e.g. application data).' },
        },
        {
            name: 'phases',
            type: 'array',
            admin: { readOnly: true },
            fields: [
                { name: 'phaseNumber', type: 'number' },
                { name: 'nodeId', type: 'text' },
                { name: 'nodeType', type: 'text' },
                { name: 'status', type: 'text' },
                { name: 'inputs', type: 'json' },
                { name: 'outputs', type: 'json' },
                { name: 'startedAt', type: 'date' },
                { name: 'completedAt', type: 'date' },
                {
                    name: 'logs', type: 'array', fields: [
                        { name: 'level', type: 'text' },
                        { name: 'message', type: 'text' },
                        { name: 'timestamp', type: 'date' },
                    ]
                },
            ],
        },
        {
            name: 'idempotencyKey',
            type: 'text',
            admin: { readOnly: true, position: 'sidebar' },
            index: true,
        },
        {
            name: 'isDeduplicated',
            type: 'checkbox',
            defaultValue: false,
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'originalExecutionId',
            type: 'text',
            admin: {
                readOnly: true,
                position: 'sidebar',
                description: 'If this run was deduplicated, the original execution\'s ID.',
                condition: (data) => data.isDeduplicated,
            },
        },
        {
            name: 'startedAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'completedAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'currentPhaseIndex',
            type: 'number',
            defaultValue: 0,
            admin: { readOnly: true, position: 'sidebar' },
        },
        /** Serialized env snapshot for APPROVAL_GATE resume */
        {
            name: 'environmentSnapshot',
            type: 'json',
            admin: { readOnly: true, hidden: true },
        },
        {
            name: 'approvalRequests',
            type: 'array',
            admin: { readOnly: true },
            fields: [
                { name: 'nodeId', type: 'text' },
                { name: 'phaseNumber', type: 'number' },
                { name: 'assigneeRole', type: 'text' },
                { name: 'title', type: 'text' },
                { name: 'description', type: 'textarea' },
                { name: 'status', type: 'select', options: ['PENDING', 'APPROVED', 'REJECTED'] },
                { name: 'decision', type: 'text' },
                { name: 'notes', type: 'textarea' },
                { name: 'decidedBy', type: 'relationship', relationTo: 'users' },
                { name: 'decidedAt', type: 'date' },
                { name: 'createdAt', type: 'date' },
            ],
        },
    ],
    timestamps: true,
}
