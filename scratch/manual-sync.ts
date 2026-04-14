// import { initPayload } from '../lib/payload';
// import { ProvisionAccountExecutor } from '../lib/workflow/executor/ProvisionAccountExecutor';

// async function forceSync() {
//     const payload = await initPayload();
//     const applicationId = '8';

//     console.log(`[Sync] Fetching application ${applicationId}...`);
//     const application = await payload.findByID({
//         collection: 'product-applications',
//         id: applicationId,
//     });

//     if (!application) {
//         console.error(`[Sync] Application ${applicationId} not found.`);
//         return;
//     }

//     const userId = application.user_id;
//     console.log(`[Sync] Found User ID: ${userId}`);

//     const env: any = {
//         payload,
//         executionId: `MANUAL-SYNC-${Date.now()}`,
//         inputs: {
//             user_id: userId,
//             application_id: applicationId,
//         },
//         outputs: {},
//         getInput: (key: string) => env.inputs[key],
//         setOutput: (key: string, val: any) => { env.outputs[key] = val },
//         log: { 
//             info: (m: string) => console.log(`[INFO] ${m}`), 
//             error: (m: string) => console.error(`[ERROR] ${m}`) 
//         }
//     };

//     console.log(`[Sync] Executing ProvisionAccountExecutor...`);
//     const success = await ProvisionAccountExecutor(env);

//     if (success) {
//         console.log(`[Sync] SUCCESS: Application ${applicationId} has been provisioned on Qore.`);
//     } else {
//         console.error(`[Sync] FAILED: Check logs above for errors.`);
//     }
// }

// forceSync().catch(console.error);
