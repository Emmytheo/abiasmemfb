import type { CollectionConfig } from 'payload'

export const Customers: CollectionConfig = {
    slug: 'customers',
    admin: {
        useAsTitle: 'email',
        group: 'Management',
        defaultColumns: ['email', 'firstName', 'lastName', 'kyc_status', 'is_associated'],
        description: 'Profiles for bank customers, linking Supabase identities with Qore/BankOne core banking records.',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            type: 'row',
            fields: [
                {
                    name: 'firstName',
                    type: 'text',
                    required: true,
                    admin: { width: '50%' }
                },
                {
                    name: 'lastName',
                    type: 'text',
                    required: true,
                    admin: { width: '50%' }
                },
            ]
        },
        {
            name: 'email',
            type: 'email',
            required: true,
            unique: true,
            index: true,
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'phone_number',
                    type: 'text',
                    admin: { width: '50%' }
                },
                {
                    name: 'bvn',
                    type: 'text',
                    unique: true,
                    admin: { width: '50%', description: 'Bank Verification Number (11 digits)' }
                },
            ]
        },
        {
            name: 'qore_customer_id',
            type: 'text',
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
                description: 'The unique ID assigned by the Qore/BankOne core banking system.'
            }
        },
        {
            name: 'supabase_id',
            type: 'text',
            index: true,
            admin: {
                position: 'sidebar',
                description: 'The Supabase user UUID for digital channel access.'
            }
        },
        {
            type: 'row',
            fields: [
                {
                    name: 'kyc_status',
                    type: 'select',
                    options: [
                        { label: 'Pending', value: 'pending' },
                        { label: 'Active', value: 'active' },
                        { label: 'Inactive', value: 'inactive' },
                        { label: 'Rejected', value: 'rejected' },
                    ],
                    defaultValue: 'pending',
                    required: true,
                    admin: { width: '50%' }
                },
                {
                    name: 'risk_tier',
                    type: 'select',
                    options: [
                        { label: 'Low', value: 'low' },
                        { label: 'Medium', value: 'medium' },
                        { label: 'High', value: 'high' },
                    ],
                    defaultValue: 'low',
                    required: true,
                    admin: { width: '50%' }
                },
            ]
        },
        {
            name: 'is_associated',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'Indicates if this banking profile is linked to a Supabase digital user.'
            }
        },
        {
            name: 'is_test_account',
            type: 'checkbox',
            defaultValue: false,
            admin: {
                position: 'sidebar',
                description: 'Marks this as a predefined test account for development/QA.'
            }
        },
        {
            name: 'address',
            type: 'textarea',
        },
        {
            name: 'metadata',
            type: 'json',
            admin: {
                description: 'Extended properties from the core banking system.'
            }
        }
    ],
    hooks: {
        beforeChange: [
            async ({ data, req, operation }) => {
                // Automated Identity Discovery
                if ((operation === 'create' || operation === 'update') && data.email && !data.supabase_id) {
                    try {
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

                        if (supabaseUrl && supabaseServiceKey) {
                            // Fetch via dynamic import to keep it out of the browser bundle if needed
                            const { createClient } = await import('@supabase/supabase-js');
                            const supabase = createClient(supabaseUrl, supabaseServiceKey);
                            
                            const { data: { users }, error } = await supabase.auth.admin.listUsers();
                            if (!error && users) {
                                const found = users.find(u => u.email === data.email);
                                if (found) {
                                    data.supabase_id = found.id;
                                    data.is_associated = true;
                                }
                            }
                        }
                    } catch (e) {
                        console.error('Customer Identity Discovery Hook Error:', e);
                    }
                }
                return data;
            }
        ]
    },
    timestamps: true,
}
