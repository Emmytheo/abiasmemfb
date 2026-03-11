import { ApiAdapter } from '../../types';
import * as actions from './actions';

export const PayloadAdapter: ApiAdapter = {
    // Users
    getCurrentUser: actions.getCurrentUser,
    getAllUsers: actions.getAllUsers,

    // Products (Accounts, Loans)
    getAllAccounts: actions.getAllAccounts,
    getUserAccounts: actions.getUserAccounts,
    getAccountById: actions.getAccountById,
    createAccount: actions.createAccount,
    getAllLoans: actions.getAllLoans,
    getUserLoans: actions.getUserLoans,
    getLoanById: actions.getLoanById,
    createLoan: actions.createLoan,

    // Beneficiaries
    getUserBeneficiaries: actions.getUserBeneficiaries,
    saveBeneficiary: actions.saveBeneficiary,
    deleteBeneficiary: actions.deleteBeneficiary,

    // Product Configuration & Dynamic Forms
    getAllProductClasses: actions.getAllProductClasses,
    createProductClass: actions.createProductClass,
    updateProductClass: actions.updateProductClass,
    deleteProductClass: actions.deleteProductClass,

    getAllProductCategories: actions.getAllProductCategories,
    createProductCategory: actions.createProductCategory,
    updateProductCategory: actions.updateProductCategory,
    deleteProductCategory: actions.deleteProductCategory,

    getAllProductTypes: actions.getAllProductTypes,
    getProductTypeById: actions.getProductTypeById,
    saveProductType: actions.saveProductType,
    deleteProductType: actions.deleteProductType,

    // Product Applications
    createProductApplication: actions.createProductApplication,
    updateApplication: actions.updateApplication,
    getUserApplications: actions.getUserApplications,
    getAllApplications: actions.getAllApplications,

    // Services (Transactions)
    getAllTransactions: actions.getAllTransactions,
    getUserTransactions: actions.getUserTransactions,
    getLoanTransactions: actions.getLoanTransactions,
    getAccountTransactions: actions.getAccountTransactions,
    getTransactionById: actions.getTransactionById,
    getTransactionsByCategory: actions.getTransactionsByCategory,

    // Account Funding
    processAccountFunding: actions.processAccountFunding,

    // Service Integrations
    getServiceCategories: actions.getServiceCategories,
    getServicesByCategory: actions.getServicesByCategory,
    getAllServices: actions.getAllServices,
    createServiceCategory: actions.createServiceCategory,
    updateServiceCategory: actions.updateServiceCategory,
    deleteServiceCategory: actions.deleteServiceCategory,
    createService: actions.createService,
    updateService: actions.updateService,
    deleteService: actions.deleteService,
    executeServiceWorkflow: actions.executeServiceWorkflow,
    validateServiceWorkflow: actions.validateServiceWorkflow,
    getWorkflowExecutionById: actions.getWorkflowExecutionById,

    // Workflows
    getWorkflows: actions.getWorkflows,

    // Settings (Config)
    getConfigsByCategory: actions.getConfigsByCategory,

    // Global CMS
    getPageBySlug: actions.getPageBySlug,

    // Blog
    getBlogPosts: actions.getBlogPosts,
    getBlogPostBySlug: actions.getBlogPostBySlug,
    getFeaturedPosts: actions.getFeaturedPosts,
    getPostsByCategory: actions.getPostsByCategory,
    getPopularPosts: actions.getPopularPosts,
    getAllTags: actions.getAllTags,

    // Careers
    getOpenPositions: actions.getOpenPositions,
};
