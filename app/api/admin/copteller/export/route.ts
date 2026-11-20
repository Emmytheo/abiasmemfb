import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { getCoptellerOversightSnapshot } from "@/lib/banking/copteller-bridge"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        const format = req.nextUrl.searchParams.get("format") || "csv"
        const [snapshot, { profile }] = await Promise.all([
            getCoptellerOversightSnapshot(),
            getServerBankProfile(),
        ])

        if (format === "json") {
            return NextResponse.json({
                generatedAt: new Date().toISOString(),
                bank: { id: profile.id, legalName: profile.legalName, licenseBadge: profile.licenseBadge },
                kpis: snapshot.kpis,
                cooperatives: snapshot.cooperatives,
                schemes: snapshot.schemes,
                contracts: snapshot.contracts,
                loans: snapshot.loans,
            })
        }

        const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
        const headers = [
            "Cooperative ID",
            "Cooperative Name",
            "Sector",
            "Type",
            "Registration No",
            "State",
            "Status",
            "Members",
            "Escrow Fee %",
            "Union Leader",
            "Bank Approval Date",
        ]
        const rows = snapshot.cooperatives.map((c: any) =>
            [
                c.id,
                c.name,
                c.sector,
                c.cooperative_type,
                c.registration_number || "",
                c.state || "",
                c.status,
                c.current_member_count || 0,
                c.escrow_fee_percent ?? 1.5,
                c.leader_name || "",
                c.bank_approval_date || "",
            ]
                .map(esc)
                .join(",")
        )

        const csv = [
            `# CBN Cooperative Regulatory Return — ${profile.legalName} — Generated ${new Date().toISOString()}`,
            `# Escrow AUM (NGN): ${(snapshot.kpis.escrowBalanceKobo / 100).toFixed(2)} | Active Cooperatives: ${snapshot.kpis.activeCooperatives} | Active Contracts: ${snapshot.kpis.activeContracts} | Collection Rate: ${snapshot.kpis.collectionRatePct}%`,
            headers.join(","),
            ...rows,
        ].join("\n")

        return new NextResponse(csv, {
            status: 200,
            headers: {
                "Content-Type": "text/csv; charset=utf-8",
                "Content-Disposition": `attachment; filename="cbn-copteller-return-${profile.id}-${new Date().toISOString().slice(0, 10)}.csv"`,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
