'use client'
import React from 'react'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { TaskType, TaskCategory } from '@/lib/workflow/types'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'

export function TaskMenu({
    isOpen,
    onClose
}: {
    isOpen: boolean
    onClose: () => void
}) {
    const onDragStart = (e: React.DragEvent, type: TaskType) => {
        e.dataTransfer.setData('application/reactflow', type)
        e.dataTransfer.effectAllowed = 'move'
        // On mobile, close sidebar after starting a drag so they can see drop target
        if (window.innerWidth < 768) {
            onClose()
        }
    }

    const categories = Object.values(TaskCategory)

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
                    absolute md:relative z-50 h-full w-72 md:w-64 bg-background border-r flex flex-col pt-4 overflow-hidden shrink-0 transition-all duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full md:-translate-x-64 md:w-0 md:opacity-0 md:hidden md:border-none'}
                `}
            >
                <div className="px-4 pb-4 shrink-0 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold tracking-tight">Nodes</h2>
                        <p className="text-sm text-muted-foreground">Drag to add to flow</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-muted-foreground hover:bg-muted rounded-md"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-20">
                    {categories.map((cat) => {
                        const tasks = Object.values(TaskRegistry)
                            .filter(t => t.category === cat)
                            .sort((a, b) => a.type.localeCompare(b.type)) // Stable Sort for React Hydration
                        if (tasks.length === 0) return null

                        return (
                            <div key={cat} className="space-y-2">
                                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                    {cat.replace('_', ' ')}
                                </h3>
                                <div className="space-y-1">
                                    {tasks.map((task) => (
                                        <div
                                            key={task.type}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, task.type)}
                                            className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted cursor-grab active:cursor-grabbing border border-transparent hover:border-border transition-colors group"
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                                <task.icon size={16} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium leading-none mb-1">{task.label}</div>
                                                {task.isEntryPoint && (
                                                    <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">Entry</Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </aside>
        </>
    )
}
