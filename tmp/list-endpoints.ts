
import { getPayload } from 'payload';
import config from '../payload.config';

async function list() {
  const payload = await getPayload({ config });
  
  const providers = await payload.find({ collection: 'service-providers' });
  console.log('--- PROVIDERS ---');
  providers.docs.forEach(p => {
      console.log(`- ${p.name} (Slug: ${p.slug})`);
      console.log(`  Metadata: ${JSON.stringify(p.metadata, null, 2)}`);
  });

  const endpoints = await payload.find({ collection: 'endpoints' });
  console.log('\n--- ENDPOINTS ---');
  endpoints.docs.forEach(e => {
      console.log(`- ${e.name} (Path: ${e.path})`);
  });
  
  process.exit(0);
}

list();
