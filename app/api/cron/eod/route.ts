import crypto from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { runBankSuiteEodBatch } from "@/lib/banking/eod-engine"

export const dynamic = "force-dynamic"

function safeMatch(provided: string | null, expected?: string): boolean {
    if (!provided || !expected) return false
    const a = Buffer.from(provided, "utf8")
    const b = Buffer.from(expected, "utf8")
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
}

/**
 * GET / POST /api/cron/eod
 * Automated nightly End-of-Day Close-of-Business cron endpoint.
 * Triggered by Vercel Cron (23:55 UTC daily) or external scheduler using Bearer CRON_SECRET / ADMIN_SECRET.
 */
async function handleEodCron(req: NextRequest) {
    const authHeader = req.headers.get("authorization")
    const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim() : null
    const headerSecret = req.headers.get("x-cron-secret") || bearer

    const authorized =
        safeMatch(headerSecret, process.env.CRON_SECRET) ||
        safeMatch(headerSecret, process.env.ADMIN_SECRET)

    if (!authorized) {
        return NextResponse.json({ error: "Unauthorized cron invocation" }, { status: 401 })
    }

    try {
        const result = await runBankSuiteEodBatch({
            actorId: "cron-eod-scheduler",
            actorEmail: "eod-cron@banksuite.internal",
            ipAddress: req.headers.get("x-forwarded-for") || "cron",
        })

        return NextResponse.json({
            success: true,
            runRef: result.run.run_ref,
            trialBalanceBalanced: result.run.trial_balance_balanced,
            glJournalsPosted: result.summary.glJournalsPosted,
            interestAccruedNaira: Number(result.run.interest_accrued_kobo || 0) / 100,
            standingOrdersExecuted: Number(result.run.standing_orders_executed || 0),
            overdueLoansTagged: Number(result.run.overdue_loans_tagged || 0),
        })
    } catch (err: any) {
        console.error("[Cron EOD] Failed:", err)
        return NextResponse.json({ error: err.message || "Automated EOD batch failed" }, { status: 500 })
    }
}

export const GET = handleEodCron
export const POST = handleEodCron
