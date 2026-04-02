import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '@/lib/workflow/secrets/secretResolver'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const body = await req.json()
        const { mappingId } = body

        if (!mappingId) return NextResponse.json({ error: 'Missing mappingId' }, { status: 400 })

        // 1. Load the Mapping Configuration
        const mapping = await payload.findByID({ collection: 'provider-mappings', id: mappingId })
        if (!mapping.autoSyncConfig?.enabled) {
            return NextResponse.json({ error: 'Auto-sync is not enabled for this mapping' }, { status: 400 })
        }

        const { syncEndpoint, syncKeyPath, matchOn } = mapping.autoSyncConfig
        if (!syncEndpoint || !syncKeyPath || !matchOn) {
            return NextResponse.json({ error: 'Incomplete autoSyncConfig (missing endpoint, paths or matching key)' }, { status: 400 })
        }

        // 2. Load the Endpoint and execute the REST Fetch
        const endpointId = typeof syncEndpoint === 'object' ? syncEndpoint.id : syncEndpoint
        const endpointRes = await payload.findByID({ collection: 'endpoints', id: String(endpointId) })
        
        const providerId = typeof endpointRes.provider === 'object' ? endpointRes.provider.id : endpointRes.provider
        const provider = await payload.findByID({ collection: 'service-providers', id: providerId })

        let secretValue = null;
        if (provider.secret) {
            const secretId = typeof provider.secret === 'object' ? provider.secret.id : provider.secret
            secretValue = await resolveSecret(String(secretId))
        }

        const basePath = provider.baseUrl?.replace(/\/$/, '') || ''
        const sep = endpointRes.path.startsWith('/') ? '' : '/'
        let url = `${basePath}${sep}${endpointRes.path}`
        
        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (secretValue) {
            if (provider.authType === 'BEARER') headers['Authorization'] = `Bearer ${secretValue}`
            else if (provider.authType === 'API_KEY') {
                url += `${url.includes('?') ? '&' : '?'}authtoken=${secretValue}`
            }
        }

        const res = await fetch(url, { method: endpointRes.method, headers })
        const rawResponse = await res.json()

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to sync externally', providerResponse: rawResponse }, { status: res.status })
        }

        // 3. Evaluate extraction path (e.g. "response.data.products")
        const productsArray = String(syncKeyPath).split('.').reduce((acc, part) => acc && acc[part], rawResponse)
        if (!Array.isArray(productsArray)) {
            return NextResponse.json({ error: 'syncKeyPath did not resolve to an array', extraction: productsArray }, { status: 500 })
        }

        // 4. Do the Rosetta Stone matching
        // We match against the `internalName` of the ProviderMappings document, or its generic relatedEntity if hydrated
        const internalTarget = String(mapping.internalName).trim().toLowerCase()
        let matchFound = null;

        for (const item of productsArray) {
            const externalTerm = String(item[matchOn] || '').trim().toLowerCase()
            
            if (externalTerm === internalTarget || externalTerm.includes(internalTarget) || internalTarget.includes(externalTerm)) {
                matchFound = item;
                break;
            }
        }

        if (!matchFound) {
            return NextResponse.json({ message: 'Sync hit endpoint successfully, but failed to find a match', dataScanned: productsArray.length })
        }

        // 5. Save the external code identifier (Assuming standard Qore ProductCode property, or dynamically configure it)
        // For flexibility, we look for "ProductCode" or "Code" or "Id"
        const externalCode = matchFound.ProductCode || matchFound.Code || matchFound.Id || matchFound.id || null;

        await payload.update({
            collection: 'provider-mappings',
            id: mappingId,
            data: {
                externalCode: String(externalCode),
                lastAutoSync: new Date().toISOString()
            }
        })

        return NextResponse.json({
            message: 'Successfully synchronized provider mapping',
            matchedInternalEntity: mapping.internalName,
            updatedExternalCode: externalCode,
        })
        
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error during mapping sync', details: e.message }, { status: 500 })
    }
}
