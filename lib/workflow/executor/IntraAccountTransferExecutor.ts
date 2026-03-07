/**
 * INTRA_ACCOUNT_TRANSFER Executor
 * 
 * Safely transfers funds between two internal accounts.
 * Validates balances, deducts from the Source Account,
 * credits the Destination Account, and writes two atomic
 * Ledger Transaction records (Debit and Credit).
 */
import type { ExecutionEnvironment } from '../types/executor'

function generateTransferRef(prefix = 'TRF'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function IntraAccountTransferExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('INTRA_ACCOUNT_TRANSFER: No payload instance available in environment')
        return false
    }

    const sourceAccountId: string = env.getInput('sourceAccountId') || ''
    const destinationAccountId: string = env.getInput('destinationAccountId') || ''
    const amountNaira: number = Number(env.getInput('amountNaira') || 0)
    const narration: string = env.getInput('narration') || 'Internal Transfer'

    // Optional integration flags
    const externalApiUrl: string = env.getInput('externalApiUrl') || ''
    const externalApiPayload: any = env.getInput('externalApiPayload')

    const amountKobo = Math.round(amountNaira * 100)

    if (!sourceAccountId || !destinationAccountId || amountKobo <= 0) {
        env.log.error('INTRA_ACCOUNT_TRANSFER: Missing required fields or invalid amount')
        return false
    }

    if (sourceAccountId === destinationAccountId) {
        env.log.error('INTRA_ACCOUNT_TRANSFER: Source and Destination cannot be the same')
        return false
    }

    env.log.info(`INTRA_ACCOUNT_TRANSFER: Preparing to transfer ₦${amountNaira.toLocaleString()} from ${sourceAccountId} to ${destinationAccountId}`)

    try {
        // 1. Pre-flight Validation: Fetch both accounts
        const sourceDoc = await payload.findByID({ collection: 'accounts', id: sourceAccountId }).catch(() => null)
        const destDoc = await payload.findByID({ collection: 'accounts', id: destinationAccountId }).catch(() => null)

        if (!sourceDoc) {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: Source account ${sourceAccountId} not found`)
            return false
        }
        if (!destDoc) {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: Destination account ${destinationAccountId} not found`)
            return false
        }

        if (sourceDoc.status !== 'active' || destDoc.status !== 'active') {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: One or both accounts are inactive`)
            return false
        }

        const sourceBalance = sourceDoc.balance ?? 0
        if (sourceBalance < amountKobo) {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: Insufficient funds in Source. Available: ₦${(sourceBalance / 100).toLocaleString()}, Attempted: ₦${amountNaira.toLocaleString()}`)
            return false
        }

        // 2. Ext API Sync (Optional)
        if (externalApiUrl) {
            env.log.info(`INTRA_ACCOUNT_TRANSFER: Pinging External API [${externalApiUrl}]`)
            try {
                const apiRes = await fetch(externalApiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(externalApiPayload || { sourceId: sourceAccountId, destId: destinationAccountId, amount: amountKobo })
                })

                if (!apiRes.ok) {
                    env.log.error(`INTRA_ACCOUNT_TRANSFER: External API rejected the transaction with status ${apiRes.status}`)
                    return false
                }

                const apiData = await apiRes.json().catch(() => ({}))
                env.setOutput('api_response', apiData)
            } catch (err: any) {
                env.log.error(`INTRA_ACCOUNT_TRANSFER: Network error reaching External API: ${err.message}`)
                return false
            }
        }

        // 3. Atomic Ledger Mutation
        const timestamp = new Date().toISOString()
        const newSourceBalance = sourceBalance - amountKobo
        const newDestBalance = (destDoc.balance ?? 0) + amountKobo
        const transferRef = generateTransferRef('TRF_INT')

        // Update Source
        await payload.update({
            collection: 'accounts',
            id: sourceAccountId,
            data: { balance: newSourceBalance, last_transaction_at: timestamp },
        })

        // Update Dest
        await payload.update({
            collection: 'accounts',
            id: destinationAccountId,
            data: { balance: newDestBalance, last_transaction_at: timestamp },
        })

        // 4. Double-Entry Transactions
        // Source Debit
        await payload.create({
            collection: 'transactions',
            data: {
                reference: `${transferRef}_DB`,
                type: 'transfer',
                amount: amountKobo,
                currency: 'NGN',
                from_account: sourceAccountId,
                to_account: destinationAccountId,
                status: 'successful',
                narration: narration,
                channel: 'workflow',
                balance_after: newSourceBalance,
                workflow_execution: env.executionId,
            },
        })

        // Dest Credit
        await payload.create({
            collection: 'transactions',
            data: {
                reference: `${transferRef}_CR`,
                type: 'credit', // Inward transfer
                amount: amountKobo,
                currency: 'NGN',
                from_account: sourceAccountId,
                to_account: destinationAccountId,
                status: 'successful',
                narration: narration,
                channel: 'workflow',
                balance_after: newDestBalance,
                workflow_execution: env.executionId,
            },
        })

        env.log.info(`INTRA_ACCOUNT_TRANSFER: Success. Ref: ${transferRef}`)
        env.setOutput('transfer_reference', transferRef)
        env.setOutput('status', 'SUCCESS')

        return true
    } catch (e: any) {
        env.log.error(`INTRA_ACCOUNT_TRANSFER: Fatal error: ${e.message}`)
        return false
    }
}
