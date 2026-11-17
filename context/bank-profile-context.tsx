"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
    DEFAULT_BANK_PROFILE_ID,
    PRESET_BANK_PROFILES,
    mergeBankProfile,
    resolveBankProfile,
    type BankProfile,
    type BankProfileOverride,
    type ModuleKey,
} from "@/lib/banking/bank-profiles"
import { usePalette, type Palette } from "@/context/palette-context"

export type ActivationScope = "global" | "preview"

export interface ProfileMutationResult {
    success: boolean
    persistedGlobally?: boolean
    error?: string
}

interface BankProfileContextType {
    activeProfile: BankProfile
    allProfiles: BankProfile[]
    customProfiles: BankProfile[]
    profileOverrides: Record<string, BankProfileOverride>
    isPreviewMode: boolean
    isSwitching: boolean
    setActiveProfile: (
        profileId: string,
        syncPalette?: boolean,
        scope?: ActivationScope
    ) => Promise<ProfileMutationResult>
    toggleModule: (
        profileId: string,
        moduleKey: ModuleKey,
        enabled: boolean,
        scope?: ActivationScope
    ) => Promise<ProfileMutationResult>
    saveProfileOverride: (
        profileId: string,
        patch: BankProfileOverride,
        scope?: ActivationScope
    ) => Promise<ProfileMutationResult>
    saveCustomProfile: (
        profile: BankProfile,
        activate?: boolean,
        scope?: ActivationScope
    ) => Promise<ProfileMutationResult>
    deleteCustomProfile: (profileId: string) => Promise<ProfileMutationResult>
    exitPreviewMode: () => Promise<ProfileMutationResult>
}

const BankProfileContext = React.createContext<BankProfileContextType | undefined>(undefined)

export function BankProfileProvider({
    children,
    initialProfileId = DEFAULT_BANK_PROFILE_ID,
    initialCustomProfiles = [],
    initialOverrides = {},
    initialPreviewMode = false,
}: {
    children: React.ReactNode
    initialProfileId?: string
    initialCustomProfiles?: BankProfile[]
    initialOverrides?: Record<string, BankProfileOverride>
    initialPreviewMode?: boolean
}) {
    const router = useRouter()
    const { setPalette } = usePalette()

    const [activeId, setActiveId] = React.useState<string>(initialProfileId)
    const [customProfiles, setCustomProfiles] = React.useState<BankProfile[]>(initialCustomProfiles)
    const [profileOverrides, setProfileOverrides] =
        React.useState<Record<string, BankProfileOverride>>(initialOverrides)
    const [isPreviewMode, setIsPreviewMode] = React.useState<boolean>(initialPreviewMode)
    const [isSwitching, setIsSwitching] = React.useState(false)

    // Keep state synchronized when server revalidates layout after global profile switches
    React.useEffect(() => {
        setActiveId(initialProfileId)
    }, [initialProfileId])

    React.useEffect(() => {
        setCustomProfiles(initialCustomProfiles)
    }, [initialCustomProfiles])

    React.useEffect(() => {
        setProfileOverrides(initialOverrides)
    }, [initialOverrides])

    React.useEffect(() => {
        setIsPreviewMode(initialPreviewMode)
    }, [initialPreviewMode])

    const allProfiles = React.useMemo(() => {
        const merged = [...PRESET_BANK_PROFILES, ...customProfiles].map((p) =>
            mergeBankProfile(p, profileOverrides[p.id])
        )
        return merged
    }, [customProfiles, profileOverrides])

    const activeProfile = React.useMemo(
        () => resolveBankProfile(activeId, customProfiles, profileOverrides),
        [activeId, customProfiles, profileOverrides]
    )

    const postProfileUpdate = async (payload: Record<string, any>): Promise<ProfileMutationResult> => {
        setIsSwitching(true)
        try {
            const res = await fetch("/api/admin/bank-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json().catch(() => ({}))
            if (res.ok && data?.success) {
                if (data.activeProfile?.id) setActiveId(data.activeProfile.id)
                if (Array.isArray(data.customProfiles)) setCustomProfiles(data.customProfiles)
                if (data.profileOverrides) setProfileOverrides(data.profileOverrides)
                setIsPreviewMode(Boolean(data.isPreviewMode))
                router.refresh()
                return {
                    success: true,
                    persistedGlobally: Boolean(data.persistedGlobally),
                }
            }
            return {
                success: false,
                error: data?.error || `Server returned HTTP ${res.status}`,
            }
        } catch (err: any) {
            return {
                success: false,
                error: err?.message || "Network error updating bank profile",
            }
        } finally {
            setIsSwitching(false)
        }
    }

    const setActiveProfile = async (
        profileId: string,
        syncPalette = true,
        scope: ActivationScope = "global"
    ) => {
        const prevId = activeId
        const prevProfile = activeProfile
        const next = resolveBankProfile(profileId, customProfiles, profileOverrides)
        setActiveId(next.id)
        if (syncPalette) {
            setPalette(next.defaultPalette as Palette)
        }
        const res = await postProfileUpdate({
            profileId: next.id,
            scope,
        })
        if (!res.success) {
            // Roll back optimistic UI state if server persistence failed
            setActiveId(prevId)
            if (syncPalette) {
                setPalette(prevProfile.defaultPalette as Palette)
            }
        }
        return res
    }

    const saveProfileOverride = async (
        profileId: string,
        patch: BankProfileOverride,
        scope: ActivationScope = "global"
    ) => {
        const prevOverrides = profileOverrides
        const prevPalette = activeProfile.defaultPalette
        setProfileOverrides((prev) => {
            const existing = prev[profileId] || {}
            return {
                ...prev,
                [profileId]: {
                    ...existing,
                    ...patch,
                    enabledModules: {
                        ...(existing.enabledModules || {}),
                        ...(patch.enabledModules || {}),
                    },
                    themeStyle: {
                        ...(existing.themeStyle || {}),
                        ...(patch.themeStyle || {}),
                    },
                },
            }
        })

        if (profileId === activeId && patch.defaultPalette) {
            setPalette(patch.defaultPalette as Palette)
        }

        const res = await postProfileUpdate({
            profileId: activeId,
            patchOverrideForId: profileId,
            overridePatch: patch,
            scope,
        })
        if (!res.success) {
            setProfileOverrides(prevOverrides)
            if (profileId === activeId && patch.defaultPalette) {
                setPalette(prevPalette as Palette)
            }
        }
        return res
    }

    const toggleModule = async (
        profileId: string,
        moduleKey: ModuleKey,
        enabled: boolean,
        scope: ActivationScope = "global"
    ) => {
        return await saveProfileOverride(
            profileId,
            { enabledModules: { [moduleKey]: enabled } },
            scope
        )
    }

    const saveCustomProfile = async (
        profile: BankProfile,
        activate = true,
        scope: ActivationScope = "global"
    ) => {
        const prevCustom = customProfiles
        const prevId = activeId
        const prevPalette = activeProfile.defaultPalette
        const updatedCustom = [
            ...customProfiles.filter((p) => p.id !== profile.id),
            profile,
        ]
        setCustomProfiles(updatedCustom)

        const targetId = activate ? profile.id : activeId
        if (activate) {
            setActiveId(profile.id)
            setPalette(profile.defaultPalette as Palette)
        }

        const res = await postProfileUpdate({
            profileId: targetId,
            upsertCustomProfile: profile,
            scope,
        })
        if (!res.success) {
            setCustomProfiles(prevCustom)
            setActiveId(prevId)
            setPalette(prevPalette as Palette)
        }
        return res
    }

    const deleteCustomProfile = async (profileId: string) => {
        const prevCustom = customProfiles
        const prevId = activeId
        const updatedCustom = customProfiles.filter((p) => p.id !== profileId)
        setCustomProfiles(updatedCustom)

        const nextActiveId =
            activeId === profileId ? DEFAULT_BANK_PROFILE_ID : activeId
        setActiveId(nextActiveId)

        const res = await postProfileUpdate({
            profileId: nextActiveId,
            deleteCustomProfileId: profileId,
            scope: "global",
        })
        if (!res.success) {
            setCustomProfiles(prevCustom)
            setActiveId(prevId)
        }
        return res
    }

    const exitPreviewMode = async () => {
        return await postProfileUpdate({ scope: "global" })
    }

    return (
        <BankProfileContext.Provider
            value={{
                activeProfile,
                allProfiles,
                customProfiles,
                profileOverrides,
                isPreviewMode,
                isSwitching,
                setActiveProfile,
                toggleModule,
                saveProfileOverride,
                saveCustomProfile,
                deleteCustomProfile,
                exitPreviewMode,
            }}
        >
            {children}
        </BankProfileContext.Provider>
    )
}

export function useBankProfile() {
    const ctx = React.useContext(BankProfileContext)
    if (!ctx) {
        throw new Error("useBankProfile must be used within a BankProfileProvider")
    }
    return ctx
}
