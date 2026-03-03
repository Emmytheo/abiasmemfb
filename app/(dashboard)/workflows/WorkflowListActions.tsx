'use client'
import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical, Edit3, Copy, Trash2, ToggleLeft, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { renameWorkflow, duplicateWorkflow, deleteWorkflow, toggleWorkflowStatus } from './actions'

interface WorkflowActionsProps {
    workflowId: string
    currentName: string
    currentStatus: string
}

export function WorkflowActions({ workflowId, currentName, currentStatus }: WorkflowActionsProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 })
    const btnRef = useRef<HTMLButtonElement>(null)
    const menuRef = useRef<HTMLDivElement>(null)

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (
                menuRef.current && !menuRef.current.contains(e.target as Node) &&
                btnRef.current && !btnRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [isOpen])

    const toggleMenu = () => {
        if (!isOpen && btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect()
            setMenuPos({
                top: rect.bottom + 4,
                left: rect.right - 192, // 192 = w-48 = 12rem
            })
        }
        setIsOpen(!isOpen)
    }

    const handleDuplicate = async () => {
        setIsOpen(false)
        const result = await duplicateWorkflow(workflowId)
        if (result.success) {
            toast.success('Workflow duplicated')
        } else {
            toast.error(result.error || 'Failed to duplicate')
        }
    }

    const handleDelete = async () => {
        setIsOpen(false)
        if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) return
        const result = await deleteWorkflow(workflowId)
        if (result.success) {
            toast.success('Workflow deleted')
        } else {
            toast.error(result.error || 'Failed to delete')
        }
    }

    const handleToggleStatus = async () => {
        setIsOpen(false)
        const result = await toggleWorkflowStatus(workflowId, currentStatus)
        if (result.success) {
            toast.success(`Workflow ${currentStatus === 'PUBLISHED' ? 'unpublished' : 'published'}`)
        } else {
            toast.error(result.error || 'Failed to update status')
        }
    }

    return (
        <>
            <button
                ref={btnRef}
                onClick={toggleMenu}
                className="p-2 hover:bg-muted rounded-md text-muted-foreground transition-colors"
            >
                <MoreVertical size={16} />
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(
                <div
                    ref={menuRef}
                    className="fixed w-48 bg-popover border border-border rounded-lg shadow-lg z-[9999] py-1 animate-in fade-in zoom-in-95 duration-100"
                    style={{ top: menuPos.top, left: menuPos.left }}
                >
                    <button
                        onClick={() => {
                            setIsOpen(false)
                            window.dispatchEvent(new CustomEvent('workflow-rename', { detail: { id: workflowId } }))
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                        <Edit3 size={14} className="text-muted-foreground" />
                        Rename
                    </button>
                    <button
                        onClick={handleDuplicate}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                        <Copy size={14} className="text-muted-foreground" />
                        Duplicate
                    </button>
                    <button
                        onClick={handleToggleStatus}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-muted transition-colors text-left"
                    >
                        <ToggleLeft size={14} className="text-muted-foreground" />
                        {currentStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                    </button>
                    <div className="border-t my-1" />
                    <button
                        onClick={handleDelete}
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left"
                    >
                        <Trash2 size={14} />
                        Delete
                    </button>
                </div>,
                document.body
            )}
        </>
    )
}

interface InlineRenameProps {
    workflowId: string
    currentName: string
}

export function InlineRename({ workflowId, currentName }: InlineRenameProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(currentName)
    const [isSaving, setIsSaving] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    // Listen for the rename event dispatched by WorkflowActions
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent).detail
            if (detail?.id === workflowId) {
                setIsEditing(true)
            }
        }
        window.addEventListener('workflow-rename', handler)
        return () => window.removeEventListener('workflow-rename', handler)
    }, [workflowId])

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    const handleSave = async () => {
        const trimmed = name.trim()
        if (!trimmed || trimmed === currentName) {
            setName(currentName)
            setIsEditing(false)
            return
        }
        setIsSaving(true)
        const result = await renameWorkflow(workflowId, trimmed)
        setIsSaving(false)
        if (result.success) {
            toast.success('Workflow renamed')
            setIsEditing(false)
        } else {
            toast.error(result.error || 'Failed to rename')
        }
    }

    const handleCancel = () => {
        setName(currentName)
        setIsEditing(false)
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-1.5">
                <input
                    ref={inputRef}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSave()
                        if (e.key === 'Escape') handleCancel()
                    }}
                    disabled={isSaving}
                    className="font-medium text-foreground bg-transparent border border-primary/50 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full max-w-xs"
                />
                <button onClick={handleSave} disabled={isSaving} className="p-1 hover:bg-muted rounded text-green-600">
                    <Check size={14} />
                </button>
                <button onClick={handleCancel} className="p-1 hover:bg-muted rounded text-muted-foreground">
                    <X size={14} />
                </button>
            </div>
        )
    }

    return (
        <div
            className="font-medium text-foreground cursor-pointer hover:underline decoration-dashed underline-offset-4"
            onDoubleClick={() => setIsEditing(true)}
            title="Double-click to rename"
        >
            {currentName}
        </div>
    )
}

const TRIGGER_LABELS: Record<string, string> = {
    MANUAL: 'Manual',
    APPLICATION_SUBMIT: 'Application Submit',
    CRON: 'Cron Schedule',
    WEBHOOK: 'Webhook',
}

export function TriggerBadge({ trigger }: { trigger: string }) {
    return (
        <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-normal bg-background">
            {TRIGGER_LABELS[trigger] || trigger}
        </span>
    )
}
