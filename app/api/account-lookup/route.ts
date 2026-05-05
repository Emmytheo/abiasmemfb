import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { decryptSecret } from '@/lib/workflow/secrets/encryption'

/**
 * GET /api/account-lookup?accountNumber=XXXXXXXXXX&bankCode=access&providerSlug=mock-nip-gateway
 *
 * Resolves a NUBAN account number to the registered holder's name.
 *
 * Resolution order:
 * 1. Internal ABIASMEMFB DB (no external call required)
 * 2. External NIP provider configured in CMS ServiceProviders (uses Vault secret)
 * 3. Deterministic mock fallback (for demo/testing when no external provider is ready)
 */
export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl
    const accountNumber = searchParams.get('accountNumber')?.trim()
    const bankCode = searchParams.get('bankCode')?.trim() || ''
    const providerSlug = searchParams.get('providerSlug')?.trim() || ''

    if (!accountNumber || accountNumber.replace(/\s/g, '').length < 10) {
        return NextResponse.json({ error: 'A valid 10-digit account number is required.' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 1. Check internal ABIASMEMFB accounts first
    try {
        const { docs } = await payload.find({
            collection: 'accounts',
            where: { account_number: { equals: accountNumber } },
            depth: 1,
            limit: 1,
        })
        if (docs.length > 0) {
            const account = docs[0] as any
            let holderName = ''
            if (typeof account.user === 'object' && account.user) {
                holderName = `${account.user.first_name ?? ''} ${account.user.last_name ?? ''}`.trim()
                    || account.user.email
            }
            if (holderName) {
                return NextResponse.json({ accountName: holderName.toUpperCase(), bank: 'ABIASMEMFB', isInternal: true })
            }
        }
    } catch (err) {
        console.warn('[account-lookup] Internal DB lookup failed:', err)
    }

    // 2. Try the registered CMS Provider (by slug or first active NIP provider)
    try {
        const slug = providerSlug || bankCode || 'mock-nip-gateway'
        const { docs: providers } = await payload.find({
            collection: 'service-providers' as any,
            where: {
                and: [
                    { slug: { equals: slug } },
                    { isActive: { equals: true } },
                ]
            },
            depth: 2, // populate the 'secret' relation so we can decrypt
            limit: 1,
        })

        if (providers.length > 0) {
            const provider = providers[0] as any
            const baseUrl: string = provider.baseUrl || ''
            let authHeader = ''

            // Decrypt the vault secret if linked
            if (provider.secret && typeof provider.secret === 'object') {
                const secretDoc = provider.secret
                if (secretDoc.encrypted_value && secretDoc.iv && secretDoc.tag) {
                    try {
                        const raw = await decryptSecret(secretDoc.encrypted_value, secretDoc.iv, secretDoc.tag)
                        authHeader = raw.startsWith('Bearer ') ? raw : `Bearer ${raw}`
                    } catch { /* secret unreadable, skip */ }
                }
            }

            if (baseUrl) {
                const endpoint = `${baseUrl.replace(/\/$/, '')}/name-enquiry`
                const externalRes = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authHeader ? { Authorization: authHeader } : {}),
                    },
                    body: JSON.stringify({ accountNumber, bankCode }),
                    signal: AbortSignal.timeout(5000),
                })
                if (externalRes.ok) {
                    const data = await externalRes.json()
                    const accountName = data.accountName || data.account_name || data.name
                    if (accountName) {
                        return NextResponse.json({ accountName, bank: bankCode, isInternal: false })
                    }
                }
            }
        }
    } catch (err) {
        console.warn('[account-lookup] External provider lookup failed, falling back to mock:', err)
    }

    // 3. Deterministic mock fallback for demo environments
    const mockNames: Record<string, string> = {
        '0000000001': 'JOHN EMEKA OKAFOR',
        '0000000002': 'AMAKA CHINWE EZE',
        '0000000003': 'IBRAHIM MUSA BELLO',
        '0000000004': 'GRACE NKECHI ADEYEMI',
        '0000000005': 'CHUKWUEMEKA OBI',
    }
    let resolvedName = mockNames[accountNumber]
    if (!resolvedName) {
        const seed = parseInt(accountNumber.slice(-4), 10) % 10
        const firstNames = ['ADAEZE', 'EMEKA', 'TUNDE', 'NGOZI', 'KELECHI', 'FATIMA', 'JAMES', 'BLESSING', 'CHIDI', 'AMARA']
        const lastNames = ['OKONKWO', 'IBRAHIM', 'ADEWALE', 'NWOSU', 'SULEIMAN', 'OKAFOR', 'UCHENNA', 'ABDULLAHI', 'EJIKE', 'NNAMDI']
        resolvedName = `${firstNames[seed]} ${lastNames[(seed + 3) % 10]}`
    }

    return NextResponse.json({ accountName: resolvedName, bank: bankCode || 'external', isInternal: false, mock: true })
}
