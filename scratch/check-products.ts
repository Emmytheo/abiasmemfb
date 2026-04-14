// import { initPayload } from '../lib/payload';

// async function checkProducts() {
//     const payload = await initPayload();
//     const products = await payload.find({
//         collection: 'product-types',
//         limit: 5,
//     });
//     console.log('Product IDs:', products.docs.map(p => ({ id: p.id, name: p.name })));
    
//     const apps = await payload.find({
//         collection: 'product-applications',
//         limit: 5,
//     });
//     console.log('App Samples:', apps.docs.map(a => ({ id: a.id, user_id: a.user_id, product: a.product_type_id })));
// }

// checkProducts().catch(console.error);
