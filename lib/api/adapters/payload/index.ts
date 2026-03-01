import { ApiAdapter } from '../../types';
import * as actions from './actions';

export const PayloadAdapter: ApiAdapter = {
    // Users
    getCurrentUser: actions.getCurrentUser,
    getAllUsers: actions.getAllUsers,

    // Products (Accounts, Loans)
    getAllAccounts: actions.getAllAccounts,
    getAllLoans: actions.getAllLoans,

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
    getUserApplications: actions.getUserApplications,
    getAllApplications: actions.getAllApplications,

    // Services (Transactions)
    getAllTransactions: actions.getAllTransactions,
    getTransactionsByCategory: actions.getTransactionsByCategory,

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
