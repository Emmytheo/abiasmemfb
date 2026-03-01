'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function saveWorkflowDefinition(workflowId: string, definition: any) {
    if (!workflowId || workflowId === 'new') {
        throw new Error('Save requires an existing workflow ID.')
    }

    const payload = await getPayload({ config })

    // Validate existence
    const existing = await payload.findByID({
        collection: 'workflows',
        id: workflowId,
    }).catch(() => null)

    if (!existing) {
        throw new Error(`Workflow ${workflowId} not found`)
    }

    try {
        await payload.update({
            collection: 'workflows',
            id: workflowId,
            data: {
                definition,
            }
        })

        revalidatePath(`/workflows/${workflowId}/edit`)
        return { success: true }
    } catch (e: any) {
        console.error('Failed to save workflow', e)
        return { success: false, error: e.message }
    }
}
