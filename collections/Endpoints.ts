import type { CollectionConfig } from 'payload'

export const Endpoints: CollectionConfig = {
    slug: 'endpoints',
    admin: {
        useAsTitle: 'name',
        group: 'API & Integrations',
        defaultColumns: ['name', 'provider', 'method', 'path', 'status'],
        description: 'Dynamic API endpoint specifications enabling the workflow engine to execute generic HTTP requests.',
    },
    access: {
        read: () => true, // Access logic usually mirrors ServiceProviders in a real app, assuming authenticated users for now
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            admin: { description: 'A readable name for this endpoint (e.g. Account Enquiry).' }
        },
        {
            name: 'provider',
            type: 'relationship',
            relationTo: 'service-providers',
            required: true,
            admin: { description: 'The Service Provider whose credentials and Base URL this endpoint will use.' }
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'method',
            type: 'select',
            options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
            defaultValue: 'GET',
            required: true,
            admin: { position: 'sidebar' }
        },
        {
            name: 'path',
            type: 'text',
            required: true,
            admin: {
                description: 'The API path relative to the Provider Base URL (e.g. /BankOneWebAPI/api/Account/AccountEnquiry)'
            }
        },
        {
            name: 'status',
            type: 'select',
            options: ['active', 'deprecated', 'draft'],
            defaultValue: 'active',
            required: true,
            admin: { position: 'sidebar' }
        },
        {
            name: 'headers',
            type: 'array',
            admin: { description: 'Static headers specific to this endpoint (overrides provider defaults).' },
            fields: [
                { name: 'key', type: 'text', required: true },
                { name: 'value', type: 'text', required: true }
            ]
        },
        {
            name: 'queryParams',
            type: 'array',
            admin: { description: 'Static query parameters specific to this endpoint.' },
            fields: [
                { name: 'key', type: 'text', required: true },
                { name: 'value', type: 'text', required: true }
            ]
        },
        {
            name: 'authOverride',
            type: 'select',
            options: [
                { label: 'Inherit from Provider', value: 'INHERIT' },
                { label: 'None', value: 'NONE' },
                { label: 'API Key (Body/Param Name)', value: 'API_KEY' },
                { label: 'Bearer Token', value: 'BEARER' },
                { label: 'Query Parameter', value: 'QUERY_PARAM' },
                { label: 'Body Field', value: 'BODY_FIELD' }
            ],
            defaultValue: 'INHERIT',
            admin: { position: 'sidebar', description: 'Override the default provider auth method for this specific endpoint.' }
        },
        {
            name: 'authBodyFieldKey',
            type: 'text',
            defaultValue: 'AuthenticationCode',
            admin: { 
                position: 'sidebar', 
                description: 'The field name used for the secret in the request body (e.g. AuthenticationCode or Token).',
                condition: (data) => data.authOverride === 'BODY_FIELD' || (data.authOverride === 'INHERIT' && !data.authOverride)
            }
        },
        {
            name: 'authQueryParamKey',
            type: 'text',
            defaultValue: 'authToken',
            admin: { 
                position: 'sidebar',
                description: 'The query parameter name used for the secret (e.g. authToken or token).',
                condition: (data) => data.authOverride === 'QUERY_PARAM'
            }
        },
        {
            name: 'queryParamsSchema',
            type: 'json',
            admin: { description: 'A JSON Schema outlining the expected query parameters (used to dynamically generate Workflow node inputs).' }
        },
        {
            name: 'bodySchema',
            type: 'json',
            admin: { description: 'A JSON Schema outlining the expected request body payload.' }
        },
        {
            name: 'responseSchema',
            type: 'json',
            admin: { description: 'A JSON mapping/schema telling the Workflow Engine how to extract output values from the raw API response.' }
        }
    ],
    timestamps: true,
}
