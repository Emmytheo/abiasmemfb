import type { CollectionConfig } from 'payload'

import { supabaseStrategy } from '../lib/payload/supabase-strategy'

export const Users: CollectionConfig = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: {
        strategies: [supabaseStrategy],
        disableLocalStrategy: true, // Prevents default email/password login
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
            name: 'role',
            type: 'select',
            options: ['admin', 'customer'],
            defaultValue: 'customer',
            required: true,
        }
    ],
}
