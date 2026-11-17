import { cookies } from "next/headers"
import {
    BANK_PROFILE_COOKIE,
    DEFAULT_BANK_PROFILE_ID,
    resolveBankProfile,
    type BankProfile,
    type BankProfileOverride,
} from "./bank-profiles"
import { readGlobalBankProfileState } from "./bank-profile-store"

export const CUSTOM_BANK_PROFILES_COOKIE = "banksuite_custom_profiles"
export const BANK_PREVIEW_MODE_COOKIE = "banksuite_preview_mode"

export async function getServerBankProfile(): Promise<{
    profile: BankProfile
    customProfiles: BankProfile[]
    profileOverrides: Record<string, BankProfileOverride>
    isPreviewMode: boolean
    globalActiveId: string
}> {
    const fallbackId =
        process.env.NEXT_PUBLIC_DEFAULT_BANK_PROFILE || DEFAULT_BANK_PROFILE_ID

    try {
        const [globalState, cookieStore] = await Promise.all([
            readGlobalBankProfileState(),
            cookies(),
        ])

        const previewActive =
            cookieStore.get(BANK_PREVIEW_MODE_COOKIE)?.value === "1"
        const cookieId = cookieStore.get(BANK_PROFILE_COOKIE)?.value
        const rawCustomCookie = cookieStore.get(CUSTOM_BANK_PROFILES_COOKIE)?.value

        let cookieCustomProfiles: BankProfile[] = []
        if (rawCustomCookie) {
            try {
                const parsed = JSON.parse(decodeURIComponent(rawCustomCookie))
                if (Array.isArray(parsed)) {
                    cookieCustomProfiles = parsed
                }
            } catch {
                // ignore malformed custom profile cookie
            }
        }

        // Merge Postgres custom profiles with any preview cookie custom profiles
        const customMap = new Map<string, BankProfile>()
        for (const p of globalState.customProfiles) customMap.set(p.id, p)
        if (previewActive) {
            for (const p of cookieCustomProfiles) customMap.set(p.id, p)
        }
        const customProfiles = Array.from(customMap.values())

        const activeId = previewActive && cookieId
            ? cookieId
            : globalState.activeProfileId || cookieId || fallbackId

        const profile = resolveBankProfile(
            activeId,
            customProfiles,
            globalState.profileOverrides,
            fallbackId
        )

        return {
            profile,
            customProfiles,
            profileOverrides: globalState.profileOverrides,
            isPreviewMode: previewActive && Boolean(cookieId),
            globalActiveId: globalState.activeProfileId || fallbackId,
        }
    } catch {
        return {
            profile: resolveBankProfile(fallbackId, [], {}, fallbackId),
            customProfiles: [],
            profileOverrides: {},
            isPreviewMode: false,
            globalActiveId: fallbackId,
        }
    }
}
