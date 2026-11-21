import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"
import {
    inspectSubLedgerVariance,
    runBankSuiteEodBatch,
    syncGlSubLedgersWithCore,
} from "@/lib/banking/eod-engine"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [variance, runsRes, tbRes] = await Promise.all([
            inspectSubLedgerVariance(),
            queryBankSuite(`SELECT * FROM public.banksuite_eod_runs ORDER BY created_at DESC LIMIT 20`),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total_entries,
                    COALESCE(SUM(CASE WHEN side = 'debit' THEN amount_kobo ELSE 0 END), 0)::bigint AS total_dr_kobo,
                    COALESCE(SUM(CASE WHEN side = 'credit' THEN amount_kobo ELSE 0 END), 0)::bigint AS total_cr_kobo
                FROM public.banksuite_gl_entries
            `),
        ])

        const tb = tbRes.rows[0] || {}
        return NextResponse.json({
            success: true,
            variance,
            runs: runsRes.rows,
            trialBalance: {
                totalEntries: Number(tb.total_entries || 0),
                totalDrKobo: Number(tb.total_dr_kobo || 0),
                totalCrKobo: Number(tb.total_cr_kobo || 0),
                balanced: Number(tb.total_dr_kobo || 0) === Number(tb.total_cr_kobo || 0),
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to load EOD status" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const body = await req.json().catch(() => ({}))
        const action = String(body.action || "run_eod")

        if (action === "sync_gl") {
            const sync = await syncGlSubLedgersWithCore({
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({
                success: true,
                action: "sync_gl",
                ...sync,
                message:
                    sync.postedJournals.length > 0
                        ? `Synchronized ${sync.postedJournals.length} GL control account(s) (₦${(sync.totalSyncedKobo / 100).toLocaleString()}).`
                        : "General Ledger is already 100% synchronized with live sub-ledgers.",
            })
        }

        const result = await runBankSuiteEodBatch({
            actorId: auth.userId,
            actorEmail: auth.email,
            ipAddress: auth.ipAddress,
        })

        return NextResponse.json({
            success: true,
            action: "run_eod",
            ...result,
            message: `End-of-Day batch ${result.run.run_ref} completed. Trial Balance ${result.run.trial_balance_balanced ? "BALANCED" : "VARIANCE DETECTED"}.`,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "EOD execution failed" }, { status: 400 })
    }
}
