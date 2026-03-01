import type { CollectionConfig } from 'payload'
import { HeroBlock } from './blocks/HeroBlock'
import { FeaturesBlock } from './blocks/FeaturesBlock'

export const Pages: CollectionConfig = {
    slug: 'pages',
    admin: {
        useAsTitle: 'title',
        group: 'Global Content',
        defaultColumns: ['title', 'slug', 'updatedAt'],
    },
    access: {
        read: () => true,
    },
    versions: {
        drafts: true,
    },
    fields: [
        {
            name: 'title',
            type: 'text',
            required: true,
        },
        {
            name: 'slug',
            type: 'text',
            required: true,
            unique: true,
            index: true,
            admin: {
                position: 'sidebar',
            },
        },
        {
            name: 'layout',
            type: 'blocks',
            required: true,
            minRows: 1,
            blocks: [
                HeroBlock,
                FeaturesBlock,
            ],
        },
    ],
}
