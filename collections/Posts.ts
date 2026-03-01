import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
    slug: 'posts',
    admin: {
        useAsTitle: 'title',
        group: 'Blog',
        defaultColumns: ['title', 'category', 'updatedAt'],
        description: 'Write and publish blog articles.',
    },
    access: {
        read: () => true,
    },
    versions: {
        drafts: true,
    },
    fields: [
        // Tabs keep Content front-and-center regardless of SEO plugin layout
        {
            type: 'tabs',
            tabs: [
                {
                    label: 'Content',
                    fields: [
                        {
                            name: 'title',
                            type: 'text',
                            required: true,
                            admin: {
                                placeholder: 'Enter post title...',
                            },
                        },
                        {
                            name: 'excerpt',
                            type: 'textarea',
                            admin: {
                                placeholder: 'A short summary shown on listing cards and used for SEO description...',
                                rows: 3,
                            },
                        },
                        {
                            name: 'content',
                            type: 'richText',
                            required: true,
                            admin: {
                                description: 'Write your post content here. Use the toolbar above or type / for blocks.',
                            },
                        },
                    ],
                },
                {
                    label: 'Meta & Media',
                    fields: [
                        {
                            name: 'slug',
                            type: 'text',
                            unique: true,
                            required: true,
                            admin: {
                                placeholder: 'post-url-slug',
                                description: 'The URL path: /blog/{slug}',
                            },
                        },
                        {
                            name: 'featuredImage',
                            type: 'upload',
                            relationTo: 'media',
                            admin: {
                                description: 'Cover image shown at the top of the post and on listing cards.',
                            },
                        },
                        {
                            name: 'author',
                            type: 'relationship',
                            relationTo: 'users',
                            hasMany: false,
                        },
                        {
                            name: 'category',
                            type: 'relationship',
                            relationTo: 'categories',
                            hasMany: false,
                        },
                        {
                            name: 'tags',
                            type: 'relationship',
                            relationTo: 'tags',
                            hasMany: true,
                        },
                    ],
                },
            ],
        },
    ],
}
