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
    CustomerAudit 
} from '../../types';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { lexicalToHtml } from '@/lib/utils/lexical-to-html';
import { executeWorkflow } from '@/lib/workflow/executeWorkflow';
import { FundAccountExecutor } from '@/lib/workflow/executor/FundAccountExecutor';

const initPayload = async () => {
    if (!process.env.DATABASE_URI) {
        throw new Error('CRITICAL ERROR: DATABASE_URI is missing from your .env.local file.');
    }
    return await getPayload({ config: configPromise });
}

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
            metadata: doc.metadata,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as Customer;
    } catch (e) {
        console.error('Payload getCustomerById Error:', e);
        return null;
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

export const updateCustomer = async (id: string, data: Partial<Customer>): Promise<Customer> => {
    try {
        const payload = await initPayload();
        const doc = await payload.update({
            collection: 'customers' as any,
            id,
            data: data as any,
            overrideAccess: true,
        });
        return {
            id: String(doc.id),
            firstName: (doc as any).firstName,
            lastName: (doc as any).lastName,
            email: (doc as any).email,
            phone_number: (doc as any).phone_number,
            bvn: (doc as any).bvn,
            qore_customer_id: (doc as any).qore_customer_id,
            supabase_id: (doc as any).supabase_id,
            kyc_status: (doc as any).kyc_status,
            risk_tier: (doc as any).risk_tier,
            is_associated: (doc as any).is_associated,
            is_test_account: (doc as any).is_test_account,
            is_archived: (doc as any).is_archived,
            merger_status: (doc as any).merger_status,
            address: (doc as any).address,
            metadata: (doc as any).metadata,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as Customer;
    } catch (e) {
        console.error('Payload updateCustomer Error:', e);
        throw e;
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
            created_at: doc.createdAt,
        })) as Account[];
    } catch (e) { return []; }
};

export const getUserAccounts = async (userId: string): Promise<Account[]> => {
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
            collection: 'accounts' as any,
            where: { or: [{ user_id: { equals: userId } }, ...(customerId ? [{ customer: { equals: customerId } }] : [])] },
            depth: 2,
            limit: 100,
            sort: '-createdAt',
            overrideAccess: true,
        });
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
            created_at: doc.createdAt,
        })) as Account[];
    } catch (e) { return []; }
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
            created_at: doc.createdAt,
        } as Account;
    } catch (e) { return null; }
};

export const createAccount = async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'accounts' as any, data: { user_id: data.user_id, account_number: data.account_number, account_type: data.account_type, balance: Math.round(data.balance * 100), status: data.status, customer: data.customer } as any });
    return { id: String(doc.id), account_number: (doc as any).account_number } as any;
};

export const updateAccount = async (id: string, data: Partial<Account>): Promise<Account | null> => {
    try {
        const payload = await initPayload();
        const updateData: any = { ...data };
        if (data.lien_amount !== undefined) updateData.lien_amount = Math.round(data.lien_amount * 100);
        if (data.balance !== undefined) updateData.balance = Math.round(data.balance * 100);
        const doc = await payload.update({ collection: 'accounts' as any, id, data: updateData, overrideAccess: true });
        return { id: String(doc.id), balance: ((doc as any).balance ?? 0) / 100 } as any;
    } catch (e) { return null; }
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
            id: String(doc.id),
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
            id: String(doc.id),
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
    return { id: String(doc.id), user_id: (doc as any).user_id, status: (doc as any).status } as any;
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
        id: String(doc.id),
        user_id: doc.user_id,
        product_type: doc.product_type,
        status: doc.status,
        created_at: doc.createdAt,
        metadata: doc.metadata
    } as any)) as ProductApplication[];
};

export const getAllApplications = async (): Promise<ProductApplication[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'product-applications' as any, depth: 1 });
    return docs.map((doc: any) => ({ id: String(doc.id), user_id: doc.user_id, status: doc.status })) as any;
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
    const accounts = await getUserAccounts(userId);
    if (!accounts.length) return [];
    const accountIds = accounts.map(a => a.id);
    const payload = await initPayload();
    const { docs } = await payload.find({ 
        collection: 'transactions' as any, 
        where: { or: [{ from_account: { in: accountIds } }, { to_account: { in: accountIds } }] }, 
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
    const { docs } = await payload.find({ collection: 'service-categories' as any, where: { status: { equals: 'active' } }, limit: 100 });
    return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name || 'Service', slug: doc.slug || 'category', status: doc.status || 'active' })) as any;
};

export const getServicesByCategory = async (categorySlug: string): Promise<Service[]> => {
    const payload = await initPayload();
    const { docs: cats } = await payload.find({ collection: 'service-categories' as any, where: { slug: { equals: categorySlug } }, limit: 1 });
    if (!cats.length) return [];
    const { docs } = await payload.find({ collection: 'services' as any, where: { and: [{ category: { equals: cats[0].id } }, { status: { equals: 'active' } }] }, depth: 1, limit: 200 });
    return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name || 'Service', status: doc.status || 'active' })) as any;
};

export const getAllServices = async (): Promise<Service[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'services' as any, depth: 1, limit: 500 });
    return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name })) as any;
};

export const createServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'created_at'>): Promise<ServiceCategory> => {
    const payload = await initPayload();
    const doc = await payload.create({ collection: 'service-categories' as any, data: data as any });
    return { ...data, id: String(doc.id) } as any;
};

export const updateServiceCategory = async (id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> => {
    const payload = await initPayload();
    const doc = await payload.update({ collection: 'service-categories' as any, id, data: data as any });
    return { id: String(doc.id), name: (doc as any).name } as any;
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
    const doc = await payload.update({ collection: 'services' as any, id, data: data as any });
    return { id: String(doc.id), name: (doc as any).name } as any;
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

export const getBlogPosts = async (): Promise<BlogPost[]> => {
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
    return docs[0] as any;
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
    const winnerId = keepTargetAsPrimary && isCustomerToCustomer ? targetId : primaryCustomerId;
    const loserId = keepTargetAsPrimary && isCustomerToCustomer ? primaryCustomerId : (isCustomerToCustomer ? targetId : null);
    const supabaseId = isCustomerToCustomer ? null : targetId;
    const primary = await payload.findByID({ collection: 'customers', id: primaryCustomerId });
    let targetCustomer = null;
    if (isCustomerToCustomer) targetCustomer = await payload.findByID({ collection: 'customers', id: targetId });
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
                    const updateData: any = { customer: String(winnerId) };
                    // transactions does not have a user_id field, but accounts and loans do.
                    if (winnerSupabaseId) {
                        updateData.user_id = winnerSupabaseId;
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

        if (winnerSupabaseId && loserSupabaseId) {
            try {
                // Re-point product applications (string-based user_id)
                console.log(`[Bridge] Re-pointing product applications from ${loserSupabaseId} to ${winnerSupabaseId}`);
                const apps = await payload.find({ collection: 'product-applications', where: { user_id: { equals: loserSupabaseId } }, limit: 1000, overrideAccess: true });
                for (const doc of apps.docs) await payload.update({ collection: 'product-applications', id: doc.id, data: { user_id: winnerSupabaseId }, overrideAccess: true });
                
                // Re-point beneficiaries (relates to numeric Payload Users)
                const winningUsers = await payload.find({ collection: 'users', where: { supabase_id: { equals: winnerSupabaseId } }, limit: 1, overrideAccess: true });
                const losingUsers = await payload.find({ collection: 'users', where: { supabase_id: { equals: loserSupabaseId } }, limit: 1, overrideAccess: true });
                
                if (winningUsers.docs.length > 0 && losingUsers.docs.length > 0) {
                    const winnerUserId = winningUsers.docs[0].id;
                    const loserUserId = losingUsers.docs[0].id;
                    console.log(`[Bridge] Re-pointing beneficiaries from User ${loserUserId} to ${winnerUserId}`);
                    const beneficiaries = await payload.find({ collection: 'beneficiaries', where: { user: { equals: loserUserId } }, limit: 1000, overrideAccess: true });
                    for (const doc of beneficiaries.docs) await payload.update({ collection: 'beneficiaries', id: doc.id, data: { user: winnerUserId }, overrideAccess: true });
                }
            } catch (e: any) {
                console.warn(`Bridge Digital Asset Re-pointing Warning:`, e.message);
            }
        }
        archivedIds.push(loserId);
    }
    const finalSupabaseId = supabaseId || (targetCustomer?.supabase_id || primary.supabase_id);
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
            const accountNo = qoreAccount.AccountNumber || qoreAccount.accountNumber;
            if (!accountNo) continue;
            
            const existing = legacyAccounts.docs.find((a: any) => a.account_number === accountNo);
            
            // Sync metadata using available info (Class/Category/Type/Code)
            const productTypeId = await syncProductMetadata(payload, qoreAccount);

            // Normalize Account Type (Qore often returns 'SavingsOrCurrent')
            let normalizedType: string = qoreAccount.AccountType || qoreAccount.accountType || 'Savings';
            if (normalizedType.includes('Savings')) normalizedType = 'Savings';
            else if (normalizedType.includes('Current')) normalizedType = 'Current';
            else if (normalizedType.includes('Deposit')) normalizedType = 'Fixed Deposit';
            else normalizedType = 'Savings';

            const accountData: any = {
                customer: Number(winnerId),
                // CRITICAL: Dashboard access (AccountDetailsPage:46) requires the user_id to match Supabase UUID
                user_id: winnerSupabaseId || qoreAccount.Email || qoreAccount.CustomerID, 
                account_number: accountNo,
                account_type: normalizedType,
                balance: Math.round(parseFloat((qoreAccount.AvailableBalance || qoreAccount.availableBalance || '0').replace(/,/g, '')) * 100),
                status: (qoreAccount.Status || qoreAccount.accountStatus || 'active').toLowerCase(),
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
        const syncedAccountNumbers = accounts.map(a => a.AccountNumber || a.accountNumber).filter(Boolean);
        for (const legacy of legacyAccounts.docs) {
            if (!syncedAccountNumbers.includes(legacy.account_number)) {
                await payload.update({
                    collection: 'accounts',
                    id: legacy.id,
                    data: {
                        customer: String(winnerId),
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
    const selectedAccounts = qoreAccounts.filter(a => params.selectedAccountNumbers.includes(a.AccountNumber || a.accountNumber));
    
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
        const accountNumbers = qoreAccounts.map((a: any) => a.AccountNumber || a.accountNumber).filter(Boolean);

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

export const processAccountFunding = async (targetAccountId: string, amountNaira: number, reference?: string): Promise<{ success: boolean; data?: any; error?: string }> => {
    try {
        const payload = await initPayload();
        const env: any = { payload, executionId: `DEP-${Date.now()}`, inputs: { targetAccountId, amountNaira, reference: reference || `DEP-${Date.now()}` }, outputs: {}, getInput: (key: string) => env.inputs[key], setOutput: (key: string, val: any) => { env.outputs[key] = val }, log: { info: console.log, error: console.error, warn: console.warn, debug: console.log } };
        const success = await FundAccountExecutor(env);
        return { success, data: env.outputs };
    } catch (err: any) { return { success: false, error: err.message }; }
};
