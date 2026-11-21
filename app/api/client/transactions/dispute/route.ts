import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

/**
 * POST /api/client/transactions/dispute
 * Persists a customer transaction dispute / issue report into BankSuite audit logs
 * with a unique Dispute Ticket Reference for operations & teller review.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await ensureBankSuiteOperationalTables()

        const body = await req.json().catch(() => ({}))
        const transactionId = String(body.transactionId || "").trim()
        const reference = String(body.reference || "").trim()
        const reason = String(body.reason || "").trim()

        if (!reason || reason.length < 5) {
            return NextResponse.json(
                { error: "Please provide a brief description of the issue (at least 5 characters)." },
                { status: 400 }
            )
        }

        // Verify ownership if transactionId is numeric
        let amountKobo: number | undefined
        if (transactionId && !isNaN(Number(transactionId))) {
            const txRes = await queryBankSuite(
                `SELECT id, amount, reference FROM public.transactions WHERE id = $1 AND user_id = $2 LIMIT 1`,
                [Number(transactionId), user.id]
            ).catch(() => ({ rows: [] as any[] }))
            if (txRes.rows[0]) {
                amountKobo = Number(txRes.rows[0].amount || 0)
            }
        }

        const ticketRef = `DSP-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`
        const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined

        await writeBankAuditLog({
            actorId: user.id,
            actorEmail: user.email || "client@banksuite.local",
            actorRole: "customer",
            action: "client.transaction.dispute_opened",
            entityType: "transaction",
            entityId: transactionId || reference || ticketRef,
            amountKobo,
            ipAddress,
            afterState: {
                ticketRef,
                reference,
                reason,
                status: "open",
            },
        })

        return NextResponse.json({
            success: true,
            ticketRef,
            message: `Dispute ticket ${ticketRef} logged for Operations review.`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to log dispute" }, { status: 500 })
    }
}
