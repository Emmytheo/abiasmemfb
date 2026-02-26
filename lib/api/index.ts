import { ApiAdapter } from './types';
import { DummyAdapter } from './adapters/dummy';
import { SupabaseAdapter } from './adapters/supabase';

// Environment variable controls whether we use mock data or real backend.
// We default to `true` (DummyAdapter) if the env variable isn't explicitly set to 'false'.
export const useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA !== 'false';

export const api: ApiAdapter = useDummyData ? DummyAdapter : SupabaseAdapter;

// Re-export types so consumers can cleanly import required types straight from '@/lib/api'
export * from './types';
