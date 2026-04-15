import { ApiAdapter } from '../../types';
import * as actions from './actions';

export const PayloadAdapter: ApiAdapter = {
    // Users
    getCurrentUser: (...args) => actions.getCurrentUser(...args),
    getAllUsers: (...args) => actions.getAllUsers(...args),

    // Customers
    getAllCustomers: () => actions.getAllCustomers(),
    getCustomerById: (id) => actions.getCustomerById(id),
    getCustomerBySupabaseId: (id) => actions.getCustomerBySupabaseId(id),
    restoreCustomerIdentity: (customerId, supabaseId, email) => actions.restoreCustomerIdentity(customerId, supabaseId, email),
    syncBankingIdentity: (userId) => actions.syncBankingIdentity(userId),
    updateCustomer: (id, data) => actions.updateCustomer(id, data),
    verifyIdentity: (bvn) => actions.verifyIdentity(bvn),
    createCoreBankingProfile: (data) => actions.createCoreBankingProfile(data),
    saveOnboardingDraft: (data) => actions.saveOnboardingDraft(data),
    skipOnboarding: (userId) => actions.skipOnboarding(userId),
    getCustomerAudit: (...args) => actions.getCustomerAudit(...args),
    deleteCustomer: (...args) => actions.deleteCustomer(...args),

    // Products (Accounts, Loans)
    getAllAccounts: (...args) => actions.getAllAccounts(...args),
    getUserAccounts: (...args) => actions.getUserAccounts(...args),
    getAccountById: (...args) => actions.getAccountById(...args),
    createAccount: (...args) => actions.createAccount(...args),
    updateAccount: (...args) => actions.updateAccount(...args),
    getAllLoans: (...args) => actions.getAllLoans(...args),
    getUserLoans: (...args) => actions.getUserLoans(...args),
    getLoanById: (...args) => actions.getLoanById(...args),
    createLoan: (...args) => actions.createLoan(...args),

    // Beneficiaries
    getUserBeneficiaries: (...args) => actions.getUserBeneficiaries(...args),
    getBeneficiaryById: (...args) => actions.getBeneficiaryById(...args),
    saveBeneficiary: (...args) => actions.saveBeneficiary(...args),
    deleteBeneficiary: (...args) => actions.deleteBeneficiary(...args),

    // Product Configuration & Dynamic Forms
    getAllProductClasses: (...args) => actions.getAllProductClasses(...args),
    createProductClass: (...args) => actions.createProductClass(...args),
    updateProductClass: (...args) => actions.updateProductClass(...args),
    deleteProductClass: (...args) => actions.deleteProductClass(...args),

    getAllProductCategories: (...args) => actions.getAllProductCategories(...args),
    createProductCategory: (...args) => actions.createProductCategory(...args),
    updateProductCategory: (...args) => actions.updateProductCategory(...args),
    deleteProductCategory: (...args) => actions.deleteProductCategory(...args),

    getAllProductTypes: (...args) => actions.getAllProductTypes(...args),
    getProductTypeById: (...args) => actions.getProductTypeById(...args),
    saveProductType: (...args) => actions.saveProductType(...args),
    deleteProductType: (...args) => actions.deleteProductType(...args),

    // Product Applications
    createProductApplication: (...args) => actions.createProductApplication(...args),
    updateApplication: (...args) => actions.updateApplication(...args),
    getUserApplications: (...args) => actions.getUserApplications(...args),
    getAllApplications: (...args) => actions.getAllApplications(...args),
    reprovisionApplication: (...args) => actions.reprovisionApplication(...args),

    // Services (Transactions)
    getAllTransactions: (...args) => actions.getAllTransactions(...args),
    getUserTransactions: (...args) => actions.getUserTransactions(...args),
    getLoanTransactions: (...args) => actions.getLoanTransactions(...args),
    getAccountTransactions: (...args) => actions.getAccountTransactions(...args),
    getTransactionById: (...args) => actions.getTransactionById(...args),
    getTransactionsByCategory: (...args) => actions.getTransactionsByCategory(...args),

    // Account Funding
    processAccountFunding: (...args) => actions.processAccountFunding(...args),

    // Service Integrations
    getServiceCategories: (...args) => actions.getServiceCategories(...args),
    getServicesByCategory: (...args) => actions.getServicesByCategory(...args),
    getAllServices: (...args) => actions.getAllServices(...args),
    createServiceCategory: (...args) => actions.createServiceCategory(...args),
    updateServiceCategory: (...args) => actions.updateServiceCategory(...args),
    deleteServiceCategory: (...args) => actions.deleteServiceCategory(...args),
    createService: (...args) => actions.createService(...args),
    updateService: (...args) => actions.updateService(...args),
    deleteService: (...args) => actions.deleteService(...args),
    executeServiceWorkflow: (...args) => actions.executeServiceWorkflow(...args),
    validateServiceWorkflow: (...args) => actions.validateServiceWorkflow(...args),
    getWorkflowExecutionById: (...args) => actions.getWorkflowExecutionById(...args),

    // Workflows
    getWorkflows: (...args) => actions.getWorkflows(...args),

    // Settings (Config)
    getConfigsByCategory: (...args) => actions.getConfigsByCategory(...args),

    // Global CMS
    getPageBySlug: (...args) => actions.getPageBySlug(...args),

    // Site Settings
    getSiteSettings: (...args) => actions.getSiteSettings(...args),
    updateSiteSettings: (...args) => actions.updateSiteSettings(...args),

    // Blog
    getBlogPosts: (...args) => actions.getBlogPosts(...args),
    getBlogPostBySlug: (...args) => actions.getBlogPostBySlug(...args),
    getFeaturedPosts: (...args) => actions.getFeaturedPosts(...args),
    getPostsByCategory: (...args) => actions.getPostsByCategory(...args),
    getPopularPosts: (...args) => actions.getPopularPosts(...args),
    getAllTags: (...args) => actions.getAllTags(...args),

    // Careers
    getOpenPositions: (...args) => actions.getOpenPositions(...args),

    // Account Officers
    getAllAccountOfficers: () => actions.getAllAccountOfficers(),
    linkOfficerToUser: (officerId, userId) => actions.linkOfficerToUser(officerId, userId),

    // Endpoints
    getAllEndpoints: (...args) => actions.getAllEndpoints(...args),

    // Merge & Reconciliation
    mergeCustomers: (...args) => actions.mergeCustomers(...args),
    getQoreAccounts: (...args) => actions.getQoreAccounts(...args),
    unlinkCustomer: (...args) => actions.unlinkCustomer(...args),
    repointAccount: (...args) => actions.repointAccount(...args),
    repointDigitalIdentity: (...args) => actions.repointDigitalIdentity(...args),
};
