import { NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { intraBankTransfer } from '@/lib/api/adapters/qore/actions'

export async function POST(req: Request) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const body = await req.json().catch(() => ({}))
        const { terminal_id, amount, card_number_masked = '5061********9876' } = body

        if (!terminal_id || !amount || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Valid terminal_id and amount are required' }, { status: 400 })
        }

        const payload = await getPayload({ config: configPromise })

        // Find customer associated with user (the agent)
        const agentCustomerResult = await payload.find({
            collection: 'customers',
            where: { supabase_id: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        })

        const agentCustomer = agentCustomerResult.docs[0]
        if (!agentCustomer) {
            return NextResponse.json({ error: 'Agent customer profile not found' }, { status: 404 })
        }

        // Verify POS terminal exists and belongs to the agent
        const terminal = await payload.findByID({
            collection: 'agency-terminals',
            id: terminal_id,
            overrideAccess: true,
        })

        if (!terminal) {
            return NextResponse.json({ error: 'POS terminal not found' }, { status: 404 })
        }

        const termAgentId = typeof terminal.agent_customer === 'object' ? terminal.agent_customer.id : terminal.agent_customer
        if (termAgentId !== agentCustomer.id) {
            return NextResponse.json({ error: 'Unauthorized: Terminal is not assigned to this agent' }, { status: 403 })
        }

        if (terminal.status !== 'active' && terminal.status !== 'assigned') {
            return NextResponse.json({ error: 'Terminal is currently inactive or suspended' }, { status: 400 })
        }

        // Find agent's float/settlement savings account
        const agentAccounts = await payload.find({
            collection: 'accounts',
            where: {
                and: [
                    { user_id: { equals: user.id } },
                    { status: { equals: 'active' } },
                ]
            },
            overrideAccess: true,
            limit: 5,
        })

        const agentFloatAccount = agentAccounts.docs.find((acc) => acc.is_primary) || agentAccounts.docs[0]
        if (!agentFloatAccount) {
            return NextResponse.json({ error: 'No active agent float bank account found to credit cash-out' }, { status: 400 })
        }

        const amountKobo = Math.round(Number(amount))

        // Calculate commissions: 1.5% capped at 1000 NGN
        const totalFeeKobo = Math.min(100000, Math.round((amountKobo * 1.5) / 100))
        const agentShareKobo = Math.round(totalFeeKobo * 0.7) // Agent gets 70%
        const bankShareKobo = totalFeeKobo - agentShareKobo // Bank gets 30%

        const ref = `POS_WD_${Date.now()}`

        // --- MOCK CARD SWITCH VALIDATION ---
        // Simulating a real NIBSS/Interswitch card verification and debit.
        if (body.pin === '0000' || card_number_masked.endsWith('0000')) {
             return NextResponse.json({ error: 'Card Switch Error: Invalid PIN or Card Blocked' }, { status: 400 })
        }

        // Trigger a ledger transaction strictly to the core.
        let qoreSuccess = false
        if (agentFloatAccount.source === 'qore') {
            try {
                // In a real agency cash-out, BankOne/Qore handles the card settlement
                // and credits the agent's core account. We simulate that credit call here.
                await intraBankTransfer({
                    FromAccountNumber: 'SYSTEM_SWITCH_VAULT',
                    ToAccountNumber: agentFloatAccount.account_number,
                    Amount: String(amountKobo + agentShareKobo),
                    Narration: `POS Terminal Cash-out ref: ${ref}`,
                    RetrievalReference: ref.slice(0, 12).padEnd(12, '0'),
                })
                qoreSuccess = true
            } catch (err: any) {
                console.error('[Qore POS Sync] Core ledger credit failed. Aborting transaction.', err)
                return NextResponse.json({ error: `Core Settlement Error: ${err.message}` }, { status: 400 })
            }
        }

        // Update Agent balance locally: cashout amount + commission share is added to their float
        const updatedAgentBalance = agentFloatAccount.balance + amountKobo + agentShareKobo
        await payload.update({
            collection: 'accounts',
            id: agentFloatAccount.id,
            data: {
                balance: updatedAgentBalance,
            },
            overrideAccess: true,
        })

        // Create immutable Transaction record for the POS Cash-out
        const txn = await payload.create({
            collection: 'transactions',
            data: {
                reference: ref,
                type: 'credit',
                amount: amountKobo,
                to_account: agentFloatAccount.id,
                status: 'successful',
                narration: `POS Cash-out withdrawal: ${card_number_masked}`,
                channel: 'api',
                customer: agentCustomer.id,
                user_id: user.id,
                metadata: {
                    terminal_id,
                    serial_number: terminal.serial_number,
                    card_number_masked,
                    qore_processed: qoreSuccess,
                },
            },
            overrideAccess: true,
        })

        // Create Commission record
        const commission = await payload.create({
            collection: 'agency-commissions',
            data: {
                agent_customer: agentCustomer.id,
                user_id: user.id,
                terminal: terminal.id,
                transaction: txn.id,
                transaction_amount: amountKobo,
                total_commission: totalFeeKobo,
                agent_share: agentShareKobo,
                bank_share: bankShareKobo,
                status: 'settled', // instantly settled to float
            },
            overrideAccess: true,
        })

        return NextResponse.json({
            success: true,
            commission,
            cashReceivedByClient: amountKobo / 100,
            creditedToAgentFloat: (amountKobo + agentShareKobo) / 100,
            agentFloatBalanceAfter: updatedAgentBalance / 100,
        })
    } catch (error: any) {
        console.error('POS Cashout processing error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
