/**
 * AUTO_REPAYMENT_COLLECTION Executor
 * 
 * Automatically debits borrowers' savings accounts to repay due loan installments.
 * Queries active loans with a next_payment_date <= current date, determines outstanding 
 * installment, checks borrower accounts, debits the funds atomically via a ledger transaction,
 * and updates the loan outstanding balance and schedule.
 */
import type { ExecutionEnvironment } from '../types/executor'

export async function AutoRepaymentCollectorExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('AUTO_REPAYMENT_COLLECTION: No payload instance available in environment')
        return false
    }

    env.log.info('AUTO_REPAYMENT_COLLECTION: Starting automatic repayment recovery process...')

    try {
        const todayStr = new Date().toISOString()

        // 1. Fetch all ACTIVE loans whose repayments are due (next_payment_date <= today)
        const dueLoansQuery = await payload.find({
            collection: 'loans',
            where: {
                and: [
                    { status: { equals: 'active' } },
                    { next_payment_date: { less_than_equal: todayStr } }
                ]
            },
            limit: 100,
        })

        const dueLoans = dueLoansQuery.docs
        env.log.info(`AUTO_REPAYMENT_COLLECTION: Found ${dueLoans.length} due loans for repayment collection`)

        let successCount = 0
        let failureCount = 0

        for (const loan of dueLoans) {
            try {
                const customerId = typeof loan.customer === 'object' ? loan.customer?.id : loan.customer
                if (!customerId) {
                    env.log.warn(`AUTO_REPAYMENT_COLLECTION: Loan ${loan.id} has no linked customer. Skipping.`)
                    continue
                }

                // Determine installment amount to debit (monthly installment or total outstanding, whichever is less)
                const debitAmountKobo = Math.min(
                    loan.monthly_installment || 0,
                    loan.outstanding_balance || 0
                )

                if (debitAmountKobo <= 0) {
                    env.log.info(`AUTO_REPAYMENT_COLLECTION: Loan ${loan.id} has outstanding balance of 0 or invalid installment. Marking as repaid.`)
                    await payload.update({
                        collection: 'loans',
                        id: loan.id,
                        data: { status: 'repaid', next_payment_date: null },
                    })
                    continue
                }

                // 2. Resolve Repayment Account
                // Check if the loan has a linked disbursement/repayment account, and check other customer accounts if needed.
                const linkedAccountId = typeof loan.account === 'object' ? loan.account?.id : loan.account
                let sourceAccountDoc: any = null

                if (linkedAccountId) {
                    sourceAccountDoc = await payload.findByID({
                        collection: 'accounts',
                        id: Number(linkedAccountId)
                    }).catch(() => null)
                }

                // Fallback: If no linked account or linked account lacks funds, search customer's other active accounts
                if (!sourceAccountDoc || (sourceAccountDoc.balance || 0) < debitAmountKobo) {
                    const customerAccounts = await payload.find({
                        collection: 'accounts',
                        where: {
                            and: [
                                { customer: { equals: customerId } },
                                { status: { equals: 'active' } }
                            ]
                        },
                        limit: 10
                    })

                    // Pick the active account with the highest balance
                    const bestAccount = customerAccounts.docs
                        .filter((acc: any) => acc.balance >= debitAmountKobo)
                        .sort((a: any, b: any) => (b.balance || 0) - (a.balance || 0))[0]

                    if (bestAccount) {
                        sourceAccountDoc = bestAccount
                    }
                }

                if (!sourceAccountDoc || (sourceAccountDoc.balance || 0) < debitAmountKobo) {
                    env.log.warn(`AUTO_REPAYMENT_COLLECTION: Loan ${loan.id} customer (ID: ${customerId}) lacks sufficient active funds for repayment of ₦${(debitAmountKobo / 100).toLocaleString()}`)
                    failureCount++
                    continue
                }

                const newAccountBalance = (sourceAccountDoc.balance || 0) - debitAmountKobo
                const newOutstandingBalance = (loan.outstanding_balance || 0) - debitAmountKobo
                const isFullyRepaid = newOutstandingBalance <= 0

                // Calculate next repayment date based on repayment schedule
                let nextPaymentDate: string | null = null
                if (!isFullyRepaid && Array.isArray(loan.repayment_schedule)) {
                    // Find the next upcoming installment from the schedule
                    const upcoming = loan.repayment_schedule.find((inst: any) => {
                        return new Date(inst.dueDate).getTime() > new Date(loan.next_payment_date).getTime()
                    })
                    if (upcoming) {
                        nextPaymentDate = upcoming.dueDate
                    } else {
                        // Fallback: Add 1 month to next_payment_date
                        const currentNext = new Date(loan.next_payment_date)
                        currentNext.setMonth(currentNext.getMonth() + 1)
                        nextPaymentDate = currentNext.toISOString()
                    }
                }

                const timestamp = new Date().toISOString()
                const repaymentRef = `REP-${loan.id}-${Date.now().toString(36).toUpperCase()}`

                // 3. Atomically Execute Ledger Mutations
                await payload.db.transaction(async (req: any) => {
                    // Debit Savings Account
                    await payload.update({
                        collection: 'accounts',
                        id: sourceAccountDoc.id,
                        data: { balance: newAccountBalance, last_transaction_at: timestamp },
                        req,
                    })

                    // Update Loan Outstanding Principal
                    await payload.update({
                        collection: 'loans',
                        id: loan.id,
                        data: {
                            outstanding_balance: newOutstandingBalance,
                            status: isFullyRepaid ? 'repaid' : 'active',
                            next_payment_date: nextPaymentDate,
                        },
                        req,
                    })

                    // Create Debit Transaction Record
                    await payload.create({
                        collection: 'transactions',
                        data: {
                            reference: `${repaymentRef}_DB`,
                            type: 'debit',
                            amount: debitAmountKobo,
                            currency: 'NGN',
                            from_account: sourceAccountDoc.id,
                            status: 'successful',
                            narration: `Automated Loan Repayment (Loan ID: ${loan.id})`,
                            channel: 'workflow',
                            balance_after: newAccountBalance,
                        },
                        req,
                    })

                    // Create Repayment Credit Transaction Record
                    await payload.create({
                        collection: 'transactions',
                        data: {
                            reference: `${repaymentRef}_CR`,
                            type: 'credit',
                            amount: debitAmountKobo,
                            currency: 'NGN',
                            to_account: sourceAccountDoc.id,
                            status: 'successful',
                            narration: `Loan Repayment Credit (Loan ID: ${loan.id})`,
                            channel: 'workflow',
                            balance_after: newAccountBalance,
                        },
                        req,
                    })
                })

                env.log.info(`AUTO_REPAYMENT_COLLECTION: Successfully recovered installment ₦${(debitAmountKobo / 100).toLocaleString()} for Loan ID ${loan.id}. Remaining Balance: ₦${(newOutstandingBalance / 100).toLocaleString()}`)
                successCount++
            } catch (err: any) {
                env.log.error(`AUTO_REPAYMENT_COLLECTION: Error collecting repayment for Loan ID ${loan.id}: ${err.message}`)
                failureCount++
            }
        }

        env.log.info(`AUTO_REPAYMENT_COLLECTION: Job execution completed. Successes: ${successCount}, Failures: ${failureCount}`)
        env.setOutput('repayments_collected', successCount)
        env.setOutput('repayments_failed', failureCount)
        return true
    } catch (e: any) {
        env.log.error(`AUTO_REPAYMENT_COLLECTION: Critical failure: ${e.message}`)
        return false
    }
}
