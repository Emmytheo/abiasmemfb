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
                const paramKey = endpointConfig.authQueryParamKey ?? 'authToken'
                finalUrl += `${finalUrl.includes('?') ? '&' : '?'}${paramKey}=${encodeURIComponent(secretValue)}`
                break
            }

            case 'BODY_FIELD': {
                const fieldKey = endpointConfig.authBodyFieldKey ?? 'AuthenticationCode'
                finalBody = { ...finalBody, [fieldKey]: secretValue }
                break
            }

            case 'API_KEY':
                if (['POST', 'PUT', 'PATCH'].includes(endpointConfig.method)) {
                    finalBody = {
                        ...finalBody,
                        AuthenticationCode: finalBody.AuthenticationCode || secretValue,
                    }
                } else {
                    finalUrl += `${finalUrl.includes('?') ? '&' : '?'}authToken=${encodeURIComponent(secretValue)}`
                }
                break

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

    // 4. Resolve Query Params
    const resolvedQuery = resolveQueryParams(
        endpoint.queryParamsSchema,
        customParams.query || {},
        provider
    )
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

    // 6. Apply Auth Overrides
    const authData = applyAuthOverride(
        url,
        headers,
        customParams.body || {},
        secretValue,
        provider,
        endpoint
    )

    return {
        url: authData.url,
        method: endpoint.method || 'GET',
        headers: authData.headers,
        body: authData.body
    }
}
