import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveEndpoint } from '@/lib/workflow/utils/apiResolver';

/**
 * POST /api/sync/customers/merge
 * Handles merging a Banking profile with a Supabase Identity, 
 * reconciling fields, and mirroring financial products.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { 
            primaryCustomerId, 
            supabaseUserId, 
            profileData, 
            selectedAccountNumbers = [] 
        } = body;

        if (!primaryCustomerId || !supabaseUserId || !profileData) {
            return NextResponse.json({ error: "Missing required merge parameters." }, { status: 400 });
        }

        const payload = await getPayload({ config });

        // 1. Fetch Primary Record
        const primaryCustomer = await payload.findByID({
            collection: 'customers',
            id: primaryCustomerId,
        });

        if (!primaryCustomer) {
            return NextResponse.json({ error: "Primary customer record not found." }, { status: 404 });
        }

        // 2. Identify & Soft-Archive Redundant Records
        // Find existing customers already linked to this Supabase ID or having the same reconciled email
        const redundantCustomers = await payload.find({
            collection: 'customers',
            where: {
                and: [
                    { id: { not_equals: primaryCustomerId } },
                    {
                        or: [
                            { supabase_id: { equals: supabaseUserId } },
                            { email: { equals: profileData.email } }
                        ]
                    }
                ]
            }
        });

        const archivedIds: string[] = [];

        for (const redundant of redundantCustomers.docs) {
            // Namespace email to free it up for the primary record
            const timestamp = Date.now();
            const archivedEmail = `archived_${timestamp}_${redundant.email}`;
            const archivedBvn = redundant.bvn ? `archived_${timestamp}_${redundant.bvn}` : null;

            await payload.update({
                collection: 'customers',
                id: redundant.id,
                data: {
                    email: archivedEmail,
                    bvn: archivedBvn,
                    supabase_id: null,
                    is_associated: false,
                    is_archived: true,
                    active: false,
                    merger_status: 'archived',
                } as any
            });

            // Migrate all financial relationships
            // --- Accounts ---
            const accounts = await payload.find({
                collection: 'accounts',
                where: { customer: { equals: redundant.id } },
                limit: 100
            });
            for (const acc of accounts.docs) {
                await payload.update({
                    collection: 'accounts',
                    id: acc.id,
                    data: { customer: primaryCustomerId }
                });
            }

            // --- Loans ---
            const loans = await payload.find({
                collection: 'loans',
                where: { customer: { equals: redundant.id } },
                limit: 100
            });
            for (const loan of loans.docs) {
                await payload.update({
                    collection: 'loans',
                    id: loan.id,
                    data: { customer: primaryCustomerId }
                });
            }

            // --- Transactions ---
            const txs = await payload.find({
                collection: 'transactions',
                where: { customer: { equals: redundant.id } },
                limit: 500
            });
            for (const tx of txs.docs) {
                await payload.update({
                    collection: 'transactions',
                    id: tx.id,
                    data: { customer: primaryCustomerId }
                });
            }

            archivedIds.push(String(redundant.id));
        }

        // 3. Update Primary Record with Reconciled Data
        await payload.update({
            collection: 'customers',
            id: primaryCustomerId,
            data: {
                firstName: profileData.firstName,
                lastName: profileData.lastName,
                email: profileData.email,
                phone_number: profileData.phone_number,
                supabase_id: supabaseUserId,
                is_associated: true,
                merger_status: 'primary',
                active: true,
                is_archived: false,
            } as any
        });

        // 4. Product Mirroring (Sync selected accounts from Qore)
        const settings = await payload.findGlobal({ slug: 'site-settings' }) as any;
        const accountEnquiryEndpointId = typeof settings.sync?.accountEnquiryEndpoint === 'object' 
            ? settings.sync.accountEnquiryEndpoint.id 
            : settings.sync?.accountEnquiryEndpoint;

        if (selectedAccountNumbers.length > 0 && accountEnquiryEndpointId) {
            const getAccountEndpoint = await payload.findByID({ 
                collection: 'endpoints', 
                id: accountEnquiryEndpointId 
            });

            if (getAccountEndpoint) {
                for (const accNo of selectedAccountNumbers) {
                    try {
                        const accountResolved = await resolveEndpoint(getAccountEndpoint as any, {
                            body: { AccountNo: accNo }
                        });

                        const accRes = await fetch(accountResolved.url, {
                            method: accountResolved.method,
                            headers: accountResolved.headers,
                            body: JSON.stringify(accountResolved.body)
                        });

                        if (accRes.ok) {
                            const accData = await accRes.json();
                            const qoreAcc = accData.Payload || accData;

                            const existing = await payload.find({
                                collection: 'accounts',
                                where: { account_number: { equals: accNo } },
                                limit: 1
                            });

                            const accountTypeMap: Record<string, string> = { '10': 'Savings', '20': 'Current', '30': 'Fixed Deposit' };
                            const syncData = {
                                account_number: accNo as string,
                                account_type: (accountTypeMap[qoreAcc.AccountType] || 'Savings') as any,
                                balance: Math.round(parseFloat(qoreAcc.AvailableBalance || '0') * 100),
                                status: (qoreAcc.Status === 'Active' ? 'active' : 'frozen') as any,
                                is_frozen: qoreAcc.Status !== 'Active',
                                pnd_enabled: qoreAcc.PNDStatus === 'Active',
                                customer: primaryCustomerId,
                                user_id: profileData.email,
                                source: 'qore' as any,
                            };

                            if (existing.docs.length > 0) {
                                await payload.update({
                                    collection: 'accounts',
                                    id: existing.docs[0].id,
                                    data: syncData
                                });
                            } else {
                                await payload.create({
                                    collection: 'accounts',
                                    data: syncData
                                });
                            }
                        }
                    } catch (e) {
                        console.error(`Mirroring failed for account ${accNo}:`, e);
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            mergedRecords: archivedIds.length,
            archivedIds 
        });

    } catch (err: any) {
        console.error("Identity Merge API Error:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
