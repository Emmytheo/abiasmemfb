import React, { useMemo } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { Brackets, ChevronRight, Play } from 'lucide-react'
import { useReactFlow, Node } from '@xyflow/react'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { AppNode } from '@/lib/workflow/types'

interface VariableSelectorProps {
    nodeId: string
    onSelectVariable: (variableString: string) => void
}

export function VariableSelector({ nodeId, onSelectVariable }: VariableSelectorProps) {
    const { getNodes, getEdges } = useReactFlow()

    // Recursively find all upstream node IDs connected to this node
    const upstreamNodes = useMemo(() => {
        const edges = getEdges()
        const nodes = getNodes() as AppNode[]
        const visited = new Set<string>()

        const traverseUp = (currentId: string) => {
            const incomingEdges = edges.filter(e => e.target === currentId)
            for (const edge of incomingEdges) {
                if (!visited.has(edge.source)) {
                    visited.add(edge.source)
                    traverseUp(edge.source)
                }
            }
        }

        traverseUp(nodeId)

        // Also explicitly include the TRIGGER node, as it's globally available
        const triggerNode = nodes.find(n => n.data.type === 'TRIGGER')
        if (triggerNode && !visited.has(triggerNode.id)) {
            visited.add(triggerNode.id)
        }

        return Array.from(visited).map(id => nodes.find(n => n.id === id)).filter(Boolean) as AppNode[]
    }, [getNodes, getEdges, nodeId])

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 text-primary bg-primary/5 hover:bg-primary/10 border-primary/20">
                    <Brackets size={14} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0 bg-card border shadow-xl" align="end">
                <div className="px-3 py-2 bg-muted/50 border-b flex items-center gap-2">
                    <Brackets size={14} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Insert Variable</span>
                </div>

                <div className="max-h-64 overflow-y-auto p-1 flex flex-col gap-1">
                    {upstreamNodes.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                            No upstream nodes connected.
                        </div>
                    ) : (
                        upstreamNodes.map(node => {
                            const taskDef = TaskRegistry[node.data.type]
                            if (!taskDef || taskDef.outputs.length === 0) return null

                            const isTrigger = node.data.type === 'TRIGGER'
                            const prefix = isTrigger ? 'TRIGGER_PAYLOAD' : node.id

                            return (
                                <div key={node.id} className="border rounded-md bg-background overflow-hidden">
                                    <div className="px-2 py-1.5 bg-muted/30 flex items-center gap-2 border-b">
                                        {isTrigger ? <Play size={10} className="text-green-500" /> : <taskDef.icon size={10} className="text-primary" />}
                                        <span className="text-[10px] font-semibold truncate">{taskDef.label}</span>
                                    </div>
                                    <div className="flex flex-col">
                                        {taskDef.outputs.map(out => (
                                            <button
                                                key={out.name}
                                                onClick={() => onSelectVariable(`{{${prefix}.${out.name}}}`)}
                                                className="flex items-center justify-between px-2 py-1.5 hover:bg-muted text-left transition-colors group"
                                            >
                                                <div className="flex items-center gap-2 text-xs truncate">
                                                    <ChevronRight size={10} className="text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">{out.name}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
