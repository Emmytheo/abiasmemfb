'use client'

import React, { useState } from 'react'
import { ArrowLeft, Save, Play, Loader2, CheckCircle2, XCircle, Globe } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function EndpointEditorLayout({ endpointId, initialData, dynamicOptions }: any) {
    const router = useRouter()
    const [isSaving, setIsSaving] = useState(false)
    const [activeTab, setActiveTab] = useState<'definition' | 'test'>('definition')

    const [formData, setFormData] = useState(initialData || {
        name: '',
        description: '',
        provider: dynamicOptions.providers[0]?.id || '',
        method: 'GET',
        path: '',
        status: 'active',
        headers: [],
        queryParamsSchema: {},
        bodySchema: {},
        responseSchema: {},
    })

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const url = endpointId === 'new' ? '/api/endpoints' : `/api/endpoints/${endpointId}`
            const method = endpointId === 'new' ? 'POST' : 'PATCH'
            
            const payloadData = {
                ...formData,
                // Ensure provider is strictly an ID for Payload
                provider: typeof formData.provider === 'object' ? formData.provider.id : formData.provider
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payloadData)
            })

            if (!res.ok) throw new Error('Failed to save endpoint')
            
            const savedData = await res.json()
            toast.success('Endpoint saved successfully')
            
            if (endpointId === 'new') {
                router.push(`/endpoints/${savedData.doc.id}`)
            }
        } catch (e: any) {
            toast.error(e.message || 'An error occurred')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            {/* Header */}
            <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 sm:px-6 justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/endpoints" className="text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="flex flex-col">
                        <input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Endpoint Name"
                            className="bg-transparent border-0 focus:ring-0 text-sm font-semibold p-0 w-[200px]"
                        />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex items-center bg-muted/50 p-1 rounded-md">
                    <button 
                        onClick={() => setActiveTab('definition')}
                        className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors ${activeTab === 'definition' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Definition
                    </button>
                    <button 
                        onClick={() => setActiveTab('test')}
                        className={`text-xs px-3 py-1.5 rounded-sm font-medium transition-colors ${activeTab === 'test' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Test Console
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save
                    </button>
                </div>
            </header>

            {/* Layout Body */}
            <div className="flex-1 overflow-auto bg-muted/10 p-4 sm:p-8">
                <div className="max-w-5xl mx-auto border bg-background rounded-lg shadow-sm">
                    {activeTab === 'definition' ? (
                        <DefinitionTab formData={formData} setFormData={setFormData} dynamicOptions={dynamicOptions} />
                    ) : (
                        <TestConsoleTab formData={formData} dynamicOptions={dynamicOptions} />
                    )}
                </div>
            </div>
        </div>
    )
}

function DefinitionTab({ formData, setFormData, dynamicOptions }: any) {
    // Simple textarea helper for JSON parsing
    const handleJsonUpdate = (key: string, value: string) => {
        try {
            const parsed = value ? JSON.parse(value) : {};
            setFormData({...formData, [key]: parsed});
        } catch(e) {
            // Keep Invalid JSON during typing, we can add a real editor later
            setFormData({...formData, [key]: value}); 
        }
    }

    const displayJson = (obj: any) => typeof obj === 'string' ? obj : JSON.stringify(obj, null, 2)

    return (
        <div className="p-6 space-y-8">
            {/* Core routing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Provider</label>
                    <select 
                        value={typeof formData.provider === 'object' ? formData.provider.id : formData.provider}
                        onChange={(e) => setFormData({...formData, provider: e.target.value})}
                        className="w-full text-sm rounded-md border-input bg-transparent border px-3 py-2"
                    >
                        {dynamicOptions.providers.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Method</label>
                    <select 
                        value={formData.method}
                        onChange={(e) => setFormData({...formData, method: e.target.value})}
                        className="w-full text-sm rounded-md border-input bg-transparent border px-3 py-2 font-mono"
                    >
                        {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                            <option key={m} value={m}>{m}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Status</label>
                    <select 
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                        className="w-full text-sm rounded-md border-input bg-transparent border px-3 py-2"
                    >
                        <option value="active">Active</option>
                        <option value="deprecated">Deprecated</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Path (Relative to Base URL)</label>
                    <div className="flex items-center rounded-md border bg-transparent overflow-hidden px-3 py-2">
                        <span className="text-muted-foreground font-mono text-sm mr-1">/</span>
                        <input 
                            type="text" 
                            className="bg-transparent border-0 focus:ring-0 p-0 w-full text-sm font-mono flex-1 outline-none"
                            placeholder="api/v1/resource/:id"
                            value={formData.path.replace(/^\//,'')} // visually trim leading slash
                            onChange={(e) => setFormData({...formData, path: `/${e.target.value}`})}
                        />
                    </div>
                </div>
            </div>

            {/* Schemas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Query Schema (JSON)</label>
                    <textarea 
                        className="w-full h-32 text-xs font-mono rounded-md border bg-muted/20 p-3"
                        value={displayJson(formData.queryParamsSchema)}
                        onChange={(e) => handleJsonUpdate('queryParamsSchema', e.target.value)}
                        placeholder={'{\n  "accountId": "string"\n}'}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Body Schema (JSON)</label>
                    <textarea 
                        className="w-full h-32 text-xs font-mono rounded-md border bg-muted/20 p-3"
                        value={displayJson(formData.bodySchema)}
                        onChange={(e) => handleJsonUpdate('bodySchema', e.target.value)}
                        placeholder={'{\n  "amount": "number"\n}'}
                    />
                </div>
            </div>
        </div>
    )
}

function TestConsoleTab({ formData, dynamicOptions }: any) {
    const providerObj = dynamicOptions.providers.find((p: any) => p.id === (typeof formData.provider === 'object' ? formData.provider.id : formData.provider))
    
    const [testQuery, setTestQuery] = useState('{}')
    const [testBody, setTestBody] = useState('{}')
    const [running, setRunning] = useState(false)
    const [response, setResponse] = useState<any>(null)

    // formData.provider may be a populated object (from Payload depth > 0) or just an ID string
    const providerId = typeof formData.provider === 'object' ? formData.provider?.id : formData.provider
    const providerBaseUrl = 
        (typeof formData.provider === 'object' && formData.provider?.baseUrl) // populated relationship
        ?? providerObj?.baseUrl                                                 // matched from dynamicOptions
        ?? ''

    const fullUrl = providerBaseUrl
        ? `${String(providerBaseUrl).replace(/\/$/, '')}${formData.path}`
        : `(no provider)${formData.path}`

    const runTest = async () => {
        setRunning(true)
        setResponse(null)
        // Here we hit a dedicated server API wrapper that proxies the request via the service provider vault. 
        // This keeps secrets out of the browser.
        try {
            const res = await fetch('/api/endpoints/test-runner', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    endpointConfig: formData,
                    query: JSON.parse(testQuery || '{}'),
                    body: JSON.parse(testBody || '{}')
                })
            })
            const data = await res.json()
            setResponse(data)
        } catch (e: any) {
            setResponse({ error: e.message })
        } finally {
            setRunning(false)
        }
    }

    return (
        <div className="flex flex-col md:flex-row h-full min-h-[500px]">
            {/* Request Pane */}
            <div className="w-full md:w-1/2 border-r flex flex-col">
                <div className="p-4 border-b flex items-center justify-between bg-muted/20">
                    <div className="flex items-center gap-2 overflow-hidden pr-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${formData.method === 'GET' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {formData.method}
                        </span>
                        <span className="font-mono text-sm truncate">{fullUrl}</span>
                    </div>
                    <button 
                        onClick={runTest}
                        disabled={running}
                        className="bg-primary text-primary-foreground shrink-0 flex items-center justify-center h-8 w-8 rounded-full disabled:opacity-50"
                    >
                        {running ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} className="ml-0.5" />}
                    </button>
                </div>
                
                <div className="p-4 space-y-4 flex-1">
                    <div>
                        <label className="block text-xs font-medium mb-1.5 text-muted-foreground">URL Query Variables</label>
                        <textarea 
                            value={testQuery}
                            onChange={(e) => setTestQuery(e.target.value)}
                            className="w-full h-24 text-xs font-mono rounded-md border bg-muted/20 p-3" 
                        />
                    </div>
                    {['POST', 'PUT', 'PATCH'].includes(formData.method) && (
                        <div>
                            <label className="block text-xs font-medium mb-1.5 text-muted-foreground">Request Body</label>
                            <textarea 
                                value={testBody}
                                onChange={(e) => setTestBody(e.target.value)}
                                className="w-full h-40 text-xs font-mono rounded-md border bg-muted/20 p-3" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Response Pane */}
            <div className="w-full md:w-1/2 flex flex-col bg-[#1e1e1e] text-[#d4d4d4]">
                <div className="p-2.5 border-b border-[#333] flex items-center justify-between text-xs">
                    <span className="font-medium text-gray-400">Response Console</span>
                    {response && (
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                                {response.status >= 200 && response.status < 300 ? (
                                    <CheckCircle2 size={14} className="text-green-500" />
                                ) : (
                                    <XCircle size={14} className="text-red-500" />
                                )}
                                <span className={response.status >= 200 && response.status < 300 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                                    {response.status}
                                </span>
                            </span>
                            <span className="text-gray-500 font-mono">{response.time}ms</span>
                        </div>
                    )}
                </div>
                <div className="p-4 flex-1 overflow-auto">
                    {running ? (
                        <div className="h-full flex items-center justify-center text-gray-500 gap-2 text-sm">
                            <Loader2 size={16} className="animate-spin" /> Executing request...
                        </div>
                    ) : response ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap">
                            {JSON.stringify(response.data || response.error || response, null, 2)}
                        </pre>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm italic">
                            <Globe size={32} className="mb-2 opacity-20" />
                            Run the endpoint to view response
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
