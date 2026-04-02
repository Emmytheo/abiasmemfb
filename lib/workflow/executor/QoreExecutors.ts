import { ExecutionEnvironment } from '../types/executor';
import { WorkflowTask, TaskType } from '../types/task';
import * as qoreActions from '../../api/adapters/qore/actions';
import { QoreOverrides } from '../../api/adapters/qore/actions';

/**
 * Helper to resolve Qore dynamic overrides (InstitutionCode, GroupCode, and Decrypted Token)
 * from the workflow task inputs or environment fallbacks.
 */
async function getQoreOverrides(env: ExecutionEnvironment<any>): Promise<QoreOverrides> {
    const providerId = env.getInput('providerId');
    const manualCredentialId = env.getInput('credentialId') || env.getInput('tokenRef');
    const manualInstitutionCode = env.getInput('institutionCode');
    const manualGroupCode = env.getInput('groupCode');

    const overrides: QoreOverrides = {};

    // 1. Resolve from Provider if available (Service Provider system)
    if (providerId) {
        const provider = await env.getProvider(providerId);
        if (provider) {
            // Resolve secret linked to provider
            const secretRef = (provider as any).secret || (provider as any).secretId;
            const secretId = typeof secretRef === 'object' ? secretRef.id : secretRef;
            if (secretId) {
                overrides.token = await env.resolveSecret(secretId);
            }
            // Resolve metadata (institutionCode, groupCode)
            const metadata = provider.metadata as any;
            if (metadata?.institutionCode) overrides.institutionCode = metadata.institutionCode;
            if (metadata?.groupCode) overrides.groupCode = metadata.groupCode;
        }
    }

    // 2. Manual overrides (top priority / legacy support)
    if (manualCredentialId) {
        overrides.token = await env.resolveSecret(manualCredentialId);
    }
    if (manualInstitutionCode) {
        overrides.institutionCode = manualInstitutionCode;
    }
    if (manualGroupCode) {
        overrides.groupCode = manualGroupCode;
    }

    return overrides;
}

export const QoreRequestCardExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_REQUEST_CARD }>): Promise<boolean> => {
    try {
        const userId = env.getInput('userId');
        const accountId = env.getInput('accountId');
        const cardType = env.getInput('cardType');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.requestCard(userId, accountId, cardType, overrides);
        env.setOutput('cardId', res.cardId || `CARD_${Date.now()}`);
        env.setOutput('status', res.status || 'ISSUED');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Request Card failed: ${e.message}`);
        return false;
    }
};

export const QoreFreezeCardExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_FREEZE_CARD }>): Promise<boolean> => {
    try {
        const cardId = env.getInput('cardId');
        const overrides = await getQoreOverrides(env);
        await qoreActions.freezeCard(cardId, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Freeze Card failed: ${e.message}`);
        return false;
    }
};

export const QoreUpdateCardLimitsExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_UPDATE_CARD_LIMITS }>): Promise<boolean> => {
    try {
        const cardId = env.getInput('cardId');
        const channel = env.getInput('channel');
        const limitAmount = env.getInput('limitAmount');
        const overrides = await getQoreOverrides(env);
        await qoreActions.updateCardLimits(cardId, channel, Number(limitAmount), overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Update Card Limits failed: ${e.message}`);
        return false;
    }
};

export const QoreFreezeAccountExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_FREEZE_ACCOUNT }>): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        await qoreActions.freezeAccount(accountNumber, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Freeze Account failed: ${e.message}`);
        return false;
    }
};

export const QoreManageLienExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_MANAGE_LIEN }>): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const amount = env.getInput('amount');
        const action = env.getInput('action');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.manageLien(accountNumber, Number(amount), action, overrides);
        env.setOutput('success', true);
        env.setOutput('lienId', res.lienId || `LIEN_${Date.now()}`);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Manage Lien failed: ${e.message}`);
        return false;
    }
};

export const QoreValidateBillExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_VALIDATE_BILL }>): Promise<boolean> => {
    try {
        const billerCode = env.getInput('billerCode');
        const customerId = env.getInput('customerId');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.validateBill(billerCode, customerId, overrides);
        env.setOutput('isValid', true);
        env.setOutput('customerName', res.customerName || 'Verified Customer');
        env.setOutput('details', res.details || {});
        return true;
    } catch (e: any) {
        env.log.error(`Qore Validate Bill failed: ${e.message}`);
        return false; 
    }
};

export const QorePayBillExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_PAY_BILL }>): Promise<boolean> => {
    try {
        const billerCode = env.getInput('billerCode');
        const amount = env.getInput('amount');
        const accountId = env.getInput('accountId');
        const customerId = env.getInput('customerId');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.payBill(billerCode, Number(amount), accountId, customerId, overrides);
        env.setOutput('success', true);
        env.setOutput('transactionReference', res.transactionReference || `TX_${Date.now()}`);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Pay Bill failed: ${e.message}`);
        return false;
    }
};

export const QoreCreateFixedDepositExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CREATE_FIXED_DEPOSIT }>): Promise<boolean> => {
    try {
        const userId = env.getInput('userId');
        const sourceAccountId = env.getInput('sourceAccountId');
        const amount = env.getInput('amount');
        const durationMonths = env.getInput('durationMonths');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.createFixedDeposit(userId, sourceAccountId, Number(amount), Number(durationMonths), overrides);
        env.setOutput('depositId', res.depositId || `FD_${Date.now()}`);
        env.setOutput('expectedMaturityDate', res.maturityDate || new Date().toISOString());
        return true;
    } catch (e: any) {
        env.log.error(`Qore Create Fixed Deposit failed: ${e.message}`);
        return false;
    }
};

export const QoreLiquidateFixedDepositExecutor = async (env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_LIQUIDATE_FIXED_DEPOSIT }>): Promise<boolean> => {
    try {
        const depositId = env.getInput('depositId');
        const destinationAccountId = env.getInput('destinationAccountId');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.liquidateFixedDeposit(depositId, destinationAccountId, overrides);
        env.setOutput('success', true);
        env.setOutput('liquidatedAmount', res.liquidatedAmount || 0);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Liquidate Fixed Deposit failed: ${e.message}`);
        return false;
    }
};

// ── New Extended Qore Executors ─────────────────────────────────────────────

export const QoreUnfreezeAccountExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_UNFREEZE_ACCOUNT }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const referenceId = env.getInput('referenceId');
        const reason = env.getInput('reason');
        const overrides = await getQoreOverrides(env);
        await qoreActions.unfreezeAccount(accountNumber, referenceId, reason, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Unfreeze Account failed: ${e.message}`);
        return false;
    }
};

export const QoreCheckFreezeStatusExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CHECK_FREEZE_STATUS }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.checkFreezeStatus(accountNumber, overrides);
        env.setOutput('isFrozen', res.IsFrozen ?? res.isFrozen ?? false);
        env.setOutput('fullName', res.FullName || res.fullName || '');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Check Freeze Status failed: ${e.message}`);
        return false;
    }
};

export const QoreCheckLienStatusExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CHECK_LIEN_STATUS }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.checkLienStatus(accountNumber, overrides);
        env.setOutput('isLocked', res.IsLocked ?? res.isLocked ?? false);
        env.setOutput('fullName', res.FullName || res.fullName || '');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Check Lien Status failed: ${e.message}`);
        return false;
    }
};

export const QoreActivatePNDExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_ACTIVATE_PND }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        await qoreActions.activatePND(accountNumber, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Activate PND failed: ${e.message}`);
        return false;
    }
};

export const QoreDeactivatePNDExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_DEACTIVATE_PND }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        await qoreActions.deactivatePND(accountNumber, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Deactivate PND failed: ${e.message}`);
        return false;
    }
};

export const QoreGetAccountTransactionsExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_GET_ACCOUNT_TRANSACTIONS }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const fromDate = env.getInput('fromDate');
        const toDate = env.getInput('toDate');
        const numberOfItems = Number(env.getInput('numberOfItems') || 50);
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.getQoreAccountTransactions(accountNumber, fromDate, toDate, numberOfItems, overrides);
        const transactions = res.Payload || res.payload || res.transactions || [];
        env.setOutput('transactions', transactions);
        env.setOutput('count', Array.isArray(transactions) ? transactions.length : 0);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Get Account Transactions failed: ${e.message}`);
        return false;
    }
};

export const QoreGenerateStatementExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_GENERATE_STATEMENT }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const fromDate = env.getInput('fromDate');
        const toDate = env.getInput('toDate');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.generateAccountStatement(accountNumber, fromDate, toDate, overrides);
        const payload = res.Payload || res.payload || res;
        env.setOutput('statementBase64', payload.StatementBase64 || payload.statementBase64 || '');
        env.setOutput('fileName', payload.FileName || payload.fileName || 'statement.pdf');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Generate Statement failed: ${e.message}`);
        return false;
    }
};

export const QoreUpgradeAccountTierExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_UPGRADE_ACCOUNT_TIER }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const accountTier = env.getInput('accountTier');
        const overrides = await getQoreOverrides(env);
        await qoreActions.upgradeAccountTier(accountNumber, accountTier, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Upgrade Account Tier failed: ${e.message}`);
        return false;
    }
};

export const QoreUploadDocumentExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_UPLOAD_DOCUMENT }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const documentType = Number(env.getInput('documentType'));
        const imageBase64 = env.getInput('imageBase64');
        const overrides = await getQoreOverrides(env);
        await qoreActions.uploadDocument(accountNumber, documentType, imageBase64, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Upload Document failed: ${e.message}`);
        return false;
    }
};

export const QoreCloseAccountExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CLOSE_ACCOUNT }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const narration = env.getInput('narration');
        const overrides = await getQoreOverrides(env);
        await qoreActions.closeAccount(accountNumber, narration, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Close Account failed: ${e.message}`);
        return false;
    }
};

export const QoreRetrieveBVNExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_RETRIEVE_BVN }>
): Promise<boolean> => {
    try {
        const bvn = env.getInput('bvn');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.retrieveBVN(bvn, overrides.token);
        const payload = res.Payload || res;
        env.setOutput('firstName', payload.FirstName || payload.firstName || '');
        env.setOutput('lastName', payload.LastName || payload.lastName || '');
        env.setOutput('isSuccessful', res.IsSuccessful ?? true);
        env.setOutput('details', payload);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Retrieve BVN failed: ${e.message}`);
        return false;
    }
};

// ── Account Creation & Management Executors ──────────────────────────────────

export const QoreCreateAccountQuickExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CREATE_ACCOUNT_QUICK }>
): Promise<boolean> => {
    try {
        const overrides = await getQoreOverrides(env);
        const qoreRes = await qoreActions.createAccountQuick({
            TransactionTrackingRef: env.getInput('transactionTrackingRef'),
            AccountOpeningTrackingRef: env.getInput('accountOpeningTrackingRef'),
            ProductCode: env.getInput('productCode'),
            LastName: env.getInput('lastName'),
            OtherNames: env.getInput('otherNames'),
            PhoneNo: env.getInput('phoneNo'),
            Gender: Number(env.getInput('gender') ?? 0),
            PlaceOfBirth: env.getInput('placeOfBirth') || '',
            DateOfBirth: env.getInput('dateOfBirth'),
            Address: env.getInput('address'),
            Email: env.getInput('email') || undefined,
            BVN: env.getInput('bvn') || undefined,
        }, overrides);

        const qorePayload = qoreRes.Payload || qoreRes;
        const accountNumber = qorePayload.AccountNumber || qorePayload.accountNumber;

        if (!accountNumber) {
            env.log.error('Qore Create Account Quick: API succeeded but no account number was returned');
            return false;
        }

        env.setOutput('accountNumber', accountNumber);
        env.setOutput('customerId', qorePayload.CustomerID || qorePayload.customerId || '');
        env.setOutput('fullName', qorePayload.FullName || qorePayload.fullName || '');

        // ── Sync to Local Database ──────────────────────────────────────────
        const payload = env.payload;
        if (payload) {
            try {
                await payload.create({
                    collection: 'accounts',
                    data: {
                        user_id: env.getInput('userId') || qorePayload.CustomerID || qorePayload.customerId,
                        account_number: accountNumber,
                        account_type: env.getInput('accountType') || 'Savings',
                        balance: 0,
                        currency: 'NGN',
                        status: 'active',
                        product_type: env.getInput('productTypeId') || undefined,
                    },
                });
                env.log.info(`Qore Sync: Account ${accountNumber} recorded locally.`);
            } catch (syncErr: any) {
                env.log.warn(`Qore Sync Warning: API succeeded but local record failed: ${syncErr.message}`);
            }
        }

        return true;
    } catch (e: any) {
        env.log.error(`Qore Create Account Quick failed: ${e.message}`);
        return false;
    }
};

export const QoreCreateCustomerAndAccountExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CREATE_CUSTOMER_AND_ACCOUNT }>
): Promise<boolean> => {
    try {
        const qoreRes = await qoreActions.createCustomerAndAccount({
            LastName: env.getInput('lastName'),
            OtherNames: env.getInput('otherNames'),
            PhoneNo: env.getInput('phoneNo'),
            Gender: Number(env.getInput('gender') ?? 0),
            DateOfBirth: env.getInput('dateOfBirth'),
            Address: env.getInput('address'),
            BVN: env.getInput('bvn') || undefined,
            Email: env.getInput('email') || undefined,
            HomeAddress: env.getInput('homeAddress') || undefined,
            City: env.getInput('city') || undefined,
            LGA: env.getInput('lga') || undefined,
            State: env.getInput('state') || undefined,
            ProductCode: env.getInput('productCode'),
            TransactionTrackingRef: env.getInput('transactionTrackingRef'),
        });

        const qorePayload = qoreRes.Payload || qoreRes;
        const accountNumber = qorePayload.AccountNumber || qorePayload.accountNumber;
        const customerId = qorePayload.CustomerID || qorePayload.customerId;

        if (!accountNumber || !customerId) {
            env.log.error('Qore Create Customer & Account: API succeeded but data missing');
            return false;
        }

        env.setOutput('accountNumber', accountNumber);
        env.setOutput('customerId', customerId);
        env.setOutput('fullName', qorePayload.FullName || qorePayload.fullName || '');

        // ── Sync to Local Database ──────────────────────────────────────────
        const payload = env.payload;
        if (payload) {
            try {
                // 1. Sync User/Customer
                await payload.create({
                    collection: 'users',
                    data: {
                        full_name: `${env.getInput('lastName')} ${env.getInput('otherNames')}`,
                        email: env.getInput('email') || `${customerId}@mfb.local`,
                        role: 'customer',
                        qore_id: customerId, // Storing Qore ID for future reference
                    } as any,
                });

                // 2. Sync Account
                await payload.create({
                    collection: 'accounts',
                    data: {
                        user_id: customerId, // Link by Qore ID or Supabase ID if available
                        account_number: accountNumber,
                        account_type: 'Savings',
                        balance: 0,
                        currency: 'NGN',
                        status: 'active',
                    },
                });
                env.log.info(`Qore Sync: Customer ${customerId} and Account ${accountNumber} recorded locally.`);
            } catch (syncErr: any) {
                env.log.warn(`Qore Sync Warning: API succeeded but local sync failed: ${syncErr.message}`);
            }
        }

        return true;
    } catch (e: any) {
        env.log.error(`Qore Create Customer And Account failed: ${e.message}`);
        return false;
    }
};

export const QoreAccountEnquiryExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_ACCOUNT_ENQUIRY }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.accountEnquiry(accountNumber, overrides);
        const data = res.Payload || res;
        env.setOutput('accountNumber', data.AccountNumber || data.accountNumber || accountNumber);
        env.setOutput('fullName', data.FullName || data.fullName || '');
        env.setOutput('availableBalance', data.AvailableBalance ?? data.availableBalance ?? 0);
        env.setOutput('status', data.Status || data.status || '');
        env.setOutput('details', data);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Account Enquiry failed: ${e.message}`);
        return false;
    }
};

export const QoreAccountSummaryExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_ACCOUNT_SUMMARY }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const institutionCode = env.getInput('institutionCode');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.getAccountSummary(accountNumber, institutionCode, overrides);
        const data = res.Payload || res;
        env.setOutput('accountNumber', data.AccountNumber || data.accountNumber || accountNumber);
        env.setOutput('fullName', data.FullName || data.fullName || '');
        env.setOutput('accountBalance', data.AccountBalance ?? data.accountBalance ?? 0);
        env.setOutput('branchName', data.BranchName || data.branchName || '');
        env.setOutput('summary', data);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Account Summary failed: ${e.message}`);
        return false;
    }
};

export const QoreGetAccountsByCustomerExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_GET_ACCOUNTS_BY_CUSTOMER }>
): Promise<boolean> => {
    try {
        const customerId = env.getInput('customerId');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.getAccountsByCustomer(customerId, overrides);
        const accounts = res.Payload || res.payload || [];
        env.setOutput('accounts', accounts);
        env.setOutput('count', Array.isArray(accounts) ? accounts.length : 0);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Get Accounts By Customer failed: ${e.message}`);
        return false;
    }
};

export const QoreCheckPNDStatusExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CHECK_PND_STATUS }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.checkPNDStatus(accountNumber, overrides);
        env.setOutput('isLocked', res.IsLocked ?? res.isLocked ?? false);
        env.setOutput('fullName', res.FullName || res.fullName || '');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Check PND Status failed: ${e.message}`);
        return false;
    }
};

export const QoreUpdateNotificationPreferenceExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_UPDATE_NOTIFICATION_PREFERENCE }>
): Promise<boolean> => {
    try {
        const accountNumber = env.getInput('accountNumber');
        const preference = Number(env.getInput('notificationPreference') ?? 1);
        const overrides = await getQoreOverrides(env);
        await qoreActions.updateNotificationPreference(accountNumber, preference, overrides);
        env.setOutput('success', true);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Update Notification Preference failed: ${e.message}`);
        return false;
    }
};

export const QoreGetAccountByTrackingRefExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_GET_ACCOUNT_BY_TRACKING_REF }>
): Promise<boolean> => {
    try {
        const ref = env.getInput('transactionTrackingRef');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.getAccountByTrackingRef(ref, overrides);
        const data = res.Payload || res;
        env.setOutput('accountNumber', data.AccountNumber || data.accountNumber || '');
        env.setOutput('fullName', data.FullName || data.fullName || '');
        env.setOutput('accountBalance', data.AccountBalance ?? data.accountBalance ?? 0);
        env.setOutput('details', data);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Get Account By Tracking Ref failed: ${e.message}`);
        return false;
    }
};

// ── Customer Management Executors ────────────────────────────────────────────

export const QoreCreateCustomerExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_CREATE_CUSTOMER }>
): Promise<boolean> => {
    try {
        const res = await qoreActions.createCustomer({
            LastName: env.getInput('lastName'),
            OtherNames: env.getInput('otherNames'),
            BVN: env.getInput('bvn') || undefined,
            DOB: env.getInput('dateOfBirth'),
            PhoneNo: env.getInput('phoneNo'),
            Email: env.getInput('email') || undefined,
            Address: env.getInput('address'),
        });
        const data = res.Payload || res;
        env.setOutput('customerId', data.CustomerID || data.customerId || '');
        env.setOutput('fullName', data.FullName || data.fullName || '');
        return true;
    } catch (e: any) {
        env.log.error(`Qore Create Customer failed: ${e.message}`);
        return false;
    }
};

export const QoreGetCustomerByBVNExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_GET_CUSTOMER_BY_BVN }>
): Promise<boolean> => {
    try {
        const bvn = env.getInput('bvn');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.getCustomerByBVN(bvn, overrides);
        const data = res.Payload || res;
        env.setOutput('customerId', data.CustomerID || data.customerId || '');
        env.setOutput('fullName', data.FullName || data.fullName || '');
        env.setOutput('phoneNo', data.PhoneNo || data.phoneNo || '');
        env.setOutput('email', data.Email || data.email || '');
        env.setOutput('details', data);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Get Customer By BVN failed: ${e.message}`);
        return false;
    }
};

// ── Transaction Management Executors ─────────────────────────────────────────

export const QoreTransactionStatusQueryExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_TRANSACTION_STATUS_QUERY }>
): Promise<boolean> => {
    try {
        const retrievalReference = env.getInput('retrievalReference');
        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.queryTransactionStatus(retrievalReference, overrides);
        const data = res.Payload || res;
        env.setOutput('status', data.Status || data.status || '');
        env.setOutput('transactionReference', data.TransactionReference || data.transactionReference || retrievalReference);
        env.setOutput('isSuccessful', res.IsSuccessful ?? true);
        env.setOutput('details', data);
        return true;
    } catch (e: any) {
        env.log.error(`Qore Transaction Status Query failed: ${e.message}`);
        return false;
    }
};

export const QoreIntraBankTransferExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_INTRA_BANK_TRANSFER }>
): Promise<boolean> => {
    try {
        const amountNaira = Number(env.getInput('amount'));
        const amountKobo = Math.round(amountNaira * 100);
        const narration = env.getInput('narration') || 'Intra-bank Transfer';
        const retrievalReference = env.getInput('retrievalReference') || `TX-${Date.now()}`.slice(0, 12);
        const overrides = await getQoreOverrides(env);

        const res = await qoreActions.intraBankTransfer({
            FromAccountNumber: env.getInput('fromAccountNumber'),
            ToAccountNumber: env.getInput('toAccountNumber'),
            Amount: String(amountKobo),
            Narration: narration,
            RetrievalReference: retrievalReference,
        }, overrides);

        env.setOutput('isSuccessful', res.IsSuccessful ?? true);
        env.setOutput('transactionReference', res.TransactionReference || retrievalReference);
        env.setOutput('details', res.Payload || res);

        // ── Local Transaction Log ──────────────────────────────────────────
        const payload = env.payload;
        if (payload) {
            try {
                await payload.create({
                    collection: 'transactions',
                    data: {
                        amount: amountKobo,
                        type: 'transfer',
                        status: 'successful',
                        reference: res.TransactionReference || retrievalReference,
                        narration: env.getInput('narration') || 'Intra-bank Transfer',
                    } as any,
                });
            } catch (syncErr) { /* non-critical */ }
        }

        return true;
    } catch (e: any) {
        env.log.error(`Qore Intra-bank Transfer failed: ${e.message}`);
        return false;
    }
};

export const QoreInterBankTransferExecutor = async (
    env: ExecutionEnvironment<WorkflowTask & { type: TaskType.QORE_INTER_BANK_TRANSFER }>
): Promise<boolean> => {
    try {
        const amountNaira = Number(env.getInput('amount'));
        const amountKobo = Math.round(amountNaira * 100);
        const retrievalReference = env.getInput('retrievalReference') || `TX-${Date.now()}`.slice(0, 12);

        const overrides = await getQoreOverrides(env);
        const res = await qoreActions.interBankTransfer({
            FromAccountNumber: env.getInput('fromAccountNumber'),
            ToAccountNumber: env.getInput('toAccountNumber'),
            Amount: String(amountKobo),
            Narration: env.getInput('narration') || 'Inter-bank Transfer',
            RetrievalReference: retrievalReference,
            DestinationBankCode: env.getInput('destinationBankCode'),
        }, overrides);

        env.setOutput('isSuccessful', res.IsSuccessful ?? true);
        env.setOutput('transactionReference', res.TransactionReference || retrievalReference);
        env.setOutput('details', res.Payload || res);

        return true;
    } catch (e: any) {
        env.log.error(`Qore Inter-bank Transfer failed: ${e.message}`);
        return false;
    }
};
