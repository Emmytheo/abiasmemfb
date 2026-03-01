import { CollectionConfig } from 'payload'

export const ProductApplications: CollectionConfig = {
    slug: 'product-applications',
    admin: {
        useAsTitle: 'id',
        defaultColumns: ['user_id', 'product_type_id', 'status', 'workflow_stage', 'createdAt'],
        group: 'Product Management',
    },
    access: {
        read: () => true,
        create: () => true,
        update: () => true,
        delete: () => true,
    },
    hooks: {
        afterChange: [
            async ({ doc, operation, req }) => {
                if (operation === 'create' && doc.product_type_id) {
                    const { payload } = req
                    const productType = await payload.findByID({
                        collection: 'product-types',
                        id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id
                    }).catch(() => null)

                    if (productType?.workflow) {
                        const wfId = typeof productType.workflow === 'object' ? productType.workflow.id : productType.workflow

                        // Dynamically import engine to prevent boot issues
                        const { executeWorkflow } = await import('@/lib/workflow/executeWorkflow')

                        try {
                            await executeWorkflow({
                                workflowId: wfId,
                                trigger: 'APPLICATION_SUBMIT',
                                inputData: doc
                            })
                            // We don't block the hook on completion, it runs async
                        } catch (e: any) {
                            payload.logger.error(`Workflow trigger failed for app ${doc.id}: ${e.message}`)
                        }
                    }
                }
                return doc
            }
        ]
    },
    fields: [
        {
            name: 'user_id',
            type: 'text',
            required: true,
            admin: {
                description: 'The Supabase user ID who submitted this application.'
            }
        },
        {
            name: 'product_type_id',
            type: 'relationship',
            relationTo: 'product-types',
            required: true,
            admin: {
                description: 'The product being applied for.'
            }
        },
        {
            name: 'status',
            type: 'select',
            required: true,
            defaultValue: 'pending',
            options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Under Review', value: 'under_review' },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
            ],
        },
        {
            name: 'workflow_stage',
            type: 'text',
            required: true,
            defaultValue: 'Submitted',
            admin: {
                description: 'The current stage in the product\'s specific workflow.'
            }
        },
        {
            name: 'requested_amount',
            type: 'number',
        },
        {
            name: 'submitted_data',
            type: 'json',
            required: true,
            defaultValue: {},
            admin: {
                description: 'The JSON snapshot of the application form filled by the user.'
            }
        },
    ],
}
