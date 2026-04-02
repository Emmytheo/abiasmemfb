// NOT "use server" — this file exports a plain object, not async functions.
// The server-only logic lives exclusively in ./actions.ts (which IS "use server").
import { ApiAdapter } from '../../types';
import { PayloadAdapter } from '../payload';
import * as actions from './actions';

export const QoreAdapter: ApiAdapter = {
    // Fallback to Payload for non-banking CMS features (Blog, Pages, Jobs, etc.)
    ...PayloadAdapter,

    // Banking operations intercepted by Qore
    createAccount: actions.createAccount,
    getAccountById: actions.getAccountById,
    getAllAccounts: actions.getAllAccounts,
    getUserAccounts: actions.getUserAccounts,

    createLoan: actions.createLoan,
    getLoanById: actions.getLoanById,
    getAllLoans: actions.getAllLoans,
    getUserLoans: actions.getUserLoans,

    processAccountFunding: actions.processAccountFunding,

    getAllTransactions: actions.getAllTransactions,
    getUserTransactions: actions.getUserTransactions,
    getLoanTransactions: actions.getLoanTransactions,
    getAccountTransactions: actions.getAccountTransactions,
    getTransactionById: actions.getTransactionById,
    getTransactionsByCategory: actions.getTransactionsByCategory,
};
