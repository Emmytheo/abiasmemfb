import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg"

const g = globalThis as typeof globalThis & {
    __banksuiteOpsPool?: Pool
    __banksuiteOpsTablesReady?: boolean
    __banksuiteOpsInitPromise?: Promise<void>
}

export function getBankSuitePool(): Pool {
    const connString = process.env.DATABASE_URI || process.env.POSTGRES_URL
    if (!connString) {
        throw new Error("DATABASE_URI or POSTGRES_URL is not configured.")
    }

    if (!g.__banksuiteOpsPool) {
        const isLocal =
            connString.includes("localhost") || connString.includes("127.0.0.1")
        g.__banksuiteOpsPool = new Pool({
            connectionString: connString,
            max: 10,
            connectionTimeoutMillis: 8000,
            idleTimeoutMillis: 30000,
            ssl: isLocal ? undefined : { rejectUnauthorized: false },
        })

        g.__banksuiteOpsPool.on("error", (err) => {
            console.warn("[BankSuite PG Pool] Client error, recycling pool:", err.message)
            try {
                g.__banksuiteOpsPool?.end().catch(() => {})
            } catch {}
            g.__banksuiteOpsPool = undefined
            g.__banksuiteOpsTablesReady = false
        })
    }

    return g.__banksuiteOpsPool
}

export async function queryBankSuite<R extends QueryResultRow = any>(
    text: string,
    params?: any[]
): Promise<QueryResult<R>> {
    const pool = getBankSuitePool()
    return pool.query<R>(text, params)
}

export async function withBankSuiteTransaction<T>(
    fn: (client: PoolClient) => Promise<T>
): Promise<T> {
    const pool = getBankSuitePool()
    const client = await pool.connect()
    try {
        await client.query("BEGIN")
        const result = await fn(client)
        await client.query("COMMIT")
        return result
    } catch (err) {
        try {
            await client.query("ROLLBACK")
        } catch {}
        throw err
    } finally {
        client.release()
    }
}

/**
 * Idempotently provisions BankSuite operational tables required for production banking,
 * audit logging, maker-checker approvals, SME invoicing, bulk payroll, team RBAC,
 * personal savings goals, webhook delivery logs, funding requests, and user security prefs.
 */
export async function ensureBankSuiteOperationalTables(): Promise<void> {
    if (g.__banksuiteOpsTablesReady) return
    if (g.__banksuiteOpsInitPromise) {
        return g.__banksuiteOpsInitPromise
    }

    g.__banksuiteOpsInitPromise = (async () => {
        const pool = getBankSuitePool()
        await pool.query(`
            CREATE TABLE IF NOT EXISTS public.banksuite_audit_logs (
                id BIGSERIAL PRIMARY KEY,
                actor_id TEXT NOT NULL,
                actor_email TEXT,
                actor_role TEXT NOT NULL DEFAULT 'user',
                action TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                entity_id TEXT,
                amount_kobo BIGINT,
                status TEXT NOT NULL DEFAULT 'success',
                ip_address TEXT,
                before_state JSONB,
                after_state JSONB,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_audit_created ON public.banksuite_audit_logs (created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_bs_audit_action ON public.banksuite_audit_logs (action);
            CREATE INDEX IF NOT EXISTS idx_bs_audit_actor ON public.banksuite_audit_logs (actor_id);

            CREATE TABLE IF NOT EXISTS public.banksuite_approval_queue (
                id BIGSERIAL PRIMARY KEY,
                request_type TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                amount_kobo BIGINT DEFAULT 0,
                payload JSONB NOT NULL DEFAULT '{}'::jsonb,
                status TEXT NOT NULL DEFAULT 'pending',
                requested_by_id TEXT NOT NULL,
                requested_by_email TEXT,
                reviewed_by_id TEXT,
                reviewed_by_email TEXT,
                review_notes TEXT,
                reviewed_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_approvals_status ON public.banksuite_approval_queue (status, created_at DESC);

            CREATE TABLE IF NOT EXISTS public.banksuite_user_preferences (
                user_id TEXT PRIMARY KEY,
                two_factor_enabled BOOLEAN NOT NULL DEFAULT TRUE,
                biometric_enabled BOOLEAN NOT NULL DEFAULT FALSE,
                daily_transfer_limit_kobo BIGINT NOT NULL DEFAULT 50000000,
                dual_auth_threshold_kobo BIGINT NOT NULL DEFAULT 100000000,
                require_dual_auth BOOLEAN NOT NULL DEFAULT TRUE,
                api_ip_whitelist TEXT DEFAULT '',
                strict_coop_kyc BOOLEAN NOT NULL DEFAULT TRUE,
                public_coop_invites BOOLEAN NOT NULL DEFAULT FALSE,
                compact_mode BOOLEAN NOT NULL DEFAULT FALSE,
                exact_decimals BOOLEAN NOT NULL DEFAULT TRUE,
                timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
                email_receipts BOOLEAN NOT NULL DEFAULT TRUE,
                sms_alerts BOOLEAN NOT NULL DEFAULT TRUE,
                webhook_failure_alerts BOOLEAN NOT NULL DEFAULT TRUE,
                rotation_turn_alerts BOOLEAN NOT NULL DEFAULT TRUE,
                transaction_pin_hash TEXT,
                transaction_pin_salt TEXT,
                pin_updated_at TIMESTAMPTZ,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS public.banksuite_business_invoices (
                id BIGSERIAL PRIMARY KEY,
                invoice_number TEXT NOT NULL UNIQUE,
                user_id TEXT NOT NULL,
                merchant_id INTEGER,
                client_name TEXT NOT NULL,
                client_email TEXT,
                description TEXT,
                amount_kobo BIGINT NOT NULL,
                currency TEXT NOT NULL DEFAULT 'NGN',
                status TEXT NOT NULL DEFAULT 'unpaid',
                due_date TIMESTAMPTZ,
                paid_at TIMESTAMPTZ,
                payment_reference TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_invoices_user ON public.banksuite_business_invoices (user_id, created_at DESC);

            CREATE TABLE IF NOT EXISTS public.banksuite_merchant_team (
                id BIGSERIAL PRIMARY KEY,
                owner_user_id TEXT NOT NULL,
                merchant_id INTEGER,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'Cashier',
                status TEXT NOT NULL DEFAULT 'Pending',
                invited_by_email TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                UNIQUE(owner_user_id, email)
            );
            CREATE INDEX IF NOT EXISTS idx_bs_team_owner ON public.banksuite_merchant_team (owner_user_id);

            CREATE TABLE IF NOT EXISTS public.banksuite_payroll_batches (
                id BIGSERIAL PRIMARY KEY,
                batch_reference TEXT NOT NULL UNIQUE,
                user_id TEXT NOT NULL,
                source_account_id INTEGER NOT NULL,
                batch_name TEXT NOT NULL,
                total_employees INTEGER NOT NULL DEFAULT 0,
                total_amount_kobo BIGINT NOT NULL DEFAULT 0,
                total_fees_kobo BIGINT NOT NULL DEFAULT 0,
                succeeded_count INTEGER NOT NULL DEFAULT 0,
                failed_count INTEGER NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'completed',
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_payroll_user ON public.banksuite_payroll_batches (user_id, created_at DESC);

            CREATE TABLE IF NOT EXISTS public.banksuite_payroll_items (
                id BIGSERIAL PRIMARY KEY,
                batch_id BIGINT NOT NULL REFERENCES public.banksuite_payroll_batches(id) ON DELETE CASCADE,
                employee_name TEXT NOT NULL,
                account_number TEXT NOT NULL,
                bank_name TEXT NOT NULL,
                bank_code TEXT,
                amount_kobo BIGINT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                transaction_reference TEXT,
                error_message TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS public.banksuite_personal_savings_plans (
                id BIGSERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                deduction_amount_kobo BIGINT NOT NULL,
                target_amount_kobo BIGINT NOT NULL,
                saved_amount_kobo BIGINT NOT NULL DEFAULT 0,
                frequency TEXT NOT NULL DEFAULT 'daily',
                source_account_id INTEGER,
                source_account_number TEXT,
                apy_percent NUMERIC(5,2) NOT NULL DEFAULT 6.50,
                status TEXT NOT NULL DEFAULT 'active',
                next_run_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_savings_user ON public.banksuite_personal_savings_plans (user_id, created_at DESC);

            CREATE TABLE IF NOT EXISTS public.banksuite_webhook_deliveries (
                id BIGSERIAL PRIMARY KEY,
                merchant_id INTEGER,
                user_id TEXT,
                event TEXT NOT NULL,
                target_url TEXT NOT NULL,
                payload JSONB NOT NULL,
                http_status INTEGER,
                success BOOLEAN NOT NULL DEFAULT FALSE,
                attempts INTEGER NOT NULL DEFAULT 1,
                response_excerpt TEXT,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_webhooks_merchant ON public.banksuite_webhook_deliveries (merchant_id, created_at DESC);

            CREATE TABLE IF NOT EXISTS public.banksuite_funding_requests (
                id BIGSERIAL PRIMARY KEY,
                reference TEXT NOT NULL UNIQUE,
                user_id TEXT NOT NULL,
                account_id INTEGER NOT NULL,
                account_number TEXT NOT NULL,
                amount_kobo BIGINT NOT NULL,
                method TEXT NOT NULL,
                gateway TEXT NOT NULL DEFAULT 'teller_bank_transfer',
                gateway_reference TEXT,
                narration TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                verified_by_email TEXT,
                verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_funding_user ON public.banksuite_funding_requests (user_id, created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_bs_funding_status ON public.banksuite_funding_requests (status, created_at DESC);
        `)
        g.__banksuiteOpsTablesReady = true
    })().finally(() => {
        g.__banksuiteOpsInitPromise = undefined
    })

    return g.__banksuiteOpsInitPromise
}
