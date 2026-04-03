import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '@/lib/workflow/secrets/secretResolver'
import { resolveQueryParams, applyAuthOverride } from '@/lib/workflow/utils/apiResolver'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config })
        const body = await req.json()
        const { endpointConfig, query = {}, body: reqBody = {} } = body

        if (!endpointConfig || !endpointConfig.provider) {
            return NextResponse.json({ error: 'Invalid endpoint configuration provided.' }, { status: 400 })
        }

        // ── Hydrate provider ─────────────────────────────────────────────────
        const providerId = typeof endpointConfig.provider === 'object'
            ? endpointConfig.provider.id
            : endpointConfig.provider
        const provider = await payload.findByID({ collection: 'service-providers', id: providerId, depth: 0 })

        // ── Resolve auth secret ──────────────────────────────────────────────
        let secretValue: string | null = null
        if (provider.secret) {
            const secretId = typeof provider.secret === 'object' ? provider.secret.id : provider.secret
            secretValue = await resolveSecret(String(secretId))
        }

        // ── Construct URL ────────────────────────────────────────────────────
        const basePath = String(provider.baseUrl ?? '').replace(/\/$/, '')
        const sep = endpointConfig.path.startsWith('/') ? '' : '/'
        let url = `${basePath}${sep}${endpointConfig.path}`

        // ── Resolve query params (with provider.metadata injection) ──────────
        const resolvedQuery = resolveQueryParams(
            endpointConfig.queryParamsSchema,
            query,
            provider
        )
        if (Object.keys(resolvedQuery).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(resolvedQuery).forEach(([k, v]) => searchParams.append(k, String(v)))
            url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
        }

        // ── Headers ──────────────────────────────────────────────────────────
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        if (Array.isArray(endpointConfig.headers)) {
            endpointConfig.headers.forEach((h: any) => {
                if (h.key && h.value) headers[h.key] = h.value
            })
        }
        // Provider-level default headers
        if (Array.isArray(provider.defaultHeaders)) {
            provider.defaultHeaders.forEach((h: any) => {
                if (h.key && h.value && !headers[h.key]) headers[h.key] = h.value
            })
        }

        // ── Auth injection ───────────────────────────────────────────────────
        const authData = applyAuthOverride(
            url,
            headers,
            reqBody,
            secretValue,
            provider,
            endpointConfig
        )
        url = authData.url
        const finalHeaders = authData.headers
        const finalBody = authData.body

        // ── Execute request ──────────────────────────────────────────────────
        const start = Date.now()
        const res = await fetch(url, {
            method: endpointConfig.method,
            headers: finalHeaders,
            body: ['GET', 'HEAD'].includes(endpointConfig.method)
                ? undefined
                : JSON.stringify(finalBody)
        })

        const rawText = await res.text()
        const elapsed = Date.now() - start

        let responseData: any = rawText
        try { responseData = JSON.parse(rawText) } catch { }

        return NextResponse.json({
            status: res.status,
            time: elapsed,
            data: responseData,
            // Debug info (remove in production)
            _debug: {
                resolvedUrl: url,
                injectedQueryParams: Object.keys(resolvedQuery)
            }
        })
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Server error proxying request' }, { status: 500 })
    }
}
