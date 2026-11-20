import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const { searchParams } = req.nextUrl
        const actionFilter = searchParams.get("action")?.trim() || ""
        const format = searchParams.get("format") || "json"
        const limit = Math.min(Number(searchParams.get("limit") || "100"), 500)

        const res = await queryBankSuite(
            actionFilter
                ? `SELECT * FROM public.banksuite_audit_logs WHERE action ILIKE $1 OR actor_email ILIKE $1 OR entity_type ILIKE $1 ORDER BY created_at DESC LIMIT $2`
                : `SELECT * FROM public.banksuite_audit_logs ORDER BY created_at DESC LIMIT $1`,
            actionFilter ? [`%${actionFilter}%`, limit] : [limit]
        )

        if (format === "csv") {
            const headers = ["id", "created_at", "actor_email", "actor_role", "action", "entity_type", "entity_id", "amount_naira", "status", "ip_address"]
            const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
            const lines = [
                headers.join(","),
                ...res.rows.map((r) =>
                    [
                        r.id,
                        r.created_at,
                        r.actor_email || r.actor_id,
                        r.actor_role,
                        r.action,
                        r.entity_type,
                        r.entity_id || "",
                        r.amount_kobo != null ? (Number(r.amount_kobo) / 100).toFixed(2) : "",
                        r.status,
                        r.ip_address || "",
                    ]
                        .map(escape)
                        .join(",")
                ),
            ]
            return new NextResponse(lines.join("\n"), {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="banksuite-audit-logs-${new Date().toISOString().slice(0, 10)}.csv"`,
                },
            })
        }

        return NextResponse.json({ success: true, logs: res.rows })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
