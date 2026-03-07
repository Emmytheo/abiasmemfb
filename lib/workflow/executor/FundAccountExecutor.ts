/**
 * FUND_ACCOUNT Executor
 * 
 * Deposits funds into a target account from an external source (e.g. Card, USSD).
 * Updates the destination account balance and creates a single Credit ledger entry.
 */
import type { ExecutionEnvironment } from '../types/executor'

function generateDepositRef(prefix = 'DEP'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function FundAccountExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('FUND_ACCOUNT: No payload instance available in environment')
        return false
    }

    const targetAccountId: string = env.getInput('targetAccountId') || ''
    const amountNaira: number = Number(env.getInput('amountNaira') || 0)
    const reference: string = env.getInput('reference') || generateDepositRef()
    const externalApiUrl: string = env.getInput('externalApiUrl') || ''

    const amountKobo = Math.round(amountNaira * 100)

    if (!targetAccountId || amountKobo <= 0) {
        env.log.error('FUND_ACCOUNT: Missing target account ID or invalid amount')
        return false
    }

    env.log.info(`FUND_ACCOUNT: Preparing to fund account ${targetAccountId} with ₦${amountNaira.toLocaleString()}`)

    try {
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

        // 1. Fetch Target Account
        const targetDoc = await resolveAccount(targetAccountId)

        if (!targetDoc) {
            env.log.error(`FUND_ACCOUNT: Target account ${targetAccountId} not found`)
            return false
        }

        if (targetDoc.status !== 'active') {
            env.log.error(`FUND_ACCOUNT: Target account is not active`)
            return false
        }

        // 2. Ext API Verification (Optional)
        // Usually, this node is triggered *after* a payment gateway webhook confirms it.
        // But if an external Verification/Status check URL is supplied, we hit it first.
        if (externalApiUrl) {
            env.log.info(`FUND_ACCOUNT: Verifying Transaction at [${externalApiUrl}]`)
            try {
                const apiRes = await fetch(externalApiUrl, {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' }
                })

                if (!apiRes.ok) {
                    env.log.error(`FUND_ACCOUNT: External verification failed with status ${apiRes.status}`)
                    return false
                }

                const apiData = await apiRes.json().catch(() => ({}))
                env.setOutput('verification_response', apiData)
            } catch (err: any) {
                env.log.error(`FUND_ACCOUNT: Network error reaching verification API: ${err.message}`)
                return false
            }
        }

        const actualTargetId = targetDoc.id as number

        // 3. Ledger Mutation
        const timestamp = new Date().toISOString()
        const newBalance = (targetDoc.balance ?? 0) + amountKobo

        await payload.update({
            collection: 'accounts',
            id: actualTargetId,
            data: { balance: newBalance, last_transaction_at: timestamp },
        })

        // 4. Create Ledger Entry
        await payload.create({
            collection: 'transactions',
            data: {
                reference: reference,
                type: 'credit',
                amount: amountKobo,
                currency: 'NGN',
                to_account: actualTargetId,
                status: 'successful',
                narration: 'Account Funding / Deposit',
                channel: 'workflow',
                balance_after: newBalance,
                workflow_execution: env.executionId,
            },
        })

        env.log.info(`FUND_ACCOUNT: Successfully funded. Ref: ${reference}. New Balance: ₦${(newBalance / 100).toLocaleString()}`)
        env.setOutput('deposit_reference', reference)
        env.setOutput('new_balance', String(newBalance / 100))
        env.setOutput('status', 'SUCCESS')

        return true
    } catch (e: any) {
        env.log.error(`FUND_ACCOUNT: Fatal error: ${e.message}`)
        return false
    }
}
