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
            required: false,
            unique: true,
            index: true,
            admin: {
                description: 'Used for dynamic URL routing. E.g., "bills", "transfers". Must be URL-safe lowercase.',
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
    ],
    timestamps: true,
}
