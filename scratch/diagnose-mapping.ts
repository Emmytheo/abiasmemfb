// import { initPayload } from '../lib/api/utils/banking';

// async function diagnose() {
//     const payload = await initPayload();
    
//     // 1. Check Product Types
//     const { docs: products } = await payload.find({ collection: 'product-types' });
//     console.log('\n--- Product Types ---');
//     products.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}`));

//     // 2. Check Service Providers
//     const { docs: providers } = await payload.find({ collection: 'service-providers' });
//     console.log('\n--- Service Providers ---');
//     providers.forEach(p => console.log(`ID: ${p.id}, Name: ${p.name}`));

//     // 3. Check Existing Mappings
//     const { docs: mappings } = await payload.find({ collection: 'provider-mappings' });
//     console.log('\n--- Existing Mappings ---');
//     mappings.forEach(m => console.log(`Entity: ${m.relatedEntity?.id || m.relatedEntity}, Code: ${m.externalCode}`));
// }

// diagnose().catch(console.error);
