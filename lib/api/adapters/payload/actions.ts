"use server";

import { createClient } from '@supabase/supabase-js';
import { 
    User, 
    Account, 
    Customer, 
    Loan, 
    ProductType, 
    ProductClass, 
    ProductCategory, 
    ProductApplication, 
    Transaction, 
    SystemConfig, 
    BlogPost, 
    JobPosition, 
    ServiceCategory, 
    Service, 
    Beneficiary, 
    SiteSettings, 
    CustomerAudit,
    AccountOfficer
} from '../../types';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { revalidatePath } from 'next/cache';
import { lexicalToHtml } from '@/lib/utils/lexical-to-html';
import { executeWorkflow } from '@/lib/workflow/executeWorkflow';
import { FundAccountExecutor } from '@/lib/workflow/executor/FundAccountExecutor';
import { getPayloadClient } from '@/lib/payload';
import { 
    initPayload as bankingInitPayload, 
    executeEndpoint as bankingExecuteEndpoint, 
    applySchemaMapping as bankingApplySchemaMapping, 
    getCustomerBySupabaseId as bankingGetCustomerBySupabaseId, 
    updateCustomer as bankingUpdateCustomer 
} from '../../utils/banking';

// Internal aliases for use within this file
const initPayload = bankingInitPayload;
const executeEndpoint = bankingExecuteEndpoint;
const applySchemaMapping = bankingApplySchemaMapping;

// Explicitly export async server actions
export const getCustomerBySupabaseId = async (supabaseId: string) => bankingGetCustomerBySupabaseId(supabaseId);
export const updateCustomer = async (id: string, data: any) => bankingUpdateCustomer(id, data);



// ==========================================
// USER MANAGEMENT
// ==========================================

export const getCurrentUser = async (): Promise<User | null> => null;

export const getAllUsers = async (): Promise<User[]> => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase configuration.");
            return [];
        }
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
        );
        const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
        if (error) throw error;
        return users.map(u => ({
            id: u.id,
            email: u.email || '',
            full_name: u.user_metadata?.full_name || u.email?.split('@')[0] || 'Unknown User',
            role: (u.user_metadata?.role as any) || 'customer',
            created_at: u.created_at,
        }));
    } catch (e) {
        console.error("Supabase Admin getAllUsers Error:", e);
        return [];
    }
};

// ==========================================
// CUSTOMER MANAGEMENT
// ==========================================

export const getAllCustomers = async (): Promise<Customer[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'customers' as any,
            limit: 1000,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            firstName: doc.firstName,
            lastName: doc.lastName,
            email: doc.email,
            phone_number: doc.phone_number,
            bvn: doc.bvn,
            qore_customer_id: doc.qore_customer_id,
            supabase_id: doc.supabase_id,
            kyc_status: doc.kyc_status,
            risk_tier: doc.risk_tier,
            is_associated: doc.is_associated,
            is_test_account: doc.is_test_account,
            is_archived: doc.is_archived || false,
            merger_status: doc.merger_status as any,
            address: doc.address,
            dob: doc.dob,
            gender: doc.gender,
            metadata: doc.metadata,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as Customer)) as Customer[];
    } catch (e) {
        console.error('Payload getAllCustomers Error:', e);
        return [];
    }
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ 
            collection: 'customers' as any, 
            id, 
            overrideAccess: true 
        });
        if (!doc) return null;
        return {
            ...doc,
            id: String(doc.id),
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as any;
    } catch (e) {
        console.error('Payload getCustomerById Error:', e);
        return null;
    }
};


export const saveOnboardingDraft = async (data: Partial<Customer> & { userId: string }): Promise<Customer> => {
    try {
        console.log(`[Adapter][Draft] Saving onboarding draft for user ${data.userId}:`, JSON.stringify(data, null, 2));
        const payload = await initPayload();
        const existing = await getCustomerBySupabaseId(data.userId);

        if (existing) {
            const updated = await updateCustomer(existing.id, {
                ...data,
                kyc_status: existing.kyc_status === 'active' ? 'active' : 'pending'
            });
            revalidatePath('/onboarding');
            revalidatePath('/client-dashboard');
            revalidatePath('/');
            return updated;
        }

        const newDoc = await payload.create({
            collection: 'customers' as any,
            data: {
                ...data,
                supabase_id: data.userId,
                kyc_status: 'pending',
                risk_tier: 'low',
                onboarding_status: 'pending',
                is_associated: true,
                is_archived: false,
                is_test_account: false,
            } as any,
            overrideAccess: true,
        });

        revalidatePath('/onboarding');
        revalidatePath('/client-dashboard');
        revalidatePath('/');

        return {
            ...newDoc,
            id: String(newDoc.id),
        } as any;
    } catch (e) {
        console.error('Payload saveOnboardingDraft Error:', e);
        throw e;
    }
};

export const syncBankingIdentity = async (userId: string): Promise<{ success: boolean; message: string }> => {
    try {
        const customer = await getCustomerBySupabaseId(userId);
        if (!customer) return { success: false, message: 'Banking profile not found for this identity.' };
        if (!customer.qore_customer_id) return { success: false, message: 'Identity found, but not yet linked to a core banking record. Please contact branch.' };
        
        await refreshCustomerLedger(customer.id);
        return { success: true, message: 'Banking ledger synchronized successfully.' };
    } catch (e: any) {
        return { success: false, message: e.message || 'Synchronization failed.' };
    }
};

export const restoreCustomerIdentity = async (customerId: string, supabaseId: string, email: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.update({
            collection: 'customers',
            id: customerId,
            data: {
                is_archived: false,
                email: email,
                supabase_id: supabaseId,
                is_associated: true,
                kyc_status: 'active'
            }
        });
        return true;
    } catch (e) {
        console.error('Payload restoreCustomerIdentity Error:', e);
        return false;
    }
};


export const getCustomerAudit = async (id: string): Promise<CustomerAudit> => {
    try {
        const payload = await initPayload();
        const customer = await payload.findByID({ collection: 'customers', id });
        const supabaseId = customer.supabase_id;
        const [accounts, loans, applications] = await Promise.all([
            payload.find({ collection: 'accounts', where: { customer: { equals: id } }, limit: 100, overrideAccess: true }),
            payload.find({ collection: 'loans', where: { customer: { equals: id } }, limit: 100, overrideAccess: true }),
            (supabaseId && !customer.is_archived) ? payload.find({ collection: 'product-applications', where: { user_id: { equals: supabaseId } }, limit: 100, overrideAccess: true }) : { totalDocs: 0 }
        ]);
        return {
            accounts: accounts.totalDocs,
            loans: loans.totalDocs,
            applications: ('totalDocs' in applications) ? applications.totalDocs : 0,
            beneficiaries: 0,
            financialData: { 
                accounts: accounts.docs.map((doc: any) => ({
                    id: String(doc.id),
                    account_number: doc.account_number,
                    account_type: doc.account_type,
                    balance: (doc.balance ?? 0) / 100,
                    status: doc.status,
                    created_at: doc.createdAt
                })) as any, 
                loans: loans.docs.map((doc: any) => ({
                    id: String(doc.id),
                    amount: (doc.amount ?? 0) / 100,
                    duration_months: doc.duration_months,
                    status: doc.status,
                    created_at: doc.createdAt
                })) as any 
            }
        };
    } catch (e) {
        return { accounts: 0, loans: 0, applications: 0, beneficiaries: 0, financialData: { accounts: [], loans: [] } };
    }
};

export const deleteCustomer = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'customers', id, overrideAccess: true });
        return true;
    } catch (e) { return false; }
};

// ==========================================
// BANKING (ACCOUNTS, LOANS)
// ==========================================

export const getAllAccounts = async (): Promise<Account[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'accounts' as any, depth: 1, limit: 1000, sort: '-createdAt', overrideAccess: true });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            account_number: doc.account_number,
            account_type: doc.account_type,
            balance: (doc.balance ?? 0) / 100,
            status: doc.status,
            customer: doc.customer,
            is_frozen: doc.is_frozen,
            pnd_enabled: doc.pnd_enabled,
            lien_amount: (doc.lien_amount ?? 0) / 100,
            source: doc.source || 'local',
            created_at: doc.createdAt,
        })) as Account[];
    } catch (e) { return []; }
};

export const getUserAccounts = async (userId: string): Promise<Account[]> => {
    try {
        const payload = await initPayload();
        // Strict matching: Match by user_id OR customer relation, but only for active digital identities
        const { docs: users } = await payload.find({ collection: 'users', where: { supabase_id: { equals: userId } }, limit: 1 });
        
        const { docs: customers } = await payload.find({ 
            collection: 'customers', 
            where: { supabase_id: { equals: userId } }, 
            limit: 100 
        });
        const customerIds = customers.map((c: any) => c.id);
        const customerEmails = customers.map((c: any) => c.email).filter(Boolean);

        const { docs } = await payload.find({
            collection: 'accounts' as any,
            where: { 
                or: [
                    { user_id: { equals: userId } }, 
                    ...(customerIds.length > 0 ? [{ customer: { in: customerIds } }] : [])
                ] 
            },
            depth: 2,
            limit: 100,
            sort: '-createdAt',
            overrideAccess: true,
        });

        // Hardened filter: confirm strictly linked or matched by BVN/Email if archived
        return docs.filter((doc: any) => {
            if (doc.user_id === userId) return true;
            const docCustomer = typeof doc.customer === 'object' ? doc.customer : null;
            if (!docCustomer) return false;
            // If the customer is archived, we MUST verify the email or BVN matches the Supabase identity profile
            if (docCustomer.is_archived && docCustomer.email && !customerEmails.includes(docCustomer.email)) return false;
            return true;
        }).map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id || userId,
            account_number: doc.account_number,
            account_name: doc.account_name,
            account_type: doc.account_type || 'Savings',
            balance: (doc.balance ?? 0) / 100,
            status: doc.status || 'active',
            is_frozen: doc.is_frozen || false,
            pnd_enabled: doc.pnd_enabled || false,
            lien_amount: (doc.lien_amount ?? 0) / 100,
            source: doc.source || 'local',
            is_primary: doc.is_primary || false,
            is_archived: doc.is_archived || false,
            created_at: doc.createdAt || new Date().toISOString(),
            customer: doc.customer
        })) as Account[];
    } catch (e) { 
        console.error("[Payload] getUserAccounts Error:", e);
        return []; 
    }
};

export const getAccountById = async (id: string): Promise<Account | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ collection: 'accounts' as any, id, overrideAccess: true });
        if (!doc) return null;
        return {
            id: String(doc.id),
            user_id: doc.user_id,
            account_number: doc.account_number,
            account_type: doc.account_type,
            balance: (doc.balance ?? 0) / 100,
            status: doc.status,
            customer: (doc as any).customer,
            is_frozen: (doc as any).is_frozen,
            pnd_enabled: (doc as any).pnd_enabled,
            lien_amount: ((doc as any).lien_amount ?? 0) / 100,
            source: (doc as any).source || 'local',
            created_at: doc.createdAt,
        } as Account;
    } catch (e) { return null; }
};

export const createAccount = async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'accounts' as any, data: { user_id: data.user_id, account_number: data.account_number, account_type: data.account_type, balance: Math.round(data.balance * 100), status: data.status, customer: data.customer } as any });
    return { id: String(doc.id), account_number: (doc as any).account_number } as any;
};

export const updateAccount = async (id: string, data: Partial<Account>): Promise<Account> => {
    const payload = await initPayload();
    const existing = await payload.findByID({ collection: 'accounts' as any, id, depth: 1 });
    
    // External Parity Orchestration
    if (existing.external_status === 'core_synced' || existing.is_mirrored) {
        try {
            const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
            const sync = settings?.sync;
            
            // Handle FREEZE orchestration
            if ('is_frozen' in data && data.is_frozen !== existing.is_frozen) {
                const endpointId = data.is_frozen ? sync?.acctMgmt?.freeze : sync?.acctMgmt?.unfreeze;
                if (endpointId) {
                    console.log(`[Sync] Triggering External ${data.is_frozen ? 'Freeze' : 'Unfreeze'} for ${existing.account_number}`);
                    await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
                        AccountNo: existing.account_number,
                        Reason: "Dashboard Action",
                        ReferenceID: `DASH_${Date.now()}`
                    });
                }
            }

            // Handle PND orchestration
            if ('pnd_enabled' in data && data.pnd_enabled !== existing.pnd_enabled) {
                const endpointId = data.pnd_enabled ? sync?.acctMgmt?.pnd : sync?.acctMgmt?.unpnd;
                if (endpointId) {
                    console.log(`[Sync] Triggering External PND ${data.pnd_enabled ? 'Activation' : 'Deactivation'} for ${existing.account_number}`);
                    await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
                        AccountNo: existing.account_number
                    });
                }
            }

            // Handle LIEN orchestration
            if ('lien_amount' in data && data.lien_amount !== existing.lien_amount) {
                const endpointId = sync?.acctMgmt?.lien;
                if (endpointId) {
                    const diff = (data.lien_amount || 0) * 100;
                    console.log(`[Sync] Triggering External Lien update for ${existing.account_number}: ${diff} kobo`);
                    await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
                        AccountNo: existing.account_number,
                        Amount: String(diff),
                        ReferenceID: `LIEN_${Date.now()}`
                    });
                }
            }

            // Handle TIER orchestration
            if ('tier' in data && data.tier !== existing.tier) {
                const endpointId = sync?.acctMgmt?.tier;
                if (endpointId) {
                    console.log(`[Sync] Triggering External Tier Upgrade for ${existing.account_number} to ${data.tier}`);
                    await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
                        AccountNo: existing.account_number,
                        AccountTier: String(data.tier)
                    });
                }
            }
        } catch (syncError: any) {
            console.error(`[Sync] External Management Error:`, syncError.message);
            throw new Error(`External sync failed: ${syncError.message}`);
        }
    }

    const doc = await payload.update({ 
        collection: 'accounts' as any, 
        id, 
        data: { 
            ...data, 
            balance: data.balance ? Math.round(data.balance * 100) : undefined,
            lien_amount: data.lien_amount !== undefined ? Math.round(data.lien_amount * 100) : undefined
        } as any 
    });
    return { id: String(doc.id) } as any;
};

// ==========================================
// ADVANCED ACCOUNT MANAGEMENT (CORE)
// ==========================================

export const checkExternalAccountStatus = async (accountNumber: string, statusType: 'freeze' | 'pnd' | 'lien'): Promise<any> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    
    let endpointId;
    switch (statusType) {
        case 'freeze': endpointId = settings?.sync?.acctMgmt?.freezeStatus; break;
        case 'pnd': endpointId = settings?.sync?.acctMgmt?.pndStatus; break;
        case 'lien': endpointId = settings?.sync?.acctMgmt?.lienStatus; break;
    }

    if (!endpointId) throw new Error(`Status configuration missing for ${statusType}`);
    
    return executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        AccountNo: accountNumber
    });
};

export const generateAccountStatement = async (accountNumber: string, fromDate: string, toDate: string): Promise<{ statementBase64: string, fileName: string }> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.stmt;
    
    if (!endpointId) throw new Error("Statement generation endpoint is not configured.");

    const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        accountNumber,
        fromDate,
        toDate
    });
    
    return {
        statementBase64: res?.Payload?.StatementBase64 || '',
        fileName: res?.Payload?.FileName || 'statement.pdf'
    };
};

export const uploadSupportingDocument = async (accountNumber: string, documentType: number, base64Image: string): Promise<boolean> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.upload;
    
    if (!endpointId) throw new Error("Document upload endpoint is not configured.");

    const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        AccountNumber: accountNumber,
        DocumentType: documentType,
        Image: base64Image
    });
    
    return res?.IsSuccessful === true;
};

export const closeExternalAccount = async (accountNumber: string, narration: string): Promise<boolean> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.close;
    
    if (!endpointId) throw new Error("Account closure endpoint is not configured.");

    const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        accountNumber,
        narration
    });
    
    return res?.IsSuccessful === true;
};

export const updateNotificationPreference = async (accountNumber: string, preferenceCode: number): Promise<boolean> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.notifPref;
    
    if (!endpointId) throw new Error("Notification preference endpoint is not configured.");

    const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        AccountNumber: accountNumber,
        NotificationPreference: preferenceCode
    });
    
    return res?.IsSuccessful === true;
};

export const updateExternalAccountTier = async (accountNumber: string, tier: string): Promise<boolean> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.tier;
    
    if (!endpointId) throw new Error("Account tier update endpoint is not configured.");

    const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        AccountNo: accountNumber,
        AccountTier: tier
    });
    
    return res?.IsSuccessful === true;
};

export const queryExternalTransactionStatus = async (referenceId: string): Promise<any> => {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.txStatus;
    
    if (!endpointId) throw new Error("Transaction status query endpoint is not configured.");

    return executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
        TransactionReference: referenceId
    });
};

export const verifyCustomerBVN = async (bvn: string): Promise<any> => {
    console.log(`[Identity] Initiating BVN verification for: ${bvn.slice(0, 3)}...${bvn.slice(-4)}`);
    const payload = await initPayload();
    
    // 1. Resolve Endpoint & Mapping
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.bvnLookupEndpoint;
    if (!endpointId) throw new Error("BVN verification endpoint is not configured.");

    const id = typeof endpointId === 'object' ? endpointId.id : endpointId;
    const endpoint = await payload.findByID({ collection: 'endpoints', id });

    // Hotfix: The BVN endpoint often returns nested bvnDetails. If the mapping is flat, fix it.
    if (endpoint.responseSchema?.outputs?.firstName === 'FirstName') {
        console.warn(`[Identity][Hotfix] Mapping for "${endpoint.name}" is flat but response is nested. Updating mapping...`);
        await payload.update({
            collection: 'endpoints',
            id: endpoint.id,
            data: {
                responseSchema: {
                    ...endpoint.responseSchema,
                    outputs: {
                        "bvn": "bvnDetails.BVN",
                        "lastName": "bvnDetails.LastName",
                        "firstName": "bvnDetails.FirstName",
                        "dob": "bvnDetails.DOB",
                        "responseMessage": "ResponseMessage"
                    }
                }
            }
        });
        // Clear cache by re-fetching
        return verifyCustomerBVN(bvn);
    }
    
    // Resolve Provider ID safely
    const providerId = typeof endpoint.provider === 'object' ? endpoint.provider.id : endpoint.provider;

    // Find provider mapping for this provider and "BVN Registry" or similar
    // For now, identity verification is simpler, but we should still check for mappings
    const { docs: mappings } = await payload.find({
        collection: 'provider-mappings' as any,
        where: { provider: { equals: providerId } },
        limit: 100,
        overrideAccess: true
    });
    
    const mapping = mappings.find((m: any) => m.internalName.toLowerCase().includes('identity') || m.internalName.toLowerCase().includes('bvn'));

    // 2. Map and Execute
    const inputData = { BVN: bvn };
    const mappedData = mapping ? applySchemaMapping(inputData, mapping.schemaMapping) : inputData;

    console.log(`[Identity] Using mapping: ${mapping?.internalName || 'None (Default)'}`);

    return executeEndpoint(id, mappedData, {
        authOverride: 'BODY_FIELD',
        authBodyFieldKey: 'Token'
    });
};

export const verifyIdentity = verifyCustomerBVN;

// ==========================================
// ACCOUNT OFFICERS
// ==========================================

export const getAllAccountOfficers = async (): Promise<AccountOfficer[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'account-officers' as any,
            limit: 1000,
            sort: 'name',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            code: doc.code,
            branch: doc.branch,
            gender: doc.gender,
            phone: doc.phone,
            email: doc.email,
            linked_user_id: typeof doc.linked_user === 'object' ? doc.linked_user?.id : doc.linked_user,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as AccountOfficer));
    } catch (e) {
        console.error('Payload getAllAccountOfficers Error:', e);
        return [];
    }
};

export const linkOfficerToUser = async (officerId: string, userId: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        
        // 1. Link the officer record to the user
        await payload.update({
            collection: 'account-officers' as any,
            id: officerId,
            data: {
                linked_user: userId
            } as any,
            overrideAccess: true,
        });

        // 2. Link the user record back to the officer (for fast resolution during provisioning)
        await payload.update({
            collection: 'users' as any,
            id: userId,
            data: {
                accountOfficer: officerId
            } as any,
            overrideAccess: true,
        });

        revalidatePath('/account-officers');
        revalidatePath('/dashboard');
        return true;
    } catch (e) {
        console.error('Payload linkOfficerToUser Error:', e);
        return false;
    }
};

export const createCoreBankingProfile = async (data: { 
    userId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone_number: string;
    bvn: string;
    dob: string;
    gender: number;
    address: string;
    productTypeId: string | number;
}): Promise<any> => {
    const payload = await initPayload();
    
    console.log(`[Adapter][Provision] Initiating unified application flow for user: ${data.userId}`);

    // Ensure productTypeId is a number if the DB expects int4
    const pid = typeof data.productTypeId === 'string' && !isNaN(Number(data.productTypeId)) 
        ? Number(data.productTypeId) 
        : data.productTypeId;

    // Create a Product Application record
    const application = await payload.create({
        collection: 'product-applications',
        data: {
            user_id: data.userId,
            product_type_id: pid,
            status: 'approved',
            workflow_stage: 'Auto-Approved (Onboarding)',
            submitted_data: {
                ...data,
                onboarding_provisioning: true
            }
        }
    });

    console.log(`[Adapter][Provision] Created application ${application.id}. Provisioning will proceed via workflow hooks.`);
    
    revalidatePath('/onboarding');
    revalidatePath('/client-dashboard');
    revalidatePath('/');

    return {
        success: true,
        applicationId: application.id,
        message: "Account application submitted and auto-approved. Your account is being provisioned."
    };
};

export const skipOnboarding = async (userId: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        const customer = await getCustomerBySupabaseId(userId);
        
        if (!customer) {
            await payload.create({
                collection: 'customers' as any,
                data: {
                    supabase_id: userId,
                    onboarding_status: 'skipped',
                    email: '',
                    firstName: 'User',
                    lastName: '',
                    kyc_status: 'pending',
                    is_associated: true
                } as any
            });
        } else {
            await payload.update({
                collection: 'customers' as any,
                id: customer.id,
                data: {
                    onboarding_status: 'skipped',
                    is_associated: true
                } as any
            });
        }

        revalidatePath('/onboarding');
        revalidatePath('/client-dashboard');
        revalidatePath('/');
        return true;
    } catch (e) {
        console.error('skipOnboarding error:', e);
        return false;
    }
};

export const getAllLoans = async (): Promise<Loan[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'loans' as any, depth: 1, limit: 1000, sort: '-createdAt', overrideAccess: true });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type === 'object' ? doc.product_type?.id : doc.product_type,
            amount: (doc.principal ?? 0) / 100,
            interest_rate: doc.interest_rate ?? 0,
            duration_months: doc.duration_months ?? 0,
            outstanding_balance: (doc.outstanding_balance ?? 0) / 100,
            monthly_installment: (doc.monthly_installment ?? 0) / 100,
            next_payment_date: doc.next_payment_date,
            maturity_date: doc.maturity_date,
            status: doc.status || 'pending',
            created_at: doc.createdAt,
            customer: doc.customer
        })) as Loan[];
    } catch (e) { return []; }
};

export const getUserLoans = async (userId: string): Promise<Loan[]> => {
    try {
        const payload = await initPayload();
        // Strict Match: Exclude archived customers from fuzzy matching
        const { docs: customers } = await payload.find({ 
            collection: 'customers', 
            where: { 
                and: [
                    { is_archived: { not_equals: true } },
                    { or: [{ supabase_id: { equals: userId } }, { email: { equals: userId } }] }
                ]
            }, 
            limit: 1 
        });
        const customerId = customers.length > 0 ? customers[0].id : null;
        const { docs } = await payload.find({
            collection: 'loans' as any,
            where: { or: [{ user_id: { equals: userId } }, ...(customerId ? [{ customer: { equals: customerId } }] : [])] },
            depth: 2,
            limit: 100,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type === 'object' ? (doc.product_type as any)?.id : doc.product_type,
            amount: (doc.principal ?? 0) / 100,
            interest_rate: doc.interest_rate ?? 0,
            duration_months: doc.duration_months ?? 0,
            outstanding_balance: (doc.outstanding_balance ?? 0) / 100,
            monthly_installment: (doc.monthly_installment ?? 0) / 100,
            next_payment_date: doc.next_payment_date,
            maturity_date: doc.maturity_date,
            status: doc.status || 'pending',
            created_at: doc.createdAt,
            customer: doc.customer
        })) as Loan[];
    } catch (e) { return []; }
};

export const getLoanById = async (id: string): Promise<Loan | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ collection: 'loans' as any, id, depth: 1 });
        return {
            id: String(doc.id),
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type === 'object' ? doc.product_type?.id : doc.product_type,
            amount: (doc.principal ?? 0) / 100,
            interest_rate: doc.interest_rate ?? 0,
            duration_months: doc.duration_months ?? 0,
            outstanding_balance: (doc.outstanding_balance ?? 0) / 100,
            monthly_installment: (doc.monthly_installment ?? 0) / 100,
            next_payment_date: doc.next_payment_date,
            maturity_date: doc.maturity_date,
            status: doc.status || 'pending',
            created_at: doc.createdAt,
            customer: doc.customer
        } as Loan;
    } catch (e) { return null; }
};

export const createLoan = async (data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>): Promise<Loan> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'loans' as any, data: { user_id: data.user_id, product_type: data.product_type_id, principal: Math.round(data.amount * 100), interest_rate: data.interest_rate, duration_months: data.duration_months, outstanding_balance: Math.round((data.outstanding_balance ?? 0) * 100), monthly_installment: Math.round((data.monthly_installment ?? 0) * 100), next_payment_date: data.next_payment_date, maturity_date: data.maturity_date, status: data.status, customer: data.customer } as any });
    return { id: String(doc.id), amount: (doc as any).principal / 100 } as any;
};

// ==========================================
// BENEFICIARIES
// ==========================================

export const getUserBeneficiaries = async (userId: string): Promise<Beneficiary[]> => {
    try {
        const payload = await initPayload();
        const { docs: users } = await payload.find({ collection: 'users', where: { supabase_id: { equals: userId } }, limit: 1 });
        if (!users.length) return [];
        const { docs } = await payload.find({ collection: 'beneficiaries' as any, where: { user: { equals: users[0].id } }, overrideAccess: true });
        return docs.map((doc: any) => ({ id: doc.id, account_name: doc.account_name, account_number: doc.account_number })) as any;
    } catch (e) { return []; }
};

export const saveBeneficiary = async (data: Omit<Beneficiary, 'id' | 'created_at' | 'updated_at'>): Promise<Beneficiary> => {
    const payload = await initPayload();
    const { docs: users } = await payload.find({ collection: 'users', where: { supabase_id: { equals: data.user } }, limit: 1 });
    if (!users.length) throw new Error("User not found");
    const doc = await payload.create({ collection: 'beneficiaries' as any, data: { ...data, user: users[0].id } as any, overrideAccess: true });
    return { id: doc.id } as any;
};

export const deleteBeneficiary = async (id: string, userId: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'beneficiaries' as any, id, overrideAccess: true });
        return true;
    } catch (e) { return false; }
};

// ==========================================
// PRODUCT CONFIGURATION
// ==========================================

export const getAllProductClasses = async (): Promise<ProductClass[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'product-classes' as any });
        return docs.map((doc: any) => ({ 
            id: String(doc.id), 
            name: doc.name, 
            description: doc.description, 
            status: doc.status, 
            created_at: doc.createdAt 
        }));
    } catch (e) { return []; }
};

export const createProductClass = async (data: Omit<ProductClass, 'id' | 'created_at'>): Promise<ProductClass> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'product-classes' as any, data: data as any });
    return { 
        id: String(doc.id), 
        name: (doc as any).name, 
        description: (doc as any).description, 
        status: (doc as any).status, 
        created_at: (doc as any).createdAt 
    } as any;
};

export const updateProductClass = async (id: string, data: Partial<ProductClass>): Promise<ProductClass> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'product-classes' as any, id, data: data as any });
    return { 
        id: String(doc.id), 
        name: (doc as any).name, 
        description: (doc as any).description, 
        status: (doc as any).status, 
        created_at: (doc as any).createdAt 
    } as any;
};

export const deleteProductClass = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-classes' as any, id });
        return true;
    } catch (e) { return false; }
};

export const getAllProductCategories = async (): Promise<ProductCategory[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'product-categories' as any, depth: 1 });
        return docs.map((doc: any) => ({ 
            id: String(doc.id), 
            class_id: typeof doc.class_id === 'object' ? doc.class_id.name : doc.class_id, 
            name: doc.name, 
            description: doc.description,
            status: doc.status, 
            created_at: doc.createdAt 
        }));
    } catch (e) { return []; }
};

export const createProductCategory = async (data: Omit<ProductCategory, 'id' | 'created_at'>): Promise<ProductCategory> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'product-categories' as any, data: data as any });
    return { 
        id: String(doc.id), 
        class_id: typeof (doc as any).class_id === 'object' ? (doc as any).class_id.name : (doc as any).class_id,
        name: (doc as any).name, 
        description: (doc as any).description,
        status: (doc as any).status, 
        created_at: (doc as any).createdAt 
    } as any;
};

export const updateProductCategory = async (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'product-categories' as any, id, data: data as any });
    return { 
        id: String(doc.id), 
        class_id: typeof (doc as any).class_id === 'object' ? (doc as any).class_id.name : (doc as any).class_id,
        name: (doc as any).name, 
        description: (doc as any).description,
        status: (doc as any).status, 
        created_at: (doc as any).createdAt 
    } as any;
};

export const deleteProductCategory = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-categories' as any, id });
        return true;
    } catch (e) { return false; }
};

export const getAllProductTypes = async (): Promise<ProductType[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'product-types' as any, depth: 1, limit: 100 });
        return docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            category: typeof doc.category === 'object' && doc.category ? doc.category.name : doc.category,
            tagline: doc.tagline,
            description: doc.description,
            financial_terms: doc.financial_terms,
            image_url: doc.image_url,
            form_schema: doc.form_schema,
            workflow_stages: (doc.workflow_stages || []).map((s: any) => s.stage),
            status: doc.status,
            created_at: doc.createdAt
        } as any)) as ProductType[];
    } catch (e) { return []; }
};

export const getProductTypeById = async (id: string): Promise<ProductType | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ collection: 'product-types' as any, id, depth: 1 });
        return {
            id: doc.id,
            name: doc.name,
            category: typeof doc.category === 'object' && doc.category ? String(doc.category.id) : String(doc.category),
            tagline: doc.tagline,
            description: doc.description,
            financial_terms: doc.financial_terms,
            image_url: doc.image_url,
            form_schema: doc.form_schema,
            workflow_stages: (doc.workflow_stages || []).map((s: any) => s.stage),
            status: doc.status,
            created_at: doc.createdAt
        } as any;
    } catch (e) { return null; }
};

export const saveProductType = async (data: ProductType): Promise<ProductType> => {
    const payload = await initPayload();
    let doc;
    if (data.id && !String(data.id).startsWith('type_')) { doc = await payload.update({ collection: 'product-types' as any, id: data.id, data: data as any }); }
    else { doc = await payload.create({ collection: 'product-types' as any, data: data as any }); }
    return { id: String(doc.id), name: (doc as any).name } as any;
};

export const deleteProductType = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-types' as any, id });
        return true;
    } catch (e) { return false; }
};

// ==========================================
// PRODUCT APPLICATIONS
// ==========================================

export const createProductApplication = async (data: Omit<ProductApplication, 'id' | 'created_at' | 'updated_at'>): Promise<ProductApplication> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'product-applications' as any, data: data as any });
    return { id: doc.id, user_id: (doc as any).user_id, status: (doc as any).status } as any;
};

export const updateApplication = async (id: string, data: Partial<ProductApplication>): Promise<ProductApplication> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'product-applications' as any, id, data: data as any });
    return { id: String(doc.id), status: (doc as any).status } as any;
};

export const getUserApplications = async (userId: string): Promise<ProductApplication[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'product-applications' as any, where: { user_id: { equals: userId } }, depth: 1, overrideAccess: true });
    return docs.map((doc: any) => ({
        id: doc.id,
        user_id: doc.user_id,
        product_type_id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id,
        status: doc.status,
        created_at: doc.createdAt,
        metadata: doc.metadata
    } as any)) as ProductApplication[];
};

export const getAllApplications = async (): Promise<ProductApplication[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'product-applications' as any, depth: 1 });
    return docs.map((doc: any) => ({ 
        id: doc.id, 
        user_id: doc.user_id, 
        product_type_id: typeof doc.product_type_id === 'object' ? doc.product_type_id.id : doc.product_type_id,
        status: doc.status 
    })) as any;
};

// ==========================================
// TRANSACTIONS
// ==========================================

export const getAllTransactions = async (): Promise<Transaction[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, depth: 1, limit: 500, sort: '-createdAt', overrideAccess: true });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        amount: (doc.amount ?? 0) / 100,
        type: doc.type || 'credit',
        status: doc.status || 'successful',
        reference: doc.reference || 'REF-GEN',
        narration: doc.narration || 'Banking Transaction',
        from_account: doc.from_account,
        to_account: doc.to_account,
        user_id: doc.user_id,
        created_at: doc.date || doc.createdAt
    } as any)) as Transaction[];
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const payload = await initPayload();
    const accounts = await getUserAccounts(userId);
    if (!accounts.length) return [];
    
    // 1. Trigger Sync for each Qore-linked account
    for (const account of accounts) {
        if (account.source === 'qore' || account.account_number.startsWith('30')) {
            try {
                await syncAccountTransactions(account.account_number, userId, account.customer as string);
            } catch (e: any) {
                console.warn(`[Ledger] Sync failed for account ${account.account_number}: ${e.message}`);
            }
        }
    }

    // 2. Fetch from synchronized local digital ledger
    const accountIds = accounts.map(a => a.id);
    const { docs } = await payload.find({ 
        collection: 'transactions' as any, 
        where: { or: [{ from_account: { in: accountIds } }, { to_account: { in: accountIds } }, { user_id: { equals: userId } }] }, 
        depth: 1, 
        limit: 100, 
        sort: '-date', // Sort by actual transaction date if available
        overrideAccess: true 
    });

    return docs.map((doc: any) => ({
        id: String(doc.id),
        amount: (doc.amount ?? 0) / 100,
        type: doc.type,
        status: doc.status,
        reference: doc.reference,
        narration: doc.narration,
        from_account: doc.from_account,
        to_account: doc.to_account,
        created_at: doc.date || doc.createdAt,
    } as any)) as Transaction[];
};

/**
 * Synchronizes external transactions from Core Banking into our local Digital Ledger.
 */
async function syncAccountTransactions(accountNumber: string, userId: string, customerId: string) {
    const payload = await initPayload();
    const settings: any = await payload.findGlobal({ slug: 'site-settings', overrideAccess: true });
    const endpointId = settings?.sync?.acctMgmt?.stmt; // Reusing statement endpoint if it provides history
    
    if (!endpointId) return; // No sync endpoint configured

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
        const res: any = await executeEndpoint(typeof endpointId === 'object' ? endpointId.id : endpointId, {
            accountNumber,
            fromDate: thirtyDaysAgo,
            toDate: today
        });

        const externalTxns = res.transactions || res.Transactions || [];
        if (!Array.isArray(externalTxns)) return;

        for (const ext of externalTxns) {
            const ref = ext.reference || ext.Reference || ext.TransactionReference || `EXT_${ext.id || Date.now()}`;
            
            // Check if transaction already exists
            const existing = await payload.find({
                collection: 'transactions' as any,
                where: { reference: { equals: ref } },
                limit: 1,
                overrideAccess: true
            });

            if (existing.totalDocs > 0) continue;

            // Resolve transaction type
            let type: Transaction['type'] = 'credit';
            const amount = Math.abs(Number(ext.amount || ext.Amount || 0));
            const isDebit = ext.type?.toLowerCase()?.includes('debit') || Number(ext.amount) < 0 || ext.EntryType === 'Debit';
            type = isDebit ? 'debit' : 'credit';

            // Attempt to resolve local account relations
            const narration = ext.narration || ext.Narration || ext.Description || '';
            let fromAccount = null;
            let toAccount = null;

            // Simple resolution: if we are debiting, our account is the source
            const localAcct = await payload.find({
                collection: 'accounts' as any,
                where: { account_number: { equals: accountNumber } },
                limit: 1,
                overrideAccess: true
            });
            const localAcctId = localAcct.docs[0]?.id;

            if (isDebit) fromAccount = localAcctId;
            else toAccount = localAcctId;

            // Store in Digital Ledger
            await payload.create({
                collection: 'transactions' as any,
                data: {
                    reference: ref,
                    type,
                    amount: Math.round(amount * 100),
                    status: 'successful',
                    narration,
                    from_account: fromAccount,
                    to_account: toAccount,
                    customer: customerId,
                    user_id: userId,
                    date: ext.date || ext.Date || ext.TransactionDate || new Date().toISOString(),
                    metadata: ext,
                    channel: 'api'
                } as any
            });
        }
    } catch (e: any) {
        console.error(`[Ledger] Error syncing transactions for ${accountNumber}:`, e.message);
    }
}

export const getLoanTransactions = async (loanId: string): Promise<Transaction[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { loan: { equals: loanId } }, depth: 1, limit: 200, sort: '-createdAt', overrideAccess: true });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        amount: (doc.amount ?? 0) / 100,
        type: doc.type,
        status: doc.status,
        reference: doc.reference,
        narration: doc.narration,
        created_at: doc.date || doc.createdAt
    } as any)) as Transaction[];
};

export const getAccountTransactions = async (accountId: string): Promise<Transaction[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ 
        collection: 'transactions' as any, 
        where: { or: [{ from_account: { equals: accountId } }, { to_account: { equals: accountId } }] }, 
        depth: 1, 
        limit: 200, 
        sort: '-createdAt', 
        overrideAccess: true 
    });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        amount: (doc.amount ?? 0) / 100,
        type: doc.type,
        status: doc.status,
        reference: doc.reference,
        narration: doc.narration,
        from_account: doc.from_account,
        to_account: doc.to_account,
        created_at: doc.date || doc.createdAt,
    } as any)) as Transaction[];
};

export const getTransactionById = async (id: string | number): Promise<Transaction | null> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { id: { equals: id } }, depth: 2, limit: 1, overrideAccess: true });
    if (!docs.length) return null;
    const doc = docs[0];
    return {
        id: String(doc.id),
        amount: (doc.amount ?? 0) / 100,
        type: doc.type || 'credit',
        status: doc.status || 'successful',
        reference: doc.reference || 'REF-GEN',
        narration: doc.narration || 'Banking Transaction',
        from_account: doc.from_account,
        to_account: doc.to_account,
        user_id: doc.user_id,
        created_at: doc.date || doc.createdAt,
        metadata: doc.metadata
    } as any;
};

export const getTransactionsByCategory = async (category: Transaction['category']): Promise<Transaction[]> => [];

// ==========================================
// SERVICES & INTEGRATIONS
// ==========================================

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'service-categories' as any, limit: 100 });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        name: doc.name,
        slug: doc.slug || '',
        icon: doc.icon || '',
        description: doc.description || '',
        status: doc.status || 'active',
        created_at: doc.createdAt,
    })) as any;
};

export const getServicesByCategory = async (categorySlug: string): Promise<Service[]> => {
    const payload = await initPayload();
    const { docs: cats } = await payload.find({ collection: 'service-categories' as any, where: { slug: { equals: categorySlug } }, limit: 1 });
    if (!cats.length) return [];
    const { docs } = await payload.find({ collection: 'services' as any, where: { and: [{ category: { equals: cats[0].id } }, { status: { equals: 'active' } }] }, depth: 2, limit: 200 });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        name: doc.name || 'Service',
        status: doc.status || 'active',
        fee_type: doc.fee_type || 'none',
        fee_value: doc.fee_value ?? 0,
        form_schema: Array.isArray(doc.form_schema) ? doc.form_schema : [],
        service_intent: doc.service_intent || 'none',
        provider_service_code: doc.provider_service_code || '',
        category: typeof doc.category === 'object' ? doc.category?.name : doc.category,
        category_id: typeof doc.category === 'object' ? String(doc.category?.id) : String(doc.category),
        validation_workflow: doc.validation_workflow,
        execution_workflow: doc.execution_workflow,
    })) as any;
};

export const getAllServices = async (): Promise<Service[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'services' as any, depth: 1, limit: 500 });
    return docs.map((doc: any) => ({
        id: String(doc.id),
        name: doc.name,
        status: doc.status,
        fee_type: doc.fee_type,
        fee_value: doc.fee_value,
        form_schema: doc.form_schema || [],
        provider_service_code: doc.provider_service_code,
        // Resolve category — Payload returns the full object at depth:1
        category: typeof doc.category === 'object' ? doc.category?.name : doc.category,
        category_id: typeof doc.category === 'object' ? String(doc.category?.id) : String(doc.category),
        validation_workflow: doc.validation_workflow,
        execution_workflow: doc.execution_workflow,
    })) as any;
};

export const createServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'created_at'>): Promise<ServiceCategory> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'service-categories' as any, data: data as any });
    return { ...data, id: String(doc.id) } as any;
};

export const updateServiceCategory = async (id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'service-categories' as any, id, data: data as any });
    return {
        id: String(doc.id),
        name: (doc as any).name,
        slug: (doc as any).slug,
        description: (doc as any).description,
        icon: (doc as any).icon,
        status: (doc as any).status,
        ui_layout: (doc as any).ui_layout,
        created_at: (doc as any).created_at,
    } as any;
};

export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    const payload = await initPayload();
    await payload.delete({ collection: 'service-categories' as any, id });
    return true;
};

export const createService = async (data: Omit<Service, 'id' | 'created_at'>): Promise<Service> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'services' as any, data: data as any });
    return { ...data, id: String(doc.id) } as any;
};

export const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
    const payload = await initPayload();
    
    // Parse numeric IDs if necessary for Postgres adapter
    const cleanId = (val: any) => val && !isNaN(Number(val)) ? Number(val) : val;
    
    const payloadData: any = { ...data };
    if (payloadData.category) payloadData.category = cleanId(payloadData.category);
    if (payloadData.validation_workflow) payloadData.validation_workflow = cleanId(payloadData.validation_workflow);
    if (payloadData.execution_workflow) payloadData.execution_workflow = cleanId(payloadData.execution_workflow);
    
    if (Array.isArray(payloadData.form_schema)) {
        payloadData.form_schema = payloadData.form_schema.map((field: any) => {
            if (Array.isArray(field.events)) {
                field.events = field.events.map((ev: any) => ({
                    ...ev,
                    endpointId: typeof ev.endpointId === 'object' && ev.endpointId ? cleanId(ev.endpointId.id) : cleanId(ev.endpointId)
                }));
            }
            return field;
        });
    }

    const doc = await payload.update({ collection: 'services' as any, id, data: payloadData });
    
    // Return full mapped object
    return {
        id: String(doc.id),
        name: doc.name,
        status: doc.status,
        fee_type: doc.fee_type,
        fee_value: doc.fee_value,
        form_schema: doc.form_schema || [],
        provider_service_code: doc.provider_service_code,
        category: typeof doc.category === 'object' ? doc.category?.name : doc.category,
        category_id: typeof doc.category === 'object' ? String(doc.category?.id) : String(doc.category),
        validation_workflow: doc.validation_workflow,
        execution_workflow: doc.execution_workflow,
        service_intent: (doc as any).service_intent,
    } as any;
};

export const deleteService = async (id: string): Promise<boolean> => {
    const payload = await initPayload();
    await payload.delete({ collection: 'services' as any, id });
    return true;
};

export const executeServiceWorkflow = async (serviceId: string, formData: Record<string, any>): Promise<string> => {
    const payload = await initPayload();
    const service = await payload.findByID({ collection: 'services' as any, id: serviceId });
    const wfId = typeof service.execution_workflow === 'object' ? service.execution_workflow?.id : service.execution_workflow;
    return await executeWorkflow({ workflowId: String(wfId), trigger: 'MANUAL', inputData: { ...formData, _serviceId: serviceId } });
};

export const validateServiceWorkflow = async (serviceId: string, formData: Record<string, any>): Promise<any> => {
    const payload = await initPayload();
    const service = await payload.findByID({ collection: 'services' as any, id: serviceId });
    const wfId = typeof service.validation_workflow === 'object' ? service.validation_workflow?.id : service.validation_workflow;
    if (!wfId) return { valid: true };
    const exId = await executeWorkflow({ workflowId: String(wfId), trigger: 'MANUAL', inputData: formData });
    return { valid: true, executionId: String(exId) };
};

export const getWorkflowExecutionById = async (id: string): Promise<any> => {
    const payload = await initPayload();
    return await payload.findByID({ collection: 'workflow-executions' as any, id: !isNaN(Number(id)) ? Number(id) : id, depth: 1 });
};

export const getWorkflows = async (): Promise<{ docs: { id: string, name: string }[] }> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'workflows' as any, limit: 100 });
    return { docs: docs.map((doc: any) => ({ id: String(doc.id), name: doc.name })) };
};

// ==========================================
// CONFIG & CMS
// ==========================================

export const getConfigsByCategory = async (category: string): Promise<SystemConfig[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'system-configs' as any, where: { category: { equals: category } }, limit: 100 });
    return docs.map((doc: any) => ({ id: String(doc.id), key: (doc as any).key, value: (doc as any).value, category: (doc as any).category, updated_at: (doc as any).updatedAt }));
};

export const getPageBySlug = async (slug: string): Promise<any | null> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'pages' as any, where: { slug: { equals: slug } }, limit: 1 });
    return docs[0] || null;
};

export const getPromotions = async (placement?: string): Promise<any[]> => {
    const payload = await initPayload();
    const where: any = { isActive: { equals: true } };
    if (placement) {
        where.placement = { equals: placement };
    }
    const { docs } = await payload.find({ 
        collection: 'promotions' as any, 
        where, 
        limit: 10,
        sort: '-createdAt'
    });
    return docs.map((doc: any) => {
        // Normalize image data for the frontend
        let imageData = doc.mediaImage;
        if (doc.imageSource === 'url' && doc.externalUrl) {
            imageData = { url: doc.externalUrl };
        }

        return {
            id: String(doc.id),
            title: doc.title,
            description: doc.description,
            image: imageData,
            link: doc.link,
            isActive: doc.isActive,
            placement: doc.placement,
            updatedAt: doc.updatedAt,
            createdAt: doc.createdAt
        };
    });
};

export const createPromotion = async (data: any): Promise<any> => {
    try {
        const payload = await initPayload();
        console.log('--- CREATE PROMOTION DATA ---', JSON.stringify(data, null, 2));
        const doc = await payload.create({ collection: 'promotions' as any, data });
        return { ...data, id: String(doc.id) };
    } catch (error: any) {
        console.error('--- PAYLOAD ERROR ---', JSON.stringify(error, null, 2));
        throw error;
    }
};

export const updatePromotion = async (id: string, data: any): Promise<any> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'promotions' as any, id, data });
    return { ...doc, id: String(doc.id) };
};

export const deletePromotion = async (id: string): Promise<boolean> => {
    const payload = await initPayload();
    await payload.delete({ collection: 'promotions' as any, id });
    return true;
};

export const getSiteSettings = async (): Promise<SiteSettings | null> => {
    const payload = await initPayload();
    return await payload.findGlobal({ slug: 'site-settings', depth: 1 }) as any;
};

export const updateSiteSettings = async (data: Partial<SiteSettings>): Promise<SiteSettings> => {
    const payload = await initPayload();
    return await payload.updateGlobal({ slug: 'site-settings', data: data as any }) as any;
};

// ==========================================
// BLOG
// ==========================================

export const getBlogPosts = async (params?: any): Promise<BlogPost[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ 
            collection: 'posts' as any, 
            limit: 100, 
            sort: '-createdAt',
            overrideAccess: true 
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            title: doc.title,
            slug: doc.slug,
            excerpt: doc.excerpt || doc.meta?.description,
            image_url: doc.feature_image?.url,
            created_at: doc.createdAt,
            content: doc.content
        } as any)) as BlogPost[];
    } catch (e) { return []; }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'posts' as any, where: { slug: { equals: slug } }, limit: 1 });
    return (docs[0] as any) || undefined;
};

export const getFeaturedPosts = async (): Promise<BlogPost[]> => (await getBlogPosts()).slice(0, 3);
export const getPostsByCategory = async (slug: string): Promise<BlogPost[]> => (await getBlogPosts());
export const getPopularPosts = async (): Promise<BlogPost[]> => (await getBlogPosts()).slice(0, 4);
export const getAllTags = async (): Promise<string[]> => [];

// ==========================================
// MISC & IDENTITY BRIDGE
// ==========================================

export const getOpenPositions = async (): Promise<JobPosition[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'job-positions' as any, where: { status: { equals: 'active' } } });
        return docs.map((doc: any) => ({ id: String(doc.id), title: doc.title, department: doc.department, location: doc.location, type: doc.type }));
    } catch (e) { return []; }
};

export const getAllEndpoints = async (): Promise<any[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'endpoints' as any, limit: 100 });
    return docs;
};

export interface MergeParams {
    primaryCustomerId: string;
    targetId: string;
    isCustomerToCustomer: boolean;
    profileData: any;
    selectedAccountNumbers?: string[];
    keepTargetAsPrimary?: boolean;
}

export const executeCustomerMerge = async (params: MergeParams) => {
    const { primaryCustomerId, targetId, isCustomerToCustomer, profileData, selectedAccountNumbers = [], keepTargetAsPrimary = false } = params;
    const payload = await initPayload();
    const winnerId = (keepTargetAsPrimary && isCustomerToCustomer) ? targetId : primaryCustomerId;
    let loserId = (keepTargetAsPrimary && isCustomerToCustomer) ? primaryCustomerId : (isCustomerToCustomer ? targetId : null);
    const supabaseId = isCustomerToCustomer ? null : targetId;

    // Discovery: If linking a digital ID, find if someone else already owns it
    if (!isCustomerToCustomer && targetId) {
        const owners = await payload.find({ 
            collection: 'customers', 
            where: { supabase_id: { equals: targetId } }, 
            limit: 1, 
            overrideAccess: true 
        });
        if (owners.docs.length > 0 && String(owners.docs[0].id) !== String(winnerId)) {
            loserId = String(owners.docs[0].id);
            console.log(`[Bridge] Auto-detected identity owner for ${targetId}: ${loserId}. Upgrading to Merge/Transfer.`);
        }
    }

    const primary = await payload.findByID({ collection: 'customers', id: primaryCustomerId });
    let targetCustomer = null;
    if (isCustomerToCustomer) targetCustomer = await payload.findByID({ collection: 'customers', id: targetId });
    else if (loserId) targetCustomer = await payload.findByID({ collection: 'customers', id: loserId });

    const archivedIds: string[] = [];
    let winnerSupabaseId = (targetCustomer?.supabase_id || primary.supabase_id);
    if (keepTargetAsPrimary && !isCustomerToCustomer) winnerSupabaseId = targetId;

    if (loserId) {
        const timestamp = Date.now();
        const loser = await payload.findByID({ collection: 'customers', id: loserId });
        const loserSupabaseId = loser.supabase_id;
        
        // Safety: Renaming unique fields on loser to allow winner to adopt them if needed
        const cleanEmail = loser.email.replace(/^archived_\d+_/, '');
        const cleanBvn = loser.bvn ? loser.bvn.replace(/^archived_\d+_/, '') : null;
        
        await payload.update({
            collection: 'customers',
            id: loserId,
            data: {
                email: `archived_${timestamp}_${cleanEmail}`,
                bvn: cleanBvn ? `archived_${timestamp}_${cleanBvn}` : null,
                supabase_id: null,
                is_associated: false,
                is_archived: true,
                active: false,
                merger_status: 'archived',
            } as any
        });

        // Harmonization Fix: Secure the Loser's Qore ID into the Winner's legacy array so future syncs respect the merge.
        if (loser.qore_customer_id) {
            const winner = await payload.findByID({ collection: 'customers', id: winnerId });
            const existingLegacy = winner.legacy_qore_ids || [];
            if (!existingLegacy.find((l: any) => l.qore_id === loser.qore_customer_id)) {
                await payload.update({
                    collection: 'customers',
                    id: winnerId,
                    data: {
                        legacy_qore_ids: [...existingLegacy, { qore_id: loser.qore_customer_id }]
                    } as any
                });
                console.log(`[Harmonization] Locked Legacy Qore ID ${loser.qore_customer_id} into primary profile ${winnerId}`);
            }
        }

        const collections = ['accounts', 'loans', 'transactions'];
        for (const col of collections) {
            try {
                const records = await payload.find({ 
                    collection: col as any, 
                    where: { customer: { equals: loserId } }, 
                    limit: 1000, 
                    overrideAccess: true 
                });
                
                for (const doc of records.docs) {
                    const updateData: any = { customer: Number(winnerId) };
                    // Both accounts, loans, and transactions use user_id to link to the Supabase identity
                    if (winnerSupabaseId) {
                        updateData.user_id = winnerSupabaseId;
                    }

                    // Ensure migrated banking products are active/visible
                    if (col === 'accounts' || col === 'loans') {
                        updateData.is_archived = false;
                    }
                    
                    try {
                        await payload.update({ 
                            collection: col as any, 
                            id: doc.id, 
                            data: updateData, 
                            overrideAccess: true 
                        });
                    } catch (updateErr: any) {
                        console.error(`Record update failed in ${col} for doc ${doc.id}:`, updateErr.message);
                        // Log full error to find specific field validation issues
                        if (updateErr.data) console.dir(updateErr.data, { depth: null });
                    }
                }
            } catch (e: any) {
                console.error(`Merge Asset Migration Failed for collection ${col}:`, e.message);
                // We continue with other collections to ensure at least partial recovery
            }
        }

        // 5. Digital Identity Consolidation (Product Applications, Beneficiaries, etc.)
        const winnerOldSupabaseId = (primary.supabase_id && primary.supabase_id !== winnerSupabaseId) ? primary.supabase_id : null;
        const identitiesToMigrate = [loserSupabaseId, winnerOldSupabaseId].filter(Boolean) as string[];

        for (const sourceSupabaseId of identitiesToMigrate) {
            if (sourceSupabaseId === winnerSupabaseId) continue;
            try {
                console.log(`[Bridge] Consolidating digital assets from ${sourceSupabaseId} to ${winnerSupabaseId}`);
                
                // Re-point product applications (string-based user_id)
                const apps = await payload.find({ collection: 'product-applications', where: { user_id: { equals: sourceSupabaseId } }, limit: 1000, overrideAccess: true });
                for (const doc of apps.docs) await payload.update({ collection: 'product-applications', id: doc.id, data: { user_id: winnerSupabaseId }, overrideAccess: true });
                
                // Re-point transactions that might only have user_id but not customer link (rare but possible)
                const orphanTxs = await payload.find({ collection: 'transactions', where: { user_id: { equals: sourceSupabaseId } }, limit: 1000, overrideAccess: true });
                for (const doc of orphanTxs.docs) await payload.update({ collection: 'transactions', id: doc.id, data: { user_id: winnerSupabaseId, customer: Number(winnerId) }, overrideAccess: true });

                // Re-point beneficiaries (relates to numeric Payload Users)
                const winningUsers = await payload.find({ collection: 'users', where: { supabase_id: { equals: winnerSupabaseId } }, limit: 1, overrideAccess: true });
                const losingUsers = await payload.find({ collection: 'users', where: { supabase_id: { equals: sourceSupabaseId } }, limit: 1, overrideAccess: true });
                
                if (winningUsers.docs.length > 0 && losingUsers.docs.length > 0) {
                    const winnerUserId = winningUsers.docs[0].id;
                    const loserUserId = losingUsers.docs[0].id;
                    console.log(`[Bridge] Re-pointing beneficiaries from Shadow User ${loserUserId} to ${winnerUserId}`);
                    const beneficiaries = await payload.find({ collection: 'beneficiaries', where: { user: { equals: loserUserId } }, limit: 1000, overrideAccess: true });
                    for (const doc of beneficiaries.docs) await payload.update({ collection: 'beneficiaries', id: doc.id, data: { user: winnerUserId }, overrideAccess: true });
                }
            } catch (e: any) {
                console.warn(`Bridge Digital Asset Consolidation Warning (${sourceSupabaseId}):`, e.message);
            }
        }
        archivedIds.push(loserId);
    }
    const finalSupabaseId = supabaseId || (targetCustomer?.supabase_id || primary.supabase_id);

    // Shadow User Assurance: Ensure the digital identity exists in the Payload 'users' collection
    if (finalSupabaseId) {
        const shadowUsers = await payload.find({ collection: 'users', where: { supabase_id: { equals: finalSupabaseId } }, limit: 1, overrideAccess: true });
        if (shadowUsers.docs.length === 0) {
            console.log(`[Bridge] Creating missing shadow user record for ${finalSupabaseId}`);
            await payload.create({ 
                collection: 'users', 
                data: { 
                    supabase_id: finalSupabaseId, 
                    email: profileData?.email || primary.email,
                    name: profileData ? `${profileData.firstName} ${profileData.lastName}` : `${primary.firstName} ${primary.lastName}`,
                    role: 'admin' // In this system, Payload users are treated as admin shadow records
                },
                overrideAccess: true 
            });
        }
    }

    await payload.update({ collection: 'customers', id: winnerId, data: { ...profileData, supabase_id: finalSupabaseId, is_associated: !!finalSupabaseId, merger_status: 'primary', active: true, is_archived: false } as any, overrideAccess: true });
    return { success: true, mergedRecords: archivedIds.length, archivedIds };
};

export const sanitizeProductRegistry = async (payload: any) => {
    try {
        // 1. Find and consolidate Product Types
        const orphanedTypes = await payload.find({ collection: 'product-types', where: { name: { contains: 'SavingsOrCurrent' } }, limit: 10 });
        for (const type of orphanedTypes.docs) {
            // Check if 'Savings' already exists
            const correctType = await payload.find({ collection: 'product-types', where: { name: { equals: 'Savings' } }, limit: 1 });
            if (correctType.docs.length > 0) {
                // Re-point all accounts using the orphaned type to the correct one
                const accounts = await payload.find({ collection: 'accounts', where: { product_type: { equals: type.id } }, limit: 1000 });
                for (const acc of accounts.docs) {
                    await payload.update({ collection: 'accounts', id: acc.id, data: { product_type: correctType.docs[0].id } });
                }
                // Optional: Archive orphaned type
                await payload.update({ collection: 'product-types', id: type.id, data: { status: 'archived', name: `Legacy_${type.name}` } });
            } else {
                // Just rename this one to 'Savings'
                await payload.update({ collection: 'product-types', id: type.id, data: { name: 'Savings' } });
            }
        }
    } catch (e) {
        console.error('Registry Sanitization Error:', e);
    }
};

export const syncProductMetadata = async (payload: any, qoreAccount: any) => {
    try {
        // 1. Ensure Product Class exists
        const className = qoreAccount.ProductClass || 'Standard';
        let productClass = await payload.find({ collection: 'product-classes', where: { name: { equals: className } }, limit: 1 });
        if (productClass.docs.length === 0) {
            productClass = await payload.create({ collection: 'product-classes', data: { name: className, status: 'active' }, overrideAccess: true });
        } else {
            productClass = productClass.docs[0];
        }

        // 2. Ensure Product Category exists
        const catName = qoreAccount.ProductCategory || 'Banking';
        let productCat = await payload.find({ collection: 'product-categories', where: { name: { equals: catName } }, limit: 1 });
        if (productCat.docs.length === 0) {
            productCat = await payload.create({ collection: 'product-categories', data: { name: catName, class_id: productClass.id, status: 'active' }, overrideAccess: true });
        } else {
            productCat = productCat.docs[0];
        }

        // 3. Ensure Product Type exists
        let typeName = qoreAccount.ProductType || qoreAccount.AccountType || 'Basic Account';
        // Consolidation Logic: Map legacy or complex names to standard ones
        if (typeName.includes('SavingsOrCurrent')) typeName = 'Savings';
        else if (typeName.includes('Savings')) typeName = 'Savings';
        else if (typeName.includes('Current')) typeName = 'Current';

        let productType = await payload.find({ collection: 'product-types', where: { name: { equals: typeName } }, limit: 1 });
        if (productType.docs.length === 0) {
            productType = await payload.create({ 
                collection: 'product-types', 
                data: { 
                    name: typeName, 
                    category: productCat.id, 
                    status: 'active', 
                    code: qoreAccount.ProductCode || 'GEN',
                    tagline: `Standard ${typeName} product from Qore system.`,
                    description: `Automated product mirrored from core banking system.`,
                    form_schema: [], // Prevent client-side .map() crashes
                    financial_terms: [
                        {
                            blockType: 'savings-terms',
                            min_balance: 0,
                            interest_rate: 0,
                            monthly_maintenance_fee: 0,
                        }
                    ],
                    workflow_stages: [
                        { stage: 'Submitted' },
                        { stage: 'Under Review' },
                        { stage: 'Approved' }
                    ]
                }, 
                overrideAccess: true 
            });
        } else {
            productType = productType.docs[0];
        }

        return productType.id;
    } catch (e) {
        console.error('Metadata Sync Error:', e);
        return null;
    }
};

export const syncCustomerToQore = async (winnerId: string, profileData: any) => {
    try {
        const payload = await initPayload();
        const settings = await payload.findGlobal({ slug: 'site-settings' }) as any;
        const endpointId = typeof settings.sync?.customerUpdateEndpoint === 'object' ? settings.sync.customerUpdateEndpoint.id : settings.sync?.customerUpdateEndpoint;
        if (!endpointId) return;
        const winner = await payload.findByID({ collection: 'customers', id: winnerId });
        if (!winner.qore_customer_id) return;
        const endpoint = await payload.findByID({ collection: 'endpoints', id: endpointId });
        const { resolveEndpoint } = await import('@/lib/workflow/utils/apiResolver');
        const qorePayload = { CustomerID: winner.qore_customer_id, LastName: profileData.lastName || winner.lastName, OtherNames: profileData.firstName || winner.firstName, Email: profileData.email || winner.email, PhoneNo: profileData.phone_number || winner.phone_number || '', BVN: winner.bvn || '', Address: winner.address || '', City: (winner as any).city || 'Lagos', Gender: (winner as any).gender === 'male' ? 1 : 0, DateOfBirth: (winner as any).dob || "1990-01-01T00:00:00Z" };
        const resolved = await resolveEndpoint(endpoint as any, { body: qorePayload, query: { authToken: '{{SECRET:QORE_AUTH_TOKEN}}' } });
        const res = await fetch(resolved.url, { method: resolved.method, headers: resolved.headers, body: JSON.stringify(resolved.body) });
        if (res.ok) console.log(`Qore Sync Success for ${winner.qore_customer_id}`);
    } catch (e) { console.error('Qore Sync Failed:', e); }
};

export const backfillTransactionHistory = async (payload: any, accountId: string, accountNumber: string, customerId: string, userId: string | null = null) => {
    try {
        const settings = await payload.findGlobal({ slug: 'site-settings' }) as any;
        const endpointId = typeof settings.sync?.accountTransactionsEndpoint === 'object' ? settings.sync.accountTransactionsEndpoint.id : settings.sync?.accountTransactionsEndpoint;
        if (!endpointId) return;

        const endpoint = await payload.findByID({ collection: 'endpoints', id: endpointId });
        const { resolveEndpoint } = await import('@/lib/workflow/utils/apiResolver');

        // Calculate 30-day window
        const toDate = new Date().toISOString();
        const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const resolved = await resolveEndpoint(endpoint as any, { query: { accountNumber, fromDate, toDate, numberOfItems: 50 } });
        const res = await fetch(resolved.url, { method: resolved.method, headers: resolved.headers });
        if (!res.ok) return;

        const data = await res.json();
        const qoreTransactions = data.Payload || data.payload || data.transactions || [];

        for (const tx of qoreTransactions) {
            const txRef = tx.TransactionReference || tx.reference || `QORE-${tx.id || Date.now()}`;
            
            // Avoid duplicates
            const existing = await payload.find({ collection: 'transactions', where: { reference: { equals: txRef } }, limit: 1 });
            if (existing.docs.length > 0) continue;

            const amountKobo = Math.round(parseFloat(tx.Amount || tx.amount || '0') * 100);
            const isCredit = (tx.TransactionType || tx.type || '').toLowerCase().includes('credit');

            const txDate = tx.TransactionDate || tx.dateCreated || tx.date || new Date().toISOString();
            const cleanedDate = new Date(txDate).toISOString();

            await payload.create({
                collection: 'transactions',
                data: {
                    reference: txRef,
                    date: cleanedDate,
                    type: isCredit ? 'credit' : 'debit',
                    amount: Math.abs(amountKobo),
                    status: 'successful',
                    narration: tx.Narration || tx.narration || `CoreSync: ${isCredit ? 'Credit' : 'Debit'}`,
                    [isCredit ? 'to_account' : 'from_account']: accountId,
                    customer: Number(customerId),
                    user_id: userId,
                    metadata: { source: 'qore_backfill', qore_data: tx }
                },
                overrideAccess: true
            });
        }
    } catch (e) {
        console.error(`Transaction Backfill Error for ${accountNumber}:`, e);
    }
};

export const mirrorSelectedAccounts = async (winnerId: string, winnerSupabaseId: string | null, accounts: any[], loserId?: string) => {
    try {
        const payload = await initPayload();
        
        // 1. Identify ALL legacy local accounts for both winner and loser
        const relevantCustomerIds = [winnerId, loserId].filter(id => id && id !== 'undefined' && id !== 'null').map(id => String(id));
        const legacyAccounts = await payload.find({ 
            collection: 'accounts', 
            where: { customer: { in: relevantCustomerIds } }, 
            limit: 1000, 
            overrideAccess: true 
        });

        // 2. Mirror/Unify loop
        for (const qoreAccount of accounts) {
            // Canonical Key: NUBAN > accountNumber (lowercase) > AccountNumber (PascalCase) > AccountNo
            const accountNo = qoreAccount.NUBAN || qoreAccount.accountNumber || qoreAccount.AccountNumber || qoreAccount.AccountNo;
            if (!accountNo) continue;
            
            const existing = legacyAccounts.docs.find((a: any) => a.account_number === accountNo);
            
            // Sync metadata using available info (Class/Category/Type/Code)
            const productTypeId = await syncProductMetadata(payload, qoreAccount);

            // Normalize Account Type (Qore often returns 'SavingsOrCurrent')
            let normalizedType: string = qoreAccount.accountType || qoreAccount.AccountType || 'Savings';
            if (normalizedType.includes('Savings')) normalizedType = 'Savings';
            else if (normalizedType.includes('Current')) normalizedType = 'Current';
            else if (normalizedType.includes('Deposit')) normalizedType = 'Fixed Deposit';
            else normalizedType = 'Savings';

            // Strip commas from balance strings (Qore returns "1,743,786.58" not "1743786.58")
            const rawBalance = qoreAccount.availableBalance || qoreAccount.AvailableBalance || '0';
            const balanceKobo = Math.round(parseFloat(String(rawBalance).replace(/,/g, '')) * 100);

            const accountData: any = {
                customer: Number(winnerId),
                // CRITICAL: Dashboard access (AccountDetailsPage:46) requires the user_id to match Supabase UUID
                user_id: winnerSupabaseId || qoreAccount.email || qoreAccount.customerID, 
                account_number: accountNo,
                account_type: normalizedType,
                balance: isNaN(balanceKobo) ? 0 : balanceKobo,
                status: (qoreAccount.accountStatus || qoreAccount.Status || 'active').toLowerCase(),
                source: 'qore',
                product_type: productTypeId,
            };

            // Verbose Diagnostic Logging
            console.log(`[Diagnostic] Attempting to ${existing ? 'UPDATE' : 'CREATE'} account: ${accountNo}`);
            console.log(`[Diagnostic] Payload Structure:`, JSON.stringify(accountData, null, 2));
            console.log(`[Diagnostic] Type Audit:`, {
                customer: typeof accountData.customer,
                account_type: typeof accountData.account_type,
                balance: typeof accountData.balance,
                status: typeof accountData.status,
                product_type: typeof accountData.product_type
            });

            let targetAccountId;
            if (existing) {
                const updated = await payload.update({ collection: 'accounts', id: existing.id, data: accountData, overrideAccess: true });
                targetAccountId = updated.id;
            } else {
                const created = await payload.create({ collection: 'accounts', data: accountData, overrideAccess: true });
                targetAccountId = created.id;
            }

            // 3. Initiate Transaction Backfill
            await backfillTransactionHistory(payload, String(targetAccountId), accountNo, String(winnerId), winnerSupabaseId);
        }

        // 4. Handle "Preservation" for legacy accounts NOT in the synced set
        const syncedAccountNumbers = accounts.map(a => a.NUBAN || a.accountNumber || a.AccountNumber || a.AccountNo).filter(Boolean);
        for (const legacy of legacyAccounts.docs) {
            if (!syncedAccountNumbers.includes(legacy.account_number)) {
                await payload.update({
                    collection: 'accounts',
                    id: legacy.id,
                    data: {
                        customer: Number(winnerId),
                        user_id: winnerSupabaseId || legacy.user_id,
                        source: 'local'
                    },
                    overrideAccess: true
                });
            }
        }
    } catch (e) {
        console.error('Account Mirroring/Unification Error:', e);
    }
};

export const mergeCustomers = async (params: { primaryCustomerId: string; supabaseUserId: string; profileData: any; selectedAccountNumbers: string[]; isCustomerToCustomer?: boolean; keepTargetAsPrimary?: boolean; }) => {
    const result = await executeCustomerMerge({ primaryCustomerId: params.primaryCustomerId, targetId: params.supabaseUserId, isCustomerToCustomer: !!params.isCustomerToCustomer, profileData: params.profileData, selectedAccountNumbers: params.selectedAccountNumbers, keepTargetAsPrimary: params.keepTargetAsPrimary });
    const winnerId = params.keepTargetAsPrimary && params.isCustomerToCustomer ? params.supabaseUserId : params.primaryCustomerId;
    
    // Perform Qore Sync
    await syncCustomerToQore(winnerId, params.profileData);
    
    // Perform Account Mirroring & Unification
    // Note: mergeCustomers passes account numbers, so we fetch objects first
    const qoreAccounts = await getQoreAccounts(winnerId);
    const selectedAccounts = qoreAccounts.filter(a => {
        const canonicalNo = a.NUBAN || a.accountNumber || a.AccountNumber || a.AccountNo;
        return params.selectedAccountNumbers.includes(canonicalNo);
    });
    
    await mirrorSelectedAccounts(winnerId, result.success ? (params.isCustomerToCustomer ? null : params.supabaseUserId) : null, selectedAccounts, params.isCustomerToCustomer ? params.supabaseUserId : undefined);
    
    return result;
};

export const getQoreAccounts = async (customerId: string): Promise<any[]> => {
    try {
        const payload = await initPayload();
        const customer = await payload.findByID({ collection: 'customers', id: customerId });
        if (!customer || !customer.qore_customer_id) return [];
        const settings = await payload.findGlobal({ slug: 'site-settings' }) as any;
        const endpointId = typeof settings.sync?.customerAccountsEndpoint === 'object' ? settings.sync.customerAccountsEndpoint.id : settings.sync?.customerAccountsEndpoint;
        if (!endpointId) return [];
        const endpoint = await payload.findByID({ collection: 'endpoints', id: endpointId });
        const { resolveEndpoint } = await import('@/lib/workflow/utils/apiResolver');
        const resolved = await resolveEndpoint(endpoint as any, { query: { customerID: customer.qore_customer_id } });
        console.log(`[Diagnostic] Fetching Customer Accounts: ${customer.qore_customer_id} via ${resolved.url}`);
        const res = await fetch(resolved.url, { method: resolved.method, headers: resolved.headers });
        if (!res.ok) {
            console.error(`[Diagnostic] Customer Accounts Inquiry Failed: ${res.status} ${res.statusText}`);
            return [];
        }
        const data = await res.json();
        console.log(`[Diagnostic] Customer Accounts Response:`, JSON.stringify(data, null, 2));
        return Array.isArray(data) ? data : (data.Accounts || data.AccountsList || data.payload || []);
    } catch (e) { return []; }
};

export const refreshCustomerLedger = async (customerId: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const payload = await initPayload();
        const customer = await payload.findByID({ collection: 'customers', id: customerId });
        if (!customer) throw new Error('Customer not found');
        if (!customer.qore_customer_id) throw new Error('Customer is not linked to Qore');

        // 1. Fetch ALL current account numbers from Qore
        const qoreAccounts = await getQoreAccounts(customerId);
        // NUBAN > accountNumber(lowercase) > AccountNumber(PascalCase)
        const accountNumbers = qoreAccounts.map((a: any) => a.NUBAN || a.accountNumber || a.AccountNumber || a.AccountNo).filter(Boolean);

        if (!accountNumbers.length) {
            return { success: true, message: 'No accounts found in Qore to sync.' };
        }

        // Run a registry sanitization before unification to clean up orphans
        await sanitizeProductRegistry(payload);

        // 2. Trigger mirror and unification logic
        // We pass the full objects directly to avoid failing redundant inquiries
        await mirrorSelectedAccounts(customerId, customer.supabase_id, qoreAccounts);

        return { success: true };
    } catch (e: any) {
        console.error('Manual Ledger Sync Error:', e.message);
        return { success: false, message: e.message };
    }
};

export const unlinkCustomer = async (id: string): Promise<Customer> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'customers', id, data: { supabase_id: null, is_associated: false, merger_status: 'none' } as any, overrideAccess: true });
    return { id: String(doc.id), email: (doc as any).email } as any;
};

export const repointAccount = async (accountId: string, winnerId: string, winnerSupabaseId: string | null): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.update({
            collection: 'accounts',
            id: accountId,
            data: {
                customer: Number(winnerId),
                ...(winnerSupabaseId ? { user_id: winnerSupabaseId } : {}),
                source: 'qore',
            },
            overrideAccess: true
        });
        console.log(`[Repoint] Account ${accountId} re-pointed to customer ${winnerId}`);
        return true;
    } catch (e: any) {
        console.error('[Repoint] Failed:', e.message);
        throw e;
    }
};

export const repointDigitalIdentity = async (customerId: string, supabaseId: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        const customer = await payload.findByID({ collection: 'customers', id: customerId });
        if (!customer) throw new Error('Customer not found');

        console.log(`[Surgical-Bridge] Re-pointing identity ${supabaseId} to customer ${customerId}`);
        
        // We leverage the enhanced executeCustomerMerge which now auto-detects losers
        const result = await executeCustomerMerge({
            primaryCustomerId: customerId,
            targetId: supabaseId,
            isCustomerToCustomer: false,
            profileData: {
                firstName: customer.firstName,
                lastName: customer.lastName,
                email: customer.email,
                phone_number: customer.phone_number
            }
        });

        return result.success;
    } catch (e: any) {
        console.error('[Surgical-Bridge] Failed:', e.message);
        throw e;
    }
};

export const processAccountFunding = async (targetAccountId: string, amountNaira: number, reference?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const payload = await initPayload();
        const env: any = { payload, executionId: `DEP-${Date.now()}`, inputs: { targetAccountId, amountNaira, reference: reference || `DEP-${Date.now()}` }, outputs: {}, getInput: (key: string) => env.inputs[key], setOutput: (key: string, val: any) => { env.outputs[key] = val }, log: { info: console.log, error: console.error, warn: console.warn, debug: console.log } };
        const success = await FundAccountExecutor(env);
        return { success, data: env.outputs };
    } catch (err: any) { return { success: false, error: err.message }; }
};

export const getBeneficiaryById = async (id: string): Promise<Beneficiary | null> => {
    try {
        const payload = await initPayload();
        const doc: any = await payload.findByID({ collection: 'beneficiaries' as any, id, overrideAccess: true });
        if (!doc) return null;
        return {
            id: String(doc.id),
            account_name: doc.account_name,
            account_number: doc.account_number,
            bank_name: doc.bank_name,
            bank_code: doc.bank_code,
            is_international: doc.is_international,
            swift_code: doc.swift_code,
            country: doc.country,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as Beneficiary;
    } catch (e) {
        console.error('Payload getBeneficiaryById Error:', e);
        return null;
    }
};

export const reprovisionApplication = async (applicationId: string): Promise<{ accountNumber?: string }> => {
    const payload = await initPayload();
    const doc = await payload.findByID({ collection: 'product-applications' as any, id: applicationId });

    if (!doc) throw new Error('Application not found');

    const { ProvisionAccountExecutor } = await import('@/lib/workflow/executor/ProvisionAccountExecutor');
    const env: any = {
        payload,
        executionId: `MANUAL-${Date.now()}`,
        inputs: {
            user_id: doc.user_id,
            application_id: doc.id,
        },
        outputs: {},
        getInput: (key: string) => env.inputs[key],
        setOutput: (key: string, val: any) => { env.outputs[key] = val },
        log: { info: (m: string) => payload.logger.info(m), error: (m: string) => payload.logger.error(m) }
    };

    const success = await ProvisionAccountExecutor(env);

    if (!success) {
        throw new Error('Banking synchronization failed. Please check the server logs or verify your banking configuration.');
    }

    // Fetch the updated account info
    const { docs: accounts } = await payload.find({
        collection: 'accounts' as any,
        where: { user_id: { equals: doc.user_id } },
        limit: 1,
        sort: '-createdAt'
    });

    return { accountNumber: accounts[0]?.account_number };
};
