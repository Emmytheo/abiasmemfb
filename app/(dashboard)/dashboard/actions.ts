'use server'

import { revalidatePath } from 'next/cache'

export async function revalidateHomepage() {
    revalidatePath('/')
    revalidatePath('/settings/product/types')
    return { success: true, message: 'Homepage cache cleared and will regenerate on next visit.' }
}
