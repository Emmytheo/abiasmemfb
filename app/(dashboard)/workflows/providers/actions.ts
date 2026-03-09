'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveProvider(id: string | null, data: any) {
    const payload = await getPayload({ config })

    if (id) {
        await payload.update({
            collection: 'service-providers',
            id,
            data
        })
    } else {
        await payload.create({
            collection: 'service-providers',
            data
        })
    }

    revalidatePath('/workflows/providers')
    return { success: true }
}

export async function deleteProvider(id: string) {
    const payload = await getPayload({ config })
    await payload.delete({
        collection: 'service-providers',
        id
    })
    revalidatePath('/workflows/providers')
    return { success: true }
}
