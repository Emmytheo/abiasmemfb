import type { Block } from 'payload'

export const FeaturesBlock: Block = {
    slug: 'features',
    labels: { singular: 'Features Grid', plural: 'Features Grids' },
    fields: [
        {
            name: 'tagline',
            type: 'text',
        },
        {
            name: 'headline',
            type: 'text',
            required: true,
        },
        {
            name: 'features',
            type: 'array',
            minRows: 1,
            fields: [
                {
                    name: 'icon',
                    type: 'text',
                    admin: { description: 'Lucide Icon Name (e.g., DollarSign, TrendingUp, Smartphone)' },
                },
                {
                    name: 'title',
                    type: 'text',
                    required: true,
                },
                {
                    name: 'description',
                    type: 'textarea',
                },
            ],
        },
    ],
}
