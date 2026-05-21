import type { CollectionConfig } from 'payload'

export const AgencyCommissions: CollectionConfig = {
    slug: 'agency-commissions',
    admin: {
        useAsTitle: 'id',
        group: 'Agency Banking',
        defaultColumns: ['agent_customer', 'terminal', 'transaction_amount', 'agent_share', 'status', 'createdAt'],
        description: 'Commission distributions generated from merchant banking operations.',
    },
    access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'agent_customer',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
        },
        {
            name: 'user_id',
            type: 'text',
            required: true,
            index: true,
        },
        {
            name: 'terminal',
            type: 'relationship',
            relationTo: 'agency-terminals',
            required: true,
        },
        {
            name: 'transaction',
            type: 'relationship',
            relationTo: 'transactions',
            required: true,
        },
        {
            name: 'transaction_amount',
            type: 'number',
            required: true,
            admin: { description: 'The absolute transaction amount in kobo.' },
        },
        {
            name: 'total_commission',
            type: 'number',
            required: true,
            admin: { description: 'Calculated transaction fee in kobo.' },
        },
        {
            name: 'agent_share',
            type: 'number',
            required: true,
            admin: { description: 'Agent split payout amount in kobo.' },
        },
        {
            name: 'bank_share',
            type: 'number',
            required: true,
            admin: { description: 'Bank retained split in kobo.' },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending Settlement', value: 'pending' },
                { label: 'Settled to Agent Float', value: 'settled' },
            ],
            required: true,
        },
    ],
    timestamps: true,
}
