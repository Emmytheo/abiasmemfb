import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const res = await queryBankSuite(
            `SELECT * FROM public.banksuite_business_invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`,
            [auth.userId]
        )
        return NextResponse.json({ success: true, invoices: res.rows })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const clientName = String(body.client_name || "").trim()
        const clientEmail = String(body.client_email || "").trim() || null
        const description = String(body.description || "").trim() || null
        const amountNaira = Number(body.amount_naira ?? body.amount)

        if (!clientName || !Number.isFinite(amountNaira) || amountNaira <= 0) {
            return NextResponse.json({ error: "Valid client_name and positive amount are required." }, { status: 400 })
        }

        const merchRes = await queryBankSuite(
            `SELECT id FROM public.merchant_profiles WHERE user_id = $1 LIMIT 1`,
            [auth.userId]
        )
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`
        const amountKobo = Math.round(amountNaira * 100)

        const ins = await queryBankSuite(
            `INSERT INTO public.banksuite_business_invoices (
                invoice_number, user_id, merchant_id, client_name, client_email, description,
                amount_kobo, status, due_date
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'unpaid', $8)
             RETURNING *`,
            [
                invoiceNumber,
                auth.userId,
                merchRes.rows[0]?.id || null,
                clientName,
                clientEmail,
                description,
                amountKobo,
                body.due_date || new Date(Date.now() + 14 * 86400000).toISOString(),
            ]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "invoice.created",
            entityType: "business_invoice",
            entityId: ins.rows[0].id,
            amountKobo,
            ipAddress: auth.ipAddress,
        })

        return NextResponse.json({ success: true, invoice: ins.rows[0] }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const { id, status } = body
        if (!id || !["paid", "unpaid", "void"].includes(status)) {
            return NextResponse.json({ error: "Valid invoice id and status ('paid'|'unpaid'|'void') required." }, { status: 400 })
        }

        const upd = await queryBankSuite(
            `UPDATE public.banksuite_business_invoices
             SET status = $1, paid_at = CASE WHEN $1 = 'paid' THEN NOW() ELSE paid_at END, updated_at = NOW()
             WHERE id = $2 AND user_id = $3
             RETURNING *`,
            [status, Number(id), auth.userId]
        )
        if (upd.rows.length === 0) {
            return NextResponse.json({ error: "Invoice not found or forbidden." }, { status: 404 })
        }
        return NextResponse.json({ success: true, invoice: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
