import type { ExecutionEnvironment } from '../types/executor'
import { resolveSecret } from '../secrets/secretResolver'

export async function RegistrySyncExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const mappingId = env.getInput('mappingId')
    
    if (!mappingId) {
        env.log.error('REGISTRY_SYNC missing mappingId')
        return false
    }

    try {
        const payload = env.payload
        let mapping: any = null;

        // 1. Precise ID Lookup
        try {
            mapping = await payload.findByID({ collection: 'provider-mappings', id: mappingId })
        } catch (e) {
            // 2. Symbolic Name Lookup
            const results = await payload.find({
                collection: 'provider-mappings',
                where: { internalName: { equals: mappingId } },
                limit: 1
            })
            if (results.docs.length > 0) mapping = results.docs[0]
        }

        if (!mapping) {
            env.log.error(`Mapping "${mappingId}" not found in database.`)
            return false
        }

        if (!mapping.autoSyncConfig?.enabled) {
            env.log.error(`Auto-sync is not enabled for mapping ${mappingId}`)
            return false
        }

        const { syncEndpoint, syncKeyPath, matchOn } = mapping.autoSyncConfig
        if (!syncEndpoint || !syncKeyPath || !matchOn) {
            env.log.error(`Incomplete sync configuration for mapping ${mappingId}`)
            return false
        }

        // 2. Load the Sync Endpoint
        const endpointIdOrName = typeof syncEndpoint === 'object' ? syncEndpoint.id : String(syncEndpoint)
        let endpointRes: any = null;

        // 1. Precise ID Lookup
        try {
            endpointRes = await payload.findByID({ collection: 'endpoints', id: endpointIdOrName })
        } catch (e) {
            // 2. Symbolic Name Lookup
            const results = await payload.find({
                collection: 'endpoints',
                where: { name: { equals: endpointIdOrName } },
                limit: 1
            })
            if (results.docs.length > 0) endpointRes = results.docs[0]
        }
        
        if (!endpointRes) {
            env.log.error(`Sync Endpoint "${endpointIdOrName}" not found for mapping ${mappingId}`)
            return false
        }
        
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

        env.log.info(`REGISTRY_SYNC hitting external endpoint: ${url}`)
        
        const res = await fetch(url, { method: endpointRes.method, headers })
        
        if (!res.ok) {
            env.log.error(`External sync fetch failed for mapping ${mappingId}`)
            return false
        }

        const rawResponse = await res.json()

        // 3. Extraction & Matching
        const productsArray = String(syncKeyPath).split('.').reduce((acc, part) => acc && acc[part], rawResponse)
        if (!Array.isArray(productsArray)) {
            env.log.error(`syncKeyPath did not resolve to an array for mapping ${mappingId}`)
            return false
        }

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
            env.log.warn(`Successfully fetched registry data, but found no match for ${mapping.internalName}`)
            return false
        }

        const externalCode = matchFound.ProductCode || matchFound.Code || matchFound.Id || matchFound.id || null;

        await payload.update({
            collection: 'provider-mappings',
            id: mapping.id,
            data: {
                externalCode: String(externalCode),
                lastAutoSync: new Date().toISOString()
            }
        })

        env.log.info(`REGISTRY_SYNC updated ${mapping.internalName} with code ${externalCode}`)
        env.setOutput('externalCode', externalCode)
        env.setOutput('success', true)

        return true
    } catch (e: any) {
        env.log.error(`REGISTRY_SYNC execution failed: ${e.message}`)
        return false
    }
}
