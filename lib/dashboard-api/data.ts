import { User, Account, Loan, Transaction, SystemConfig } from './types';

export const MOCK_USERS: User[] = [
    { id: 'usr_1', email: 'john@example.com', full_name: 'John Doe', role: 'customer', created_at: new Date().toISOString() },
    { id: 'usr_2', email: 'admin@abia.com', full_name: 'Admin User', role: 'admin', created_at: new Date().toISOString() },
];

export const MOCK_ACCOUNTS: Account[] = [
    { id: 'acc_1', user_id: 'usr_1', account_number: '0123456789', account_type: 'Savings', balance: 154000.50, status: 'active', created_at: new Date().toISOString() },
    { id: 'acc_2', user_id: 'usr_1', account_number: '0987654321', account_type: 'Current', balance: 50000.00, status: 'active', created_at: new Date().toISOString() },
];

export const MOCK_LOANS: Loan[] = [
    { id: 'ln_1', user_id: 'usr_1', amount: 500000, interest_rate: 15, duration_months: 12, status: 'approved', created_at: new Date().toISOString() },
    { id: 'ln_2', user_id: 'usr_2', amount: 200000, interest_rate: 12, duration_months: 6, status: 'pending', created_at: new Date().toISOString() },
];

export const MOCK_TRANSACTIONS: Transaction[] = [
    { id: 'tx_1', user_id: 'usr_1', amount: 15000, type: 'debit', category: 'Bills', status: 'successful', reference: 'BILL-123', created_at: new Date().toISOString() },
    { id: 'tx_2', user_id: 'usr_1', amount: 45000, type: 'debit', category: 'School Fees', status: 'successful', reference: 'SCH-123', created_at: new Date().toISOString() },
    { id: 'tx_3', user_id: 'usr_1', amount: 5000, type: 'debit', category: 'Utilities', status: 'successful', reference: 'UTIL-123', created_at: new Date().toISOString() },
    { id: 'tx_4', user_id: 'usr_1', amount: 2000, type: 'debit', category: 'e-Pins', status: 'successful', reference: 'PIN-123', created_at: new Date().toISOString() },
    { id: 'tx_5', user_id: 'usr_1', amount: 100000, type: 'credit', category: 'Transfer', status: 'successful', reference: 'TRF-123', created_at: new Date().toISOString() },
];

export const MOCK_CONFIGS: SystemConfig[] = [
    { id: 'cfg_1', key: 'Home_Welcome_Text', value: 'Welcome to ABIA MFB - Your Trusted Partner', category: 'Global Content', updated_at: new Date().toISOString() },
    { id: 'cfg_2', key: 'Max_Loan_Amount', value: '5000000', category: 'Product Settings', updated_at: new Date().toISOString() },
];
