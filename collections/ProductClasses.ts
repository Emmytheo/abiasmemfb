import type { CollectionConfig } from 'payload'

export const ProductClasses: CollectionConfig = {
    slug: 'product-classes',
    admin: {
        useAsTitle: 'name',
        group: 'Business Settings',
        defaultColumns: ['name', 'status', 'created_at'],
    },
    access: {
        read: () => true,
    },
    fields: [
        {
            name: 'name',
            type: 'text',
            required: true,
            unique: true,
        },
        {
            name: 'description',
            type: 'textarea',
        },
        {
            name: 'status',
            type: 'select',
            options: ['active', 'inactive'],
            defaultValue: 'active',
            required: true,
        },
    ],
}
