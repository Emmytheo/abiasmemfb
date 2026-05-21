import type { CollectionConfig } from 'payload'

export const EsusuMembers: CollectionConfig = {
    slug: 'esusu-members',
    admin: {
        useAsTitle: 'id',
        group: 'Digital Esusu',
        defaultColumns: ['cycle', 'customer', 'payout_order_index', 'status', 'createdAt'],
        description: 'Customer enrollment entries in Esusu cycles with slot indexes.',
    },
    access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'cycle',
            type: 'relationship',
            relationTo: 'esusu-cycles',
            required: true,
            admin: { description: 'The linked esusu rotational cycle.' },
        },
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
            admin: { description: 'The customer enrolled in this slot.' },
        },
        {
            name: 'user_id',
            type: 'text',
            required: true,
            index: true,
            admin: { description: 'The customer Supabase identity UUID.' },
        },
        {
            name: 'payout_order_index',
            type: 'number',
            required: true,
            admin: { description: 'The payout slot order (e.g. 0 for first turn, 1 for second, etc.).' },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'active',
            options: [
                { label: 'Active Member', value: 'active' },
                { label: 'Exited Cycle', value: 'exited' },
            ],
            required: true,
        },
    ],
    timestamps: true,
}
