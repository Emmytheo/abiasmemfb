import type { CollectionConfig } from 'payload'

export const StandingOrders: CollectionConfig = {
    slug: 'standing-orders',
    admin: {
        useAsTitle: 'destination_account_name',
        group: 'Digital Ledger',
        defaultColumns: ['source_account', 'destination_account_number', 'amount', 'frequency', 'next_run_date', 'status'],
        description: 'Automated recurring standing orders for transfers.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'user_id',
            type: 'text',
            required: true,
            index: true,
            admin: { description: 'The Supabase user UUID who owns this standing order.' },
        },
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers',
            required: true,
            index: true,
        },
        {
            name: 'source_account',
            type: 'relationship',
            relationTo: 'accounts',
            required: true,
        },
        {
            name: 'destination_bank_name',
            type: 'text',
            required: true,
        },
        {
            name: 'destination_bank_code',
            type: 'text',
            required: true,
            admin: { description: 'CBN institution code or "abiasmemfb" for intra-bank.' },
        },
        {
            name: 'destination_account_number',
            type: 'text',
            required: true,
            index: true,
        },
        {
            name: 'destination_account_name',
            type: 'text',
            required: true,
        },
        {
            name: 'amount',
            type: 'number',
            required: true,
            admin: { description: 'Amount in kobo (multiply Naira by 100).' },
        },
        {
            name: 'frequency',
            type: 'select',
            required: true,
            options: [
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
            ],
        },
        {
            name: 'start_date',
            type: 'date',
            required: true,
        },
        {
            name: 'end_date',
            type: 'date',
        },
        {
            name: 'next_run_date',
            type: 'date',
            required: true,
            index: true,
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Paused', value: 'paused' },
                { label: 'Completed', value: 'completed' },
                { label: 'Cancelled', value: 'cancelled' },
            ],
        },
        {
            name: 'narration',
            type: 'text',
            defaultValue: 'Standing Order Transfer',
        },
    ],
    timestamps: true,
}
