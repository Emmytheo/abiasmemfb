'use client'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    useReactFlow,
    ReactFlowProvider,
    Panel,
    ConnectionMode,
    MarkerType,
    Node,
    Edge
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TaskRegistry } from '@/lib/workflow/task/registry'
import { NodeComponent } from './nodes/NodeComponent'
import { TaskMenu } from './TaskMenu'
import { Save, Hand, MousePointer2, Maximize2, X, PlusCircle, Settings2, GripVertical, Beaker } from 'lucide-react'
import { toast } from 'sonner'
import { saveWorkflowDefinition, createWorkflowAndSave } from '@/app/(dashboard)/workflows/[id]/edit/actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { TaskType, AppNode } from '@/lib/workflow/types'
import { VariableSelector } from './VariableSelector'
import { v4 as uuidv4 } from 'uuid'
import { useNodesState, useEdgesState, addEdge, Connection, NodeTypes } from '@xyflow/react' // Re-added these as they were removed but used later
import { useTheme } from 'next-themes' // Re-added this as it was removed but used later

const initialNodes: AppNode[] = [
    {
        id: 'trigger-1',
        type: 'abiaNode', // custom node type mapped to NodeComponent
        position: { x: 250, y: 100 },
        zIndex: 1,
        data: { type: TaskType.TRIGGER, inputs: {} }
    }
]

const nodeTypes: NodeTypes = {
    abiaNode: NodeComponent,
}

import { Menu, Loader2 } from 'lucide-react'
// Removed Shadcn Select in favor of native select for property panel reliability

export interface DynamicOptions {
    providers: { id: string; label: string }[];
    secrets: { id: string; label: string }[];
    workflows: { id: string; label: string }[];
    applications: { id: string; label: string }[];
}

export type SaveWorkflowFn = (status: 'draft' | 'published') => Promise<void>

interface FlowEditorProps {
    workflowId?: string;
    initialData?: any;
    dynamicOptions: DynamicOptions;
    onReady?: (saveFn: SaveWorkflowFn) => void;
    runningExecutionId?: string | null;
}

function FlowEditorInner({ workflowId, initialData, dynamicOptions, onReady, runningExecutionId }: FlowEditorProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null)
    const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes?.length ? initialData.nodes : initialNodes)
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialData?.edges?.length ? initialData.edges : [])
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)
    useTheme()

    // Expose save function to parent via callback when ReactFlow is ready
    useEffect(() => {
        if (!onReady || !reactFlowInstance) return
        const saveFn: SaveWorkflowFn = async (status) => {
            setIsSaving(true)
            try {
                const flow = reactFlowInstance.toObject()
                const dbStatus = status === 'published' ? 'PUBLISHED' as const : 'DRAFT' as const

                if (!workflowId || workflowId === 'new') {
                    // CREATE new workflow
                    const result = await createWorkflowAndSave(flow, dbStatus)
                    if (result?.success && result.workflowId) {
                        toast.success('Workflow created successfully!')
                        // Navigate to the new workflow's edit page
                        window.location.href = `/workflows/${result.workflowId}/edit`
                    } else {
                        toast.error(result?.error || 'Failed to create workflow')
                    }
                } else {
                    // UPDATE existing workflow
                    const result = await saveWorkflowDefinition(workflowId, flow, dbStatus)
                    if (result?.success) {
                        toast.success(`Workflow ${status === 'published' ? 'published' : 'saved'} successfully`)
                    } else {
                        toast.error(result?.error || 'Failed to save workflow')
                    }
                }
            } catch (e: any) {
                toast.error(e.message || 'An error occurred while saving')
            } finally {
                setIsSaving(false)
            }
        }
        onReady(saveFn)
    }, [reactFlowInstance, workflowId, onReady])

    // Execution polling
    useEffect(() => {
        if (!runningExecutionId) {
            // Clear statuses when not running
            setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, executionStatus: undefined } })))
            return
        }

        let isPolling = true
        let pollTimeout: ReturnType<typeof setTimeout>

        const pollExecution = async () => {
            if (!isPolling) return
            try {
                const res = await fetch(`/api/workflows/executions/${runningExecutionId}`)
                const data = await res.json()

                if (data.success && data.phases) {
                    const statusMap: Record<string, string> = {}
                    data.phases.forEach((p: any) => {
                        statusMap[p.nodeId] = p.status
                    })

                    setNodes((nds) =>
                        nds.map((n) => {
                            const newStatus = statusMap[n.id]
                            if (n.data.executionStatus !== newStatus) {
                                return { ...n, data: { ...n.data, executionStatus: newStatus } }
                            }
                            return n
                        })
                    )

                    // Stop polling if completed or failed
                    if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'CANCELLED') {
                        isPolling = false
                        return
                    }
                }
            } catch (err) {
                console.error('Failed to poll execution status:', err)
            }

            if (isPolling) {
                pollTimeout = setTimeout(pollExecution, 1500)
            }
        }

        pollExecution()

        return () => {
            isPolling = false
            clearTimeout(pollTimeout)
        }
    }, [runningExecutionId, setNodes])

    // Layout states
    const [isMenuOpen, setIsMenuOpen] = useState(true)

    // Property panel state
    const [selectedNode, setSelectedNode] = useState<AppNode | null>(null)

    // Handle input change from the property panel
    const onNodeDataChange = useCallback((nodeId: string, key: string, value: any) => {
        setNodes((nds) =>
            nds.map((n) => {
                if (n.id === nodeId) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            lastUpdated: Date.now(), // Reactive trigger
                            inputs: {
                                ...(typeof n.data.inputs === 'object' && n.data.inputs !== null ? n.data.inputs : {}),
                                [key]: value,
                            },
                        },
                    }
                }
                return n
            })
        )

        // Also update local selectedNode state so the panel reflects changes immediately
        setSelectedNode((prev) => {
            if (prev && prev.id === nodeId) {
                return {
                    ...prev,
                    data: {
                        ...prev.data,
                        lastUpdated: Date.now(),
                        inputs: {
                            ...(typeof prev.data.inputs === 'object' && prev.data.inputs !== null ? prev.data.inputs : {}),
                            [key]: value,
                        },
                    },
                }
            }
            return prev
        })
    }, [setNodes])

    // Intelligent Graph Synchronization 
    // Whenever nodes change, check if any downstream nodes rely on `{{upstream_id}}`
    // If they do, subtly touch their `lastUpdated` to force ReactFlow to re-evaluate dynamic Map Field output Handles!
    useEffect(() => {
        if (!reactFlowInstance) return
        if (nodes.length <= 1) return

        const touchedNodes = new Set<string>()

        nodes.forEach(n => {
            // Find all mustache interpolations inside this node's inputs
            const inputValues = Object.values(n.data.inputs || {})
            inputValues.forEach(val => {
                if (typeof val === 'string' && val.includes('{{')) {
                    // Extract the dependency node ID (e.g. {{node-123.output}})
                    const match = val.match(/\{\{([^.]+)\./)
                    if (match && match[1]) {
                        const sourceId = match[1] === 'TRIGGER_PAYLOAD' ? nodes.find(x => x.data.type === TaskType.TRIGGER)?.id : match[1]

                        if (sourceId) {
                            const sourceNode = nodes.find(x => x.id === sourceId)
                            // If the source recently updated, we must wake up the child!
                            if (sourceNode && sourceNode.data.lastUpdated &&
                                (!n.data.lastUpdated || sourceNode.data.lastUpdated > n.data.lastUpdated)) {
                                touchedNodes.add(n.id)
                            }
                        }
                    }
                }
            })
        })

        if (touchedNodes.size > 0) {
            setNodes(nds => nds.map(n => {
                if (touchedNodes.has(n.id)) {
                    return {
                        ...n,
                        data: {
                            ...n.data,
                            lastUpdated: Date.now() // Cascade the update wave
                        }
                    }
                }
                return n
            }))
        }
    }, [nodes, reactFlowInstance, setNodes])

    const onConnect = useCallback((params: Connection | Edge) => {
        setEdges((eds) => addEdge(params, eds))

        // Intelligent Data-Binding Auto-Injector
        // If the user visually wires an Output Handle to an Input Handle, automatically
        // write the mustache {{SOURCE_NODE.OUTPUT_NAME}} into the node's memory!
        if (params.target && params.targetHandle && params.source && params.sourceHandle) {
            setNodes((nds) => nds.map(n => {
                if (n.id === params.target) {
                    const task = TaskRegistry[n.data.type as TaskType]
                    // Verify the target handle is a legitimate input field
                    if (task && task.inputs.find(i => i.name === params.targetHandle)) {
                        const isTrigger = String(params.source).startsWith('trigger-') || params.source === 'trigger'
                        const prefix = isTrigger ? 'TRIGGER_PAYLOAD' : params.source

                        // Update node's local input state with the bound variable
                        const updatedNode = {
                            ...n,
                            data: {
                                ...n.data,
                                inputs: {
                                    ...(typeof n.data.inputs === 'object' && n.data.inputs !== null ? n.data.inputs : {}),
                                    [params.targetHandle as string]: `{{${prefix}.${params.sourceHandle}}}`
                                }
                            }
                        } as AppNode

                        // Sync property panel if it's the currently selected node
                        setSelectedNode(prev => (prev && prev.id === n.id) ? updatedNode : prev)

                        return updatedNode
                    }
                }
                return n
            }))
        }
    }, [setEdges, setNodes])

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = 'move'
    }, [])

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault()
            if (!reactFlowWrapper.current || !reactFlowInstance) return

            const type = event.dataTransfer.getData('application/reactflow') as TaskType
            if (!type || !TaskRegistry[type]) return // check if valid mapped type

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect()

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX - reactFlowBounds.left,
                y: event.clientY - reactFlowBounds.top,
            })

            const newNode: AppNode = {
                id: `node-${uuidv4()}`,
                type: 'abiaNode',
                position,
                zIndex: type === TaskType.GROUP ? -1 : 1,
                style: type === TaskType.GROUP ? { width: 400, height: 300 } : undefined,
                data: { type, inputs: {} }
            }

            // Check if dropped ON a group node to nest it
            const intersectingNodes = reactFlowInstance.getIntersectingNodes(newNode)
            const groupNode = intersectingNodes.find((n: AppNode) => n.data.type === TaskType.GROUP)

            if (groupNode) {
                newNode.parentId = groupNode.id
                // Position becomes relative to the parent bounding box
                newNode.position = {
                    x: position.x - groupNode.position.x,
                    y: position.y - groupNode.position.y
                }
            }

            setNodes((nds) => nds.concat(newNode))
        },
        [reactFlowInstance, setNodes]
    )

    const onNodeDragStop = useCallback(
        (event: React.MouseEvent, node: AppNode) => {
            if (!reactFlowInstance) return

            if (node.data.type === TaskType.GROUP) return // don't nest groups inside groups

            const intersectingNodes = reactFlowInstance.getIntersectingNodes(node)
            const groupNode = intersectingNodes.find((n: AppNode) => n.data.type === TaskType.GROUP)

            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id === node.id) {
                        // If it intersected a group, parent it!
                        if (groupNode) {
                            if (n.parentId !== groupNode.id) {
                                return {
                                    ...n,
                                    parentId: groupNode.id,
                                    zIndex: 2,
                                    position: {
                                        x: n.position.x - groupNode.position.x,
                                        y: n.position.y - groupNode.position.y,
                                    }
                                } as AppNode
                            }
                        } else if (n.parentId) {
                            // If it used to have a parent but is dragged OUTSIDE any group
                            const oldParent = nds.find(p => p.id === n.parentId)
                            return {
                                ...n,
                                parentId: undefined,
                                extent: undefined,
                                zIndex: 1,
                                position: {
                                    x: oldParent ? n.position.x + oldParent.position.x : n.position.x,
                                    y: oldParent ? n.position.y + oldParent.position.y : n.position.y,
                                }
                            } as AppNode
                        }
                    }
                    return n
                })
            )
        },
        [reactFlowInstance, setNodes]
    )

    const onNodeClick = useCallback((_: React.MouseEvent, node: AppNode) => {
        setSelectedNode(node)
    }, [])

    const onPaneClick = useCallback(() => {
        setSelectedNode(null)
    }, [])

    const handleSave = async () => {
        if (!workflowId || workflowId === 'new') {
            toast.error('Cannot save a new workflow without a DB record yet.')
            return
        }
        if (!reactFlowInstance) return

        setIsSaving(true)
        try {
            const flow = reactFlowInstance.toObject()
            const result = await saveWorkflowDefinition(workflowId, flow)
            if (result?.success) {
                toast.success('Workflow saved successfully')
            } else {
                toast.error(result?.error || 'Failed to save workflow')
            }
        } catch (e: any) {
            toast.error(e.message || 'An error occurred while saving')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="flex w-full h-full bg-background border rounded-lg overflow-hidden relative">
            <TaskMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

            {/* ReactFlow canvas — takes all remaining space */}
            <div className="flex-1 relative h-full" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick as any}
                    onNodeDragStop={onNodeDragStop as any}
                    onPaneClick={onPaneClick}
                    nodeTypes={nodeTypes}
                    fitView
                    minZoom={0.2}
                    maxZoom={2}
                    attributionPosition="bottom-left"
                >
                    <Background color="hsl(var(--muted-foreground))" gap={16} />
                    <Controls
                        className="!bg-card !border-border fill-foreground shadow-sm [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-foreground hover:[&>button]:!bg-muted"
                    />
                    <MiniMap zoomable pannable
                        nodeColor={(n: AppNode) => {
                            if (n.data?.type === TaskType.TRIGGER) return 'hsl(var(--primary))'
                            if (n.data?.type === TaskType.APPROVAL_GATE) return '#f59e0b' // Amber colors stand out better than var(--border)
                            return 'hsl(var(--muted-foreground))'
                        }}
                        maskColor="hsl(var(--background) / 0.8)"
                        style={{ backgroundColor: 'hsl(var(--card))' }}
                        className="hidden md:block !bg-card border border-border shadow-sm rounded-lg overflow-hidden"
                    />

                    <Panel position="top-left" className="flex gap-2 p-2">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="bg-background border text-foreground p-2 rounded-md shadow-sm text-sm hover:bg-muted transition-colors opacity-90"
                            title="Toggle Node Menu"
                        >
                            <Menu size={20} />
                        </button>
                    </Panel>

                    <Panel position="top-right" className="flex gap-2 p-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !workflowId || workflowId === 'new'}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSaving && <Loader2 size={14} className="animate-spin" />}
                            Save Workflow
                        </button>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Property Panel — sibling of ReactFlow wrapper, outside pointer-event scope */}
            <div className={`
                h-full transition-all duration-300 ease-in-out flex-shrink-0 border-l bg-background relative z-20
                ${selectedNode ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none border-l-0'}
            `} style={{ minWidth: 0 }}>
                {selectedNode && (
                    <aside
                        className="w-full h-full border-l bg-background p-4 flex flex-col gap-4 overflow-y-auto z-10"
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-4 border-b shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary/10 p-2 rounded-md text-primary">
                                    {React.createElement(TaskRegistry[selectedNode.data.type].icon, { size: 18 })}
                                </div>
                                <div>
                                    <h3 className="font-semibold">{TaskRegistry[selectedNode.data.type].label}</h3>
                                    <p className="text-xs text-muted-foreground font-mono truncate max-w-[150px]">{selectedNode.id}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedNode(null)}
                                className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="text-sm font-medium text-muted-foreground uppercase tracking-widest text-[10px] shrink-0">
                            Configuration
                        </div>

                        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pb-10 relative z-30 pointer-events-auto">
                            {TaskRegistry[selectedNode.data.type].inputs.map((inputSchema) => {
                                // Handle conditional rendering for TRIGGER config fields
                                if (selectedNode.data.type === TaskType.TRIGGER) {
                                    const currentTrigger = selectedNode.data.inputs?.triggerType || 'MANUAL'
                                    if (inputSchema.name === 'cronExpression' && currentTrigger !== 'CRON') return null
                                    if (inputSchema.name === 'applicationType' && currentTrigger !== 'APPLICATION_SUBMIT') return null
                                    if (inputSchema.name === 'webhookSecret' && currentTrigger !== 'WEBHOOK') return null
                                }

                                return (
                                    <div key={inputSchema.name} className="space-y-1">
                                        <label className="text-xs font-semibold flex items-center justify-between">
                                            {inputSchema.name}
                                            {inputSchema.required && <span className="text-destructive">*</span>}
                                        </label>

                                        {inputSchema.name === 'applicationType' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select a Product Type...</option>
                                                {dynamicOptions?.applications?.map(a => (
                                                    <option key={a.id} value={a.id}>{a.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'STRING' && inputSchema.name === 'workflowId' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select a workflow...</option>
                                                {dynamicOptions?.workflows?.map(w => (
                                                    <option key={w.id} value={w.id}>{w.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'STRING' && inputSchema.options ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select {inputSchema.name}...</option>
                                                {inputSchema.options.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'STRING' ? (
                                            <Input
                                                type="text"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                                placeholder={inputSchema.helperText || `Enter ${inputSchema.name}...`}
                                            />
                                        ) : inputSchema.type === 'PROVIDER' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select a provider...</option>
                                                {dynamicOptions?.providers?.map(p => (
                                                    <option key={p.id} value={p.id}>{p.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'CREDENTIAL' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select a secret...</option>
                                                {dynamicOptions?.secrets?.map(s => (
                                                    <option key={s.id} value={s.id}>{s.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'SELECT' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)}
                                            >
                                                <option value="" disabled>Select...</option>
                                                {inputSchema.options?.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                        ) : inputSchema.type === 'NUMBER' ? (
                                            <Input
                                                type="number"
                                                value={selectedNode.data.inputs?.[inputSchema.name] || ''}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, Number(e.target.value))}
                                            />
                                        ) : inputSchema.type === 'BOOLEAN' ? (
                                            <select
                                                className="flex w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-background"
                                                value={String(selectedNode.data.inputs?.[inputSchema.name] || 'false')}
                                                onChange={(e) => onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value === 'true')}
                                            >
                                                <option value="false">False</option>
                                                <option value="true">True</option>
                                            </select>
                                        ) : (
                                            <Textarea
                                                className="min-h-[80px] font-mono text-sm"
                                                value={typeof selectedNode.data.inputs?.[inputSchema.name] === 'object'
                                                    ? JSON.stringify(selectedNode.data.inputs?.[inputSchema.name], null, 2)
                                                    : selectedNode.data.inputs?.[inputSchema.name] || ''
                                                }
                                                onChange={(e) => {
                                                    try {
                                                        const parsed = JSON.parse(e.target.value)
                                                        onNodeDataChange(selectedNode.id, inputSchema.name, parsed)
                                                    } catch {
                                                        onNodeDataChange(selectedNode.id, inputSchema.name, e.target.value)
                                                    }
                                                }}
                                                placeholder={inputSchema.helperText || `{ "example": "value" }`}
                                            />
                                        )}
                                        {inputSchema.required && (
                                            <p className="text-[10px] text-muted-foreground italic">Required {inputSchema.type.toLowerCase()} input.</p>
                                        )}
                                    </div>
                                )
                            })}
                            {TaskRegistry[selectedNode.data.type].inputs.length === 0 && (
                                <div className="text-xs text-muted-foreground italic text-center p-4 border rounded bg-muted/20">
                                    This node requires no configuration.
                                </div>
                            )}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    )
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditorInner
                {...props}
                dynamicOptions={props.dynamicOptions || { providers: [], secrets: [], workflows: [], applications: [] }}
            />
        </ReactFlowProvider>
    )
}
