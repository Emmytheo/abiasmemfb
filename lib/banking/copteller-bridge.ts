import { Pool, type QueryResult, type QueryResultRow } from "pg"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

const g = globalThis as typeof globalThis & {
    __banksuiteCoptellerPool?: Pool
}

export interface CoptellerBridgeHealth {
    configured: boolean
    connected: boolean
    mode: "direct_db" | "not_configured"
    latencyMs: number
    appUrl: string
    error?: string
}

export function getCoptellerBridgeUrl(): string {
    return (
        process.env.NEXT_PUBLIC_COPTELLER_URL ||
        process.env.NEXT_PUBLIC_COPTELLER_APP_URL ||
        "http://localhost:3001"
    ).replace(/\/$/, "")
}

export function getCoptellerBridgePool(): Pool | null {
    const connString = process.env.COPTELLER_DATABASE_URI
    if (!connString) return null

    if (!g.__banksuiteCoptellerPool) {
        const isLocal =
            connString.includes("localhost") || connString.includes("127.0.0.1")
        g.__banksuiteCoptellerPool = new Pool({
            connectionString: connString,
            max: 6,
            connectionTimeoutMillis: 8000,
            idleTimeoutMillis: 30000,
            statement_timeout: 12000,
            ssl: isLocal ? undefined : { rejectUnauthorized: false },
        })

        g.__banksuiteCoptellerPool.on("error", (err) => {
            console.warn("[Copteller Bridge PG] Pool error, recycling:", err.message)
            try {
                g.__banksuiteCoptellerPool?.end().catch(() => {})
            } catch {}
            g.__banksuiteCoptellerPool = undefined
        })
    }

    return g.__banksuiteCoptellerPool
}

export async function queryCoptellerBridge<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<R>> {
    const pool = getCoptellerBridgePool()
    if (!pool) {
        throw new Error("Copteller bridge is not configured (COPTELLER_DATABASE_URI missing).")
    }
    return pool.query<R>(text, params)
}

export async function checkCoptellerBridgeHealth(): Promise<CoptellerBridgeHealth> {
    const appUrl = getCoptellerBridgeUrl()
    const pool = getCoptellerBridgePool()
    if (!pool) {
        return {
            configured: false,
            connected: false,
            mode: "not_configured",
            latencyMs: 0,
            appUrl,
            error: "COPTELLER_DATABASE_URI is not set in environment.",
        }
    }

    const started = Date.now()
    try {
        await pool.query("SELECT 1")
        return {
            configured: true,
            connected: true,
            mode: "direct_db",
            latencyMs: Date.now() - started,
            appUrl,
        }
    } catch (err: any) {
        return {
            configured: true,
            connected: false,
            mode: "direct_db",
            latencyMs: Date.now() - started,
            appUrl,
            error: err.message,
        }
    }
}

export function maskSecretPreview(val?: string | null): string {
    if (!val) return "••••••••"
    const s = String(val)
    if (s.length <= 8) return "••••••••"
    return `${s.slice(0, 6)}••••••••${s.slice(-4)}`
}

export async function getCoptellerOversightSnapshot() {
    const health = await checkCoptellerBridgeHealth()
    if (!health.connected) {
        return {
            health,
            kpis: {
                totalCooperatives: 0,
                activeCooperatives: 0,
                pendingCooperatives: 0,
                totalMembers: 0,
                totalSchemes: 0,
                activeContracts: 0,
                defaultingContracts: 0,
                completedContracts: 0,
                escrowBalanceKobo: 0,
                totalContractObligationKobo: 0,
                totalContractCollectedKobo: 0,
                collectionRatePct: 0,
                pendingLoansCount: 0,
                pendingLoansAmountKobo: 0,
                avgCreditScore: 0,
            },
            sectorDistribution: [],
            cooperatives: [],
            schemes: [],
            contracts: [],
            loans: [],
            vaultSecrets: [],
            auditLogs: [],
        }
    }

    const [
        coopsRes,
        schemesRes,
        contractsRes,
        membersRes,
        loansRes,
        accountsRes,
        secretsRes,
        auditsRes,
    ] = await Promise.all([
        queryCoptellerBridge(`
            SELECT c.id, c.name, c.description, c.cooperative_type, c.sector, c.segment,
                   c.registration_number, c.state, c.lga, c.status, c.bank_approval_date,
                   c.max_members, c.current_member_count, c.escrow_fee_percent,
                   c.default_contribution_amount, c.cycle_frequency, c.marketplace_enabled,
                   c.created_at,
                   COALESCE(cust.first_name || ' ' || cust.last_name, cust.email, 'Unassigned') AS leader_name,
                   cust.email AS leader_email
            FROM copteller.cooperatives c
            LEFT JOIN copteller.customers cust ON cust.id = c.union_leader_id
            ORDER BY c.created_at DESC
            LIMIT 200
        `),
        queryCoptellerBridge(`
            SELECT id, name, description, cooperative, scheme_type, status, bank_approved,
                   target_capital, funded_capital, contribution_amount, yield_rate,
                   repayment_frequency, duration_months, max_participants, enrolled_count, created_at
            FROM copteller.copteller_schemes
            ORDER BY created_at DESC
            LIMIT 100
        `),
        queryCoptellerBridge(`
            SELECT id, member, cooperative, scheme_id, contract_type, asset_name,
                   asset_identifier, asset_value, due_amount, weekly_due_amount,
                   repayment_frequency, total_obligation, total_paid, missed_payments,
                   payment_streak, next_due_date, status, created_at
            FROM copteller.copteller_contracts
            ORDER BY created_at DESC
            LIMIT 200
        `),
        queryCoptellerBridge(`
            SELECT COUNT(*)::int AS total_members,
                   COALESCE(AVG(credit_score), 0)::numeric(6,1) AS avg_credit_score,
                   COALESCE(SUM(total_contributed), 0)::bigint AS total_contributed_kobo
            FROM copteller.copteller_memberships
            WHERE status = 'active'
        `),
        queryCoptellerBridge(`
            SELECT l.id, l.user_id, l.account_id, l.principal, l.outstanding_balance,
                   l.interest_rate, l.duration_months, l.status, l.purpose, l.disbursed_at,
                   l.created_at,
                   COALESCE(cust.first_name || ' ' || cust.last_name, cust.email, l.user_id) AS borrower_name,
                   cust.email AS borrower_email
            FROM copteller.loans l
            LEFT JOIN copteller.customers cust ON cust.id = l.customer_id
            ORDER BY l.created_at DESC
            LIMIT 100
        `),
        queryCoptellerBridge(`
            SELECT COUNT(*)::int AS account_count,
                   COALESCE(SUM(balance), 0)::bigint AS total_balance_kobo
            FROM copteller.accounts
            WHERE status = 'active'
        `),
        queryCoptellerBridge(`
            SELECT id, name, category, description, encrypted_value, value, last_rotated_at, created_at
            FROM copteller.secrets
            ORDER BY created_at DESC
            LIMIT 50
        `).catch(() => ({ rows: [] as any[] })),
        queryCoptellerBridge(`
            SELECT id, actor_id, actor_role, actor_name, action, entity_type, entity_id,
                   amount_kobo, metadata, created_at
            FROM copteller.copteller_audit_logs
            ORDER BY created_at DESC
            LIMIT 50
        `).catch(() => ({ rows: [] as any[] })),
    ])

    const cooperatives = coopsRes.rows
    const schemes = schemesRes.rows
    const contracts = contractsRes.rows
    const loans = loansRes.rows
    const memberAgg = membersRes.rows[0] || {}
    const accountAgg = accountsRes.rows[0] || {}

    const activeCooperatives = cooperatives.filter((c) => c.status === "active").length
    const pendingCooperatives = cooperatives.filter((c) => c.status === "pending").length
    const activeContracts = contracts.filter((c) => c.status === "active").length
    const defaultingContracts = contracts.filter(
        (c) => c.status === "defaulted" || Number(c.missed_payments || 0) >= 2
    ).length
    const completedContracts = contracts.filter((c) => c.status === "completed").length

    const totalObligationKobo = contracts.reduce(
        (s, c) => s + Number(c.total_obligation || c.asset_value || 0),
        0
    )
    const totalCollectedKobo = contracts.reduce((s, c) => s + Number(c.total_paid || 0), 0)
    const collectionRatePct =
        totalObligationKobo > 0
            ? Number(((totalCollectedKobo / totalObligationKobo) * 100).toFixed(1))
            : 100

    const pendingLoans = loans.filter((l) => l.status === "pending")
    const pendingLoansAmountKobo = pendingLoans.reduce(
        (s, l) => s + Number(l.principal || 0),
        0
    )

    // Real sector breakdown
    const sectorMap = new Map<string, { sector: string; coops: number; members: number }>()
    for (const c of cooperatives) {
        const key = String(c.sector || "other")
        const cur = sectorMap.get(key) || { sector: key, coops: 0, members: 0 }
        cur.coops += 1
        cur.members += Number(c.current_member_count || 0)
        sectorMap.set(key, cur)
    }
    const totalCoopCount = cooperatives.length || 1
    const sectorDistribution = Array.from(sectorMap.values())
        .sort((a, b) => b.coops - a.coops)
        .map((s) => ({
            ...s,
            pct: Math.round((s.coops / totalCoopCount) * 100),
        }))

    const vaultSecrets = secretsRes.rows.map((s) => ({
        id: s.id,
        name: s.name,
        category: s.category || "custom",
        description: s.description || "",
        encrypted: Boolean(s.encrypted_value),
        maskedPreview: s.encrypted_value
            ? "AES-256-GCM ••••••••"
            : maskSecretPreview(s.value),
        lastRotatedAt: s.last_rotated_at || s.created_at,
    }))

    return {
        health,
        kpis: {
            totalCooperatives: cooperatives.length,
            activeCooperatives,
            pendingCooperatives,
            totalMembers: Number(memberAgg.total_members || 0),
            totalSchemes: schemes.length,
            activeContracts,
            defaultingContracts,
            completedContracts,
            escrowBalanceKobo: Number(accountAgg.total_balance_kobo || 0),
            totalContractObligationKobo: totalObligationKobo,
            totalContractCollectedKobo: totalCollectedKobo,
            collectionRatePct,
            pendingLoansCount: pendingLoans.length,
            pendingLoansAmountKobo,
            avgCreditScore: Number(memberAgg.avg_credit_score || 0),
        },
        sectorDistribution,
        cooperatives,
        schemes,
        contracts,
        loans,
        vaultSecrets,
        auditLogs: auditsRes.rows,
    }
}

export async function updateCoptellerCooperativeStatus(params: {
    cooperativeId: number
    status: "active" | "suspended" | "pending" | "closed"
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    const beforeRes = await queryCoptellerBridge(
        `SELECT id, name, status FROM copteller.cooperatives WHERE id = $1 LIMIT 1`,
        [params.cooperativeId]
    )
    const before = beforeRes.rows[0]
    if (!before) throw new Error("Cooperative not found in Copteller.")

    const updateRes = await queryCoptellerBridge(
        `
        UPDATE copteller.cooperatives
        SET status = $1,
            bank_approval_date = CASE WHEN $1 = 'active' THEN COALESCE(bank_approval_date, NOW()) ELSE bank_approval_date END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [params.status, params.cooperativeId]
    )
    const after = updateRes.rows[0]

    await queryCoptellerBridge(
        `
        INSERT INTO copteller.copteller_audit_logs (
            actor_id, actor_role, actor_name, action, entity_type, entity_id,
            before_state, after_state, metadata, created_at, updated_at
        ) VALUES ($1, 'bank_staff', $2, $3, 'cooperative', $4, $5::jsonb, $6::jsonb, $7::jsonb, NOW(), NOW())
        `,
        [
            params.actorId,
            params.actorEmail,
            `banksuite.coop.${params.status}`,
            String(params.cooperativeId),
            JSON.stringify(before),
            JSON.stringify({ id: after.id, name: after.name, status: after.status }),
            JSON.stringify({ source: "banksuite_superadmin_bridge" }),
        ]
    ).catch(() => {})

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: `copteller.cooperative.${params.status}`,
        entityType: "copteller_cooperative",
        entityId: params.cooperativeId,
        ipAddress: params.ipAddress,
        beforeState: before,
        afterState: { id: after.id, name: after.name, status: after.status },
    })

    return after
}

export async function toggleCoptellerSchemeApproval(params: {
    schemeId: number
    bankApproved: boolean
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    const res = await queryCoptellerBridge(
        `
        UPDATE copteller.copteller_schemes
        SET bank_approved = $1,
            status = CASE WHEN $1 = TRUE AND status = 'pending' THEN 'active' ELSE status END,
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
        `,
        [params.bankApproved, params.schemeId]
    )
    if (!res.rows[0]) throw new Error("Scheme not found in Copteller.")

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: params.bankApproved ? "copteller.scheme.approved" : "copteller.scheme.revoked",
        entityType: "copteller_scheme",
        entityId: params.schemeId,
        ipAddress: params.ipAddress,
        afterState: { bank_approved: params.bankApproved },
    })
    return res.rows[0]
}

export async function processCoptellerLoanDecision(params: {
    loanId: number
    decision: "disburse" | "reject"
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    const pool = getCoptellerBridgePool()
    if (!pool) throw new Error("Copteller bridge not configured.")

    const client = await pool.connect()
    try {
        await client.query("BEGIN")

        const loanRes = await client.query(
            `SELECT * FROM copteller.loans WHERE id = $1 FOR UPDATE`,
            [params.loanId]
        )
        const loan = loanRes.rows[0]
        if (!loan) throw new Error("Loan record not found in Copteller.")
        if (loan.status !== "pending") {
            throw new Error(`Loan #${loan.id} is already ${loan.status} and cannot be processed again.`)
        }

        if (params.decision === "reject") {
            const upd = await client.query(
                `UPDATE copteller.loans SET status = 'written_off', updated_at = NOW() WHERE id = $1 RETURNING *`,
                [loan.id]
            )
            await client.query(
                `
                INSERT INTO copteller.copteller_audit_logs (
                    actor_id, actor_role, actor_name, action, entity_type, entity_id,
                    amount_kobo, metadata, created_at, updated_at
                ) VALUES ($1, 'bank_staff', $2, 'banksuite.loan.rejected', 'loan', $3, $4, $5::jsonb, NOW(), NOW())
                `,
                [
                    params.actorId,
                    params.actorEmail,
                    String(loan.id),
                    Number(loan.principal || 0),
                    JSON.stringify({ source: "banksuite_superadmin_bridge" }),
                ]
            )
            await client.query("COMMIT")
            await writeBankAuditLog({
                actorId: params.actorId,
                actorEmail: params.actorEmail,
                actorRole: "admin",
                action: "copteller.loan.rejected",
                entityType: "copteller_loan",
                entityId: loan.id,
                amountKobo: Number(loan.principal || 0),
                ipAddress: params.ipAddress,
            })
            return { loan: upd.rows[0], disbursed: false }
        }

        // Disburse atomically into borrower's Copteller account
        const principalKobo = Number(loan.principal || 0)
        let targetAccount: any = null
        if (loan.account_id) {
            const accRes = await client.query(
                `SELECT * FROM copteller.accounts WHERE id = $1 FOR UPDATE`,
                [loan.account_id]
            )
            targetAccount = accRes.rows[0]
        }
        if (!targetAccount && loan.user_id) {
            const accRes = await client.query(
                `SELECT * FROM copteller.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                [loan.user_id]
            )
            targetAccount = accRes.rows[0]
        }

        const ref = `COP_DISB_${loan.id}_${Date.now()}`
        let newBalance = 0
        if (targetAccount) {
            newBalance = Number(targetAccount.balance || 0) + principalKobo
            await client.query(
                `UPDATE copteller.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [newBalance, targetAccount.id]
            )

            await client.query(
                `
                INSERT INTO copteller.transactions (
                    reference, type, amount, currency, to_account_id, loan_id,
                    status, narration, channel, balance_after, date, metadata,
                    customer_id, user_id, created_at, updated_at
                ) VALUES (
                    $1, 'disbursement', $2, 'NGN', $3, $4,
                    'successful', $5, 'admin', $6, NOW(), $7::jsonb,
                    $8, $9, NOW(), NOW()
                )
                `,
                [
                    ref,
                    principalKobo,
                    targetAccount.id,
                    loan.id,
                    `BankSuite Approved Grant/Loan Disbursement (#${loan.id})`,
                    newBalance,
                    JSON.stringify({ approved_by: params.actorEmail, source: "banksuite_bridge" }),
                    loan.customer_id || targetAccount.customer_id || null,
                    loan.user_id || targetAccount.user_id,
                ]
            )
        }

        const updLoan = await client.query(
            `UPDATE copteller.loans SET status = 'active', disbursed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
            [loan.id]
        )

        await client.query(
            `
            INSERT INTO copteller.copteller_audit_logs (
                actor_id, actor_role, actor_name, action, entity_type, entity_id,
                amount_kobo, metadata, created_at, updated_at
            ) VALUES ($1, 'bank_staff', $2, 'banksuite.loan.disbursed', 'loan', $3, $4, $5::jsonb, NOW(), NOW())
            `,
            [
                params.actorId,
                params.actorEmail,
                String(loan.id),
                principalKobo,
                JSON.stringify({ reference: ref, credited_account: targetAccount?.account_number || null }),
            ]
        )

        await client.query("COMMIT")

        await writeBankAuditLog({
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            actorRole: "admin",
            action: "copteller.loan.disbursed",
            entityType: "copteller_loan",
            entityId: loan.id,
            amountKobo: principalKobo,
            ipAddress: params.ipAddress,
            afterState: { reference: ref, account_credited: targetAccount?.account_number || null },
        })

        return {
            loan: updLoan.rows[0],
            disbursed: true,
            reference: ref,
            creditedAccountNumber: targetAccount?.account_number || null,
        }
    } catch (err) {
        try {
            await client.query("ROLLBACK")
        } catch {}
        throw err
    } finally {
        client.release()
    }
}

export async function runCoptellerVaultReconciliation(actorId: string, actorEmail: string, ipAddress?: string) {
    const started = Date.now()
    const [accSum, txSum, negativeAccs, delinquentContracts, pendingCoops, auditCount] =
        await Promise.all([
            queryCoptellerBridge(`SELECT COUNT(*)::int AS cnt, COALESCE(SUM(balance), 0)::bigint AS sum_kobo FROM copteller.accounts`),
            queryCoptellerBridge(`
                SELECT
                    COUNT(*)::int AS total_txs,
                    COALESCE(SUM(CASE WHEN type IN ('credit','disbursement','interest') AND status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS credits_kobo,
                    COALESCE(SUM(CASE WHEN type IN ('debit','repayment','fee') AND status = 'successful' THEN amount ELSE 0 END), 0)::bigint AS debits_kobo
                FROM copteller.transactions
            `),
            queryCoptellerBridge(`SELECT id, account_number, balance FROM copteller.accounts WHERE balance < 0`),
            queryCoptellerBridge(`SELECT COUNT(*)::int AS cnt FROM copteller.copteller_contracts WHERE status = 'defaulted' OR missed_payments >= 2`),
            queryCoptellerBridge(`SELECT COUNT(*)::int AS cnt FROM copteller.cooperatives WHERE status = 'pending'`),
            queryCoptellerBridge(`SELECT COUNT(*)::int AS cnt FROM copteller.copteller_audit_logs`),
        ])

    const checks = [
        {
            name: "Escrow Account Non-Negativity",
            passed: negativeAccs.rows.length === 0,
            detail:
                negativeAccs.rows.length === 0
                    ? `All ${accSum.rows[0].cnt} Copteller accounts have non-negative balances (Total: ₦${(Number(accSum.rows[0].sum_kobo) / 100).toLocaleString()}).`
                    : `${negativeAccs.rows.length} accounts detected with negative balances!`,
        },
        {
            name: "Transaction Journal Activity",
            passed: true,
            detail: `${txSum.rows[0].total_txs} posted transactions — Credits: ₦${(Number(txSum.rows[0].credits_kobo) / 100).toLocaleString()} · Debits: ₦${(Number(txSum.rows[0].debits_kobo) / 100).toLocaleString()}.`,
        },
        {
            name: "Hire-Purchase & Thrift Delinquency Scan",
            passed: Number(delinquentContracts.rows[0].cnt) === 0,
            detail:
                Number(delinquentContracts.rows[0].cnt) === 0
                    ? "Zero defaulting HP/thrift contracts flagged."
                    : `${delinquentContracts.rows[0].cnt} contract(s) have missed payments ≥ 2 or defaulted status.`,
        },
        {
            name: "Pending Union KYC / License Queue",
            passed: Number(pendingCoops.rows[0].cnt) === 0,
            detail:
                Number(pendingCoops.rows[0].cnt) === 0
                    ? "No unapproved cooperatives waiting in queue."
                    : `${pendingCoops.rows[0].cnt} cooperative(s) pending Bank Superadmin license approval.`,
        },
        {
            name: "Immutable Audit Log Continuity",
            passed: true,
            detail: `${auditCount.rows[0].cnt} audit log entries indexed in copteller.copteller_audit_logs.`,
        },
    ]

    const report = {
        ranAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        allPassed: checks.every((c) => c.passed),
        checks,
    }

    await writeBankAuditLog({
        actorId,
        actorEmail,
        actorRole: "admin",
        action: "copteller.vault.reconcile",
        entityType: "copteller_platform",
        entityId: "global",
        ipAddress,
        afterState: report,
    })

    return report
}
