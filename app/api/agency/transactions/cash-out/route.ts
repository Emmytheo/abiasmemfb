import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import { intraBankTransfer } from "@/lib/api/adapters/qore/actions"

/**
 * POST /api/agency/transactions/cash-out
 * Production double-entry POS cash-out settlement:
 * Requires an active assigned POS terminal AND a valid customer smart card / debit account.
 * Atomically debits the cardholder's linked bank account (amount + fee) and credits the
 * agent's settlement float (amount + 70% agent commission share), booking 30% to bank revenue.
 */
export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const { terminal_id, amount, card_number_masked, card_id, pin_block } = body

        const amountKobo = Math.round(Number(amount || 0))
        if (!terminal_id || !Number.isFinite(amountKobo) || amountKobo < 10000) {
            return NextResponse.json(
                { error: "Valid terminal_id and cash-out amount (minimum ₦100 / 10,000 kobo) are required." },
                { status: 400 }
            )
        }
        if (!pin_block || String(pin_block).length !== 4) {
            return NextResponse.json({ error: "A valid 4-digit card PIN is required." }, { status: 400 })
        }

        // Verify agent profile & assigned terminal
        const termRes = await queryBankSuite(
            `SELECT t.*, c.id AS cust_id
             FROM public.agency_terminals t
             LEFT JOIN public.customers c ON c.id = t.agent_customer_id
             WHERE t.id = $1 LIMIT 1`,
            [Number(terminal_id)]
        )
        const terminal = termRes.rows[0]
        if (!terminal) {
            return NextResponse.json({ error: "POS terminal not found." }, { status: 404 })
        }
        if (!auth.isAdmin && String(terminal.user_id) !== auth.userId) {
            return NextResponse.json(
                { error: "Forbidden: Terminal is not assigned to your agent profile." },
                { status: 403 }
            )
        }
        if (terminal.status !== "active" && terminal.status !== "assigned") {
            return NextResponse.json(
                { error: "POS terminal is currently inactive or suspended." },
                { status: 400 }
            )
        }

        // Resolve real debit smart card from ledger (never print money from thin air)
        const cardRes = await queryBankSuite(
            card_id
                ? `SELECT * FROM public.smart_cards WHERE id = $1 LIMIT 1`
                : `SELECT * FROM public.smart_cards WHERE card_number_masked = $1 LIMIT 1`,
            [card_id ? Number(card_id) : String(card_number_masked || "").trim()]
        )
        const card = cardRes.rows[0]
        if (!card) {
            return NextResponse.json(
                { error: "Card Switch Declined: Card not registered on BankSuite card ledger." },
                { status: 400 }
            )
        }
        if (card.is_frozen || card.status !== "active") {
            return NextResponse.json(
                { error: "Card Switch Declined: Card is frozen or inactive." },
                { status: 400 }
            )
        }
        if (card.pin_hash) {
            const pinHash = crypto.createHash("sha256").update(String(pin_block)).digest("hex")
            if (pinHash !== card.pin_hash) {
                return NextResponse.json(
                    { error: "Card Switch Declined: Invalid Card PIN." },
                    { status: 400 }
                )
            }
        }
        if (Number(card.limit_pos || 0) > 0 && amountKobo > Number(card.limit_pos)) {
            return NextResponse.json(
                {
                    error: `Card Switch Declined: Exceeds daily POS limit of ₦${(Number(card.limit_pos) / 100).toLocaleString()}.`,
                },
                { status: 400 }
            )
        }

        // Resolve agent float account
        const agentAccRes = await queryBankSuite(
            `SELECT id FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1`,
            [terminal.user_id]
        )
        const agentFloatAccountId = agentAccRes.rows[0]?.id ? Number(agentAccRes.rows[0].id) : null
        if (!agentFloatAccountId) {
            return NextResponse.json(
                { error: "No active agent float account found to settle cash-out." },
                { status: 400 }
            )
        }

        const cardholderAccountId = Number(card.account_id)
        if (cardholderAccountId === agentFloatAccountId) {
            return NextResponse.json(
                { error: "Self-cashout on the agent's own settlement account is prohibited." },
                { status: 400 }
            )
        }

        // Commission: 1.5% capped at ₦1,000 (100,000 kobo); 70% agent, 30% bank
        const totalFeeKobo = Math.min(100000, Math.round((amountKobo * 1.5) / 100))
        const agentShareKobo = Math.round(totalFeeKobo * 0.7)
        const bankShareKobo = totalFeeKobo - agentShareKobo
        const totalCardholderDebitKobo = amountKobo + totalFeeKobo
        const ref = `POS_WD_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

        const result = await withBankSuiteTransaction(async (client) => {
            const lockIds = [cardholderAccountId, agentFloatAccountId].sort((a, b) => a - b)
            const locked = await client.query(
                `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status, source
                 FROM public.accounts WHERE id = ANY($1::int[]) ORDER BY id ASC FOR UPDATE`,
                [lockIds]
            )
            const holderAcc = locked.rows.find((r) => Number(r.id) === cardholderAccountId)
            const floatAcc = locked.rows.find((r) => Number(r.id) === agentFloatAccountId)

            if (!holderAcc || holderAcc.status !== "active" || holderAcc.is_frozen || holderAcc.pnd_enabled) {
                throw new Error("BAD_REQUEST:Cardholder funding account is inactive or restricted.")
            }
            const available = Number(holderAcc.balance) - Number(holderAcc.lien_amount || 0)
            if (available < totalCardholderDebitKobo) {
                throw new Error("BAD_REQUEST:Insufficient funds on cardholder account.")
            }
            if (!floatAcc) {
                throw new Error("BAD_REQUEST:Agent settlement account unavailable.")
            }

            let qoreProcessed = false
            if (holderAcc.source === "qore" && floatAcc.source === "qore" && process.env.QORE_SECRET_ID) {
                try {
                    await intraBankTransfer({
                        FromAccountNumber: holderAcc.account_number,
                        ToAccountNumber: floatAcc.account_number,
                        Amount: String(amountKobo + agentShareKobo),
                        Narration: `POS Cash-out ${terminal.serial_number}`,
                        RetrievalReference: ref.replace(/[^A-Z0-9]/gi, "").slice(0, 12).padEnd(12, "0"),
                    })
                    qoreProcessed = true
                } catch (err: any) {
                    if (process.env.QORE_STRICT_SETTLEMENT === "true") {
                        throw new Error(`BAD_REQUEST:Core Settlement Error: ${err.message}`)
                    }
                }
            }

            const newHolderBal = Number(holderAcc.balance) - totalCardholderDebitKobo
            const newFloatBal = Number(floatAcc.balance) + amountKobo + agentShareKobo

            await client.query(
                `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newHolderBal, holderAcc.id]
            )
            await client.query(
                `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newFloatBal, floatAcc.id]
            )

            const txRes = await client.query(
                `INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, to_account_id,
                    status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                    created_at, updated_at
                 ) VALUES ($1, 'credit', $2, 'NGN', $3, $4, 'successful', $5, 'api', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())
                 RETURNING id`,
                [
                    ref,
                    amountKobo,
                    holderAcc.id,
                    floatAcc.id,
                    `POS Cash-out (${card.card_number_masked}) via ${terminal.serial_number}`,
                    newFloatBal,
                    JSON.stringify({
                        terminal_id: terminal.id,
                        serial_number: terminal.serial_number,
                        card_id: card.id,
                        card_number_masked: card.card_number_masked,
                        total_fee_kobo: totalFeeKobo,
                        agent_share_kobo: agentShareKobo,
                        bank_share_kobo: bankShareKobo,
                        qore_processed: qoreProcessed,
                    }),
                    terminal.agent_customer_id,
                    terminal.user_id,
                ]
            )
            const txnId = Number(txRes.rows[0].id)

            const commRes = await client.query(
                `INSERT INTO public.agency_commissions (
                    agent_customer_id, user_id, terminal_id, transaction_id,
                    transaction_amount, total_commission, agent_share, bank_share,
                    status, created_at, updated_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'settled', NOW(), NOW())
                 RETURNING *`,
                [
                    terminal.agent_customer_id,
                    terminal.user_id,
                    terminal.id,
                    txnId,
                    amountKobo,
                    totalFeeKobo,
                    agentShareKobo,
                    bankShareKobo,
                ]
            )

            return {
                commission: commRes.rows[0],
                newFloatBal,
                txnId,
            }
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "agency.pos.cash_out",
            entityType: "agency_terminal",
            entityId: terminal.id,
            amountKobo,
            ipAddress: auth.ipAddress,
            afterState: {
                reference: ref,
                agent_share_kobo: agentShareKobo,
                bank_share_kobo: bankShareKobo,
            },
        })

        return NextResponse.json({
            success: true,
            reference: ref,
            commission: result.commission,
            cashReceivedByClient: amountKobo / 100,
            creditedToAgentFloat: (amountKobo + agentShareKobo) / 100,
            agentFloatBalanceAfter: result.newFloatBal / 100,
        })
    } catch (error: any) {
        const msg = String(error?.message || "POS cash-out failed")
        if (msg.startsWith("BAD_REQUEST:")) {
            return NextResponse.json({ error: msg.slice(12) }, { status: 400 })
        }
        console.error("POS Cashout processing error:", msg)
        return NextResponse.json({ error: msg }, { status: 500 })
    }
}
