import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { notFound } from 'next/navigation'
import { EndpointEditorLayout } from './EndpointEditorLayout'

export default async function EndpointEditorPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const isNew = id === 'new_edit'

    let dynamicOptions = {
        providers: [] as { id: string; label: string; baseUrl: string }[],
    }

    let endpoint = null
    try {
        const payload = await getPayload({ config })
        const providersRes = await payload.find({ collection: 'service-providers', limit: 100 })

        dynamicOptions.providers = providersRes.docs.map(d => ({ 
            id: String(d.id), 
            label: d.name,
            baseUrl: d.baseUrl
        }))

        if (!isNew) {
            endpoint = await payload.findByID({
                collection: 'endpoints',
                id,
                depth: 1, // populate provider so baseUrl is available in the client
            }).catch(() => null)

            if (!endpoint) {
                notFound()
            }
        }
    } catch (e) {
        console.error('Failed to fetch dynamic options for editor', e)
    }

    return (
        <EndpointEditorLayout
            endpointId={isNew ? 'new' : id}
            initialData={endpoint}
            dynamicOptions={dynamicOptions}
        />
    )
}
