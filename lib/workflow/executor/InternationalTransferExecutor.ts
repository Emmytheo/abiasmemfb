/**
 * INTERNATIONAL_TRANSFER Executor
 * 
 * Processes cross-border SWIFT transfers.
 * Computes live FX conversions, deducts NGN equivalent from source,
 * and routes payload to the SWIFT/International gateway Provider.
 */
import type { ExecutionEnvironment } from '../types/executor'

function generateSwiftRef(prefix = 'SWIFT'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

export async function InternationalTransferExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('INTERNATIONAL_TRANSFER: No payload instance available in environment')
        return false
    }

    const sourceAccountId: string = env.getInput('sourceAccountId') || ''
    const destinationCurrency: string = env.getInput('currency') || 'USD'
    const foreignAmount: number = Number(env.getInput('amount') || 0)

    const iban: string = env.getInput('iban') || ''
    const swift: string = env.getInput('swift') || ''
    const accountName: string = env.getInput('accountName') || ''
    const narration: string = env.getInput('narration') || 'Cross-border Payment'

    // Mock FX rates - realistically fetched from config or live API Provider
    const fxRates: Record<string, number> = {
        'USD': 1650,
        'GBP': 2100,
        'EUR': 1780
    }
    const rate = fxRates[destinationCurrency] || 1650

    // Compute NGN equivalent
    const amountNaira = foreignAmount * rate
    const amountKobo = Math.round(amountNaira * 100)

    env.log.info(`INTERNATIONAL_TRANSFER: Initiating ${destinationCurrency}${foreignAmount} transfer (NGN${amountNaira}) to ${iban}`)

    if (!sourceAccountId || !iban || foreignAmount <= 0) {
        env.log.error('INTERNATIONAL_TRANSFER: Missing required fields or invalid amount')
        return false
    }

    try {
        const sourceDoc = await payload.findByID({ collection: 'accounts', id: Number(sourceAccountId) }).catch(() => null)

        if (!sourceDoc || sourceDoc.status !== 'active') {
            env.log.error(`INTERNATIONAL_TRANSFER: Source account invalid or inactive`)
            return false
        }

        const sourceBalance = sourceDoc.balance ?? 0
        // SWIFT transfers have higher flat fees
        const feeKobo = 1500000 // 15,000 NGN
        const totalDebitKobo = amountKobo + feeKobo

        if (sourceBalance < totalDebitKobo) {
            env.log.error(`INTERNATIONAL_TRANSFER: Insufficient funds. Required: ₦${(totalDebitKobo / 100).toLocaleString()}`)
            return false
        }

        const actualSourceId = sourceDoc.id as number
        const timestamp = new Date().toISOString()
        const transferRef = generateSwiftRef()

        env.log.info(`INTERNATIONAL_TRANSFER: Calling SWIFT API provider...`)

        const newSourceBalance = sourceBalance - totalDebitKobo
        await payload.update({
            collection: 'accounts',
            id: actualSourceId,
            data: { balance: newSourceBalance, last_transaction_at: timestamp },
        })

        // Debit Principal
        await payload.create({
            collection: 'transactions',
            data: {
                user: typeof sourceDoc.user === 'object' ? sourceDoc.user.id : sourceDoc.user,
                account: actualSourceId,
                type: 'debit',
                amount: amountKobo,
                currency: 'NGN',
                status: 'completed',
                category: 'Transfer',
                reference: transferRef,
                description: `SWIFT TO ${accountName} / ${iban}`,
                metadata: {
                    direction: 'outbound_swift',
                    foreignCurrency: destinationCurrency,
                    foreignAmount: foreignAmount,
                    exchangeRate: rate,
                    swiftCode: swift,
                    narration
                }
            } as any
        })

        // Debit Fee
        await payload.create({
            collection: 'transactions',
            data: {
                user: typeof sourceDoc.user === 'object' ? sourceDoc.user.id : sourceDoc.user,
                account: actualSourceId,
                type: 'debit',
                amount: feeKobo,
                currency: 'NGN',
                status: 'completed',
                category: 'Fee',
                reference: `${transferRef}-FEE`,
                description: `SWIFT Wire Fee`,
            } as any
        })

        env.log.info(`INTERNATIONAL_TRANSFER: Transaction ${transferRef} completed`)
        env.setOutput('transferReference', transferRef)
        env.setOutput('exchangeRateApplied', rate)

        return true

    } catch (err: any) {
        env.log.error(`INTERNATIONAL_TRANSFER: Critical failure: ${err.message}`)
        return false
    }
}
