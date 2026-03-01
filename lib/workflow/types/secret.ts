export type SecretCategory = 'API_KEY' | 'SMTP' | 'OAUTH_TOKEN' | 'DATABASE_URI' | 'WEBHOOK_SECRET' | 'CUSTOM'

export interface Secret {
    id: string
    name: string
    category: SecretCategory
    description?: string
    /** AES-256-GCM encrypted base64 ciphertext — never exposed via public API */
    encryptedValue: string
    iv: string  // base64
    tag: string // base64
    linkedProviderIds?: string[]
    expiresAt?: string
    lastRotatedAt?: string
    createdAt: string
    updatedAt: string
}

/** Plain-text secret value after decryption (only available server-side) */
export type ResolvedSecret = {
    /** The raw decrypted value (e.g., for SMTP: JSON with host/user/pass) */
    value: string
    /** Parsed convenience object if value is JSON */
    parsed?: Record<string, string>
}

export type SecretRotationLog = {
    id: string
    secretId: string
    rotatedAt: string
    rotatedBy: string
}
