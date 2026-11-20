import { NextRequest, NextResponse } from "next/server"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { executeAtomicTransfer } from "@/lib/banking/ledger-engine"

export async function POST(req: NextRequest) {
    try {
        const auth = await requireAuthenticatedUser(req)
        if (auth instanceof NextResponse) return auth

        const body = await req.json().catch(() => ({}))
        const {
            sourceAccountId,
            transferType = "internal",
            destinationAccount,
            destinationBank,
            destinationName = "Beneficiary",
            amount,
            narration = "Fund Transfer",
            idempotencyKey,
            transactionPin,
        } = body

        const amountNaira = Number(amount)
        if (!sourceAccountId || !destinationAccount || !Number.isFinite(amountNaira) || amountNaira <= 0) {
            return NextResponse.json(
                { error: "Valid source account, destination account, and positive amount are required." },
                { status: 400 }
            )
        }

        const headerIdempotency = req.headers.get("x-idempotency-key") || undefined
        const normalizedType =
            transferType === "interbank" || transferType === "international"
                ? transferType
                : "internal"

        const result = await executeAtomicTransfer({
            actorUserId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            isAdmin: auth.isAdmin,
            ipAddress: auth.ipAddress,
            sourceAccountId,
            transferType: normalizedType,
            destinationAccount: String(destinationAccount).trim(),
            destinationBank: destinationBank ? String(destinationBank).trim() : undefined,
            destinationName: String(destinationName || "Beneficiary").trim(),
            amountKobo: Math.round(amountNaira * 100),
            narration: String(narration || "Fund Transfer").trim(),
            channel: "portal",
            idempotencyKey: idempotencyKey || headerIdempotency,
            transactionPin: transactionPin ? String(transactionPin) : undefined,
        })

        return NextResponse.json({
            success: true,
            reference: result.reference,
            transactionId: result.transactionId,
            newBalanceNaira: result.newSourceBalanceKobo / 100,
            feeNaira: result.feeKobo / 100,
            qoreProcessed: result.qoreProcessed,
            idempotentReplay: Boolean(result.idempotentReplay),
        })
    } catch (error: any) {
        const msg = error?.message || "Transfer execution failed"
        const status =
            msg.startsWith("Forbidden:") ? 403 :
            msg.includes("Insufficient") || msg.includes("PIN") || msg.includes("limit") || msg.includes("frozen") || msg.includes("Post-No-Debit") || msg.includes("identical") || msg.includes("must be")
                ? 400
                : 500
        console.error("[POST /api/transfers/execute] Error:", msg)
        return NextResponse.json({ error: msg }, { status })
    }
}
