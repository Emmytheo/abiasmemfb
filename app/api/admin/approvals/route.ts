import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { executeTellerPosting, writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const status = req.nextUrl.searchParams.get("status")
        const res = await queryBankSuite(
            status && status !== "all"
                ? `SELECT * FROM public.banksuite_approval_queue WHERE status = $1 ORDER BY created_at DESC LIMIT 100`
                : `SELECT * FROM public.banksuite_approval_queue ORDER BY created_at DESC LIMIT 100`,
            status && status !== "all" ? [status] : []
        )
        return NextResponse.json({ success: true, approvals: res.rows })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const { id, decision, notes = "" } = body

        if (!id || !["approve", "reject"].includes(decision)) {
            return NextResponse.json({ error: "id and decision ('approve'|'reject') are required" }, { status: 400 })
        }

        const itemRes = await queryBankSuite(
            `SELECT * FROM public.banksuite_approval_queue WHERE id = $1 LIMIT 1`,
            [Number(id)]
        )
        const item = itemRes.rows[0]
        if (!item) return NextResponse.json({ error: "Approval request not found" }, { status: 404 })
        if (item.status !== "pending") {
            return NextResponse.json({ error: `Request is already ${item.status}` }, { status: 400 })
        }

        if (decision === "reject") {
            const upd = await queryBankSuite(
                `
                UPDATE public.banksuite_approval_queue
                SET status = 'rejected', reviewed_by_id = $1, reviewed_by_email = $2,
                    review_notes = $3, reviewed_at = NOW(), updated_at = NOW()
                WHERE id = $4 RETURNING *
                `,
                [auth.userId, auth.email, notes, item.id]
            )
            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                action: "approval.rejected",
                entityType: "approval_queue",
                entityId: item.id,
                amountKobo: Number(item.amount_kobo || 0),
                status: "rejected",
                ipAddress: auth.ipAddress,
                metadata: { notes },
            })
            return NextResponse.json({ success: true, approval: upd.rows[0] })
        }

        // Execute approved payload
        let executionResult: any = null
        const p = item.payload || {}
        if (item.request_type === "teller_deposit" || item.request_type === "teller_withdrawal") {
            executionResult = await executeTellerPosting({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                ipAddress: auth.ipAddress,
                accountId: Number(p.account_id),
                direction: p.direction === "debit" ? "debit" : "credit",
                amountKobo: Number(p.amount_kobo || item.amount_kobo),
                narration: `${p.narration || item.title} (Approved #${item.id})`,
                metadata: { approval_id: item.id, maker_email: item.requested_by_email },
            })
        }

        const upd = await queryBankSuite(
            `
            UPDATE public.banksuite_approval_queue
            SET status = 'approved', reviewed_by_id = $1, reviewed_by_email = $2,
                review_notes = $3, reviewed_at = NOW(), updated_at = NOW()
            WHERE id = $4 RETURNING *
            `,
            [auth.userId, auth.email, notes, item.id]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "approval.approved",
            entityType: "approval_queue",
            entityId: item.id,
            amountKobo: Number(item.amount_kobo || 0),
            ipAddress: auth.ipAddress,
            afterState: { executionResult },
        })

        return NextResponse.json({ success: true, approval: upd.rows[0], executionResult })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Approval action failed" }, { status: 400 })
    }
}
