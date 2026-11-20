import type { CollectionConfig } from 'payload'

export const MerchantProfiles: CollectionConfig = {
    slug: 'merchant-profiles',
    admin: {
        useAsTitle: 'business_name',
        group: 'Merchant Payments',
        defaultColumns: ['business_name', 'customer', 'is_verified', 'createdAt'],
        description: 'Commercial business merchant accounts with dedicated settlement routes.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
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
            name: 'business_name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'settlement_account',
            type: 'relationship',
            relationTo: 'accounts',
            required: true,
            admin: { description: 'The linked bank account where settlement payouts are processed.' },
        },
        {
            name: 'webhook_url',
            type: 'text',
            admin: { description: 'SME server URL for merchant transaction success callbacks.' },
        },
        {
            name: 'is_verified',
            type: 'checkbox',
            defaultValue: false,
            required: true,
        },
    ],
    timestamps: true,
}
