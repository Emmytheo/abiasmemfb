import type { CollectionConfig } from 'payload'
import { encryptSecret } from '@/lib/workflow/secrets/encryption'

export const Secrets: CollectionConfig = {
    slug: 'secrets',
    admin: {
        group: 'Workflow Engine',
        useAsTitle: 'name',
        defaultColumns: ['name', 'category', 'expiresAt', 'lastRotatedAt'],
        description: 'AES-256-GCM encrypted vault for API keys, SMTP credentials, tokens and more.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    hooks: {
        beforeChange: [
            async ({ data, operation }) => {
                // If a raw value is provided (on create or update), encrypt it
                if (data.value) {
                    const { ciphertext, iv, tag } = await encryptSecret(data.value as string)
                    data.encryptedValue = ciphertext
                    data.iv = iv
                    data.tag = tag

                    // We delete the plaintext value from the data payload 
                    // so it doesn't get saved into the DB if Payload ever decides to
                    delete data.value
                }
                return data
            }
        ]
    },
    fields: [
        { name: 'name', type: 'text', required: true },
        {
            name: 'category',
            type: 'select',
            options: [
                { label: 'API Key', value: 'API_KEY' },
                { label: 'SMTP / Email', value: 'SMTP' },
                { label: 'OAuth Token', value: 'OAUTH_TOKEN' },
                { label: 'Database URI', value: 'DATABASE_URI' },
                { label: 'Webhook Secret', value: 'WEBHOOK_SECRET' },
                { label: 'Custom', value: 'CUSTOM' },
            ],
            defaultValue: 'API_KEY',
            required: true,
        },
        { name: 'description', type: 'textarea' },
        // Virtual field for raw unencrypted input.
        // It's stripped out in the beforeChange hook.
        {
            name: 'value',
            type: 'text',
            admin: { hidden: true },
            hooks: {
                beforeChange: [() => null], // Ensure it's never written to the DB schema
            }
        },
        // Encrypted fields — never exposed by GET /api/secrets/:id
        {
            name: 'encryptedValue',
            type: 'text',
            admin: {
                description: 'AES-256-GCM ciphertext. Never read directly — use the vault resolver.',
                hidden: true, // hide from admin list view
            },
        },
        { name: 'iv', type: 'text', admin: { hidden: true } },
        { name: 'tag', type: 'text', admin: { hidden: true } },
        {
            name: 'linkedProviders',
            type: 'relationship',
            relationTo: 'service-providers',
            hasMany: true,
            admin: { description: 'Providers that use this secret for authentication.' },
        },
        {
            name: 'expiresAt',
            type: 'date',
            admin: { position: 'sidebar', description: 'Optional expiry — flagged in dashboard when reached.' },
        },
        {
            name: 'lastRotatedAt',
            type: 'date',
            admin: { readOnly: true, position: 'sidebar' },
        },
        {
            name: 'rotationHistory',
            type: 'array',
            admin: { readOnly: true },
            fields: [
                { name: 'rotatedAt', type: 'date' },
                { name: 'rotatedBy', type: 'relationship', relationTo: 'users' },
                { name: 'note', type: 'text' },
            ],
        },
    ],
    timestamps: true,
}
