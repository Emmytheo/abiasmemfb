import type { CollectionConfig } from 'payload'

export const ProviderHealthLogs: CollectionConfig = {
    slug: 'provider-health-logs',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'id',
        defaultColumns: ['provider', 'status', 'latencyMs', 'checkedAt'],
        description: 'Health check history for all service providers.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin' ?? false,
        create: () => true,
        update: () => false,
        delete: ({ req }) => req.user?.role === 'admin' ?? false,
    },
    fields: [
        {
            name: 'provider',
            type: 'relationship',
            relationTo: 'service-providers',
            required: true,
            index: true,
        },
        {
            name: 'status',
            type: 'select',
            options: [
                { label: '✅ Healthy', value: 'healthy' },
                { label: '⚠️ Degraded', value: 'degraded' },
                { label: '❌ Down', value: 'down' },
                { label: '❓ Unknown', value: 'unknown' },
            ],
            required: true,
        },
        { name: 'latencyMs', type: 'number' },
        { name: 'statusCode', type: 'number' },
        { name: 'errorMessage', type: 'text' },
        {
            name: 'checkedAt',
            type: 'date',
            required: true,
            index: true,
        },
    ],
}
