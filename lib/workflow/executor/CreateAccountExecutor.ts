/**
 * CREATE_ACCOUNT Executor
 * 
 * Converts an approved product application into a real Account ledger record.
 * Generates a 10-digit NUBAN-style account number, sets balance to 0,
 * and links back to the originating application.
 */
import type { ExecutionEnvironment } from '../types/executor'

function generateNUBAN(): string {
    const bankCode = '033' // Simulated bank code (3 digits for ABIASMEMFB)
    const digits = Array.from({ length: 7 }, () => Math.floor(Math.random() * 10)).join('')
    return bankCode + digits
}

export async function CreateAccountExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const payload = env.payload
    if (!payload) {
        env.log.error('CREATE_ACCOUNT: No payload instance available — execution environment is missing it')
        return false
    }

    const userId: string = env.getInput('user_id') || ''
    const accountType: string = env.getInput('account_type') || 'Savings'
    const productTypeId: string = env.getInput('product_type_id') || ''
    const applicationId: string = env.getInput('application_id') || ''
    const interestRate: number = Number(env.getInput('interest_rate') || 0)

    if (!userId) {
        env.log.error('CREATE_ACCOUNT: user_id is required')
        return false
    }

    const accountNumber = generateNUBAN()
    env.log.info(`CREATE_ACCOUNT: Opening ${accountType} account for user ${userId}`)
    env.log.info(`CREATE_ACCOUNT: Generated account number: ${accountNumber}`)

    try {
        const account = await payload.create({
            collection: 'accounts',
            data: {
                user_id: userId,
                account_number: accountNumber,
                account_type: accountType,
                balance: 0,
                currency: 'NGN',
                status: 'active',
                product_type: productTypeId || undefined,
                application: applicationId || undefined,
                interest_rate: interestRate,
            },
        })

        env.log.info(`CREATE_ACCOUNT: Account created: ${account.id}`)
        env.setOutput('created_account_id', String(account.id))
        env.setOutput('account_number', account.account_number)

        return true
    } catch (e: any) {
        env.log.error(`CREATE_ACCOUNT: Failed to create account: ${e.message}`)
        return false
    }
}
