import type { ExecutionEnvironment } from '../types/executor'

export async function SendSmsExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const providerId = env.getInput('providerId') as string
    const to = env.getInput('to') as string
    const message = env.getInput('message') as string
    const senderId = env.getInput('senderId') as string | undefined

    if (!providerId || !to || !message) {
        env.log.error('SendSms: providerId, to, and message are required')
        return false
    }

    const provider = await env.getProvider(providerId)
    if (!provider) {
        env.log.error(`SendSms: provider ${providerId} not found`)
        return false
    }

    // Build auth
    const authHeaders: Record<string, string> = {}
    if (provider.authType !== 'NONE' && provider.secretId) {
        const secretValue = await env.resolveSecret(provider.secretId)
        authHeaders['Authorization'] = `Bearer ${secretValue}`
    }

    const body: Record<string, any> = {
        to, sms: message,
        ...(senderId ? { from: senderId } : {}),
        type: 'plain', channel: 'generic',
    }

    try {
        const url = `${provider.baseUrl.replace(/\/$/, '')}/api/sms/send`
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(15_000),
        })
        const json = await response.json().catch(() => ({})) as any

        if (!response.ok) {
            env.log.error(`SendSms: HTTP ${response.status} — ${JSON.stringify(json)}`)
            env.setOutput('success', false)
            return false
        }

        env.log.info(`SendSms: sent to ${to} via ${provider.name}`)
        env.setOutput('success', true)
        env.setOutput('messageId', json.data?.message_id ?? json.messageId ?? '')
        return true
    } catch (err: any) {
        env.log.error(`SendSms: ${err.message}`)
        return false
    }
}
