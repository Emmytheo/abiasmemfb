import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { intraBankTransfer } from '@/lib/api/adapters/qore/actions'

export async function POST(req: Request) {
    try {
        const payload = await getPayload({ config: configPromise })

        // Find all active esusu cycles
        const cyclesResult = await payload.find({
            collection: 'esusu-cycles',
            where: { status: { equals: 'active' } },
            overrideAccess: true,
            limit: 100,
        })

        const logs: string[] = []

        for (const cycle of cyclesResult.docs) {
            try {
                const totalSlots = cycle.total_slots || 0
                const currentIndex = cycle.current_payout_index || 0

                if (currentIndex >= totalSlots) {
                    // Mark as completed
                    await payload.update({
                        collection: 'esusu-cycles',
                        id: cycle.id,
                        data: { status: 'completed' },
                        overrideAccess: true,
                    })
                    logs.push(`Cycle "${cycle.name}" completed. Skipping.`)
                    continue
                }

                // Fetch cycle members
                const membersResult = await payload.find({
                    collection: 'esusu-members',
                    where: {
                        and: [
                            { cycle: { equals: cycle.id } },
                            { status: { equals: 'active' } },
                        ]
                    },
                    overrideAccess: true,
                    limit: 100,
                })

                const members = membersResult.docs
                if (members.length === 0) {
                    logs.push(`Cycle "${cycle.name}" has no members. Skipping.`)
                    continue
                }

                // Identify payout recipient for this index
                const recipientMember = members.find((m) => m.payout_order_index === currentIndex)
                if (!recipientMember) {
                    logs.push(`No member slot found for index ${currentIndex} in "${cycle.name}". Skipping.`)
                    continue
                }

                // Find recipient's customer profile and their primary account
                const recipientCustId = typeof recipientMember.customer === 'object' ? recipientMember.customer.id : recipientMember.customer
                const recipientCustomer = await payload.findByID({
                    collection: 'customers',
                    id: recipientCustId,
                    overrideAccess: true,
                })

                if (!recipientCustomer) {
                    logs.push(`Recipient customer profile not found for slot ${currentIndex} in "${cycle.name}". Skipping.`)
                    continue
                }

                // Find recipient primary account
                const recipientAccounts = await payload.find({
                    collection: 'accounts',
                    where: {
                        and: [
                            { user_id: { equals: recipientCustomer.supabase_id } },
                            { status: { equals: 'active' } },
                        ]
                    },
                    overrideAccess: true,
                    limit: 5,
                })

                const primaryAccount = recipientAccounts.docs.find((acc) => acc.is_primary) || recipientAccounts.docs[0]
                if (!primaryAccount) {
                    logs.push(`No active primary account for recipient of slot ${currentIndex} in "${cycle.name}". Skipping.`)
                    continue
                }

                // Get cycle holding vault account
                const vaultAccountId = typeof cycle.holding_vault_account === 'object' ? cycle.holding_vault_account.id : cycle.holding_vault_account
                if (!vaultAccountId) {
                    logs.push(`Holding vault missing for "${cycle.name}". Skipping.`)
                    continue
                }

                const vaultAccount = await payload.findByID({
                    collection: 'accounts',
                    id: vaultAccountId,
                    overrideAccess: true,
                })

                if (!vaultAccount || vaultAccount.balance <= 0) {
                    logs.push(`Vault account empty or not found for "${cycle.name}". Skipping payout.`)
                    continue
                }

                // Perform rotational payout calculation
                const poolBalance = vaultAccount.balance
                const feePercentage = cycle.platform_fee_percent || 1
                const platformFee = Math.round((poolBalance * feePercentage) / 100)
                const payoutAmount = poolBalance - platformFee

                const ref = `ESU_PAY_${Date.now()}`

                // Transfer from vault to recipient primary account
                let qoreSuccess = false
                try {
                    if (vaultAccount.source === 'qore' && primaryAccount.source === 'qore') {
                        await intraBankTransfer({
                            FromAccountNumber: vaultAccount.account_number,
                            ToAccountNumber: primaryAccount.account_number,
                            Amount: String(payoutAmount),
                            Narration: `Esusu Rotational Payout Cycle: ${cycle.name}`,
                            RetrievalReference: ref.slice(0, 12).padEnd(12, '0'),
                        })
                        qoreSuccess = true
                    }
                } catch (err) {
                    console.warn('[Qore Esusu Sync] Qore transfer failed or not configured. Proceeding locally.', err)
                }

                // Update vault account balance to 0
                await payload.update({
                    collection: 'accounts',
                    id: vaultAccount.id,
                    data: { balance: 0 },
                    overrideAccess: true,
                })

                // Credit recipient account balance
                await payload.update({
                    collection: 'accounts',
                    id: primaryAccount.id,
                    data: { balance: primaryAccount.balance + payoutAmount },
                    overrideAccess: true,
                })

                // If platform fee is greater than 0, we can credit bank commission wallet or note it.
                // Write immutable Transaction record for Payout
                const txn = await payload.create({
                    collection: 'transactions',
                    data: {
                        reference: ref,
                        type: 'transfer',
                        amount: payoutAmount,
                        from_account: vaultAccount.id,
                        to_account: primaryAccount.id,
                        status: 'successful',
                        narration: `Esusu Payout Slot Turn ${currentIndex + 1}: ${cycle.name}`,
                        channel: 'workflow',
                        customer: recipientCustomer.id,
                        user_id: recipientCustomer.supabase_id,
                        metadata: {
                            cycle_id: cycle.id,
                            recipient_member_id: recipientMember.id,
                            platform_fee_kobo: platformFee,
                            qore_processed: qoreSuccess,
                        },
                    },
                    overrideAccess: true,
                })

                // Record payout details
                await payload.create({
                    collection: 'esusu-payouts',
                    data: {
                        cycle: cycle.id,
                        recipient_member: recipientMember.id,
                        customer: recipientCustomer.id,
                        user_id: recipientCustomer.supabase_id,
                        amount: payoutAmount,
                        status: 'completed',
                        transaction: txn.id,
                    },
                    overrideAccess: true,
                })

                // Update cycle index
                const nextIndex = currentIndex + 1
                const status = nextIndex >= totalSlots ? 'completed' : 'active'

                await payload.update({
                    collection: 'esusu-cycles',
                    id: cycle.id,
                    data: {
                        current_payout_index: nextIndex,
                        status,
                    },
                    overrideAccess: true,
                })

                logs.push(`Successfully paid out ${payoutAmount / 100} NGN to ${recipientCustomer.firstName} ${recipientCustomer.lastName} for slot index ${currentIndex} in "${cycle.name}".`)
            } catch (err: any) {
                console.error(`Error processing cycle payout for "${cycle.name}":`, err)
                logs.push(`Failed to process cycle "${cycle.name}": ${err.message}`)
            }
        }

        return NextResponse.json({ success: true, processed: logs.length, logs })
    } catch (error: any) {
        console.error('Esusu payout cron error:', error)
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
    }
}
