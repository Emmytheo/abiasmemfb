import { getPayload } from 'payload';
import config from '../payload.config';

async function fix() {
    console.log('[Fix] Initializing Payload...');
    const payload = await getPayload({ config });

    // 1. Find the "Basic Account" product type
    console.log('[Fix] Looking for "Basic Account" product type...');
    const { docs: products } = await payload.find({
        collection: 'product-types',
        where: { name: { equals: 'Basic Account' } },
        limit: 1,
    });

    if (products.length === 0) {
        console.error('[Fix] ERROR: "Basic Account" product type not found!');
        return;
    }
    const basicAccount = products[0];
    console.log(`[Fix] Found Basic Account ID: ${basicAccount.id}`);

    // 2. Find the Qore provider
    console.log('[Fix] Looking for Qore provider...');
    const { docs: providers } = await payload.find({
        collection: 'service-providers',
        where: { slug: { equals: 'qore-digital-banking' } },
        limit: 1,
    });

    if (providers.length === 0) {
        console.error('[Fix] ERROR: Qore service provider not found!');
        return;
    }
    const qoreProvider = providers[0];
    console.log(`[Fix] Found Qore Provider ID: ${qoreProvider.id}`);

    // 3. Check if mapping already exists
    console.log('[Fix] Checking if mapping exists...');
    const { docs: mappings } = await payload.find({
        collection: 'provider-mappings',
        where: { 
            and: [
                { 'relatedEntity.value': { equals: basicAccount.id } },
                { provider: { equals: qoreProvider.id } }
            ] 
        },
        limit: 1,
    });

    if (mappings.length > 0) {
        console.log(`[Fix] Mapping already exists (ID: ${mappings[0].id}). No action needed.`);
        return;
    }

    // 4. Create the mapping
    console.log('[Fix] Creating missing mapping...');
    const newMapping = await payload.create({
        collection: 'provider-mappings',
        data: {
            internalName: 'Basic Account Qore Mapping',
            provider: qoreProvider.id,
            relatedEntity: {
                relationTo: 'product-types',
                value: basicAccount.id
            },
            externalCode: '10', // Standard Savings/Basic code for Qore
            schemaMapping: {
                // Standard mappings if needed, or leave empty for default executor behavior
            }
        } as any
    });

    console.log(`[Fix] SUCCESS: Created mapping ${newMapping.id} for Basic Account.`);
}

fix().catch(console.error);
