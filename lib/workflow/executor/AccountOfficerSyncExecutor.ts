import { getPayload } from 'payload';
import config from '@payload-config';
import { resolveEndpoint } from '../utils/apiResolver';

interface SyncResults {
    officersCreated: number;
    officersUpdated: number;
    totalFound: number;
    errors: string[];
}

export type LogType = 'info' | 'error' | 'success' | 'warn';

/**
 * AccountOfficerSyncExecutor: Synchronizes the list of active Account Officers/Staff
 * from the Core Banking system (BankOne).
 */
export async function AccountOfficerSyncExecutor(
    onLog?: (message: string, type: LogType) => void
) {
    const log = (msg: string, type: LogType = 'info') => {
        console.log(`[OFFICER-SYNC][${type.toUpperCase()}] ${msg}`);
        if (onLog) onLog(msg, type);
    };

    log('Initializing Account Officer Sync...');
    const payload = await getPayload({ config });

    // 1. Fetch Dynamic Settings
    const settings = await payload.findGlobal({
        slug: 'site-settings',
    }) as any;

    const syncConfig = settings.sync || {};
    const officerEndpointId = typeof syncConfig.accountOfficerEndpoint === 'object'
        ? syncConfig.accountOfficerEndpoint?.id
        : syncConfig.accountOfficerEndpoint;

    if (!officerEndpointId) {
        log('No Account Officer endpoint configured in Site Settings. Skipping.', 'warn');
        return {
            officersCreated: 0,
            officersUpdated: 0,
            totalFound: 0,
            errors: ['Officer Sync endpoint missing in Site Settings.']
        };
    }

    // 2. Resolve Endpoint
    const officerEndpoint = await payload.findByID({
        collection: 'endpoints',
        id: officerEndpointId,
    });

    if (!officerEndpoint) {
        throw new Error("Specified Officer Sync endpoint not found in collection.");
    }

    const mfbCode = (officerEndpoint as any).queryParams?.find((p: any) => p.key === 'mfbCode')?.value || '0017';

    const resolved = await resolveEndpoint(officerEndpoint, {
        query: { mfbCode }
    });

    log(`Calling BankOne API to fetch officers for MFB ${mfbCode}...`);

    try {
        const response = await fetch(resolved.url, {
            method: resolved.method,
            headers: resolved.headers
        });

        if (!response.ok) {
            throw new Error(`API failed: ${response.statusText}`);
        }

        const data = await response.json();
        const rawOfficers = Array.isArray(data) ? data : (data.Payload || data.officers || []);

        log(`Discovered ${rawOfficers.length} staff records from Qore.`);

        const results: SyncResults = {
            officersCreated: 0,
            officersUpdated: 0,
            totalFound: rawOfficers.length,
            errors: []
        };

        for (const raw of rawOfficers) {
            try {
                const code = raw.Code;
                const name = raw.Name;

                if (!code || !name) {
                    log(`Skipping invalid record: ${JSON.stringify(raw)}`, 'warn');
                    continue;
                }

                // Upsert into AccountOfficers collection
                const existing = await payload.find({
                    collection: 'account-officers',
                    where: { code: { equals: code } },
                    limit: 1
                });

                const dataToSave = {
                    name,
                    code,
                    branch: raw.Branch,
                    email: raw.Email,
                    phoneNumber: raw.PhoneNumber,
                    gender: raw.Gender,
                    metadata: raw,
                };

                if (existing.docs.length > 0) {
                    await payload.update({
                        collection: 'account-officers',
                        id: existing.docs[0].id,
                        data: dataToSave
                    });
                    results.officersUpdated++;
                } else {
                    await payload.create({
                        collection: 'account-officers',
                        data: dataToSave
                    });
                    results.officersCreated++;
                    log(`Created NEW Account Officer: ${name} (${code})`, 'success');
                }
            } catch (innerErr: any) {
                log(`Error syncing officer ${raw.Name}: ${innerErr.message}`, 'error');
                results.errors.push(`Officer ${raw.Name}: ${innerErr.message}`);
            }
        }

        log(`Sync Completed. Created: ${results.officersCreated}, Updated: ${results.officersUpdated}`);
        return results;

    } catch (err: any) {
        log(`Fatal Sync Error: ${err.message}`, 'error');
        return {
            officersCreated: 0,
            officersUpdated: 0,
            totalFound: 0,
            errors: [err.message]
        };
    }
}
