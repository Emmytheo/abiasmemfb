import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '@/lib/workflow/secrets/secretResolver'

export async function POST(req: Request) {
    try {
        // Authenticate the admin (simulate wrapper for now)
        const payload = await getPayload({ config })
        const body = await req.json()
        const { endpointConfig, query, body: reqBody } = body

        if (!endpointConfig || !endpointConfig.provider) {
            return NextResponse.json({ error: 'Invalid endpoint configuration provided.' }, { status: 400 })
        }

        // Hydrate provider and fetch credentials
        const providerId = typeof endpointConfig.provider === 'object' ? endpointConfig.provider.id : endpointConfig.provider
        const provider = await payload.findByID({ collection: 'service-providers', id: providerId })

        let secretValue = null;
        if (provider.secret) {
            const secretId = typeof provider.secret === 'object' ? provider.secret.id : provider.secret
            secretValue = await resolveSecret(String(secretId))
        }

        // Construct final URL
        const basePath = provider.baseUrl?.replace(/\/$/, '') || ''
        const sep = endpointConfig.path.startsWith('/') ? '' : '/'
        let url = `${basePath}${sep}${endpointConfig.path}`

        // Hydrate query params
        if (query && Object.keys(query).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(query).forEach(([k, v]) => searchParams.append(k, String(v)))
            url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
        }

        // Set up headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }

        // Add static headers from endpoint def
        if (Array.isArray(endpointConfig.headers)) {
            endpointConfig.headers.forEach((h: any) => {
                if (h.key && h.value) headers[h.key] = h.value
            })
        }

        // Auto-inject Qore/BankOne auth logic based on known path signatures
        // (In future: this will be strictly defined by an AuthInjection schema rather than guessing)
        let finalBody = reqBody
        
        if (secretValue) {
            // Check authType
            if (provider.authType === 'BEARER') {
                headers['Authorization'] = `Bearer ${secretValue}`
            } 
            else if (provider.authType === 'API_KEY') {
                // Determine if header, query, or body based on metadata...
                // Quick hack for Qore Channels which expects it in body
                if (['POST','PUT','PATCH'].includes(endpointConfig.method)) {
                    finalBody = { ...finalBody, AuthenticationCode: finalBody.AuthenticationCode || secretValue, AuthenticationKey: finalBody.AuthenticationKey || secretValue }
                } else {
                    // Core banking path assumption for testing
                    url += `${url.includes('?') ? '&' : '?'}authtoken=${secretValue}`
                }
            }
        }

        const start = Date.now()
        const res = await fetch(url, {
            method: endpointConfig.method,
            headers,
            body: ['GET', 'HEAD'].includes(endpointConfig.method) ? undefined : JSON.stringify(finalBody)
        })

        const rawText = await res.text()
        const end = Date.now()

        let responseData = rawText
        try {
            responseData = JSON.parse(rawText)
        } catch(e) { }

        return NextResponse.json({
            status: res.status,
            time: end - start,
            data: responseData
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error proxying request' }, { status: 500 })
    }
}
