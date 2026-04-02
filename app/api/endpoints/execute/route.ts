import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '@/lib/workflow/secrets/secretResolver'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const body = await req.json()
        const { endpointId, dynamicPayload } = body

        if (!endpointId) {
            return NextResponse.json({ error: 'Missing endpointId' }, { status: 400 })
        }

        const endpointRes = await payload.findByID({ collection: 'endpoints', id: endpointId }).catch(() => null)
        if (!endpointRes) {
            return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
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

        let queryParams = {} as any
        let bodyParams = {} as any
        
        // Hydration matching schemas
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
                bodyParams = dynamicPayload || {}
            }
        }

        // Apply URL queries
        if (Object.keys(queryParams).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(queryParams).forEach(([k, v]) => searchParams.append(k, String(v)))
            url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        // Apply vault tokens
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

        const res = await fetch(url, {
            method: endpointRes.method,
            headers,
            body: ['GET', 'HEAD'].includes(endpointRes.method) ? undefined : JSON.stringify(bodyParams)
        })

        const rawText = await res.text()
        
        // Ensure successful parse
        let responseData = rawText
        try { responseData = JSON.parse(rawText) } catch(e) {}

        if (!res.ok) {
            return NextResponse.json({ error: 'Endpoint execution failed', details: responseData }, { status: res.status })
        }

        return NextResponse.json(responseData)
    } catch (e: any) {
        return NextResponse.json({ error: 'Internal server error proxying dynamic execution', details: e.message }, { status: 500 })
    }
}
