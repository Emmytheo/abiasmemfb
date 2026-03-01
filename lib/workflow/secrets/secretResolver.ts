'use server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { decryptSecret } from './encryption'

/**
 * Resolve a secret from the vault by Payload document ID.
 * Returns the decrypted plaintext value — only available server-side.
 */
export async function resolveSecret(secretId: string): Promise<string> {
    const payload = await getPayload({ config })
    const secret = await payload.findByID({
        collection: 'secrets',
        id: secretId,
    }) as any

    if (!secret) throw new Error(`Secret ${secretId} not found`)
    if (!secret.encryptedValue || !secret.iv || !secret.tag) {
        throw new Error(`Secret ${secretId} is missing encrypted data. Re-save the secret.`)
    }

    return await decryptSecret(secret.encryptedValue, secret.iv, secret.tag)
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
