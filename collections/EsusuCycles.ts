import type { CollectionConfig } from 'payload'

export const EsusuCycles: CollectionConfig = {
    slug: 'esusu-cycles',
    admin: {
        useAsTitle: 'name',
        group: 'Digital Esusu',
        defaultColumns: ['name', 'cooperative', 'contribution_amount', 'frequency', 'status', 'createdAt'],
        description: 'Rotational contribution cycles with dynamic payout scheduling.',
    },
    access: {
        read: () => true,
        create: ({ req }) => req.user?.role === 'admin',
        update: ({ req }) => req.user?.role === 'admin',
        delete: ({ req }) => req.user?.role === 'admin',
    },
    fields: [
        {
            name: 'cooperative',
            type: 'relationship',
            relationTo: 'cooperatives',
            required: true,
            admin: { description: 'The parent cooperative organizing this cycle.' },
        },
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'contribution_amount',
            type: 'number',
            required: true,
            admin: { description: 'Required periodic contribution amount in kobo.' },
        },
        {
            name: 'frequency',
            type: 'select',
            required: true,
            defaultValue: 'daily',
            options: [
                { label: 'Daily', value: 'daily' },
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
            ],
        },
        {
            name: 'cycle_start_date',
            type: 'date',
            required: true,
        },
        {
            name: 'cycle_end_date',
            type: 'date',
        },
        {
            name: 'platform_fee_percent',
            type: 'number',
            defaultValue: 1,
            required: true,
            admin: { description: 'Platform fee percentage retained from each payout pool (e.g. 1%).' },
        },
        {
            name: 'status',
            type: 'select',
            defaultValue: 'draft',
            options: [
                { label: 'Draft', value: 'draft' },
                { label: 'Active', value: 'active' },
                { label: 'Completed', value: 'completed' },
            ],
            required: true,
        },
        {
            name: 'total_slots',
            type: 'number',
            required: true,
            admin: { description: 'Total number of members/slots in this cycle.' },
        },
        {
            name: 'current_payout_index',
            type: 'number',
            defaultValue: 0,
            required: true,
            admin: { description: 'The zero-based index representing the current slot recipient.' },
        },
        {
            name: 'holding_vault_account',
            type: 'relationship',
            relationTo: 'accounts',
            admin: { description: 'The pooled holding account for contributions before payout.' },
        },
    ],
    timestamps: true,
}
