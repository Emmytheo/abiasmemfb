'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Edit2, Globe, Search, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const METHOD_COLORS: Record<string, string> = {
    GET: 'text-blue-600 dark:text-blue-400',
    POST: 'text-green-600 dark:text-green-400',
    PUT: 'text-amber-600 dark:text-amber-400',
    PATCH: 'text-orange-500 dark:text-orange-400',
    DELETE: 'text-red-600 dark:text-red-400',
}

type Endpoint = {
    id: string
    name: string
    description: string
    method: string
    path: string
    status: string
    providerName: string
    updatedAt: string
}

export function EndpointsListClient({ endpoints }: { endpoints: Endpoint[] }) {
    const [search, setSearch] = useState('')
    const [methodFilter, setMethodFilter] = useState('ALL')
    const [statusFilter, setStatusFilter] = useState('ALL')

    const filtered = useMemo(() => {
        const q = search.toLowerCase()
        return endpoints.filter(ep => {
            const matchSearch = !q ||
                ep.name.toLowerCase().includes(q) ||
                ep.path.toLowerCase().includes(q) ||
                ep.providerName?.toLowerCase().includes(q) ||
                ep.description.toLowerCase().includes(q)
            const matchMethod = methodFilter === 'ALL' || ep.method === methodFilter
            const matchStatus = statusFilter === 'ALL' || ep.status === statusFilter
            return matchSearch && matchMethod && matchStatus
        })
    }, [endpoints, search, methodFilter, statusFilter])

    return (
        <div className="flex flex-col gap-4">
            {/* Filter bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name, path, provider…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full h-10 pl-9 pr-9 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    {search && (
                        <button
                            onClick={() => setSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                <select
                    value={methodFilter}
                    onChange={e => setMethodFilter(e.target.value)}
                    className="h-10 px-3 text-sm rounded-md border bg-background font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="ALL">All Methods</option>
                    {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                        <option key={m} value={m}>{m}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="h-10 px-3 text-sm rounded-md border bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="deprecated">Deprecated</option>
                </select>
            </div>

            {/* Results count */}
            {search || methodFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                <p className="text-xs text-muted-foreground">
                    Showing {filtered.length} of {endpoints.length} endpoints
                </p>
            ) : null}

            {/* Table */}
            <div className="border rounded-xl shadow-sm bg-background overflow-x-auto">
                {filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Globe size={24} className="text-muted-foreground/50" />
                        </div>
                        <h3 className="text-lg font-medium text-foreground">
                            {endpoints.length === 0 ? 'No endpoints found' : 'No results match your filters'}
                        </h3>
                        <p className="mt-1">
                            {endpoints.length === 0
                                ? 'Define your first REST API endpoint to use in workflows.'
                                : 'Try adjusting your search or filter criteria.'}
                        </p>
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
                            {filtered.map((ep) => (
                                <tr key={ep.id} className="hover:bg-muted/30 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-foreground">{ep.name}</div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-xs" title={ep.description}>
                                            {ep.description || 'No description'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge variant="outline" className="font-mono text-xs">{ep.providerName}</Badge>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`font-mono text-xs font-bold ${METHOD_COLORS[ep.method] ?? 'text-muted-foreground'}`}>
                                            {ep.method}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-xs text-muted-foreground truncate max-w-[220px] inline-block" title={ep.path}>
                                            {ep.path}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Badge
                                            variant={ep.status === 'active' ? 'default' : 'secondary'}
                                            className="font-normal"
                                        >
                                            {ep.status}
                                        </Badge>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/endpoints/${ep.id}`}
                                            className="p-2 hover:bg-muted rounded-md text-foreground transition-colors inline-flex"
                                            title="Edit / Test Endpoint"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    )
}
