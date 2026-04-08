
import { getPayload } from 'payload';
import configPromise from '../payload.config';

async function testUpdate() {
  const payload = await getPayload({ config: configPromise });
  
  // Find a transaction and try to update its customer field
  const tx = await payload.find({ collection: 'transactions', limit: 1 });
  if (tx.docs.length > 0) {
    const doc = tx.docs[0];
    console.log(`Attempting to update transaction ${doc.id}...`);
    try {
      await payload.update({
        collection: 'transactions',
        id: doc.id,
        data: { customer: doc.customer || 'invalid_id_test' },
        overrideAccess: true,
      });
      console.log('Transaction update successful');
    } catch (e: any) {
      console.error('Transaction update FAILED with:', JSON.stringify(e.data || e, null, 2));
    }
  }

  // Find an account and try to update its customer field
  const acc = await payload.find({ collection: 'accounts', limit: 1 });
  if (acc.docs.length > 0) {
    const doc = acc.docs[0];
    console.log(`Attempting to update account ${doc.id}...`);
    try {
      await payload.update({
        collection: 'accounts',
        id: doc.id,
        data: { customer: typeof doc.customer === 'object' ? doc.customer.id : doc.customer },
        overrideAccess: true,
      });
      console.log('Account update successful');
    } catch (e: any) {
        console.error('Account update FAILED with:', JSON.stringify(e.data || e, null, 2));
    }
  }

  process.exit(0);
}

testUpdate();
