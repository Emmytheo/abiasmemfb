import React from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { ProductSimulatorClient } from './ProductSimulatorClient'

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
        <div className="flex-1 w-full bg-muted/20 min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-primary">Product Application Simulator</h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Test dynamic product application forms. High-touch field events (like BVN lookups) and multi-stage workflows are active here.
                    </p>
                </div>

                <div className="bg-background border rounded-xl shadow-sm p-6 overflow-hidden">
                    <ProductSimulatorClient availableProducts={payloadProducts} />
                </div>
            </div>
        </div>
    )
}
