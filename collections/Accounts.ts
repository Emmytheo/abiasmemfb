import type { CollectionConfig } from 'payload'

export const Accounts: CollectionConfig = {
    slug: 'accounts',
    admin: {
        useAsTitle: 'account_number',
        group: 'Digital Ledger',
        defaultColumns: ['account_number', 'account_type', 'user_id', 'balance', 'status', 'createdAt'],
        description: 'Approved customer accounts with live balance and ledger tracking.',
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
            admin: { description: 'The linked banking customer profile.' },
        },
        {
            name: 'user_id',
            type: 'text',
            required: true,
            index: true,
            admin: { description: 'The Supabase / external user ID.' },
        },
        {
            name: 'account_number',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: { description: '10-digit NUBAN account number (auto-generated on creation).' },
        },
        {
            name: 'account_type',
            type: 'select',
            required: true,
            options: [
                { label: 'Savings', value: 'Savings' },
                { label: 'Current', value: 'Current' },
                { label: 'Fixed Deposit', value: 'Fixed Deposit' },
                { label: 'Corporate', value: 'Corporate' },
            ],
        },
        {
            name: 'balance',
            type: 'number',
            required: true,
            defaultValue: 0,
            admin: { description: 'Current balance in kobo (smallest unit). Divide by 100 for Naira display.' },
        },
        {
            name: 'currency',
            type: 'text',
            defaultValue: 'NGN',
        },
        {
            name: 'source',
            type: 'select',
            required: true,
            defaultValue: 'qore',
            options: [
                { label: 'Qore Core Banking', value: 'qore' },
                { label: 'ABIASMEMFB Local', value: 'local' },
            ],
            admin: {
                position: 'sidebar',
                description: 'The authoritative source for this account data. Qore accounts are synchronized and read-only.'
            }
        },
        {
            name: 'is_primary',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'Designates this as the default account displayed in the client dashboard.'
            }
        },
        {
            name: 'is_archived',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'Marks an account as no longer found in core banking (but retained for ledger history).'
            }
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'active',
            options: [
                { label: 'Active', value: 'active' },
                { label: 'Dormant', value: 'dormant' },
                { label: 'Frozen', value: 'frozen' },
                { label: 'Closed', value: 'closed' },
            ],
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'is_frozen',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: { width: '33%' }
                },
                {
                    name: 'pnd_enabled',
                    type: 'checkbox',
                    defaultValue: false,
                    admin: { width: '33%', description: 'Post-No-Debit' }
                },
                {
                    name: 'lien_amount',
                    type: 'number',
                    defaultValue: 0,
                    admin: { width: '34%', description: 'Amount held in lien (kobo)' }
                },
            ]
        },
        {
            name: 'product_type',
            type: 'relationship',
            relationTo: 'product-types',
            admin: { description: 'The product this account was opened under.' },
        },
        {
            name: 'application',
            type: 'relationship',
            relationTo: 'product-applications',
            admin: { description: 'The original application that triggered this account opening.' },
        },
        {
            name: 'interest_rate',
            type: 'number',
            admin: { description: 'Annual interest rate (%) applicable to this account.' },
        },
        {
            name: 'last_transaction_at',
            type: 'date',
            admin: { readOnly: true, description: 'Auto-updated on each transaction.' },
        },
        {
            name: 'notes',
            type: 'textarea',
            admin: { description: 'Relationship manager notes.' },
        },
    ],
    timestamps: true,
}
