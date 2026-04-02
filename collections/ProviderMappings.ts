import type { CollectionConfig } from 'payload'

export const ProviderMappings: CollectionConfig = {
    slug: 'provider-mappings',
    admin: {
        useAsTitle: 'internalName',
        group: 'API & Integrations',
        description: 'Acts as a translation registry mapping internal platform entities to external Service Provider configurations and attributes.',
        defaultColumns: ['internalName', 'provider', 'relatedEntity', 'externalCode', 'lastAutoSync'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'internalName',
            type: 'text',
            required: true,
            admin: {
                description: 'A human-readable label for this mapping (e.g. "Standard Savings Qore Mapping")'
            }
        },
        {
            name: 'provider',
            type: 'relationship',
            relationTo: 'service-providers',
            required: true,
        },
        {
            name: 'relatedEntity',
            type: 'relationship',
            relationTo: ['product-types', 'services', 'product-classes'],
            hasMany: false,
            admin: {
                description: 'The internal dynamic entity this mapping applies to.'
            }
        },
        {
            name: 'externalCode',
            type: 'text',
            required: false,
            admin: {
                description: 'The distinct identifier used by the external provider (e.g. Qore ProductCode "101"). Can be populated by auto-sync.'
            }
        },
        {
            name: 'schemaMapping',
            type: 'json',
            admin: {
                description: 'JSON object defining how the internal entity fields correspond to the payload structure the Provider expects.'
            }
        },
        {
            name: 'autoSyncConfig',
            type: 'group',
            admin: { description: 'Settings allowing the system to automatically keep `externalCode` and settings synchronized with the provider.' },
            fields: [
                {
                    name: 'enabled',
                    type: 'checkbox',
                    defaultValue: false,
                },
                {
                    name: 'syncEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'The API Endpoint used to fetch the latest platform configurations.'
                    }
                },
                {
                    name: 'syncKeyPath',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'Dot-notation path to extract the specific list array from the response.'
                    }
                },
                {
                    name: 'matchOn',
                    type: 'text',
                    admin: {
                        condition: (data, siblingData) => siblingData?.enabled,
                        description: 'Provider field key (e.g. "productName") that should match the internal Entity name to complete a sync tie.'
                    }
                }
            ]
        },
        {
            name: 'lastAutoSync',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' }
        }
    ],
    timestamps: true,
}
