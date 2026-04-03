import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SimulatorClient } from './SimulatorClient'

export const dynamic = 'force-dynamic'

export default async function ServiceSimulatorPage() {
    const payload = await getPayload({ config })
    
    // Fetch all services with fully populated schemas and workflows
    const servicesRes = await payload.find({
        collection: 'services',
        depth: 2,
        limit: 100,
        where: { status: { equals: 'active' } }
    })

    const payloadServices = servicesRes.docs.map(doc => ({
        id: String(doc.id),
        name: doc.name,
        form_schema: doc.form_schema || [],
        validation_workflow: doc.validation_workflow ? (typeof doc.validation_workflow === 'object' ? String(doc.validation_workflow.id) : String(doc.validation_workflow)) : null,
        execution_workflow: doc.execution_workflow ? (typeof doc.execution_workflow === 'object' ? String(doc.execution_workflow.id) : String(doc.execution_workflow)) : null,
    }))

    return (
        <div className="flex-1 w-full bg-muted/20 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Service Simulator</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select a published Service to test its Dynamic Form schema, automatic validations, and execution workflow integration.
                    </p>
                </div>

                <div className="bg-background border rounded-xl shadow-sm p-6">
                    <SimulatorClient availableServices={payloadServices} />
                </div>
            </div>
        </div>
    )
}
