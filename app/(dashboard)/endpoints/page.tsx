import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { PlusCircle, Globe, Edit2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EndpointsListClient } from './EndpointsListClient'

export default async function EndpointsPage() {
    const payload = await getPayload({ config })

    const endpointsRes = await payload.find({
        collection: 'endpoints',
        sort: '-updatedAt',
        limit: 500, // fetch all — client-side search handles filtering
        depth: 1,   // populate provider for name display
    })

    const endpoints = endpointsRes.docs.map((ep: any) => ({
        id: String(ep.id),
        name: ep.name,
        description: ep.description || '',
        method: ep.method,
        path: ep.path,
        status: ep.status,
        providerName: typeof ep.provider === 'object' ? ep.provider?.name : ep.provider,
        updatedAt: ep.updatedAt,
    }))

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Endpoints</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage dynamic API endpoint specifications and their Provider mappings.
                        <span className="ml-2 text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{endpoints.length} total</span>
                    </p>
                </div>
                <Link
                    href="/endpoints/new"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-10 px-4 py-2 rounded-md shadow-sm gap-2"
                >
                    <PlusCircle size={18} />
                    Create Endpoint
                </Link>
            </div>

            <EndpointsListClient endpoints={endpoints} />
        </div>
    )
}
