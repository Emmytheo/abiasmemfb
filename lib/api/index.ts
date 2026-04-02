import { ApiAdapter } from './types';
import { DummyAdapter } from './adapters/dummy';
import { SupabaseAdapter } from './adapters/supabase';
import { PayloadAdapter } from './adapters/payload';
import { QoreAdapter } from './adapters/qore';

// Environment variable controls whether we use mock data or real backend.
// We default to `true` (DummyAdapter) if the env variable isn't explicitly set to 'false'.
export const useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA !== 'false';
export const usePayload = process.env.NEXT_PUBLIC_USE_PAYLOAD === 'true';
export const useQore = process.env.NEXT_PUBLIC_USE_QORE === 'true';

export const api: ApiAdapter = useQore ? QoreAdapter : (usePayload ? PayloadAdapter : (useDummyData ? DummyAdapter : SupabaseAdapter));

export * from './types';
export { type Beneficiary } from './types';
