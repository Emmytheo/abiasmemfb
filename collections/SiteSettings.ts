import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
    slug: 'site-settings',
    admin: {
        group: 'Global Content',
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'siteTitle',
            type: 'text',
            defaultValue: 'ABIASMEMFB',
            required: true,
        },
        {
            name: 'defaultSeoDescription',
            type: 'textarea',
        },
        {
            name: 'contactEmail',
            type: 'email',
        },
        {
            name: 'supportPhone',
            type: 'text',
        },
        {
            name: 'sync',
            type: 'group',
            admin: {
                description: 'Configuration for the Automated Customer Discovery & Sync Engine.',
            },
            fields: [
                {
                    name: 'baselineAccounts',
                    type: 'array',
                    label: 'Sync Discovery Accounts',
                    admin: { description: 'Specific core banking account numbers used as seeds for customer discovery.' },
                    fields: [{ name: 'accountNumber', type: 'text', required: true }]
                },
                {
                    name: 'autoDiscoveryEnabled',
                    type: 'checkbox',
                    label: 'Enable Automated Discovery',
                    defaultValue: true,
                },
                {
                    name: 'customerLookupEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    required: true,
                    admin: { description: 'The API endpoint used to resolve Customer data by account number.' }
                },
                {
                    name: 'accountEnquiryEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    required: true,
                    admin: { description: 'The API endpoint used to fetch detailed account/balance info.' }
                },
                {
                    name: 'customerAccountsEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to discover all secondary accounts for a customer ID.' }
                },
                {
                    name: 'productSyncEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to synchronize the Product Registry with Qore.' }
                },
                {
                    name: 'serviceSyncEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to synchronize available Services/Form Schemas.' }
                },
                {
                    name: 'customerUpdateEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to push reconciled demographic updates back to Qore (Core Banking).' }
                },
                {
                    name: 'bvnLookupEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to verify BVN/NIN details.' }
                },
                {
                    name: 'accountOfficerEndpoint',
                    type: 'relationship',
                    relationTo: 'endpoints',
                    admin: { description: 'The API endpoint used to fetch the list of Account Officers/Staff.' }
                },
                {
                    name: 'acctMgmt',
                    type: 'group',
                    label: 'Account Management (Core Parity)',
                    fields: [
                        { name: 'freeze', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Freeze an account.' } },
                        { name: 'unfreeze', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Unfreeze an account.' } },
                        { name: 'freezeStatus', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check Freeze Status.' } },
                        { name: 'pnd', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Activate PND.' } },
                        { name: 'unpnd', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Deactivate PND.' } },
                        { name: 'pndStatus', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check PND Status.' } },
                        { name: 'lien', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Place Lien.' } },
                        { name: 'unlien', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Remove Lien.' } },
                        { name: 'lienStatus', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check Lien Status.' } },
                        { name: 'notifPref', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Update Notification Preference.' } },
                        { name: 'stmt', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Generate Account Statement.' } },
                        { name: 'close', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Close Account.' } },
                        { name: 'upload', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Upload Supporting Document.' } },
                        { name: 'tier', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Update Account KYC Tier.' } },
                        { name: 'txStatus', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Query Transaction Status.' } },
                        { name: 'create', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Create Account Quick (Onboarding).' } },
                        { name: 'defaultAccountOfficerCode', type: 'text', defaultValue: 'TEL0001', admin: { description: 'Primary fallback staff code for automated account creation (e.g. TEL0001).' } }
                    ]
                }
            ]
        }
    ],
}
