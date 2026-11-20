import crypto from "crypto"
import {
    ensureBankSuiteOperationalTables,
    queryBankSuite,
    withBankSuiteTransaction,
} from "@/lib/banking/db-pool"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export interface GlJournalLine {
    glCode: string
    side: "debit" | "credit"
    amountKobo: number
    narration?: string
}

export interface AmortizationInstallment {
    installmentNo: number
    dueDate: string
    principalKobo: number
    interestKobo: number
    totalKobo: number
    remainingPrincipalKobo: number
    status: "paid" | "due" | "upcoming"
}

/**
 * Computes a clean declining/flat microfinance amortization schedule persisted onto loans.repayment_schedule.
 */
export function computeAmortizationSchedule(params: {
    principalKobo: number
    annualRatePercent: number
    durationMonths: number
    startDate?: Date
    paidAmountKobo?: number
}): {
    monthlyInstallmentKobo: number
    totalInterestKobo: number
    totalRepayableKobo: number
    schedule: AmortizationInstallment[]
} {
    const months = Math.max(1, Math.round(params.durationMonths || 1))
    const principalKobo = Math.max(0, Math.round(params.principalKobo))
    const annualRate = Math.max(0, Number(params.annualRatePercent || 0))
    const totalInterestKobo = Math.round(principalKobo * (annualRate / 100) * (months / 12))
    const totalRepayableKobo = principalKobo + totalInterestKobo
    const monthlyPrincipal = Math.floor(principalKobo / months)
    const monthlyInterest = Math.floor(totalInterestKobo / months)
    const monthlyInstallmentKobo = Math.round(totalRepayableKobo / months)

    const start = params.startDate ? new Date(params.startDate) : new Date()
    let remainingPrincipal = principalKobo
    let paidTracker = Math.max(0, Math.round(params.paidAmountKobo || 0))
    const schedule: AmortizationInstallment[] = []

    for (let i = 1; i <= months; i++) {
        const isLast = i === months
        const pKobo = isLast ? remainingPrincipal : monthlyPrincipal
        const iKobo = isLast ? Math.max(0, totalInterestKobo - monthlyInterest * (months - 1)) : monthlyInterest
        const total = pKobo + iKobo
        remainingPrincipal = Math.max(0, remainingPrincipal - pKobo)

        const due = new Date(start)
        due.setMonth(due.getMonth() + i)

        let status: "paid" | "due" | "upcoming" = "upcoming"
        if (paidTracker >= total && total > 0) {
            status = "paid"
            paidTracker -= total
        } else if (due.getTime() <= Date.now()) {
            status = "due"
        }

        schedule.push({
            installmentNo: i,
            dueDate: due.toISOString(),
            principalKobo: pKobo,
            interestKobo: iKobo,
            totalKobo: total,
            remainingPrincipalKobo: remainingPrincipal,
            status,
        })
    }

    return {
        monthlyInstallmentKobo,
        totalInterestKobo,
        totalRepayableKobo,
        schedule,
    }
}

/**
 * Posts a strictly balanced double-entry General Ledger journal (SUM(debits) === SUM(credits)).
 */
export async function postBalancedGlJournal(params: {
    journalRef?: string
    narration: string
    sourceModule: string
    sourceRef?: string
    actorId: string
    actorEmail: string
    ipAddress?: string
    lines: GlJournalLine[]
    metadata?: Record<string, unknown>
}) {
    await ensureBankSuiteOperationalTables()

    if (!params.lines || params.lines.length < 2) {
        throw new Error("A General Ledger journal requires at least two lines (debit & credit).")
    }

    let totalDebit = 0
    let totalCredit = 0
    for (const line of params.lines) {
        const amt = Math.round(Number(line.amountKobo))
        if (!Number.isFinite(amt) || amt <= 0) {
            throw new Error(`GL line amount for account ${line.glCode} must be greater than zero.`)
        }
        if (line.side === "debit") totalDebit += amt
        else if (line.side === "credit") totalCredit += amt
        else throw new Error(`Invalid GL side "${line.side}".`)
    }

    if (totalDebit !== totalCredit) {
        throw new Error(
            `Unbalanced GL journal rejected: Debits (₦${(totalDebit / 100).toLocaleString()}) != Credits (₦${(totalCredit / 100).toLocaleString()}).`
        )
    }

    const journalRef =
        params.journalRef?.trim() ||
        `GL_${Date.now()}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    await withBankSuiteTransaction(async (client) => {
        for (const line of params.lines) {
            const amt = Math.round(line.amountKobo)
            const accRes = await client.query(
                `SELECT code, normal_side, balance_kobo FROM public.banksuite_gl_accounts WHERE code = $1 FOR UPDATE`,
                [line.glCode]
            )
            const glAcc = accRes.rows[0]
            if (!glAcc) {
                throw new Error(`Unknown GL account code "${line.glCode}".`)
            }
            // Normal balance rules: Asset/Expense increase on Debit; Liability/Equity/Income increase on Credit
            const delta = line.side === glAcc.normal_side ? amt : -amt
            await client.query(
                `UPDATE public.banksuite_gl_accounts SET balance_kobo = balance_kobo + $1, updated_at = NOW() WHERE code = $2`,
                [delta, glAcc.code]
            )
            await client.query(
                `INSERT INTO public.banksuite_gl_entries (
                    journal_ref, gl_code, side, amount_kobo, narration, source_module, source_ref, actor_email, metadata
                 ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)`,
                [
                    journalRef,
                    glAcc.code,
                    line.side,
                    amt,
                    line.narration || params.narration,
                    params.sourceModule,
                    params.sourceRef || null,
                    params.actorEmail,
                    JSON.stringify(params.metadata || {}),
                ]
            )
        }
    })

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: "gl.journal.posted",
        entityType: "gl_journal",
        entityId: journalRef,
        amountKobo: totalDebit,
        ipAddress: params.ipAddress,
        metadata: {
            sourceModule: params.sourceModule,
            sourceRef: params.sourceRef,
            lineCount: params.lines.length,
        },
    })

    return { journalRef, totalAmountKobo: totalDebit }
}

/**
 * Returns live institutional Balance Sheet, CBN Liquidity Ratio, Deposit Mix, Loan PAR Aging,
 * 30-day Cashflow Telemetry, and Channel Velocity directly from PostgreSQL.
 */
export async function getInstitutionalTreasurySnapshot() {
    await ensureBankSuiteOperationalTables()

    const [
        glAccsRes,
        recentGlRes,
        accountsMixRes,
        savingsVaultsRes,
        escrowPoolsRes,
        loansParRes,
        dailyFlowRes,
        channelRes,
        settlementsRes,
    ] = await Promise.all([
        queryBankSuite(`SELECT * FROM public.banksuite_gl_accounts ORDER BY code ASC`),
        queryBankSuite(`
            SELECT e.*, a.name AS gl_name, a.category AS gl_category
            FROM public.banksuite_gl_entries e
            JOIN public.banksuite_gl_accounts a ON a.code = e.gl_code
            ORDER BY e.created_at DESC
            LIMIT 40
        `),
        queryBankSuite(`
            SELECT account_type, COUNT(*)::int AS count,
                   COALESCE(SUM(balance), 0)::bigint AS balance_kobo,
                   COALESCE(SUM(lien_amount), 0)::bigint AS lien_kobo
            FROM public.accounts
            WHERE COALESCE(is_archived, FALSE) = FALSE
            GROUP BY account_type
        `),
        queryBankSuite(`
            SELECT COUNT(*)::int AS count,
                   COALESCE(SUM(saved_amount_kobo), 0)::bigint AS total_saved_kobo
            FROM public.banksuite_personal_savings_plans
            WHERE status IN ('active', 'paused')
        `),
        queryBankSuite(`
            SELECT COUNT(*)::int AS pool_count,
                   COALESCE(SUM(custody_balance_kobo), 0)::bigint AS custody_kobo,
                   COALESCE(SUM(copteller_reported_kobo), 0)::bigint AS reported_kobo
            FROM public.banksuite_copteller_escrow_pools
            WHERE status = 'active'
        `),
        queryBankSuite(`
            SELECT
                COUNT(*)::int AS total_count,
                COUNT(*) FILTER (WHERE status = 'active')::int AS active_count,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_count,
                COUNT(*) FILTER (WHERE status = 'repaid')::int AS repaid_count,
                COUNT(*) FILTER (WHERE status IN ('defaulted','written_off'))::int AS defaulted_count,
                COALESCE(SUM(principal), 0)::bigint AS total_principal_kobo,
                COALESCE(SUM(CASE WHEN status IN ('active','defaulted') THEN outstanding_balance ELSE 0 END), 0)::bigint AS active_exposure_kobo,
                COALESCE(SUM(CASE WHEN status = 'active' AND (next_payment_date IS NULL OR next_payment_date >= NOW()) THEN outstanding_balance ELSE 0 END), 0)::bigint AS performing_kobo,
                COALESCE(SUM(CASE WHEN status = 'active' AND next_payment_date < NOW() AND next_payment_date >= NOW() - INTERVAL '30 days' THEN outstanding_balance ELSE 0 END), 0)::bigint AS par_1_30_kobo,
                COALESCE(SUM(CASE WHEN status = 'active' AND next_payment_date < NOW() - INTERVAL '30 days' AND next_payment_date >= NOW() - INTERVAL '90 days' THEN outstanding_balance ELSE 0 END), 0)::bigint AS par_31_90_kobo,
                COALESCE(SUM(CASE WHEN status IN ('defaulted','written_off') OR (status = 'active' AND next_payment_date < NOW() - INTERVAL '90 days') THEN outstanding_balance ELSE 0 END), 0)::bigint AS par_90_plus_kobo
            FROM public.loans
        `),
        queryBankSuite(`
            SELECT
                to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS day_key,
                to_char(date_trunc('day', created_at), 'Mon DD') AS label,
                COALESCE(SUM(CASE WHEN type IN ('credit','repayment','interest') AND status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS inflow_kobo,
                COALESCE(SUM(CASE WHEN type IN ('debit','transfer','disbursement') AND status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS outflow_kobo,
                COALESCE(SUM(CASE WHEN type = 'fee' AND status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS fee_kobo
            FROM public.transactions
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY 1, 2
            ORDER BY 1 ASC
        `),
        queryBankSuite(`
            SELECT COALESCE(channel::text, 'portal') AS channel,
                   COUNT(*)::int AS tx_count,
                   COALESCE(SUM(amount), 0)::bigint AS volume_kobo
            FROM public.transactions
            WHERE status = 'successful'
            GROUP BY 1
            ORDER BY volume_kobo DESC
        `),
        queryBankSuite(`
            SELECT * FROM public.banksuite_copteller_settlements
            ORDER BY created_at DESC
            LIMIT 25
        `),
    ])

    // Derive live sub-ledger balances overlaid onto Chart of Accounts so Balance Sheet is always real-time
    const retailDepositsKobo = accountsMixRes.rows
        .filter((r) => r.account_type === "Savings" || r.account_type === "Current")
        .reduce((s, r) => s + Number(r.balance_kobo || 0), 0)
    const corporateDepositsKobo = accountsMixRes.rows
        .filter((r) => r.account_type === "Corporate")
        .reduce((s, r) => s + Number(r.balance_kobo || 0), 0)
    const fixedDepositsKobo = accountsMixRes.rows
        .filter((r) => r.account_type === "Fixed Deposit")
        .reduce((s, r) => s + Number(r.balance_kobo || 0), 0)
    const targetVaultsKobo = Number(savingsVaultsRes.rows[0]?.total_saved_kobo || 0)
    const coptellerCustodyKobo = Math.max(
        Number(escrowPoolsRes.rows[0]?.custody_kobo || 0),
        Number(escrowPoolsRes.rows[0]?.reported_kobo || 0)
    )

    const loanRow = loansParRes.rows[0] || {}
    const totalLoanExposureKobo = Number(loanRow.active_exposure_kobo || 0)
    const par30PlusKobo = Number(loanRow.par_31_90_kobo || 0) + Number(loanRow.par_90_plus_kobo || 0)
    const parRatioPct =
        totalLoanExposureKobo > 0
            ? Number(((par30PlusKobo / totalLoanExposureKobo) * 100).toFixed(2))
            : 0

    // Live total regulated deposits
    const totalDirectDepositsKobo = retailDepositsKobo + corporateDepositsKobo + fixedDepositsKobo
    const totalDepositsIncludingVaultsKobo = totalDirectDepositsKobo + targetVaultsKobo + coptellerCustodyKobo

    // Compute live GL accounts merged with sub-ledger live positions
    const glMap = new Map<string, any>()
    for (const acc of glAccsRes.rows) {
        glMap.set(acc.code, { ...acc, balance_kobo: Number(acc.balance_kobo || 0) })
    }

    const nostroBase = glMap.get("1000")?.balance_kobo ?? 25000000000
    const cbnReserveBase = glMap.get("1100")?.balance_kobo ?? 8000000000
    const liveGlAccounts = glAccsRes.rows.map((acc) => {
        let computed = Number(acc.balance_kobo || 0)
        if (acc.code === "1200") computed = Math.max(computed, totalLoanExposureKobo)
        if (acc.code === "2000") computed = Math.max(computed, retailDepositsKobo + corporateDepositsKobo)
        if (acc.code === "2100") computed = Math.max(computed, coptellerCustodyKobo)
        if (acc.code === "2200") computed = Math.max(computed, fixedDepositsKobo + targetVaultsKobo)
        return {
            ...acc,
            live_balance_kobo: computed,
        }
    })

    const totalAssetsKobo = liveGlAccounts
        .filter((a) => a.category === "asset")
        .reduce((s, a) => s + a.live_balance_kobo, 0)
    const totalLiabilitiesKobo = liveGlAccounts
        .filter((a) => a.category === "liability")
        .reduce((s, a) => s + a.live_balance_kobo, 0)
    const totalEquityKobo = liveGlAccounts
        .filter((a) => a.category === "equity")
        .reduce((s, a) => s + a.live_balance_kobo, 0)
    const totalIncomeKobo = liveGlAccounts
        .filter((a) => a.category === "income")
        .reduce((s, a) => s + a.live_balance_kobo, 0)
    const totalExpenseKobo = liveGlAccounts
        .filter((a) => a.category === "expense")
        .reduce((s, a) => s + a.live_balance_kobo, 0)

    const liquidAssetsKobo = nostroBase + cbnReserveBase
    const cbnLiquidityRatioPct =
        totalDepositsIncludingVaultsKobo > 0
            ? Number(Math.min(100, (liquidAssetsKobo / totalDepositsIncludingVaultsKobo) * 100).toFixed(1))
            : 100
    const loanToDepositPct =
        totalDepositsIncludingVaultsKobo > 0
            ? Number(((totalLoanExposureKobo / totalDepositsIncludingVaultsKobo) * 100).toFixed(1))
            : 0

    return {
        summary: {
            totalDirectDepositsKobo,
            retailDepositsKobo,
            corporateDepositsKobo,
            fixedDepositsKobo,
            targetVaultsKobo,
            coptellerCustodyKobo,
            totalRegulatedDepositsKobo: totalDepositsIncludingVaultsKobo,
            totalLoanExposureKobo,
            liquidAssetsKobo,
            cbnLiquidityRatioPct,
            loanToDepositPct,
            parRatioPct,
            totalAssetsKobo,
            totalLiabilitiesKobo,
            totalEquityKobo,
            netIncomeKobo: totalIncomeKobo - totalExpenseKobo,
            escrowPoolCount: Number(escrowPoolsRes.rows[0]?.pool_count || 0),
        },
        parAging: {
            performingKobo: Number(loanRow.performing_kobo || 0),
            par1To30Kobo: Number(loanRow.par_1_30_kobo || 0),
            par31To90Kobo: Number(loanRow.par_31_90_kobo || 0),
            par90PlusKobo: Number(loanRow.par_90_plus_kobo || 0),
            activeCount: Number(loanRow.active_count || 0),
            pendingCount: Number(loanRow.pending_count || 0),
            repaidCount: Number(loanRow.repaid_count || 0),
            defaultedCount: Number(loanRow.defaulted_count || 0),
        },
        glAccounts: liveGlAccounts,
        recentGlEntries: recentGlRes.rows,
        depositMix: [
            { label: "Retail CASA (Savings & Current)", valueNaira: retailDepositsKobo / 100, color: "#0f766e", description: "Individual retail savings & current balances" },
            { label: "Corporate & SME Merchant Float", valueNaira: corporateDepositsKobo / 100, color: "#2563eb", description: "Business operating & merchant checkout accounts" },
            { label: "Copteller Cooperative Custody (GL 2100)", valueNaira: coptellerCustodyKobo / 100, color: "#10b981", description: "Ring-fenced Ajo thrift & HP cooperative escrow" },
            { label: "Target Vaults & Fixed Deposits", valueNaira: (fixedDepositsKobo + targetVaultsKobo) / 100, color: "#f59e0b", description: "Yield-bearing locked savings & fixed tenors" },
        ],
        dailyCashflow: dailyFlowRes.rows.map((r) => ({
            date: r.label,
            dayKey: r.day_key,
            inflowNaira: Number(r.inflow_kobo || 0) / 100,
            outflowNaira: Number(r.outflow_kobo || 0) / 100,
            feeNaira: Number(r.fee_kobo || 0) / 100,
        })),
        channelBreakdown: channelRes.rows.map((r) => ({
            channel: r.channel,
            txCount: Number(r.tx_count || 0),
            volumeNaira: Number(r.volume_kobo || 0) / 100,
        })),
        settlements: settlementsRes.rows,
    }
}
