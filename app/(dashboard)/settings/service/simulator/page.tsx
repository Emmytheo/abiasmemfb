import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SimulatorClient } from './SimulatorClient'
import { BankPageHeader } from '@/components/banking/page-header'
import { SubsystemNav } from '@/components/banking/subsystem-nav'

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
        <div className="flex-1 w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <BankPageHeader
                    badge="Service Factory · Live Sandbox"
                    livePill={`${payloadServices.length} Executable Services`}
                    title="Service Execution Simulator"
                    subtitle="Test dynamic service schemas, validation endpoints, and workflow-backed bill & transfer executions before publishing to clients."
                />

                <SubsystemNav group="factory" />

                <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 overflow-hidden">
                    <SimulatorClient availableServices={payloadServices} />
                </div>
            </div>
        </div>
    )
}
