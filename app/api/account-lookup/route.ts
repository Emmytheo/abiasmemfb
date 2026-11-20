import { NextRequest, NextResponse } from "next/server"
import { getPayload } from "payload"
import config from "@payload-config"
import { decryptSecret } from "@/lib/workflow/secrets/encryption"
import { requireAuthenticatedUser } from "@/lib/auth/server-guard"
import { queryBankSuite } from "@/lib/banking/db-pool"
import { getServerBankProfile } from "@/lib/banking/bank-profile-server"

/**
 * GET /api/account-lookup?accountNumber=XXXXXXXXXX&bankCode=...
 * Requires authenticated session. Resolves internal BankSuite accounts via Postgres join
 * with customers, then queries configured external NIP provider if applicable.
 */
export async function GET(req: NextRequest) {
    const auth = await requireAuthenticatedUser(req)
    if (auth instanceof NextResponse) return auth

    const { searchParams } = req.nextUrl
    const accountNumber = searchParams.get("accountNumber")?.replace(/\s/g, "").trim()
    const bankCode = searchParams.get("bankCode")?.trim() || ""
    const providerSlug = searchParams.get("providerSlug")?.trim() || ""

    if (!accountNumber || accountNumber.length < 10) {
        return NextResponse.json(
            { error: "A valid 10-digit account number is required." },
            { status: 400 }
        )
    }

    const { profile: activeBank } = await getServerBankProfile()

    // 1. Authoritative internal BankSuite ledger lookup (joins accounts -> customers)
    try {
        const res = await queryBankSuite(
            `
            SELECT a.id, a.account_number, a.account_type, a.status,
                   c.first_name, c.last_name, c.email, c.kyc_status
            FROM public.accounts a
            LEFT JOIN public.customers c ON c.id = a.customer_id
            WHERE a.account_number = $1
            LIMIT 1
            `,
            [accountNumber]
        )
        if (res.rows.length > 0) {
            const row = res.rows[0]
            const holderName =
                `${row.first_name || ""} ${row.last_name || ""}`.trim() ||
                row.email ||
                `${activeBank.shortName} Account Holder`
            return NextResponse.json({
                accountName: holderName.toUpperCase(),
                bank: activeBank.shortName,
                bankCode: activeBank.internalBankCode,
                accountType: row.account_type,
                kycStatus: row.kyc_status || "active",
                isInternal: true,
            })
        }
    } catch (err: any) {
        console.warn("[account-lookup] Internal SQL lookup failed:", err.message)
    }

    // 2. External NIP provider configured in CMS ServiceProviders
    try {
        const payload = await getPayload({ config })
        const slug = providerSlug || bankCode || "nip-gateway"
        const { docs: providers } = await payload.find({
            collection: "service-providers" as any,
            where: {
                and: [
                    { slug: { equals: slug } },
                    { isActive: { equals: true } },
                ],
            },
            depth: 2,
            limit: 1,
            overrideAccess: true,
        })

        if (providers.length > 0) {
            const provider = providers[0] as any
            const baseUrl: string = provider.baseUrl || ""
            let authHeader = ""

            if (provider.secret && typeof provider.secret === "object") {
                const secretDoc = provider.secret
                if (secretDoc.encrypted_value && secretDoc.iv && secretDoc.tag) {
                    try {
                        const raw = await decryptSecret(
                            secretDoc.encrypted_value,
                            secretDoc.iv,
                            secretDoc.tag
                        )
                        authHeader = raw.startsWith("Bearer ") ? raw : `Bearer ${raw}`
                    } catch {}
                }
            }

            if (baseUrl) {
                const endpoint = `${baseUrl.replace(/\/$/, "")}/name-enquiry`
                const externalRes = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(authHeader ? { Authorization: authHeader } : {}),
                    },
                    body: JSON.stringify({ accountNumber, bankCode }),
                    signal: AbortSignal.timeout(5000),
                })
                if (externalRes.ok) {
                    const data = await externalRes.json()
                    const accountName = data.accountName || data.account_name || data.name
                    if (accountName) {
                        return NextResponse.json({
                            accountName: String(accountName).toUpperCase(),
                            bank: bankCode,
                            isInternal: false,
                        })
                    }
                }
            }
        }
    } catch (err: any) {
        console.warn("[account-lookup] External provider lookup failed:", err.message)
    }

    return NextResponse.json(
        { error: "Account not found in internal ledger or active NIP directory." },
        { status: 404 }
    )
}
