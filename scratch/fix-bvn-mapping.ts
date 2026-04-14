import { getPayload } from 'payload';
import configPromise from '../payload.config';

async function patchEndpoint() {
    const payload = await getPayload({ config: configPromise });
    
    // Find the BVN Verification endpoint
    const { docs: endpoints } = await payload.find({
        collection: 'endpoints',
        where: {
            path: { contains: 'BVN/GetBVNDetails' }
        }
    });

    if (endpoints.length === 0) {
        console.log('Endpoint not found');
        return;
    }

    const endpoint = endpoints[0];
    console.log('Patching endpoint:', endpoint.name);

    await payload.update({
        collection: 'endpoints',
        id: endpoint.id,
        data: {
            responseSchema: {
                outputs: {
                    "bvn": "bvnDetails.BVN",
                    "lastName": "bvnDetails.LastName",
                    "firstName": "bvnDetails.FirstName",
                    "dob": "bvnDetails.DOB",
                    "responseMessage": "ResponseMessage"
                }
            }
        }
    });

    console.log('Endpoint patched successfully');
    process.exit(0);
}

patchEndpoint();
