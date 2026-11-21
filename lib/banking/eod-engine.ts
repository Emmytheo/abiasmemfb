import crypto from "crypto"
import { ensureBankSuiteOperationalTables, queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { postBalancedGlJournal } from "@/lib/banking/gl-engine"
import { executeAtomicTransfer, writeBankAuditLog } from "@/lib/banking/ledger-engine"

export interface GlVarianceItem {
    glCode: string
    label: string
    glBalanceKobo: number
    subLedgerKobo: number
    varianceKobo: number
}

/**
 * Inspects variance between real customer/loan/vault/escrow Postgres sub-ledgers
 * and the Double-Entry General Ledger control accounts (1200, 2000, 2100, 2200).
 */
export async function inspectSubLedgerVariance(): Promise<{
    variances: GlVarianceItem[]
    totalAbsVarianceKobo: number
    inSync: boolean
}> {
    await ensureBankSuiteOperationalTables()

    const [glRes, casaRes, fixedRes, loansRes, vaultsRes, escrowRes] = await Promise.all([
        queryBankSuite(`SELECT code, name, balance_kobo FROM public.banksuite_gl_accounts WHERE code IN ('1000','1100','1200','2000','2100','2200','3000')`),
        queryBankSuite(`
            SELECT COALESCE(SUM(balance), 0)::bigint AS total
            FROM public.accounts
            WHERE COALESCE(is_archived, FALSE) = FALSE
              AND account_type <> 'Fixed Deposit'
        `),
        queryBankSuite(`
            SELECT COALESCE(SUM(balance), 0)::bigint AS total
            FROM public.accounts
            WHERE COALESCE(is_archived, FALSE) = FALSE
              AND account_type = 'Fixed Deposit'
        `),
        queryBankSuite(`
            SELECT COALESCE(SUM(outstanding_balance), 0)::bigint AS total
            FROM public.loans
            WHERE status IN ('active', 'defaulted')
        `),
        queryBankSuite(`
            SELECT COALESCE(SUM(saved_amount_kobo), 0)::bigint AS total
            FROM public.banksuite_personal_savings_plans
            WHERE status IN ('active', 'paused')
        `),
        queryBankSuite(`
            SELECT COALESCE(SUM(custody_balance_kobo), 0)::bigint AS total
            FROM public.banksuite_copteller_escrow_pools
            WHERE status = 'active'
        `),
    ])

    const glByCode = new Map<string, number>()
    for (const r of glRes.rows) glByCode.set(r.code, Number(r.balance_kobo || 0))

    const subCasa = Number(casaRes.rows[0]?.total || 0)
    const subVaults = Number(fixedRes.rows[0]?.total || 0) + Number(vaultsRes.rows[0]?.total || 0)
    const subLoans = Number(loansRes.rows[0]?.total || 0)
    const subEscrow = Number(escrowRes.rows[0]?.total || 0)

    const items: GlVarianceItem[] = [
        {
            glCode: "2000",
            label: "Customer CASA Deposits (Savings / Current / Corporate)",
            glBalanceKobo: glByCode.get("2000") ?? 0,
            subLedgerKobo: subCasa,
            varianceKobo: subCasa - (glByCode.get("2000") ?? 0),
        },
        {
            glCode: "1200",
            label: "Active Retail & SME Loan Portfolio Receivable",
            glBalanceKobo: glByCode.get("1200") ?? 0,
            subLedgerKobo: subLoans,
            varianceKobo: subLoans - (glByCode.get("1200") ?? 0),
        },
        {
            glCode: "2200",
            label: "Target Savings & Fixed Deposit Vaults",
            glBalanceKobo: glByCode.get("2200") ?? 0,
            subLedgerKobo: subVaults,
            varianceKobo: subVaults - (glByCode.get("2200") ?? 0),
        },
        {
            glCode: "2100",
            label: "Copteller Cooperative Escrow Custody",
            glBalanceKobo: glByCode.get("2100") ?? 0,
            subLedgerKobo: subEscrow,
            varianceKobo: subEscrow - (glByCode.get("2100") ?? 0),
        },
    ]

    const totalAbsVarianceKobo = items.reduce((s, i) => s + Math.abs(i.varianceKobo), 0)
    return {
        variances: items,
        totalAbsVarianceKobo,
        inSync: totalAbsVarianceKobo === 0,
    }
}

/**
 * Reconciles and synchronizes GL control accounts (1200, 2000, 2100, 2200) against
 * live Postgres sub-ledger balances via strictly balanced DR = CR true-up journals.
 */
export async function syncGlSubLedgersWithCore(params: {
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    const check = await inspectSubLedgerVariance()
    const postedJournals: Array<{ glCode: string; journalRef: string; amountKobo: number }> = []
    let totalSyncedKobo = 0

    for (const v of check.variances) {
        if (v.varianceKobo === 0) continue
        const absDiff = Math.abs(v.varianceKobo)
        const isAsset = v.glCode === "1200"

        // If sub-ledger > GL: increase control account against GL 1000 (Cash & Nostro)
        // Asset (1200) increases on DR; Liability (2000/2100/2200) increases on CR.
        const lines = isAsset
            ? v.varianceKobo > 0
                ? [
                      { glCode: "1200", side: "debit" as const, amountKobo: absDiff, narration: `Sub-ledger true-up: ${v.label}` },
                      { glCode: "1000", side: "credit" as const, amountKobo: absDiff, narration: `Nostro offset for historical loan book sync` },
                  ]
                : [
                      { glCode: "1000", side: "debit" as const, amountKobo: absDiff, narration: `Nostro offset for loan sub-ledger reduction` },
                      { glCode: "1200", side: "credit" as const, amountKobo: absDiff, narration: `Sub-ledger true-up: ${v.label}` },
                  ]
            : v.varianceKobo > 0
                ? [
                      { glCode: "1000", side: "debit" as const, amountKobo: absDiff, narration: `Nostro / Vault backing for ${v.label}` },
                      { glCode: v.glCode, side: "credit" as const, amountKobo: absDiff, narration: `Sub-ledger true-up: ${v.label}` },
                  ]
                : [
                      { glCode: v.glCode, side: "debit" as const, amountKobo: absDiff, narration: `Sub-ledger reduction true-up: ${v.label}` },
                      { glCode: "1000", side: "credit" as const, amountKobo: absDiff, narration: `Nostro offset for ${v.label}` },
                  ]

        const res = await postBalancedGlJournal({
            narration: `GL Sub-Ledger Synchronization (${v.glCode} · ${v.label})`,
            sourceModule: "eod_gl_sync",
            sourceRef: `SYNC_${v.glCode}_${Date.now()}`,
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            ipAddress: params.ipAddress,
            lines,
        })

        postedJournals.push({ glCode: v.glCode, journalRef: res.journalRef, amountKobo: absDiff })
        totalSyncedKobo += absDiff
    }

    const postCheck = await inspectSubLedgerVariance()
    return {
        postedJournals,
        totalSyncedKobo,
        postSync: postCheck,
    }
}

/**
 * Full Institutional End-of-Day (EOD) Close-of-Business Batch Engine:
 * 1. Reconciles GL control accounts against live Postgres sub-ledgers.
 * 2. Accrues daily APY yield onto active funded Personal Target Savings Vaults (DR 5000 / CR 2200).
 * 3. Scans active loans for overdue PAR aging buckets (PAR-30/60/90) & CBN provisioning requirement.
 * 4. Executes due Standing Orders through executeAtomicTransfer and advances next_run_date.
 * 5. Verifies Trial Balance mathematical equality & persists an immutable EOD Close receipt.
 */
export async function runBankSuiteEodBatch(params: {
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    await ensureBankSuiteOperationalTables()
    const runRef = `EOD_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${crypto.randomBytes(3).toString("hex").toUpperCase()}`

    // Step 1: GL Sub-Ledger Sync
    const glSync = await syncGlSubLedgersWithCore(params)

    // Step 2: Target Savings Vault Daily APY Interest Accrual (GL 5000 DR / GL 2200 CR)
    let interestAccruedKobo = 0
    let vaultsCredited = 0
    const activeVaults = await queryBankSuite(`
        SELECT id, name, saved_amount_kobo, apy_percent
        FROM public.banksuite_personal_savings_plans
        WHERE status = 'active' AND saved_amount_kobo > 0
    `)

    for (const v of activeVaults.rows) {
        const saved = Number(v.saved_amount_kobo || 0)
        const apy = Number(v.apy_percent || 6.5)
        const dailyInterestKobo = Math.max(100, Math.round((saved * (apy / 100)) / 365)) // min ₦1 daily accrual when funded
        await withBankSuiteTransaction(async (client) => {
            await client.query(
                `UPDATE public.banksuite_personal_savings_plans
                 SET saved_amount_kobo = saved_amount_kobo + $1, updated_at = NOW()
                 WHERE id = $2`,
                [dailyInterestKobo, v.id]
            )
        })
        interestAccruedKobo += dailyInterestKobo
        vaultsCredited += 1
    }

    let interestJournalRef: string | null = null
    if (interestAccruedKobo > 0) {
        const j = await postBalancedGlJournal({
            narration: `EOD Daily Vault Interest Accrual (${vaultsCredited} vaults · ${runRef})`,
            sourceModule: "eod_interest",
            sourceRef: runRef,
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            ipAddress: params.ipAddress,
            lines: [
                { glCode: "5000", side: "debit", amountKobo: interestAccruedKobo, narration: `Daily vault interest expense (${runRef})` },
                { glCode: "2200", side: "credit", amountKobo: interestAccruedKobo, narration: `Target savings vault interest capitalization (${runRef})` },
            ],
        })
        interestJournalRef = j.journalRef
    }

    // Step 3: Loan Portfolio Aging (PAR-30 / PAR-60 / PAR-90) & CBN Statutory Provisioning
    const activeLoans = await queryBankSuite(`
        SELECT id, outstanding_balance, next_payment_date, status, metadata
        FROM public.loans
        WHERE status IN ('active', 'defaulted')
    `)

    let overdueLoansTagged = 0
    let cbnProvisionRequiredKobo = 0
    const nowMs = Date.now()

    for (const loan of activeLoans.rows) {
        const outKobo = Number(loan.outstanding_balance || 0)
        const dueMs = loan.next_payment_date ? new Date(loan.next_payment_date).getTime() : nowMs
        const daysPastDue = Math.max(0, Math.floor((nowMs - dueMs) / (1000 * 60 * 60 * 24)))

        let parBucket = "performing"
        let provisionRate = 0.01 // 1% general CBN reserve on performing loans
        if (daysPastDue >= 90 || loan.status === "defaulted") {
            parBucket = "PAR-90+ (Lost)"
            provisionRate = 1.0
            overdueLoansTagged += 1
        } else if (daysPastDue >= 60) {
            parBucket = "PAR-60 (Doubtful)"
            provisionRate = 0.5
            overdueLoansTagged += 1
        } else if (daysPastDue >= 30) {
            parBucket = "PAR-30 (Substandard)"
            provisionRate = 0.2
            overdueLoansTagged += 1
        } else if (daysPastDue > 0) {
            parBucket = "PAR-1-30 (Watchlist)"
            provisionRate = 0.05
            overdueLoansTagged += 1
        }

        const provKobo = Math.round(outKobo * provisionRate)
        cbnProvisionRequiredKobo += provKobo

        await queryBankSuite(
            `UPDATE public.loans
             SET metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                 updated_at = NOW()
             WHERE id = $2`,
            [
                JSON.stringify({
                    par_bucket: parBucket,
                    days_past_due: daysPastDue,
                    cbn_provision_kobo: provKobo,
                    last_eod_ref: runRef,
                    last_eod_at: new Date().toISOString(),
                }),
                loan.id,
            ]
        )
    }

    // Step 4: Execute Due Standing Orders
    let standingOrdersExecuted = 0
    const standingOrderErrors: string[] = []
    try {
        const dueOrders = await queryBankSuite(`
            SELECT * FROM public.standing_orders
            WHERE status = 'active' AND (next_run_date IS NULL OR next_run_date <= NOW())
            ORDER BY id ASC
            LIMIT 50
        `)

        for (const so of dueOrders.rows) {
            try {
                const isInternal = !so.destination_bank_code || so.destination_bank_code === "090"
                await executeAtomicTransfer({
                    actorUserId: String(so.user_id),
                    actorEmail: params.actorEmail,
                    actorRole: "admin",
                    isAdmin: true,
                    ipAddress: params.ipAddress,
                    sourceAccountId: Number(so.source_account_id),
                    transferType: isInternal ? "internal" : "interbank",
                    destinationAccount: String(so.destination_account_number),
                    destinationBank: so.destination_bank_code || undefined,
                    destinationName: so.destination_account_name || "Standing Order Beneficiary",
                    amountKobo: Math.round(Number(so.amount || 0)),
                    narration: so.narration || `Standing Order #${so.id} (${runRef})`,
                    channel: "workflow",
                    idempotencyKey: `SO_${so.id}_${new Date().toISOString().slice(0, 10)}`,
                })

                const intervalSql =
                    so.frequency === "daily"
                        ? "INTERVAL '1 day'"
                        : so.frequency === "weekly"
                            ? "INTERVAL '7 days'"
                            : "INTERVAL '1 month'"

                await queryBankSuite(
                    `UPDATE public.standing_orders SET next_run_date = NOW() + ${intervalSql}, updated_at = NOW() WHERE id = $1`,
                    [so.id]
                )
                standingOrdersExecuted += 1
            } catch (soErr: any) {
                standingOrderErrors.push(`SO #${so.id}: ${soErr.message}`)
            }
        }
    } catch {
        // standing_orders table may not exist on older seeds
    }

    // Step 5: Verify Trial Balance Equality (SUM(DR) === SUM(CR) across all GL entries)
    const tbRes = await queryBankSuite(`
        SELECT
            COALESCE(SUM(CASE WHEN side = 'debit' THEN amount_kobo ELSE 0 END), 0)::bigint AS total_dr,
            COALESCE(SUM(CASE WHEN side = 'credit' THEN amount_kobo ELSE 0 END), 0)::bigint AS total_cr
        FROM public.banksuite_gl_entries
    `)
    const totalDr = Number(tbRes.rows[0]?.total_dr || 0)
    const totalCr = Number(tbRes.rows[0]?.total_cr || 0)
    const trialBalanceBalanced = totalDr === totalCr

    const summary = {
        glJournalsPosted: glSync.postedJournals.length + (interestJournalRef ? 1 : 0),
        glSyncJournals: glSync.postedJournals,
        interestJournalRef,
        totalDrKobo: totalDr,
        totalCrKobo: totalCr,
        standingOrderErrors,
    }

    const insRun = await queryBankSuite(
        `INSERT INTO public.banksuite_eod_runs (
            run_ref, run_type, actor_email, status, gl_journals_posted, gl_synced_kobo,
            interest_accrued_kobo, vaults_credited, standing_orders_executed,
            loans_scanned, overdue_loans_tagged, cbn_provision_required_kobo,
            trial_balance_balanced, summary
         ) VALUES ($1, 'full_eod', $2, 'completed', $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb)
         RETURNING *`,
        [
            runRef,
            params.actorEmail,
            summary.glJournalsPosted,
            glSync.totalSyncedKobo,
            interestAccruedKobo,
            vaultsCredited,
            standingOrdersExecuted,
            activeLoans.rows.length,
            overdueLoansTagged,
            cbnProvisionRequiredKobo,
            trialBalanceBalanced,
            JSON.stringify(summary),
        ]
    )

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: "eod.batch.completed",
        entityType: "eod_run",
        entityId: runRef,
        amountKobo: glSync.totalSyncedKobo + interestAccruedKobo,
        status: trialBalanceBalanced ? "success" : "failed",
        ipAddress: params.ipAddress,
        afterState: summary,
    })

    return {
        run: insRun.rows[0],
        summary,
        postVariance: glSync.postSync,
    }
}
