import type { CollectionConfig } from 'payload'

export const Promotions: CollectionConfig = {
    slug: 'promotions',
    admin: {
        useAsTitle: 'title',
        group: 'Marketing',
        defaultColumns: ['title', 'placement', 'isActive', 'updatedAt'],
    },
    access: {
        read: () => true, // Publicly readable to display on the site
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'imageSource',
            type: 'select',
            defaultValue: 'url',
            required: true,
            options: [
                { label: 'External URL', value: 'url' },
                { label: 'Media Library', value: 'media' },
            ],
        },
        {
            name: 'mediaImage',
            type: 'upload',
            relationTo: 'media',
            label: 'Promotion Media Library Image',
            required: false,
            admin: {
                condition: (data) => data?.imageSource === 'media',
            },
        },
        {
            name: 'externalUrl',
            type: 'text',
            required: false,
            admin: {
                condition: (data) => data?.imageSource === 'url',
            },
        },
        {
            name: 'link',
            type: 'text',
            admin: {
                description: 'Optional URL to redirect users when they click the promotion',
            },
        },
        {
            name: 'isActive',
            type: 'checkbox',
            defaultValue: true,
            required: true,
        },
        {
            name: 'placement',
            type: 'select',
            required: true,
            defaultValue: 'hero',
            options: [
                { label: 'Hero Section', value: 'hero' },
                { label: 'Banner', value: 'banner' },
                { label: 'Sidebar', value: 'sidebar' },
            ],
        },
    ],
}
