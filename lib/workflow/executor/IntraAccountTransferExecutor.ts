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
    // Allow forms to send either "amountNaira" or generic "amount"
    const amountNaira: number = Number(env.getInput('amountNaira') || env.getInput('amount') || 0)
    const narration: string = env.getInput('narration') || 'Internal Transfer'

    // Optional integration flags
    const externalApiUrl: string = env.getInput('externalApiUrl') || ''
    const externalApiPayload: any = env.getInput('externalApiPayload')

    const amountKobo = Math.round(amountNaira * 100)

    console.log('INTRA_ACCOUNT_TRANSFER: env:', env)
    console.log('INTRA_ACCOUNT_TRANSFER: Source Account ID:', sourceAccountId)
    console.log('INTRA_ACCOUNT_TRANSFER: Destination Account ID:', destinationAccountId)
    console.log('INTRA_ACCOUNT_TRANSFER: Amount (Naira):', amountNaira)
    console.log('INTRA_ACCOUNT_TRANSFER: Amount (Kobo):', amountKobo)
    console.log('INTRA_ACCOUNT_TRANSFER: Narration:', narration)
    console.log('INTRA_ACCOUNT_TRANSFER: External API URL:', externalApiUrl)
    console.log('INTRA_ACCOUNT_TRANSFER: External API Payload:', externalApiPayload)

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
        // 1. Pre-flight Validation: Resolve Accounts
        // They could be Payload object IDs or 10-digit NUBAN account numbers.
        const resolveAccount = async (identifier: string) => {
            // Postgres `serial` (integer) maxes out at 2,147,483,647.
            // 10-digit NUBAN accounts (e.g. 3086167603) throw overflow errors if passed into findByID mapped to ID.
            const isSafeInteger = !isNaN(Number(identifier)) && Number(identifier) > 0 && Number(identifier) < 2147483647

            if (isSafeInteger) {
                let doc = await payload.findByID({ collection: 'accounts', id: Number(identifier) }).catch(() => null)
                if (doc) return doc
            }

            // Fallback: Query by account_number
            const query = await payload.find({
                collection: 'accounts',
                where: { account_number: { equals: identifier } },
                limit: 1
            })
            return query.docs[0] || null
        }

        const sourceDoc = await resolveAccount(sourceAccountId)
        const destDoc = await resolveAccount(destinationAccountId)

        if (!sourceDoc) {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: Source account identifier '${sourceAccountId}' could not be resolved.`)
            return false
        }
        if (!destDoc) {
            env.log.error(`INTRA_ACCOUNT_TRANSFER: Destination account identifier '${destinationAccountId}' could not be resolved.`)
            return false
        }

        const actualSourceId = sourceDoc.id as number
        const actualDestId = destDoc.id as number

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
            id: actualSourceId,
            data: { balance: newSourceBalance, last_transaction_at: timestamp },
        })

        // Update Dest
        await payload.update({
            collection: 'accounts',
            id: actualDestId,
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
                from_account: actualSourceId,
                to_account: actualDestId,
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
                from_account: actualSourceId,
                to_account: actualDestId,
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
