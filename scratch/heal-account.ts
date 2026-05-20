// import { getPayloadClient } from '../lib/payload/index';

// async function healDb() {
//     try {
//         const payload = await getPayloadClient();
//         console.log("Starting DB healing process...");

//         // 1. Fetch Application 8
//         const app = await payload.findByID({
//             collection: 'product-applications',
//             id: '8'
//         });
//         console.log("Found Application:", app.id);

//         const userId = app.user_id;
        
//         // 2. Find Customer
//         const { docs: customers } = await payload.find({
//             collection: 'customers' as any,
//             where: { supabase_id: { equals: userId } },
//             limit: 1
//         });
        
//         if (customers.length === 0) {
//             console.error("Customer not found for user ID:", userId);
//             return;
//         }
//         const customer = customers[0];
//         console.log("Found Customer:", customer.id);

//         // 3. Update Customer with Qore ID
//         await payload.update({
//             collection: 'customers' as any,
//             id: customer.id,
//             data: {
//                 qore_customer_id: '088018',
//                 kyc_status: 'active',
//                 onboarding_status: 'completed'
//             }
//         });
//         console.log("Updated Customer Qore ID to 088018");

//         // 4. Create Account record
//         const accountType = 'Savings'; // 421 is TrustSave
        
//         // Check if account already exists to prevent duplicate key
//         const { docs: existingAccounts } = await payload.find({
//             collection: 'accounts' as any,
//             where: { account_number: { equals: '1100880188' } }
//         });
        
//         let accountId;
        
//         if (existingAccounts.length === 0) {
//             const account = await payload.create({
//                 collection: 'accounts' as any,
//                 data: {
//                     user_id: userId,
//                     account_number: '1100880188',
//                     account_type: accountType,
//                     balance: 0,
//                     status: 'active',
//                     customer: customer.id,
//                     source: 'qore',
//                     is_primary: true,
//                     is_archived: false,
//                     product_type: app.product_type_id,
//                     application: app.id,
//                 } as any
//             });
//             accountId = account.id;
//             console.log("Created Account record with ID:", accountId);
//         } else {
//             accountId = existingAccounts[0].id;
//             console.log("Account already exists with ID:", accountId);
//         }

//         // 5. Update Application
//         await payload.update({
//             collection: 'product-applications',
//             id: app.id,
//             data: {
//                 workflow_stage: 'Provisioned',
//                 metadata: {
//                     ...(app.metadata || {}),
//                     provisioned_account_id: String(accountId),
//                     provisioning_error: null // clear error
//                 }
//             }
//         });
//         console.log("Application marked as Provisioned!");
        
//         console.log("Healing complete.");
//         process.exit(0);
//     } catch (err) {
//         console.error("Healing failed:", err);
//         process.exit(1);
//     }
// }

// healDb();
