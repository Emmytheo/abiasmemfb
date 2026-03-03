import crypto from 'crypto'
import { getPayload } from 'payload'
import config from '@payload-config'

export type IdempotencyCheckResult =
    | { isDuplicate: false }
    | { isDuplicate: true; existingExecutionId: string }

/**
 * Generate a SHA-256 idempotency key from workflow context.
 * Same workflowId + trigger + inputHash within the window → same key.
 */
export function generateIdempotencyKey(
    workflowId: string,
    trigger: string,
    inputData: Record<string, any> | null | undefined
): string {
    const inputHash = crypto
        .createHash('sha256')
        .update(JSON.stringify(inputData ?? {}))
        .digest('hex')

    return crypto
        .createHash('sha256')
        .update(`${workflowId}:${trigger}:${inputHash}`)
        .digest('hex')
}

/**
 * Check if an identical workflow run already exists within the deduplication window.
 * Uses the idempotency-records Payload collection.
 */
export async function checkIdempotency(
    key: string,
    windowMinutes: number
): Promise<IdempotencyCheckResult> {
    const payload = await getPayload({ config })
    const now = new Date()

    const records = await payload.find({
        collection: 'idempotency-records',
        where: {
            and: [
                { key: { equals: key } },
                { expiresAt: { greater_than: now.toISOString() } },
            ],
        },
        limit: 1,
    })

    if (records.docs.length > 0) {
        const record = records.docs[0] as any
        return { isDuplicate: true, existingExecutionId: record.executionId }
    }

    return { isDuplicate: false }
}

/**
 * Record a new idempotency entry after triggering an execution.
 * Call this AFTER creating the execution record.
 */
export async function recordIdempotency(
    key: string,
    workflowId: string,
    executionId: string,
    trigger: string,
    windowMinutes: number
): Promise<void> {
    const payload = await getPayload({ config })
    const expiresAt = new Date(Date.now() + windowMinutes * 60 * 1000)

    await payload.create({
        collection: 'idempotency-records',
        data: {
            key,
            workflowId: String(workflowId),
            executionId: String(executionId),
            trigger,
            expiresAt: expiresAt.toISOString(),
        },
    })
}
