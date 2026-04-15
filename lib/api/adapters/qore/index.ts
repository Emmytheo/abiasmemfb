// NOT "use server" — this file exports a plain object, not async functions.
// The server-only logic lives exclusively in ./actions.ts (which IS "use server").
import { ApiAdapter } from '../../types';
import { PayloadAdapter } from '../payload';
import * as actions from './actions';

export const QoreAdapter: ApiAdapter = {
    // Fallback to Payload for non-banking CMS features (Blog, Pages, Jobs, etc.)
    ...PayloadAdapter,

    // Banking operations intercepted by Qore
    createAccount: (...args) => actions.createAccount(...args),
    getAccountById: (...args) => actions.getAccountById(...args),
    getAllAccounts: (...args) => actions.getAllAccounts(...args),
    getUserAccounts: (...args) => actions.getUserAccounts(...args),

    createLoan: (...args) => actions.createLoan(...args),
    getLoanById: (...args) => actions.getLoanById(...args),
    getAllLoans: (...args) => actions.getAllLoans(...args),
    getUserLoans: (...args) => actions.getUserLoans(...args),

    processAccountFunding: (...args) => actions.processAccountFunding(...args),

    getAllTransactions: (...args) => actions.getAllTransactions(...args),
    getUserTransactions: (...args) => actions.getUserTransactions(...args),
    getLoanTransactions: (...args) => actions.getLoanTransactions(...args),
    getAccountTransactions: (...args) => actions.getAccountTransactions(...args),
    getTransactionById: (...args) => actions.getTransactionById(...args),
    getTransactionsByCategory: (...args) => actions.getTransactionsByCategory(...args),
    
    // Explicitly inherit Account Officer methods from Payload (unless Qore needs specialized logic)
    getAllAccountOfficers: () => PayloadAdapter.getAllAccountOfficers(),
    linkOfficerToUser: (officerId, userId) => PayloadAdapter.linkOfficerToUser(officerId, userId),
};
