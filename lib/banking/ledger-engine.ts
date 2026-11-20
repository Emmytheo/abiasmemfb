import crypto from "crypto"
import {
    ensureBankSuiteOperationalTables,
    queryBankSuite,
    withBankSuiteTransaction,
} from "@/lib/banking/db-pool"
import { intraBankTransfer, interBankTransfer } from "@/lib/api/adapters/qore/actions"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"

export function hashTransactionPin(pin: string): { hash: string; salt: string } {
    const salt = crypto.randomBytes(16).toString("hex")
    const hash = crypto.scryptSync(pin, salt, 64).toString("hex")
    return { hash, salt }
}

export function verifyTransactionPin(pin: string, hash: string, salt: string): boolean {
    if (!pin || !hash || !salt) return false
    const derived = crypto.scryptSync(pin, salt, 64)
    const expected = Buffer.from(hash, "hex")
    if (derived.length !== expected.length) return false
    return crypto.timingSafeEqual(derived, expected)
}

export interface AuditLogInput {
    actorId: string
    actorEmail?: string
    actorRole: string
    action: string
    entityType: string
    entityId?: string | number | null
    amountKobo?: number | null
    status?: "success" | "failed" | "queued" | "rejected"
    ipAddress?: string
    beforeState?: unknown
    afterState?: unknown
    metadata?: Record<string, unknown>
}

export async function writeBankAuditLog(input: AuditLogInput): Promise<void> {
    try {
        await ensureBankSuiteOperationalTables()
        await queryBankSuite(
            `
            INSERT INTO public.banksuite_audit_logs (
                actor_id, actor_email, actor_role, action, entity_type, entity_id,
                amount_kobo, status, ip_address, before_state, after_state, metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12::jsonb)
            `,
            [
                input.actorId,
                input.actorEmail || null,
                input.actorRole,
                input.action,
                input.entityType,
                input.entityId != null ? String(input.entityId) : null,
                input.amountKobo != null ? Math.round(input.amountKobo) : null,
                input.status || "success",
                input.ipAddress || null,
                input.beforeState !== undefined ? JSON.stringify(input.beforeState) : null,
                input.afterState !== undefined ? JSON.stringify(input.afterState) : null,
                JSON.stringify(input.metadata || {}),
            ]
        )
    } catch (err: any) {
        console.error("[BankSuite AuditLog] Failed to record audit entry:", err.message)
    }
}

export interface AtomicTransferParams {
    actorUserId: string
    actorEmail: string
    actorRole: string
    isAdmin: boolean
    ipAddress?: string
    sourceAccountId: number | string
    transferType: "internal" | "interbank" | "international"
    destinationAccount: string
    destinationBank?: string
    destinationName?: string
    amountKobo: number
    feeKobo?: number
    narration?: string
    channel?: "portal" | "api" | "workflow" | "admin" | "ussd"
    idempotencyKey?: string
    transactionPin?: string
    metadata?: Record<string, unknown>
}

export interface AtomicTransferResult {
    reference: string
    transactionId: number
    sourceAccountNumber: string
    newSourceBalanceKobo: number
    destinationAccountNumber: string
    destinationCreditedLocally: boolean
    feeKobo: number
    qoreProcessed: boolean
    idempotentReplay?: boolean
}

export async function executeAtomicTransfer(
    params: AtomicTransferParams
): Promise<AtomicTransferResult> {
    await ensureBankSuiteOperationalTables()

    const amountKobo = Math.round(Number(params.amountKobo))
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
        throw new Error("Transfer amount must be greater than zero.")
    }

    const defaultFeeKobo = params.transferType === "internal" ? 0 : 1075
    const feeKobo = params.feeKobo !== undefined ? Math.max(0, Math.round(params.feeKobo)) : defaultFeeKobo
    const totalDebitKobo = amountKobo + feeKobo
    const destAccountClean = String(params.destinationAccount || "").trim()
    if (!destAccountClean) {
        throw new Error("Destination account number is required.")
    }

    const { profile: activeBank } = await getServerBankProfile()
    const bankCode = params.transferType === "internal"
        ? activeBank.internalBankCode || activeBank.shortName
        : String(params.destinationBank || "EXT").trim()

    // Check idempotency key first
    const ref =
        params.idempotencyKey?.trim() ||
        `TRF_${Date.now()}_${crypto.randomBytes(4).toString("hex").toUpperCase()}`

    if (params.idempotencyKey?.trim()) {
        const existingTx = await queryBankSuite(
            `SELECT id, reference, balance_after, metadata FROM public.transactions WHERE reference = $1 LIMIT 1`,
            [ref]
        )
        if (existingTx.rows.length > 0) {
            const tx = existingTx.rows[0]
            return {
                reference: tx.reference,
                transactionId: Number(tx.id),
                sourceAccountNumber: String(tx.metadata?.source_account || ""),
                newSourceBalanceKobo: Number(tx.balance_after || 0),
                destinationAccountNumber: destAccountClean,
                destinationCreditedLocally: Boolean(tx.metadata?.destination_credited_locally),
                feeKobo,
                qoreProcessed: Boolean(tx.metadata?.qore_processed),
                idempotentReplay: true,
            }
        }
    }

    // Verify daily limit & optional transaction PIN for non-admin retail callers
    if (!params.isAdmin) {
        const prefRes = await queryBankSuite(
            `SELECT daily_transfer_limit_kobo, transaction_pin_hash, transaction_pin_salt
             FROM public.banksuite_user_preferences WHERE user_id = $1 LIMIT 1`,
            [params.actorUserId]
        )
        const prefs = prefRes.rows[0]
        if (prefs?.transaction_pin_hash && prefs?.transaction_pin_salt) {
            if (!params.transactionPin) {
                throw new Error("Transaction PIN is required to authorize this transfer.")
            }
            if (!verifyTransactionPin(params.transactionPin, prefs.transaction_pin_hash, prefs.transaction_pin_salt)) {
                await writeBankAuditLog({
                    actorId: params.actorUserId,
                    actorEmail: params.actorEmail,
                    actorRole: params.actorRole,
                    action: "transfer.pin_failed",
                    entityType: "account",
                    entityId: params.sourceAccountId,
                    amountKobo,
                    status: "failed",
                    ipAddress: params.ipAddress,
                })
                throw new Error("Invalid transaction PIN.")
            }
        }

        const dailyLimitKobo = Number(prefs?.daily_transfer_limit_kobo || 50000000) // default ₦500,000
        const todaySpendRes = await queryBankSuite(
            `SELECT COALESCE(SUM(amount), 0)::bigint AS spent
             FROM public.transactions
             WHERE user_id = $1
               AND type IN ('transfer', 'debit')
               AND status = 'successful'
               AND created_at >= date_trunc('day', NOW())`,
            [params.actorUserId]
        )
        const spentTodayKobo = Number(todaySpendRes.rows[0]?.spent || 0)
        if (spentTodayKobo + amountKobo > dailyLimitKobo) {
            throw new Error(
                `Daily transfer limit exceeded. Limit: ₦${(dailyLimitKobo / 100).toLocaleString()}, Already spent today: ₦${(spentTodayKobo / 100).toLocaleString()}.`
            )
        }
    }

    // Pre-fetch source & destination account IDs so we can lock in ascending ID order (deadlock-free)
    const srcLookup = await queryBankSuite(
        `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status, source
         FROM public.accounts WHERE id = $1 LIMIT 1`,
        [Number(params.sourceAccountId)]
    )
    const srcPreview = srcLookup.rows[0]
    if (!srcPreview) {
        throw new Error("Source account not found.")
    }

    // STRICT OWNERSHIP CHECK (prevents cross-user IDOR account draining)
    if (!params.isAdmin && String(srcPreview.user_id) !== String(params.actorUserId)) {
        await writeBankAuditLog({
            actorId: params.actorUserId,
            actorEmail: params.actorEmail,
            actorRole: params.actorRole,
            action: "transfer.idor_blocked",
            entityType: "account",
            entityId: srcPreview.id,
            amountKobo,
            status: "rejected",
            ipAddress: params.ipAddress,
            metadata: { attempted_account: srcPreview.account_number },
        })
        throw new Error("Forbidden: You do not own the selected source account.")
    }

    if (srcPreview.account_number === destAccountClean && params.transferType === "internal") {
        throw new Error("Source and destination accounts cannot be identical.")
    }

    let destPreview: any = null
    if (params.transferType === "internal") {
        const destLookup = await queryBankSuite(
            `SELECT id, user_id, customer_id, account_number, status, source
             FROM public.accounts WHERE account_number = $1 LIMIT 1`,
            [destAccountClean]
        )
        destPreview = destLookup.rows[0] || null
    }

    // Call Qore core switch BEFORE committing local debit if Qore-backed & strict settlement enabled
    let qoreProcessed = false
    const strictQore = process.env.QORE_STRICT_SETTLEMENT === "true"
    if (srcPreview.source === "qore" && process.env.NEXT_PUBLIC_USE_QORE === "true" && process.env.QORE_SECRET_ID) {
        try {
            const rrn = ref.replace(/[^A-Z0-9]/gi, "").slice(0, 12).padEnd(12, "0")
            if (params.transferType === "internal") {
                await intraBankTransfer({
                    FromAccountNumber: srcPreview.account_number,
                    ToAccountNumber: destAccountClean,
                    Amount: String(amountKobo),
                    Narration: params.narration || `Transfer to ${params.destinationName || destAccountClean}`,
                    RetrievalReference: rrn,
                })
            } else {
                await interBankTransfer({
                    FromAccountNumber: srcPreview.account_number,
                    ToAccountNumber: destAccountClean,
                    Amount: String(amountKobo),
                    DestinationBankCode: bankCode,
                    Narration: params.narration || `Transfer to ${params.destinationName || destAccountClean}`,
                    RetrievalReference: rrn,
                    PayerName: `${activeBank.shortName} CUSTOMER`,
                })
            }
            qoreProcessed = true
        } catch (qoreErr: any) {
            if (strictQore) {
                throw new Error(`Core banking switch declined transfer: ${qoreErr.message}`)
            }
            console.warn("[Ledger Engine] Qore mirror warning (non-strict staging mode):", qoreErr.message)
        }
    }

    // ATOMIC SERIALIZED ROW-LOCK TRANSACTION
    const txResult = await withBankSuiteTransaction(async (client) => {
        const lockIds = destPreview
            ? [Number(srcPreview.id), Number(destPreview.id)].sort((a, b) => a - b)
            : [Number(srcPreview.id)]

        const lockedRows = await client.query(
            `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status, source
             FROM public.accounts
             WHERE id = ANY($1::int[])
             ORDER BY id ASC
             FOR UPDATE`,
            [lockIds]
        )

        const lockedSrc = lockedRows.rows.find((r) => Number(r.id) === Number(srcPreview.id))
        const lockedDest = destPreview
            ? lockedRows.rows.find((r) => Number(r.id) === Number(destPreview.id))
            : null

        if (!lockedSrc || lockedSrc.status !== "active") {
            throw new Error("Source account is not active.")
        }
        if (lockedSrc.is_frozen) {
            throw new Error("Source account is frozen. Contact support or branch admin.")
        }
        if (lockedSrc.pnd_enabled) {
            throw new Error("Post-No-Debit (PND) restriction is active on this account.")
        }

        const currentBal = Number(lockedSrc.balance || 0)
        const lienBal = Number(lockedSrc.lien_amount || 0)
        const availableBal = Math.max(0, currentBal - lienBal)
        if (availableBal < totalDebitKobo) {
            throw new Error(
                `Insufficient available balance. Available: ₦${(availableBal / 100).toLocaleString()}, Required: ₦${(totalDebitKobo / 100).toLocaleString()}.`
            )
        }

        const newSourceBalanceKobo = currentBal - totalDebitKobo
        await client.query(
            `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
            [newSourceBalanceKobo, lockedSrc.id]
        )

        let destinationCreditedLocally = false
        let newDestBalanceKobo: number | null = null
        if (lockedDest && lockedDest.status === "active") {
            newDestBalanceKobo = Number(lockedDest.balance || 0) + amountKobo
            await client.query(
                `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newDestBalanceKobo, lockedDest.id]
            )
            destinationCreditedLocally = true
        }

        const narrationText = `${params.narration || "Transfer"} to ${params.destinationName || destAccountClean} (${destAccountClean} · ${params.transferType === "internal" ? activeBank.shortName : bankCode})`

        const insertedTx = await client.query(
            `
            INSERT INTO public.transactions (
                reference, type, amount, currency, from_account_id, to_account_id,
                status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                created_at, updated_at
            ) VALUES (
                $1, 'transfer', $2, 'NGN', $3, $4,
                'successful', $5, $6, $7, NOW(), $8::jsonb, $9, $10,
                NOW(), NOW()
            ) RETURNING id
            `,
            [
                ref,
                amountKobo,
                lockedSrc.id,
                lockedDest ? lockedDest.id : null,
                narrationText,
                params.channel || "portal",
                newSourceBalanceKobo,
                JSON.stringify({
                    transfer_type: params.transferType,
                    source_account: lockedSrc.account_number,
                    destination_account: destAccountClean,
                    destination_bank: bankCode,
                    destination_name: params.destinationName || "Beneficiary",
                    fee_kobo: feeKobo,
                    fee_naira: feeKobo / 100,
                    qore_processed: qoreProcessed,
                    destination_credited_locally: destinationCreditedLocally,
                    bank_profile_id: activeBank.id,
                    ...(params.metadata || {}),
                }),
                lockedSrc.customer_id || null,
                lockedSrc.user_id,
            ]
        )

        // Write corresponding credit leg for internal beneficiary ledger auditability
        if (lockedDest && destinationCreditedLocally && newDestBalanceKobo !== null) {
            await client.query(
                `
                INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, to_account_id,
                    status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                    created_at, updated_at
                ) VALUES (
                    $1, 'credit', $2, 'NGN', $3, $4,
                    'successful', $5, $6, $7, NOW(), $8::jsonb, $9, $10,
                    NOW(), NOW()
                )
                `,
                [
                    `${ref}_CR`,
                    amountKobo,
                    lockedSrc.id,
                    lockedDest.id,
                    `Inbound Transfer from ${lockedSrc.account_number}: ${params.narration || "Fund Transfer"}`,
                    params.channel || "portal",
                    newDestBalanceKobo,
                    JSON.stringify({
                        parent_reference: ref,
                        source_account: lockedSrc.account_number,
                        bank_profile_id: activeBank.id,
                    }),
                    lockedDest.customer_id || null,
                    lockedDest.user_id,
                ]
            )
        }

        // Write explicit fee ledger line when applicable
        if (feeKobo > 0) {
            await client.query(
                `
                INSERT INTO public.transactions (
                    reference, type, amount, currency, from_account_id, to_account_id,
                    status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                    created_at, updated_at
                ) VALUES (
                    $1, 'fee', $2, 'NGN', $3, NULL,
                    'successful', $4, $5, $6, NOW(), $7::jsonb, $8, $9,
                    NOW(), NOW()
                )
                `,
                [
                    `${ref}_FEE`,
                    feeKobo,
                    lockedSrc.id,
                    `NIP Transfer Fee (${ref})`,
                    params.channel || "portal",
                    newSourceBalanceKobo,
                    JSON.stringify({ parent_reference: ref, fee_type: "interbank_nip" }),
                    lockedSrc.customer_id || null,
                    lockedSrc.user_id,
                ]
            )
        }

        return {
            reference: ref,
            transactionId: Number(insertedTx.rows[0].id),
            sourceAccountNumber: lockedSrc.account_number,
            newSourceBalanceKobo,
            destinationAccountNumber: destAccountClean,
            destinationCreditedLocally,
            feeKobo,
            qoreProcessed,
        }
    })

    await writeBankAuditLog({
        actorId: params.actorUserId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: `transfer.${params.transferType}`,
        entityType: "transaction",
        entityId: txResult.transactionId,
        amountKobo,
        status: "success",
        ipAddress: params.ipAddress,
        afterState: {
            reference: txResult.reference,
            new_balance_kobo: txResult.newSourceBalanceKobo,
            destination_account: destAccountClean,
            fee_kobo: feeKobo,
        },
    })

    return txResult
}

/**
 * Atomic Teller Cash-In (credit) or Cash-Out (debit) posted by an authenticated Bank Administrator.
 */
export async function executeTellerPosting(params: {
    actorId: string
    actorEmail: string
    actorRole: string
    ipAddress?: string
    accountId: number
    direction: "credit" | "debit"
    amountKobo: number
    narration: string
    reference?: string
    channel?: "admin" | "portal" | "api" | "workflow"
    metadata?: Record<string, unknown>
}) {
    await ensureBankSuiteOperationalTables()
    const amountKobo = Math.round(Number(params.amountKobo))
    if (!Number.isFinite(amountKobo) || amountKobo <= 0) {
        throw new Error("Posting amount must be greater than zero.")
    }

    const ref =
        params.reference?.trim() ||
        `TLR_${params.direction === "credit" ? "CR" : "DR"}_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    const result = await withBankSuiteTransaction(async (client) => {
        const res = await client.query(
            `SELECT id, user_id, customer_id, account_number, balance, lien_amount, is_frozen, pnd_enabled, status
             FROM public.accounts WHERE id = $1 FOR UPDATE`,
            [params.accountId]
        )
        const acc = res.rows[0]
        if (!acc) throw new Error("Target account not found.")
        if (acc.status !== "active") throw new Error("Target account is not active.")

        const prevBalance = Number(acc.balance || 0)
        const lien = Number(acc.lien_amount || 0)
        let nextBalance = prevBalance

        if (params.direction === "debit") {
            if (acc.is_frozen) throw new Error("Account is frozen.")
            if (acc.pnd_enabled) throw new Error("Account has Post-No-Debit restriction.")
            if (prevBalance - lien < amountKobo) {
                throw new Error(
                    `Insufficient available balance. Available: ₦${((prevBalance - lien) / 100).toLocaleString()}`
                )
            }
            nextBalance = prevBalance - amountKobo
        } else {
            nextBalance = prevBalance + amountKobo
        }

        await client.query(
            `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
            [nextBalance, acc.id]
        )

        const txInsert = await client.query(
            `
            INSERT INTO public.transactions (
                reference, type, amount, currency, from_account_id, to_account_id,
                status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                created_at, updated_at
            ) VALUES (
                $1, $2, $3, 'NGN', $4, $5,
                'successful', $6, $7, $8, NOW(), $9::jsonb, $10, $11,
                NOW(), NOW()
            ) RETURNING id
            `,
            [
                ref,
                params.direction,
                amountKobo,
                params.direction === "debit" ? acc.id : null,
                params.direction === "credit" ? acc.id : null,
                params.narration || `Teller ${params.direction}`,
                params.channel || "admin",
                nextBalance,
                JSON.stringify({
                    posted_by: params.actorEmail,
                    ...(params.metadata || {}),
                }),
                acc.customer_id || null,
                acc.user_id,
            ]
        )

        return {
            transactionId: Number(txInsert.rows[0].id),
            reference: ref,
            accountId: acc.id,
            accountNumber: acc.account_number,
            previousBalanceKobo: prevBalance,
            newBalanceKobo: nextBalance,
        }
    })

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: params.actorRole,
        action: `teller.${params.direction}`,
        entityType: "account",
        entityId: result.accountId,
        amountKobo,
        status: "success",
        ipAddress: params.ipAddress,
        beforeState: { balance_kobo: result.previousBalanceKobo },
        afterState: { balance_kobo: result.newBalanceKobo, reference: result.reference },
        metadata: { narration: params.narration, ...(params.metadata || {}) },
    })

    return result
}
