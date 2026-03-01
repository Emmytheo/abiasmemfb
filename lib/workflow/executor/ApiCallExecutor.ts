import type { ExecutionEnvironment } from '../types/executor'

export async function ApiCallExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const providerId = env.getInput('providerId') as string
    const endpoint = env.getInput('endpoint') as string
    const method = (env.getInput('method') as string) || 'POST'
    const body = env.getInput('body')

    if (!providerId || !endpoint) {
        env.log.error('ApiCall: providerId and endpoint are required')
        return false
    }

    const provider = await env.getProvider(providerId)
    if (!provider) {
        env.log.error(`ApiCall: provider ${providerId} not found`)
        return false
    }
    if (!provider.isActive) {
        env.log.error(`ApiCall: provider "${provider.name}" is inactive`)
        return false
    }

    // Build auth headers
    const authHeaders: Record<string, string> = {}
    if (provider.authType !== 'NONE' && provider.secretId) {
        try {
            const secretValue = await env.resolveSecret(provider.secretId)
            if (provider.authType === 'API_KEY') {
                authHeaders['Authorization'] = `Bearer ${secretValue}`
            } else if (provider.authType === 'BEARER') {
                authHeaders['Authorization'] = `Bearer ${secretValue}`
            } else if (provider.authType === 'BASIC') {
                authHeaders['Authorization'] = `Basic ${Buffer.from(secretValue).toString('base64')}`
            }
        } catch (err: any) {
            env.log.error(`ApiCall: failed to resolve secret: ${err.message}`)
            return false
        }
    }

    // Merge provider default headers
    const defaultHeaders: Record<string, string> = {}
    for (const h of provider.defaultHeaders ?? []) {
        defaultHeaders[h.key] = h.value
    }

    const extraHeaders = env.getInput('headers')
    const parsedExtra = typeof extraHeaders === 'string' ? JSON.parse(extraHeaders || '{}') : (extraHeaders ?? {})

    const url = `${provider.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
    env.log.info(`ApiCall: ${method} ${url}`)

    try {
        const response = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...defaultHeaders,
                ...authHeaders,
                ...parsedExtra,
            },
            ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
            signal: AbortSignal.timeout(30_000), // 30s timeout
        })

        const responseText = await response.text()
        let responseJson: any = null
        try { responseJson = JSON.parse(responseText) } catch { responseJson = responseText }

        env.setOutput('response', responseJson)
        env.setOutput('statusCode', response.status)

        if (!response.ok) {
            env.log.error(`ApiCall: HTTP ${response.status} from ${provider.name}: ${responseText.slice(0, 300)}`)
            return false
        }

        env.log.info(`ApiCall: success (HTTP ${response.status}) from ${provider.name}`)
        return true
    } catch (err: any) {
        env.log.error(`ApiCall: network error: ${err.message}`)
        return false
    }
}
