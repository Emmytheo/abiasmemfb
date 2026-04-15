import type { CollectionConfig } from 'payload'

import { supabaseStrategy } from '../lib/payload/supabase-strategy'

export const Users: CollectionConfig = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: {
        strategies: [supabaseStrategy],
        disableLocalStrategy: true,
    },
    fields: [
        {
            name: 'supabase_id',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'The Supabase user UUID — used to link Payload shadow users to Supabase Auth.',
            },
        },
        {
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
            index: true,
            admin: {
                description: 'User email address from Supabase.',
            },
        },
        {
            name: 'name',
            type: 'text',
            admin: {
                description: 'Display name for the admin user.',
            },
        },
        {
            name: 'accountOfficer',
            type: 'relationship',
            relationTo: 'account-officers',
            admin: {
                description: 'Link this admin user to their staff/account officer identity in BankOne.',
            },
        },
        {
            name: 'role',
            type: 'select',
            options: ['admin'],
            defaultValue: 'admin',
            required: true,
            admin: {
                description: 'All Payload users are admins. Regular users/customers are managed in Supabase only.',
            },
        },
    ],
}
