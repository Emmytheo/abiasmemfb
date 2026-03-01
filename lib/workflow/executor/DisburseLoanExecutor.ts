/**
 * DISBURSE_LOAN Executor
 * 
 * Creates an active Loan record, computes a repayment schedule (PMT formula),
 * disburses the principal into the borrower's account by creating a
 * credit Transaction record and updating the account balance.
 */
import type { ExecutionEnvironment } from '../types/executor'

function generateReference(prefix = 'LN'): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
}

function computeSchedule(principal: number, annualRate: number, months: number): any[] {
    const monthlyRate = annualRate / 100 / 12
    const installment = monthlyRate === 0
        ? principal / months
        : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)

    let balance = principal
    const schedule = []
    const startDate = new Date()

    for (let i = 1; i <= months; i++) {
        const interest = balance * monthlyRate
        const principalPart = installment - interest
        balance -= principalPart
        const dueDate = new Date(startDate)
        dueDate.setMonth(dueDate.getMonth() + i)

        schedule.push({
            installment: i,
            dueDate: dueDate.toISOString().split('T')[0],
            principal: Math.round(principalPart),
            interest: Math.round(interest),
            installmentAmount: Math.round(installment),
            balance: Math.max(0, Math.round(balance)),
        })
    }
    return schedule
}

export async function DisburseLoanExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('DISBURSE_LOAN: No payload instance available in environment')
        return false
    }

    const userId: string = env.getInput('user_id') || ''
    const accountId: string = env.getInput('account_id') || ''
    const applicationId: string = env.getInput('application_id') || ''
    const productTypeId: string = env.getInput('product_type_id') || ''
    // Amount expected in Naira, stored internally as kobo
    const principalNaira: number = Number(env.getInput('principal_naira') || 0)
    const principalKobo = principalNaira * 100
    const interestRate: number = Number(env.getInput('interest_rate') || 10)
    const durationMonths: number = Number(env.getInput('duration_months') || 12)
    const purpose: string = env.getInput('purpose') || 'General'

    if (!userId || !principalKobo) {
        env.log.error('DISBURSE_LOAN: user_id and principal_naira are required')
        return false
    }

    const schedule = computeSchedule(principalKobo, interestRate, durationMonths)
    const monthlyInstallment = schedule[0]?.installmentAmount ?? 0
    const maturityDate = schedule[schedule.length - 1]?.dueDate
    const nextPaymentDate = schedule[0]?.dueDate
    const loanRef = generateReference('LN')

    env.log.info(`DISBURSE_LOAN: Disbursing ₦${principalNaira.toLocaleString()} to user ${userId}`)

    try {
        const disbursedAt = new Date().toISOString()

        // 1. Create Loan record
        const loan = await payload.create({
            collection: 'loans',
            data: {
                user_id: userId,
                account: accountId || undefined,
                application: applicationId || undefined,
                product_type: productTypeId || undefined,
                principal: principalKobo,
                outstanding_balance: principalKobo,
                interest_rate: interestRate,
                duration_months: durationMonths,
                monthly_installment: monthlyInstallment,
                disbursed_at: disbursedAt,
                next_payment_date: nextPaymentDate,
                maturity_date: maturityDate,
                status: 'active',
                repayment_schedule: schedule,
                purpose,
            },
        })

        env.log.info(`DISBURSE_LOAN: Loan record created: ${loan.id}`)

        // 2. Credit the borrower's account and create a transaction record
        if (accountId) {
            const accountDoc = await payload.findByID({ collection: 'accounts', id: accountId }).catch(() => null)
            if (accountDoc) {
                const newBalance = (accountDoc.balance ?? 0) + principalKobo
                await payload.update({
                    collection: 'accounts',
                    id: accountId,
                    data: { balance: newBalance, last_transaction_at: disbursedAt },
                })

                await payload.create({
                    collection: 'transactions',
                    data: {
                        reference: loanRef,
                        type: 'disbursement',
                        amount: principalKobo,
                        currency: 'NGN',
                        to_account: accountId,
                        loan: String(loan.id),
                        status: 'successful',
                        narration: `Loan disbursement - ${purpose}`,
                        channel: 'workflow',
                        balance_after: newBalance,
                    },
                })

                env.log.info(`DISBURSE_LOAN: ₦${principalNaira.toLocaleString()} credited to account ${accountDoc.account_number}`)
            }
        }

        env.setOutput('loan_id', String(loan.id))
        env.setOutput('loan_reference', loanRef)
        env.setOutput('monthly_installment_naira', String(monthlyInstallment / 100))

        return true
    } catch (e: any) {
        env.log.error(`DISBURSE_LOAN: Disbursement failed: ${e.message}`)
        return false
    }
}
