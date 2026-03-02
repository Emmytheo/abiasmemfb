import type { ExecutionEnvironment } from '../types/executor'

export async function ValidateDataExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const inputData = env.getInput('inputData')
    const expression = env.getInput('expression') as string
    const input = typeof inputData === 'string' ? JSON.parse(inputData || '{}') : (inputData ?? {})
    if (expression) {
        try {
            const fn = new Function('input', `"use strict"; return (${expression})`)
            const result = fn(input)
            const isValid = result?.isValid ?? !!result
            const errors = result?.errors ?? (isValid ? [] : ['Validation failed'])
            env.setOutput('isValid', isValid)
            env.setOutput('errors', errors)
            env.log.info(`ValidateData: isValid=${isValid}`)
            return true
        } catch (err: any) { env.log.error(`ValidateData: ${err.message}`); return false }
    }
    // No expression → pass
    env.setOutput('isValid', true)
    env.setOutput('errors', [])
    return true
}

export async function MapFieldsExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const schema = env.getInput('schema')

    if (!schema || typeof schema !== 'object') {
        env.log.error('MapFields requires a valid JSON object schema.')
        return false
    }

    // The values within the schema have already been interpolated by the `resolveVariables`
    // function in executeWorkflow.ts before this executor is called.
    for (const [key, value] of Object.entries(schema)) {
        env.setOutput(key, value)
    }

    env.setOutput('mappedObject', schema)
    env.log.info(`MapFields: mapped ${Object.keys(schema).length} field(s)`)
    return true
}

export async function AutoApproveExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const inputData = env.getInput('inputData')
    const conditions = env.getInput('conditions') as string
    let approved = true
    if (conditions) {
        try {
            const input = typeof inputData === 'string' ? JSON.parse(inputData) : inputData
            const fn = new Function('input', `"use strict"; return !!(${conditions})`)
            approved = fn(input)
        } catch { approved = false }
    }
    env.setOutput('approved', approved)
    env.setOutput('reason', approved ? 'Auto-approved by conditions' : 'Conditions not met')
    env.log.info(`AutoApprove: ${approved}`)
    return true
}

export async function AutoRejectExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const reason = env.getInput('reason') as string || 'Automatically rejected'
    env.setOutput('rejected', true)
    env.setOutput('reason', reason)
    env.log.info(`AutoReject: ${reason}`)
    return true
}

export async function WebhookDeliverExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const url = env.getInput('url') as string
    const payload = env.getInput('payload')
    if (!url) { env.log.error('WebhookDeliver: url required'); return false }
    try {
        const body = typeof payload === 'string' ? payload : JSON.stringify(payload)
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body,
            signal: AbortSignal.timeout(15_000),
        })
        env.setOutput('success', res.ok)
        env.setOutput('responseCode', res.status)
        env.log.info(`WebhookDeliver: HTTP ${res.status}`)
        return res.ok
    } catch (err: any) { env.log.error(`WebhookDeliver: ${err.message}`); return false }
}

export async function GenerateDocumentExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    // Stub — extend with your document generation service (e.g., Carbone, Gotenberg, etc.)
    const templateId = env.getInput('templateId') as string
    env.log.info(`GenerateDocument: stub for template ${templateId}. Implement with your document service.`)
    env.setOutput('documentUrl', '')
    return true
}

export async function KycCheckExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const providerId = env.getInput('providerId') as string
    const applicantData = env.getInput('applicantData')
    const verificationType = env.getInput('verificationType') as string || 'BVN'
    const provider = await env.getProvider(providerId)
    if (!provider) { env.log.error(`KycCheck: provider ${providerId} not found`); return false }
    const authHeaders: Record<string, string> = {}
    if (provider.authType !== 'NONE' && provider.secretId) {
        const secret = await env.resolveSecret(provider.secretId)
        authHeaders['Authorization'] = `Bearer ${secret}`
    }
    try {
        const body = typeof applicantData === 'string' ? JSON.parse(applicantData) : applicantData
        const url = `${provider.baseUrl.replace(/\/$/, '')}/v1/verifications/${verificationType.toLowerCase()}`
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(body),
            signal: AbortSignal.timeout(20_000),
        })
        const json = await res.json().catch(() => ({})) as any
        env.setOutput('verified', res.ok && (json.status === 'success' || json.verified === true))
        env.setOutput('score', json.score ?? 0)
        env.setOutput('flags', json.flags ?? [])
        env.setOutput('report', json)
        env.log.info(`KycCheck: HTTP ${res.status} via ${provider.name}`)
        return res.ok
    } catch (err: any) { env.log.error(`KycCheck: ${err.message}`); return false }
}

export async function CreditScoreExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    const providerId = env.getInput('providerId') as string
    const applicantRef = env.getInput('applicantRef') as string
    const provider = await env.getProvider(providerId)
    if (!provider) { env.log.error(`CreditScore: provider ${providerId} not found`); return false }
    const authHeaders: Record<string, string> = {}
    if (provider.authType !== 'NONE' && provider.secretId) {
        const secret = await env.resolveSecret(provider.secretId)
        authHeaders['Authorization'] = `Bearer ${secret}`
    }
    try {
        const url = `${provider.baseUrl.replace(/\/$/, '')}/v1/credit-score?ref=${encodeURIComponent(applicantRef)}`
        const res = await fetch(url, { headers: { ...authHeaders }, signal: AbortSignal.timeout(20_000) })
        const json = await res.json().catch(() => ({})) as any
        env.setOutput('score', json.score ?? 0)
        env.setOutput('band', json.band ?? 'UNKNOWN')
        env.setOutput('report', json)
        env.log.info(`CreditScore: score=${json.score} via ${provider.name}`)
        return res.ok
    } catch (err: any) { env.log.error(`CreditScore: ${err.message}`); return false }
}

export async function LoopExecutor(env: ExecutionEnvironment<any>): Promise<boolean> {
    // Loop nodes are handled structurally by the execution plan — this is a passthrough
    const items = env.getInput('items')
    const arr = Array.isArray(items) ? items : (typeof items === 'string' ? JSON.parse(items || '[]') : [])
    env.setOutput('currentItem', arr[0] ?? null)
    env.setOutput('index', 0)
    env.log.info(`Loop: ${arr.length} item(s) queued`)
    return true
}
