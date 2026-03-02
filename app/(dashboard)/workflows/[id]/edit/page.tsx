import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Play, Save } from 'lucide-react'
import { WorkflowEditorLayout } from './WorkflowEditorLayout'
import { ThemeCustomizer } from '@/components/theme-customizer'

export default async function WorkflowEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    let dynamicOptions = {
        providers: [] as { id: string; label: string }[],
        secrets: [] as { id: string; label: string }[],
        workflows: [] as { id: string; label: string }[],
        applications: [] as { id: string; label: string }[],
    }

    let workflow = null
    try {
        const payload = await getPayload({ config })
        const [providersRes, secretsRes, workflowsRes, appsRes] = await Promise.all([
            payload.find({ collection: 'service-providers', limit: 100 }),
            payload.find({ collection: 'secrets', limit: 100 }),
            payload.find({ collection: 'workflows', limit: 100 }),
            payload.find({ collection: 'product-types', limit: 100 }),
        ])

        dynamicOptions.providers = providersRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        // For secrets we mask/hide encryptedValue, but id and name are always public 
        dynamicOptions.secrets = secretsRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        dynamicOptions.workflows = workflowsRes.docs.map(d => ({ id: String(d.id), label: d.name }))
        dynamicOptions.applications = appsRes.docs.map(d => ({ id: String(d.id), label: d.name }))

        if (id !== 'new') {
            workflow = await payload.findByID({
                collection: 'workflows',
                id,
            }).catch(() => null)

            if (!workflow) {
                notFound()
            }
            // Need to pass workflow definition into FlowEditor if loading an existing one
        }
    } catch (e) {
        console.error('Failed to fetch dynamic options for editor', e)
    }

    return (
        <WorkflowEditorLayout
            workflowId={id}
            workflow={workflow}
            dynamicOptions={dynamicOptions}
        />
    )
}
