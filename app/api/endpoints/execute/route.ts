import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { resolveSecret } from '@/lib/workflow/secrets/secretResolver'

function resolvePayloadValue(key: string, payload: any) {
    if (!payload || typeof payload !== 'object') return undefined;
    if (payload[key] !== undefined) return payload[key];
    
    const keyLower = key.toLowerCase();
    
    // 1. Check case-insensitively
    const match = Object.keys(payload).find(k => k.toLowerCase() === keyLower);
    if (match !== undefined) return payload[match];
    
    // 2. Check common aliases
    const aliases: Record<string, string[]> = {
        accountno: ['accountnumber', 'destination_account', 'destinationaccount', 'toaccountnumber', 'to_account_number', 'account_number', 'account'],
        accountnumber: ['accountno', 'destination_account', 'destinationaccount', 'toaccountnumber', 'to_account_number', 'account_number', 'account'],
        bankcode: ['destination_bank_code', 'destinationbankcode', 'bank_code', 'receiverbankcode', 'bank'],
        billercode: ['biller_code', 'billercode'],
        customerid: ['customer_id', 'smartcard_number', 'meter_number', 'phone_number'],
        amount: ['amountnaira', 'amount_naira']
    };
    
    const mappedAliases = aliases[keyLower] || [];
    for (const alias of mappedAliases) {
        const aliasMatch = Object.keys(payload).find(k => k.toLowerCase() === alias);
        if (aliasMatch !== undefined) return payload[aliasMatch];
    }
    
    return undefined;
}

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
        
        const isGetMethod = ['GET', 'HEAD'].includes(endpointRes.method)
        
        // For GET endpoints: extract query params from queryParamsSchema.properties (JSON Schema format)
        // If no schema is defined, send all dynamicPayload keys as query params (safe passthrough)
        if (isGetMethod) {
            const qSchema = endpointRes.queryParamsSchema as any
            const schemaProps = qSchema?.properties ? Object.keys(qSchema.properties) : null
            if (schemaProps) {
                for (const key of schemaProps) {
                    const val = resolvePayloadValue(key, dynamicPayload)
                    if (val !== undefined) queryParams[key] = val
                }
            } else {
                // No schema: pass everything through as query params
                queryParams = { ...dynamicPayload }
            }
        }
        
        // For POST/PUT/PATCH: extract body from bodySchema or passthrough all
        if (!isGetMethod) {
            const bSchema = endpointRes.bodySchema as any
            const bodyProps = bSchema?.properties ? Object.keys(bSchema.properties) : null
            if (bodyProps) {
                for (const key of bodyProps) {
                    const val = resolvePayloadValue(key, dynamicPayload)
                    if (val !== undefined) bodyParams[key] = val
                }
            } else {
                bodyParams = dynamicPayload || {}
            }
        }

        // Apply URL query string
        if (Object.keys(queryParams).length > 0) {
            const searchParams = new URLSearchParams()
            Object.entries(queryParams).forEach(([k, v]) => searchParams.append(k, String(v)))
            url += `${url.includes('?') ? '&' : '?'}${searchParams.toString()}`
        }

        const headers: Record<string, string> = {
            'Accept': 'application/json'
        }
        if (!isGetMethod) {
            headers['Content-Type'] = 'application/json'
        }

        // Apply vault tokens — fix authToken casing (Qore is case-sensitive)
        if (secretValue) {
            if (provider.authType === 'BEARER') {
                headers['Authorization'] = `Bearer ${secretValue}`
            } else if (provider.authType === 'API_KEY' || provider.authType === 'QUERY_PARAM') {
                const paramKey = (endpointRes as any).authQueryParamKey || provider.authQueryParamKey || 'authToken'
                url += `${url.includes('?') ? '&' : '?'}${paramKey}=${encodeURIComponent(secretValue)}`
                if (!isGetMethod) {
                    const fieldKey = (endpointRes as any).authBodyFieldKey || provider.authBodyFieldKey || 'AuthenticationCode'
                    bodyParams = { ...bodyParams, [fieldKey]: bodyParams[fieldKey] || secretValue }
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
