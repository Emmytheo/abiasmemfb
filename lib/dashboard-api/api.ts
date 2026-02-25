import { MOCK_USERS, MOCK_ACCOUNTS, MOCK_LOANS, MOCK_TRANSACTIONS, MOCK_CONFIGS } from './data';
import { User, Account, Loan, Transaction, SystemConfig } from './types';

// Simulate network delay for realistic mock
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const dashboardApi = {
    // Users
    getCurrentUser: async (): Promise<User> => {
        await delay(200);
        return MOCK_USERS[1]; // Admin by default for this view
    },

    getAllUsers: async (): Promise<User[]> => {
        await delay(500);
        return MOCK_USERS;
    },

    // Products
    getAllAccounts: async (): Promise<Account[]> => {
        await delay(600);
        return MOCK_ACCOUNTS;
    },

    getAllLoans: async (): Promise<Loan[]> => {
        await delay(500);
        return MOCK_LOANS;
    },

    // Services
    getTransactionsByCategory: async (category: Transaction['category']): Promise<Transaction[]> => {
        await delay(400);
        return MOCK_TRANSACTIONS.filter(t => t.category === category);
    },

    getAllTransactions: async (): Promise<Transaction[]> => {
        await delay(500);
        return MOCK_TRANSACTIONS;
    },

    // Settings
    getConfigsByCategory: async (category: SystemConfig['category']): Promise<SystemConfig[]> => {
        await delay(300);
        return MOCK_CONFIGS.filter(c => c.category === category);
    },
};
