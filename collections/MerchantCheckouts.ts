import type { CollectionConfig } from 'payload'

export const MerchantCheckouts: CollectionConfig = {
    slug: 'merchant-checkouts',
    admin: {
        useAsTitle: 'reference',
        group: 'Merchant Payments',
        defaultColumns: ['reference', 'merchant', 'amount', 'status', 'createdAt'],
        description: 'Individual merchant checkout checkout session logs.',
    },
    access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'merchant',
            type: 'relationship',
            relationTo: 'merchant-profiles',
            required: true,
        },
        {
            name: 'amount',
            type: 'number',
            required: true,
            admin: { description: 'Checkout session charge amount in kobo.' },
        },
        {
            name: 'currency',
            type: 'text',
            defaultValue: 'NGN',
            required: true,
        },
        {
            name: 'customer_email',
            type: 'text',
            required: true,
        },
        {
            name: 'reference',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'redirect_url',
            type: 'text',
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Successful', value: 'successful' },
                { label: 'Failed', value: 'failed' },
            ],
            required: true,
        },
        {
            name: 'metadata',
            type: 'json',
            admin: { description: 'Arbitrary custom metadata provided by the integration.' },
        },
        {
            name: 'transaction',
            type: 'relationship',
            relationTo: 'transactions',
            admin: { description: 'The resulting ledger settlement transfer transaction.' },
        },
    ],
    timestamps: true,
}
