import { getPayloadClient } from '@/lib/payload'
import { decryptSecret } from './encryption'

/**
 * Resolve a secret from the vault by Payload document ID.
 * Returns the decrypted plaintext value — only available server-side.
 */
export async function resolveSecret(secretId: string): Promise<string> {
    try {
        const payload = await getPayloadClient()
        const secret = await payload.findByID({
            collection: 'secrets',
            id: secretId,
            overrideAccess: true,
        }) as any

        if (secret && (secret.encryptedValue || secret.encrypted_value) && secret.iv && secret.tag) {
            return await decryptSecret(secret.encryptedValue || secret.encrypted_value, secret.iv, secret.tag)
        }
        if (secret && secret.value) {
            return secret.value
        }
    } catch (err: any) {
        console.warn('[resolveSecret] Payload lookup failed:', err.message)
    }

    throw new Error(`Secret ${secretId} not found or missing encrypted payload`)
}

/**
 * Resolve a secret and parse it as JSON (useful for SMTP credentials stored as JSON objects).
 */
export async function resolveSecretAsJson(secretId: string): Promise<Record<string, string>> {
    const value = await resolveSecret(secretId)
    try {
        return JSON.parse(value)
    } catch {
        // If not JSON, return it as a single { value } object
        return { value }
    }
}
