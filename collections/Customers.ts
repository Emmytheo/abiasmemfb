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
            unique: true,
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
        },
        {
            name: 'is_archived',
            type: 'checkbox',
            defaultValue: false,
            admin: { position: 'sidebar' }
        },
        {
            name: 'active',
            type: 'checkbox',
            defaultValue: true,
            admin: { position: 'sidebar' }
        },
        {
            name: 'merger_status',
            type: 'select',
            options: [
                { label: 'None', value: 'none' },
                { label: 'Primary', value: 'primary' },
                { label: 'Archived (Merged)', value: 'archived' },
            ],
            defaultValue: 'none',
            admin: { position: 'sidebar' }
        },
        {
            name: 'legacy_qore_ids',
            type: 'array',
            admin: {
                description: 'Qore Customer IDs that have been merged into this primary profile. Preserves external asset links.',
                position: 'sidebar'
            },
            fields: [
                {
                    name: 'qore_id',
                    type: 'text',
                    required: true,
                }
            ]
        }
    ],
    hooks: {
        afterChange: [
            async ({ doc, req, operation }) => {
                if (operation === 'update' && req.user && req.user.collection === 'users') {
                    // Update originated from UI by admin. Push to Qore.
                    try {
                        const settings = await req.payload.findGlobal({ slug: 'site-settings' as any });
                        const syncConfig = (settings as any).sync || {};
                        const updateEndpointId = typeof syncConfig.customerUpdateEndpoint === 'object' ? syncConfig.customerUpdateEndpoint?.id : syncConfig.customerUpdateEndpoint;
                        
                        if (updateEndpointId && doc.qore_customer_id) {
                            const endpoint = await req.payload.findByID({ collection: 'endpoints' as any, id: updateEndpointId });
                            if (endpoint) {
                                const { resolveEndpoint } = await import('@/lib/workflow/utils/apiResolver');
                                const resolved = await resolveEndpoint(endpoint as any, {
                                    body: {
                                        CustomerID: doc.qore_customer_id,
                                        LastName: doc.firstName,
                                        OtherNames: doc.lastName,
                                        PhoneNo: doc.phone_number,
                                        Email: doc.email,
                                        Address: doc.address || ''
                                    }
                                });
                                
                                console.log(`[Two-Way Sync] Pushing update for customer ${doc.qore_customer_id} to Qore...`);
                                const res = await fetch(resolved.url, {
                                    method: resolved.method,
                                    headers: resolved.headers,
                                    body: JSON.stringify(resolved.body)
                                });
                                if (!res.ok) console.error(`[Two-Way Sync] Failed pushing update: ${res.status} ${res.statusText}`);
                            }
                        }
                    } catch (e: any) {
                         console.error('Two-way sync boundary Error:', e.message);
                    }
                }
                return doc;
            }
        ],
        beforeChange: [
            async ({ data, req, operation }) => {
                // Automated Identity Discovery
                // We only auto-link on CREATE. On UPDATE, we only auto-link if 
                // the email is being changed and supabase_id isn't being explicitly cleared.
                const isExplicitUnlink = data.supabase_id === null;
                const shouldDiscover = operation === 'create' || 
                    (operation === 'update' && data.email && !isExplicitUnlink);

                if (shouldDiscover && data.email && !data.supabase_id) {
                    try {
                        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
                        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

                        if (supabaseUrl && supabaseServiceKey) {
                            const { createClient } = await import('@supabase/supabase-js');
                            const supabase = createClient(supabaseUrl, supabaseServiceKey);
                            
                            const { data: { users }, error } = await supabase.auth.admin.listUsers();
                            if (!error && users) {
                                const found = users.find(u => u.email === data.email);
                                if (found) {
                                    console.log(`Identity Bridge: Auto-discovered identity for ${data.email}`);
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
