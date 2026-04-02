import type { ExecutionEnvironment } from '../types/executor'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '../secrets/secretResolver'

export async function ApiExecutionExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const endpointId = env.getInput('endpointId')
    // Dynamic payload combines URL vars and body variables
    const dynamicPayload = env.getInput('dynamicPayload') || {}

    if (!endpointId) {
        env.log('error', `API_EXECUTION missing endpointId`)
        return false
    }

    try {
        const payload = await getPayload({ config })
        const endpointRes = await payload.findByID({ collection: 'endpoints', id: endpointId })
        
        if (!endpointRes) {
            env.log('error', `Endpoint ${endpointId} not found in database.`)
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

        // Try extracting known query schema variables from dynamic payload
        let queryParams = {} as any
        let bodyParams = {} as any
        
        // Very basic hydration: Anything matching the exact key in the JSON schema goes to query/body
        // If schemas are not strictly typed, we just pass the object as body if POST
        if (endpointRes.queryParamsSchema && Object.keys(endpointRes.queryParamsSchema).length > 0) {
            for (const key of Object.keys(endpointRes.queryParamsSchema)) {
                if (dynamicPayload[key] !== undefined) queryParams[key] = dynamicPayload[key]
            }
        }
        
        if (['POST', 'PUT', 'PATCH'].includes(endpointRes.method)) {
            if (endpointRes.bodySchema && Object.keys(endpointRes.bodySchema).length > 0) {
                for (const key of Object.keys(endpointRes.bodySchema)) {
                    if (dynamicPayload[key] !== undefined) bodyParams[key] = dynamicPayload[key]
                }
            } else {
                bodyParams = dynamicPayload
            }
        }

        // Hydrate query params into URL string
        if (Object.keys(queryParams).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(queryParams).forEach(([k, v]) => searchParams.append(k, String(v)))
            url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        // Static header injection
        if (Array.isArray(endpointRes.headers)) {
            endpointRes.headers.forEach((h: any) => {
                if (h.key && h.value) headers[h.key] = h.value
            })
        }

        // Vault Auth logic
        if (secretValue) {
            if (provider.authType === 'BEARER') {
                headers['Authorization'] = `Bearer ${secretValue}`
            } else if (provider.authType === 'API_KEY') {
                if (['POST', 'PUT', 'PATCH'].includes(endpointRes.method)) {
                    bodyParams = { ...bodyParams, AuthenticationCode: bodyParams.AuthenticationCode || secretValue, AuthenticationKey: bodyParams.AuthenticationKey || secretValue }
                } else {
                    url += `${url.includes('?') ? '&' : '?'}authtoken=${secretValue}`
                }
            }
        }

        const start = Date.now()
        const res = await fetch(url, {
            method: endpointRes.method,
            headers,
            body: ['GET', 'HEAD'].includes(endpointRes.method) ? undefined : JSON.stringify(bodyParams)
        })

        const rawText = await res.text()
        const end = Date.now()

        let responseData = rawText
        try {
            responseData = JSON.parse(rawText)
        } catch(e) { }

        env.setOutput('statusCode', res.status)
        env.setOutput('response', responseData)
        env.setOutput('success', res.ok)

        env.log('info', `API_EXECUTION ${endpointRes.name} returned ${res.status} in ${end - start}ms`)

        return res.ok
    } catch (e: any) {
        env.log('error', `API_EXECUTION failed: ${e.message}`)
        return false
    }
}
