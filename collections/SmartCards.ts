import type { CollectionConfig } from 'payload'

export const SmartCards: CollectionConfig = {
    slug: 'smart-cards',
    admin: {
        useAsTitle: 'card_number_masked',
        group: 'Smart Cards',
        defaultColumns: ['card_holder_name', 'card_network', 'card_type', 'is_frozen', 'status', 'createdAt'],
        description: 'Physical & virtual debit card assets owned by customers.',
    },
    access: {
        read: ({ req }) => {
            if (req.user?.role === 'admin') return true
            if (req.user?.supabase_id) return { user_id: { equals: req.user.supabase_id } }
            return false
        },
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
            name: 'account',
            type: 'relationship',
            relationTo: 'accounts',
            required: true,
            admin: { description: 'The parent core deposit account supporting transaction debits.' },
        },
        {
            name: 'card_token',
            type: 'text',
            required: true,
            unique: true,
            index: true,
        },
        {
            name: 'card_holder_name',
            type: 'text',
            required: true,
        },
        {
            name: 'card_network',
            type: 'select',
            required: true,
            defaultValue: 'verve',
            options: [
                { label: 'Visa', value: 'visa' },
                { label: 'Mastercard', value: 'mastercard' },
                { label: 'Verve', value: 'verve' },
            ],
        },
        {
            name: 'card_type',
            type: 'select',
            required: true,
            defaultValue: 'virtual',
            options: [
                { label: 'Physical Card', value: 'physical' },
                { label: 'Virtual Card', value: 'virtual' },
            ],
        },
        {
            name: 'card_number_masked',
            type: 'text',
            required: true,
        },
        {
            name: 'limit_pos',
            type: 'number',
            defaultValue: 10000000, // 100k NGN in kobo
            required: true,
            admin: { description: 'Daily POS terminal payment limit in kobo.' },
        },
        {
            name: 'limit_web',
            type: 'number',
            defaultValue: 5000000, // 50k NGN in kobo
            required: true,
            admin: { description: 'Daily online web payment limit in kobo.' },
        },
        {
            name: 'limit_atm',
            type: 'number',
            defaultValue: 2000000, // 20k NGN in kobo
            required: true,
            admin: { description: 'Daily ATM withdrawal limit in kobo.' },
        },
        {
            name: 'is_frozen',
            type: 'checkbox',
            defaultValue: false,
            required: true,
            admin: { description: 'Instantly block all incoming auth requests if toggled.' },
        },
        {
            name: 'pin_hash',
            type: 'text',
        },
        {
            name: 'expiry_date',
            type: 'date',
            required: true,
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'pending_issuance',
            options: [
                { label: 'Pending Issuance', value: 'pending_issuance' },
                { label: 'Active', value: 'active' },
                { label: 'Frozen', value: 'frozen' },
                { label: 'Terminated', value: 'terminated' },
            ],
            required: true,
        },
    ],
    timestamps: true,
}
