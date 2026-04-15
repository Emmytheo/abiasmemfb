import { getPayload } from 'payload';
import configPromise from './payload.config';

async function verifySync() {
    try {
        const payload = await getPayload({ config: configPromise });
        const { docs: services } = await payload.find({
            collection: 'services' as any,
            limit: 10,
        });

        console.log("Services found:", services.length);
        services.forEach((s: any) => {
            console.log(`- Service: ${s.name} (ID: ${s.id})`);
            console.log(`  Intent: ${s.service_intent}`);
            console.log(`  Form Fields: ${s.form_schema?.length || 0}`);
            if (s.form_schema?.length > 0) {
                s.form_schema.forEach((f: any) => {
                    console.log(`    * Field: ${f.name} (${f.type})`);
                });
            }
        });

        process.exit(0);
    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    }
}

verifySync();
