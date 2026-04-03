'use server'

import { revalidatePath } from 'next/cache'
import { RegistryBulkSyncExecutor } from '@/lib/workflow/executor/RegistryBulkSyncExecutor'
import { exportRegistryBundle } from '@/lib/registry/sdl'

export async function syncRegistryProductsAction() {
    try {
        const results = await RegistryBulkSyncExecutor()
        revalidatePath('/settings/product/types')
        return { success: true, data: results }
    } catch (error: any) {
        console.error("Sync Error:", error)
        return { success: false, error: error.message }
    }
}

export async function exportRegistryProductsAction() {
    try {
        const results = await exportRegistryBundle()
        return { success: true, data: results }
    } catch (error: any) {
        console.error("Export Error:", error)
        return { success: false, error: error.message }
    }
}
