import dagre from 'dagre';
import { TaskType } from './types/task';

export interface SDLStep {
    id: string;
    type: TaskType;
    inputs?: Record<string, any>;
    next?: string | string[]; // Can point to one or multiple downstream steps
    // For specific scenarios like Conditionals or API_SWITCH
    branches?: Record<string, string>; // e.g., { "true": "step_a", "false": "step_b" }
}

export interface WorkflowSDL {
    name: string;
    description?: string;
    trigger: string;
    steps: SDLStep[];
}

export function compileSDLToFlow(sdl: WorkflowSDL) {
    const nodes: any[] = [];
    const edges: any[] = [];

    const nodeWidth = 250;
    const nodeHeight = 100;

    // We'll use Dagre to auto-layout the compiled React Flow nodes
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: 'TB', ranksep: 60, nodesep: 40 });
    g.setDefaultEdgeLabel(() => ({}));

    // Generate Trigger Node
    const triggerId = 'trigger-1';
    nodes.push({
        id: triggerId,
        type: 'abiaNode',
        data: {
            type: TaskType.TRIGGER,
            inputs: { triggerType: sdl.trigger.toUpperCase() }
        }
    });
    g.setNode(triggerId, { width: nodeWidth, height: nodeHeight });

    let firstStepId = sdl.steps[0]?.id;
    if (firstStepId) {
        const edgeId = `e-${triggerId}-${firstStepId}`;
        edges.push({ id: edgeId, source: triggerId, target: firstStepId, type: 'smoothstep' });
        g.setEdge(triggerId, firstStepId);
    }

    // Map all steps
    for (const step of sdl.steps) {
        nodes.push({
            id: step.id,
            type: 'abiaNode', // Matches the nodeTypes key in FlowEditor.tsx
            data: {
                type: step.type,
                inputs: step.inputs || {}
            }
        });
        g.setNode(step.id, { width: nodeWidth, height: nodeHeight });

        // Compile Standard 'next' Edges
        if (typeof step.next === 'string') {
            edges.push({ 
                id: `e-${step.id}-${step.next}`, 
                source: step.id, 
                target: step.next, 
                type: 'smoothstep' 
            });
            g.setEdge(step.id, step.next);
        } else if (Array.isArray(step.next)) {
            for (const target of step.next) {
                edges.push({ 
                    id: `e-${step.id}-${target}`, 
                    source: step.id, 
                    target: target, 
                    type: 'smoothstep' 
                });
                g.setEdge(step.id, target);
            }
        }

        // Compile Branced Edges (Conditionals)
        if (step.branches) {
            Object.entries(step.branches).forEach(([branchValue, target]) => {
                edges.push({
                    id: `e-${step.id}-${target}-${branchValue}`,
                    source: step.id,
                    target: target,
                    sourceHandle: branchValue, // Useful for conditional nodes
                    type: 'smoothstep',
                    label: branchValue // Visual helper
                });
                g.setEdge(step.id, target);
            });
        }
    }

    // Execute Dagre layout calculation
    dagre.layout(g);

    // Apply calculated X, Y coordinates back to nodes
    const positionedNodes = nodes.map((node) => {
        const dNode = g.node(node.id);
        return {
            ...node,
            position: { x: dNode.x - nodeWidth / 2, y: dNode.y - nodeHeight / 2 }
        };
    });

    return {
        name: sdl.name,
        description: sdl.description,
        status: 'DRAFT',
        trigger: sdl.trigger.toUpperCase(),
        definition: {
            nodes: positionedNodes,
            edges
        }
    };
}
