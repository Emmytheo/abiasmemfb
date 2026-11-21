import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductSimulatorClient } from './ProductSimulatorClient'
import { BankPageHeader } from '@/components/banking/page-header'
import { SubsystemNav } from '@/components/banking/subsystem-nav'

export const dynamic = 'force-dynamic'

export default async function ProductSimulatorPage() {
    const payload = await getPayload({ config })
    
    // Fetch all active product types
    const productsRes = await payload.find({
        collection: 'product-types',
        depth: 2,
        limit: 100,
        where: { status: { equals: 'active' } }
    })

    const payloadProducts = productsRes.docs.map(doc => ({
        id: String(doc.id),
        name: doc.name,
        form_schema: doc.form_schema || [],
        workflowId: doc.workflow ? (typeof doc.workflow === 'object' ? String(doc.workflow.id) : String(doc.workflow)) : null,
        category: doc.category ? (typeof doc.category === 'object' ? doc.category.name : 'Uncategorized') : 'Uncategorized'
    }))

    return (
        <div className="flex-1 w-full min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <BankPageHeader
                    badge="Product Factory · Live Sandbox"
                    livePill={`${payloadProducts.length} Active Products`}
                    title="Product Application Simulator"
                    subtitle="Test dynamic product onboarding & loan application forms, field validation events (BVN lookups), and multi-stage workflows."
                />

                <SubsystemNav group="factory" />

                <div className="bg-card border border-border/80 rounded-2xl shadow-sm p-6 overflow-hidden">
                    <ProductSimulatorClient availableProducts={payloadProducts} />
                </div>
            </div>
        </div>
    )
}
