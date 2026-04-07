import { ApiAdapter, ProductApplication } from '../../types';
import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_LOANS, MOCK_TRANSACTIONS, MOCK_CONFIGS, MOCK_POSTS, MOCK_JOBS, MOCK_PRODUCT_TYPES, MOCK_APPLICATIONS, MOCK_CUSTOMERS } from './data';

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

    // Customers
    getAllCustomers: async () => {
        await delay(500);
        return MOCK_CUSTOMERS;
    },

    getCustomerById: async (id) => {
        await delay(400);
        return MOCK_CUSTOMERS.find(c => c.id === id) || null;
    },

    updateCustomer: async (id, data) => {
        await delay(600);
        const existing = MOCK_CUSTOMERS.find(c => c.id === id);
        return { 
            ...(existing || MOCK_CUSTOMERS[0]), 
            ...data, 
            updated_at: new Date().toISOString() 
        } as any;
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

    updateAccount: async (id, data) => {
        await delay(500);
        const existing = MOCK_ACCOUNTS.find(a => a.id === id);
        return {
            ...(existing || MOCK_ACCOUNTS[0]),
            ...data,
            updated_at: new Date().toISOString()
        } as any;
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

    getAccountById: async (id) => {
        await delay(300);
        return MOCK_ACCOUNTS.find(a => a.id === id) || null;
    },

    getLoanById: async (id) => {
        await delay(300);
        return MOCK_LOANS.find(l => l.id === id) || null;
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
        } as ProductApplication;
    },

    updateApplication: async (id, data) => {
        await delay(800);
        return {
            ...data,
            id,
            user_id: data.user_id || 'dummy_user', // Placeholder
            product_type_id: data.product_type_id || 'dummy_product', // Placeholder
            workflow_stage: data.workflow_stage || 'Submitted', // Placeholder
            status: data.status || 'pending', // Placeholder
            submitted_data: data.submitted_data || {},
            created_at: data.created_at || new Date().toISOString(), // Placeholder
            updated_at: new Date().toISOString()
        } as ProductApplication;
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

    getUserTransactions: async (userId) => {
        await delay(500);
        return MOCK_TRANSACTIONS.filter(t => t.user_id === userId);
    },

    getLoanTransactions: async (loanId) => {
        await delay(400);
        // In mock mode, filter by metadata.loan_id if present, otherwise return empty
        return MOCK_TRANSACTIONS.filter(t =>
            (t.metadata as any)?.loan_id === loanId ||
            (t.metadata as any)?.loan === loanId
        );
    },

    getAccountTransactions: async (accountId) => {
        await delay(400);
        // Filter by to_account or from_account
        return MOCK_TRANSACTIONS.filter(t => {
            const toAcc = typeof t.to_account === 'object' && t.to_account ? (t.to_account as any).id : t.to_account;
            const fromAcc = typeof t.from_account === 'object' && t.from_account ? (t.from_account as any).id : t.from_account;
            return toAcc === accountId || fromAcc === accountId;
        });
    },

    getTransactionById: async (id) => {
        await delay(300);
        return MOCK_TRANSACTIONS.find(t => t.id === String(id)) || null;
    },

    getTransactionsByCategory: async (category) => {
        await delay(400);
        return MOCK_TRANSACTIONS.filter(t => t.category === category);
    },

    // Account Funding
    processAccountFunding: async (targetAccountId, amountNaira, reference) => {
        await delay(1000);
        return { success: true, data: { status: 'SUCCESS', new_balance: amountNaira + 1000 } };
    },

    // Service Integrations
    getServiceCategories: async () => {
        await delay(300);
        return [];
    },
    getServicesByCategory: async (categorySlug) => {
        await delay(300);
        return [];
    },
    getAllServices: async () => {
        await delay(300);
        return [];
    },
    createServiceCategory: async (data) => {
        await delay(400);
        return { ...data, id: `scat_${Date.now()}`, created_at: new Date().toISOString() } as any;
    },
    updateServiceCategory: async (id, data) => {
        await delay(400);
        return { id, ...data } as any;
    },
    deleteServiceCategory: async (id) => {
        await delay(300);
        return true;
    },
    createService: async (data) => {
        await delay(400);
        return { ...data, id: `svc_${Date.now()}`, created_at: new Date().toISOString() } as any;
    },
    updateService: async (id, data) => {
        await delay(400);
        return { id, ...data } as any;
    },
    deleteService: async (id) => {
        await delay(300);
        return true;
    },
    executeServiceWorkflow: async (serviceId, formData) => {
        await delay(800);
        return `exec_${Date.now()}`;
    },
    validateServiceWorkflow: async (serviceId, formData) => {
        await delay(400);
        return { valid: true };
    },
    getWorkflowExecutionById: async (executionId) => {
        await delay(300);
        return { id: executionId, status: 'completed' };
    },

    // Workflows
    getWorkflows: async () => {
        await delay(300);
        return { docs: [] };
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
    },

    // Beneficiaries
    getUserBeneficiaries: async (userId) => {
        await delay(400);
        return [];
    },

    saveBeneficiary: async (data) => {
        await delay(500);
        return {
            ...data,
            id: `ben_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        } as any;
    },

    deleteBeneficiary: async (id, userId) => {
        await delay(400);
        return true;
    },

    // Site Settings
    getSiteSettings: async () => {
        await delay(300);
        return {
            siteTitle: 'Abia MFB',
            sync: {
                baselineAccounts: [{ accountNumber: '0123456789' }],
                autoDiscoveryEnabled: true,
                customerLookupEndpoint: 'dummy-ep-1',
                accountEnquiryEndpoint: 'dummy-ep-2',
                customerAccountsEndpoint: 'dummy-ep-3'
            }
        };
    },

    updateSiteSettings: async (data) => {
        await delay(500);
        return data as any;
    },

    // Endpoints
    getAllEndpoints: async () => {
        await delay(400);
        return [
            { id: 'dummy-ep-1', name: 'Standard Customer Lookup' },
            { id: 'dummy-ep-2', name: 'General Account Enquiry' },
            { id: 'dummy-ep-3', name: 'Customer Accounts Discovery' }
        ];
    },

    // Merge & Reconciliation
    mergeCustomers: async () => {
        await delay(1500);
        return { success: true, mergedRecords: 1, archivedIds: ['merged_dummy_id'] };
    },
    getQoreAccounts: async () => {
        await delay(800);
        return [
            { AccountNo: '1234567890', AccountType: '10', AvailableBalance: '50000.00', Status: 'Active' },
            { AccountNo: '0987654321', AccountType: '20', AvailableBalance: '150000.00', Status: 'Active' }
        ];
    },
};
