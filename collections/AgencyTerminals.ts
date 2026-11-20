import type { CollectionConfig } from 'payload'

export const AgencyTerminals: CollectionConfig = {
    slug: 'agency-terminals',
    admin: {
        useAsTitle: 'serial_number',
        group: 'Agency Banking',
        defaultColumns: ['serial_number', 'pos_model', 'agent_customer', 'status', 'createdAt'],
        description: 'Physical POS terminal hardware tracking and placement logs.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'agent_customer',
            type: 'relationship',
            relationTo: 'customers',
            admin: { description: 'The registered agent assigned to this terminal.' },
        },
        {
            name: 'user_id',
            type: 'text',
            index: true,
            admin: { description: 'The agent Supabase identity UUID.' },
        },
        {
            name: 'serial_number',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'pos_model',
            type: 'text',
            required: true,
            defaultValue: 'Pax S900',
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending Assignment', value: 'pending' },
                { label: 'Assigned', value: 'assigned' },
                { label: 'Active', value: 'active' },
                { label: 'Suspended', value: 'suspended' },
                { label: 'Damaged / Inactive', value: 'damaged' },
            ],
            required: true,
        },
    ],
    timestamps: true,
}
