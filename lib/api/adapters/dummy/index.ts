import { ApiAdapter } from '../../types';
import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_LOANS, MOCK_TRANSACTIONS, MOCK_CONFIGS, MOCK_POSTS, MOCK_JOBS } from './data';

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

    getAllLoans: async () => {
        await delay(500);
        return MOCK_LOANS;
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
