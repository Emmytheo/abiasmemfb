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
        return { id: String(doc.id), user_id: doc.user_id, amount: (doc.principal ?? 0) / 100, status: doc.status, customer: doc.customer } as any;
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
        const { docs } = await payload.find({ collection: 'product-types' as any, depth: 1, limit: 0 });
        return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name, category: typeof doc.category === 'object' && doc.category ? doc.category.name : doc.category, status: doc.status, created_at: doc.createdAt })) as any;
    } catch (e) { return []; }
};

export const getProductTypeById = async (id: string): Promise<ProductType | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ collection: 'product-types' as any, id, depth: 1 });
        return { id: String(doc.id), name: (doc as any).name, category: typeof (doc as any).category === 'object' && (doc as any).category ? String((doc as any).category.id) : String((doc as any).category), status: (doc as any).status, created_at: doc.createdAt } as any;
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
    const { docs } = await payload.find({ collection: 'product-applications' as any, where: { user_id: { equals: userId } }, depth: 1 });
    return docs.map((doc: any) => ({ id: String(doc.id), user_id: doc.user_id, status: doc.status })) as any;
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
    return docs.map((doc: any) => ({ id: String(doc.id), amount: (doc.amount ?? 0) / 100, type: doc.type, status: doc.status, created_at: doc.createdAt })) as any;
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    const accounts = await getUserAccounts(userId);
    if (!accounts.length) return [];
    const accountIds = accounts.map(a => a.id);
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { or: [{ from_account: { in: accountIds } }, { to_account: { in: accountIds } }] }, depth: 1, limit: 200, sort: '-createdAt', overrideAccess: true });
    return docs.map((doc: any) => ({ id: String(doc.id), amount: (doc.amount ?? 0) / 100, status: doc.status })) as any;
};

export const getLoanTransactions = async (loanId: string): Promise<Transaction[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { loan: { equals: loanId } }, depth: 1, limit: 200, sort: '-createdAt', overrideAccess: true });
    return docs.map((doc: any) => ({ id: String(doc.id), amount: (doc.amount ?? 0) / 100 })) as any;
};

export const getAccountTransactions = async (accountId: string): Promise<Transaction[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { or: [{ from_account: { equals: accountId } }, { to_account: { equals: accountId } }] }, depth: 1, limit: 200, sort: '-createdAt', overrideAccess: true });
    return docs.map((doc: any) => ({ id: String(doc.id), amount: (doc.amount ?? 0) / 100 })) as any;
};

export const getTransactionById = async (id: string | number): Promise<Transaction | null> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'transactions' as any, where: { id: { equals: id } }, depth: 2, limit: 1, overrideAccess: true });
    return docs.length ? { id: String(docs[0].id), amount: (docs[0].amount ?? 0) / 100 } as any : null;
};

export const getTransactionsByCategory = async (category: Transaction['category']): Promise<Transaction[]> => [];

// ==========================================
// SERVICES & INTEGRATIONS
// ==========================================

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'service-categories' as any, where: { status: { equals: 'active' } }, limit: 100 });
    return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name, status: doc.status })) as any;
};

export const getServicesByCategory = async (categorySlug: string): Promise<Service[]> => {
    const payload = await initPayload();
    const { docs: cats } = await payload.find({ collection: 'service-categories' as any, where: { slug: { equals: categorySlug } }, limit: 1 });
    if (!cats.length) return [];
    const { docs } = await payload.find({ collection: 'services' as any, where: { and: [{ category: { equals: cats[0].id } }, { status: { equals: 'active' } }] }, depth: 1, limit: 200 });
    return docs.map((doc: any) => ({ id: String(doc.id), name: doc.name, status: doc.status })) as any;
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
    const payload = await initPayload();
    const { docs } = await payload.find({ collection: 'posts' as any, depth: 2 });
    return docs.map((doc: any) => ({ id: String(doc.id), title: doc.title, slug: doc.slug })) as any;
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
            const records = await payload.find({ collection: col as any, where: { customer: { equals: loserId } }, limit: 1000, overrideAccess: true });
            for (const doc of records.docs) {
                const updateData: any = { customer: winnerId };
                // transactions does not have a user_id field, but accounts and loans do.
                if (winnerSupabaseId && col !== 'transactions') {
                    updateData.user_id = winnerSupabaseId;
                }
                await payload.update({ collection: col as any, id: doc.id, data: updateData, overrideAccess: true });
            }
        }
        if (winnerSupabaseId && loserSupabaseId) {
            // Re-point product applications
            const apps = await payload.find({ collection: 'product-applications', where: { user_id: { equals: loserSupabaseId } }, limit: 1000, overrideAccess: true });
            for (const doc of apps.docs) await payload.update({ collection: 'product-applications', id: doc.id, data: { user_id: winnerSupabaseId }, overrideAccess: true });
            
            // Re-point beneficiaries
            const beneficiaries = await payload.find({ collection: 'beneficiaries', where: { user: { equals: loserSupabaseId } }, limit: 1000, overrideAccess: true });
            for (const doc of beneficiaries.docs) await payload.update({ collection: 'beneficiaries', id: doc.id, data: { user: winnerSupabaseId }, overrideAccess: true });
        }
        archivedIds.push(loserId);
    }
    const finalSupabaseId = supabaseId || (targetCustomer?.supabase_id || primary.supabase_id);
    await payload.update({ collection: 'customers', id: winnerId, data: { ...profileData, supabase_id: finalSupabaseId, is_associated: !!finalSupabaseId, merger_status: 'primary', active: true, is_archived: false } as any, overrideAccess: true });
    return { success: true, mergedRecords: archivedIds.length, archivedIds };
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

export const mergeCustomers = async (params: { primaryCustomerId: string; supabaseUserId: string; profileData: any; selectedAccountNumbers: string[]; isCustomerToCustomer?: boolean; keepTargetAsPrimary?: boolean; }) => {
    const result = await executeCustomerMerge({ primaryCustomerId: params.primaryCustomerId, targetId: params.supabaseUserId, isCustomerToCustomer: !!params.isCustomerToCustomer, profileData: params.profileData, selectedAccountNumbers: params.selectedAccountNumbers, keepTargetAsPrimary: params.keepTargetAsPrimary });
    const winnerId = params.keepTargetAsPrimary && params.isCustomerToCustomer ? params.supabaseUserId : params.primaryCustomerId;
    await syncCustomerToQore(winnerId, params.profileData);
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
        const res = await fetch(resolved.url, { method: resolved.method, headers: resolved.headers });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data.Accounts || []);
    } catch (e) { return []; }
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
