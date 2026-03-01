import type { AuthStrategy } from 'payload'
import { createClient } from '@/lib/supabase/server'

export const supabaseStrategy: AuthStrategy = {
    name: 'supabase',
    authenticate: async ({ payload }) => {
        try {
            const supabase = await createClient()
            const { data: { user }, error } = await supabase.auth.getUser()

            if (error || !user) {
                return { user: null }
            }

            // Query by supabase_id — a custom field, always queryable regardless of disableLocalStrategy
            const { docs } = await payload.find({
                collection: 'users',
                overrideAccess: true,
                where: {
                    supabase_id: {
                        equals: user.id,
                    },
                },
                limit: 1,
            })

            if (docs.length > 0) {
                return {
                    user: {
                        ...docs[0],
                        collection: 'users'
                    } as any
                }
            }

            // Auto-create the shadow user. Guard against race conditions by
            // catching duplicate-key ValidationErrors and re-querying.
            try {
                const newUser = await payload.create({
                    collection: 'users',
                    overrideAccess: true,
                    data: {
                        supabase_id: user.id,
                        email: user.email!,
                        role: 'admin',
                    },
                })

                return {
                    user: {
                        ...newUser,
                        collection: 'users'
                    } as any
                }
            } catch (createError: any) {
                // Race condition: another concurrent request already created the user.
                // Re-query and return the existing shadow user.
                const { docs: retryDocs } = await payload.find({
                    collection: 'users',
                    overrideAccess: true,
                    where: {
                        supabase_id: { equals: user.id },
                    },
                    limit: 1,
                })

                if (retryDocs.length > 0) {
                    return {
                        user: {
                            ...retryDocs[0],
                            collection: 'users'
                        } as any
                    }
                }

                console.error('PAYLOAD AUTH: User creation failed and re-query found nothing:', createError)
                return { user: null }
            }
        } catch (e) {
            console.error('PAYLOAD AUTH ERROR:', e)
            return { user: null }
        }
    },
}
