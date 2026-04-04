import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveEndpoint } from '../utils/apiResolver';
import { createAdminClient } from '@/lib/supabase/admin';

const BASELINE_ACCOUNTS = ['1100321676', '1100321669', '1100321535'];

interface SyncResults {
    customersCreated: number;
    customersUpdated: number;
    accountsCreated: number;
    accountsUpdated: number;
    shadowUsersCreated: number;
    errors: string[];
}

/**
 * CustomerBulkSyncExecutor: Automates the discovery and synchronization of 
 * Core Banking customers and their associated accounts.
 */
export async function CustomerBulkSyncExecutor(targetAccounts: string[] = BASELINE_ACCOUNTS) {
    const payload = await getPayload({ config });
    const supabaseAdmin = createAdminClient();
    
    const results: SyncResults = {
        customersCreated: 0,
        customersUpdated: 0,
        accountsCreated: 0,
        accountsUpdated: 0,
        shadowUsersCreated: 0,
        errors: []
    };

    // 1. Resolve Dynamic Endpoints
    const endpoints = await payload.find({
        collection: 'endpoints',
        where: {
            or: [
                { name: { equals: 'Get Customer By Account Number' } },
                { name: { equals: 'Account Enquiry' } }
            ]
        }
    });

    const getCustomerEndpoint = endpoints.docs.find(e => e.name === 'Get Customer By Account Number');
    const getAccountEndpoint = endpoints.docs.find(e => e.name === 'Account Enquiry');

    if (!getCustomerEndpoint || !getAccountEndpoint) {
        throw new Error("Sync failed: Missing required endpoints 'Get Customer By Account Number' or 'Account Enquiry' in CMS.");
    }

    for (const accNo of targetAccounts) {
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
            if (existingCustomers.docs.length > 0) {
                const updated = await payload.update({
                    collection: 'customers',
                    id: existingCustomers.docs[0].id,
                    data: {
                        firstName: qoreCust.LastName,
                        lastName: qoreCust.OtherNames,
                        phone_number: phone,
                        email: email,
                        bvn: bvn,
                        metadata: qoreCust
                    }
                });
                customerId = updated.id;
                results.customersUpdated++;
            } else {
                const created = await payload.create({
                    collection: 'customers',
                    data: {
                        firstName: qoreCust.LastName,
                        lastName: qoreCust.OtherNames,
                        phone_number: phone,
                        email: email,
                        bvn: bvn,
                        qore_customer_id: qoreCustomerID,
                        kyc_status: 'active',
                        is_test_account: BASELINE_ACCOUNTS.includes(accNo),
                        metadata: qoreCust
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
