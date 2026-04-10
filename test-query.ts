import { getPayload } from 'payload';
import configPromise from './payload.config';

async function test() {
  try {
    const config = await configPromise;
    const payload = await getPayload({ config });
    const res = await payload.find({
      collection: 'services',
      where: { name: { equals: 'Intra-Bank Funds Transfer' } },
      limit: 1
    });
    console.log('Success:', res.docs.length);
    process.exit(0);
  } catch (e: any) {
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    if(e.cause) console.error('Cause:', e.cause);
    console.error('Stack:', e.stack);
    process.exit(1);
  }
}
test();
