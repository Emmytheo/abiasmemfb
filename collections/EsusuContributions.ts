import type { CollectionConfig } from 'payload'

export const EsusuContributions: CollectionConfig = {
    slug: 'esusu-contributions',
    admin: {
        useAsTitle: 'id',
        group: 'Digital Esusu',
        defaultColumns: ['cycle', 'member', 'amount', 'status', 'createdAt'],
        description: 'Payment contribution receipts recorded within rotational cycles.',
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
        },
        {
            name: 'member',
            type: 'relationship',
            relationTo: 'esusu-members',
            required: true,
        },
        {
            name: 'customer',
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
            name: 'amount',
            type: 'number',
            required: true,
            admin: { description: 'Contributed amount in kobo.' },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'paid',
            options: [
                { label: 'Paid', value: 'paid' },
                { label: 'Delinquent', value: 'delinquent' },
            ],
            required: true,
        },
        {
            name: 'transaction',
            type: 'relationship',
            relationTo: 'transactions',
            admin: { description: 'The related ledger transfer transaction.' },
        },
    ],
    timestamps: true,
}
