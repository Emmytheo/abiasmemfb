import type { CollectionConfig } from 'payload'

export const Loans: CollectionConfig = {
    slug: 'loans',
    admin: {
        useAsTitle: 'id',
        group: 'Digital Ledger',
        defaultColumns: ['user_id', 'status', 'principal', 'outstanding_balance', 'next_payment_date', 'createdAt'],
        description: 'Active and historic loan records with repayment scheduling.',
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
        },
        {
            name: 'account',
            type: 'relationship',
            relationTo: 'accounts',
            admin: { description: 'The customer account into which the loan was disbursed.' },
        },
        {
            name: 'application',
            type: 'relationship',
            relationTo: 'product-applications',
            admin: { description: 'The original product application.' },
        },
        {
            name: 'product_type',
            type: 'relationship',
            relationTo: 'product-types',
        },
        {
            name: 'principal',
            type: 'number',
            required: true,
            admin: { description: 'Original loan amount in kobo.' },
        },
        {
            name: 'outstanding_balance',
            type: 'number',
            required: true,
            admin: { description: 'Remaining balance in kobo. Updated on each repayment.' },
        },
        {
            name: 'interest_rate',
            type: 'number',
            required: true,
            admin: { description: 'Annual interest rate (%).' },
        },
        {
            name: 'duration_months',
            type: 'number',
            required: true,
        },
        {
            name: 'monthly_installment',
            type: 'number',
            admin: { description: 'Calculated monthly repayment amount in kobo.' },
        },
        {
            name: 'disbursed_at',
            type: 'date',
            admin: { description: 'When the funds were disbursed.' },
        },
        {
            name: 'next_payment_date',
            type: 'date',
            index: true,
        },
        {
            name: 'maturity_date',
            type: 'date',
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            options: [
                { label: 'Pending Disbursement', value: 'pending' },
                { label: 'Active', value: 'active' },
                { label: 'Fully Repaid', value: 'repaid' },
                { label: 'Defaulted', value: 'defaulted' },
                { label: 'Written Off', value: 'written_off' },
            ],
        },
        {
            name: 'repayment_schedule',
            type: 'json',
            admin: {
                description: 'Array of { installment, dueDate, principal, interest, balance } objects.'
            },
        },
        {
            name: 'collateral',
            type: 'textarea',
            admin: { description: 'Description of collateral pledged, if any.' },
        },
        {
            name: 'purpose',
            type: 'text',
            admin: { description: 'Purpose of the loan as stated in the application.' },
        },
    ],
    timestamps: true,
}
