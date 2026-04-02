/**
 * Blueprint Ingestion Engine
 * 
 * Provides `ingestBlueprint()` — the declarative provisioner for API integrations.
 * Resolves all symbolic references (names/slugs) and upserts ServiceProviders,
 * Endpoints, and ProviderMappings in dependency order.
 */

export interface BlueprintEndpoint {
    /** Human-readable label, used as symbolic reference in workflows */
    name: string
    description?: string
    /** Relative path from provider base URL. Supports {variables}. */
    path: string
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS'
    status?: 'active' | 'deprecated' | 'draft'

    /**
     * Auth mode override at endpoint level. Inherits from provider if omitted.
     * - 'QUERY_PARAM': Appends auth as ?authToken=... (Qore Corebanking style)
     * - 'BODY_FIELD': Injects auth into request body (Qore Channels style)
     * - 'BEARER': Authorization header override
     */
    authOverride?: 'QUERY_PARAM' | 'BODY_FIELD' | 'BEARER' | 'INHERIT'
    /** If authOverride is QUERY_PARAM, the name of the query param key */
    authQueryParamKey?: string
    /** If authOverride is BODY_FIELD, the name of the body field key */
    authBodyFieldKey?: string

    headers?: Array<{ key: string; value: string }>

    queryParamsSchema?: {
        type: 'object'
        properties: Record<string, { type: string; description?: string; enum?: string[] }>
        required?: string[]
    }

    bodySchema?: {
        type: 'object'
        properties: Record<string, { type: string; description?: string; enum?: string[] }>
        required?: string[]
        /** 
         * BankOne specific: amounts in kobo?
         * Documents that this API's amounts must be ×100
         */
        amountsInKobo?: boolean
    }

    responseSchema?: {
        /**
         * Dot-notation paths to extract success values from response.
         * E.g. "IsSuccessful" for BankOne's standard wrapper.
         */
        successPath?: string
        successValue?: string | boolean
        /** Dot-notation path to the actual payload data e.g. "Payload" */
        dataPath?: string
        /** Named output mappings: outputName → dot-notation path in response */
        outputs?: Record<string, string>
    }
}

export interface BlueprintMapping {
    /**
     * Internal name used as symbolic reference — must be unique per provider.
     * This is also the string used for fuzzy matching during REGISTRY_SYNC.
     */
    internalName: string
    /** 
     * Which endpoint (by name) is used for auto-sync data fetching.
     * Must match an endpoint.name in this blueprint.
     */
    syncEndpoint?: string
    /** 
     * Dot-notation path into the sync response to find the list of items.
     * E.g. "Payload" or "Payload.Products"
     */
    syncKeyPath?: string
    /**
     * Which field in each list item to fuzzy-match against internalName.
     * E.g. "ProductName" or "Name"
     */
    matchOn?: string
    /** 
     * If the externalCode is already known, it can be pre-seeded here.
     * The REGISTRY_SYNC node will overwrite this if auto-sync succeeds.
     */
    externalCode?: string
    /** JSON schema mapping of internal field names → provider field names */
    schemaMapping?: Record<string, string>
}

export interface BlueprintProvider {
    name: string
    /** Unique machine identifier — used for upsert matching */
    slug: string
    description?: string
    category: 'SMS' | 'EMAIL' | 'PAYMENT' | 'KYC' | 'CREDIT_BUREAU' | 'WEBHOOK' | 'CUSTOM'
    baseUrl: string
    authType: 'NONE' | 'API_KEY' | 'BEARER' | 'BASIC' | 'OAUTH2'

    /**
     * Reference to a Vault secret by its `name` field.
     * If the secret doesn't exist, a placeholder will be created.
     */
    secretName?: string

    defaultHeaders?: Array<{ key: string; value: string }>
    healthCheckUrl?: string
    metadata?: Record<string, any>
    priority?: number
    groupTag?: string
}

export interface BlueprintSDL {
    /** Blueprint format version for future compatibility */
    apiVersion: 'v1'
    /** A human-readable name for this integration blueprint */
    name: string
    description?: string
    provider: BlueprintProvider
    endpoints: BlueprintEndpoint[]
    mappings?: BlueprintMapping[]
}

type IngestResult = {
    provider: { id: string; name: string; upserted: 'created' | 'updated' }
    endpoints: Array<{ id: string; name: string; upserted: 'created' | 'updated' }>
    mappings: Array<{ id: string; name: string; upserted: 'created' | 'updated' }>
    errors: string[]
}

export async function ingestBlueprint(sdl: BlueprintSDL, payload: any): Promise<IngestResult> {
    const result: IngestResult = {
        provider: { id: '', name: sdl.provider.name, upserted: 'created' },
        endpoints: [],
        mappings: [],
        errors: []
    }

    // ── 1. Upsert Provider ───────────────────────────────────────────────────
    let providerId: string

    let existingSecretId: string | null = null

    if (sdl.provider.secretName) {
        try {
            const secretRes = await payload.find({
                collection: 'secrets',
                where: { name: { equals: sdl.provider.secretName } },
                limit: 1
            })
            if (secretRes.docs.length > 0) {
                existingSecretId = secretRes.docs[0].id
            } else {
                // Create a placeholder secret
                const newSecret = await payload.create({
                    collection: 'secrets',
                    data: {
                        name: sdl.provider.secretName,
                        value: `PLACEHOLDER_FOR_${sdl.provider.secretName.toUpperCase().replace(/\s+/g, '_')}`,
                        description: `Auto-created by Blueprint: ${sdl.name}. Replace with the actual credential.`
                    }
                })
                existingSecretId = newSecret.id
            }
        } catch (e: any) {
            result.errors.push(`Failed to resolve secret "${sdl.provider.secretName}": ${e.message}`)
        }
    }

    const providerData = {
        name: sdl.provider.name,
        slug: sdl.provider.slug,
        description: sdl.provider.description,
        category: sdl.provider.category,
        baseUrl: sdl.provider.baseUrl,
        authType: sdl.provider.authType,
        ...(existingSecretId ? { secret: existingSecretId } : {}),
        defaultHeaders: sdl.provider.defaultHeaders ?? [],
        healthCheckUrl: sdl.provider.healthCheckUrl,
        metadata: sdl.provider.metadata,
        priority: sdl.provider.priority ?? 1,
        groupTag: sdl.provider.groupTag,
        isActive: true
    }

    try {
        const existingProvider = await payload.find({
            collection: 'service-providers',
            where: { slug: { equals: sdl.provider.slug } },
            limit: 1
        })

        if (existingProvider.docs.length > 0) {
            const updated = await payload.update({
                collection: 'service-providers',
                id: existingProvider.docs[0].id,
                data: providerData
            })
            providerId = updated.id
            result.provider = { id: providerId, name: sdl.provider.name, upserted: 'updated' }
        } else {
            const created = await payload.create({
                collection: 'service-providers',
                data: providerData
            })
            providerId = created.id
            result.provider = { id: providerId, name: sdl.provider.name, upserted: 'created' }
        }
    } catch (e: any) {
        result.errors.push(`Provider upsert failed: ${e.message}`)
        return result // Can't proceed without a provider
    }

    // ── 2. Upsert Endpoints (indexed by name for mapping resolution) ─────────
    const endpointIdByName: Record<string, string> = {}

    for (const ep of sdl.endpoints) {
        const endpointData = {
            name: ep.name,
            description: ep.description,
            provider: providerId,
            method: ep.method,
            path: ep.path,
            status: ep.status ?? 'active',
            headers: ep.headers ?? [],
            queryParamsSchema: ep.queryParamsSchema,
            bodySchema: ep.bodySchema,
            responseSchema: ep.responseSchema
        }

        try {
            const existing = await payload.find({
                collection: 'endpoints',
                where: {
                    and: [
                        { name: { equals: ep.name } },
                        { provider: { equals: providerId } }
                    ]
                },
                limit: 1
            })

            let endpointId: string
            if (existing.docs.length > 0) {
                const updated = await payload.update({
                    collection: 'endpoints',
                    id: existing.docs[0].id,
                    data: endpointData
                })
                endpointId = updated.id
                result.endpoints.push({ id: endpointId, name: ep.name, upserted: 'updated' })
            } else {
                const created = await payload.create({
                    collection: 'endpoints',
                    data: endpointData
                })
                endpointId = created.id
                result.endpoints.push({ id: endpointId, name: ep.name, upserted: 'created' })
            }
            endpointIdByName[ep.name] = endpointId
        } catch (e: any) {
            result.errors.push(`Endpoint "${ep.name}" upsert failed: ${e.message}`)
        }
    }

    // ── 3. Upsert Provider Mappings ──────────────────────────────────────────
    for (const mapping of sdl.mappings ?? []) {
        let syncEndpointId: string | null = null

        if (mapping.syncEndpoint) {
            syncEndpointId = endpointIdByName[mapping.syncEndpoint] ?? null
            if (!syncEndpointId) {
                result.errors.push(`Mapping "${mapping.internalName}": syncEndpoint "${mapping.syncEndpoint}" not found in this blueprint.`)
            }
        }

        const autoSyncConfig = syncEndpointId
            ? {
                enabled: true,
                syncEndpoint: syncEndpointId,
                syncKeyPath: mapping.syncKeyPath,
                matchOn: mapping.matchOn
            }
            : { enabled: false }

        const mappingData = {
            internalName: mapping.internalName,
            provider: providerId,
            externalCode: mapping.externalCode,
            schemaMapping: mapping.schemaMapping,
            autoSyncConfig
        }

        try {
            const existing = await payload.find({
                collection: 'provider-mappings',
                where: {
                    and: [
                        { internalName: { equals: mapping.internalName } },
                        { provider: { equals: providerId } }
                    ]
                },
                limit: 1
            })

            if (existing.docs.length > 0) {
                const updated = await payload.update({
                    collection: 'provider-mappings',
                    id: existing.docs[0].id,
                    data: mappingData
                })
                result.mappings.push({ id: updated.id, name: mapping.internalName, upserted: 'updated' })
            } else {
                const created = await payload.create({
                    collection: 'provider-mappings',
                    data: mappingData
                })
                result.mappings.push({ id: created.id, name: mapping.internalName, upserted: 'created' })
            }
        } catch (e: any) {
            result.errors.push(`Mapping "${mapping.internalName}" upsert failed: ${e.message}`)
        }
    }

    return result
}
