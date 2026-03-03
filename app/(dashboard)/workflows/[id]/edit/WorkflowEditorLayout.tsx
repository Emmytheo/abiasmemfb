'use client'
import React, { useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Save, Loader2, Check, Pencil, Zap } from 'lucide-react'
import { ThemeCustomizer } from '@/components/theme-customizer'
import { FlowEditor, SaveWorkflowFn, DynamicOptions } from '@/components/workflow/FlowEditor'
import { toast } from 'sonner'
import { renameWorkflow } from '@/app/(dashboard)/workflows/actions'
import { runWorkflow } from './actions'

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
                setCurrentExecutionId(result.executionId) // This triggers the FlowEditor polling loop
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
            <header className="h-14 bg-background border-b flex items-center justify-between px-4 shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/workflows" className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <ArrowLeft size={18} />
                    </Link>
                    <div className="h-4 w-px bg-border my-auto" />
                    <div className="flex items-center gap-2">
                        {isEditingName ? (
                            <div className="flex items-center gap-1.5">
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
                                    className="font-semibold text-sm bg-transparent border border-primary/50 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary max-w-[220px]"
                                />
                            </div>
                        ) : (
                            <div
                                className="font-semibold text-sm flex items-center gap-1.5 cursor-pointer group/name"
                                onClick={() => setIsEditingName(true)}
                                title="Click to rename"
                            >
                                {wfName}
                                <Pencil size={12} className="text-muted-foreground opacity-0 group-hover/name:opacity-100 transition-opacity" />
                            </div>
                        )}
                        <div className={`px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wider ${currentStatus === 'PUBLISHED'
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-amber-500/10 text-amber-600'
                            }`}>
                            {currentStatus === 'PUBLISHED' ? 'Published' : 'Draft'}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeCustomizer />
                    <button
                        onClick={handleTestRun}
                        disabled={isRunning || !!isSaving || workflowId === 'new'}
                        className="h-8 px-3 text-xs bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {isRunning ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                        {isRunning ? 'Starting...' : 'Test Run'}
                    </button>
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={!!isSaving}
                        className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {isSaving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={!!isSaving}
                        className="h-8 px-3 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors shadow-sm ml-2 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving === 'published' && <Loader2 size={14} className="animate-spin" />}
                        Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full relative min-h-0 overflow-hidden">
                <FlowEditor
                    onReady={handleReady}
                    dynamicOptions={dynamicOptions}
                    workflowId={workflowId !== 'new' ? workflowId : undefined}
                    initialData={workflow?.definition as any}
                    runningExecutionId={currentExecutionId}
                />
            </div>
        </div>
    )
}
