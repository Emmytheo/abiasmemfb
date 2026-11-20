import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { runCoptellerVaultReconciliation } from "@/lib/banking/copteller-bridge"

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const report = await runCoptellerVaultReconciliation(
            auth.userId,
            auth.email,
            auth.ipAddress
        )
        return NextResponse.json({ success: true, report })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Vault reconciliation failed" }, { status: 500 })
    }
}
