import { CollectionConfig } from 'payload'

export const AccountOfficers: CollectionConfig = {
    slug: 'account-officers',
    admin: {
        useAsTitle: 'name',
        defaultColumns: ['name', 'code', 'branch', 'email'],
        group: 'Banking Operations',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
        },
        {
            name: 'code',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'Unique staff code for the officer in BankOne.',
            },
        },
        {
            name: 'branch',
            type: 'text',
            admin: {
                description: 'Branch assignment for the officer.',
            },
        },
        {
            name: 'email',
            type: 'email',
        },
        {
            name: 'phoneNumber',
            type: 'text',
        },
        {
            name: 'gender',
            type: 'text',
        },
        {
            name: 'metadata',
            type: 'json',
            admin: {
                description: 'Raw data from the banking API.',
            },
        },
    ],
}
