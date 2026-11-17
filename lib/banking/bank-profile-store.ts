import { Pool } from "pg"
import { unstable_cache } from "next/cache"
import {
    DEFAULT_BANK_PROFILE_ID,
    type BankProfile,
    type BankProfileOverride,
} from "./bank-profiles"

export interface PersistedBankProfileState {
    activeProfileId: string
    customProfiles: BankProfile[]
    profileOverrides: Record<string, BankProfileOverride>
    updatedAt?: string
    updatedBy?: string
}

const g = globalThis as typeof globalThis & {
    __banksuitePgPool?: Pool
    __banksuiteTableReady?: boolean
    __banksuiteMemState?: { state: PersistedBankProfileState; expiresAt: number }
}

function getPool(): Pool | null {
    const connString = process.env.DATABASE_URI || process.env.POSTGRES_URL
    if (!connString) return null

    if (!g.__banksuitePgPool) {
        const isLocal =
            connString.includes("localhost") || connString.includes("127.0.0.1")
        g.__banksuitePgPool = new Pool({
            connectionString: connString,
            max: 5,
            connectionTimeoutMillis: 8000,
            idleTimeoutMillis: 30000,
            ssl: isLocal ? undefined : { rejectUnauthorized: false },
        })
    }
    return g.__banksuitePgPool
}

async function ensureWhiteLabelTable(pool: Pool): Promise<void> {
    if (g.__banksuiteTableReady) return
    await pool.query(`
        CREATE TABLE IF NOT EXISTS public.banksuite_white_label_state (
            id TEXT PRIMARY KEY,
            active_profile_id TEXT NOT NULL,
            custom_profiles JSONB NOT NULL DEFAULT '[]'::jsonb,
            profile_overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_by TEXT
        )
    `)
    g.__banksuiteTableReady = true
}

const DEFAULT_STATE: PersistedBankProfileState = {
    activeProfileId:
        process.env.NEXT_PUBLIC_DEFAULT_BANK_PROFILE || DEFAULT_BANK_PROFILE_ID,
    customProfiles: [],
    profileOverrides: {},
}

async function queryGlobalStateFromDb(): Promise<PersistedBankProfileState> {
    const pool = getPool()
    if (!pool) return DEFAULT_STATE

    try {
        await ensureWhiteLabelTable(pool)
        const res = await pool.query(
            `SELECT active_profile_id, custom_profiles, profile_overrides, updated_at, updated_by
             FROM public.banksuite_white_label_state
             WHERE id = 'global'
             LIMIT 1`
        )
        const row = res.rows[0]
        if (!row) return DEFAULT_STATE

        const parsed: PersistedBankProfileState = {
            activeProfileId:
                String(row.active_profile_id || "").trim() ||
                DEFAULT_STATE.activeProfileId,
            customProfiles: Array.isArray(row.custom_profiles)
                ? row.custom_profiles
                : [],
            profileOverrides:
                row.profile_overrides && typeof row.profile_overrides === "object"
                    ? row.profile_overrides
                    : {},
            updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
            updatedBy: row.updated_by || undefined,
        }
        g.__banksuiteMemState = { state: parsed, expiresAt: Date.now() + 15000 }
        return parsed
    } catch (err) {
        console.warn("[bank-profile-store] Falling back to memory/default profile state:", err)
        return g.__banksuiteMemState?.state || DEFAULT_STATE
    }
}

const readCachedGlobalState = unstable_cache(
    async () => {
        return await Promise.race([
            queryGlobalStateFromDb(),
            new Promise<PersistedBankProfileState>((resolve) =>
                setTimeout(() => resolve(g.__banksuiteMemState?.state || DEFAULT_STATE), 4500)
            ),
        ])
    },
    ["banksuite-global-state-v2"],
    {
        revalidate: 30,
        tags: ["banksuite-profile"],
    }
)

export async function readGlobalBankProfileState(): Promise<PersistedBankProfileState> {
    try {
        if (g.__banksuiteMemState && g.__banksuiteMemState.expiresAt > Date.now()) {
            return g.__banksuiteMemState.state
        }
        return await readCachedGlobalState()
    } catch {
        return g.__banksuiteMemState?.state || DEFAULT_STATE
    }
}

export async function readFreshGlobalBankProfileState(): Promise<PersistedBankProfileState> {
    return await queryGlobalStateFromDb()
}

export async function writeGlobalBankProfileState(
    nextState: PersistedBankProfileState,
    actorEmail?: string
): Promise<boolean> {
    const pool = getPool()
    if (!pool) return false

    await ensureWhiteLabelTable(pool)
    await pool.query(
        `INSERT INTO public.banksuite_white_label_state
            (id, active_profile_id, custom_profiles, profile_overrides, updated_at, updated_by)
         VALUES ('global', $1, $2::jsonb, $3::jsonb, NOW(), $4)
         ON CONFLICT (id) DO UPDATE SET
            active_profile_id = EXCLUDED.active_profile_id,
            custom_profiles = EXCLUDED.custom_profiles,
            profile_overrides = EXCLUDED.profile_overrides,
            updated_at = NOW(),
            updated_by = EXCLUDED.updated_by`,
        [
            nextState.activeProfileId,
            JSON.stringify(nextState.customProfiles.slice(0, 25)),
            JSON.stringify(nextState.profileOverrides || {}),
            actorEmail || "superadmin",
        ]
    )

    g.__banksuiteMemState = {
        state: {
            ...nextState,
            updatedAt: new Date().toISOString(),
            updatedBy: actorEmail || "superadmin",
        },
        expiresAt: Date.now() + 15000,
    }
    return true
}
