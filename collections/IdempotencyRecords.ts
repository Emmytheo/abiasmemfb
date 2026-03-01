import type { CollectionConfig } from 'payload'

export const IdempotencyRecords: CollectionConfig = {
    slug: 'idempotency-records',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'key',
        defaultColumns: ['key', 'workflowId', 'executionId', 'expiresAt'],
        description: 'Deduplication fingerprints — prevents identical workflow runs within configured time window.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin' ?? false,
        create: () => true,
        update: () => false,
        delete: ({ req }) => req.user?.role === 'admin' ?? false,
    },
    fields: [
        {
            name: 'key',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: { description: 'SHA-256 fingerprint of workflowId + trigger + inputHash.' },
        },
        {
            name: 'workflowId',
            type: 'text',
            required: true,
            index: true,
        },
        {
            name: 'executionId',
            type: 'text',
            required: true,
            admin: { description: 'The WorkflowExecution ID that was created for this run.' },
        },
        {
            name: 'trigger',
            type: 'text',
        },
        {
            name: 'inputHash',
            type: 'text',
            admin: { description: 'SHA-256 hash of the input data payload (not the data itself).' },
        },
        {
            name: 'expiresAt',
            type: 'date',
            required: true,
            index: true,
            admin: { description: 'Records past this date are considered stale and won\'t deduplicate.' },
        },
    ],
    timestamps: true,
}
