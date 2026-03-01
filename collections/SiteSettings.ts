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
    ],
}
