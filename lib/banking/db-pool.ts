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

            -- 1. Double-Entry General Ledger (GL) Chart of Accounts & Journal Entries
            CREATE TABLE IF NOT EXISTS public.banksuite_gl_accounts (
                code TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category TEXT NOT NULL, -- asset | liability | equity | income | expense
                normal_side TEXT NOT NULL, -- debit | credit
                balance_kobo BIGINT NOT NULL DEFAULT 0,
                description TEXT,
                is_system BOOLEAN NOT NULL DEFAULT TRUE,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            CREATE TABLE IF NOT EXISTS public.banksuite_gl_entries (
                id BIGSERIAL PRIMARY KEY,
                journal_ref TEXT NOT NULL,
                gl_code TEXT NOT NULL REFERENCES public.banksuite_gl_accounts(code),
                side TEXT NOT NULL, -- debit | credit
                amount_kobo BIGINT NOT NULL,
                narration TEXT NOT NULL,
                source_module TEXT NOT NULL DEFAULT 'core',
                source_ref TEXT,
                actor_email TEXT,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_gl_entries_ref ON public.banksuite_gl_entries (journal_ref);
            CREATE INDEX IF NOT EXISTS idx_bs_gl_entries_code ON public.banksuite_gl_entries (gl_code, created_at DESC);

            INSERT INTO public.banksuite_gl_accounts (code, name, category, normal_side, balance_kobo, description)
            VALUES
                ('1000', 'Cash & NIBSS Settlement Nostro', 'asset', 'debit', 25000000000, 'Primary liquid vault cash and NIBSS/NIP settlement nostro balance'),
                ('1100', 'CBN Statutory Liquidity Reserve', 'asset', 'debit', 8000000000, 'Regulatory liquid reserve buffer held for CBN 20% liquidity ratio'),
                ('1200', 'Retail & SME Loan Portfolio Receivable', 'asset', 'debit', 0, 'Principal outstanding on direct MFB loans'),
                ('1300', 'Copteller Wholesale & Fleet Credit Book', 'asset', 'debit', 0, 'Credit facilities and hire-purchase tranches disbursed via Copteller telemetry'),
                ('2000', 'Customer Retail & Corporate Deposits (CASA)', 'liability', 'credit', 0, 'Customer savings, current, and corporate deposit liabilities'),
                ('2100', 'Copteller Cooperative Escrow Trust Custody', 'liability', 'credit', 0, 'Ring-fenced cooperative Ajo, thrift, and HP escrow float custodied under MFB license'),
                ('2200', 'Target Savings & Fixed Deposit Vaults', 'liability', 'credit', 0, 'Locked personal target vaults and fixed-tenor deposits'),
                ('3000', 'Paid-Up Share Capital & Statutory Reserves', 'equity', 'credit', 33000000000, 'Institutional Tier-1 MFB shareholder equity and retained reserves'),
                ('4000', 'Interest, Commission & Escrow Fee Income', 'income', 'credit', 0, 'Recognized loan interest, NIP transfer fees, POS 30% share, and cooperative escrow fees'),
                ('5000', 'Agency Commission & Interest Expense', 'expense', 'debit', 0, '70% POS agent commissions and savings vault interest expense')
            ON CONFLICT (code) DO NOTHING;

            -- 2. Copteller Regulated Escrow Pool Custody Registry (Rail 1)
            CREATE TABLE IF NOT EXISTS public.banksuite_copteller_escrow_pools (
                id BIGSERIAL PRIMARY KEY,
                copteller_coop_id INTEGER NOT NULL UNIQUE,
                coop_name TEXT NOT NULL,
                coop_reg_number TEXT,
                banksuite_account_id INTEGER,
                escrow_nuban TEXT NOT NULL UNIQUE,
                custody_balance_kobo BIGINT NOT NULL DEFAULT 0,
                copteller_reported_kobo BIGINT NOT NULL DEFAULT 0,
                escrow_fee_bps INTEGER NOT NULL DEFAULT 150,
                credit_facility_limit_kobo BIGINT NOT NULL DEFAULT 500000000,
                status TEXT NOT NULL DEFAULT 'active',
                last_swept_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- 3. Bi-Directional BankSuite <-> Copteller Settlement Ledger (Rails 1, 2, 3)
            CREATE TABLE IF NOT EXISTS public.banksuite_copteller_settlements (
                id BIGSERIAL PRIMARY KEY,
                reference TEXT NOT NULL UNIQUE,
                rail_type TEXT NOT NULL, -- INBOUND_ESCROW_SWEEP | OUTBOUND_PAYOUT_CLEARING | LOAN_WHOLESALE_DISBURSEMENT | AGENT_COPTELLER_CASH_IN
                copteller_coop_id INTEGER,
                coop_name TEXT,
                escrow_nuban TEXT,
                amount_kobo BIGINT NOT NULL,
                fee_kobo BIGINT NOT NULL DEFAULT 0,
                gl_journal_ref TEXT,
                counterparty_label TEXT,
                status TEXT NOT NULL DEFAULT 'settled',
                actor_email TEXT,
                metadata JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_cop_settle_created ON public.banksuite_copteller_settlements (created_at DESC);

            -- 4. Authoritative CBN KYC Tier Profiles (Rail 4)
            CREATE TABLE IF NOT EXISTS public.banksuite_kyc_profiles (
                customer_id INTEGER PRIMARY KEY,
                kyc_tier INTEGER NOT NULL DEFAULT 1, -- 1 (₦50k/day), 2 (₦200k/day), 3 (₦5M/day)
                bvn_verified BOOLEAN NOT NULL DEFAULT FALSE,
                nin TEXT,
                nin_verified BOOLEAN NOT NULL DEFAULT FALSE,
                address_verified BOOLEAN NOT NULL DEFAULT FALSE,
                daily_limit_kobo BIGINT NOT NULL DEFAULT 5000000,
                max_balance_kobo BIGINT NOT NULL DEFAULT 30000000,
                verified_by_email TEXT,
                notes TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- 5. End-of-Day (EOD) Close-of-Business Batch Run Registry
            CREATE TABLE IF NOT EXISTS public.banksuite_eod_runs (
                id BIGSERIAL PRIMARY KEY,
                run_ref TEXT NOT NULL UNIQUE,
                run_type TEXT NOT NULL DEFAULT 'full_eod', -- full_eod | gl_sync
                actor_email TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'completed',
                gl_journals_posted INTEGER NOT NULL DEFAULT 0,
                gl_synced_kobo BIGINT NOT NULL DEFAULT 0,
                interest_accrued_kobo BIGINT NOT NULL DEFAULT 0,
                vaults_credited INTEGER NOT NULL DEFAULT 0,
                standing_orders_executed INTEGER NOT NULL DEFAULT 0,
                loans_scanned INTEGER NOT NULL DEFAULT 0,
                overdue_loans_tagged INTEGER NOT NULL DEFAULT 0,
                cbn_provision_required_kobo BIGINT NOT NULL DEFAULT 0,
                trial_balance_balanced BOOLEAN NOT NULL DEFAULT TRUE,
                summary JSONB DEFAULT '{}'::jsonb,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_bs_eod_created ON public.banksuite_eod_runs (created_at DESC);
        `)
        g.__banksuiteOpsTablesReady = true
    })().finally(() => {
        g.__banksuiteOpsInitPromise = undefined
    })

    return g.__banksuiteOpsInitPromise
}
