export function resolvePath(obj: any, path: string): string | undefined {
    return path.split('.').reduce((cur, key) => cur?.[key], obj)
}

export function resolveQueryParams(
    queryParamsSchema: any,
    callerQuery: Record<string, string>,
    provider: any
): Record<string, string> {
    const resolved: Record<string, string> = {}

    if (queryParamsSchema?.properties) {
        for (const [key, def] of Object.entries(queryParamsSchema.properties as Record<string, any>)) {
            if (def.source) {
                // source format: "provider.metadata.KEY" or "provider.KEY"
                const sourcePath = def.source.replace(/^provider\./, '')
                const injected = resolvePath(provider, sourcePath)
                if (injected !== undefined) {
                    resolved[key] = String(injected)
                }
            }
        }
    }

    // Caller-supplied values always win
    return { ...resolved, ...callerQuery }
}

export function applyAuthOverride(
    url: string,
    headers: Record<string, string>,
    body: any,
    secretValue: string | null,
    provider: any,
    endpointConfig: any
): { url: string; headers: Record<string, string>; body: any } {
    let finalUrl = url
    let finalBody = { ...body }
    let finalHeaders = { ...headers }

    if (secretValue) {
        const authOverride = endpointConfig.authOverride ?? 'INHERIT'
        const effectiveAuthMode = authOverride !== 'INHERIT' ? authOverride : provider.authType

        switch (effectiveAuthMode) {
            case 'BEARER':
                finalHeaders['Authorization'] = `Bearer ${secretValue}`
                break

            case 'QUERY_PARAM': {
                const paramKey = endpointConfig.authQueryParamKey || provider.authQueryParamKey || 'authToken'
                finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${paramKey}=${encodeURIComponent(secretValue)}`
                break
            }

            case 'BODY_FIELD': {
                const fieldKey = endpointConfig.authBodyFieldKey || provider.authBodyFieldKey || 'AuthenticationCode'
                finalBody = { ...finalBody, [fieldKey]: secretValue }
                break
            }

            case 'API_KEY': {
                // For Qore/BankOne, authToken in Query Param is almost ALWAYS required regardless of method
                const paramKey = endpointConfig.authQueryParamKey || provider.authQueryParamKey || 'authToken'
                finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${paramKey}=${encodeURIComponent(secretValue)}`

                if (['POST', 'PUT', 'PATCH'].includes(endpointConfig.method)) {
                    const fieldKey = endpointConfig.authBodyFieldKey || provider.authBodyFieldKey || 'AuthenticationCode'
                    finalBody = {
                        ...finalBody,
                        [fieldKey]: finalBody[fieldKey] || secretValue,
                    }
                }
                break
            }

            default:
                break
        }
    }

    return { url: finalUrl, headers: finalHeaders, body: finalBody }
}

export async function resolveEndpoint(endpoint: any, customParams: Record<string, any> = {}) {
    // 1. Resolve Provider
    const provider = typeof endpoint.provider === 'object' ? endpoint.provider : null
    if (!provider) throw new Error('Endpoint must have a hydrated provider')

    // 2. Resolve Secret
    const { resolveSecret } = await import('@/lib/workflow/secrets/secretResolver')
    let secretValue: string | null = null
    const secretRef = provider.secret || provider.secretId
    const secretId = typeof secretRef === 'object' ? secretRef.id : secretRef
    if (secretId) {
        secretValue = await resolveSecret(String(secretId))
    }

    // 3. Construct Base URL
    const basePath = String(provider.baseUrl ?? '').replace(/\/$/, '')
    const sep = endpoint.path?.startsWith('/') ? '' : '/'
    let url = `${basePath}${sep}${endpoint.path || ''}`

    // 4. Resolve Query Params (Dynamic + Static)
    const resolvedQuery = resolveQueryParams(
        endpoint.queryParamsSchema,
        customParams.query || {},
        provider
    )
    
    // Merge Static Query Params from Endpoint Definition
    if (Array.isArray(endpoint.queryParams)) {
        endpoint.queryParams.forEach((q: any) => {
            if (q.key && q.value) resolvedQuery[q.key] = q.value
        })
    }

    if (Object.keys(resolvedQuery).length > 0) {
        const searchParams = new URLSearchParams()
        Object.entries(resolvedQuery).forEach(([k, v]) => searchParams.append(k, String(v)))
        url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
    }

    // 5. Build Headers
    const headers: Record<string, string> = {
        'Accept': 'application/json'
    }

    // Default to JSON for payloads
    if (endpoint.method && endpoint.method !== 'GET') {
        headers['Content-Type'] = 'application/json';
    }
    if (Array.isArray(endpoint.headers)) {
        endpoint.headers.forEach((h: any) => {
            if (h.key && h.value) headers[h.key] = h.value
        })
    }
    if (Array.isArray(provider.defaultHeaders)) {
        provider.defaultHeaders.forEach((h: any) => {
            if (h.key && h.value && !headers[h.key]) headers[h.key] = h.value
        })
    }

    // 6. Apply Auth Overrides (Merge dynamic overrides from customParams)
    const effectiveEndpoint = { ...endpoint, ...(customParams.overrides || {}) };
    
    const authData = applyAuthOverride(
        url,
        headers,
        customParams.body || {},
        secretValue,
        provider,
        effectiveEndpoint
    )

    return {
        url: authData.url,
        method: effectiveEndpoint.method || 'GET',
        headers: authData.headers,
        body: authData.body,
        responseSchema: effectiveEndpoint.responseSchema // Export for mapping result
    }
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
 * Extracts specific fields from an API response using dot-notation paths.
 */
export function resolveResponseOutputs(response: any, outputs: Record<string, string>): Record<string, any> {
    if (!outputs || Object.keys(outputs).length === 0) return response;
    
    const results: Record<string, any> = {};
    for (const [outputName, path] of Object.entries(outputs)) {
        results[outputName] = resolvePath(response, path);
    }
    return results;
}
