import type { ExecutionEnvironment } from '../types/executor'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function ApiSwitchExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const groupTag = env.getInput('groupTag') as string
    const endpoint = env.getInput('endpoint') as string
    const method = (env.getInput('method') as string) || 'POST'
    const body = env.getInput('body')

    if (!groupTag || !endpoint) {
        env.log.error('ApiSwitch: groupTag and endpoint are required')
        return false
    }

    const payload = await getPayload({ config })
    const providersRes = await payload.find({
        collection: 'service-providers',
        where: {
            and: [
                { groupTag: { equals: groupTag } },
                { isActive: { equals: true } },
            ],
        },
        sort: 'priority', // ascending — lower priority = tried first
        limit: 10,
    })

    const providers = providersRes.docs as any[]
    if (providers.length === 0) {
        env.log.error(`ApiSwitch: no active providers found for groupTag "${groupTag}"`)
        return false
    }

    env.log.info(`ApiSwitch: found ${providers.length} provider(s) for group "${groupTag}"`)

    for (const provider of providers) {
        env.log.info(`ApiSwitch: trying provider "${provider.name}" (priority ${provider.priority})`)

        // Build auth headers
        const authHeaders: Record<string, string> = {}
        if (provider.authType !== 'NONE' && provider.secret) {
            try {
                const secretId = typeof provider.secret === 'object' ? provider.secret.id : provider.secret
                const secretValue = await env.resolveSecret(secretId)
                if (['API_KEY', 'BEARER'].includes(provider.authType)) {
                    authHeaders['Authorization'] = `Bearer ${secretValue}`
                } else if (provider.authType === 'BASIC') {
                    authHeaders['Authorization'] = `Basic ${Buffer.from(secretValue).toString('base64')}`
                }
            } catch { /* skip auth if secret fails — will likely 401 */ }
        }

        const defaultHeaders: Record<string, string> = {}
        for (const h of provider.defaultHeaders ?? []) defaultHeaders[h.key] = h.value

        const url = `${provider.baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', ...defaultHeaders, ...authHeaders },
                ...(method !== 'GET' && body ? { body: JSON.stringify(body) } : {}),
                signal: AbortSignal.timeout(15_000),
            })

            const text = await response.text()
            let json: any = null
            try { json = JSON.parse(text) } catch { json = text }

            if (response.ok) {
                env.log.info(`ApiSwitch: success via "${provider.name}" (HTTP ${response.status})`)
                env.setOutput('response', json)
                env.setOutput('activeProvider', provider.slug)
                env.setOutput('statusCode', response.status)
                return true
            }

            env.log.warn(`ApiSwitch: "${provider.name}" returned HTTP ${response.status}. Trying next...`)
        } catch (err: any) {
            env.log.warn(`ApiSwitch: "${provider.name}" network error: ${err.message}. Trying next...`)
        }
    }

    env.log.error(`ApiSwitch: all ${providers.length} provider(s) for "${groupTag}" failed`)
    return false
}
