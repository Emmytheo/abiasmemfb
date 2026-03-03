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

            // Only admin users get Payload shadow accounts.
            // Check user_metadata.role — if not 'admin', reject access to Payload CMS.
            const role = user.user_metadata?.role || 'user'
            if (role !== 'admin') {
                return { user: null }
            }

            // Query existing shadow user
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

            // Auto-create the shadow user for admins.
            // Guard against race conditions with try/catch + re-query.
            try {
                const newUser = await payload.create({
                    collection: 'users',
                    overrideAccess: true,
                    data: {
                        supabase_id: user.id,
                        email: user.email!,
                        name: user.user_metadata?.full_name || user.user_metadata?.name || '',
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
                // Race condition: another request already created the user.
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

                console.error('PAYLOAD AUTH: Admin shadow creation failed:', createError)
                return { user: null }
            }
        } catch (e) {
            console.error('PAYLOAD AUTH ERROR:', e)
            return { user: null }
        }
    },
}
