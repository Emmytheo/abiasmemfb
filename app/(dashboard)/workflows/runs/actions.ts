'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function deleteWorkflowRun(id: string) {
    try {
        const payload = await getPayload({ config })
        await payload.delete({
            collection: 'workflow-executions',
            id,
        })
        revalidatePath('/workflows/runs')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || 'Failed to delete execution' }
    }
}
