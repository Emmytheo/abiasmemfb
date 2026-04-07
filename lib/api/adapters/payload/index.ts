import { ApiAdapter } from '../../types';
import {
    // Users
    getCurrentUser,
    getAllUsers,
    
    // Customers
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    getCustomerAudit,
    deleteCustomer,
    
    // Banking (Accounts, Loans)
    getAllAccounts,
    getUserAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    getAllLoans,
    getUserLoans,
    getLoanById,
    createLoan,
    
    // Beneficiaries
    getUserBeneficiaries,
    saveBeneficiary,
    deleteBeneficiary,
    
    // Product Configuration
    getAllProductClasses,
    createProductClass,
    updateProductClass,
    deleteProductClass,
    getAllProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,
    getAllProductTypes,
    getProductTypeById,
    saveProductType,
    deleteProductType,
    
    // Applications
    createProductApplication,
    updateApplication,
    getUserApplications,
    getAllApplications,
    
    // Transactions
    getAllTransactions,
    getUserTransactions,
    getLoanTransactions,
    getAccountTransactions,
    getTransactionById,
    getTransactionsByCategory,
    
    // Funding
    processAccountFunding,
    
    // Service Integrations
    getServiceCategories,
    getServicesByCategory,
    getAllServices,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    createService,
    updateService,
    deleteService,
    executeServiceWorkflow,
    validateServiceWorkflow,
    getWorkflowExecutionById,
    
    // Workflows
    getWorkflows,
    
    // Config
    getConfigsByCategory,
    
    // CMS
    getPageBySlug,
    getSiteSettings,
    updateSiteSettings,
    
    // Blog
    getBlogPosts,
    getBlogPostBySlug,
    getFeaturedPosts,
    getPostsByCategory,
    getPopularPosts,
    getAllTags,
    
    // Careers
    getOpenPositions,
    
    // Endpoints
    getAllEndpoints,
    
    // Merge & Reconciliation
    mergeCustomers,
    getQoreAccounts,
    unlinkCustomer
} from './actions';

export const PayloadAdapter: ApiAdapter = {
    // Users
    getCurrentUser,
    getAllUsers,

    // Customers
    getAllCustomers,
    getCustomerById,
    updateCustomer,
    getCustomerAudit,
    deleteCustomer,

    // Products (Accounts, Loans)
    getAllAccounts,
    getUserAccounts,
    getAccountById,
    createAccount,
    updateAccount,
    getAllLoans,
    getUserLoans,
    getLoanById,
    createLoan,

    // Beneficiaries
    getUserBeneficiaries,
    saveBeneficiary,
    deleteBeneficiary,

    // Product Configuration & Dynamic Forms
    getAllProductClasses,
    createProductClass,
    updateProductClass,
    deleteProductClass,

    getAllProductCategories,
    createProductCategory,
    updateProductCategory,
    deleteProductCategory,

    getAllProductTypes,
    getProductTypeById,
    saveProductType,
    deleteProductType,

    // Product Applications
    createProductApplication,
    updateApplication,
    getUserApplications,
    getAllApplications,

    // Services (Transactions)
    getAllTransactions,
    getUserTransactions,
    getLoanTransactions,
    getAccountTransactions,
    getTransactionById,
    getTransactionsByCategory,

    // Account Funding
    processAccountFunding,

    // Service Integrations
    getServiceCategories,
    getServicesByCategory,
    getAllServices,
    createServiceCategory,
    updateServiceCategory,
    deleteServiceCategory,
    createService,
    updateService,
    deleteService,
    executeServiceWorkflow,
    validateServiceWorkflow,
    getWorkflowExecutionById,

    // Workflows
    getWorkflows,

    // Settings (Config)
    getConfigsByCategory,

    // Global CMS
    getPageBySlug,

    // Site Settings
    getSiteSettings,
    updateSiteSettings,

    // Blog
    getBlogPosts,
    getBlogPostBySlug,
    getFeaturedPosts,
    getPostsByCategory,
    getPopularPosts,
    getAllTags,

    // Careers
    getOpenPositions,

    // Endpoints
    getAllEndpoints,

    // Merge & Reconciliation
    mergeCustomers,
    getQoreAccounts,
    unlinkCustomer,
};
