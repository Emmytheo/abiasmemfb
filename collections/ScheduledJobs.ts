import type { CollectionConfig } from 'payload'

export const ScheduledJobs: CollectionConfig = {
    slug: 'scheduled-jobs',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'id',
        defaultColumns: ['workflow', 'type', 'status', 'nextRunAt', 'runCount'],
        description: 'Cron, one-time, and interval schedules for automated workflow runs.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: () => true,
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'workflow',
            type: 'relationship',
            relationTo: 'workflows',
            required: true,
            index: true,
        },
        {
            name: 'type',
            type: 'select',
            options: [
                { label: 'Cron Expression', value: 'CRON' },
                { label: 'One-Time', value: 'ONE_TIME' },
                { label: 'Interval', value: 'INTERVAL' },
            ],
            required: true,
        },
        {
            name: 'cronExpression',
            type: 'text',
            admin: {
                condition: (data) => data.type === 'CRON',
                description: 'e.g. "0 8 * * 1-5" — weekdays at 8am.',
            },
        },
        {
            name: 'runAt',
            type: 'date',
            admin: {
                condition: (data) => data.type === 'ONE_TIME',
                description: 'Exact date/time for the single run.',
            },
        },
        {
            name: 'intervalMs',
            type: 'number',
            admin: {
                condition: (data) => data.type === 'INTERVAL',
                description: 'Interval in milliseconds between runs.',
            },
        },
        {
            name: 'maxRuns',
            type: 'number',
            admin: { description: 'Maximum runs before auto-cancelling. Leave empty for unlimited.' },
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Paused', value: 'PAUSED' },
                { label: 'Completed', value: 'COMPLETED' },
                { label: 'Failed', value: 'FAILED' },
                { label: 'Cancelled', value: 'CANCELLED' },
            ],
            defaultValue: 'ACTIVE',
        },
        {
            name: 'idempotencyNamespace',
            type: 'text',
            admin: { description: 'Scope for dedup — defaults to jobId. Change to share dedup window across jobs.' },
        },
        {
            name: 'inputData',
            type: 'json',
            admin: { description: 'Data passed as trigger input on each run.' },
        },
        // Server-written fields
        { name: 'runCount', type: 'number', defaultValue: 0, admin: { readOnly: true } },
        { name: 'nextRunAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
        { name: 'lastRunAt', type: 'date', admin: { readOnly: true, position: 'sidebar' } },
        { name: 'lastRunStatus', type: 'text', admin: { readOnly: true, position: 'sidebar' } },
    ],
    timestamps: true,
}
