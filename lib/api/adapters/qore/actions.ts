"use server";

import { Account, Loan, Transaction, User } from '../../types';
import { resolveSecret } from '../../../../lib/workflow/secrets/secretResolver';
import { PayloadAdapter } from '../payload';
import { getPayload } from 'payload';
import config from '@payload-config';

// ── Environment Configuration ──────────────────────────────────────────
const QORE_ENV = process.env.QORE_ENV || 'staging';
const QORE_STAGING_BASE = 'https://staging.mybankone.com';
const QORE_LIVE_BASE = 'https://api.mybankone.com';

// Prioritize direct QORE_BASE_URL from env if available
const BASE_URL = process.env.QORE_BASE_URL || (QORE_ENV === 'live' ? QORE_LIVE_BASE : QORE_STAGING_BASE);

const CORE_BASE_URL = `${BASE_URL}/BankOneWebAPI/api`;
const CHANNELS_BASE_URL = `${BASE_URL}/thirdpartyapiservice/apiservice`;

// ── Type Definitions ──────────────────────────────────────────────────
export interface QoreOverrides {
    token?: string;
    institutionCode?: string;
    groupCode?: string;
}

// ── Helper API Request ───────────────────────────────────────────────
/**
 * Unified Qore/BankOne Request Helper.
 * Handles dual-base URLs, service-specific authentication, and dynamic overrides.
 */
const qoreRequest = async (
    type: 'core' | 'channels',
    endpoint: string,
    options: RequestInit & { overrides?: QoreOverrides } = {}
) => {
    const { overrides = {} } = options;
    const tokenSecretId = process.env.QORE_SECRET_ID;
    
    // Prioritize dynamic override token, then resolve from env secret ID, then throw
    let token = overrides.token;
    if (!token) {
        if (!tokenSecretId) throw new Error('QORE_SECRET_ID environment variable or dynamic token is missing.');
        token = await resolveSecret(tokenSecretId);
    }

    const institutionCode = overrides.institutionCode || process.env.QORE_INSTITUTION_CODE;
    const groupCode = overrides.groupCode || process.env.QORE_GROUP_CODE || 'Group1';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    // ── Authentication & Routing ──────────────────────────────────
    // Core: Uses ?authtoken= query param
    // Channels: Uses "AuthenticationCode" in JSON body
    let url: string;
    if (type === 'core') {
        if (endpoint.includes('?')) {
            const [path, query] = endpoint.split('?');
            url = `${CORE_BASE_URL}/${path}?authToken=${token}&${query}`;
        } else {
            url = `${CORE_BASE_URL}/${endpoint}?authToken=${token}`;
        }
    } else {
        url = `${CHANNELS_BASE_URL}/${endpoint}`;
    }

    let body: any = {};
    if (options.body) {
        try {
            body = JSON.parse(options.body as string);
        } catch (e) {
            body = options.body;
        }
    }

    if (type === 'channels') {
        // Some endpoints use AuthenticationKey (Transfers), some use AuthenticationCode (KYC), some use Token (BVN).
        // We'll prioritize the one already in the body, else default to AuthenticationCode.
        if (!body.AuthenticationKey && !body.AuthenticationCode && !body.Token) {
            body.AuthenticationCode = token;
        }
    }
    
    // Inject mandatory BankOne fields for POST/PUT requests
    if (options.method === 'POST' || options.method === 'PUT') {
        body.InstitutionCode = body.InstitutionCode || institutionCode;
        body.GroupCode = body.GroupCode || groupCode;
    }

    const fetchOptions: RequestInit = {
        ...options,
        headers,
    };

    if (options.method !== 'GET' && options.method !== 'HEAD') {
        fetchOptions.body = JSON.stringify(body);
    }

    

    console.log(`[QORE REQUEST] ${options.method || 'GET'} ${url}`);
    
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
        const errbody = await res.text().catch(() => '');
        console.error(`[QORE API ERROR] ${res.status} ${res.statusText} on ${url}`, errbody);
        throw new Error(`Qore API Error: ${res.status} ${res.statusText} - ${errbody || 'No error body'}`);
    }

    return await res.json();
};

// ── Core ApiAdapter Implementations (Internal ABIASMEMFB Logic) ────────

export const createAccount = async (data: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> => {
    const qoreRes = await createAccountQuick({
        TransactionTrackingRef: `ACC_${Date.now()}`,
        AccountOpeningTrackingRef: `WEB_${Date.now()}`,
        ProductCode: '101', // Default product
        LastName: 'New',
        OtherNames: 'User',
        PhoneNo: '08000000000',
        Gender: 0,
        PlaceOfBirth: 'Nigeria',
        DateOfBirth: '1990-01-01',
        Address: 'Nigeria',
    });

    return await PayloadAdapter.createAccount({
        ...data,
        account_number: qoreRes.Payload?.AccountNumber || `Q_${Date.now()}`,
    });
};

export const getAccountById = async (id: string): Promise<Account | null> => {
    const localAcc = await PayloadAdapter.getAccountById(id);
    if (!localAcc) return null;

    try {
        const qoreRes = await getAccountSummary(localAcc.account_number);
        return {
            ...localAcc,
            balance: qoreRes.Payload?.AvailableBalance || qoreRes.Payload?.AccountBalance || localAcc.balance,
        };
    } catch (e) {
        return localAcc;
    }
};

export const getAllAccounts = async (): Promise<Account[]> => PayloadAdapter.getAllAccounts();
export const getUserAccounts = async (userId: string): Promise<Account[]> => PayloadAdapter.getUserAccounts(userId);

// ── Loans ──────────────────────────────────────────────────────────

export const createLoan = async (data: Omit<Loan, 'id' | 'created_at' | 'updated_at'>, overrides?: QoreOverrides): Promise<Loan> => {
    // Standard Qore Loan Application
    await qoreRequest('core', 'Loan/Apply/2', {
        method: 'POST',
        body: JSON.stringify({
            Amount: data.amount,
            InterestRate: data.interest_rate,
            Tenure: data.duration_months,
        }),
        overrides
    });
    return PayloadAdapter.createLoan(data);
};

export const getLoanById = async (id: string): Promise<Loan | null> => PayloadAdapter.getLoanById(id);
export const getAllLoans = async (): Promise<Loan[]> => PayloadAdapter.getAllLoans();
export const getUserLoans = async (userId: string): Promise<Loan[]> => PayloadAdapter.getUserLoans(userId);

// ── Transactions & Funding (Sync with Payload) ─────────────────────

export const processAccountFunding = async (targetAccountId: string, amountNaira: number, reference?: string) => {
    const localAcc = await PayloadAdapter.getAccountById(targetAccountId);
    if (!localAcc) throw new Error('Target account not found locally');

    try {
        const amountKobo = Math.round(amountNaira * 100);
        const res = await intraBankTransfer({
            FromAccountNumber: 'SYSTEM_FUND_ACC', // Needs valid system source
            ToAccountNumber: localAcc.account_number,
            Amount: String(amountKobo),
            Narration: 'Account Funding',
            RetrievalReference: (reference || `FUND_${Date.now()}`).slice(0, 12).padEnd(12, '0'),
        });

        return { success: true, data: res };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
};

export const getAllTransactions = async (): Promise<Transaction[]> => PayloadAdapter.getAllTransactions();
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => PayloadAdapter.getUserTransactions(userId);
export const getLoanTransactions = async (loanId: string): Promise<Transaction[]> => PayloadAdapter.getLoanTransactions(loanId);
export const getAccountTransactions = async (accountId: string): Promise<Transaction[]> => PayloadAdapter.getAccountTransactions(accountId);
export const getTransactionById = async (id: string | number): Promise<Transaction | null> => PayloadAdapter.getTransactionById(id);
export const getTransactionsByCategory = async (category: Transaction['category']): Promise<Transaction[]> => PayloadAdapter.getTransactionsByCategory(category);

// ── Workflow Nodes (Qore-Native API Endpoints) ─────────────────────

// ── Account Creation ──────────────────────────────────────────────

export const createAccountQuick = async (data: {
    TransactionTrackingRef: string;
    AccountOpeningTrackingRef: string;
    ProductCode: string;
    LastName: string;
    OtherNames: string;
    PhoneNo: string;
    Gender: number;
    PlaceOfBirth: string;
    DateOfBirth: string;
    Address: string;
    NationalIdentificationNumber?: string;
    Email?: string;
    BVN?: string;
}, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'Account/CreateAccountQuick/2', {
        method: 'POST',
        body: JSON.stringify(data),
        overrides
    });
};

export const createCustomerAndAccount = async (data: {
    LastName: string;
    OtherNames: string;
    PhoneNo: string;
    Gender: number;
    DateOfBirth: string;
    Address: string;
    BVN?: string;
    Email?: string;
    HomeAddress?: string;
    City?: string;
    LGA?: string;
    State?: string;
    ProductCode: string;
    TransactionTrackingRef: string;
}, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'Account/CreateCustomerAndAccount/2', {
        method: 'POST',
        body: JSON.stringify(data),
        overrides
    });
};

// ── Account Lifecycle & Compliance ─────────────────────────────────

export const freezeAccount = async (accountNumber: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/FreezeAccount', {
        method: 'POST',
        body: JSON.stringify({ 
            AccountNo: accountNumber, 
            ReferenceID: `FREEZE_${Date.now()}`, 
            Reason: 'Automated Freeze' 
        }),
        overrides
    });
};

export const unfreezeAccount = async (accountNumber: string, referenceId: string, reason?: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/UnfreezeAccount', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNumber, ReferenceID: referenceId, Reason: reason }),
        overrides
    });
};

export const checkFreezeStatus = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/CheckFreezeStatus', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const manageLien = async (accountNumber: string, amount: number, action: 'PLACE' | 'REMOVE', overrides?: QoreOverrides) => {
    const endpoint = action === 'PLACE' ? 'Account/PlaceLien' : 'Account/UnPlaceLien';
    return qoreRequest('channels', endpoint, {
        method: 'POST',
        body: JSON.stringify({ 
            AccountNo: accountNumber, 
            Amount: String(Math.round(amount * 100)), 
            ReferenceID: `LIEN_${Date.now()}` 
        }),
        overrides
    });
};

export const checkLienStatus = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/CheckLienStatus', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const createFixedDeposit = async (userId: string, accountId: string, amount: number, duration: number, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'FixedDeposit/Create', {
        method: 'POST',
        body: JSON.stringify({ userId, accountId, amount, duration }),
        overrides
    });
};

export const liquidateFixedDeposit = async (depositId: string, destinationAccountId: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'FixedDeposit/Liquidate', {
        method: 'POST',
        body: JSON.stringify({ depositId, destinationAccountId }),
        overrides
    });
};

export const activatePND = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/ActivatePND', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const deactivatePND = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/DeactivatePND', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const checkPNDStatus = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/CheckPNDStatus', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const upgradeAccountTier = async (accountNumber: string, tier: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'Account/UpdateAccountTier2/2', {
        method: 'POST',
        body: JSON.stringify({ AccountNumber: accountNumber, AccountTier: tier }),
        overrides
    });
};

export const updateNotificationPreference = async (accountNumber: string, notificationPreference: number, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'Account/UpdateAccountNotificationPreference/2', {
        method: 'POST',
        body: JSON.stringify({ AccountNumber: accountNumber, NotificationPreference: notificationPreference }),
        overrides
    });
};


export const uploadDocument = async (
    accountNumber: string,
    documentType: number,
    imageBase64: string,
    overrides?: QoreOverrides
) => {
    return qoreRequest('core', 'Account/UploadSupportingDocument/2', {
        method: 'POST',
        body: JSON.stringify({ AccountNumber: accountNumber, DocumentType: documentType, Image: imageBase64 }),
        overrides
    });
};

export const closeAccount = async (accountNumber: string, narration: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', `Account/CloseAccount/2?accountNumber=${accountNumber}&narration=${narration}`, {
        method: 'POST',
        overrides
    });
};

// ── Enquiry & Reporting ────────────────────────────────────────────

export const accountEnquiry = async (accountNo: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Account/AccountEnquiry', {
        method: 'POST',
        body: JSON.stringify({ AccountNo: accountNo }),
        overrides
    });
};

export const getAccountSummary = async (accountNumber: string, institutionCode?: string, overrides?: QoreOverrides) => {
    const finalOverrides = { ...overrides, institutionCode: institutionCode || overrides?.institutionCode };
    const endpoint = finalOverrides.institutionCode 
        ? `Account/GetAccountSummary/2?accountNumber=${accountNumber}&institutionCode=${finalOverrides.institutionCode}`
        : `Account/GetAccountSummary/2?accountNumber=${accountNumber}`;
    return qoreRequest('core', endpoint, {
        method: 'GET',
        overrides: finalOverrides
    });
};

export const getAccountsByCustomer = async (customerId: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', `Account/GetAccountsByCustomerId/2?customerId=${customerId}`, {
        method: 'GET',
        overrides
    });
};

export const getBalanceEnquiry = async (accountNumber: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', `Account/GetAccountByAccountNumber/2?accountNumber=${accountNumber}`, {
        method: 'GET',
        overrides
    });
};

export const getQoreProducts = async (overrides?: QoreOverrides) => {
    const institutionCode = overrides?.institutionCode || process.env.QORE_INSTITUTION_CODE;
    
    if (!institutionCode) {
        throw new Error('QORE_INSTITUTION_CODE is missing from environment variables.');
    }

    // Try primary endpoint from blueprint first
    try {
        return await qoreRequest('core', `Product/Get/2?mfbCode=${institutionCode}`, {
            method: 'GET',
            overrides
        });
    } catch (e: any) {
        if (e.message.includes('404')) {
            console.warn("[QORE] Product/Get/2 not found, falling back to legacy Product/Get...");
            return await qoreRequest('core', `Product/Get?mfbCode=${institutionCode}`, {
                method: 'GET',
                overrides
            });
        }
        throw e;
    }
};

export const getQoreAccountTransactions = async (
    accountNumber: string,
    fromDate: string,
    toDate: string,
    numberOfItems: number = 50,
    overrides?: QoreOverrides
) => {
    const params = new URLSearchParams({ 
        accountNumber, 
        fromDate, 
        toDate, 
        numberOfItems: String(numberOfItems) 
    });
    
    const instCode = overrides?.institutionCode || process.env.QORE_INSTITUTION_CODE;
    if (instCode) params.append('institutionCode', instCode);

    return qoreRequest('core', `Account/GetTransactions/2?${params.toString()}`, { 
        method: 'GET',
        overrides
    });
};

export const generateAccountStatement = async (
    accountNumber: string,
    fromDate: string,
    toDate: string,
    overrides?: QoreOverrides
) => {
    const params = new URLSearchParams({ 
        accountNumber, 
        fromDate, 
        toDate 
    });
    const instCode = overrides?.institutionCode || process.env.QORE_INSTITUTION_CODE;
    if (instCode) params.append('institutionCode', instCode);

    return qoreRequest('core', `Account/GenerateAccountStatement2/2?${params.toString()}`, { 
        method: 'GET',
        overrides
    });
};

export const getAccountByTrackingRef = async (transactionTrackingRef: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', `Account/GetAccountByTransactionTrackingRef/2?transactionTrackingRef=${transactionTrackingRef}`, { 
        method: 'GET',
        overrides
    });
};

// ── Customer & BVN ──────────────────────────────────────────────────

export const createCustomer = async (data: {
    LastName: string;
    OtherNames: string;
    BVN?: string;
    DOB: string;
    PhoneNo: string;
    Email?: string;
    Address: string;
}, overrides?: QoreOverrides) => {
    return qoreRequest('core', 'Customer/CreateCustomer/2', {
        method: 'POST',
        body: JSON.stringify(data),
        overrides
    });
};

export const getCustomerByBVN = async (bvn: string, overrides?: QoreOverrides) => {
    return qoreRequest('core', `Customer/GetByBVN/2?BVN=${bvn}`, { 
        method: 'GET',
        overrides
    });
};

/**
 * Retrieve BVN details. 
 * Note: BankOne BVN details endpoint often uses "Token" instead of "AuthenticationCode".
 */
export const retrieveBVN = async (bvn: string, token?: string) => {
    return qoreRequest('channels', 'Account/BVN/GetBVNDetails', {
        method: 'POST',
        body: JSON.stringify({ BVN: bvn, Token: token }) 
    });
};

// ── Transaction Management ──────────────────────────────────────────

export const queryTransactionStatus = async (retrievalReference: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'CoreTransactions/TransactionStatusQuery/2', {
        method: 'POST',
        body: JSON.stringify({ RetrievalReference: retrievalReference }),
        overrides
    });
};

export const intraBankTransfer = async (data: {
    FromAccountNumber: string;
    ToAccountNumber: string;
    Amount: string; // in kobo as string
    Narration: string;
    RetrievalReference: string; // 12 chars
}, overrides?: QoreOverrides) => {
    // Correct endpoint verified via successful curl
    return qoreRequest('channels', 'CoreTransactions/LocalFundsTransfer', {
        method: 'POST',
        body: JSON.stringify({ 
            ...data,
            AuthenticationKey: overrides?.token 
        }),
        overrides
    });
};

export const interBankTransfer = async (data: {
    FromAccountNumber: string;
    ToAccountNumber: string;
    Amount: string; // in kobo as string
    Narration: string;
    RetrievalReference: string; // 12 chars
    DestinationBankCode: string; // CBN code
}, overrides?: QoreOverrides) => {
    // Inter-bank Transfer Mapping (Section 5 InterBankTransfer)
    return qoreRequest('channels', 'Transfer/InterBankTransfer', {
        method: 'POST',
        body: JSON.stringify({
            Amount: data.Amount,
            PayerAccountNumber: data.FromAccountNumber,
            Payer: 'ABIASMEMFB CUSTOMER', // Required by documentation
            ReceiverAccountNumber: data.ToAccountNumber,
            ReceiverBankCode: data.DestinationBankCode,
            Narration: data.Narration,
            TransactionReference: data.RetrievalReference,
            Token: overrides?.token // Section 5 uses 'Token'
        }),
        overrides
    });
};

// ── Card & Bills ────────────────────────────────────────────────────

export const requestCard = async (userId: string, accountId: string, cardType: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Card/RequestCard', {
        method: 'POST',
        body: JSON.stringify({ userId, accountId, cardType }),
        overrides
    });
};

export const freezeCard = async (cardId: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Card/FreezeCard', {
        method: 'POST',
        body: JSON.stringify({ cardId }),
        overrides
    });
};

export const updateCardLimits = async (cardId: string, channel: string, limit: number, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Card/UpdateCardLimit', {
        method: 'POST',
        body: JSON.stringify({ cardId, channel, limit }),
        overrides
    });
};

export const validateBill = async (billerCode: string, customerId: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Bills/ValidateBill', {
        method: 'POST',
        body: JSON.stringify({ billerCode, customerId }),
        overrides
    });
};

export const payBill = async (billerCode: string, amount: number, accountId: string, customerId: string, overrides?: QoreOverrides) => {
    return qoreRequest('channels', 'Bills/PayBill', {
        method: 'POST',
        body: JSON.stringify({ billerCode, amount, accountId, customerId }),
        overrides
    });
};
