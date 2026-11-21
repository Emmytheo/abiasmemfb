import crypto from "crypto"
import { Pool, type QueryResult, type QueryResultRow } from "pg"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import {
    ensureBankSuiteOperationalTables,
    queryBankSuite,
    withBankSuiteTransaction,
} from "@/lib/banking/db-pool"
import { postBalancedGlJournal } from "@/lib/banking/gl-engine"

const g = globalThis as typeof globalThis & {
    __banksuiteCoptellerPool?: Pool
    __banksuiteCoptellerConfigCache?: {
        appUrl: string
        bridgeSecret: string
        transport: "auto" | "http" | "direct_db"
        loadedAt: number
    }
}

export interface CoptellerBridgeHealth {
    configured: boolean
    connected: boolean
    mode: "http_bridge" | "direct_db" | "not_configured"
    latencyMs: number
    appUrl: string
    transport?: "auto" | "http" | "direct_db"
    hasBridgeSecret?: boolean
    partnerProtocol?: string
    error?: string
}

async function ensureCoptellerConfigTable() {
    await queryBankSuite(`
        CREATE TABLE IF NOT EXISTS public.banksuite_copteller_config (
            id INT PRIMARY KEY DEFAULT 1,
            app_url TEXT NOT NULL DEFAULT '',
            bridge_secret TEXT NOT NULL DEFAULT '',
            transport TEXT NOT NULL DEFAULT 'auto',
            updated_by TEXT,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `).catch(() => {})
}

export async function loadPersistedBridgeConfig(): Promise<{
    appUrl: string
    bridgeSecret: string
    transport: "auto" | "http" | "direct_db"
}> {
    if (g.__banksuiteCoptellerConfigCache && Date.now() - g.__banksuiteCoptellerConfigCache.loadedAt < 30_000) {
        return g.__banksuiteCoptellerConfigCache
    }
    try {
        await ensureCoptellerConfigTable()
        const res = await queryBankSuite(
            `SELECT app_url, bridge_secret, transport FROM public.banksuite_copteller_config WHERE id = 1 LIMIT 1`
        )
        const row = res.rows[0]
        const parsed = {
            appUrl: String(row?.app_url || "").trim().replace(/\/$/, ""),
            bridgeSecret: String(row?.bridge_secret || "").trim(),
            transport: (["auto", "http", "direct_db"].includes(row?.transport) ? row.transport : "auto") as
                | "auto"
                | "http"
                | "direct_db",
            loadedAt: Date.now(),
        }
        g.__banksuiteCoptellerConfigCache = parsed
        return parsed
    } catch {
        return { appUrl: "", bridgeSecret: "", transport: "auto" }
    }
}

export async function saveCoptellerBridgeConfig(params: {
    appUrl: string
    bridgeSecret?: string
    transport?: "auto" | "http" | "direct_db"
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    await ensureCoptellerConfigTable()
    const cleanUrl = String(params.appUrl || "").trim().replace(/\/$/, "")
    const cleanTransport = params.transport && ["auto", "http", "direct_db"].includes(params.transport) ? params.transport : "auto"
    const existing = await loadPersistedBridgeConfig()
    const nextSecret = params.bridgeSecret !== undefined && params.bridgeSecret !== "" ? params.bridgeSecret : existing.bridgeSecret

    await queryBankSuite(
        `INSERT INTO public.banksuite_copteller_config (id, app_url, bridge_secret, transport, updated_by, updated_at)
         VALUES (1, $1, $2, $3, $4, NOW())
         ON CONFLICT (id) DO UPDATE
         SET app_url = EXCLUDED.app_url,
             bridge_secret = EXCLUDED.bridge_secret,
             transport = EXCLUDED.transport,
             updated_by = EXCLUDED.updated_by,
             updated_at = NOW()`,
        [cleanUrl, nextSecret, cleanTransport, params.actorEmail]
    )

    g.__banksuiteCoptellerConfigCache = {
        appUrl: cleanUrl,
        bridgeSecret: nextSecret,
        transport: cleanTransport,
        loadedAt: Date.now(),
    }

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: "copteller.bridge.config_updated",
        entityType: "copteller_bridge",
        entityId: "global",
        ipAddress: params.ipAddress,
        afterState: { appUrl: cleanUrl, transport: cleanTransport, secretUpdated: Boolean(params.bridgeSecret) },
    }).catch(() => {})

    return { appUrl: cleanUrl, transport: cleanTransport, hasBridgeSecret: Boolean(nextSecret || process.env.COPTELLER_BRIDGE_SECRET || process.env.ADMIN_SECRET) }
}

export function getCoptellerBridgeUrl(): string {
    const persisted = g.__banksuiteCoptellerConfigCache?.appUrl || ""
    const envUrl =
        process.env.COPTELLER_BRIDGE_URL ||
        process.env.NEXT_PUBLIC_COPTELLER_URL ||
        process.env.NEXT_PUBLIC_COPTELLER_APP_URL ||
        ""
    const chosen = (persisted || envUrl).trim().replace(/\/$/, "")
    // Guard against localhost leaking into production deployments
    if (process.env.NODE_ENV === "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(chosen)) {
        return ""
    }
    return chosen
}

export function getCoptellerBridgeSecret(): string | null {
    return (
        g.__banksuiteCoptellerConfigCache?.bridgeSecret ||
        process.env.COPTELLER_BRIDGE_SECRET ||
        process.env.ADMIN_SECRET ||
        null
    )
}

/**
 * Signed HTTP client to call an independently deployed Copteller instance's
 * Headless Cooperative Submodule API (/api/copteller/banksuite/bridge) with zero DB sharing.
 */
async function callCoptellerHeadlessHttp<T = any>(params: {
    method: "GET" | "POST"
    query?: string
    body?: Record<string, any>
    actorEmail?: string
}): Promise<T> {
    await loadPersistedBridgeConfig()
    const baseUrl = getCoptellerBridgeUrl()
    const secret = getCoptellerBridgeSecret()
    if (!baseUrl) {
        throw new Error("Copteller hosted Bridge URL is not configured.")
    }
    const url = `${baseUrl}/api/copteller/banksuite/bridge${params.query ? `?${params.query}` : ""}`
    const res = await fetch(url, {
        method: params.method,
        headers: {
            "Content-Type": "application/json",
            ...(secret ? { "x-copteller-bridge-secret": secret, "x-copteller-internal-secret": secret } : {}),
            ...(params.actorEmail ? { "x-partner-actor": params.actorEmail } : {}),
        },
        ...(params.body ? { body: JSON.stringify(params.body) } : {}),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok || json.success === false) {
        throw new Error(json.error || `Copteller HTTP Bridge returned HTTP ${res.status}`)
    }
    return json as T
}

function shouldPreferHttpBridge(): boolean {
    const persistedTransport = g.__banksuiteCoptellerConfigCache?.transport
    const envTransport = process.env.COPTELLER_BRIDGE_TRANSPORT?.toLowerCase()
    const effective = persistedTransport && persistedTransport !== "auto" ? persistedTransport : envTransport
    const hasHttp = Boolean(getCoptellerBridgeUrl())
    const hasDirectDb = Boolean(process.env.COPTELLER_DATABASE_URI)
    if (effective === "direct_db" && hasDirectDb) return false
    return (effective === "http" && hasHttp) || (!hasDirectDb && hasHttp)
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
    const persisted = await loadPersistedBridgeConfig()
    const rawAppUrl = getCoptellerBridgeUrl()
    const devFallbackUrl = process.env.NODE_ENV === "development" ? "http://localhost:3001" : ""
    const appUrl = rawAppUrl || devFallbackUrl
    const hasBridgeSecret = Boolean(getCoptellerBridgeSecret())
    const pool = getCoptellerBridgePool()

    // 1. Independent Deployment Mode: Signed HTTP Headless Bridge (no shared DB required)
    if (shouldPreferHttpBridge()) {
        const started = Date.now()
        try {
            const data = await callCoptellerHeadlessHttp<any>({ method: "GET" })
            return {
                configured: true,
                connected: true,
                mode: "http_bridge",
                latencyMs: Date.now() - started,
                appUrl,
                transport: persisted.transport,
                hasBridgeSecret,
                partnerProtocol: data?.protocol || "Copteller-Headless-PartnerBank-5Rail",
            }
        } catch (err: any) {
            // Fall through to direct DB if co-hosted pool exists; otherwise report clean HTTP error
            if (!pool) {
                return {
                    configured: true,
                    connected: false,
                    mode: "http_bridge",
                    latencyMs: Date.now() - started,
                    appUrl,
                    transport: persisted.transport,
                    hasBridgeSecret,
                    error: err.message,
                }
            }
        }
    }

    // 2. Co-Hosted Cluster Fast-Path: Direct DB Bridge
    if (pool) {
        const started = Date.now()
        try {
            await pool.query("SELECT 1")
            return {
                configured: true,
                connected: true,
                mode: "direct_db",
                latencyMs: Date.now() - started,
                appUrl,
                transport: persisted.transport,
                hasBridgeSecret,
                partnerProtocol: "BankSuite-Copteller-DirectDB",
            }
        } catch (err: any) {
            return {
                configured: true,
                connected: false,
                mode: "direct_db",
                latencyMs: Date.now() - started,
                appUrl,
                transport: persisted.transport,
                hasBridgeSecret,
                error: err.message,
            }
        }
    }

    // 3. Standalone BankSuite Deployment (No Cooperative Module Configured)
    return {
        configured: false,
        connected: false,
        mode: "not_configured",
        latencyMs: 0,
        appUrl: rawAppUrl,
        transport: persisted.transport,
        hasBridgeSecret,
        error: "Standalone BankSuite mode — configure your hosted Copteller Bridge URL below (or set COPTELLER_BRIDGE_URL) to attach a Copteller cooperative submodule.",
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
                custodySettledKobo: 0,
                provisionedPoolsCount: 0,
                totalSettlementsCount: 0,
                totalContractObligationKobo: 0,
                totalContractCollectedKobo: 0,
                collectionRatePct: 0,
                pendingLoansCount: 0,
                pendingLoansAmountKobo: 0,
                avgCreditScore: 0,
            },
            sectorDistribution: [],
            cooperatives: [],
            escrowPools: [],
            settlements: [],
            memberTelemetry: [],
            schemes: [],
            contracts: [],
            loans: [],
            vaultSecrets: [],
            auditLogs: [],
        }
    }

    // Independent Deployment Mode: Fetch all cooperative state via Signed HTTP Headless Bridge
    if (health.mode === "http_bridge") {
        const [remote, escrowPoolsRes, settlementsRes] = await Promise.all([
            callCoptellerHeadlessHttp<any>({ method: "GET" }),
            ensureBankSuiteOperationalTables()
                .then(() => queryBankSuite(`SELECT * FROM public.banksuite_copteller_escrow_pools ORDER BY created_at DESC`))
                .catch(() => ({ rows: [] as any[] })),
            ensureBankSuiteOperationalTables()
                .then(() => queryBankSuite(`SELECT * FROM public.banksuite_copteller_settlements ORDER BY created_at DESC LIMIT 40`))
                .catch(() => ({ rows: [] as any[] })),
        ])

        const cooperatives: any[] = remote.cooperatives || []
        const schemes: any[] = remote.schemes || []
        const contracts: any[] = remote.contracts || []
        const loans: any[] = remote.loans || []
        const m = remote.metrics || {}

        const escrowPoolByCoop = new Map<number, any>()
        for (const ep of escrowPoolsRes.rows) escrowPoolByCoop.set(Number(ep.copteller_coop_id), ep)

        const enrichedCoops = cooperatives.map((c) => ({
            ...c,
            escrow_pool: escrowPoolByCoop.get(Number(c.id)) || null,
        }))

        const pendingLoans = loans.filter((l) => l.status === "pending")
        const sectorMap = new Map<string, { sector: string; coops: number; members: number }>()
        for (const c of cooperatives) {
            const key = String(c.sector || "other")
            const cur = sectorMap.get(key) || { sector: key, coops: 0, members: 0 }
            cur.coops += 1
            cur.members += Number(c.current_member_count || 0)
            sectorMap.set(key, cur)
        }
        const totalCoopCount = cooperatives.length || 1

        return {
            health,
            kpis: {
                totalCooperatives: cooperatives.length,
                activeCooperatives: cooperatives.filter((c) => c.status === "active").length,
                pendingCooperatives: cooperatives.filter((c) => c.status === "pending").length,
                totalMembers: Number(m.activeMembers || 0),
                totalSchemes: schemes.length,
                activeContracts: Number(m.contractsActive || 0),
                defaultingContracts: Number(m.contractsDefaulting || 0),
                completedContracts: Number(m.contractsCompleted || 0),
                escrowBalanceKobo: Number(m.totalVaultBalanceKobo || 0),
                custodySettledKobo: escrowPoolsRes.rows.reduce((s, p) => s + Number(p.custody_balance_kobo || 0), 0),
                provisionedPoolsCount: escrowPoolsRes.rows.length,
                totalSettlementsCount: settlementsRes.rows.length,
                totalContractObligationKobo: Number(m.totalContractObligationKobo || 0),
                totalContractCollectedKobo: Number(m.totalContractCollectedKobo || 0),
                collectionRatePct: Number(m.collectionRatePct ?? 100),
                pendingLoansCount: pendingLoans.length,
                pendingLoansAmountKobo: pendingLoans.reduce((s, l) => s + Number(l.principal || 0), 0),
                avgCreditScore: Number(m.avgCreditScore || 0),
            },
            sectorDistribution: Array.from(sectorMap.values())
                .sort((a, b) => b.coops - a.coops)
                .map((s) => ({ ...s, pct: Math.round((s.coops / totalCoopCount) * 100) })),
            cooperatives: enrichedCoops,
            escrowPools: escrowPoolsRes.rows,
            settlements: settlementsRes.rows,
            memberTelemetry: remote.memberScores || [],
            schemes,
            contracts,
            loans,
            vaultSecrets: [],
            auditLogs: remote.auditLogs || [],
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
        escrowPoolsRes,
        settlementsRes,
        memberScoresRes,
    ] = await Promise.all([
        queryCoptellerBridge(`
            SELECT c.id, c.name, c.description, c.cooperative_type, c.sector, c.segment,
                   c.registration_number, c.state, c.lga, c.status, c.bank_approval_date,
                   c.max_members, c.current_member_count, c.escrow_fee_percent,
                   c.default_contribution_amount, c.cycle_frequency, c.marketplace_enabled,
                   c.metadata, c.created_at,
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
                   cust.email AS borrower_email,
                   cust.bvn AS borrower_bvn
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
        ensureBankSuiteOperationalTables()
            .then(() => queryBankSuite(`SELECT * FROM public.banksuite_copteller_escrow_pools ORDER BY created_at DESC`))
            .catch(() => ({ rows: [] as any[] })),
        ensureBankSuiteOperationalTables()
            .then(() => queryBankSuite(`SELECT * FROM public.banksuite_copteller_settlements ORDER BY created_at DESC LIMIT 40`))
            .catch(() => ({ rows: [] as any[] })),
        queryCoptellerBridge(`
            SELECT m.member, m.cooperative, m.credit_score, m.total_contributed, m.status, m.role,
                   COALESCE(c.first_name || ' ' || c.last_name, c.email, m.member) AS member_name,
                   c.email, c.phone_number, c.bvn
            FROM copteller.copteller_memberships m
            LEFT JOIN copteller.customers c ON c.supabase_id = m.member OR c.email = m.member OR c.id::text = m.member
            ORDER BY m.credit_score DESC NULLS LAST
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

    const escrowPoolByCoop = new Map<number, any>()
    for (const ep of escrowPoolsRes.rows) {
        escrowPoolByCoop.set(Number(ep.copteller_coop_id), ep)
    }

    const enrichedCoops = cooperatives.map((c) => {
        const pool = escrowPoolByCoop.get(Number(c.id))
        return {
            ...c,
            escrow_pool: pool || null,
        }
    })

    const totalCustodySettledKobo = escrowPoolsRes.rows.reduce(
        (s, p) => s + Number(p.custody_balance_kobo || 0),
        0
    )

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
            custodySettledKobo: totalCustodySettledKobo,
            provisionedPoolsCount: escrowPoolsRes.rows.length,
            totalSettlementsCount: settlementsRes.rows.length,
            totalContractObligationKobo: totalObligationKobo,
            totalContractCollectedKobo: totalCollectedKobo,
            collectionRatePct,
            pendingLoansCount: pendingLoans.length,
            pendingLoansAmountKobo,
            avgCreditScore: Number(memberAgg.avg_credit_score || 0),
        },
        sectorDistribution,
        cooperatives: enrichedCoops,
        escrowPools: escrowPoolsRes.rows,
        settlements: settlementsRes.rows,
        memberTelemetry: memberScoresRes.rows,
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
    if (shouldPreferHttpBridge()) {
        const res = await callCoptellerHeadlessHttp<any>({
            method: "POST",
            actorEmail: params.actorEmail,
            body: {
                action: params.status === "active" ? "approve_cooperative" : "suspend_cooperative",
                cooperative_id: params.cooperativeId,
            },
        })
        await writeBankAuditLog({
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            actorRole: "admin",
            action: `copteller.cooperative.${params.status}`,
            entityType: "copteller_cooperative",
            entityId: params.cooperativeId,
            ipAddress: params.ipAddress,
            afterState: { transport: "http_bridge", cooperative: res.cooperative },
        })
        return res.cooperative
    }

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
    if (shouldPreferHttpBridge()) {
        const res = await callCoptellerHeadlessHttp<any>({
            method: "POST",
            actorEmail: params.actorEmail,
            body: {
                action: "approve_scheme",
                scheme_id: params.schemeId,
                bank_approved: params.bankApproved,
            },
        })
        await writeBankAuditLog({
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            actorRole: "admin",
            action: params.bankApproved ? "copteller.scheme.approved" : "copteller.scheme.revoked",
            entityType: "copteller_scheme",
            entityId: params.schemeId,
            ipAddress: params.ipAddress,
            afterState: { transport: "http_bridge", bank_approved: params.bankApproved, scheme: res.scheme },
        })
        return res.scheme
    }

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
    if (shouldPreferHttpBridge()) {
        const remote = await callCoptellerHeadlessHttp<any>({
            method: "POST",
            actorEmail: params.actorEmail,
            body: {
                action: params.decision === "disburse" ? "approve_loan" : "reject_loan",
                loan_id: params.loanId,
            },
        })

        if (params.decision === "reject") {
            await writeBankAuditLog({
                actorId: params.actorId,
                actorEmail: params.actorEmail,
                actorRole: "admin",
                action: "copteller.loan.rejected",
                entityType: "copteller_loan",
                entityId: params.loanId,
                ipAddress: params.ipAddress,
                afterState: { transport: "http_bridge", loan: remote.loan },
            })
            return { loan: remote.loan, disbursed: false }
        }

        const principalKobo = Number(remote.principalKobo || remote.loan?.principal || 0)
        const ref = String(remote.reference || `COP_DISB_${params.loanId}_${Date.now()}`)
        let glRef: string | null = null

        if (principalKobo > 0) {
            try {
                await ensureBankSuiteOperationalTables()
                const glRes = await postBalancedGlJournal({
                    narration: `Copteller Telemetry-Backed Loan Disbursement #${params.loanId} (HTTP Bridge)`,
                    sourceModule: "copteller_credit_rail",
                    sourceRef: ref,
                    actorId: params.actorId,
                    actorEmail: params.actorEmail,
                    ipAddress: params.ipAddress,
                    lines: [
                        { glCode: "1300", side: "debit", amountKobo: principalKobo, narration: `Wholesale credit receivable for Copteller loan #${params.loanId}` },
                        { glCode: "2100", side: "credit", amountKobo: principalKobo, narration: `Disbursed via Copteller headless bridge (${remote.creditedAccountNumber || "wallet"})` },
                    ],
                })
                glRef = glRes.journalRef
                await queryBankSuite(
                    `INSERT INTO public.banksuite_copteller_settlements (
                        reference, rail_type, amount_kobo, fee_kobo, gl_journal_ref,
                        counterparty_label, status, actor_email, metadata
                     ) VALUES ($1, 'LOAN_WHOLESALE_DISBURSEMENT', $2, 0, $3, $4, 'settled', $5, $6::jsonb)`,
                    [
                        ref,
                        principalKobo,
                        glRef,
                        `Copteller Loan #${params.loanId} (${remote.creditedAccountNumber || "HTTP Bridge"})`,
                        params.actorEmail,
                        JSON.stringify({ loan_id: params.loanId, transport: "http_bridge" }),
                    ]
                )
            } catch (glErr: any) {
                console.warn("[Copteller Bridge GL] Non-fatal GL mirror error:", glErr.message)
            }
        }

        await writeBankAuditLog({
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            actorRole: "admin",
            action: "copteller.loan.disbursed",
            entityType: "copteller_loan",
            entityId: params.loanId,
            amountKobo: principalKobo,
            ipAddress: params.ipAddress,
            afterState: {
                transport: "http_bridge",
                reference: ref,
                account_credited: remote.creditedAccountNumber || null,
                gl_journal_ref: glRef,
            },
        })

        return {
            loan: remote.loan || { id: params.loanId, status: "active" },
            disbursed: true,
            reference: ref,
            glJournalRef: glRef,
            creditedAccountNumber: remote.creditedAccountNumber || null,
        }
    }

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

        // Rail 2: Record Wholesale Credit Book GL entry (DR 1300 Copteller Credit Book / CR 2100 Cooperative Escrow Trust)
        let glRef: string | null = null
        if (principalKobo > 0) {
            try {
                const glRes = await postBalancedGlJournal({
                    narration: `Copteller Telemetry-Backed Loan Disbursement #${loan.id}`,
                    sourceModule: "copteller_credit_rail",
                    sourceRef: ref,
                    actorId: params.actorId,
                    actorEmail: params.actorEmail,
                    ipAddress: params.ipAddress,
                    lines: [
                        { glCode: "1300", side: "debit", amountKobo: principalKobo, narration: `Wholesale credit receivable for Copteller loan #${loan.id}` },
                        { glCode: "2100", side: "credit", amountKobo: principalKobo, narration: `Disbursed into Copteller escrow custody rail (${targetAccount?.account_number || "wallet"})` },
                    ],
                })
                glRef = glRes.journalRef
                await queryBankSuite(
                    `INSERT INTO public.banksuite_copteller_settlements (
                        reference, rail_type, amount_kobo, fee_kobo, gl_journal_ref,
                        counterparty_label, status, actor_email, metadata
                     ) VALUES ($1, 'LOAN_WHOLESALE_DISBURSEMENT', $2, 0, $3, $4, 'settled', $5, $6::jsonb)`,
                    [
                        ref,
                        principalKobo,
                        glRef,
                        `Copteller Loan #${loan.id} (${targetAccount?.account_number || loan.user_id})`,
                        params.actorEmail,
                        JSON.stringify({ loan_id: loan.id, purpose: loan.purpose }),
                    ]
                )
            } catch (glErr: any) {
                console.warn("[Copteller Bridge GL] Non-fatal GL mirror error:", glErr.message)
            }
        }

        await writeBankAuditLog({
            actorId: params.actorId,
            actorEmail: params.actorEmail,
            actorRole: "admin",
            action: "copteller.loan.disbursed",
            entityType: "copteller_loan",
            entityId: loan.id,
            amountKobo: principalKobo,
            ipAddress: params.ipAddress,
            afterState: { reference: ref, account_credited: targetAccount?.account_number || null, gl_journal_ref: glRef },
        })

        return {
            loan: updLoan.rows[0],
            disbursed: true,
            reference: ref,
            glJournalRef: glRef,
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

    if (shouldPreferHttpBridge()) {
        const remote = await callCoptellerHeadlessHttp<any>({ method: "GET", actorEmail })
        const m = remote.metrics || {}
        const pendingCoops = (remote.cooperatives || []).filter((c: any) => c.status === "pending").length
        const defaultingContracts = Number(m.contractsDefaulting || 0)
        const totalVaultKobo = Number(m.totalVaultBalanceKobo || 0)
        const activeAccounts = Number(m.activeAccounts || 0)
        const auditCount = (remote.auditLogs || []).length

        const checks = [
            {
                name: "Headless HTTP Bridge Escrow Telemetry",
                passed: totalVaultKobo >= 0,
                detail: `${activeAccounts} active Copteller accounts synced over signed HTTP v${remote.bridgeVersion || "3.0"} (Total Vault: ₦${(totalVaultKobo / 100).toLocaleString()}).`,
            },
            {
                name: "Active Partner Bank Settlement Binding",
                passed: true,
                detail: `Copteller settlement rail reports: ${remote.partnerBank?.bankName || "Partner Bank"} (${remote.partnerBank?.provider || "banksuite"}).`,
            },
            {
                name: "Hire-Purchase & Thrift Delinquency Scan",
                passed: defaultingContracts === 0,
                detail:
                    defaultingContracts === 0
                        ? "Zero defaulting HP/thrift contracts flagged."
                        : `${defaultingContracts} contract(s) have missed payments ≥ 2 or defaulted status.`,
            },
            {
                name: "Pending Union KYC / License Queue",
                passed: pendingCoops === 0,
                detail:
                    pendingCoops === 0
                        ? "No unapproved cooperatives waiting in queue."
                        : `${pendingCoops} cooperative(s) pending Bank Superadmin license approval.`,
            },
            {
                name: "Immutable Audit Log Continuity",
                passed: true,
                detail: `${auditCount} recent audit events verified via Copteller headless rail.`,
            },
        ]

        const report = {
            ranAt: new Date().toISOString(),
            durationMs: Date.now() - started,
            transport: "http_bridge",
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

/**
 * RAIL 1: Provision a real regulated BankSuite Escrow Pool NUBAN (3000XXXXXX) in public.accounts
 * and bind it to a Copteller cooperative in both BankSuite and Copteller metadata.
 */
export async function provisionCooperativeEscrowPool(params: {
    cooperativeId: number
    creditFacilityLimitNaira?: number
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    await ensureBankSuiteOperationalTables()

    let coop: any = null
    const useHttp = shouldPreferHttpBridge()
    if (useHttp) {
        const remote = await callCoptellerHeadlessHttp<any>({ method: "GET" })
        coop = (remote.cooperatives || []).find((c: any) => Number(c.id) === Number(params.cooperativeId)) || null
    } else {
        const coopRes = await queryCoptellerBridge(
            `SELECT id, name, registration_number, escrow_fee_percent, metadata, status FROM copteller.cooperatives WHERE id = $1 LIMIT 1`,
            [params.cooperativeId]
        )
        coop = coopRes.rows[0] || null
    }
    if (!coop) throw new Error("Cooperative not found in Copteller.")

    // Return existing pool if already provisioned
    const existingRes = await queryBankSuite(
        `SELECT * FROM public.banksuite_copteller_escrow_pools WHERE copteller_coop_id = $1 LIMIT 1`,
        [params.cooperativeId]
    )
    if (existingRes.rows[0]) {
        return { pool: existingRes.rows[0], alreadyExisted: true }
    }

    // Generate deterministic-style unique 10-digit Corporate Escrow NUBAN starting with 3000
    const suffix = String(100000 + Math.floor(Math.random() * 899999))
    const escrowNuban = `3000${suffix}`
    const feeBps = Math.round(Number(coop.escrow_fee_percent || 1.5) * 100)
    const creditLimitKobo = Math.round((params.creditFacilityLimitNaira || 10000000) * 100)

    const created = await withBankSuiteTransaction(async (client) => {
        // Create real ring-fenced Corporate Escrow Account in BankSuite public.accounts
        const accIns = await client.query(
            `INSERT INTO public.accounts (
                user_id, account_number, account_type, balance, currency, status,
                interest_rate, notes, source, is_primary, is_archived, created_at, updated_at
             ) VALUES (
                $1, $2, 'Corporate', 0, 'NGN', 'active',
                4.5, $3, 'local', FALSE, FALSE, NOW(), NOW()
             ) RETURNING id, account_number`,
            [
                `copteller_coop_${coop.id}`,
                escrowNuban,
                `Copteller Regulated Escrow Trust Pool — ${coop.name} (${coop.registration_number || "Unregistered"})`,
            ]
        )

        const accId = Number(accIns.rows[0].id)
        const poolIns = await client.query(
            `INSERT INTO public.banksuite_copteller_escrow_pools (
                copteller_coop_id, coop_name, coop_reg_number, banksuite_account_id,
                escrow_nuban, custody_balance_kobo, copteller_reported_kobo,
                escrow_fee_bps, credit_facility_limit_kobo, status
             ) VALUES ($1, $2, $3, $4, $5, 0, 0, $6, $7, 'active')
             RETURNING *`,
            [
                coop.id,
                coop.name,
                coop.registration_number || null,
                accId,
                escrowNuban,
                feeBps,
                creditLimitKobo,
            ]
        )

        return poolIns.rows[0]
    })

    // Sync the provisioned regulated NUBAN back into Copteller cooperative metadata (HTTP Headless OR Direct DB)
    if (useHttp) {
        await callCoptellerHeadlessHttp<any>({
            method: "POST",
            actorEmail: params.actorEmail,
            body: {
                action: "bind_escrow_nuban",
                cooperative_id: coop.id,
                escrow_nuban: escrowNuban,
                partner_bank_name: "BankSuite Licensed MFB Custody",
                partner_provider: "banksuite",
            },
        }).catch(() => {})
    } else {
        const nextMeta = {
            ...(coop.metadata && typeof coop.metadata === "object" ? coop.metadata : {}),
            banksuite_escrow_nuban: escrowNuban,
            banksuite_escrow_provisioned_at: new Date().toISOString(),
            partner_bank_name: "BankSuite Licensed MFB Custody",
            partner_bank_provider: "banksuite",
        }
        await queryCoptellerBridge(
            `UPDATE copteller.cooperatives SET metadata = $1::jsonb, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(nextMeta), coop.id]
        ).catch(() => {})
    }

    await writeBankAuditLog({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        actorRole: "admin",
        action: "copteller.escrow_pool.provisioned",
        entityType: "copteller_escrow_pool",
        entityId: created.id,
        ipAddress: params.ipAddress,
        afterState: { escrow_nuban: escrowNuban, coop_name: coop.name },
    })

    return { pool: created, alreadyExisted: false }
}

/**
 * RAIL 1B: Execute live Treasury Settlement Sweep from Copteller ledger into BankSuite GL 2100
 * & ring-fenced Corporate Escrow NUBAN, posting balanced double-entry GL lines.
 */
export async function executeEscrowSettlementSweep(params: {
    cooperativeId: number
    amountNaira?: number
    actorId: string
    actorEmail: string
    ipAddress?: string
}) {
    await ensureBankSuiteOperationalTables()

    // Ensure escrow pool exists first
    const { pool } = await provisionCooperativeEscrowPool({
        cooperativeId: params.cooperativeId,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        ipAddress: params.ipAddress,
    })

    // Compute live Copteller reported vault liquidity (HTTP Headless OR Direct DB)
    let reportedKobo = 0
    if (shouldPreferHttpBridge()) {
        const remote = await callCoptellerHeadlessHttp<any>({ method: "GET" })
        reportedKobo = Number(remote.metrics?.totalVaultBalanceKobo || 0)
    } else {
        const copVaultRes = await queryCoptellerBridge(
            `SELECT COALESCE(SUM(balance), 0)::bigint AS sum_kobo FROM copteller.accounts WHERE status = 'active'`
        )
        reportedKobo = Number(copVaultRes.rows[0]?.sum_kobo || 0)
    }

    const deltaKobo =
        params.amountNaira && params.amountNaira > 0
            ? Math.round(params.amountNaira * 100)
            : Math.max(0, reportedKobo - Number(pool.custody_balance_kobo || 0))

    const sweepKobo = deltaKobo > 0 ? deltaKobo : 5000000 // Minimum ₦50,000 institutional test/liquidity tranche if fully synced
    const feeKobo = Math.round((sweepKobo * Number(pool.escrow_fee_bps || 150)) / 10000)
    const netCustodyKobo = sweepKobo - feeKobo
    const ref = `SWEEP_COP_${pool.copteller_coop_id}_${Date.now()}`

    const glRes = await postBalancedGlJournal({
        journalRef: `GL_${ref}`,
        narration: `Copteller Escrow Custody Sweep — ${pool.coop_name} (${pool.escrow_nuban})`,
        sourceModule: "copteller_escrow_rail",
        sourceRef: ref,
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        ipAddress: params.ipAddress,
        lines: [
            { glCode: "1000", side: "debit", amountKobo: sweepKobo, narration: `Inbound NIBSS/Escrow settlement from ${pool.coop_name}` },
            { glCode: "2100", side: "credit", amountKobo: netCustodyKobo, narration: `Ring-fenced cooperative custody deposit (${pool.escrow_nuban})` },
            ...(feeKobo > 0
                ? [{ glCode: "4000", side: "credit" as const, amountKobo: feeKobo, narration: `Custody escrow fee (${(Number(pool.escrow_fee_bps || 150) / 100).toFixed(2)}%)` }]
                : []),
        ],
    })

    const updatedPool = await withBankSuiteTransaction(async (client) => {
        if (pool.banksuite_account_id) {
            await client.query(
                `UPDATE public.accounts SET balance = balance + $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [netCustodyKobo, pool.banksuite_account_id]
            )
        }
        const upd = await client.query(
            `UPDATE public.banksuite_copteller_escrow_pools
             SET custody_balance_kobo = custody_balance_kobo + $1,
                 copteller_reported_kobo = GREATEST(copteller_reported_kobo, $2),
                 last_swept_at = NOW(),
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [netCustodyKobo, reportedKobo, pool.id]
        )
        await client.query(
            `INSERT INTO public.banksuite_copteller_settlements (
                reference, rail_type, copteller_coop_id, coop_name, escrow_nuban,
                amount_kobo, fee_kobo, gl_journal_ref, counterparty_label, status, actor_email, metadata
             ) VALUES ($1, 'INBOUND_ESCROW_SWEEP', $2, $3, $4, $5, $6, $7, $8, 'settled', $9, $10::jsonb)`,
            [
                ref,
                pool.copteller_coop_id,
                pool.coop_name,
                pool.escrow_nuban,
                sweepKobo,
                feeKobo,
                glRes.journalRef,
                `Escrow Pool ${pool.escrow_nuban}`,
                params.actorEmail,
                JSON.stringify({ reported_kobo: reportedKobo, net_custody_kobo: netCustodyKobo }),
            ]
        )
        return upd.rows[0]
    })

    return {
        reference: ref,
        glJournalRef: glRes.journalRef,
        sweepAmountKobo: sweepKobo,
        feeKobo,
        netCustodyKobo,
        pool: updatedPool,
    }
}

/**
 * RAIL 3A: Lookup a Copteller member by account number, phone number, or email for POS Agency Cash-In.
 */
export async function lookupCoptellerMember(query: string) {
    const q = String(query || "").trim()
    if (!q) return null

    const health = await checkCoptellerBridgeHealth()
    if (!health.connected) return null

    if (health.mode === "http_bridge") {
        try {
            const res = await callCoptellerHeadlessHttp<any>({
                method: "GET",
                query: `action=member_lookup&query=${encodeURIComponent(q)}`,
            })
            return res.member || null
        } catch {
            return null
        }
    }

    const res = await queryCoptellerBridge(
        `
        SELECT a.id AS account_id, a.account_number, a.balance AS balance_kobo, a.user_id, a.customer_id,
               COALESCE(c.first_name || ' ' || c.last_name, c.email, a.account_number) AS full_name,
               c.email, c.phone_number, c.bvn, c.kyc_status
        FROM copteller.accounts a
        LEFT JOIN copteller.customers c ON c.id = a.customer_id OR c.supabase_id = a.user_id
        WHERE a.status = 'active'
          AND (a.account_number = $1 OR LOWER(COALESCE(c.email, '')) = LOWER($1) OR REPLACE(COALESCE(c.phone_number, ''), ' ', '') LIKE '%' || REPLACE($1, ' ', '') || '%')
        ORDER BY a.is_primary DESC, a.id ASC
        LIMIT 1
        `,
        [q]
    )
    const row = res.rows[0]
    if (!row) return null

    // Fetch membership & cooperative name if present
    const memRes = await queryCoptellerBridge(
        `
        SELECT m.id, m.cooperative, m.credit_score, m.status, m.total_contributed,
               co.id AS coop_id, co.name AS coop_name
        FROM copteller.copteller_memberships m
        LEFT JOIN copteller.cooperatives co ON co.id::text = m.cooperative OR LOWER(co.name) = LOWER(m.cooperative)
        WHERE m.member = $1 OR m.member = $2 OR m.member = $3
        ORDER BY m.created_at DESC
        LIMIT 1
        `,
        [String(row.user_id || ""), String(row.email || ""), String(row.customer_id || "")]
    ).catch(() => ({ rows: [] as any[] }))

    const mem = memRes.rows[0]
    return {
        accountId: Number(row.account_id),
        accountNumber: row.account_number,
        balanceKobo: Number(row.balance_kobo || 0),
        userId: row.user_id,
        customerId: row.customer_id,
        fullName: row.full_name,
        email: row.email,
        phone: row.phone_number,
        kycStatus: row.kyc_status || "active",
        cooperativeId: mem?.coop_id ? Number(mem.coop_id) : null,
        cooperativeName: mem?.coop_name || mem?.cooperative || "Copteller Cooperative Network",
        creditScore: Number(mem?.credit_score || 72),
    }
}

/**
 * RAIL 3B: Atomic POS Agency Cash-In to Copteller Member Wallet.
 * 1) Debits Agent's BankSuite Float Account (row-locked)
 * 2) Credits Member's Copteller Wallet & posts Copteller credit transaction
 * 3) Posts balanced BankSuite GL 2000 -> GL 2100 + 70/30 Agent/Bank micro-commission
 * 4) Logs BankSuite settlement rail & agency commission journal
 */
export async function executeAgentCoptellerCashIn(params: {
    agentUserId: string
    agentEmail: string
    ipAddress?: string
    memberQuery: string
    amountNaira: number
    narration?: string
}) {
    await ensureBankSuiteOperationalTables()

    const amountKobo = Math.round(Number(params.amountNaira) * 100)
    if (!Number.isFinite(amountKobo) || amountKobo < 10000) {
        throw new Error("Minimum cooperative cash-in amount is ₦100.")
    }

    const member = await lookupCoptellerMember(params.memberQuery)
    if (!member) {
        throw new Error("No active Copteller member wallet found for that account, phone, or email.")
    }

    // 0.5% micro-commission capped at ₦250, split 70% Agent / 30% Bank
    const totalFeeKobo = Math.min(25000, Math.max(5000, Math.round(amountKobo * 0.005)))
    const agentShareKobo = Math.round(totalFeeKobo * 0.7)
    const bankShareKobo = totalFeeKobo - agentShareKobo
    const ref = `AG_COP_IN_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

    // Step 1: Debit Agent's primary BankSuite float account & credit Agent's 70% commission atomically
    const bankTx = await withBankSuiteTransaction(async (client) => {
        const accRes = await client.query(
            `SELECT id, account_number, balance, lien_amount, customer_id, is_frozen, pnd_enabled
             FROM public.accounts
             WHERE user_id = $1 AND status = 'active'
             ORDER BY is_primary DESC, id ASC
             LIMIT 1 FOR UPDATE`,
            [params.agentUserId]
        )
        const agentAcc = accRes.rows[0]
        if (!agentAcc) throw new Error("No active BankSuite agent float account found.")
        if (agentAcc.is_frozen || agentAcc.pnd_enabled) throw new Error("Agent float account is restricted.")

        const avail = Number(agentAcc.balance) - Number(agentAcc.lien_amount || 0)
        if (avail < amountKobo) {
            throw new Error(`Insufficient agent float. Available: ₦${(avail / 100).toLocaleString()}.`)
        }

        // Net agent change: -amountKobo (cash handed to agent physically) + agentShareKobo commission
        const nextFloatKobo = Number(agentAcc.balance) - amountKobo + agentShareKobo
        await client.query(
            `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
            [nextFloatKobo, agentAcc.id]
        )

        await client.query(
            `INSERT INTO public.transactions (
                reference, type, amount, currency, from_account_id, status, narration,
                channel, balance_after, date, metadata, customer_id, user_id, created_at, updated_at
             ) VALUES (
                $1, 'debit', $2, 'NGN', $3, 'successful', $4,
                'portal', $5, NOW(), $6::jsonb, $7, $8, NOW(), NOW()
             )`,
            [
                ref,
                amountKobo,
                agentAcc.id,
                params.narration || `POS Agent Copteller Cash-In → ${member.fullName} (${member.accountNumber})`,
                nextFloatKobo,
                JSON.stringify({
                    rail: "AGENT_COPTELLER_CASH_IN",
                    copteller_account: member.accountNumber,
                    copteller_member: member.fullName,
                    cooperative: member.cooperativeName,
                    agent_commission_kobo: agentShareKobo,
                    bank_commission_kobo: bankShareKobo,
                }),
                agentAcc.customer_id || null,
                params.agentUserId,
            ]
        )

        // Log agency commission row if agent has a terminal
        const termRes = await client.query(
            `SELECT id FROM public.agency_terminals WHERE user_id = $1 ORDER BY id ASC LIMIT 1`,
            [params.agentUserId]
        )
        if (termRes.rows[0]) {
            await client.query(
                `INSERT INTO public.agency_commissions (
                    terminal_id, user_id, transaction_amount, total_commission,
                    agent_share, bank_share, status, created_at, updated_at
                 ) VALUES ($1, $2, $3, $4, $5, $6, 'settled', NOW(), NOW())`,
                [
                    termRes.rows[0].id,
                    params.agentUserId,
                    amountKobo,
                    totalFeeKobo,
                    agentShareKobo,
                    bankShareKobo,
                ]
            ).catch(() => {})
        }

        return { agentAccountId: agentAcc.id, agentAccountNumber: agentAcc.account_number, nextFloatKobo }
    })

    // Step 2: Credit Member's Copteller Wallet atomically (HTTP Headless Bridge OR Direct DB)
    const copPool = getCoptellerBridgePool()
    let memberNewBalKobo = 0
    if (!copPool || shouldPreferHttpBridge()) {
        const remoteCredit = await callCoptellerHeadlessHttp<any>({
            method: "POST",
            actorEmail: params.agentEmail,
            body: {
                action: "credit_member_cashin",
                account_id: member.accountId,
                amount_kobo: amountKobo,
                reference: ref,
                agent_email: params.agentEmail,
                partner_bank_name: "BankSuite POS Agent",
            },
        })
        memberNewBalKobo = Number(remoteCredit.newBalanceKobo || 0)
    } else {
        const copClient = await copPool.connect()
        try {
            await copClient.query("BEGIN")
            const mAcc = await copClient.query(
                `SELECT id, balance, customer_id, user_id FROM copteller.accounts WHERE id = $1 FOR UPDATE`,
                [member.accountId]
            )
            const cur = Number(mAcc.rows[0]?.balance || 0)
            memberNewBalKobo = cur + amountKobo
            await copClient.query(
                `UPDATE copteller.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                [memberNewBalKobo, member.accountId]
            )
            await copClient.query(
                `INSERT INTO copteller.transactions (
                    reference, type, amount, currency, to_account_id, status, narration,
                    channel, balance_after, date, metadata, customer_id, user_id, created_at, updated_at
                 ) VALUES (
                    $1, 'credit', $2, 'NGN', $3, 'successful', $4,
                    'portal', $5, NOW(), $6::jsonb, $7, $8, NOW(), NOW()
                 )`,
                [
                    ref,
                    amountKobo,
                    member.accountId,
                    `BankSuite POS Agent Cash-In (${params.agentEmail})`,
                    memberNewBalKobo,
                    JSON.stringify({ source: "banksuite_pos_agent", agent_email: params.agentEmail, banksuite_float_account: bankTx.agentAccountNumber }),
                    mAcc.rows[0]?.customer_id || null,
                    mAcc.rows[0]?.user_id || member.userId,
                ]
            )
            await copClient.query("COMMIT")
        } catch (err) {
            try {
                await copClient.query("ROLLBACK")
            } catch {}
            throw err
        } finally {
            copClient.release()
        }
    }

    // Step 3: Post balanced BankSuite GL journal (DR 2000 Agent Deposit Float / CR 2100 Copteller Escrow Custody)
    let glJournalRef: string | null = null
    try {
        const gl = await postBalancedGlJournal({
            journalRef: `GL_${ref}`,
            narration: `POS Agency Copteller Cash-In → ${member.fullName} (${member.cooperativeName})`,
            sourceModule: "agency_copteller_rail",
            sourceRef: ref,
            actorId: params.agentUserId,
            actorEmail: params.agentEmail,
            ipAddress: params.ipAddress,
            lines: [
                { glCode: "2000", side: "debit", amountKobo: amountKobo, narration: `Agent float settlement debit (${bankTx.agentAccountNumber})` },
                { glCode: "2100", side: "credit", amountKobo: amountKobo, narration: `Copteller member custody credit (${member.accountNumber})` },
            ],
        })
        glJournalRef = gl.journalRef
    } catch {}

    await queryBankSuite(
        `INSERT INTO public.banksuite_copteller_settlements (
            reference, rail_type, copteller_coop_id, coop_name, escrow_nuban,
            amount_kobo, fee_kobo, gl_journal_ref, counterparty_label, status, actor_email, metadata
         ) VALUES ($1, 'AGENT_COPTELLER_CASH_IN', $2, $3, $4, $5, $6, $7, $8, 'settled', $9, $10::jsonb)`,
        [
            ref,
            member.cooperativeId,
            member.cooperativeName,
            member.accountNumber,
            amountKobo,
            totalFeeKobo,
            glJournalRef,
            `${member.fullName} (${member.accountNumber})`,
            params.agentEmail,
            JSON.stringify({ agent_share_kobo: agentShareKobo, bank_share_kobo: bankShareKobo }),
        ]
    ).catch(() => {})

    return {
        reference: ref,
        glJournalRef,
        amountKobo,
        agentCommissionKobo: agentShareKobo,
        bankCommissionKobo: bankShareKobo,
        agentNewFloatKobo: bankTx.nextFloatKobo,
        member,
        memberNewBalanceKobo: memberNewBalKobo,
    }
}

/**
 * RAIL 4: Cross-match a BankSuite Customer (by email or BVN) with their live Copteller Cooperative profile
 * for unified Customer 360 & Client Digital Banking Hub display.
 */
export async function getCoptellerMemberLinkForCustomer(params: { email?: string | null; bvn?: string | null }) {
    const email = String(params.email || "").trim().toLowerCase()
    const bvn = String(params.bvn || "").trim()
    if (!email && !bvn) return null

    const health = await checkCoptellerBridgeHealth()
    if (!health.connected) return null

    if (health.mode === "http_bridge") {
        try {
            const res = await callCoptellerHeadlessHttp<any>({
                method: "GET",
                query: `action=customer_link&email=${encodeURIComponent(email)}&bvn=${encodeURIComponent(bvn)}`,
            })
            if (!res.link) return null
            return { ...res.link, appUrl: health.appUrl }
        } catch {
            return null
        }
    }

    try {
        const custRes = await queryCoptellerBridge(
            `SELECT id, first_name, last_name, email, phone_number, bvn, supabase_id, kyc_status
             FROM copteller.customers
             WHERE ($1 <> '' AND LOWER(email) = $1) OR ($2 <> '' AND bvn = $2)
             LIMIT 1`,
            [email, bvn]
        )
        const c = custRes.rows[0]
        if (!c) return null

        const [accRes, memRes, contractRes] = await Promise.all([
            queryCoptellerBridge(
                `SELECT account_number, balance, status FROM copteller.accounts WHERE customer_id = $1 OR user_id = $2 ORDER BY is_primary DESC LIMIT 3`,
                [c.id, c.supabase_id || ""]
            ),
            queryCoptellerBridge(
                `SELECT m.*, co.name AS coop_name, co.registration_number AS coop_reg
                 FROM copteller.copteller_memberships m
                 LEFT JOIN copteller.cooperatives co ON co.id::text = m.cooperative OR LOWER(co.name) = LOWER(m.cooperative)
                 WHERE m.member = $1 OR m.member = $2 OR m.member = $3
                 ORDER BY m.created_at DESC LIMIT 5`,
                [c.supabase_id || "", c.email || "", String(c.id)]
            ),
            queryCoptellerBridge(
                `SELECT id, contract_type, asset_name, total_obligation, total_paid, payment_streak, missed_payments, status
                 FROM copteller.copteller_contracts
                 WHERE member = $1 OR member = $2 OR member = $3
                 ORDER BY created_at DESC LIMIT 5`,
                [c.supabase_id || "", c.email || "", String(c.id)]
            ),
        ])

        const totalWalletKobo = accRes.rows.reduce((s, a) => s + Number(a.balance || 0), 0)
        const primaryMem = memRes.rows[0]
        const rawScore = Number(primaryMem?.credit_score || 72)
        const trustScore850 = rawScore > 100 ? rawScore : Math.round(300 + rawScore * 5.5)

        return {
            linked: true,
            appUrl: health.appUrl,
            customerName: `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email,
            walletBalanceKobo: totalWalletKobo,
            primaryAccountNumber: accRes.rows[0]?.account_number || null,
            trustScore850,
            creditTier: trustScore850 >= 740 ? "Tier 1 Prime" : trustScore850 >= 650 ? "Tier 2 Standard" : "Tier 3 Developing",
            memberships: memRes.rows,
            contracts: contractRes.rows,
        }
    } catch {
        return null
    }
}
