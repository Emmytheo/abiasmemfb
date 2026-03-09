import type { CollectionConfig } from 'payload'

export const Beneficiaries: CollectionConfig = {
    slug: 'beneficiaries',
    admin: {
        useAsTitle: 'account_name',
        defaultColumns: ['account_name', 'account_number', 'bank_name', 'user'],
        description: 'Saved transfer targets for user accounts (Interbank & International).',
    },
    // We only enforce Read/Write ACLs naturally here for Admin UI protection.
    // Client-side fetch operations from our NextJS Server Actions will bypass this
    // via `overrideAccess: true` so they can explicitly query for `user: currentUserId`.
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'user',
            type: 'relationship',
            relationTo: 'users',
            required: true,
            index: true,
            admin: {
                description: 'The user who owns this saved beneficiary.',
            },
        },
        {
            name: 'account_name',
            type: 'text',
            required: true,
        },
        {
            name: 'account_number',
            type: 'text',
            required: true,
            index: true,
        },
        {
            name: 'bank_name',
            type: 'text',
            required: true,
        },
        {
            name: 'bank_code',
            type: 'text',
            admin: {
                description: 'CBN institution code or NIBSS channel code.',
            },
        },
        {
            name: 'currency',
            type: 'select',
            options: ['NGN', 'USD', 'GBP', 'EUR'],
            defaultValue: 'NGN',
            required: true,
        },
        {
            name: 'swift_code',
            type: 'text',
            admin: {
                description: 'Required only for international beneficiaries.',
                condition: (data) => data.currency !== 'NGN',
            },
        },
        {
            name: 'routing_number',
            type: 'text',
            admin: {
                condition: (data) => data.currency !== 'NGN',
            },
        },
        {
            name: 'country',
            type: 'text',
            admin: {
                description: 'ISO-3166 2-letter country code.',
            },
        },
    ],
    timestamps: true,
}
