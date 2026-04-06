import type { CollectionConfig } from 'payload'

export const Transactions: CollectionConfig = {
    slug: 'transactions',
    admin: {
        useAsTitle: 'reference',
        group: 'Digital Ledger',
        defaultColumns: ['reference', 'type', 'amount', 'status', 'narration', 'createdAt'],
        description: 'All financial transaction records — credits, debits, transfers, disbursements, and repayments.',
    },
    access: {
        read: ({ req }) => req.user?.role === 'admin',
        create: ({ req }) => req.user?.role === 'admin',
        update: () => false, // Transactions are immutable after creation
        delete: () => false, // Never allow deleting transactions
    },
    fields: [
        {
            name: 'reference',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: { description: 'Unique transaction reference (auto-generated).' },
        },
        {
            name: 'type',
            type: 'select',
            required: true,
            options: [
                { label: 'Credit', value: 'credit' },
                { label: 'Debit', value: 'debit' },
                { label: 'Transfer', value: 'transfer' },
                { label: 'Loan Disbursement', value: 'disbursement' },
                { label: 'Loan Repayment', value: 'repayment' },
                { label: 'Fee / Charge', value: 'fee' },
                { label: 'Interest Payment', value: 'interest' },
            ],
        },
        {
            name: 'amount',
            type: 'number',
            required: true,
            admin: { description: 'Amount in kobo (divide by 100 for Naira).' },
        },
        {
            name: 'currency',
            type: 'text',
            defaultValue: 'NGN',
        },
        {
            name: 'from_account',
            type: 'relationship',
            relationTo: 'accounts',
            admin: { description: 'Source account (null for inflows from external sources).' },
        },
        {
            name: 'to_account',
            type: 'relationship',
            relationTo: 'accounts',
            admin: { description: 'Destination account (null for outflows to external destinations).' },
        },
        {
            name: 'loan',
            type: 'relationship',
            relationTo: 'loans',
            admin: { description: 'Linked loan if this is a disbursement or repayment.' },
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'successful',
            options: [
                { label: 'Successful', value: 'successful' },
                { label: 'Pending', value: 'pending' },
                { label: 'Failed', value: 'failed' },
                { label: 'Reversed', value: 'reversed' },
            ],
        },
        {
            name: 'narration',
            type: 'text',
            admin: { description: 'Human-readable description of the transaction.' },
        },
        {
            name: 'channel',
            type: 'select',
            defaultValue: 'workflow',
            options: [
                { label: 'Portal', value: 'portal' },
                { label: 'API', value: 'api' },
                { label: 'Workflow Engine', value: 'workflow' },
                { label: 'Admin', value: 'admin' },
                { label: 'USSD', value: 'ussd' },
            ],
        },
        {
            name: 'workflow_execution',
            type: 'relationship',
            relationTo: 'workflow-executions',
            admin: { description: 'The workflow execution that generated this transaction, if any.' },
        },
        {
            name: 'balance_after',
            type: 'number',
            admin: { description: 'Account balance (in kobo) after this transaction. For auditing.' },
        },
        {
            name: 'metadata',
            type: 'json',
            admin: { description: 'Additional context (external reference, provider response, etc.).' },
        },
        {
            name: 'customer',
            type: 'relationship',
            relationTo: 'customers',
            admin: { description: 'The banking customer profile linked to this transaction for identity recovery.' },
            index: true,
        },
    ],
    timestamps: true,
}
