
import { getPayload } from 'payload';
import configPromise from '../payload.config';

async function audit() {
  const payload = await getPayload({ config: configPromise });
  
  const chidi = await payload.find({
    collection: 'customers',
    where: {
      or: [
        { email: { contains: 'chidi.mgbara' } },
        { firstName: { contains: 'Chidi' } }
      ]
    }
  });

  const fajuke = await payload.find({
    collection: 'customers',
    where: {
      or: [
        { email: { contains: 'fajuke' } },
        { lastName: { contains: 'Fajuke' } }
      ]
    }
  });

  console.log('--- CHIDI RECORDS ---');
  console.log(JSON.stringify(chidi.docs, null, 2));
  
  console.log('--- FAJUKE RECORDS ---');
  console.log(JSON.stringify(fajuke.docs, null, 2));

  for (const doc of [...chidi.docs, ...fajuke.docs]) {
    const accounts = await payload.find({
      collection: 'accounts',
      where: { customer: { equals: doc.id } }
    });
    console.log(`Accounts for ${doc.email} (${doc.id}):`, accounts.docs.length);
    if (accounts.docs.length > 0) {
        console.log(JSON.stringify(accounts.docs.map(a => ({ no: a.account_number, source: a.source })), null, 2));
    }
  }

  process.exit(0);
}

audit();
