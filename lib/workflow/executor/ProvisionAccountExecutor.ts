import { 
    initPayload, 
    executeEndpoint, 
    applySchemaMapping, 
    getCustomerBySupabaseId,
    updateCustomer
} from '../../api/utils/banking';
import type { ExecutionEnvironment } from '../types/executor';

/**
 * PROVISION_ACCOUNT Executor
 * 
 * Handles the communication with core banking (Qore) to create a customer
 * and an account when a product application is approved.
 */
export async function ProvisionAccountExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload;
    if (!payload) {
        env.log.error('PROVISION_ACCOUNT: No payload instance available in environment');
        return false;
    }

    const applicationId: string = env.getInput('application_id') || '';
    const userId: string = env.getInput('user_id') || '';

    if (!applicationId || !userId) {
        env.log.error('PROVISION_ACCOUNT: application_id and user_id are required');
        console.error('[ProvisionAccountExecutor] Missing ID inputs:', { applicationId, userId });
        return false;
    }

    try {
        // 1. Fetch the application
        const application = await payload.findByID({
            collection: 'product-applications',
            id: applicationId,
            depth: 2, // Populate product_type_id to get its mapping
        });

        if (!application) {
            env.log.error(`PROVISION_ACCOUNT: Application ${applicationId} not found`);
            console.error(`[ProvisionAccountExecutor] Application ${applicationId} not found`);
            return false;
        }

        const productType: any = application.product_type_id;
        if (!productType) {
            env.log.error(`PROVISION_ACCOUNT: Product type missing in application ${applicationId}`);
            console.error(`[ProvisionAccountExecutor] Product type missing in application ${applicationId}`);
            return false;
        }

        // 2. Resolve Product Mapping
        const { docs: allMappings } = await payload.find({
            collection: 'provider-mappings' as any,
            limit: 1000,
            overrideAccess: true
        });

        const mapping = allMappings.find((m: any) => 
            (typeof m.relatedEntity === 'string' ? m.relatedEntity === productType.id : (m.relatedEntity as any)?.id === productType.id)
        );

        let finalMapping = mapping;

        // --- SELF-HEALING: Auto-create mapping if missing ---
        if (!mapping) {
            console.warn(`[ProvisionAccountExecutor] Missing mapping for ${productType.name}. Attempting to auto-fix...`);
            
            const { docs: qoreProviders } = await payload.find({
                collection: 'service-providers',
                where: { slug: { equals: 'qore-digital-banking' } },
                limit: 1,
            });

            if (qoreProviders.length > 0) {
                const providerId = qoreProviders[0].id;
                finalMapping = await payload.create({
                    collection: 'provider-mappings',
                    data: {
                        internalName: `${productType.name} Auto-Mapping`,
                        provider: providerId,
                        relatedEntity: {
                            relationTo: 'product-types',
                            value: productType.id
                        },
                        externalCode: '10', // Default Qore Savings code
                    } as any
                });
                console.log(`[ProvisionAccountExecutor] SUCCESS: Auto-created mapping for ${productType.name} with code 10`);
            } else {
                const errorMsg = `PROVISION_ACCOUNT: Integration mapping missing for Product Type: ${productType.name} and no Qore provider found to auto-fix.`;
                env.log.error(errorMsg);
                console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
                return false;
            }
        }

        const productCode = finalMapping.externalCode;
        env.log.info(`PROVISION_ACCOUNT: Resolved ProductCode: ${productCode}`);
        console.log(`[ProvisionAccountExecutor] Resolved ProductCode: ${productCode}`);

        // 3. Resolve Endpoint from Site Settings
        const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
        let createAccountEndpointId = settings?.sync?.acctMgmt?.create;

        // --- SELF-HEALING: Auto-link endpoint if missing in settings ---
        if (!createAccountEndpointId) {
            console.warn(`[ProvisionAccountExecutor] Missing account creation endpoint in Site Settings. Attempting to auto-link...`);
            const { docs: endpoints } = await payload.find({
                collection: 'endpoints',
                where: { name: { contains: 'Create Account' } },
                limit: 1
            });

            if (endpoints.length > 0) {
                createAccountEndpointId = endpoints[0].id;
                await payload.updateGlobal({
                    slug: 'site-settings',
                    data: {
                        sync: {
                            ...settings.sync,
                            acctMgmt: {
                                ...settings.sync?.acctMgmt,
                                create: createAccountEndpointId
                            }
                        }
                    }
                });
                console.log(`[ProvisionAccountExecutor] SUCCESS: Auto-linked Site Settings to endpoint: ${endpoints[0].name}`);
            } else {
                const errorMsg = "PROVISION_ACCOUNT: Core account creation endpoint is not configured and no matching endpoint was found to auto-link.";
                env.log.error(errorMsg);
                console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
                return false;
            }
        }

        const endpointId = typeof createAccountEndpointId === 'object' ? createAccountEndpointId.id : createAccountEndpointId;

        // 4. Prepare Mapped Payload
        // We use data from the customer profile and the application's submitted data
        const customer = await getCustomerBySupabaseId(userId);
        if (!customer) {
            const errorMsg = `PROVISION_ACCOUNT: Customer record not found for Supabase User ID: ${userId}`;
            env.log.error(errorMsg);
            console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
            return false;
        }

        const trackingRef = `APP_${applicationId}_${Date.now()}`;
        const baseData = {
            userId: userId,
            firstName: customer.firstName,
            lastName: customer.lastName,
            email: customer.email,
            phone_number: customer.phone_number,
            bvn: customer.bvn,
            dob: customer.dob,
            gender: customer.gender,
            address: customer.address,
            TransactionTrackingRef: trackingRef,
            AccountOpeningTrackingRef: trackingRef,
            ProductCode: productCode,
            OtherNames: customer.firstName,
            PhoneNo: customer.phone_number,
            DateOfBirth: customer.dob,
            ...(application.submitted_data || {})
        };

        // --- ACCOUNT OFFICER RESOLUTION ---
        let accountOfficerCode = baseData.AccountOfficerCode || '';
        
        if (!accountOfficerCode) {
            const approverId = env.getInput('approver_id');
            if (approverId) {
                const approver = await payload.findByID({
                    collection: 'users',
                    id: approverId,
                    depth: 1
                });
                
                if (approver?.accountOfficer && typeof approver.accountOfficer === 'object') {
                    accountOfficerCode = (approver.accountOfficer as any).code;
                    console.log(`[ProvisionAccountExecutor] Resolved OfficerCode from Approver (${approver.email}): ${accountOfficerCode}`);
                }
            }
        }

        if (!accountOfficerCode) {
            accountOfficerCode = settings?.sync?.acctMgmt?.defaultAccountOfficerCode || 'TEL0001';
            console.log(`[ProvisionAccountExecutor] Using fallback OfficerCode: ${accountOfficerCode}`);
        }

        // Add to baseData for schema mapping
        (baseData as any).AccountOfficerCode = accountOfficerCode;
        // ----------------------------------

        const provisioningData = applySchemaMapping(baseData, finalMapping.schemaMapping);
        env.log.info(`PROVISION_ACCOUNT: Calling core banking with tracking ref: ${trackingRef}`);

        // 5. Execute Provisioning
        const qoreRes = await executeEndpoint(endpointId, provisioningData);
        env.log.info(`PROVISION_ACCOUNT: Core banking response success for account: ${qoreRes.accountNumber}`);

        const { accountNumber, customerId: coreCustomerId } = qoreRes;

        // 6. Update Customer record
        await updateCustomer(customer.id, {
            qore_customer_id: coreCustomerId,
            kyc_status: 'active',
            onboarding_status: 'completed'
        });

        // 7. Create local Account record
        const account = await payload.create({
            collection: 'accounts' as any,
            data: {
                user_id: userId,
                account_number: accountNumber,
                account_type: (productType.name?.toLowerCase().includes('current') ? 'Current' : productType.name?.toLowerCase().includes('fixed') ? 'Fixed Deposit' : 'Savings') as any,
                balance: 0,
                status: 'active',
                customer: customer.id,
                source: 'qore',
                is_primary: true,
                is_archived: false,
                product_type: productType.id
            } as any
        });

        env.log.info(`PROVISION_ACCOUNT: Local account created: ${account.account_number}`);
        
        // 8. Update Application with the provisioned details
        await payload.update({
            collection: 'product-applications',
            id: applicationId,
            data: {
                workflow_stage: 'Provisioned',
                // You could add the account ID or other metadata here if needed
            }
        });

        return true;
    } catch (e: any) {
        env.log.error(`PROVISION_ACCOUNT Failed: ${e.message}`);
        return false;
    }
}
