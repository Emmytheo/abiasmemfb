import { getPayload } from 'payload';
import configPromise from '@payload-config';
import { getPayloadClient } from '@/lib/payload';
import { resolveEndpoint, resolveResponseOutputs } from '@/lib/workflow/utils/apiResolver';

export const initPayload = async () => {
    return await getPayloadClient();
}

/**
 * Maps internal field names to provider-specific names based on a schema mapping.
 */
export function applySchemaMapping(data: any, mapping: Record<string, string>): Record<string, any> {
    if (!mapping || Object.keys(mapping).length === 0) return data;
    
    const mapped: Record<string, any> = {};
    for (const [internalKey, externalKey] of Object.entries(mapping)) {
        if (data[internalKey] !== undefined) {
            mapped[externalKey] = data[internalKey];
        }
    }
    
    // Pass through any keys that aren't in the mapping but might be needed (e.g. tracking refs)
    return { ...data, ...mapped };
}

/**
 * Internal helper for authoritative core banking synchronization.
 * This is the lower-level execution engine that handles auth, URL resolution, and success checking.
 */
export async function executeEndpoint(
    endpointId: string, 
    inputData: Record<string, any>, 
    overrides: Record<string, any> = {}
) {
    const payload = await initPayload();
    const endpoint = await payload.findByID({
        collection: 'endpoints' as any,
        id: endpointId,
        depth: 2, // Crucial: Hydrate Provider and Secret for resolution
    });
    if (!endpoint) throw new Error('Endpoint not found');

    // 1. Resolve absolute URL, headers and body using the unified logic
    const resolved = await resolveEndpoint(endpoint, {
        body: inputData,
        overrides: overrides
    });

    // 2. Execute fetch with absolute URL
    console.log(`[Adapter][Execute] Calling ${resolved.method} ${resolved.url}`);
    if (!resolved.url.startsWith('http')) {
        console.error(`[Adapter][Execute] CRITICAL ERROR: Relative URL detected. Fetch will fail in Node.js.`);
        throw new Error(`Relative URL "${resolved.url}" is not supported. Please ensure the Service Provider has a Base URL configured.`);
    }
    console.log(`[Adapter][Execute] Request Body:`, JSON.stringify(resolved.body, null, 2));
    
    const response = await fetch(resolved.url, {
        method: resolved.method,
        headers: resolved.headers,
        body: resolved.method !== 'GET' ? JSON.stringify(resolved.body) : undefined,
    });

    const result = await response.json();
    console.log(`[Adapter][Execute] Response Result:`, JSON.stringify(result, null, 2));
    
    // 3. Handle Failure according to schema or default
    const successPath = resolved.responseSchema?.successPath;
    const successValue = resolved.responseSchema?.successValue ?? true;
    
    let isSuccessful = response.ok;
    
    if (successPath) {
        const rawSuccess = successPath.split('.').reduce((obj: any, key: any) => obj?.[key], result);
        
        // If the specified path is missing (undefined), fall back to auto-detection
        if (rawSuccess !== undefined) {
            isSuccessful = (rawSuccess === successValue);
            console.log(`[Adapter][Execute] Success Check (Specified Path: ${successPath}):`, { rawSuccess, successValue, isSuccessful });
        } else {
            console.warn(`[Adapter][Execute] Specified successPath "${successPath}" not found in response. Falling back to auto-detection.`);
            if (result.IsSuccessful !== undefined) isSuccessful = (result.IsSuccessful === successValue);
            else if (result.RequestStatus !== undefined) isSuccessful = (result.RequestStatus === successValue);
            console.log(`[Adapter][Execute] Success Check (Fallback Auto):`, { IsSuccessful: result.IsSuccessful, RequestStatus: result.RequestStatus, successValue, isSuccessful, responseOk: response.ok });
        }
    } else {
        // Auto-detect common Qore/BankOne success fields
        if (result.IsSuccessful !== undefined) isSuccessful = (result.IsSuccessful === successValue);
        else if (result.RequestStatus !== undefined) isSuccessful = (result.RequestStatus === successValue);
        console.log(`[Adapter][Execute] Success Check (Direct Auto):`, { IsSuccessful: result.IsSuccessful, RequestStatus: result.RequestStatus, successValue, isSuccessful, responseOk: response.ok });
    }

    if (!isSuccessful) {
        console.error(`[Adapter][Execute] Failed:`, result);
        const errorMsg = result.message || result.Message || result.ResponseMessage || (result.isBvnValid === false ? "Invalid BVN" : 'External sync failed');
        throw new Error(errorMsg);
    }

    // 4. Resolve Outputs if schema is defined
    console.log(`[Adapter][Execute] Schema Outputs:`, JSON.stringify(resolved.responseSchema?.outputs, null, 2));
    if (resolved.responseSchema?.outputs) {
        const mappedResult = resolveResponseOutputs(result, resolved.responseSchema.outputs);
        // Ensure success field is present in mapped result
        mappedResult.success = true;
        console.log(`[Adapter][Execute] Mapped Result:`, JSON.stringify(mappedResult, null, 2));
        return mappedResult;
    }

    return { ...result, success: true };
}

export const getCustomerBySupabaseId = async (supabaseId: string): Promise<any | null> => {
    try {
        const payload = await initPayload();
        const { docs } = await payload.find({
            collection: 'customers' as any,
            where: { supabase_id: { equals: supabaseId } },
            limit: 1, 
            overrideAccess: true 
        });
        if (!docs.length) return null;
        const doc = docs[0];
        return {
            ...doc,
            id: String(doc.id),
            created_at: doc.createdAt,
            updated_at: doc.updatedAt,
        } as any;
    } catch (e) {
        console.error('Payload getCustomerBySupabaseId Error:', e);
        return null;
    }
};

export const updateCustomer = async (id: string, data: Partial<any>): Promise<any> => {
    const payload = await initPayload();
    const doc = await payload.update({ 
        collection: 'customers' as any, 
        id, 
        data: data as any, 
        overrideAccess: true 
    });
    return { ...doc, id: String(doc.id) } as any;
};
