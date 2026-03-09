'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveSecret(id: string | null, data: any) {
    const payload = await getPayload({ config })

    // We do NOT handle the raw AES encryption logic here natively because Payload hooks handle that.
    // When a `value` is sent to Payload's `secrets` collection, its beforeChange hook encrypts it.

    if (id) {
        await payload.update({
            collection: 'secrets',
            id,
            data
        })
    } else {
        await payload.create({
            collection: 'secrets',
            data
        })
    }

    revalidatePath('/workflows/vault')
    return { success: true }
}

export async function deleteSecret(id: string) {
    const payload = await getPayload({ config })
    await payload.delete({
        collection: 'secrets',
        id
    })
    revalidatePath('/workflows/vault')
    return { success: true }
}
