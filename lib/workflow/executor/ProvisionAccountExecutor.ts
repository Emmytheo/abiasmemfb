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

        const saveProvisionError = async (msg: string) => {
            try {
                await payload.update({
                    collection: 'product-applications',
                    id: applicationId,
                    data: {
                        metadata: {
                            ...(application.metadata || {}),
                            provisioning_error: msg,
                            failed_at: new Date().toISOString()
                        }
                    } as any
                });
            } catch (err) {
                console.error("Failed to save provisioning error metadata:", err);
            }
        };

        const productType: any = application.product_type_id;
        if (!productType) {
            const errorMsg = `PROVISION_ACCOUNT: Product type missing in application ${applicationId}`;
            env.log.error(errorMsg);
            console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
            await saveProvisionError(errorMsg);
            return false;
        }

        // 2. Resolve Product Mapping
        const { docs: allMappings } = await payload.find({
            collection: 'provider-mappings' as any,
            limit: 1000,
            overrideAccess: true
        });

        const productTypeIdStr = String(productType.id);
        const mapping = allMappings.find((m: any) => {
            const relVal = typeof m.relatedEntity === 'object' && m.relatedEntity !== null
                ? (typeof m.relatedEntity.value === 'object' && m.relatedEntity.value !== null
                    ? String(m.relatedEntity.value.id)
                    : String(m.relatedEntity.value))
                : String(m.relatedEntity);
            return relVal === productTypeIdStr;
        });

        const productCode = (mapping?.externalCode || '').trim();
        // A product is local-only if it has NO product code, or explicitly set to 'LOCAL'/'NONE'.
        // A real numeric code (e.g. '10', '22') always routes through Qore.
        const isLocalOnly = !productCode 
            || productCode.toUpperCase() === 'LOCAL' 
            || productCode.toUpperCase() === 'NONE';
        
        console.log(`[ProvisionAccountExecutor] Product "${productType.name}" - Code: "${productCode}", Local-Only: ${isLocalOnly}, Mapping Found: ${!!mapping}`);

        // 3. Prepare Customer Context
        const customer = await getCustomerBySupabaseId(userId);
        if (!customer) {
            const errorMsg = `PROVISION_ACCOUNT: Customer record not found for Supabase User ID: ${userId}`;
            env.log.error(errorMsg);
            console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
            return false;
        }

        const trackingRef = `APP_${applicationId}_${Date.now()}`;
        let accountNumber = '';
        let coreCustomerId = '';

        if (isLocalOnly) {
            env.log.info(`PROVISION_ACCOUNT: Local-Only Product detected ("${productType.name}"). Bypassing core banking external API call.`);
            console.log(`[ProvisionAccountExecutor] Local-Only bypass activated (Product Code: "${productCode || 'NONE'}").`);
            
            // Generate a secure local account number: 10 + 8 random digits
            accountNumber = '10' + Math.floor(10000000 + Math.random() * 90000000);
            coreCustomerId = customer.qore_customer_id || ('L-CUST-' + Math.random().toString(36).substring(2, 8).toUpperCase());
        } else {
            env.log.info(`PROVISION_ACCOUNT: Mapped Qore Product Code resolved: ${productCode}`);
            
            // --- QORE ONLY: Resolve Endpoint from Site Settings ---
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

            // Pull submitted_data from the application form
            const submittedData: Record<string, any> = application.submitted_data || {};

            // Strip internal-only keys
            const INTERNAL_ONLY_KEYS = new Set([
                'userId', 'user_id', 'productTypeId', 'product_type_id',
                'onboarding_provisioning', 'firstName', 'lastName',
                'phone_number', 'bvn', 'nin', 'dob', 'gender',
                'address', 'email', 'status', 'workflow_stage',
            ]);
            const safeSubmittedData = Object.fromEntries(
                Object.entries(submittedData).filter(([k]) => !INTERNAL_ONLY_KEYS.has(k))
            );

            const baseData = {
                LastName:                   submittedData.LastName       || submittedData.lastName       || customer.lastName       || '',
                FirstName:                  submittedData.FirstName      || submittedData.firstName      || customer.firstName      || '',
                OtherNames:                 submittedData.OtherNames     || submittedData.otherNames     || customer.firstName      || '',
                DateOfBirth:                submittedData.DateOfBirth    || submittedData.dob            || customer.dob            || '1990-01-01',
                PhoneNo:                    submittedData.PhoneNo        || submittedData.phone_number   || customer.phone_number   || '08000000000',
                Gender:                     Number(submittedData.Gender ?? submittedData.gender ?? customer.gender ?? 0) || 0,
                BVN:                        submittedData.BVN            || submittedData.bvn            || customer.bvn            || '',
                NationalIdentityNo:         submittedData.NationalIdentityNo || submittedData.nin        || customer.nin            || '',
                Address:                    submittedData.Address        || submittedData.address        || customer.address        || '',
                Email:                      submittedData.Email          || submittedData.email          || customer.email          || '',
                TransactionTrackingRef:     trackingRef,
                AccountOpeningTrackingRef:  trackingRef,
                ProductCode:                productCode,
                ...safeSubmittedData,
            };

            // --- ACCOUNT OFFICER RESOLUTION ---
            let accountOfficerCode = submittedData.AccountOfficerCode || '';
            
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

            (baseData as any).AccountOfficerCode = accountOfficerCode;

            const provisioningData = mapping?.schemaMapping 
                ? applySchemaMapping(baseData, mapping.schemaMapping)
                : baseData;

            console.log(`[ProvisionAccountExecutor] Provisioning payload:`, JSON.stringify(provisioningData, null, 2));
            env.log.info(`PROVISION_ACCOUNT: Calling core banking with tracking ref: ${trackingRef}`);

            // 5. Execute Provisioning
            const qoreRes = await executeEndpoint(endpointId, provisioningData);
            env.log.info(`PROVISION_ACCOUNT: Core banking response success for account: ${qoreRes.accountNumber}`);

            accountNumber = qoreRes.accountNumber;
            coreCustomerId = qoreRes.customerId || qoreRes.coreCustomerId || customer.qore_customer_id || ('L-CUST-' + Math.random().toString(36).substring(2, 8).toUpperCase());
        }

        // 6. Update Customer record
        await updateCustomer(customer.id, {
            qore_customer_id: coreCustomerId,
            kyc_status: 'active',
            onboarding_status: 'completed'
        });

        // 7. Create local Account record
        // Cast relationship IDs to numbers for PostgreSQL integer FK compatibility
        const customerIdNum = typeof customer.id === 'string' && !isNaN(Number(customer.id)) ? Number(customer.id) : customer.id;
        const applicationIdNum = typeof applicationId === 'string' && !isNaN(Number(applicationId)) ? Number(applicationId) : applicationId;
        const productTypeIdNum = typeof productType.id === 'string' && !isNaN(Number(productType.id)) ? Number(productType.id) : productType.id;

        const accountType = productType.name?.toLowerCase().includes('current') 
            ? 'Current' 
            : productType.name?.toLowerCase().includes('fixed') 
                ? 'Fixed Deposit' 
                : 'Savings';

        const account = await payload.create({
            collection: 'accounts' as any,
            data: {
                user_id: userId,
                account_number: accountNumber,
                account_type: accountType as any,
                balance: 0,
                status: 'active',
                customer: customerIdNum,
                source: isLocalOnly ? 'local' : 'qore',
                is_primary: true,
                is_archived: false,
                product_type: productTypeIdNum,
                application: applicationIdNum,
            } as any
        });

        env.log.info(`PROVISION_ACCOUNT: Local account created: ${account.account_number}`);
        
        // 8. Update Application with the provisioned details
        await payload.update({
            collection: 'product-applications',
            id: applicationId,
            data: {
                workflow_stage: 'Provisioned',
                metadata: {
                    ...(application.metadata || {}),
                    provisioned_account_id: String(account.id),
                    provisioned_account_number: accountNumber,
                    provisioning_error: null,
                    completed_at: new Date().toISOString()
                }
            } as any
        });

        return true;
    } catch (e: any) {
        env.log.error(`PROVISION_ACCOUNT Failed: ${e.message}`);
        console.error(`[ProvisionAccountExecutor] Critical Error:`, e);
        try {
            await payload.update({
                collection: 'product-applications',
                id: applicationId,
                data: {
                    metadata: {
                        provisioning_error: e.message || 'Unknown account provisioning error',
                        failed_at: new Date().toISOString()
                    }
                } as any
            });
        } catch (metaErr) {
            console.error("Failed to save provisioning error in catch:", metaErr);
        }
        return false;
    }
}
