import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * Global cache for the Payload instance to prevent redundant initializations 
 * during Next.js Hot Module Replacement (HMR) and parallel Server Action calls.
 */
let cached = (global as any).payload

if (!cached) {
  cached = (global as any).payload = { client: null, promise: null }
}

export const getPayloadClient = async () => {
  if (cached.client) {
    return cached.client
  }

  if (!cached.promise) {
    console.log('[Payload] Initializing shared singleton client...')
    cached.promise = getPayload({ config })
  }

  try {
    cached.client = await cached.promise
  } catch (e: any) {
    cached.promise = null
    console.error('[Payload] Failed to initialize client:', e.message)
    throw e
  }

  return cached.client
}
