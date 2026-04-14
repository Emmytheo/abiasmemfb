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
                // 1. Workflow Trigger (Creation only)
                if (operation === 'create' && doc.product_type_id) {
                    const { payload } = req;
                    try {
                        const productType = await payload.findByID({
                            collection: 'product-types',
                            id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id,
                            depth: 0,
                        }).catch(() => null);

                        if (productType?.workflow) {
                            const wfId = typeof productType.workflow === 'object' ? productType.workflow.id : productType.workflow;
                            const { executeWorkflow } = await import('@/lib/workflow/executeWorkflow');
                            await executeWorkflow({
                                workflowId: wfId,
                                trigger: 'APPLICATION_SUBMIT',
                                inputData: doc
                            }).catch((e: any) => {
                                payload.logger.error(`Workflow trigger failed for app ${doc.id}: ${e.message}`);
                            });
                        }
                    } catch (e: any) {
                        req.payload.logger.error(`Applications afterChange Workflow hook error: ${e.message}`);
                    }
                }

                // 2. Provisioning / Enrollment Trigger
                // Trigger if it's a new approved application (Onboarding) or an existing one changed to approved (Admin)
                const isApprovedNow = doc.status === 'approved' && (operation === 'create' || previousDoc?.status !== 'approved');

                if (isApprovedNow) {
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
                                // Default product represents a standard Account.
                                // 1. Check if there's a banking integration mapping for this product type
                                const { docs: mappings } = await payload.find({
                                    collection: 'provider-mappings' as any,
                                    where: { relatedEntity: { equals: productType.id } },
                                    limit: 1,
                                    overrideAccess: true
                                });

                                if (mappings.length > 0) {
                                    // Trigger Banking Provisioning (Calls Qore API)
                                    const { ProvisionAccountExecutor } = await import('@/lib/workflow/executor/ProvisionAccountExecutor');
                                    const env: any = {
                                        payload,
                                        executionId: `PROVISION-${Date.now()}`,
                                        inputs: {
                                            user_id: doc.user_id,
                                            application_id: doc.id,
                                        },
                                        outputs: {},
                                        getInput: (key: string) => env.inputs[key],
                                        setOutput: (key: string, val: any) => { env.outputs[key] = val },
                                        log: { info: (m: string) => payload.logger.info(m), error: (m: string) => payload.logger.error(m) }
                                    };

                                    await ProvisionAccountExecutor(env).catch((e: any) => {
                                        payload.logger.error(`Account Provisioning Executor Failed: ${e.message}`);
                                    });
                                } else {
                                    // Default local fallback
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
                        }
                    } catch (e: any) {
                        req.payload.logger.error(`Hook error provisioning approved product: ${e.message}`);
                        if (e.stack) {
                            req.payload.logger.error(e.stack);
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
