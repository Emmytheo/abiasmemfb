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

        if (!mapping) {
            const errorMsg = `PROVISION_ACCOUNT: Integration mapping missing for Product Type: ${productType.name}`;
            env.log.error(errorMsg);
            console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
            return false;
        }

        const productCode = mapping.externalCode;
        env.log.info(`PROVISION_ACCOUNT: Resolved ProductCode: ${productCode}`);
        console.log(`[ProvisionAccountExecutor] Resolved ProductCode: ${productCode}`);

        // 3. Resolve Endpoint from Site Settings
        const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
        const createAccountEndpointId = settings?.sync?.acctMgmt?.create;

        if (!createAccountEndpointId) {
            const errorMsg = "PROVISION_ACCOUNT: Core account creation endpoint is not configured in Site Settings.";
            env.log.error(errorMsg);
            console.error(`[ProvisionAccountExecutor] ${errorMsg}`);
            return false;
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

        const provisioningData = applySchemaMapping(baseData, mapping.schemaMapping);
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
