import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { PlusCircle, Globe, Edit2, Search } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EndpointsListClient } from './EndpointsListClient'
import { BankPageHeader } from '@/components/banking/page-header'
import { SubsystemNav } from '@/components/banking/subsystem-nav'

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

    const activeCount = endpoints.filter((e) => e.status === 'active').length
    const getCount = endpoints.filter((e) => e.method === 'GET').length
    const providerSet = new Set(endpoints.map((e) => e.providerName).filter(Boolean))

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6">
            <BankPageHeader
                badge="API Gateway & Connectors"
                livePill={`${activeCount} Active Specs`}
                title="API Endpoints Registry"
                subtitle="Manage external banking, KYC, NIP, and biller endpoint specifications with live health probes and schema validation."
                actions={
                    <Link
                        href="/endpoints/new"
                        className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center font-bold text-xs transition-colors h-9 px-4 rounded-xl shadow-sm gap-2"
                    >
                        <PlusCircle size={16} />
                        Create Endpoint
                    </Link>
                }
            />

            <SubsystemNav group="automation" />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                    { label: "Total Endpoints", value: endpoints.length, sub: "Configured API specs" },
                    { label: "Active", value: activeCount, sub: `${endpoints.length - activeCount} inactive / draft` },
                    { label: "Read / Mutating", value: `${getCount} / ${endpoints.length - getCount}`, sub: "GET vs POST/PUT/PATCH" },
                    { label: "Providers Linked", value: providerSet.size, sub: "Distinct integration hosts" },
                ].map((k) => (
                    <div key={k.label} className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{k.label}</p>
                        <p className="text-2xl font-black font-mono text-foreground">{k.value}</p>
                        <p className="text-[11px] text-muted-foreground">{k.sub}</p>
                    </div>
                ))}
            </div>

            <EndpointsListClient endpoints={endpoints} />
        </div>
    )
}
