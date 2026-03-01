import type { Block } from 'payload'

export const HeroBlock: Block = {
    slug: 'hero',
    labels: { singular: 'Hero Section', plural: 'Hero Sections' },
    fields: [
        {
            name: 'badgeText',
            type: 'text',
            defaultValue: 'Building Tomorrow, Today',
        },
        {
            name: 'headline',
            type: 'text',
            required: true,
        },
        {
            name: 'subheadline',
            type: 'textarea',
        },
        {
            name: 'backgroundImage',
            type: 'upload',
            relationTo: 'media',
        },
        {
            name: 'primaryCta',
            type: 'group',
            fields: [
                { name: 'label', type: 'text' },
                { name: 'url', type: 'text' },
            ],
        },
        {
            name: 'secondaryCta',
            type: 'group',
            fields: [
                { name: 'label', type: 'text' },
                { name: 'url', type: 'text' },
            ],
        },
    ],
}
