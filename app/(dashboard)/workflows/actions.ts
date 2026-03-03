'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'

export async function renameWorkflow(workflowId: string, name: string) {
    const payload = await getPayload({ config })
    try {
        await payload.update({
            collection: 'workflows',
            id: workflowId,
            data: { name }
        })
        revalidatePath('/workflows')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function duplicateWorkflow(workflowId: string) {
    const payload = await getPayload({ config })
    try {
        const original = await payload.findByID({
            collection: 'workflows',
            id: workflowId,
        })

        const newWf = await payload.create({
            collection: 'workflows',
            data: {
                name: `${original.name} (Copy)`,
                description: original.description || '',
                status: 'DRAFT',
                trigger: original.trigger || 'MANUAL',
                definition: original.definition || {},
                idempotencyEnabled: original.idempotencyEnabled,
                idempotencyWindowMinutes: original.idempotencyWindowMinutes,
                tags: original.tags || [],
            }
        })

        revalidatePath('/workflows')
        return { success: true, newId: String(newWf.id) }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function deleteWorkflow(workflowId: string) {
    const payload = await getPayload({ config })
    try {
        await payload.delete({
            collection: 'workflows',
            id: workflowId,
        })
        revalidatePath('/workflows')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function toggleWorkflowStatus(workflowId: string, currentStatus: string) {
    const payload = await getPayload({ config })
    try {
        await payload.update({
            collection: 'workflows',
            id: workflowId,
            data: { status: currentStatus === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED' }
        })
        revalidatePath('/workflows')
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}
