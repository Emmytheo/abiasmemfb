import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { executeTellerPosting, writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

const MAKER_CHECKER_THRESHOLD_KOBO = 500000000 // ₦5,000,000 triggers dual approval queue unless forced

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [accountsRes, fundingRes] = await Promise.all([
            queryBankSuite(`
                SELECT a.id, a.account_number, a.account_type, a.balance, a.lien_amount,
                       a.is_frozen, a.pnd_enabled, a.status, a.source, a.user_id,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, a.user_id) AS holder_name,
                       c.email AS holder_email, c.kyc_status
                FROM public.accounts a
                LEFT JOIN public.customers c ON c.id = a.customer_id
                ORDER BY a.created_at DESC
                LIMIT 150
            `),
            queryBankSuite(`
                SELECT f.*, a.account_type,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, f.user_id) AS holder_name
                FROM public.banksuite_funding_requests f
                LEFT JOIN public.accounts a ON a.id = f.account_id
                LEFT JOIN public.customers c ON c.id = a.customer_id
                ORDER BY f.created_at DESC
                LIMIT 50
            `),
        ])

        return NextResponse.json({
            success: true,
            accounts: accountsRes.rows,
            fundingRequests: fundingRes.rows,
            makerCheckerThresholdNaira: MAKER_CHECKER_THRESHOLD_KOBO / 100,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const { action } = body

        // 1. Teller Cash-In / Cash-Out Posting
        if (action === "deposit" || action === "withdrawal") {
            const accountId = Number(body.account_id)
            const amountNaira = Number(body.amount_naira)
            const narration = String(body.narration || "").trim() || `Teller ${action}`
            const queueForApproval = Boolean(body.queue_for_approval)

            if (!accountId || !Number.isFinite(amountNaira) || amountNaira <= 0) {
                return NextResponse.json(
                    { error: "Valid account_id and positive amount_naira are required." },
                    { status: 400 }
                )
            }
            const amountKobo = Math.round(amountNaira * 100)

            // Queue into Maker-Checker if exceeds threshold and not explicitly bypassing
            if (queueForApproval || (amountKobo >= MAKER_CHECKER_THRESHOLD_KOBO && !body.bypass_maker_checker)) {
                const queued = await queryBankSuite(
                    `
                    INSERT INTO public.banksuite_approval_queue (
                        request_type, title, description, amount_kobo, payload,
                        status, requested_by_id, requested_by_email
                    ) VALUES ($1, $2, $3, $4, $5::jsonb, 'pending', $6, $7)
                    RETURNING *
                    `,
                    [
                        `teller_${action}`,
                        `Teller ${action === "deposit" ? "Cash-In" : "Cash-Out"} · ₦${amountNaira.toLocaleString()}`,
                        narration,
                        amountKobo,
                        JSON.stringify({
                            account_id: accountId,
                            direction: action === "deposit" ? "credit" : "debit",
                            amount_kobo: amountKobo,
                            narration,
                        }),
                        auth.userId,
                        auth.email,
                    ]
                )
                await writeBankAuditLog({
                    actorId: auth.userId,
                    actorEmail: auth.email,
                    actorRole: auth.role,
                    action: `teller.${action}.queued`,
                    entityType: "approval_queue",
                    entityId: queued.rows[0].id,
                    amountKobo,
                    status: "queued",
                    ipAddress: auth.ipAddress,
                })
                return NextResponse.json({
                    success: true,
                    queued: true,
                    approval: queued.rows[0],
                    message: "Queued for Maker-Checker dual authorization.",
                })
            }

            const posting = await executeTellerPosting({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                ipAddress: auth.ipAddress,
                accountId,
                direction: action === "deposit" ? "credit" : "debit",
                amountKobo,
                narration,
            })

            return NextResponse.json({ success: true, queued: false, posting })
        }

        // 2. Account Compliance Controls (Freeze / PND / Lien)
        if (action === "update_controls") {
            const accountId = Number(body.account_id)
            if (!accountId) return NextResponse.json({ error: "account_id is required" }, { status: 400 })

            const beforeRes = await queryBankSuite(
                `SELECT id, account_number, is_frozen, pnd_enabled, lien_amount, status FROM public.accounts WHERE id = $1`,
                [accountId]
            )
            const before = beforeRes.rows[0]
            if (!before) return NextResponse.json({ error: "Account not found" }, { status: 404 })

            const isFrozen = body.is_frozen !== undefined ? Boolean(body.is_frozen) : before.is_frozen
            const pndEnabled = body.pnd_enabled !== undefined ? Boolean(body.pnd_enabled) : before.pnd_enabled
            const lienKobo =
                body.lien_naira !== undefined
                    ? Math.max(0, Math.round(Number(body.lien_naira) * 100))
                    : Number(before.lien_amount || 0)
            const nextStatus = body.status || (isFrozen ? "frozen" : "active")

            const upd = await queryBankSuite(
                `
                UPDATE public.accounts
                SET is_frozen = $1, pnd_enabled = $2, lien_amount = $3, status = $4, updated_at = NOW()
                WHERE id = $5
                RETURNING *
                `,
                [isFrozen, pndEnabled, lienKobo, nextStatus, accountId]
            )

            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                action: "account.controls.updated",
                entityType: "account",
                entityId: accountId,
                ipAddress: auth.ipAddress,
                beforeState: before,
                afterState: { is_frozen: isFrozen, pnd_enabled: pndEnabled, lien_amount: lienKobo, status: nextStatus },
            })

            return NextResponse.json({ success: true, account: upd.rows[0] })
        }

        // 3. Approve or Reject a Pending Client Funding Request
        if (action === "approve_funding" || action === "reject_funding") {
            const requestId = Number(body.request_id)
            if (!requestId) return NextResponse.json({ error: "request_id is required" }, { status: 400 })

            const reqRes = await queryBankSuite(
                `SELECT * FROM public.banksuite_funding_requests WHERE id = $1`,
                [requestId]
            )
            const fundReq = reqRes.rows[0]
            if (!fundReq) return NextResponse.json({ error: "Funding request not found" }, { status: 404 })
            if (fundReq.status !== "pending") {
                return NextResponse.json({ error: `Funding request already ${fundReq.status}` }, { status: 400 })
            }

            if (action === "reject_funding") {
                await queryBankSuite(
                    `UPDATE public.banksuite_funding_requests SET status = 'rejected', verified_by_email = $1, verified_at = NOW() WHERE id = $2`,
                    [auth.email, requestId]
                )
                await writeBankAuditLog({
                    actorId: auth.userId,
                    actorEmail: auth.email,
                    actorRole: auth.role,
                    action: "funding.request.rejected",
                    entityType: "funding_request",
                    entityId: requestId,
                    amountKobo: Number(fundReq.amount_kobo),
                    ipAddress: auth.ipAddress,
                })
                return NextResponse.json({ success: true, status: "rejected" })
            }

            const posting = await executeTellerPosting({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                ipAddress: auth.ipAddress,
                accountId: Number(fundReq.account_id),
                direction: "credit",
                amountKobo: Number(fundReq.amount_kobo),
                narration: `Verified Inbound Funding (${fundReq.method.toUpperCase()} · ${fundReq.reference})`,
                reference: fundReq.reference,
                metadata: { funding_request_id: requestId, method: fundReq.method },
            })

            await queryBankSuite(
                `UPDATE public.banksuite_funding_requests SET status = 'completed', verified_by_email = $1, verified_at = NOW() WHERE id = $2`,
                [auth.email, requestId]
            )

            return NextResponse.json({ success: true, status: "completed", posting })
        }

        return NextResponse.json({ error: "Unsupported teller action" }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Teller operation failed" }, { status: 400 })
    }
}
