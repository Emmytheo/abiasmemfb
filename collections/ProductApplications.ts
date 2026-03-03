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
                // Only attempt workflow trigger on creation, and only if the product type has a linked workflow.
                // The application record is ALWAYS saved first — the workflow is optional.
                if (operation === 'create' && doc.product_type_id) {
                    const { payload } = req

                    try {
                        const productType = await payload.findByID({
                            collection: 'product-types',
                            id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id,
                            depth: 0,
                        }).catch(() => null)

                        // Only trigger workflow if one is explicitly linked to this product type
                        if (productType?.workflow) {
                            const wfId = typeof productType.workflow === 'object' ? productType.workflow.id : productType.workflow

                            const { executeWorkflow } = await import('@/lib/workflow/executeWorkflow')
                            await executeWorkflow({
                                workflowId: wfId,
                                trigger: 'APPLICATION_SUBMIT',
                                inputData: doc
                            }).catch((e: any) => {
                                payload.logger.error(`Workflow trigger failed for app ${doc.id}: ${e.message}`)
                                // Workflow failure does NOT roll back the application — it was already saved
                            })
                        } else {
                            payload.logger.info(`Application ${doc.id} submitted for product ${doc.product_type_id} — no workflow linked, skipping trigger.`)
                        }
                    } catch (e: any) {
                        // Catch-all: never let a hook error surface to the user
                        req.payload.logger.error(`Applications afterChange hook error: ${e.message}`)
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
