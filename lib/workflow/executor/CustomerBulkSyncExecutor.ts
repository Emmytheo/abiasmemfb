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

/**
 * CustomerBulkSyncExecutor: Automates the discovery and synchronization of 
 * Core Banking customers and their associated accounts.
 */
export async function CustomerBulkSyncExecutor(targetAccounts?: string[]) {
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
        console.warn('[SYNC] No discovery accounts defined in Site Settings. Skipping bulk sync.');
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
            // 2. Fetch Customer Data
            const customerResolved = await resolveEndpoint(getCustomerEndpoint, {
                query: { accountNumber: accNo }
            });

            console.log(`[SYNC_DEBUG] Fetching customer for ${accNo} at ${customerResolved.url}`);
            const custRes = await fetch(customerResolved.url, {
                method: customerResolved.method,
                headers: customerResolved.headers
            });

            if (!custRes.ok) throw new Error(`Failed to fetch customer for ${accNo}: ${custRes.statusText}`);
            const custData = await custRes.json();
            console.log(`[SYNC_DEBUG] Customer Response for ${accNo}:`, JSON.stringify(custData, null, 2));
            
            const qoreCust = custData; // Staging returns the object directly
            const qoreCustomerID = qoreCust.customerID || qoreCust.CustomerID || qoreCust.CustomerNo;
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
            }

            // 4. Fetch Account Details (POST to Channels)
            const accountResolved = await resolveEndpoint(getAccountEndpoint, {
                body: { AccountNo: accNo }
            });

            console.log(`[SYNC_DEBUG] Fetching account info for ${accNo} at ${accountResolved.url} with body:`, accountResolved.body);
            const accRes = await fetch(accountResolved.url, {
                method: accountResolved.method,
                headers: accountResolved.headers,
                body: JSON.stringify(accountResolved.body)
            });

            if (!accRes.ok) throw new Error(`Failed to fetch account info for ${accNo}`);
            const accData = await accRes.json();
            console.log(`[SYNC_DEBUG] Account Response for ${accNo}:`, JSON.stringify(accData, null, 2));
            
            const qoreAcc = accData.Payload || accData;

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
                balance: Math.round(parseFloat(qoreAcc.AvailableBalance || '0') * 100), // Naira to Kobo
                status: qoreAcc.Status === 'Active' ? 'active' : 'frozen',
                is_frozen: qoreAcc.Status !== 'Active',
                pnd_enabled: qoreAcc.PNDStatus === 'Active',
                customer: customerId,
                user_id: email, // Temporary link
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
                    data: accountData
                });
                results.accountsCreated++;
            }

            // 5b. DEEP SYNC: Discover all other accounts for this Customer
            if (syncConfig.customerAccountsEndpoint) {
                try {
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

                        for (const otherAcc of accountList) {
                            const otherAccNo = otherAcc.AccountNo || otherAcc.accountNumber;
                            if (otherAccNo === accNo) continue; // Skip the one we just did

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
                            }
                        }
                    }
                } catch (deepErr) {
                    console.error(`[SYNC] Deep sync failed for customer ${qoreCustomerID}:`, deepErr);
                }
            }

            // 6. Supabase Shadow User Creation
            // Search for existing user in Supabase by email
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

                if (createError) {
                    results.errors.push(`Failed to create shadow user for ${email}: ${createError.message}`);
                } else {
                    // Lock the user immediately until admin verification
                    if (newUser.user) {
                        await supabaseAdmin.auth.admin.updateUserById(newUser.user.id, {
                            ban_duration: '876000h' // Effectively disabled
                        });
                        results.shadowUsersCreated++;
                        
                        // Update Customer record with the new Supabase ID
                        await payload.update({
                            collection: 'customers',
                            id: customerId,
                            data: {
                                supabase_id: newUser.user.id,
                                is_associated: true
                            }
                        });
                    }
                }
            } else {
                // Link existing user if not already linked
                await payload.update({
                    collection: 'customers',
                    id: customerId,
                    data: {
                        supabase_id: existingSbUser.id,
                        is_associated: true
                    }
                });
            }

        } catch (err: any) {
            results.errors.push(`Global error for ${accNo}: ${err.message}`);
        }
    }

    return results;
}
