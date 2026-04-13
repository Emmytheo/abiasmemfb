import type { CollectionConfig } from 'payload'

export const ServiceCategories: CollectionConfig = {
    slug: 'service-categories',
    admin: {
        useAsTitle: 'name',
        group: 'Services Engine',
        defaultColumns: ['name', 'slug', 'status'],
        description: 'Groups related services (e.g., Cable TV, Internet, Transfers) for the Client Portal UI.',
    },
    access: {
        read: () => true, // Publicly readable for the client portal
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    hooks: {
        beforeValidate: [
            ({ data }) => {
                if (data?.name && !data.slug) {
                    return {
                        ...data,
                        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')
                    }
                }
                return data;
            }
        ]
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true, // Now required for stability
            unique: true,
            index: true,
            admin: {
                description: 'Permanent identifier for this category. Used for deep-links and service mapping. Changing this might break existing portal links.',
            },
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'icon',
            type: 'text',
            admin: {
                description: 'The Lucide string icon name to display on the client UI tab (e.g., "Wifi", "Tag", "Landmark").',
            },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Inactive / Maintenance', value: 'inactive' },
            ],
            admin: {
                description: 'If inactive, all services in this category disappear from the Client Portal.',
            },
        },
        {
            name: 'ui_layout',
            type: 'select',
            required: true,
            defaultValue: 'default',
            options: [
                { label: 'Default Grid', value: 'default' },
                { label: 'Tabbed Transfers', value: 'transfer_tabs' },
            ],
            admin: {
                description: 'Specialized layout for this category. "Tabbed Transfers" will use a premium multi-tab experience.',
            },
        },
    ],
    timestamps: true,
}
