import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerSupabase } from '@/lib/supabase/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export async function POST(req: NextRequest) {
    try {
        const supabase = await createServerSupabase()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
        }

        const authenticatedUserId = user.id
        const payload = await getPayload({ config: configPromise })

        // 1. Fetch active esusu cycles
        const cyclesRes = await payload.find({
            collection: 'esusu-cycles',
            where: {
                status: { equals: 'active' },
            },
            limit: 10,
            overrideAccess: true,
        })

        const activeCycles = cyclesRes.docs
        const summary: any[] = []

        for (const cycle of activeCycles) {
            // Find holding vault account
            let vaultAccountId = typeof cycle.holding_vault_account === 'object' && cycle.holding_vault_account
                ? cycle.holding_vault_account.id
                : cycle.holding_vault_account;

            if (!vaultAccountId) {
                // Find fallback/default admin account
                const adminAccs = await payload.find({
                    collection: 'accounts',
                    where: { account_type: { equals: 'Corporate' } },
                    limit: 1,
                    overrideAccess: true,
                })
                if (adminAccs.docs.length > 0) {
                    vaultAccountId = adminAccs.docs[0].id
                } else {
                    console.warn(`[Esusu Cycle ${cycle.id}] No vault account or corporate account found. Skipping.`)
                    continue
                }
            }

            // Fetch members in cycle
            const membersRes = await payload.find({
                collection: 'esusu-members',
                where: {
                    cycle: { equals: cycle.id },
                    status: { equals: 'active' },
                },
                limit: 100,
                overrideAccess: true,
            })
            const members = membersRes.docs

            if (members.length === 0) continue

            const contributionAmount = cycle.contribution_amount
            let poolCollected = 0
            const successfulMembers: string[] = []

            // Debit members
            for (const member of members) {
                const memberUserId = member.user_id
                const memberCustomer = typeof member.customer === 'object' && member.customer ? member.customer.id : member.customer

                // Find primary savings account for member
                const accountRes = await payload.find({
                    collection: 'accounts',
                    where: {
                        user_id: { equals: memberUserId },
                        status: { equals: 'active' },
                    },
                    limit: 1,
                    overrideAccess: true,
                })

                const memberAccount = accountRes.docs[0]

                if (memberAccount && memberAccount.balance >= contributionAmount) {
                    // Perform transaction debit
                    const updatedBal = memberAccount.balance - contributionAmount
                    await payload.update({
                        collection: 'accounts',
                        id: memberAccount.id,
                        data: { balance: updatedBal },
                        overrideAccess: true,
                    })

                    // Increment vault account balance
                    const vaultAccount = await payload.findByID({
                        collection: 'accounts',
                        id: vaultAccountId,
                        overrideAccess: true,
                    })
                    const vaultBal = (vaultAccount.balance || 0) + contributionAmount
                    await payload.update({
                        collection: 'accounts',
                        id: vaultAccountId,
                        data: { balance: vaultBal },
                        overrideAccess: true,
                    })

                    // Create debit transaction log
                    const refDebit = `TX_AJO_DR_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
                    await payload.create({
                        collection: 'transactions',
                        data: {
                            reference: refDebit,
                            type: 'debit',
                            amount: contributionAmount,
                            from_account: memberAccount.id,
                            to_account: vaultAccountId,
                            status: 'successful',
                            narration: `Ajo Cycle Contribution: ${cycle.name}`,
                            user_id: memberUserId,
                            customer: memberCustomer,
                            balance_after: updatedBal,
                        },
                        overrideAccess: true,
                    })

                    // Create esusu-contributions record
                    await payload.create({
                        collection: 'esusu-contributions',
                        data: {
                            cycle: cycle.id,
                            member: member.id,
                            customer: memberCustomer,
                            user_id: memberUserId,
                            amount: contributionAmount,
                            status: 'paid',
                        },
                        overrideAccess: true,
                    })

                    poolCollected += contributionAmount
                    successfulMembers.push(memberUserId)
                } else {
                    // Record Delinquency contribution
                    await payload.create({
                        collection: 'esusu-contributions',
                        data: {
                            cycle: cycle.id,
                            member: member.id,
                            customer: memberCustomer,
                            user_id: memberUserId,
                            amount: contributionAmount,
                            status: 'delinquent',
                        },
                        overrideAccess: true,
                    })
                }
            }

            // Payout Pool to recipient
            const currentPayoutIndex = cycle.current_payout_index ?? 0
            const recipientMember = members.find(m => m.payout_order_index === currentPayoutIndex)

            let payoutDistributed = false
            let payoutAmount = 0
            let recipientName = 'Unknown Recipient'

            if (recipientMember && poolCollected > 0) {
                const recipientUserId = recipientMember.user_id
                const recipientCustomer = typeof recipientMember.customer === 'object' && recipientMember.customer ? recipientMember.customer : null
                const recipientCustomerId = recipientCustomer ? recipientCustomer.id : recipientMember.customer
                recipientName = recipientCustomer ? `${recipientCustomer.firstName || ''} ${recipientCustomer.lastName || ''}`.trim() : 'Cooperative Operator'

                // Find recipient savings account
                const repAccRes = await payload.find({
                    collection: 'accounts',
                    where: {
                        user_id: { equals: recipientUserId },
                        status: { equals: 'active' },
                    },
                    limit: 1,
                    overrideAccess: true,
                })

                const recipientAccount = repAccRes.docs[0]
                if (recipientAccount) {
                    const platformFeePercent = cycle.platform_fee_percent ?? 1
                    const platformFee = Math.floor((poolCollected * platformFeePercent) / 100)
                    payoutAmount = poolCollected - platformFee

                    // Credit recipient
                    const newRecipientBal = recipientAccount.balance + payoutAmount
                    await payload.update({
                        collection: 'accounts',
                        id: recipientAccount.id,
                        data: { balance: newRecipientBal },
                        overrideAccess: true,
                    })

                    // Debit vault account
                    const vaultAccount = await payload.findByID({
                        collection: 'accounts',
                        id: vaultAccountId,
                        overrideAccess: true,
                    })
                    const vaultBal = Math.max(0, vaultAccount.balance - poolCollected)
                    await payload.update({
                        collection: 'accounts',
                        id: vaultAccountId,
                        data: { balance: vaultBal },
                        overrideAccess: true,
                    })

                    // Create payout transaction log
                    const refPayout = `TX_AJO_PY_${Math.random().toString(36).substring(2, 12).toUpperCase()}`
                    await payload.create({
                        collection: 'transactions',
                        data: {
                            reference: refPayout,
                            type: 'credit',
                            amount: payoutAmount,
                            from_account: vaultAccountId,
                            to_account: recipientAccount.id,
                            status: 'successful',
                            narration: `Ajo Cycle Payout: Slot ${currentPayoutIndex + 1} of ${cycle.name}`,
                            user_id: recipientUserId,
                            customer: recipientCustomerId,
                            balance_after: newRecipientBal,
                        },
                        overrideAccess: true,
                    })

                    // Create esusu-payouts record
                    await payload.create({
                        collection: 'esusu-payouts',
                        data: {
                            cycle: cycle.id,
                            recipient_member: recipientMember.id,
                            customer: recipientCustomerId,
                            user_id: recipientUserId,
                            amount: payoutAmount,
                            status: 'completed',
                        },
                        overrideAccess: true,
                    })

                    payoutDistributed = true
                }
            }

            // Increment current payout index
            const nextPayoutIndex = (currentPayoutIndex + 1) % (cycle.total_slots || members.length)
            await payload.update({
                collection: 'esusu-cycles',
                id: cycle.id,
                data: {
                    current_payout_index: nextPayoutIndex,
                },
                overrideAccess: true,
            })

            summary.push({
                cycleId: cycle.id,
                cycleName: cycle.name,
                collected: poolCollected,
                payoutTo: recipientName,
                payoutAmount: payoutAmount,
                success: payoutDistributed,
            })
        }

        return NextResponse.json({ success: true, summary })
    } catch (error: any) {
        console.error('Run collection error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
