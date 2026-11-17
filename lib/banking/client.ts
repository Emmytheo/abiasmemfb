/**
 * lib/banking/client.ts
 * Standalone banking client / Integration Boundary.
 * Bridges Copteller's cooperative products with the core bank ledger (accounts and transactions).
 */

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface BankingAccount {
    id: string
    userId: string
    accountNumber: string
    accountType: string
    balanceKobo: number
    status: 'active' | 'frozen' | 'closed'
}

export interface BankTransactionResult {
    success: boolean
    reference: string
    balanceAfterKobo: number
}

/**
 * Fetch member's active transactional account
 */
export async function getMemberAccount(userId: string): Promise<BankingAccount | null> {
    try {
        const payload = await getPayload({ config: configPromise })
        const res = await payload.find({
            collection: 'accounts' as any,
            where: {
                user_id: { equals: userId }
            },
            limit: 1,
            overrideAccess: true
        })

        const doc = res.docs[0]
        if (!doc) return null

        return {
            id: String(doc.id),
            userId: String(doc.user_id),
            accountNumber: String(doc.account_number),
            accountType: String(doc.account_type),
            balanceKobo: Number(doc.balance ?? 0),
            status: doc.status as any
        }
    } catch (err) {
        console.error('[Banking Client] Error getting account:', err)
        return null
    }
}

/**
 * Deduct/Debit a specific amount from member's wallet
 */
export async function debitMemberWallet(
    userId: string,
    amountKobo: number,
    description: string
): Promise<BankTransactionResult> {
    if (amountKobo <= 0) throw new Error("Amount must be positive.")
    const payload = await getPayload({ config: configPromise })

    const account = await getMemberAccount(userId)
    if (!account) {
        throw new Error(`Bank account not found for user: ${userId}`)
    }

    if (account.balanceKobo < amountKobo) {
        throw new Error(`Insufficient funds in wallet: ${account.accountNumber}`)
    }

    const newBalance = account.balanceKobo - amountKobo
    const reference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Update account balance in DB
    await payload.update({
        collection: 'accounts' as any,
        id: account.id,
        data: {
            balance: newBalance
        },
        overrideAccess: true
    })

    // Log ledger transaction
    await payload.create({
        collection: 'transactions' as any,
        data: {
            reference,
            account_number: account.accountNumber,
            amount: amountKobo,
            transaction_type: 'debit',
            status: 'completed',
            description,
            balance_after: newBalance,
            date: new Date().toISOString()
        } as any,
        overrideAccess: true
    })

    return {
        success: true,
        reference,
        balanceAfterKobo: newBalance
    }
}

/**
 * Credit a specific amount to member's wallet
 */
export async function creditMemberWallet(
    userId: string,
    amountKobo: number,
    description: string
): Promise<BankTransactionResult> {
    if (amountKobo <= 0) throw new Error("Amount must be positive.")
    const payload = await getPayload({ config: configPromise })

    const account = await getMemberAccount(userId)
    if (!account) {
        throw new Error(`Bank account not found for user: ${userId}`)
    }

    const newBalance = account.balanceKobo + amountKobo
    const reference = `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // Update account balance in DB
    await payload.update({
        collection: 'accounts' as any,
        id: account.id,
        data: {
            balance: newBalance
        },
        overrideAccess: true
    })

    // Log ledger transaction
    await payload.create({
        collection: 'transactions' as any,
        data: {
            reference,
            account_number: account.accountNumber,
            amount: amountKobo,
            transaction_type: 'credit',
            status: 'completed',
            description,
            balance_after: newBalance,
            date: new Date().toISOString()
        } as any,
        overrideAccess: true
    })

    return {
        success: true,
        reference,
        balanceAfterKobo: newBalance
    }
}
