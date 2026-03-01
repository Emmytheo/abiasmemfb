import type { AppNode, AppNodeMissingInputs } from './types/appNode'
import type { WorkflowExecutionPlan, WorkflowExecutionPlanPhase } from './types/workflow'
import type { Edge } from '@xyflow/react'
import { TaskRegistry } from './task/registry'

export enum FlowValidationError {
    NO_ENTRY_POINT = 'NO_ENTRY_POINT',
    INVALID_INPUTS = 'INVALID_INPUTS',
}

type FlowToExecutionPlanResult = {
    executionPlan?: WorkflowExecutionPlan
    error?: { type: FlowValidationError; invalidElements?: AppNodeMissingInputs[] }
}

/**
 * Convert a ReactFlow graph (nodes + edges) into a phase-ordered execution plan.
 * Uses topological sort: each phase contains all nodes whose dependencies are satisfied
 * by previously-planned phases.
 */
export function FlowToExecutionPlan(
    nodes: AppNode[],
    edges: Edge[]
): FlowToExecutionPlanResult {
    // Find entry point (TRIGGER node or any node marked isEntryPoint)
    const entryPoint = nodes.find(
        (n) => TaskRegistry[n.data.type]?.isEntryPoint
    )
    if (!entryPoint) {
        return { error: { type: FlowValidationError.NO_ENTRY_POINT } }
    }

    const inputWithErrors: AppNodeMissingInputs[] = []
    const planned = new Set<string>()

    // Validate entry point inputs
    const entryErrors = getInvalidInputs(entryPoint, edges, planned)
    if (entryErrors.length > 0) {
        inputWithErrors.push({ nodeId: entryPoint.id, inputs: entryErrors })
    }

    const executionPlan: WorkflowExecutionPlan = [
        { phase: 1, nodes: [entryPoint] },
    ]
    planned.add(entryPoint.id)

    // Build phases iteratively
    for (
        let phase = 2;
        phase <= nodes.length && planned.size < nodes.length;
        phase++
    ) {
        const nextPhase: WorkflowExecutionPlanPhase = { phase, nodes: [] }

        for (const currentNode of nodes) {
            if (planned.has(currentNode.id)) continue

            const invalidInputs = getInvalidInputs(currentNode, edges, planned)
            if (invalidInputs.length > 0) {
                const incomers = getIncomers(currentNode, nodes, edges)
                // If all upstream nodes are planned but we still have invalid inputs → real error
                if (incomers.every((inc) => planned.has(inc.id))) {
                    inputWithErrors.push({ nodeId: currentNode.id, inputs: invalidInputs })
                } else {
                    // Upstream not fully planned yet — skip to next phase
                    continue
                }
            }
            nextPhase.nodes.push(currentNode)
        }

        for (const n of nextPhase.nodes) planned.add(n.id)
        executionPlan.push(nextPhase)
    }

    if (inputWithErrors.length > 0) {
        return {
            error: { type: FlowValidationError.INVALID_INPUTS, invalidElements: inputWithErrors },
        }
    }

    return { executionPlan }
}

function getInvalidInputs(
    node: AppNode,
    edges: Edge[],
    planned: Set<string>
): string[] {
    const task = TaskRegistry[node.data.type]
    if (!task) return []
    const invalid: string[] = []

    for (const input of task.inputs) {
        const hasValue = (node.data.inputs[input.name] ?? '').toString().length > 0

        if (hasValue) continue // value provided statically

        const incomingEdge = edges.find(
            (e) => e.target === node.id && e.targetHandle === input.name
        )

        if (!input.required) {
            // Optional: only invalid if connected to an *unplanned* source
            if (incomingEdge && !planned.has(incomingEdge.source)) {
                invalid.push(input.name)
            }
            continue
        }

        // Required — must be either statically set or connected to a planned source
        if (incomingEdge && planned.has(incomingEdge.source)) continue

        invalid.push(input.name)
    }

    return invalid
}

export function getIncomers(
    node: AppNode,
    nodes: AppNode[],
    edges: Edge[]
): AppNode[] {
    const sourceIds = new Set(
        edges.filter((e) => e.target === node.id).map((e) => e.source)
    )
    return nodes.filter((n) => sourceIds.has(n.id))
}
