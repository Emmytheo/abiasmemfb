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
            async ({ doc, previousDoc, operation, req }) => {
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

                // Handle Application Approval (Admin action)
                if (operation === 'update' && doc.status === 'approved' && previousDoc?.status !== 'approved') {
                    const { payload } = req;
                    try {
                        const productType = await payload.findByID({
                            collection: 'product-types',
                            id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id,
                            depth: 0,
                        }).catch(() => null);

                        if (productType) {
                            const financialBlocks = productType.financial_terms || [];
                            const isLoanProduct = financialBlocks.some((t: any) => t.blockType === 'loan-terms');

                            if (isLoanProduct) {
                                // Trigger Loan Disbursement
                                const terms = financialBlocks.find((t: any) => t.blockType === 'loan-terms') as any;
                                const { DisburseLoanExecutor } = await import('@/lib/workflow/executor/DisburseLoanExecutor');

                                // Fetch user's primary savings account for disbursement target if it exists
                                const userAccounts = await payload.find({
                                    collection: 'accounts',
                                    where: { user_id: { equals: doc.user_id }, account_type: { equals: 'Savings' } },
                                    limit: 1
                                });
                                const accountId = userAccounts.docs[0]?.id;

                                const env: any = {
                                    payload,
                                    executionId: `DISBURSE-${Date.now()}`,
                                    inputs: {
                                        user_id: doc.user_id,
                                        account_id: accountId, // Can be null, executor handles it safely
                                        application_id: doc.id,
                                        product_type_id: productType.id,
                                        principal_naira: doc.requested_amount || 0,
                                        interest_rate: terms?.interest_rate || 0,
                                        duration_months: terms?.max_duration || 12,
                                        purpose: 'Approved Loan Disbursement'
                                    },
                                    outputs: {},
                                    getInput: (key: string) => env.inputs[key],
                                    setOutput: (key: string, val: any) => { env.outputs[key] = val },
                                    log: { info: (m: string) => payload.logger.info(m), error: (m: string) => payload.logger.error(m) }
                                };

                                await DisburseLoanExecutor(env).catch((e: any) => {
                                    payload.logger.error(`Loan Disburse Executor Failed: ${e.message}`);
                                });

                            } else {
                                // Default product represents a standard Account
                                const prefix = "30";
                                const rest = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("");
                                const accountNumber = prefix + rest;

                                await payload.create({
                                    collection: 'accounts',
                                    data: {
                                        user_id: doc.user_id,
                                        account_number: accountNumber,
                                        account_type: (productType.name?.toLowerCase().includes('current') ? 'Current' : productType.name?.toLowerCase().includes('fixed') ? 'Fixed Deposit' : 'Savings') as any,
                                        balance: (doc.requested_amount || 0) * 100, // store in kobo
                                        status: 'active',
                                    }
                                });
                            }
                        }
                    } catch (e: any) {
                        req.payload.logger.error(`Hook error provisioning approved product: ${e.message}`);
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
