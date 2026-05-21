import type { CollectionConfig } from 'payload'

export const Cooperatives: CollectionConfig = {
    slug: 'cooperatives',
    admin: {
        useAsTitle: 'name',
        group: 'Digital Esusu',
        defaultColumns: ['name', 'union_leader', 'status', 'createdAt'],
        description: 'Trade cooperatives and esusu groups managed by union leaders.',
    },
    access: {
        read: () => true,
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
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'union_leader',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
            admin: { description: 'The registered customer serving as Union Leader.' },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
            ],
            required: true,
        },
    ],
    timestamps: true,
}
