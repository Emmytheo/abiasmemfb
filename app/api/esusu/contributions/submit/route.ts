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
        const { cycle_id, amount } = body

        if (!cycle_id || !amount || Number(amount) <= 0) {
            return NextResponse.json({ error: 'Valid cycle_id and contribution amount are required' }, { status: 400 })
        }

        const payload = await getPayload({ config: configPromise })

        // Find customer associated with user
        const customerResult = await payload.find({
            collection: 'customers',
            where: { supabase_id: { equals: user.id } },
            limit: 1,
            overrideAccess: true,
        })

        const customer = customerResult.docs[0]
        if (!customer) {
            return NextResponse.json({ error: 'Customer profile not found' }, { status: 404 })
        }

        // Get cycle & vault
        const cycle = await payload.findByID({
            collection: 'esusu-cycles',
            id: cycle_id,
            overrideAccess: true,
        })

        if (!cycle) {
            return NextResponse.json({ error: 'Esusu cycle not found' }, { status: 404 })
        }

        // Get member record
        const memberResult = await payload.find({
            collection: 'esusu-members',
            where: {
                and: [
                    { cycle: { equals: cycle_id } },
                    { customer: { equals: customer.id } },
                    { status: { equals: 'active' } },
                ]
            },
            overrideAccess: true,
            limit: 1,
        })

        const member = memberResult.docs[0]
        if (!member) {
            return NextResponse.json({ error: 'You are not an active member in this esusu cycle' }, { status: 400 })
        }

        // Find user's primary/active account to debit
        const userAccounts = await payload.find({
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

        const primaryAccount = userAccounts.docs.find((acc) => acc.is_primary) || userAccounts.docs[0]
        if (!primaryAccount) {
            return NextResponse.json({ error: 'No active savings account found to process contribution debit' }, { status: 400 })
        }

        const amountKobo = Math.round(Number(amount))
        if (primaryAccount.balance < amountKobo) {
            return NextResponse.json({ error: 'Insufficient funds in your savings account' }, { status: 400 })
        }

        const vaultAccountId = typeof cycle.holding_vault_account === 'object' ? cycle.holding_vault_account.id : cycle.holding_vault_account
        if (!vaultAccountId) {
            return NextResponse.json({ error: 'Cycle holding vault account is not set' }, { status: 500 })
        }

        const vaultAccount = await payload.findByID({
            collection: 'accounts',
            id: vaultAccountId,
            overrideAccess: true,
        })

        if (!vaultAccount) {
            return NextResponse.json({ error: 'Cycle holding vault account not found' }, { status: 500 })
        }

        const ref = `ESU_CON_${Date.now()}`

        // Trigger ledger transaction strictly on the core switch.
        let qoreSuccess = false
        if (primaryAccount.source === 'qore' && vaultAccount.source === 'qore') {
            try {
                await intraBankTransfer({
                    FromAccountNumber: primaryAccount.account_number,
                    ToAccountNumber: vaultAccount.account_number,
                    Amount: String(amountKobo),
                    Narration: `Esusu Contribution Cycle: ${cycle.name}`,
                    RetrievalReference: ref.slice(0, 12).padEnd(12, '0'),
                })
                qoreSuccess = true
            } catch (err: any) {
                console.error('[Qore Esusu Sync] Qore transfer failed. Aborting local settlement...', err)
                return NextResponse.json({ error: `Core Banking Transaction Failed: ${err.message}` }, { status: 400 })
            }
        }

        // Deduct balance locally
        await payload.update({
            collection: 'accounts',
            id: primaryAccount.id,
            data: {
                balance: primaryAccount.balance - amountKobo,
            },
            overrideAccess: true,
        })

        // Add to vault balance
        await payload.update({
            collection: 'accounts',
            id: vaultAccount.id,
            data: {
                balance: vaultAccount.balance + amountKobo,
            },
            overrideAccess: true,
        })

        // Write immutable Transaction record
        const txn = await payload.create({
            collection: 'transactions',
            data: {
                reference: ref,
                type: 'transfer',
                amount: amountKobo,
                from_account: primaryAccount.id,
                to_account: vaultAccount.id,
                status: 'successful',
                narration: `Esusu Contribution: ${cycle.name}`,
                channel: 'portal',
                customer: customer.id,
                user_id: user.id,
                metadata: {
                    cycle_id,
                    member_id: member.id,
                    qore_processed: qoreSuccess,
                },
            },
            overrideAccess: true,
        })

        // Record Esusu Contribution
        const contribution = await payload.create({
            collection: 'esusu-contributions',
            data: {
                cycle: cycle.id,
                member: member.id,
                customer: customer.id,
                user_id: user.id,
                amount: amountKobo,
                status: 'paid',
                transaction: txn.id,
            },
            overrideAccess: true,
        })

        return NextResponse.json({ success: true, contribution, balanceAfter: primaryAccount.balance - amountKobo })
    } catch (error: any) {
        console.error('Esusu contribution submission error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
