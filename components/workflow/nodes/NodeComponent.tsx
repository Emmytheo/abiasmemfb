'use client'
import React, { memo } from 'react'
import { FormField } from '@/components/ui/form' // if you use it, or customize below
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { AppNode, TaskParamType, TaskType } from '@/lib/workflow/types'

const getColorForParamType = (type: TaskParamType) => {
    switch (type) {
        case TaskParamType.STRING:
        case TaskParamType.TEXTAREA:
        case TaskParamType.SELECT:
            return '!bg-blue-500'
        case TaskParamType.NUMBER:
            return '!bg-emerald-500'
        case TaskParamType.BOOLEAN:
            return '!bg-purple-500'
        case TaskParamType.JSON:
            return '!bg-amber-500'
        case TaskParamType.CREDENTIAL:
        case TaskParamType.PROVIDER:
            return '!bg-rose-500'
        default:
            return '!bg-muted-foreground'
    }
}

const NodeComponent = memo((props: NodeProps<AppNode>) => {
    const { data, selected } = props
    const task = TaskRegistry[data.type]

    if (!task) return <div className="p-4 bg-destructive text-white rounded-md">Unknown Task: {data.type}</div>

    // Special handling for GROUP nodes to make them act as visual dashed containers
    // Note: To make GROUP fully nestable, ReactFlow requires updating the exact drag/drop handling 
    // to map parentNode properties, but visually we can style it as a wide block.
    if (data.type === TaskType.GROUP) {
        return (
            <>
                <NodeResizer minWidth={300} minHeight={200} isVisible={selected} lineClassName="border-primary" handleClassName="h-3 w-3 bg-background border-2 border-primary rounded" />
                <div className={`w-full h-full bg-card/40 rounded-xl border-2 border-dashed shadow-sm transition-all relative ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/60'}`}>
                    {/* HEADER */}
                    <div className="px-4 py-3 border-b border-border/60 flex items-center gap-3 rounded-t-xl bg-card">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <task.icon size={18} />
                        </div>
                        <div className="flex-1">
                            <div className="font-semibold text-sm">{task.label}</div>
                            <div className="text-xs text-muted-foreground line-clamp-1">Visual Container</div>
                        </div>
                    </div>
                </div>
            </>
        )
    }

    return (
        <div className={`min-w-[280px] bg-card rounded-xl border-2 shadow-sm transition-all relative ${selected ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>

            {/* HEADER */}
            <div className="px-4 py-3 bg-muted/50 border-b flex items-center gap-3 rounded-t-xl">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <task.icon size={18} />
                </div>
                <div className="flex-1">
                    <div className="font-semibold text-sm">{task.label}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1" title={task.description}>
                        {task.description}
                    </div>
                </div>
            </div>

            {/* INPUTS */}
            <div className="p-4 flex flex-col gap-4">
                {task.inputs.map((input) => (
                    <div key={input.name} className="relative group">
                        {!input.hideHandle && (
                            <Handle
                                type="target"
                                position={Position.Left}
                                id={input.name}
                                className={`w-3 h-3 border-2 border-background rounded-full transition-all !-left-5 hover:scale-150 ${getColorForParamType(input.type)} ${!input.required && 'opacity-50'}`}
                            />
                        )}

                        <div className="flex flex-col gap-1.5 bg-background border rounded-md p-2 hover:border-border/80 transition-colors">
                            <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getColorForParamType(input.type).replace('!bg-', 'bg-')}`} />
                                    <span>{input.name}</span>
                                </div>
                                {input.required && <span className="text-destructive">*</span>}
                            </div>

                            {/* Simple value preview or inline input for standard props */}
                            <div className="text-sm font-mono truncate px-1 opacity-70 flex items-center">
                                {data.inputs?.[input.name] !== undefined && data.inputs?.[input.name] !== '' ? (
                                    typeof data.inputs[input.name] === 'string' && data.inputs[input.name].match(/\{\{.*\}\}/) ? (
                                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-semibold border border-primary/20 truncate">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0 animate-pulse" />
                                            <span className="truncate">{data.inputs[input.name]}</span>
                                        </div>
                                    ) : (
                                        typeof data.inputs[input.name] === 'object' ? '{...}' : String(data.inputs[input.name])
                                    )
                                ) : (
                                    <span className="italic opacity-50">Empty</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* OUTPUTS */}
            {(task.outputs.length > 0 || data.type === TaskType.MAP_FIELDS) && (
                <div className="px-4 py-3 bg-muted/30 border-t flex flex-col gap-2 rounded-b-xl">
                    {/* Standard explicitly defined outputs */}
                    {task.outputs.map((output) => (
                        <div key={output.name} className="relative flex justify-end items-center group text-xs text-muted-foreground font-mono">
                            <div className="flex items-center gap-2 pr-1">
                                <span>{output.name}</span>
                                <div className={`w-2 h-2 rounded-full ${getColorForParamType(output.type).replace('!bg-', 'bg-')}`} />
                            </div>
                            <Handle
                                type="source"
                                position={Position.Right}
                                id={output.name}
                                className={`w-3 h-3 border-2 border-background rounded-full transition-all !-right-5 hover:scale-150 ${getColorForParamType(output.type)}`}
                            />
                        </div>
                    ))}

                    {/* Dynamic Outputs specific to MAP_FIELDS task */}
                    {data.type === TaskType.MAP_FIELDS && data.inputs?.schema && (
                        (() => {
                            try {
                                const parsedSchema = typeof data.inputs.schema === 'string' ? JSON.parse(data.inputs.schema) : data.inputs.schema

                                let keysToRender: string[] = []
                                if (Array.isArray(parsedSchema)) {
                                    keysToRender = parsedSchema.filter(k => typeof k === 'string')
                                } else if (typeof parsedSchema === 'object' && parsedSchema !== null) {
                                    keysToRender = Object.keys(parsedSchema)
                                }

                                return keysToRender.map((key) => (
                                    <div key={`mapped-${key}`} className="relative flex justify-end items-center group text-xs text-primary font-mono mt-1">
                                        <div className="flex items-center gap-2 pr-1">
                                            <span>{key}</span>
                                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                                        </div>
                                        <Handle
                                            type="source"
                                            position={Position.Right}
                                            id={key}
                                            className="w-3 h-3 border-2 border-background rounded-full transition-all !-right-5 hover:scale-150 !bg-amber-500"
                                        />
                                    </div>
                                ))
                            } catch (e) {
                                // Ignore parse errors while typing
                            }
                            return null
                        })()
                    )}
                </div>
            )}

        </div>
    )
})

NodeComponent.displayName = 'NodeComponent'
export { NodeComponent }
