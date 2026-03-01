import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
    slug: 'media',
    access: {
        // Anyone can read images to ensure global CDN availability
        read: () => true,
    },
    upload: {
        imageSizes: [
            { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
            { name: 'card', width: 768, height: 1024, position: 'centre' },
            { name: 'banner', width: 1920, height: 1080, position: 'centre' },
        ],
        adminThumbnail: 'thumbnail',
        mimeTypes: ['image/*', 'video/*', 'application/pdf'],
    },
    fields: [
        {
            name: 'alt',
            type: 'text',
            required: true,
            admin: {
                description: 'Alt text is required for accessibility and SEO',
            }
        },
    ],
}
