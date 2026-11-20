import type { CollectionConfig } from 'payload'

export const MerchantApiKeys: CollectionConfig = {
    slug: 'merchant-api-keys',
    admin: {
        useAsTitle: 'key_prefix',
        group: 'Merchant Payments',
        defaultColumns: ['merchant', 'key_prefix', 'key_type', 'is_active', 'createdAt'],
        description: 'Secure API credentials for third-party merchant gateway integration.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
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
            name: 'key_hash',
            type: 'text',
            required: true,
            unique: true,
            admin: { description: 'Cryptographic SHA-256 hash of the generated API key.' },
        },
        {
            name: 'key_prefix',
            type: 'text',
            required: true,
            admin: { description: 'Readable prefix (e.g. pk_live_ or sk_test_).' },
        },
        {
            name: 'key_type',
            type: 'select',
            required: true,
            options: [
                { label: 'Live Public Key', value: 'live_public' },
                { label: 'Live Secret Key', value: 'live_secret' },
                { label: 'Test Public Key', value: 'test_public' },
                { label: 'Test Secret Key', value: 'test_secret' },
            ],
        },
        {
            name: 'is_active',
            type: 'checkbox',
            defaultValue: true,
            required: true,
        },
    ],
    timestamps: true,
}
