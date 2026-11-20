import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

/**
 * PATCH /api/admin/applications/[id]
 * Strictly restricted to authenticated bank administrators.
 */
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const auth = await requireAdminUser(req)
        if (auth instanceof NextResponse) return auth

        const { id } = await params
        const body = await req.json().catch(() => ({}))
        const { productTypeId, status, workflow_stage } = body

        const payload = await getPayload({ config })
        const before = await payload.findByID({
            collection: "product-applications" as any,
            id,
            overrideAccess: true,
        })

        const updateData: Record<string, any> = {}
        if (productTypeId !== undefined) updateData.product_type_id = productTypeId
        if (status !== undefined) updateData.status = status
        if (workflow_stage !== undefined) updateData.workflow_stage = workflow_stage

        const updated = await payload.update({
            collection: "product-applications" as any,
            id,
            data: updateData,
            overrideAccess: true,
        })

        await writeBankAuditLog({
            actorId: auth.userId,
            actorEmail: auth.email,
            actorRole: auth.role,
            action: "application.updated",
            entityType: "product_application",
            entityId: id,
            ipAddress: auth.ipAddress,
            beforeState: { status: before?.status, workflow_stage: before?.workflow_stage },
            afterState: updateData,
        })

        return NextResponse.json({ success: true, doc: updated })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
