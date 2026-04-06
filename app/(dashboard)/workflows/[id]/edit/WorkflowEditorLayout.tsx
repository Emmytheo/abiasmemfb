'use client'
import React, { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Save, Loader2, Check, Pencil, Zap } from 'lucide-react'
import { ThemeCustomizer } from '@/components/theme-customizer'
import { FlowEditor, SaveWorkflowFn, DynamicOptions } from '@/components/workflow/FlowEditor'
import { toast } from 'sonner'
import { renameWorkflow } from '@/app/(dashboard)/workflows/actions'
import { runWorkflow } from './actions'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WorkflowRunHistoryTab } from '@/components/workflow/WorkflowRunHistoryTab'
import { Layout, History, Database, Activity } from 'lucide-react'

interface WorkflowEditorLayoutProps {
    workflowId: string
    workflow: any
    dynamicOptions: DynamicOptions
}

export function WorkflowEditorLayout({ workflowId, workflow, dynamicOptions }: WorkflowEditorLayoutProps) {
    const saveFnRef = useRef<SaveWorkflowFn | null>(null)
    const [isSaving, setIsSaving] = useState<'draft' | 'published' | null>(null)
    const [isRunning, setIsRunning] = useState(false)
    const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'editor' | 'runs'>('editor')
    const [refreshKey, setRefreshKey] = useState(0)

    // Editable workflow name state
    const [wfName, setWfName] = useState(workflow?.name || 'Untitled Workflow')
    const [isEditingName, setIsEditingName] = useState(false)
    const nameInputRef = useRef<HTMLInputElement>(null)

    const handleReady = useCallback((fn: SaveWorkflowFn) => {
        saveFnRef.current = fn
    }, [])

    const handleSave = async (status: 'draft' | 'published') => {
        if (!saveFnRef.current) {
            toast.error('Editor is still loading, please wait...')
            return
        }
        setIsSaving(status)
        try {
            await saveFnRef.current(status)
        } finally {
            setIsSaving(null)
        }
    }

    const handleNameSave = async () => {
        const trimmed = wfName.trim()
        if (!trimmed) {
            setWfName(workflow?.name || 'Untitled Workflow')
            setIsEditingName(false)
            return
        }
        if (workflowId !== 'new' && trimmed !== workflow?.name) {
            const result = await renameWorkflow(workflowId, trimmed)
            if (result.success) {
                toast.success('Workflow renamed')
            } else {
                toast.error(result.error || 'Failed to rename')
            }
        }
        setIsEditingName(false)
    }

    const currentStatus = workflow?.status || 'DRAFT'

    const handleTestRun = async () => {
        if (workflowId === 'new') {
            toast.error('Please save and publish the workflow before testing.')
            return
        }
        if (currentStatus !== 'PUBLISHED') {
            toast.error('Workflow must be published before running. Click "Publish" first.')
            return
        }
        setIsRunning(true)
        setCurrentExecutionId(null) // reset visual state
        try {
            const result = await runWorkflow(workflowId)
            if (result.success && result.executionId) {
                toast.success(`Workflow executed! Execution ID: ${result.executionId}`)
                setCurrentExecutionId(result.executionId) 
                setRefreshKey(prev => prev + 1)
                setActiveTab('runs') // Auto-switch to runs tab
            } else {
                toast.error(result.error || 'Execution failed.')
            }
        } catch (e: any) {
            toast.error(e.message || 'An unexpected error occurred.')
        } finally {
            setIsRunning(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-muted/40 animate-in fade-in duration-200">
            <header className="h-14 bg-background border-b flex items-center justify-between px-2 sm:px-4 gap-2 shrink-0 overflow-hidden">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <Link href="/workflows" className="p-1.5 hover:bg-muted rounded-md transition-colors text-muted-foreground hover:text-foreground shrink-0">
                        <ArrowLeft size={16} />
                    </Link>
                    <div className="h-4 w-px bg-border my-auto shrink-0" />
                    <div className="flex items-center gap-2 min-w-0">
                        {isEditingName ? (
                            <input
                                ref={nameInputRef}
                                value={wfName}
                                onChange={(e) => setWfName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameSave()
                                    if (e.key === 'Escape') { setWfName(workflow?.name || 'Untitled Workflow'); setIsEditingName(false) }
                                }}
                                onBlur={handleNameSave}
                                autoFocus
                                className="font-semibold text-sm bg-transparent border border-primary/50 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-[140px] sm:max-w-[220px] min-w-0"
                            />
                        ) : (
                            <div
                                className="font-semibold text-sm flex items-center gap-1.5 cursor-pointer group/name min-w-0"
                                onClick={() => setIsEditingName(true)}
                                title="Click to rename"
                            >
                                <span className="truncate">{wfName}</span>
                                <Pencil size={12} className="text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity shrink-0" />
                            </div>
                        )}
                        <div className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-medium uppercase tracking-wider shrink-0 ${currentStatus === 'PUBLISHED'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-amber-500/10 text-amber-600'
                            }`}>
                            {currentStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </div>
                    </div>
                </div>

                <div className="hidden lg:flex items-center justify-center flex-1 max-w-md mx-auto">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <TabsList className="grid grid-cols-2 bg-muted/60 h-9 p-1 rounded-lg">
                            <TabsTrigger value="editor" className="text-xs h-7 gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Layout size={14} /> Design
                            </TabsTrigger>
                            <TabsTrigger value="runs" className="text-xs h-7 gap-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                <Activity size={14} /> Runs
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <ThemeCustomizer />
                    <button
                        onClick={handleTestRun}
                        disabled={isRunning || !!isSaving || workflowId === 'new'}
                        className="h-8 px-2.5 sm:px-3 text-xs bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        <span className="hidden sm:inline">{isRunning ? 'Starting...' : 'Test Run'}</span>
                    </button>
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={!!isSaving}
                        className="h-8 px-2.5 sm:px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {isSaving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        <span className="hidden sm:inline">Save Draft</span>
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={!!isSaving}
                        className="h-8 px-2.5 sm:px-3 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving === 'published' ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} className="sm:hidden" />}
                        <span className="hidden sm:inline">Publish</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full relative min-h-0 overflow-hidden">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="h-full flex flex-col">
                    {/* Mobile Switcher (Bottom) */}
                    <div className="lg:hidden h-12 bg-background border-b flex items-center px-4 shrink-0">
                        <TabsList className="bg-muted h-8 p-1 w-full grid grid-cols-2">
                            <TabsTrigger value="editor" className="text-[10px] h-6 font-bold uppercase tracking-widest">Design</TabsTrigger>
                            <TabsTrigger value="runs" className="text-[10px] h-6 font-bold uppercase tracking-widest">Runs</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="editor" className="flex-1 m-0 relative">
                        <FlowEditor
                            onReady={handleReady}
                            dynamicOptions={dynamicOptions}
                            workflowId={workflowId !== 'new' ? workflowId : undefined}
                            initialData={workflow?.definition as any}
                            runningExecutionId={currentExecutionId}
                        />
                    </TabsContent>
                    <TabsContent value="runs" className="flex-1 m-0">
                        <WorkflowRunHistoryTab 
                            workflowId={workflowId} 
                            refreshKey={refreshKey}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}
