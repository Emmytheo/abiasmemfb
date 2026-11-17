-- =============================================================================
-- COPTELLER — copteller_profiles Table Migration
-- Run this in the Copteller Supabase project SQL editor:
--   Project: vbakmvapkccrckoihcip | Region: eu-west-1
--   Dashboard: https://supabase.com/dashboard/project/vbakmvapkccrckoihcip
-- =============================================================================

-- One row per role the authenticated user holds.
-- A single email/auth account can own multiple profiles (member, coop_admin, investor, etc.)
-- without needing separate email addresses.

CREATE TABLE IF NOT EXISTS public.copteller_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role             TEXT NOT NULL CHECK (role IN (
                     'member', 'coop_admin', 'investor', 'superadmin', 'bank_staff'
                   )),
  display_name     TEXT,
  -- cooperative_id references Payload CMS cooperative document ID (stored as text)
  cooperative_id   TEXT,
  -- Denormalised cooperative name for fast display without a Payload lookup
  cooperative_name TEXT,
  avatar_url       TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  onboarding_done  BOOLEAN NOT NULL DEFAULT false,
  -- Flexible JSON bag for future per-profile settings (e.g. notification prefs)
  metadata         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Enforce one profile per role per user
  UNIQUE (user_id, role)
);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.copteller_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profiles (active profiles only shown to profile chooser UI)
CREATE POLICY "copteller_profiles_read_own"
  ON public.copteller_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own profiles (e.g. display_name, avatar_url)
CREATE POLICY "copteller_profiles_update_own"
  ON public.copteller_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT is handled server-side via service role key (bypasses RLS automatically)
-- No public INSERT policy is needed — profiles are created in /api/copteller/profile POST

-- ─── Auto-update updated_at ──────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_copteller_profiles_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trg_copteller_profiles_updated_at
  BEFORE UPDATE ON public.copteller_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_copteller_profiles_timestamp();

-- ─── Indexes for common lookups ───────────────────────────────────────────────

-- Fast lookup of all profiles for a given user
CREATE INDEX IF NOT EXISTS idx_copteller_profiles_user_id
  ON public.copteller_profiles (user_id);

-- Fast lookup of active profiles
CREATE INDEX IF NOT EXISTS idx_copteller_profiles_active
  ON public.copteller_profiles (user_id, is_active);

-- =============================================================================
-- DONE. Verify by running:
--   SELECT * FROM public.copteller_profiles LIMIT 5;
-- =============================================================================
