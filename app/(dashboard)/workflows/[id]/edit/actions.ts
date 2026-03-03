'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath } from 'next/cache'
import { FlowToExecutionPlan } from '@/lib/workflow/executionPlan'
import type { AppNode } from '@/lib/workflow/types'

export async function saveWorkflowDefinition(workflowId: string, definition: any, status?: 'DRAFT' | 'PUBLISHED') {
    if (!workflowId || workflowId === 'new') {
        throw new Error('Save requires an existing workflow ID.')
    }

    const payload = await getPayload({ config })

    const existing = await payload.findByID({
        collection: 'workflows',
        id: workflowId,
    }).catch(() => null)

    if (!existing) {
        throw new Error(`Workflow ${workflowId} not found`)
    }

    try {
        const updateData: any = { definition }
        if (status) updateData.status = status

        // When publishing, compile the execution plan from the canvas graph
        if (status === 'PUBLISHED' && definition?.nodes && definition?.edges) {
            const nodes = definition.nodes as AppNode[]
            const edges = definition.edges || []

            const result = FlowToExecutionPlan(nodes, edges)

            if (result.error) {
                const errorMsg = result.error.type === 'NO_ENTRY_POINT'
                    ? 'Workflow must have a Trigger node as entry point.'
                    : `Some nodes have missing required inputs: ${result.error.invalidElements?.map(e => e.nodeId).join(', ')}`
                return { success: false, error: errorMsg }
            }

            updateData.executionPlan = result.executionPlan

            // Sync trigger type from the trigger node config to the top-level field
            const triggerNode = nodes.find(n => n.data?.type === 'TRIGGER')
            if (triggerNode?.data?.inputs?.triggerType) {
                updateData.trigger = triggerNode.data.inputs.triggerType
            }
        }

        await payload.update({
            collection: 'workflows',
            id: workflowId,
            data: updateData
        })

        revalidatePath(`/workflows/${workflowId}/edit`)
        revalidatePath('/workflows')
        return { success: true }
    } catch (e: any) {
        console.error('Failed to save workflow', e)
        return { success: false, error: e.message }
    }
}

export async function createWorkflowAndSave(definition: any, status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') {
    const payload = await getPayload({ config })

    try {
        // If publishing, compile the execution plan
        let executionPlan
        let trigger = 'MANUAL'
        if (status === 'PUBLISHED' && definition?.nodes) {
            const result = FlowToExecutionPlan(definition.nodes, definition.edges || [])
            if (result.error) {
                return { success: false, error: 'Workflow has validation errors. Cannot publish.' }
            }
            executionPlan = result.executionPlan
            const triggerNode = (definition.nodes as AppNode[]).find(n => n.data?.type === 'TRIGGER')
            if (triggerNode?.data?.inputs?.triggerType) {
                trigger = triggerNode.data.inputs.triggerType
            }
        }

        const workflow = await payload.create({
            collection: 'workflows',
            data: {
                name: `Untitled Workflow ${new Date().toLocaleDateString()}`,
                status,
                trigger,
                definition,
                ...(executionPlan ? { executionPlan } : {}),
            }
        })

        revalidatePath('/workflows')
        return { success: true, workflowId: String(workflow.id) }
    } catch (e: any) {
        console.error('Failed to create workflow', e)
        return { success: false, error: e.message }
    }
}

export async function runWorkflow(workflowId: string, inputData?: Record<string, any>) {
    // Dynamic import to avoid pulling server-only code into the client bundle
    const { executeWorkflow } = await import('@/lib/workflow/executeWorkflow')

    try {
        const executionId = await executeWorkflow({
            workflowId,
            trigger: 'MANUAL',
            inputData: inputData || {},
        })

        return {
            success: true,
            executionId,
            message: `Workflow execution started. ID: ${executionId}`,
        }
    } catch (e: any) {
        console.error(`[Test Run] Failed to execute workflow ${workflowId}:`, e)
        return {
            success: false,
            error: e.message || 'Failed to execute workflow',
        }
    }
}

