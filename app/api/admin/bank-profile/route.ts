import { NextRequest, NextResponse } from "next/server"
import { revalidatePath, revalidateTag } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import {
    BANK_PROFILE_COOKIE,
    DEFAULT_BANK_PROFILE_ID,
    PRESET_BANK_PROFILES,
    mergeBankProfile,
    resolveBankProfile,
    type BankProfile,
    type BankProfileOverride,
} from "@/lib/banking/bank-profiles"
import {
    BANK_PREVIEW_MODE_COOKIE,
    CUSTOM_BANK_PROFILES_COOKIE,
    getServerBankProfile,
} from "@/lib/banking/bank-profile-server"
import {
    readFreshGlobalBankProfileState,
    writeGlobalBankProfileState,
} from "@/lib/banking/bank-profile-store"

export async function GET() {
    const state = await getServerBankProfile()
    const allBase = [...PRESET_BANK_PROFILES, ...state.customProfiles]
    const allProfiles = allBase.map((p) =>
        mergeBankProfile(p, state.profileOverrides[p.id])
    )
    return NextResponse.json({
        success: true,
        activeProfile: state.profile,
        allProfiles,
        customProfiles: state.customProfiles,
        profileOverrides: state.profileOverrides,
        isPreviewMode: state.isPreviewMode,
        globalActiveId: state.globalActiveId,
    })
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user || user.user_metadata?.role !== "admin") {
            return NextResponse.json(
                { error: "Unauthorized: Superadmin access required to swap bank profiles." },
                { status: 403 }
            )
        }

        const body = await req.json().catch(() => ({}))
        const scope: "global" | "preview" = body.scope === "preview" ? "preview" : "global"

        const currentGlobal = await readFreshGlobalBankProfileState()

        let nextCustomProfiles: BankProfile[] = Array.isArray(body.customProfiles)
            ? body.customProfiles.slice(0, 25)
            : currentGlobal.customProfiles

        if (body.upsertCustomProfile && typeof body.upsertCustomProfile === "object") {
            const incoming = body.upsertCustomProfile as BankProfile
            nextCustomProfiles = [
                ...nextCustomProfiles.filter((p) => p.id !== incoming.id),
                incoming,
            ]
        }

        if (body.deleteCustomProfileId) {
            const delId = String(body.deleteCustomProfileId)
            nextCustomProfiles = nextCustomProfiles.filter((p) => p.id !== delId)
        }

        let nextOverrides: Record<string, BankProfileOverride> =
            body.profileOverrides && typeof body.profileOverrides === "object"
                ? body.profileOverrides
                : { ...currentGlobal.profileOverrides }

        if (body.patchOverrideForId && body.overridePatch) {
            const targetId = String(body.patchOverrideForId)
            const prev = nextOverrides[targetId] || {}
            const patch = body.overridePatch as BankProfileOverride
            nextOverrides[targetId] = {
                ...prev,
                ...patch,
                enabledModules: {
                    ...(prev.enabledModules || {}),
                    ...(patch.enabledModules || {}),
                },
                themeStyle: {
                    ...(prev.themeStyle || {}),
                    ...(patch.themeStyle || {}),
                },
            }
        }

        const nextProfileId = String(
            body.profileId ||
                currentGlobal.activeProfileId ||
                process.env.NEXT_PUBLIC_DEFAULT_BANK_PROFILE ||
                DEFAULT_BANK_PROFILE_ID
        ).trim()

        const resolved = resolveBankProfile(
            nextProfileId,
            nextCustomProfiles,
            nextOverrides
        )

        let persistedGlobally = false
        if (scope === "global") {
            persistedGlobally = await writeGlobalBankProfileState(
                {
                    activeProfileId: resolved.id,
                    customProfiles: nextCustomProfiles,
                    profileOverrides: nextOverrides,
                },
                user.email || "superadmin"
            )
            revalidateTag("banksuite-profile", "max")
            revalidatePath("/", "layout")
        }

        const res = NextResponse.json({
            success: true,
            scope,
            persistedGlobally,
            activeProfile: resolved,
            customProfiles: nextCustomProfiles,
            profileOverrides: nextOverrides,
            isPreviewMode: scope === "preview",
        })

        if (scope === "preview") {
            res.cookies.set(BANK_PREVIEW_MODE_COOKIE, "1", {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
                sameSite: "lax",
            })
            res.cookies.set(BANK_PROFILE_COOKIE, resolved.id, {
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
                sameSite: "lax",
            })
            if (nextCustomProfiles.length > 0) {
                const encoded = encodeURIComponent(JSON.stringify(nextCustomProfiles))
                if (encoded.length <= 3600) {
                    res.cookies.set(CUSTOM_BANK_PROFILES_COOKIE, encoded, {
                        path: "/",
                        maxAge: 60 * 60 * 24 * 7,
                        sameSite: "lax",
                    })
                }
            }
        } else {
            // Clear browser preview override so admin views the global deployment identically to Vercel visitors
            res.cookies.delete(BANK_PREVIEW_MODE_COOKIE)
            res.cookies.delete(BANK_PROFILE_COOKIE)
            res.cookies.delete(CUSTOM_BANK_PROFILES_COOKIE)
        }

        return res
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message || "Failed to update bank profile" },
            { status: 500 }
        )
    }
}
