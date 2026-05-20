import { getPayload } from 'payload';
import config from '@payload-config';

async function clearBasicAccountMapping() {
    console.log('[Clear] Initializing Payload...');
    const payload = await getPayload({ config });

    // 1. Find the "Basic Account" product type
    console.log('[Clear] Looking for "Basic Account" product type...');
    const { docs: products } = await payload.find({
        collection: 'product-types',
        where: { name: { equals: 'Basic Account' } },
        limit: 1,
    });

    if (products.length === 0) {
        console.log('[Clear] Basic Account product type not found in database.');
        return;
    }
    const basicAccount = products[0];
    console.log(`[Clear] Found Basic Account ID: ${basicAccount.id}`);

    // 2. Find any provider mappings linked to this product type
    console.log('[Clear] Looking for provider mappings linked to Basic Account...');
    const { docs: mappings } = await payload.find({
        collection: 'provider-mappings',
        where: { 
            'relatedEntity.value': { equals: basicAccount.id }
        },
        limit: 10,
    });

    if (mappings.length === 0) {
        console.log('[Clear] No provider mappings found for Basic Account. It is already local-only!');
        return;
    }

    for (const mapping of mappings) {
        console.log(`[Clear] Deleting mapping ID: ${mapping.id} (Current Code: "${mapping.externalCode}")`);
        await payload.delete({
            collection: 'provider-mappings',
            id: mapping.id,
        });
    }

    console.log('[Clear] SUCCESS: All provider mappings for "Basic Account" have been cleared! It will now dynamically use local-only provisioning.');
}

clearBasicAccountMapping().catch(console.error);
