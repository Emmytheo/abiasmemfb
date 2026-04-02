'use client'
import React, { useState, useMemo } from 'react'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { TaskType, TaskCategory } from '@/lib/workflow/types'
import { Badge } from '@/components/ui/badge'
import { X, Search } from 'lucide-react'

export function TaskMenu({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const [search, setSearch] = useState('')

    const onDragStart = (e: React.DragEvent, type: TaskType) => {
        e.dataTransfer.setData('application/reactflow', type)
        e.dataTransfer.effectAllowed = 'move'
        if (window.innerWidth < 768) onClose()
    }

    const allTasks = useMemo(() => Object.values(TaskRegistry), [])

    // When searching, flatten all tasks; when not, group by category
    const isSearching = search.trim().length > 0
    const q = search.toLowerCase().trim()

    const filteredFlat = useMemo(() => {
        if (!isSearching) return []
        return allTasks.filter(t =>
            t.label.toLowerCase().includes(q) ||
            t.type.toLowerCase().includes(q) ||
            t.description?.toLowerCase().includes(q) ||
            t.category?.toLowerCase().includes(q)
        )
    }, [allTasks, q, isSearching])

    const categories = useMemo(() => Object.values(TaskCategory), [])

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside
                className={`
                    absolute md:relative z-50 h-full w-72 md:w-64 bg-background border-r flex flex-col overflow-hidden shrink-0 transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:-translate-x-64 md:w-0 md:opacity-0 md:hidden md:border-none'}
                `}
            >
                {/* Header */}
                <div className="px-4 pt-4 pb-3 shrink-0 border-b">
                    <div className="flex items-center justify-between mb-3">
                        <div>
                            <h2 className="text-base font-semibold tracking-tight">Nodes</h2>
                            <p className="text-xs text-muted-foreground">Drag to add to flow</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search nodes…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full h-8 pl-8 pr-7 text-xs rounded-md border bg-muted/30 focus:outline-none focus:ring-1 focus:ring-ring focus:bg-background transition-colors"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X size={12} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Node list */}
                <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 pb-20">
                    {isSearching ? (
                        filteredFlat.length === 0 ? (
                            <div className="text-center text-xs text-muted-foreground py-8">
                                No nodes match &quot;{search}&quot;
                            </div>
                        ) : (
                            <div className="space-y-1">
                                <p className="px-2 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mb-2">
                                    {filteredFlat.length} result{filteredFlat.length !== 1 ? 's' : ''}
                                </p>
                                {filteredFlat
                                    .sort((a, b) => a.type.localeCompare(b.type))
                                    .map(task => (
                                        <TaskItem key={task.type} task={task} onDragStart={onDragStart} />
                                    ))}
                            </div>
                        )
                    ) : (
                        categories.map((cat) => {
                            const tasks = allTasks
                                .filter(t => t.category === cat)
                                .sort((a, b) => a.type.localeCompare(b.type))
                            if (tasks.length === 0) return null
                            return (
                                <div key={cat} className="space-y-1">
                                    <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                                        {cat.replace(/_/g, ' ')}
                                    </h3>
                                    <div className="space-y-0.5">
                                        {tasks.map(task => (
                                            <TaskItem key={task.type} task={task} onDragStart={onDragStart} />
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </aside>
        </>
    )
}

function TaskItem({ task, onDragStart }: { task: any; onDragStart: (e: React.DragEvent, type: TaskType) => void }) {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.type)}
            className="flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing border border-transparent hover:border-border transition-colors group"
        >
            <div className="flex-shrink-0 w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <task.icon size={14} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-xs font-medium leading-none truncate">{task.label}</div>
                {task.isEntryPoint && (
                    <Badge variant="secondary" className="text-[9px] px-1 py-0 h-3.5 mt-0.5">Entry</Badge>
                )}
            </div>
        </div>
    )
}
