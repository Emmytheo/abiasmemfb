import { NextRequest, NextResponse } from "next/server"
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
            `SELECT * FROM public.banksuite_merchant_team WHERE owner_user_id = $1 ORDER BY created_at DESC`,
            [auth.userId]
        )
        return NextResponse.json({ success: true, members: res.rows })
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
        const email = String(body.email || "").trim().toLowerCase()
        const fullName = String(body.full_name || email.split("@")[0] || "Team Member").trim()
        const role = String(body.role || "Cashier").trim()

        if (!email || !email.includes("@")) {
            return NextResponse.json({ error: "Valid email address is required." }, { status: 400 })
        }

        const merchRes = await queryBankSuite(
            `SELECT id FROM public.merchant_profiles WHERE user_id = $1 LIMIT 1`,
            [auth.userId]
        )

        const ins = await queryBankSuite(
            `INSERT INTO public.banksuite_merchant_team (owner_user_id, merchant_id, full_name, email, role, status, invited_by_email)
             VALUES ($1, $2, $3, $4, $5, 'Pending', $6)
             ON CONFLICT (owner_user_id, email)
             DO UPDATE SET full_name = EXCLUDED.full_name, role = EXCLUDED.role, status = 'Pending', updated_at = NOW()
             RETURNING *`,
            [auth.userId, merchRes.rows[0]?.id || null, fullName, email, role, auth.email]
        )

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "merchant.team.invited",
            entityType: "merchant_team",
            entityId: ins.rows[0].id,
            ipAddress: auth.ipAddress,
            afterState: { email, role },
        })

        return NextResponse.json({ success: true, member: ins.rows[0] }, { status: 201 })
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
        const { id, role, status } = body
        if (!id) return NextResponse.json({ error: "Member id is required" }, { status: 400 })

        const upd = await queryBankSuite(
            `UPDATE public.banksuite_merchant_team
             SET role = COALESCE($1, role), status = COALESCE($2, status), updated_at = NOW()
             WHERE id = $3 AND owner_user_id = $4 RETURNING *`,
            [role || null, status || null, Number(id), auth.userId]
        )
        if (upd.rows.length === 0) return NextResponse.json({ error: "Team member not found" }, { status: 404 })
        return NextResponse.json({ success: true, member: upd.rows[0] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}

export async function DELETE(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const id = req.nextUrl.searchParams.get("id")
        if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 })

        await queryBankSuite(
            `DELETE FROM public.banksuite_merchant_team WHERE id = $1 AND owner_user_id = $2`,
            [Number(id), auth.userId]
        )
        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 })
    }
}
