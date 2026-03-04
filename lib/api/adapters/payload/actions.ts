"use server";

import { User, Account, Loan, ProductType, ProductClass, ProductCategory, ProductApplication, Transaction, SystemConfig, BlogPost, JobPosition } from '../../types';
import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { lexicalToHtml } from '@/lib/utils/lexical-to-html';

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
        const payload = await initPayload();
        const users = await payload.find({ collection: 'users' as any });
        return users.docs.map(doc => ({
            id: doc.id as string,
            email: doc.email as string,
            full_name: (doc as any).full_name || 'Admin',
            role: (doc as any).role || 'admin',
            created_at: doc.createdAt as string,
        }));
    } catch (e) {
        console.error("Payload getAllUsers Error:", e);
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
                outstanding_balance: Math.round(data.outstanding_balance * 100),
                monthly_installment: Math.round(data.monthly_installment * 100),
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

export const getUserLoans = async (userId: string): Promise<Loan[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'loans' as any,
            where: { user_id: { equals: userId } },
            depth: 1,
            limit: 100,
            sort: '-createdAt',
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

export const getAllTransactions = async (): Promise<Transaction[]> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'transactions' as any,
            depth: 1,
            limit: 500,
            sort: '-createdAt',
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

export const getTransactionsByCategory = async (category: Transaction['category']): Promise<Transaction[]> => {
    const all = await getAllTransactions();
    return all.filter(t => t.category === category);
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
