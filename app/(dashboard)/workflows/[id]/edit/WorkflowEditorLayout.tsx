'use client'
import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Play, Save, Loader2 } from 'lucide-react'
import { ThemeCustomizer } from '@/components/theme-customizer'
import { FlowEditor, FlowEditorRef, DynamicOptions } from '@/components/workflow/FlowEditor'

interface WorkflowEditorLayoutProps {
    workflowId: string
    workflow: any
    dynamicOptions: DynamicOptions
}

export function WorkflowEditorLayout({ workflowId, workflow, dynamicOptions }: WorkflowEditorLayoutProps) {
    const editorRef = useRef<FlowEditorRef>(null)
    const [isSaving, setIsSaving] = useState<'draft' | 'published' | null>(null)

    const handleSave = async (status: 'draft' | 'published') => {
        if (!editorRef.current) return
        setIsSaving(status)
        await editorRef.current.saveWorkflow(status)
        setIsSaving(null)
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
                        <div className="font-semibold text-sm">
                            {workflowId === 'new' ? 'Create New Workflow' : `Editing workflow: ${workflowId}`}
                        </div>
                        <div className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 text-[10px] font-medium uppercase tracking-wider">
                            Draft
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ThemeCustomizer />
                    <button className="h-8 px-3 text-xs bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md font-medium transition-colors flex items-center gap-2">
                        <Play size={14} /> Test Run
                    </button>
                    <button
                        onClick={() => handleSave('draft')}
                        disabled={!!isSaving || workflowId === 'new'}
                        className="h-8 px-3 text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-md font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                    >
                        {isSaving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                        Save Draft
                    </button>
                    <button
                        onClick={() => handleSave('published')}
                        disabled={!!isSaving || workflowId === 'new'}
                        className="h-8 px-3 text-xs bg-green-600 text-white hover:bg-green-700 rounded-md font-medium transition-colors shadow-sm ml-2 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSaving === 'published' && <Loader2 size={14} className="animate-spin" />}
                        Publish
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full relative min-h-0 overflow-hidden">
                <FlowEditor
                    ref={editorRef}
                    dynamicOptions={dynamicOptions}
                    workflowId={workflowId !== 'new' ? workflowId : undefined}
                    initialData={workflow?.definition as any}
                />
            </div>
        </div>
    )
}
