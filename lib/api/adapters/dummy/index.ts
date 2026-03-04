import { ApiAdapter } from '../../types';
import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_LOANS, MOCK_TRANSACTIONS, MOCK_CONFIGS, MOCK_POSTS, MOCK_JOBS, MOCK_PRODUCT_TYPES, MOCK_APPLICATIONS } from './data';

// Simulate network delay for realistic mock
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const DummyAdapter: ApiAdapter = {
    // Users
    getCurrentUser: async () => {
        await delay(200);
        return MOCK_USERS[1]; // Admin by default for this view
    },

    getAllUsers: async () => {
        await delay(500);
        return MOCK_USERS;
    },

    // Products
    getAllAccounts: async () => {
        await delay(600);
        return MOCK_ACCOUNTS;
    },

    getUserAccounts: async (userId) => {
        await delay(400);
        return MOCK_ACCOUNTS.filter(a => a.user_id === userId);
    },

    createAccount: async (data) => {
        await delay(500);
        return { ...data, id: `acc_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    },

    getAllLoans: async () => {
        await delay(500);
        return MOCK_LOANS;
    },

    getUserLoans: async (userId) => {
        await delay(400);
        return MOCK_LOANS.filter(l => l.user_id === userId);
    },

    createLoan: async (data) => {
        await delay(500);
        return { ...data, id: `loan_${Date.now()}`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
    },

    // Product Configuration & Dynamic Forms
    getAllProductClasses: async () => {
        await delay(300);
        return [];
    },
    createProductClass: async (data) => {
        await delay(400);
        return { ...data, id: `cls_${Date.now()}`, created_at: new Date().toISOString() };
    },
    updateProductClass: async (id, data) => {
        await delay(400);
        return { id, ...data } as any;
    },
    deleteProductClass: async (id) => {
        await delay(300);
        return true;
    },

    getAllProductCategories: async () => {
        await delay(300);
        return [];
    },
    createProductCategory: async (data) => {
        await delay(400);
        return { ...data, id: `cat_${Date.now()}`, created_at: new Date().toISOString() };
    },
    updateProductCategory: async (id, data) => {
        await delay(400);
        return { id, ...data } as any;
    },
    deleteProductCategory: async (id) => {
        await delay(300);
        return true;
    },

    getAllProductTypes: async () => {
        await delay(400);
        return MOCK_PRODUCT_TYPES;
    },

    getProductTypeById: async (id) => {
        await delay(200);
        return MOCK_PRODUCT_TYPES.find(p => p.id === id) || null;
    },

    saveProductType: async (data) => {
        await delay(600);
        // Simulate saving/updating by returning the data
        return data;
    },

    deleteProductType: async (id) => {
        await delay(400);
        return true;
    },

    // Product Applications
    createProductApplication: async (data) => {
        await delay(800);
        return {
            ...data,
            id: `APP_${Math.random().toString(36).substr(2, 6)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    },

    updateApplication: async (id, data) => {
        await delay(800);
        return {
            ...data,
            id,
            user_id: 'dummy_user', // Placeholder
            product_type_id: 'dummy_product', // Placeholder
            workflow_stage: 'Submitted', // Placeholder
            status: 'pending', // Placeholder
            created_at: new Date().toISOString(), // Placeholder
            updated_at: new Date().toISOString()
        };
    },

    getUserApplications: async (userId) => {
        await delay(500);
        return MOCK_APPLICATIONS.filter(a => a.user_id === userId);
    },

    getAllApplications: async () => {
        await delay(600);
        return MOCK_APPLICATIONS;
    },

    // Services
    getAllTransactions: async () => {
        await delay(500);
        return MOCK_TRANSACTIONS;
    },

    getTransactionsByCategory: async (category) => {
        await delay(400);
        return MOCK_TRANSACTIONS.filter(t => t.category === category);
    },

    // Settings
    getConfigsByCategory: async (category) => {
        await delay(300);
        return MOCK_CONFIGS.filter(c => c.category === category);
    },

    // Global CMS
    getPageBySlug: async (slug) => {
        await delay(200);
        return null; // Mock returns null for pages to fallback to standard routing for now
    },

    // Blog
    getBlogPosts: async () => {
        await delay(300);
        return MOCK_POSTS;
    },

    getBlogPostBySlug: async (slug) => {
        await delay(200);
        return MOCK_POSTS.find((p) => p.slug === slug);
    },

    getFeaturedPosts: async () => {
        await delay(200);
        return MOCK_POSTS.filter((p) => p.featured);
    },

    getPostsByCategory: async (categorySlug) => {
        await delay(300);
        const normalizedSlug = categorySlug.toLowerCase().replace(/-/g, ' ');
        return MOCK_POSTS.filter((p) =>
            p.category.toLowerCase().includes(normalizedSlug) ||
            normalizedSlug.includes(p.category.toLowerCase())
        );
    },

    getPopularPosts: async () => {
        await delay(200);
        return MOCK_POSTS.slice(0, 3);
    },

    getAllTags: async () => {
        await delay(100);
        const tags = new Set<string>();
        MOCK_POSTS.forEach((post: any) => {
            post.tags.forEach((tag: string) => tags.add(tag));
        });
        return Array.from(tags);
    },

    // Careers
    getOpenPositions: async () => {
        await delay(500);
        return MOCK_JOBS;
    }
};
