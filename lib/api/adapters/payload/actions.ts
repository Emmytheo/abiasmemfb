"use server";

import { createClient } from '@supabase/supabase-js';

import { User, Account, Loan, ProductType, ProductClass, ProductCategory, ProductApplication, Transaction, SystemConfig, BlogPost, JobPosition, ServiceCategory, Service, Beneficiary } from '../../types';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { lexicalToHtml } from '@/lib/utils/lexical-to-html';
import { executeWorkflow } from '@/lib/workflow/executeWorkflow';

// Helper to initialize Payload Local API
const initPayload = async () => {
    if (!process.env.DATABASE_URI) {
        throw new Error('CRITICAL ERROR: DATABASE_URI is missing from your .env.local file. If you just added it, PLEASE RESTART YOUR NEXT.JS DEV SERVER.');
    }
    return await getPayload({ config: configPromise });
}

export const getCurrentUser = async (): Promise<User | null> => null;

export const getAllUsers = async (): Promise<User[]> => {
    try {
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Missing Supabase configuration. Cannot fetch users.");
            return [];
        }

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            {
                auth: { persistSession: false, autoRefreshToken: false },
            }
        );

        // Using pages to bypass the default 50 limits (if an app gets large)
        // For now, limiting to 250 users
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


// Product Configuration & Dynamic Forms
export const getAllProductClasses = async (): Promise<ProductClass[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'product-classes' as any });
        return docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            description: doc.description,
            status: doc.status,
            created_at: doc.createdAt,
        }));
    } catch (e) {
        console.error("Payload getAllProductClasses Error:", e);
        return [];
    }
};

export const createProductClass = async (data: Omit<ProductClass, 'id' | 'created_at'>): Promise<ProductClass> => {
    try {
        const payload = await initPayload();
        const doc = await payload.create({
            collection: 'product-classes' as any,
            data: data as any,
        });
        return {
            id: doc.id,
            name: (doc as any).name,
            description: (doc as any).description,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as ProductClass;
    } catch (e) {
        console.error("Payload createProductClass Error:", e);
        throw e;
    }
};

export const updateProductClass = async (id: string, data: Partial<ProductClass>): Promise<ProductClass> => {
    try {
        const payload = await initPayload();
        const doc = await payload.update({
            collection: 'product-classes' as any,
            id,
            data: data as any,
        });
        return {
            id: doc.id,
            name: (doc as any).name,
            description: (doc as any).description,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as ProductClass;
    } catch (e) {
        console.error("Payload updateProductClass Error:", e);
        throw e;
    }
};

export const deleteProductClass = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-classes' as any, id });
        return true;
    } catch (e) {
        console.error("Payload deleteProductClass Error:", e);
        return false;
    }
};

export const getAllProductCategories = async (): Promise<ProductCategory[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({ collection: 'product-categories' as any, depth: 1 });
        return docs.map((doc: any) => ({
            id: doc.id,
            class_id: typeof doc.class_id === 'object' ? doc.class_id.name : doc.class_id,
            name: doc.name,
            description: doc.description,
            status: doc.status,
            created_at: doc.createdAt,
        }));
    } catch (e) {
        console.error("Payload getAllProductCategories Error:", e);
        return [];
    }
};

export const createProductCategory = async (data: Omit<ProductCategory, 'id' | 'created_at'>): Promise<ProductCategory> => {
    try {
        const payload = await initPayload();

        // Find class by name to get its actual ID before creating.
        const classes = await payload.find({
            collection: 'product-classes' as any,
            where: { name: { equals: data.class_id } },
            limit: 1,
        });

        const classRefId = classes.docs.length > 0 ? (classes.docs[0] as any).id : data.class_id;

        const doc = await payload.create({
            collection: 'product-categories' as any,
            data: {
                name: data.name,
                class_id: classRefId,
                description: data.description,
                status: data.status
            } as any,
        });
        return {
            id: doc.id,
            class_id: data.class_id,
            name: (doc as any).name,
            description: (doc as any).description,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as ProductCategory;
    } catch (e) {
        console.error("Payload createProductCategory Error:", e);
        throw e;
    }
};

export const updateProductCategory = async (id: string, data: Partial<ProductCategory>): Promise<ProductCategory> => {
    try {
        const payload = await initPayload();
        let classRefId = data.class_id;

        if (data.class_id) {
            const classes = await payload.find({
                collection: 'product-classes' as any,
                where: { name: { equals: data.class_id } },
                limit: 1,
            });
            if (classes.docs.length > 0) {
                classRefId = (classes.docs[0] as any).id;
            }
        }

        const submitData = { ...data };
        if (classRefId) submitData.class_id = classRefId;

        const doc = await payload.update({
            collection: 'product-categories' as any,
            id,
            data: submitData as any,
        });
        return {
            id: doc.id,
            class_id: typeof (doc as any).class_id === 'object' ? (doc as any).class_id.name : (doc as any).class_id,
            name: (doc as any).name,
            description: (doc as any).description,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as ProductCategory;
    } catch (e) {
        console.error("Payload updateProductCategory Error:", e);
        throw e;
    }
};

export const deleteProductCategory = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-categories' as any, id });
        return true;
    } catch (e) {
        console.error("Payload deleteProductCategory Error:", e);
        return false;
    }
};

export const getAllProductTypes = async (): Promise<ProductType[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'product-types' as any,
            depth: 1, // Ensure the category relationship is expanded
        });
        return docs.map((doc: any) => ({
            id: doc.id,
            name: doc.name,
            category: typeof doc.category === 'object' && doc.category ? doc.category.name || doc.category.id : doc.category,
            tagline: doc.tagline,
            description: doc.description,
            status: doc.status,
            financial_terms: doc.financial_terms || [],
            image_url: doc.image_url,
            form_schema: doc.form_schema || [],
            // Map Payload array-of-object format [{stage: string}] to string[]
            workflow_stages: Array.isArray(doc.workflow_stages)
                ? doc.workflow_stages.map((s: any) => s.stage || s).filter(Boolean)
                : ['Submitted', 'Under Review', 'Approved'],
            created_at: doc.createdAt,
        })) as ProductType[];
    } catch (e) {
        console.error("Payload getAllProductTypes Error:", e);
        return [];
    }
};

export const getProductTypeById = async (id: string): Promise<ProductType | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({ collection: 'product-types' as any, id, depth: 1 });
        return {
            id: doc.id,
            name: doc.name,
            category: typeof doc.category === 'object' && doc.category ? String((doc.category as any).id) : String(doc.category),
            tagline: doc.tagline,
            description: doc.description,
            status: doc.status,
            financial_terms: doc.financial_terms || [],
            image_url: doc.image_url,
            form_schema: doc.form_schema || [],
            // Map Payload array-of-object format [{stage: string}] to string[]
            workflow_stages: Array.isArray(doc.workflow_stages)
                ? doc.workflow_stages.map((s: any) => s.stage || s).filter(Boolean)
                : ['Submitted', 'Under Review', 'Approved'],
            created_at: doc.createdAt,
        } as ProductType;
    } catch (e) {
        console.error("Payload getProductTypeById Error:", e);
        return null;
    }
};

export const saveProductType = async (data: ProductType): Promise<ProductType> => {
    try {
        const payload = await initPayload();

        let submitData: any = {
            name: data.name,
            category: typeof data.category === 'string' && data.category.trim() !== '' && !isNaN(Number(data.category)) ? Number(data.category) : data.category,
            tagline: data.tagline,
            description: data.description,
            status: data.status,
            financial_terms: data.financial_terms,
            form_schema: data.form_schema,
            workflow_stages: data.workflow_stages || ['Submitted'],
            image_url: data.image_url, // Now safe to stringly submit
        };

        let doc;
        if (data.id && !String(data.id).startsWith('type_')) {
            // Update existing record
            doc = await payload.update({
                collection: 'product-types' as any,
                id: data.id,
                data: submitData
            });
        } else {
            // Create new record
            doc = await payload.create({
                collection: 'product-types' as any,
                data: submitData
            });
        }

        return {
            id: doc.id,
            name: doc.name,
            category: typeof doc.category === 'object' && doc.category ? doc.category.name || (doc.category as any).id : doc.category,
            tagline: doc.tagline,
            description: doc.description,
            status: doc.status,
            financial_terms: doc.financial_terms || [],
            image_url: doc.image_url,
            form_schema: doc.form_schema || [],
            workflow_stages: Array.isArray(doc.workflow_stages)
                ? doc.workflow_stages.map((s: any) => s.stage || s).filter(Boolean)
                : ['Submitted', 'Under Review', 'Approved'],
            created_at: doc.createdAt,
        } as ProductType;
    } catch (e) {
        console.error("Payload saveProductType Error:", e);
        throw e;
    }
};

export const deleteProductType = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'product-types' as any, id });
        return true;
    } catch (e) {
        console.error("Payload deleteProductType Error:", e);
        return false;
    }
};

export const createProductApplication = async (data: Omit<ProductApplication, 'id' | 'created_at' | 'updated_at'>): Promise<ProductApplication> => {
    try {
        const payload = await initPayload();

        // Convert the string product_type_id to the relational lookup if it starts with type_
        // Product application usually requires the document ID, not just slug
        const doc = await payload.create({
            collection: 'product-applications' as any,
            data: {
                user_id: data.user_id,
                product_type_id: data.product_type_id,
                status: data.status,
                workflow_stage: data.workflow_stage,
                submitted_data: data.submitted_data,
                requested_amount: data.requested_amount,
            } as any,
        });

        return {
            id: doc.id,
            user_id: (doc as any).user_id,
            product_type_id: typeof (doc as any).product_type_id === 'object' ? (doc.product_type_id as any).id || (doc as any).product_type_id : (doc as any).product_type_id,
            status: (doc as any).status,
            workflow_stage: (doc as any).workflow_stage,
            submitted_data: (doc as any).submitted_data,
            requested_amount: (doc as any).requested_amount,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as ProductApplication;
    } catch (e) {
        console.error("Payload createProductApplication Error:", e);
        throw e;
    }
};

export const updateApplication = async (id: string, data: Partial<ProductApplication>): Promise<ProductApplication> => {
    try {
        const payload = await initPayload();

        let submitData = { ...data };

        const doc = await payload.update({
            collection: 'product-applications' as any,
            id,
            data: submitData as any,
        });

        return {
            id: doc.id,
            user_id: (doc as any).user_id,
            product_type_id: typeof (doc as any).product_type_id === 'object' ? (doc.product_type_id as any).id || (doc as any).product_type_id : (doc as any).product_type_id,
            status: (doc as any).status,
            workflow_stage: (doc as any).workflow_stage,
            submitted_data: (doc as any).submitted_data,
            requested_amount: (doc as any).requested_amount,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as ProductApplication;
    } catch (e) {
        console.error("Payload updateApplication Error:", e);
        throw e;
    }
};

export const getUserApplications = async (userId: string): Promise<ProductApplication[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'product-applications' as any,
            where: {
                user_id: { equals: userId }
            },
            depth: 1, // Get associated product type data
        });

        return docs.map((doc: any) => ({
            id: doc.id,
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type_id === 'object' && doc.product_type_id ? doc.product_type_id.id || doc.product_type_id.name : doc.product_type_id,
            status: doc.status,
            workflow_stage: doc.workflow_stage,
            submitted_data: doc.submitted_data,
            requested_amount: doc.requested_amount,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        })) as ProductApplication[];
    } catch (e) {
        console.error("Payload getUserApplications Error:", e);
        return [];
    }
};

export const getAllApplications = async (): Promise<ProductApplication[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'product-applications' as any,
            depth: 1,
        });

        return docs.map((doc: any) => ({
            id: doc.id,
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type_id === 'object' && doc.product_type_id ? doc.product_type_id.id || doc.product_type_id.name : doc.product_type_id,
            status: doc.status,
            workflow_stage: doc.workflow_stage,
            submitted_data: doc.submitted_data,
            requested_amount: doc.requested_amount,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        })) as ProductApplication[];
    } catch (e) {
        console.error("Payload getAllApplications Error:", e);
        return [];
    }
};
export const getAllAccounts = async (): Promise<Account[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'accounts' as any,
            depth: 1,
            limit: 200,
            sort: '-createdAt',
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            account_number: doc.account_number,
            account_type: doc.account_type,
            balance: (doc.balance ?? 0) / 100, // convert kobo → Naira for UI
            status: doc.status,
            created_at: doc.createdAt,
        })) as Account[];
    } catch (e) {
        console.error('Payload getAllAccounts Error:', e);
        return [];
    }
};

export const createAccount = async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> => {
    try {
        const payload = await initPayload();
        const doc = await payload.create({
            collection: 'accounts' as any,
            data: {
                user_id: data.user_id,
                account_number: data.account_number,
                account_type: data.account_type,
                balance: Math.round(data.balance * 100), // Naira to Kobo
                status: data.status,
            } as any,
        });

        return {
            id: String(doc.id),
            user_id: (doc as any).user_id,
            account_number: (doc as any).account_number,
            account_type: (doc as any).account_type,
            balance: ((doc as any).balance ?? 0) / 100,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as Account;
    } catch (e) {
        console.error("Payload createAccount Error:", e);
        throw e;
    }
};

export const getAllLoans = async (): Promise<Loan[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'loans' as any,
            depth: 1,
            limit: 200,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type === 'object' ? doc.product_type?.id : doc.product_type,
            amount: (doc.principal ?? 0) / 100,          // kobo → Naira
            interest_rate: doc.interest_rate ?? 0,
            duration_months: doc.duration_months ?? 0,
            outstanding_balance: (doc.outstanding_balance ?? 0) / 100,
            monthly_installment: (doc.monthly_installment ?? 0) / 100,
            next_payment_date: doc.next_payment_date,
            maturity_date: doc.maturity_date,
            status: doc.status || 'pending',
            created_at: doc.createdAt,
        })) as Loan[];
    } catch (e) {
        console.error('Payload getAllLoans Error:', e);
        return [];
    }
};

export const createLoan = async (data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>): Promise<Loan> => {
    try {
        const payload = await initPayload();
        const doc = await payload.create({
            collection: 'loans' as any,
            data: {
                user_id: data.user_id,
                product_type: data.product_type_id, // Note: payload field is product_type
                principal: Math.round(data.amount * 100),
                interest_rate: data.interest_rate,
                duration_months: data.duration_months,
                outstanding_balance: Math.round((data.outstanding_balance ?? 0) * 100),
                monthly_installment: Math.round((data.monthly_installment ?? 0) * 100),
                next_payment_date: data.next_payment_date,
                maturity_date: data.maturity_date,
                status: data.status,
            } as any,
        });

        return {
            id: String(doc.id),
            user_id: (doc as any).user_id,
            product_type_id: typeof (doc as any).product_type === 'object' ? (doc as any).product_type.id : (doc as any).product_type,
            amount: ((doc as any).principal ?? 0) / 100,
            interest_rate: (doc as any).interest_rate ?? 0,
            duration_months: (doc as any).duration_months ?? 0,
            outstanding_balance: ((doc as any).outstanding_balance ?? 0) / 100,
            monthly_installment: ((doc as any).monthly_installment ?? 0) / 100,
            next_payment_date: (doc as any).next_payment_date,
            maturity_date: (doc as any).maturity_date,
            status: (doc as any).status,
            created_at: doc.createdAt,
        } as Loan;
    } catch (e) {
        console.error("Payload createLoan Error:", e);
        throw e;
    }
};

export const getUserAccounts = async (userId: string): Promise<Account[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'accounts' as any,
            where: { user_id: { equals: userId } },
            depth: 1,
            limit: 100,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            account_number: doc.account_number,
            account_type: doc.account_type,
            balance: (doc.balance ?? 0) / 100, // kobo → Naira
            status: doc.status,
            created_at: doc.createdAt,
        })) as Account[];
    } catch (e) {
        console.error('Payload getUserAccounts Error:', e);
        return [];
    }
};

// ==========================================
// BENEFICIARY MANAGEMENT
// ==========================================

export const getUserBeneficiaries = async (userId: string): Promise<Beneficiary[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'beneficiaries' as any,
            where: { user: { equals: userId } },
            overrideAccess: true, // Securely bypassed on server since userId argument controls scope
            sort: '-updatedAt',
        });

        return docs.map((doc: any) => ({
            id: doc.id,
            user: typeof doc.user === 'object' ? doc.user.id : doc.user,
            account_name: doc.account_name,
            account_number: doc.account_number,
            bank_name: doc.bank_name,
            bank_code: doc.bank_code,
            currency: doc.currency,
            swift_code: doc.swift_code,
            routing_number: doc.routing_number,
            country: doc.country,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        }));
    } catch (e) {
        console.error("Payload getUserBeneficiaries Error:", e);
        return [];
    }
};

export const saveBeneficiary = async (data: Omit<Beneficiary, 'id' | 'created_at' | 'updated_at'>): Promise<Beneficiary> => {
    try {
        const payload = await initPayload();

        // Prevent duplicate beneficiaries based on account number & currency mapping for the same user
        const existing = await payload.find({
            collection: 'beneficiaries' as any,
            where: {
                and: [
                    { user: { equals: data.user } },
                    { account_number: { equals: data.account_number } },
                    { currency: { equals: data.currency } }
                ]
            },
            overrideAccess: true,
        });

        let doc;
        if (existing.docs.length > 0) {
            // Update the existing one (name might have changed or bank details refreshed)
            doc = await payload.update({
                collection: 'beneficiaries' as any,
                id: existing.docs[0].id,
                data: data as any,
                overrideAccess: true,
            });
        } else {
            // Create a new record
            doc = await payload.create({
                collection: 'beneficiaries' as any,
                data: data as any,
                overrideAccess: true,
            });
        }

        return {
            id: doc.id,
            ...data,
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as unknown as Beneficiary;
    } catch (e) {
        console.error("Payload saveBeneficiary Error:", e);
        throw e;
    }
}

export const deleteBeneficiary = async (id: string, userId: string): Promise<boolean> => {
    try {
        const payload = await initPayload();

        // Enforcement check to ensure only the owner can delete it
        const check = await payload.findByID({
            collection: 'beneficiaries' as any,
            id,
            overrideAccess: true
        });

        if (!check || (typeof check.user === 'object' ? check.user.id : check.user) !== userId) {
            throw new Error('Unauthorized or Beneficiary not found');
        }

        await payload.delete({
            collection: 'beneficiaries' as any,
            id,
            overrideAccess: true,
        });

        return true;
    } catch (e: any) {
        console.error("Payload deleteBeneficiary Error:", e.message);
        return false;
    }
}

// ==========================================
// END BENEFICIARY MANAGEMENT
// ==========================================

export const getAccountById = async (accountId: string): Promise<Account | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({
            collection: 'accounts' as any,
            id: accountId,
            depth: 1,
            overrideAccess: true,
        });
        if (!doc) return null;

        return {
            id: String(doc.id),
            user_id: doc.user_id,
            account_number: doc.account_number,
            account_type: doc.account_type,
            balance: (doc.balance ?? 0) / 100, // kobo → Naira
            status: doc.status,
            created_at: doc.createdAt,
        } as Account;
    } catch (e) {
        console.error('Payload getAccountById Error:', e);
        return null;
    }
};

export const getUserLoans = async (userId: string): Promise<Loan[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'loans' as any,
            where: { user_id: { equals: userId } },
            depth: 1,
            limit: 100,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: doc.user_id,
            product_type_id: typeof doc.product_type === 'object' ? doc.product_type?.id : doc.product_type,
            amount: (doc.principal ?? 0) / 100,          // kobo → Naira
            interest_rate: doc.interest_rate ?? 0,
            duration_months: doc.duration_months ?? 0,
            outstanding_balance: (doc.outstanding_balance ?? 0) / 100,
            monthly_installment: (doc.monthly_installment ?? 0) / 100,
            next_payment_date: doc.next_payment_date,
            maturity_date: doc.maturity_date,
            status: doc.status || 'pending',
            created_at: doc.createdAt,
        })) as Loan[];
    } catch (e) {
        console.error('Payload getUserLoans Error:', e);
        return [];
    }
};

export const getLoanById = async (loanId: string): Promise<Loan | null> => {
    try {
        const payload = await initPayload();
        const doc = await payload.findByID({
            collection: 'loans' as any,
            id: loanId,
            depth: 1,
        });
        if (!doc) return null;

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
        } as Loan;
    } catch (e) {
        console.error('Payload getLoanById Error:', e);
        return null;
    }
};

export const getAllTransactions = async (): Promise<Transaction[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'transactions' as any,
            depth: 1,
            limit: 500,
            sort: '-createdAt',
            overrideAccess: true,
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: typeof doc.to_account === 'object' ? doc.to_account?.user_id ?? '' : '',
            amount: (doc.amount ?? 0) / 100,
            type: doc.type === 'credit' || doc.type === 'disbursement' ? 'credit' : 'debit',
            category: 'Transfer' as Transaction['category'],
            status: doc.status,
            reference: doc.reference,
            narration: doc.narration,
            channel: doc.channel,
            created_at: doc.createdAt,
        })) as Transaction[];
    } catch (e) {
        console.error('Payload getAllTransactions Error:', e);
        return [];
    }
};

export const getTransactionById = async (id: string | number): Promise<Transaction | null> => {
    try {
        const payload = await initPayload();

        // Ensure ID is passed correctly, whether number or string
        const parsedId = isNaN(Number(id)) ? id : Number(id);

        const { docs } = await payload.find({
            collection: 'transactions' as any,
            where: {
                id: { equals: parsedId }
            },
            depth: 2,
            limit: 1,
            overrideAccess: true,
        });

        if (!docs || docs.length === 0) return null;
        const doc = docs[0];

        return {
            id: String(doc.id),
            user_id: typeof doc.to_account === 'object' && doc.to_account ? doc.to_account?.user_id ?? '' : '',
            amount: (doc.amount ?? 0) / 100,
            type: doc.type === 'credit' || doc.type === 'disbursement' ? 'credit' :
                doc.type === 'transfer' ? 'transfer' :
                    doc.type === 'repayment' ? 'repayment' :
                        doc.type === 'fee' ? 'fee' :
                            doc.type === 'interest' ? 'interest' : 'debit',
            category: doc.category || 'Transfer',
            status: doc.status,
            reference: doc.reference,
            narration: doc.narration,
            from_account: doc.from_account, // Retain full object due to depth: 2
            to_account: doc.to_account, // Retain full object due to depth: 2
            workflow_execution: doc.workflow_execution,
            balance_after: doc.balance_after !== undefined ? doc.balance_after / 100 : undefined,
            metadata: doc.metadata,
            created_at: doc.createdAt,
        } as Transaction;

    } catch (e) {
        console.error('Payload getTransactionById Error:', e);
        return null;
    }
};


export const getTransactionsByCategory = async (category: Transaction['category']): Promise<Transaction[]> => {
    const all = await getAllTransactions();
    return all.filter(t => t.category === category);
};

export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
    try {
        const payload = await initPayload();
        // 1. Get all user accounts
        const userAccounts = await getUserAccounts(userId);
        if (!userAccounts.length) return [];
        const accountIds = userAccounts.map(a => a.id);

        // 2. Fetch transactions where user is sender or receiver
        const { docs } = await payload.find({
            collection: 'transactions' as any,
            where: {
                or: [
                    { from_account: { in: accountIds } },
                    { to_account: { in: accountIds } }
                ]
            },
            depth: 1,
            limit: 200,
            sort: '-createdAt',
            overrideAccess: true,
        });

        return docs.map((doc: any) => ({
            id: String(doc.id),
            user_id: typeof doc.to_account === 'object' && doc.to_account ? doc.to_account?.user_id ?? '' : '',
            amount: (doc.amount ?? 0) / 100,
            type: doc.type === 'credit' || doc.type === 'disbursement' ? 'credit' :
                doc.type === 'transfer' ? 'transfer' :
                    doc.type === 'repayment' ? 'repayment' :
                        doc.type === 'fee' ? 'fee' :
                            doc.type === 'interest' ? 'interest' : 'debit',
            category: doc.category || 'Transfer',
            status: doc.status,
            reference: doc.reference,
            narration: doc.narration,
            created_at: doc.createdAt,
        })) as Transaction[];
    } catch (e) {
        console.error('Payload getUserTransactions Error:', e);
        return [];
    }
};

export const getServiceCategories = async (): Promise<ServiceCategory[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'service-categories' as any,
            where: { status: { equals: 'active' } },
            limit: 100,
            sort: 'name',
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            slug: doc.slug,
            description: doc.description,
            icon: doc.icon,
            status: doc.status,
            created_at: doc.createdAt,
        })) as ServiceCategory[];
    } catch (e) {
        console.error("Payload getServiceCategories Error:", e);
        return [];
    }
};

export const getServicesByCategory = async (categorySlug: string): Promise<Service[]> => {
    try {
        const payload = await initPayload();
        // 1. First find the category ID from the slug
        const { docs: catDocs } = await payload.find({
            collection: 'service-categories' as any,
            where: { slug: { equals: categorySlug } },
            limit: 1,
        });

        if (!catDocs.length) return [];

        const categoryId = catDocs[0].id;

        // 2. Fetch services belonging to this category
        const { docs } = await payload.find({
            collection: 'services' as any,
            where: {
                and: [
                    { category: { equals: categoryId } },
                    { status: { equals: 'active' } }
                ]
            },
            depth: 1,
            limit: 200,
            sort: 'name',
        });

        return docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            category: typeof doc.category === 'object' ? doc.category.id : doc.category,
            provider: typeof doc.provider === 'object' ? doc.provider?.id : doc.provider,
            provider_service_code: doc.provider_service_code,
            validation_workflow: typeof doc.validation_workflow === 'object' ? doc.validation_workflow?.id : doc.validation_workflow,
            execution_workflow: typeof doc.execution_workflow === 'object' ? doc.execution_workflow?.id : doc.execution_workflow,
            fee_type: doc.fee_type,
            fee_value: doc.fee_value,
            form_schema: doc.form_schema || [],
            status: doc.status,
            created_at: doc.createdAt,
        })) as Service[];
    } catch (e) {
        console.error("Payload getServicesByCategory Error:", e);
        return [];
    }
};

export const getAllServices = async (): Promise<Service[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'services' as any,
            depth: 1, // Get names of category/provider if needed
            limit: 500,
            sort: 'name',
        });
        return docs.map((doc: any) => ({
            id: String(doc.id),
            name: doc.name,
            category: typeof doc.category === 'object' ? doc.category.name : doc.category,
            provider: typeof doc.provider === 'object' ? doc.provider?.name : doc.provider,
            provider_service_code: doc.provider_service_code,
            validation_workflow: typeof doc.validation_workflow === 'object' ? doc.validation_workflow?.id : doc.validation_workflow,
            execution_workflow: typeof doc.execution_workflow === 'object' ? doc.execution_workflow?.id : doc.execution_workflow,
            fee_type: doc.fee_type,
            fee_value: doc.fee_value,
            form_schema: doc.form_schema || [],
            status: doc.status,
            created_at: doc.createdAt,
        })) as Service[];
    } catch (e) {
        console.error("Payload getAllServices Error:", e);
        return [];
    }
};

export const createServiceCategory = async (data: Omit<ServiceCategory, 'id' | 'created_at'>): Promise<ServiceCategory> => {
    try {
        const payload = await initPayload();
        const doc = await payload.create({
            collection: 'service-categories' as any,
            data: data as any,
        });
        return { ...data, id: String(doc.id), created_at: doc.createdAt } as ServiceCategory;
    } catch (e) {
        console.error("Payload createServiceCategory Error:", e);
        throw e;
    }
};

export const updateServiceCategory = async (id: string, data: Partial<ServiceCategory>): Promise<ServiceCategory> => {
    try {
        const payload = await initPayload();
        const doc = await payload.update({
            collection: 'service-categories' as any,
            id,
            data: data as any,
        });
        return {
            id: String(doc.id),
            name: doc.name,
            slug: doc.slug,
            description: doc.description,
            icon: doc.icon,
            status: doc.status,
            created_at: doc.createdAt,
        } as ServiceCategory;
    } catch (e) {
        console.error("Payload updateServiceCategory Error:", e);
        throw e;
    }
};

export const deleteServiceCategory = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'service-categories' as any, id });
        return true;
    } catch (e) {
        console.error("Payload deleteServiceCategory Error:", e);
        return false;
    }
};

export const createService = async (data: Omit<Service, 'id' | 'created_at'>): Promise<Service> => {
    try {
        const payload = await initPayload();

        let submitData: any = { ...data };

        // Payload Postgres often uses numeric IDs for relations. Cast if necessary.
        if (typeof submitData.category === 'string' && !isNaN(Number(submitData.category))) {
            submitData.category = Number(submitData.category);
        }
        if (typeof submitData.execution_workflow === 'string' && !isNaN(Number(submitData.execution_workflow))) {
            submitData.execution_workflow = Number(submitData.execution_workflow);
        }
        if (typeof submitData.validation_workflow === 'string' && submitData.validation_workflow !== '' && !isNaN(Number(submitData.validation_workflow))) {
            submitData.validation_workflow = Number(submitData.validation_workflow);
        } else if (submitData.validation_workflow === '') {
            delete submitData.validation_workflow;
        }

        const doc = await payload.create({
            collection: 'services' as any,
            data: submitData,
        });
        return { ...data, id: String(doc.id), created_at: doc.createdAt } as Service;
    } catch (e) {
        console.error("Payload createService Error:", e);
        throw e;
    }
};

export const updateService = async (id: string, data: Partial<Service>): Promise<Service> => {
    try {
        const payload = await initPayload();

        let submitData: any = { ...data };
        if (typeof submitData.category === 'string' && !isNaN(Number(submitData.category))) {
            submitData.category = Number(submitData.category);
        }
        if (typeof submitData.execution_workflow === 'string' && !isNaN(Number(submitData.execution_workflow))) {
            submitData.execution_workflow = Number(submitData.execution_workflow);
        }
        if (typeof submitData.validation_workflow === 'string' && submitData.validation_workflow !== '' && !isNaN(Number(submitData.validation_workflow))) {
            submitData.validation_workflow = Number(submitData.validation_workflow);
        } else if (submitData.validation_workflow === '') {
            submitData.validation_workflow = null;
        }

        const doc = await payload.update({
            collection: 'services' as any,
            id,
            data: submitData,
        });
        return {
            id: String(doc.id),
            name: doc.name,
            category: typeof doc.category === 'object' ? doc.category.id : doc.category,
            provider: typeof doc.provider === 'object' ? doc.provider?.id : doc.provider,
            provider_service_code: doc.provider_service_code,
            validation_workflow: typeof doc.validation_workflow === 'object' ? doc.validation_workflow?.id : doc.validation_workflow,
            execution_workflow: typeof doc.execution_workflow === 'object' ? doc.execution_workflow?.id : doc.execution_workflow,
            fee_type: doc.fee_type,
            fee_value: doc.fee_value,
            form_schema: doc.form_schema || [],
            status: doc.status,
            created_at: doc.createdAt,
        } as Service;
    } catch (e) {
        console.error("Payload updateService Error:", e);
        throw e;
    }
};

export const deleteService = async (id: string): Promise<boolean> => {
    try {
        const payload = await initPayload();
        await payload.delete({ collection: 'services' as any, id });
        return true;
    } catch (e) {
        console.error("Payload deleteService Error:", e);
        return false;
    }
};

export const executeServiceWorkflow = async (serviceId: string, formData: Record<string, any>): Promise<string> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'services' as any,
            where: { id: { equals: serviceId } },
            depth: 0,
            limit: 1,
        });

        if (!docs.length) {
            throw new Error(`Service ${serviceId} not found`);
        }

        const service = docs[0];
        const workflowId = typeof service.execution_workflow === 'object' ? service.execution_workflow?.id : service.execution_workflow;

        if (!workflowId) {
            throw new Error(`Service ${service.name} does not have an execution workflow configured.`);
        }

        // Pass the form data and the original service metadata into the workflow engine
        const executionId = await executeWorkflow({
            workflowId: String(workflowId),
            trigger: 'MANUAL',
            inputData: {
                ...formData,
                _serviceName: service.name,
                _serviceId: service.id,
                _providerServiceCode: service.provider_service_code,
                _feeValue: service.fee_value,
                _feeType: service.fee_type
            }
        });

        return String(executionId);
    } catch (e) {
        console.error("Payload executeServiceWorkflow Error:", e);
        throw e;
    }
};

export const getWorkflows = async (): Promise<{ docs: { id: string, name: string }[] }> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'workflows' as any,
            where: { status: { equals: 'PUBLISHED' } },
            depth: 0,
            limit: 100,
            sort: '-createdAt',
        });
        return {
            docs: docs.map((doc: any) => ({
                id: String(doc.id),
                name: doc.name,
            }))
        };
    } catch (e) {
        console.error("Payload getWorkflows Error:", e);
        return { docs: [] };
    }
};

export const validateServiceWorkflow = async (serviceId: string, formData: Record<string, any>): Promise<any> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'services' as any,
            where: { id: { equals: serviceId } },
            depth: 0,
            limit: 1,
        });

        if (!docs.length) {
            throw new Error(`Service ${serviceId} not found`);
        }

        const service = docs[0];
        const workflowId = typeof service.validation_workflow === 'object' ? service.validation_workflow?.id : service.validation_workflow;

        if (!workflowId) {
            // If no validation workflow is configured, just return success so the frontend knows to proceed
            return { valid: true };
        }

        const executionId = await executeWorkflow({
            workflowId: String(workflowId),
            trigger: 'MANUAL',
            inputData: formData
        });

        return { valid: true, executionId: String(executionId) };
    } catch (e) {
        console.error("Payload validateServiceWorkflow Error:", e);
        throw e;
    }
};

export const getWorkflowExecutionById = async (executionId: string): Promise<any> => {
    try {
        const payload = await initPayload();
        // The ID might be an integer depending on Payload configuration for workflow-executions
        const parsedId = !isNaN(Number(executionId)) ? Number(executionId) : executionId;

        const doc = await payload.findByID({
            collection: 'workflow-executions' as any,
            id: parsedId,
            depth: 1, // Get some basic relations if needed, but primarily we want the phases Array
        });
        return doc;
    } catch (e) {
        console.error("Payload getWorkflowExecutionById Error:", e);
        return null;
    }
};

export const getConfigsByCategory = async (category: SystemConfig['category']): Promise<SystemConfig[]> => [];

export const getPageBySlug = async (slug: string): Promise<any | null> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'pages' as any,
            where: {
                slug: { equals: slug },
            },
            limit: 1,
            depth: 2,
        });
        return docs[0] || null;
    } catch (e) {
        console.error("Payload getPageBySlug Error:", e);
        return null;
    }
};

export const getBlogPosts = async (): Promise<BlogPost[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'posts' as any,
            depth: 2,
        });

        return docs.map((doc: any) => ({
            id: doc.id,
            slug: doc.slug,
            title: doc.title,
            excerpt: doc.excerpt || '',
            content: lexicalToHtml(doc.content),
            coverImage: typeof doc.featuredImage === 'object' && doc.featuredImage ? doc.featuredImage.url : 'https://images.unsplash.com/photo-1554469384-e58fac16e23a',
            author: {
                name: typeof doc.author === 'object' && doc.author ? doc.author.name || doc.author.email : 'Admin',
                role: 'Contributor',
                avatar: 'https://ui-avatars.com/api/?name=Author'
            },
            date: new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            category: typeof doc.category === 'object' && doc.category ? doc.category.name || doc.category.title : 'General',
            tags: Array.isArray(doc.tags) ? doc.tags.map((t: any) => typeof t === 'object' ? t.name || t.title : String(t)) : [],
            featured: false,
            readTime: '5 min read'
        })) as BlogPost[];
    } catch (e) {
        console.error("Payload getBlogPosts Error:", e);
        return [];
    }
};

export const getBlogPostBySlug = async (slug: string): Promise<BlogPost | undefined> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'posts' as any,
            where: { slug: { equals: slug } },
            depth: 2,
            limit: 1
        });

        if (!docs.length) return undefined;
        const doc = docs[0];

        return {
            slug: doc.slug as string,
            title: doc.title as string,
            excerpt: doc.excerpt as string || '',
            content: lexicalToHtml(doc.content),
            coverImage: typeof doc.featuredImage === 'object' && doc.featuredImage ? doc.featuredImage.url : 'https://images.unsplash.com/photo-1554469384-e58fac16e23a',
            author: {
                name: typeof doc.author === 'object' && doc.author ? doc.author.name || doc.author.email : 'Admin',
                role: 'Contributor',
                avatar: 'https://ui-avatars.com/api/?name=Author'
            },
            date: new Date(doc.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
            category: typeof doc.category === 'object' && doc.category ? doc.category.name || doc.category.title : 'General',
            tags: Array.isArray(doc.tags) ? doc.tags.map((t: any) => typeof t === 'object' ? t.name || t.title : String(t)) : [],
            featured: false,
            readTime: '5 min read'
        };
    } catch (e) {
        console.error("Payload getBlogPostBySlug Error:", e);
        return undefined;
    }
};

export const getFeaturedPosts = async (): Promise<BlogPost[]> => {
    // Return newest 3 posts as featured for now since 'featured' isn't explicitly in Payload schema yet
    return (await getBlogPosts()).slice(0, 3);
};

export const getPostsByCategory = async (categorySlug: string): Promise<BlogPost[]> => {
    const all = await getBlogPosts();
    return all.filter(p => p.category.toLowerCase().replace(/\s+/g, '-') === categorySlug);
};

export const getPopularPosts = async (): Promise<BlogPost[]> => {
    return (await getBlogPosts()).slice(0, 4);
};

export const getAllTags = async (): Promise<string[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'tags' as any,
            limit: 100,
        });
        return docs.map((d: any) => d.name || d.title);
    } catch (e) {
        return [];
    }
};

export const getOpenPositions = async (): Promise<JobPosition[]> => [];
