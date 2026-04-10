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
            defaultValue: 'ABIA MFB',
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
                    name: 'accountManagementEndpoints',
                    type: 'group',
                    label: 'Account Management (Core Parity)',
                    fields: [
                        { name: 'freezeEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Freeze an account.' } },
                        { name: 'unfreezeEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Unfreeze an account.' } },
                        { name: 'checkFreezeStatusEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check Freeze Status.' } },
                        { name: 'pndEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Activate PND.' } },
                        { name: 'deactivatePndEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Deactivate PND.' } },
                        { name: 'checkPndStatusEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check PND Status.' } },
                        { name: 'lienEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Place Lien.' } },
                        { name: 'unLienEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Remove Lien.' } },
                        { name: 'checkLienStatusEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Check Lien Status.' } },
                        { name: 'updateNotificationPreferenceEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Update Notification Preference.' } },
                        { name: 'generateStatementEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Generate Account Statement.' } },
                        { name: 'closeAccountEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Close Account.' } },
                        { name: 'uploadDocumentEndpoint', type: 'relationship', relationTo: 'endpoints', admin: { description: 'API to Upload Supporting Document.' } }
                    ]
                }
            ]
        }
    ],
}
