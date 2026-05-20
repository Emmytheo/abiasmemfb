import { getPayload } from 'payload';
import config from '../payload.config';

async function run() {
    try {
        const payload = await getPayload({ config });
        
        console.log("\n=== SERVICES ===");
        const services = await payload.find({ collection: 'services', limit: 100 });
        for (const svc of services.docs) {
            console.log(`Service: ${svc.name} (ID: ${svc.id})`);
            console.log(`- service_intent: ${svc.service_intent}`);
            console.log(`- validation_workflow: ${svc.validation_workflow ? (typeof svc.validation_workflow === 'object' ? svc.validation_workflow.name : svc.validation_workflow) : 'NONE'}`);
            console.log(`- execution_workflow: ${svc.execution_workflow ? (typeof svc.execution_workflow === 'object' ? svc.execution_workflow.name : svc.execution_workflow) : 'NONE'}`);
        }
        
        console.log("\n=== WORKFLOWS ===");
        const workflows = await payload.find({ collection: 'workflows', limit: 100 });
        for (const wf of workflows.docs) {
            console.log(`Workflow: ${wf.name} (ID: ${wf.id})`);
            console.log(`- Status: ${wf.status}`);
            console.log(`- Nodes:`, wf.definition?.nodes?.map((n: any) => `${n.data.type} (${n.id})`));
        }

        console.log("\n=== ENDPOINTS ===");
        const endpoints = await payload.find({ collection: 'endpoints', limit: 100 });
        for (const ep of endpoints.docs) {
            console.log(`Endpoint: ${ep.name} (ID: ${ep.id})`);
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
