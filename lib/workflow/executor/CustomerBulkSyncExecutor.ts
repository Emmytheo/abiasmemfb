import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveEndpoint } from '../utils/apiResolver';
import { createAdminClient } from '@/lib/supabase/admin';

interface SyncResults {
    customersCreated: number;
    customersUpdated: number;
    accountsCreated: number;
    accountsUpdated: number;
    shadowUsersCreated: number;
    discoveryAccountsProcessed: number;
    errors: string[];
}

export type LogType = 'info' | 'error' | 'success' | 'warn';

/**
 * CustomerBulkSyncExecutor: Automates the discovery and synchronization of 
 * Core Banking customers and their associated accounts.
 */
export async function CustomerBulkSyncExecutor(
    targetAccounts?: string[], 
    onLog?: (message: string, type: LogType) => void
) {
    const log = (msg: string, type: LogType = 'info') => {
        console.log(`[SYNC][${type.toUpperCase()}] ${msg}`);
        if (onLog) onLog(msg, type);
    };

    log('Initializing Sync Engine...');
    const payload = await getPayload({ config });
    const supabaseAdmin = createAdminClient();
    
    // 1. Fetch Dynamic Settings and Endpoints
    const settings = await payload.findGlobal({
        slug: 'site-settings',
    }) as any;

    const syncConfig = settings.sync || {};
    const discoveryAccounts = (syncConfig.baselineAccounts || []).map((a: any) => a.accountNumber);
    
    // Prioritize passed accounts, fallback to CMS discovery accounts
    const activeAccounts = targetAccounts && targetAccounts.length > 0 
        ? targetAccounts 
        : discoveryAccounts;

    if (activeAccounts.length === 0) {
        log('No discovery accounts defined in Site Settings. Skipping bulk sync.', 'warn');
        return { 
            customersCreated: 0, 
            customersUpdated: 0, 
            accountsCreated: 0, 
            accountsUpdated: 0, 
            shadowUsersCreated: 0, 
            discoveryAccountsProcessed: 0,
            errors: ['No discovery accounts found in settings. Please add account numbers to Site Settings > Sync.'] 
        };
    }

    const customerLookupEndpointId = typeof syncConfig.customerLookupEndpoint === 'object' 
        ? syncConfig.customerLookupEndpoint?.id 
        : syncConfig.customerLookupEndpoint;
        
    const accountEnquiryEndpointId = typeof syncConfig.accountEnquiryEndpoint === 'object' 
        ? syncConfig.accountEnquiryEndpoint?.id 
        : syncConfig.accountEnquiryEndpoint;

    // Resolve specific endpoints by ID from settings
    const [getCustomerEndpoint, getAccountEndpoint] = await Promise.all([
        customerLookupEndpointId ? payload.findByID({ collection: 'endpoints', id: customerLookupEndpointId }) : Promise.resolve(null),
        accountEnquiryEndpointId ? payload.findByID({ collection: 'endpoints', id: accountEnquiryEndpointId }) : Promise.resolve(null),
        syncConfig.customerAccountsEndpoint ? payload.findByID({ collection: 'endpoints', id: typeof syncConfig.customerAccountsEndpoint === 'object' ? syncConfig.customerAccountsEndpoint.id : syncConfig.customerAccountsEndpoint }) : Promise.resolve(null)
    ]);

    if (!getCustomerEndpoint || !getAccountEndpoint) {
        throw new Error("Sync failed: Required endpoints (Customer Lookup / Account Enquiry) are not configured in Site Settings.");
    }

    const results: SyncResults = {
        customersCreated: 0,
        customersUpdated: 0,
        accountsCreated: 0,
        accountsUpdated: 0,
        shadowUsersCreated: 0,
        discoveryAccountsProcessed: activeAccounts.length,
        errors: []
    };

    for (const accNo of activeAccounts) {
        try {
            log(`Processing Discovery Seed: ${accNo}`);
            
            // 2. Fetch Customer Data
            const customerResolved = await resolveEndpoint(getCustomerEndpoint, {
                query: { accountNumber: accNo }
            });

            log(`Resolving identity for account ${accNo}...`);
            const custRes = await fetch(customerResolved.url, {
                method: customerResolved.method,
                headers: customerResolved.headers
            });

            if (!custRes.ok) throw new Error(`Failed to fetch customer for ${accNo}: ${custRes.statusText}`);
            const custData = await custRes.json();
            
            const qoreCust = custData.Payload || custData; 
            const qoreCustomerID = qoreCust.customerID || qoreCust.CustomerID || qoreCust.CustomerNo;
            
            if (!qoreCustomerID) {
                log(`Could not resolve CustomerID for ${accNo}. Skipping seed.`, 'warn');
                continue;
            }

            const email = qoreCust.Email || `${qoreCustomerID}@abia-mfb.internal`;
            const bvn = qoreCust.BankVerificationNumber || qoreCust.BVN;
            const phone = qoreCust.PhoneNumber || qoreCust.PhoneNo;

            // 3. Upsert Customer into Payload
            const existingCustomers = await payload.find({
                collection: 'customers',
                where: { qore_customer_id: { equals: qoreCustomerID } },
                limit: 1
            });

            let customerId: string | number;
            const customerBaseData = {
                firstName: qoreCust.LastName || qoreCust.FirstName || 'Unknown',
                lastName: qoreCust.OtherNames || qoreCust.Surname || 'Customer',
                phone_number: phone,
                email: email,
                bvn: bvn,
                metadata: qoreCust,
                kyc_status: (qoreCust.KYCStatus === 'Verified' || qoreCust.Status === 'Active') ? 'active' : 'pending',
                risk_tier: (qoreCust.RiskLevel === 'High') ? 'high' : (qoreCust.RiskLevel === 'Medium') ? 'medium' : 'low',
            };

            if (existingCustomers.docs.length > 0) {
                const updated = await payload.update({
                    collection: 'customers',
                    id: existingCustomers.docs[0].id,
                    data: customerBaseData
                });
                customerId = updated.id;
                results.customersUpdated++;
            } else {
                const created = await payload.create({
                    collection: 'customers',
                    data: {
                        ...customerBaseData,
                        qore_customer_id: qoreCustomerID,
                        is_test_account: discoveryAccounts.includes(accNo),
                    }
                });
                customerId = created.id;
                results.customersCreated++;
                log(`Created NEW Customer: ${qoreCustomerID} (${customerBaseData.firstName} ${customerBaseData.lastName})`, 'success');
            }

            // 4. Fetch Account Details
            const accountResolved = await resolveEndpoint(getAccountEndpoint, {
                body: { AccountNo: accNo }
            });

            const accRes = await fetch(accountResolved.url, {
                method: accountResolved.method,
                headers: accountResolved.headers,
                body: JSON.stringify(accountResolved.body)
            });

            if (!accRes.ok) throw new Error(`Failed to fetch account info for ${accNo}`);
            const accData = await accRes.json();
            const qoreAcc = accData.Payload || accData;
            
            log(`Pulled ledger data for ${accNo}. Balance: ${qoreAcc.AvailableBalance || '0'}`);

            // 5. Upsert Account into Payload
            const existingAccounts = await payload.find({
                collection: 'accounts',
                where: { account_number: { equals: accNo } },
                limit: 1
            });

            const accountTypeMap: Record<string, any> = {
                '10': 'Savings',
                '20': 'Current',
                '30': 'Fixed Deposit'
            };

            const accountData = {
                account_number: accNo,
                account_type: accountTypeMap[qoreAcc.AccountType] || 'Savings',
                balance: Math.round(parseFloat(qoreAcc.AvailableBalance || '0') * 100),
                status: qoreAcc.Status === 'Active' ? 'active' : 'frozen',
                is_frozen: qoreAcc.Status !== 'Active',
                pnd_enabled: qoreAcc.PNDStatus === 'Active',
                customer: customerId,
                user_id: email,
            };

            if (existingAccounts.docs.length > 0) {
                await payload.update({
                    collection: 'accounts',
                    id: existingAccounts.docs[0].id,
                    data: accountData
                });
                results.accountsUpdated++;
            } else {
                await payload.create({
                    collection: 'accounts',
                    data: { ...accountData, source: 'qore' }
                });
                results.accountsCreated++;
                log(`MAPPED Account: ${accNo} (${accountData.account_type})`, 'success');
            }
            
            const processedAccountNumbers: string[] = [accNo];

            // 5b. DEEP SYNC: Discover all other accounts for this Customer
            if (syncConfig.customerAccountsEndpoint) {
                try {
                    log(`Starting DEEP SYNC for Customer ${qoreCustomerID}...`);
                    const deepSyncResolved = await resolveEndpoint(syncConfig.customerAccountsEndpoint, {
                        query: { customerID: qoreCustomerID }
                    });

                    const deepRes = await fetch(deepSyncResolved.url, {
                        method: deepSyncResolved.method,
                        headers: deepSyncResolved.headers
                    });

                    if (deepRes.ok) {
                        const allAccounts = await deepRes.json();
                        const accountList = Array.isArray(allAccounts) ? allAccounts : (allAccounts.Accounts || []);
                        log(`Discovered ${accountList.length - 1} additional accounts linked to customer.`);

                        for (const otherAcc of accountList) {
                            const otherAccNo = otherAcc.AccountNo || otherAcc.accountNumber;
                            if (otherAccNo === accNo) continue;

                            log(`Syncing secondary account: ${otherAccNo}...`);
                            const existingOther = await payload.find({
                                collection: 'accounts',
                                where: { account_number: { equals: otherAccNo } },
                                limit: 1
                            });

                            const otherData = {
                                account_number: otherAccNo,
                                account_type: accountTypeMap[otherAcc.AccountType] || 'Savings',
                                balance: Math.round(parseFloat(otherAcc.AvailableBalance || '0') * 100),
                                status: otherAcc.Status === 'Active' ? 'active' : 'frozen',
                                is_frozen: otherAcc.Status !== 'Active',
                                pnd_enabled: otherAcc.PNDStatus === 'Active',
                                customer: customerId,
                                user_id: email,
                                source: 'qore',
                            };

                            if (existingOther.docs.length > 0) {
                                await payload.update({
                                    collection: 'accounts',
                                    id: existingOther.docs[0].id,
                                    data: otherData
                                });
                                results.accountsUpdated++;
                            } else {
                                await payload.create({
                                    collection: 'accounts',
                                    data: otherData
                                });
                                results.accountsCreated++;
                                log(`DISCOVERED & MAPPED: ${otherAccNo}`, 'success');
                            }
                            processedAccountNumbers.push(otherAccNo);
                        }
                    }
                } catch (deepErr) {
                    log(`Deep sync failed for customer ${qoreCustomerID}: ${deepErr instanceof Error ? deepErr.message : String(deepErr)}`, 'error');
                }
            }

            // 6. Supabase Shadow User Creation
            const { data: { users: sbUsers } } = await supabaseAdmin.auth.admin.listUsers();
            const existingSbUser = sbUsers.find(u => u.email === email);

            if (!existingSbUser) {
                const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                    email: email,
                    email_confirm: true,
                    user_metadata: {
                        full_name: `${qoreCust.LastName} ${qoreCust.OtherNames}`,
                        role: 'customer',
                        is_shadow: true,
                        qore_customer_id: qoreCustomerID
                    }
                });

                if (!createError && newUser.user) {
                    await supabaseAdmin.auth.admin.updateUserById(newUser.user.id, { ban_duration: '876000h' });
                    results.shadowUsersCreated++;
                    await payload.update({
                        collection: 'customers',
                        id: customerId,
                        data: { supabase_id: newUser.user.id, is_associated: true }
                    });
                }
            } else {
                await payload.update({
                    collection: 'customers',
                    id: customerId,
                    data: { supabase_id: existingSbUser.id, is_associated: true }
                });
            }

        } catch (err: any) {
            log(`Sync error for ${accNo}: ${err.message}`, 'error');
            results.errors.push(`Global error for ${accNo}: ${err.message}`);
        }
    }

    log('Discovery Pulse Completed.', 'info');
    return results;
}
