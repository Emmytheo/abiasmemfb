import { getPayload } from 'payload';
import config from '../payload.config';

async function run() {
    try {
        const payload = await getPayload({ config });
        const res = await payload.find({ 
            collection: 'endpoints', 
            limit: 100,
            pagination: false
        });
        console.log('--- AVAILABLE ENDPOINTS ---');
        res.docs.forEach(d => {
            console.log(`- ${d.name} (${d.method} ${d.path})`);
        });
        console.log('--- END ---');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

run();
