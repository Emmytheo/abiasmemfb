'use server'
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_HEX = process.env.WORKFLOW_ENCRYPTION_KEY || ''

function getKey(): Buffer {
    if (!KEY_HEX || KEY_HEX.length !== 64) {
        throw new Error(
            'WORKFLOW_ENCRYPTION_KEY must be a 64-character hex string (32 bytes). ' +
            'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"'
        )
    }
    return Buffer.from(KEY_HEX, 'hex')
}

/** Encrypt a plaintext string → returns base64-encoded ciphertext, IV and auth tag. */
export async function encryptSecret(plaintext: string): Promise<{
    ciphertext: string
    iv: string
    tag: string
}> {
    const key = getKey()
    const iv = crypto.randomBytes(12) // 96-bit IV for GCM
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return {
        ciphertext: encrypted.toString('base64'),
        iv: iv.toString('base64'),
        tag: tag.toString('base64'),
    }
}

/** Decrypt a base64-encoded GCM ciphertext back to plaintext. */
export async function decryptSecret(ciphertext: string, iv: string, tag: string): Promise<string> {
    const key = getKey()
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        key,
        Buffer.from(iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(ciphertext, 'base64')),
        decipher.final(),
    ])
    return decrypted.toString('utf8')
}
