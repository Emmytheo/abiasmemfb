import type { CollectionConfig } from 'payload'

export const ProductCategories: CollectionConfig = {
    slug: 'product-categories',
    admin: {
        useAsTitle: 'name',
        group: 'Business Settings',
        defaultColumns: ['name', 'class_id', 'status'],
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
            name: 'class_id',
            type: 'relationship',
            relationTo: 'product-classes',
            required: true,
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
