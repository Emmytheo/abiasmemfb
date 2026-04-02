import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import { PlusCircle, Globe, Edit2 } from 'lucide-react'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export default async function EndpointsPage() {
    const payload = await getPayload({ config })

    const endpointsRes = await payload.find({
        collection: 'endpoints',
        sort: '-updatedAt',
    })

    const endpoints = endpointsRes.docs

    return (
        <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">API Endpoints</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage dynamic API endpoint specifications and their Provider mappings.
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

            <div className="border rounded-xl shadow-sm bg-background overflow-x-auto">
                {endpoints.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">No endpoints found</h3>
                        <p className="mt-1">Define your first REST API endpoint to use in workflows.</p>
                    </div>
                ) : (
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-6 py-4 font-medium">Name</th>
                                <th className="px-6 py-4 font-medium">Provider</th>
                                <th className="px-6 py-4 font-medium">Method</th>
                                <th className="px-6 py-4 font-medium">Path</th>
                                <th className="px-6 py-4 font-medium">Status</th>
                                <th className="px-6 py-4 font-medium text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {endpoints.map((ep: any) => {
                                const providerName = typeof ep.provider === 'object' ? ep.provider?.name : ep.provider;
                                
                                return (
                                    <tr key={ep.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-foreground">{ep.name}</div>
                                            <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={ep.description || ''}>
                                                {ep.description || 'No description'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant="outline" className="font-mono text-xs">{providerName}</Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-mono text-xs font-semibold ${ep.method === 'GET' ? 'text-blue-600' : ep.method === 'POST' ? 'text-green-600' : ep.method === 'DELETE' ? 'text-red-600' : 'text-amber-600'}`}>
                                                {ep.method}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px] inline-block">{ep.path}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={ep.status === 'active' ? 'default' : 'secondary'} className="font-normal">
                                                {ep.status}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/endpoints/${ep.id}`}
                                                    className="p-2 hover:bg-muted rounded-md text-foreground transition-colors"
                                                    title="Edit / Test Endpoint"
                                                >
                                                    <Edit2 size={16} />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
