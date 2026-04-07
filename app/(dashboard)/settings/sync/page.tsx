'use client'

import React, { useState, useEffect } from 'react'
import { 
    Settings2, 
    RefreshCw, 
    Database, 
    Link as LinkIcon, 
    ShieldCheck, 
    ShieldAlert, 
    Activity, 
    Plus, 
    Trash2, 
    Loader2,
    CheckCircle2,
    AlertCircle,
    Package,
    Cpu,
    ArrowRightLeft
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { SiteSettings } from "@/lib/api/types"
import { HarmonizationReport } from "@/components/dashboard/HarmonizationReport"

export default function SyncSettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [isDiscovering, setIsDiscovering] = useState(false)
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [endpoints, setEndpoints] = useState<any[]>([])
    const [healthStatus, setHealthStatus] = useState<Record<string, 'healthy' | 'unhealthy' | 'checking'>>({})
    const [logs, setLogs] = useState<{message: string, type: string, timestamp: string}[]>([])
    const logEndRef = React.useRef<HTMLDivElement>(null)

    // Auto-scroll logs
    useEffect(() => {
        if (logEndRef.current) {
            logEndRef.current.scrollIntoView({ behavior: 'smooth' })
        }
    }, [logs])

    useEffect(() => {
        async function loadData() {
            try {
                const [s, eps] = await Promise.all([
                    api.getSiteSettings(),
                    (api as any).getAllEndpoints?.() || Promise.resolve([])
                ])
                setSettings(s)
                setEndpoints(eps || [])
            } catch (err) {
                toast.error("Failed to load sync configurations")
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    const handleSave = async () => {
        if (!settings) return
        setIsSaving(true)
        try {
            await api.updateSiteSettings(settings)
            toast.success("Sync settings updated successfully")
        } catch (err) {
            toast.error("Failed to save settings")
        } finally {
            setIsSaving(false)
        }
    }

    const runDiscovery = async () => {
        setIsDiscovering(true)
        setLogs([]) // Clear previous logs
        
        toast.info("Establishing Live Sync Stream...", {
            description: "Connection opened to Core Banking discovery engine."
        })

        try {
            const eventSource = new EventSource('/api/sync/customers/stream')
            
            eventSource.onmessage = (event) => {
                try {
                    const log = JSON.parse(event.data)
                    setLogs(prev => [...prev.slice(-49), log]) // Keep last 50 logs for performance
                } catch (e) {
                    console.error("Failed to parse log event", e)
                }
            }

            eventSource.onerror = (error) => {
                console.error("EventSource failed:", error)
                eventSource.close()
                setIsDiscovering(false)
                toast.error("Sync stream disconnected unexpectedly.")
            }

            // We don't have a built-in 'close' event for EventSource, 
            // but our route closes the stream which triggers 'onerror' 
            // or we can detect a 'success' message.
        } catch (err) {
            toast.error("Failed to connect to sync stream")
            setIsDiscovering(false)
        }
    }

    const checkHealth = async (endpointId: string) => {
        if (!endpointId) return
        setHealthStatus(prev => ({ ...prev, [endpointId]: 'checking' }))
        try {
            const res = await fetch(`/api/endpoints/health/${endpointId}`)
            const data = await res.json()
            setHealthStatus(prev => ({ ...prev, [endpointId]: data.healthy ? 'healthy' : 'unhealthy' }))
        } catch (err) {
            setHealthStatus(prev => ({ ...prev, [endpointId]: 'unhealthy' }))
        }
    }

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!settings) return <div className="p-8 text-center font-bold text-lg">Settings not initialized. Check CMS globals.</div>

    return (
        <div className="space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 p-3 md:p-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10 py-4 border-b -mx-3 px-3 md:mx-0 md:px-0 md:border-none md:static md:bg-transparent">
                <div>
                    <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary/70 mb-1">System Infrastructure</p>
                    <h1 className="text-2xl md:text-3xl font-black tracking-tight">Sync & Discovery</h1>
                    <p className="hidden md:block text-muted-foreground mt-1 max-w-xl">
                        Manage Qore Core Banking integration, discovery seeds, and registry synchronization endpoints.
                    </p>
                </div>
                <div className="flex items-center gap-2 md:gap-3 w-full md:w-auto">
                    <Button 
                        variant="outline" 
                        onClick={runDiscovery} 
                        disabled={isDiscovering}
                        className="grow md:grow-0 bg-background h-10 md:h-11"
                    >
                        {isDiscovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Activity className="h-4 w-4 mr-2" />}
                        <span className="hidden sm:inline">Run Discovery</span>
                        <span className="sm:hidden text-xs">Discovery</span>
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} className="grow md:grow-0 h-10 md:h-11 shadow-lg shadow-primary/20">
                        {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                        Save Changes
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="settings" className="w-full">
                <TabsList className="bg-muted/50 !h-full p-2 rounded-xl mb-8 flex-wrap h-auto gap-1">
                    <TabsTrigger value="settings" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
                        <Settings2 className="h-4 w-4 mr-2" /> Discovery Settings
                    </TabsTrigger>
                    <TabsTrigger value="harmonization" className="rounded-lg py-2 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm text-xs font-bold uppercase tracking-wider">
                        <ArrowRightLeft className="h-4 w-4 mr-2" /> Identity Harmonization
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="settings" className="space-y-4 md:space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
                        {/* Left Columns: Sync Settings */}
                        <div className="lg:col-span-2 space-y-4 md:space-y-6">
                            {/* Identity & Ledger Endpoints */}
                            <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5">
                                <CardHeader className="bg-primary/[0.02] border-b p-4 md:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <Database className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Identity & Ledger Endpoints</CardTitle>
                                            <CardDescription className="text-xs">Core paths for customer and account resolution.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <EndpointSelector 
                                            label="Customer Lookup"
                                            value={getEndpointId(settings.sync.customerLookupEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, customerLookupEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.customerLookupEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.customerLookupEndpoint))}
                                        />
                                        <EndpointSelector 
                                            label="Account Enquiry"
                                            value={getEndpointId(settings.sync.accountEnquiryEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, accountEnquiryEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.accountEnquiryEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.accountEnquiryEndpoint))}
                                        />
                                    </div>
                                    <div className="pt-4 mt-4 border-t">
                                        <EndpointSelector 
                                            label="Deep Sync (Accounts Discovery)"
                                            value={getEndpointId(settings.sync.customerAccountsEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, customerAccountsEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.customerAccountsEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.customerAccountsEndpoint))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Product & Service Registry Endpoints */}
                            <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5">
                                <CardHeader className="bg-indigo-500/[0.02] border-b p-4 md:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                                            <Package className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Registry Synchronization</CardTitle>
                                            <CardDescription className="text-xs">Endpoints for mapping Qore products and services.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                        <EndpointSelector 
                                            label="Product Sync Path"
                                            value={getEndpointId(settings.sync.productSyncEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, productSyncEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.productSyncEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.productSyncEndpoint))}
                                        />
                                        <EndpointSelector 
                                            label="Service Registry Path"
                                            value={getEndpointId(settings.sync.serviceSyncEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, serviceSyncEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.serviceSyncEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.serviceSyncEndpoint))}
                                        />
                                    </div>
                                    <div className="pt-4 mt-4 border-t">
                                        <EndpointSelector 
                                            label="Primary Bridge Push (Customer Update)"
                                            value={getEndpointId(settings.sync.customerUpdateEndpoint)}
                                            onChange={(val) => setSettings({...settings, sync: {...settings.sync, customerUpdateEndpoint: val}})}
                                            endpoints={endpoints}
                                            health={healthStatus[getEndpointId(settings.sync.customerUpdateEndpoint)]}
                                            onCheck={() => checkHealth(getEndpointId(settings.sync.customerUpdateEndpoint))}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Automation & Seeds */}
                            <Card className="border-2 border-primary/5 shadow-xl shadow-primary/5 overflow-hidden">
                                <CardHeader className="bg-primary/[0.02] border-b p-4 md:p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                            <LinkIcon className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">Discovery Seeds (Baseline)</CardTitle>
                                            <CardDescription className="text-xs">Seed accounts used to identify and map customers.</CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 space-y-6">
                                    <div className="space-y-4">
                                        {settings.sync.baselineAccounts.map((acc, idx) => (
                                            <div key={idx} className="flex gap-2 items-center group animate-in slide-in-from-left-2 fade-in duration-200">
                                                <div className="grow relative">
                                                    <Input 
                                                        value={acc.accountNumber}
                                                        onChange={(e) => {
                                                            const newAccts = [...settings.sync.baselineAccounts]
                                                            newAccts[idx].accountNumber = e.target.value
                                                            setSettings({...settings, sync: {...settings.sync, baselineAccounts: newAccts}})
                                                        }}
                                                        placeholder="Enter account number..."
                                                        className="pl-9 h-11 md:h-10 text-base md:text-sm"
                                                    />
                                                    <Badge className="absolute left-2.5 top-3 md:top-2.5 bg-muted text-muted-foreground hover:bg-muted border-none p-0 w-5 h-5 flex items-center justify-center text-[10px]">{idx + 1}</Badge>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="text-destructive h-11 w-11 md:h-10 md:w-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                                                    onClick={() => {
                                                        const newAccts = settings.sync.baselineAccounts.filter((_, i) => i !== idx)
                                                        setSettings({...settings, sync: {...settings.sync, baselineAccounts: newAccts}})
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button 
                                            variant="outline" 
                                            className="w-full border-dashed border-2 h-12 text-muted-foreground hover:text-primary transition-all rounded-xl"
                                            onClick={() => {
                                                setSettings({...settings, sync: {...settings.sync, baselineAccounts: [...settings.sync.baselineAccounts, { accountNumber: '' }]}})
                                            }}
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            Add Discovery Seed
                                        </Button>
                                    </div>

                                    <div className="pt-6 border-t flex items-center justify-between gap-4">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm md:text-base font-bold">Automated Daily Discovery</Label>
                                            <p className="text-[10px] md:text-sm text-muted-foreground">Automatically scan baseline accounts for registry changes every 24h.</p>
                                        </div>
                                        <Switch 
                                            checked={settings.sync.autoDiscoveryEnabled}
                                            onCheckedChange={(val) => setSettings({...settings, sync: {...settings.sync, autoDiscoveryEnabled: val}})}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Column: Status Summary */}
                        <div className="space-y-4 md:space-y-6">
                            <Card className="shadow-lg shadow-emerald-500/5">
                                <CardHeader className="p-4 md:p-6">
                                    <CardTitle className="text-lg">System Integrity</CardTitle>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6 pt-0 space-y-4">
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                                        <ShieldCheck className="h-5 w-5 text-emerald-600" />
                                        <div className="text-xs">
                                            <p className="font-bold text-emerald-950">Active Sync Registry</p>
                                            <p className="text-emerald-700/70">Connected to Qore Sandbox Environment.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/20">
                                        <Activity className="h-5 w-5 text-blue-600" />
                                        <div className="text-xs">
                                            <p className="font-bold text-blue-950">Next discovery pulse</p>
                                            <p className="text-blue-700/70 font-mono">Tomorrow, 02:00 AM</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="bg-zinc-950 border-zinc-900 text-white shadow-2xl overflow-hidden">
                                <CardHeader className="p-4 md:p-6 border-b border-white/5">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-zinc-500 text-[10px] uppercase tracking-widest font-black">Live Sync Stream</CardTitle>
                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 md:p-6">
                                    <div className="font-mono text-[10px] space-y-3 opacity-90 h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                                        {logs.length === 0 ? (
                                            <div className="flex flex-col items-center justify-center h-full text-zinc-600 gap-2">
                                                <Database className="h-8 w-8 opacity-20" />
                                                <p>Ready for Pulse Discovery...</p>
                                            </div>
                                        ) : (
                                            <>
                                                {logs.map((log, i) => (
                                                    <div key={i} className="flex gap-2 animate-in fade-in slide-in-from-left-1 duration-200">
                                                        <span className={`shrink-0 font-bold ${
                                                            log.type === 'success' ? 'text-emerald-500' :
                                                            log.type === 'error' ? 'text-rose-500' :
                                                            log.type === 'warn' ? 'text-amber-500' :
                                                            'text-blue-400'
                                                        }`}>
                                                            [{log.type === 'success' ? 'OK' : log.type === 'error' ? 'ER' : log.type === 'warn' ? 'WR' : 'IN'}]
                                                        </span>
                                                        <p className="break-all">{log.message}</p>
                                                    </div>
                                                ))}
                                                <div ref={logEndRef} />
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="harmonization">
                    <HarmonizationReport />
                </TabsContent>
            </Tabs>
        </div>
    )
}

function getEndpointId(endpoint: any): string {
    if (!endpoint) return ''
    return typeof endpoint === 'object' ? endpoint.id : endpoint
}

interface EndpointSelectorProps {
    label: string
    value: string
    onChange: (val: string) => void
    endpoints: any[]
    health?: 'healthy' | 'unhealthy' | 'checking'
    onCheck: () => void
}

function EndpointSelector({ label, value, onChange, endpoints, health, onCheck }: EndpointSelectorProps) {
    return (
        <div className="space-y-2">
            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</Label>
            <div className="flex gap-2">
                <Select value={value} onValueChange={onChange}>
                    <SelectTrigger className="grow h-11 md:h-10 rounded-xl bg-background border-2 border-primary/5 focus:border-primary/20 transition-all">
                        <SelectValue placeholder="Select endpoint..." />
                    </SelectTrigger>
                    <SelectContent>
                        {endpoints.map(ep => (
                            <SelectItem key={ep.id} value={ep.id}>{ep.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={onCheck}
                    disabled={!value}
                    className="shrink-0 h-11 w-11 md:h-10 md:w-10 rounded-xl border-2 border-primary/5 hover:border-primary/20"
                >
                    <Activity className={`h-4 w-4 ${health === 'checking' ? 'animate-spin text-primary' : health === 'healthy' ? 'text-emerald-500' : health === 'unhealthy' ? 'text-destructive' : 'text-muted-foreground' }`} />
                </Button>
            </div>
        </div>
    )
}
