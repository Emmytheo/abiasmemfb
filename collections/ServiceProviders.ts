import type { CollectionConfig } from 'payload'

export const ServiceProviders: CollectionConfig = {
    slug: 'service-providers',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'priority', 'isActive', 'lastHealthStatus'],
        description: 'External API and service providers used in workflow nodes.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            admin: { description: 'Unique identifier used in workflow configurations (e.g. "paystack", "termii").' },
        },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'SMS', value: 'SMS' },
                { label: 'Email', value: 'EMAIL' },
                { label: 'Payment', value: 'PAYMENT' },
                { label: 'KYC', value: 'KYC' },
                { label: 'Credit Bureau', value: 'CREDIT_BUREAU' },
                { label: 'Webhook', value: 'WEBHOOK' },
                { label: 'Custom', value: 'CUSTOM' },
            ],
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'baseUrl',
            type: 'text',
            required: true,
            admin: { description: 'Base API URL, e.g. https://api.paystack.co' },
        },
        {
            name: 'authType',
            type: 'select',
            options: [
                { label: 'None', value: 'NONE' },
                { label: 'API Key (Body)', value: 'API_KEY' },
                { label: 'Bearer Token', value: 'BEARER' },
                { label: 'Query Parameter', value: 'QUERY_PARAM' },
                { label: 'Basic Auth', value: 'BASIC' },
                { label: 'OAuth 2.0', value: 'OAUTH2' },
            ],
            defaultValue: 'API_KEY',
            required: true,
        },
        {
            name: 'authBodyFieldKey',
            type: 'text',
            defaultValue: 'AuthenticationCode',
            admin: { 
                description: 'Default field name for body auth (usually AuthenticationCode).',
                condition: (data) => data.authType === 'API_KEY'
            }
        },
        {
            name: 'authQueryParamKey',
            type: 'text',
            defaultValue: 'authToken',
            admin: { 
                description: 'Default key for query param auth (usually authToken).',
                condition: (data) => data.authType === 'QUERY_PARAM'
            }
        },
        {
            name: 'secret',
            type: 'relationship',
            relationTo: 'secrets',
            admin: {
                description: 'The vault secret holding auth credentials for this provider.',
                condition: (data) => data.authType !== 'NONE',
            },
        },
        {
            name: 'groupTag',
            type: 'text',
            admin: {
                description: 'Providers with the same groupTag participate in API_SWITCH fallback chains.',
            },
        },
        {
            name: 'priority',
            type: 'number',
            defaultValue: 1,
            admin: { description: 'Lower number = tried first in API_SWITCH failover.' },
        },
        {
            name: 'isActive',
            type: 'checkbox',
            defaultValue: true,
        },
        {
            name: 'isFallback',
            type: 'checkbox',
            defaultValue: false,
            admin: { description: 'Mark as a fallback-only provider (never used as primary).' },
        },
        {
            name: 'defaultHeaders',
            type: 'array',
            fields: [
                { name: 'key', type: 'text', required: true },
                { name: 'value', type: 'text', required: true },
            ],
            admin: { description: 'Headers automatically attached to every request made to this provider.' },
        },
        {
            name: 'healthCheckUrl',
            type: 'text',
            admin: { description: 'Endpoint used to ping provider. Leave empty to skip health checks.' },
        },
        {
            name: 'healthCheckIntervalMinutes',
            type: 'number',
            defaultValue: 15,
            admin: { condition: (data) => !!data.healthCheckUrl },
        },
        {
            name: 'metadata',
            type: 'json',
            admin: { description: 'Provider-specific config (e.g. Twilio accountSid, region).' },
        },
        // Server-written health fields
        {
            name: 'lastHealthStatus',
            type: 'select',
            options: ['healthy', 'degraded', 'down', 'unknown'],
            defaultValue: 'unknown',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'lastHealthCheckedAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'avgLatencyMs',
            type: 'number',
            admin: { readOnly: true, position: 'sidebar' },
        },
    ],
    timestamps: true,
}
