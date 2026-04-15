import { initPayload } from '../lib/api/utils/banking';
import { AccountOfficerSyncExecutor } from '../lib/workflow/executor/AccountOfficerSyncExecutor';

async function runSync() {
    const payload = await initPayload();
    
    console.log('--- STARTING ACCOUNT OFFICER SYNC ---');
    
    const results = await AccountOfficerSyncExecutor((msg, type) => {
        console.log(`[LOG][${type.toUpperCase()}] ${msg}`);
    });
    
    console.log('--- SYNC COMPLETED ---');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    if (results.officersCreated > 0 || results.officersUpdated > 0) {
        const officers = await payload.find({
            collection: 'account-officers',
            limit: 5
        });
        console.log('Sample Officers in DB:', officers.docs.map((o: { name: any; code: any; }) => ({ name: o.name, code: o.code })));
    }
}

runSync().catch(err => {
    console.error('Fatal Script Error:', err);
    process.exit(1);
});
