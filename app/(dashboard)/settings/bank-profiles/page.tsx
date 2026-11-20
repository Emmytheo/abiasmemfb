"use client"

import * as React from "react"
import Link from "next/link"
import {
    Anchor,
    Building2,
    CheckCircle2,
    ExternalLink,
    Eye,
    Globe,
    GraduationCap,
    Hash,
    Landmark,
    Palette as PaletteIcon,
    Plus,
    ShieldCheck,
    Sparkles,
    Smartphone,
    Store,
    Trash2,
    Users,
    CreditCard,
    Briefcase,
    Workflow,
    Sliders,
    Save,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useBankProfile, type ActivationScope } from "@/context/bank-profile-context"
import {
    BANK_MODULE_DEFINITIONS,
    PRESET_BANK_PROFILES,
    type BankProfile,
    type LogoVariant,
    type ModuleKey,
} from "@/lib/banking/bank-profiles"
import type { Palette } from "@/context/palette-context"
import { toast } from "sonner"

export default function BankProfilesStudioPage() {
    const {
        activeProfile,
        allProfiles,
        isPreviewMode,
        setActiveProfile,
        toggleModule,
        saveProfileOverride,
        saveCustomProfile,
        deleteCustomProfile,
        exitPreviewMode,
        isSwitching,
    } = useBankProfile()

    const [activationScope, setActivationScope] = React.useState<ActivationScope>("global")
    const [showCreator, setShowCreator] = React.useState(false)

    // Custom creator states
    const [shortName, setShortName] = React.useState("")
    const [legalName, setLegalName] = React.useState("")
    const [tagline, setTagline] = React.useState("")
    const [ussdCode, setUssdCode] = React.useState("*901*100#")
    const [supportEmail, setSupportEmail] = React.useState("")
    const [supportPhone, setSupportPhone] = React.useState("")
    const [hqAddress, setHqAddress] = React.useState("")
    const [palette, setPalette] = React.useState<Palette>("navy")
    const [logoVariant, setLogoVariant] = React.useState<LogoVariant>("shield")
    const [creatorHeroHex, setCreatorHeroHex] = React.useState("#070D59")
    const [creatorTopBarHex, setCreatorTopBarHex] = React.useState("#040836")
    const [creatorAccentHex, setCreatorAccentHex] = React.useState("#F4C414")

    // Active profile live override form state
    const [editTagline, setEditTagline] = React.useState(activeProfile.tagline)
    const [editUssd, setEditUssd] = React.useState(activeProfile.ussdCode)
    const [editHeroHex, setEditHeroHex] = React.useState(activeProfile.themeStyle.heroBgHex)
    const [editTopHex, setEditTopHex] = React.useState(activeProfile.themeStyle.topBarBgHex)
    const [editAccentHex, setEditAccentHex] = React.useState(activeProfile.themeStyle.accentHex)

    React.useEffect(() => {
        setEditTagline(activeProfile.tagline)
        setEditUssd(activeProfile.ussdCode)
        setEditHeroHex(activeProfile.themeStyle.heroBgHex)
        setEditTopHex(activeProfile.themeStyle.topBarBgHex)
        setEditAccentHex(activeProfile.themeStyle.accentHex)
    }, [activeProfile])

    const handleCreateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!shortName.trim() || !legalName.trim()) {
            toast.error("Please enter both Short Name and Legal Bank Name.")
            return
        }

        const slug = shortName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")

        const words = shortName.trim().split(" ")
        const template = PRESET_BANK_PROFILES[0]

        const custom: BankProfile = {
            ...template,
            id: `custom-${slug}-${Date.now().toString(36)}`,
            shortName: shortName.trim(),
            wordmarkPrimary: words.slice(0, -1).join(" ") || shortName.trim(),
            wordmarkSecondary: words.length > 1 ? words[words.length - 1] : "MFB",
            legalName: legalName.trim(),
            tagline: tagline.trim() || "Trusted Microfinance & Digital Collections",
            heroDescription: `${legalName.trim()} delivers savings, personnel & MSME credit, institutional collections, agency cashpoints, and 24/7 digital banking.`,
            defaultPalette: palette,
            logoVariant,
            themeStyle: {
                useBrandedDarkNav: true,
                useBrandedDarkHero: true,
                showTopUtilityBar: true,
                topBarBgHex: creatorTopBarHex || "#040836",
                heroBgHex: creatorHeroHex || "#070D59",
                accentHex: creatorAccentHex || "#F4C414",
            },
            domain: `${slug}.com.ng`,
            supportEmail: supportEmail.trim() || `info@${slug}.com.ng`,
            whistleblowerEmail: `compliance@${slug}.com.ng`,
            supportPhones: [supportPhone.trim() || "+234 (0) 700 MFB SUPPORT"],
            addressLines: hqAddress.trim()
                ? hqAddress.split(",").map((s) => s.trim())
                : ["Central Business District", "Nigeria"],
            regionLabel: hqAddress.trim() || "National Operations",
            ussdCode: ussdCode.trim() || "*901*100#",
            internalPayBrand: `${shortName.trim()} Pay`,
            posBrandName: `${shortName.trim().toUpperCase()} AGENCY POS`,
            demoCoopName: `${shortName.trim()} Cooperative Guild`,
            isCustom: true,
        }

        const res = await saveCustomProfile(custom, true, activationScope)
        if (!res.success) {
            toast.error("Failed to save custom bank profile", {
                description: res.error || "Check superadmin permissions and DATABASE_URI connectivity.",
            })
            return
        }
        toast.success(`Created and activated "${custom.legalName}"`, {
            description:
                activationScope === "global"
                    ? "Published globally across all visitors on this deployment."
                    : "Active in local browser preview mode.",
        })
        setShowCreator(false)
        setShortName("")
        setLegalName("")
        setTagline("")
    }

    const handleSaveActiveOverrides = async (e: React.FormEvent) => {
        e.preventDefault()
        const res = await saveProfileOverride(
            activeProfile.id,
            {
                tagline: editTagline.trim() || activeProfile.tagline,
                ussdCode: editUssd.trim() || activeProfile.ussdCode,
                themeStyle: {
                    heroBgHex: editHeroHex,
                    topBarBgHex: editTopHex,
                    accentHex: editAccentHex,
                },
            },
            activationScope
        )
        if (!res.success) {
            toast.error(`Failed to save overrides for ${activeProfile.shortName}`, {
                description: res.error || "Check superadmin session and database connection.",
            })
            return
        }
        toast.success(`Saved branding & USSD settings for ${activeProfile.shortName}`, {
            description:
                activationScope === "global"
                    ? "Published globally across this deployment."
                    : "Saved for local browser preview.",
        })
    }

    const renderEmblem = (prof: BankProfile) => {
        if (prof.logoVariant === "navy-anchor") {
            return (
                <div className="w-11 h-11 rounded-2xl bg-[#070D59] text-[#F4C414] border border-[#F4C414]/40 flex items-center justify-center shrink-0">
                    <Anchor className="h-5 w-5" />
                </div>
            )
        }
        if (prof.logoVariant === "maxitrust-emblem") {
            return (
                <div className="w-11 h-11 rounded-2xl bg-[#064E29] text-[#F59E0B] border border-[#F59E0B]/40 flex items-center justify-center shrink-0">
                    <Landmark className="h-5 w-5" />
                </div>
            )
        }
        if (prof.logoVariant === "asm-emblem") {
            return (
                <div className="w-11 h-11 rounded-2xl bg-emerald-600/15 text-emerald-600 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Building2 className="h-5 w-5" />
                </div>
            )
        }
        return (
            <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center shrink-0">
                <Landmark className="h-5 w-5" />
            </div>
        )
    }

    const moduleIcons: Record<ModuleKey, any> = {
        retailAndSalary: Landmark,
        schoolCollections: GraduationCap,
        cooperativeEsusu: Users,
        coptellerBridge: Building2,
        agencyPos: Store,
        smartCards: CreditCard,
        merchantApiAndPayroll: Briefcase,
        workflowEngine: Workflow,
    }

    return (
        <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header & Deployment Scope Control */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-black uppercase tracking-wider">
                        <Sparkles className="h-3.5 w-3.5" /> Superadmin White-Label Control Plane
                    </div>
                    <h1 className="text-3xl font-black tracking-tight">Bank Profile Swapper &amp; Feature Control</h1>
                    <p className="text-sm text-muted-foreground max-w-2xl">
                        Standardized multi-tenant control across public banking pages, client portals, admin dashboards, and enabled product modules. Publish globally to update all visitors on your hosted Vercel URL.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                    <div className="inline-flex p-1 rounded-xl bg-muted border border-border text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActivationScope("global")}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                activationScope === "global"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <Globe className="h-3.5 w-3.5 text-emerald-500" />
                            Publish Globally (Vercel)
                        </button>
                        <button
                            type="button"
                            onClick={() => setActivationScope("preview")}
                            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                                activationScope === "preview"
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground"
                            }`}
                        >
                            <Eye className="h-3.5 w-3.5 text-amber-500" />
                            Local Preview
                        </button>
                    </div>

                    <Button
                        onClick={() => setShowCreator((s) => !s)}
                        className="rounded-xl font-black gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        {showCreator ? "Close Custom Builder" : "New Prospect Profile"}
                    </Button>
                </div>
            </div>

            {isPreviewMode && (
                <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                        <Eye className="h-4 w-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-foreground">
                            You are viewing <strong>{activeProfile.legalName}</strong> in browser-only preview mode. Other visitors on the hosted URL still see the globally published bank.
                        </span>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={isSwitching}
                        onClick={async () => {
                            await exitPreviewMode()
                            toast.success("Synced view back to the globally published deployment profile.")
                        }}
                        className="rounded-xl font-bold h-8 border-amber-500/40"
                    >
                        Exit Preview &amp; Sync Global
                    </Button>
                </div>
            )}

            {/* Live Active Profile Launchpad */}
            <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-card to-accent/5 rounded-3xl overflow-hidden shadow-md">
                <CardContent className="p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                        {renderEmblem(activeProfile)}
                        <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 font-black text-[10px] uppercase">
                                    {isPreviewMode ? "Browser Preview Active" : "Live Global Deployment"}
                                </Badge>
                                <span className="text-xs font-mono font-bold text-muted-foreground">
                                    ID: {activeProfile.id} · USSD {activeProfile.ussdCode} · Palette: {activeProfile.defaultPalette}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black">{activeProfile.legalName}</h2>
                            <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                                {activeProfile.tagline} · {activeProfile.addressLines.join(", ")} · {activeProfile.supportEmail}
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2.5 shrink-0">
                        <Button asChild variant="default" size="sm" className="rounded-xl font-black gap-1.5">
                            <Link href="/" target="_blank">
                                <Globe className="h-3.5 w-3.5" /> Public Home <ExternalLink className="h-3 w-3" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold gap-1.5">
                            <Link href="/internet-banking" target="_blank">
                                <Smartphone className="h-3.5 w-3.5" /> Digital Banking <ExternalLink className="h-3 w-3" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold gap-1.5">
                            <Link href="/client-dashboard" target="_blank">
                                <Users className="h-3.5 w-3.5" /> Client Portal <ExternalLink className="h-3 w-3" />
                            </Link>
                        </Button>
                        <Button asChild variant="outline" size="sm" className="rounded-xl font-bold gap-1.5">
                            <Link href="/auth/login" target="_blank">
                                <ShieldCheck className="h-3.5 w-3.5" /> Login UI <ExternalLink className="h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Optional Custom Profile Builder */}
            {showCreator && (
                <Card className="border-border rounded-3xl">
                    <CardHeader>
                        <CardTitle className="text-lg font-black">Create Custom Prospect White-Label Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateProfile} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Short Brand Code *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Fortress MFB"
                                    value={shortName}
                                    onChange={(e) => setShortName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Full Legal Name *</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Fortress Microfinance Bank Limited"
                                    value={legalName}
                                    onChange={(e) => setLegalName(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Tagline / Motto</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Built for Trade & Civil Service Credit"
                                    value={tagline}
                                    onChange={(e) => setTagline(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">USSD Shortcode</label>
                                <input
                                    type="text"
                                    value={ussdCode}
                                    onChange={(e) => setUssdCode(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Support Email</label>
                                <input
                                    type="email"
                                    placeholder="info@prospectmfb.com"
                                    value={supportEmail}
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Support Phone</label>
                                <input
                                    type="text"
                                    placeholder="+234 (0) 800 000 0000"
                                    value={supportPhone}
                                    onChange={(e) => setSupportPhone(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Headquarters Address</label>
                                <input
                                    type="text"
                                    placeholder="Plot 42 Marina, Lagos"
                                    value={hqAddress}
                                    onChange={(e) => setHqAddress(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Theme Palette</label>
                                <select
                                    value={palette}
                                    onChange={(e) => setPalette(e.target.value as Palette)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-bold"
                                >
                                    <option value="navy">Naval Blue &amp; Brass Gold</option>
                                    <option value="nature">Emerald Green &amp; Gold</option>
                                    <option value="ocean">Ocean Blue &amp; Coral</option>
                                    <option value="electric">Electric Royal Blue</option>
                                    <option value="sunset">Executive Violet &amp; Amber</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Emblem Style</label>
                                <select
                                    value={logoVariant}
                                    onChange={(e) => setLogoVariant(e.target.value as LogoVariant)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-bold"
                                >
                                    <option value="shield">Corporate Bank Shield</option>
                                    <option value="maxitrust-emblem">Emerald Monogram Crest</option>
                                    <option value="navy-anchor">Naval Seal Crest</option>
                                    <option value="asm-emblem">ASM Legacy Emblem</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Hero Primary Hex</label>
                                <div className="flex gap-2">
                                    <input type="color" value={creatorHeroHex} onChange={(e) => setCreatorHeroHex(e.target.value)} className="h-10 w-12 rounded-lg border border-border p-1 bg-background" />
                                    <input type="text" value={creatorHeroHex} onChange={(e) => setCreatorHeroHex(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Top Utility Bar Hex</label>
                                <div className="flex gap-2">
                                    <input type="color" value={creatorTopBarHex} onChange={(e) => setCreatorTopBarHex(e.target.value)} className="h-10 w-12 rounded-lg border border-border p-1 bg-background" />
                                    <input type="text" value={creatorTopBarHex} onChange={(e) => setCreatorTopBarHex(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Highlight Accent Hex</label>
                                <div className="flex gap-2">
                                    <input type="color" value={creatorAccentHex} onChange={(e) => setCreatorAccentHex(e.target.value)} className="h-10 w-12 rounded-lg border border-border p-1 bg-background" />
                                    <input type="text" value={creatorAccentHex} onChange={(e) => setCreatorAccentHex(e.target.value)} className="flex-1 h-10 px-3 rounded-xl border border-border bg-background text-xs font-mono" />
                                </div>
                            </div>
                            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                                <Button type="button" variant="outline" onClick={() => setShowCreator(false)} className="rounded-xl">
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSwitching} className="rounded-xl font-black">
                                    Save &amp; Activate ({activationScope === "global" ? "Global" : "Preview"})
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Profile Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {allProfiles.map((prof) => {
                    const isActive = prof.id === activeProfile.id
                    return (
                        <Card
                            key={prof.id}
                            className={`rounded-3xl transition-all flex flex-col justify-between ${
                                isActive
                                    ? "border-2 border-primary shadow-xl bg-primary/[0.03]"
                                    : "border border-border hover:border-primary/40"
                            }`}
                        >
                            <CardContent className="p-5 space-y-4">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {renderEmblem(prof)}
                                        <div className="min-w-0">
                                            <h3 className="text-base font-black leading-tight truncate">{prof.shortName}</h3>
                                            <p className="text-[11px] text-muted-foreground font-semibold truncate">{prof.regionLabel}</p>
                                        </div>
                                    </div>
                                    {isActive ? (
                                        <Badge className="bg-primary text-primary-foreground font-black text-[10px] uppercase shrink-0">
                                            Active
                                        </Badge>
                                    ) : prof.isCustom ? (
                                        <button
                                            type="button"
                                            onClick={() => deleteCustomProfile(prof.id)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive rounded-lg"
                                            title="Delete custom profile"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <Badge variant="outline" className="text-[10px] font-bold uppercase shrink-0">
                                            Preset
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <p className="text-xs font-black leading-snug">{prof.legalName}</p>
                                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                                        {prof.heroDescription}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-[11px] bg-muted/40 p-2.5 rounded-2xl border border-border/60">
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[9px]">USSD Rail</p>
                                        <p className="font-mono font-black flex items-center gap-1 mt-0.5 truncate">
                                            <Hash className="h-3 w-3 text-primary shrink-0" /> {prof.ussdCode}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground font-bold uppercase text-[9px]">Palette</p>
                                        <p className="font-black capitalize flex items-center gap-1 mt-0.5">
                                            <PaletteIcon className="h-3 w-3 text-accent shrink-0" /> {prof.defaultPalette}
                                        </p>
                                    </div>
                                </div>

                                {/* Theme Color Swatches */}
                                <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                                    <span>Theme Hexes</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: prof.themeStyle.topBarBgHex }} title="Top Bar" />
                                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: prof.themeStyle.heroBgHex }} title="Hero Navy/Brand" />
                                        <span className="w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: prof.themeStyle.accentHex }} title="Accent" />
                                    </div>
                                </div>
                            </CardContent>

                            <div className="px-5 pb-5 pt-0">
                                <Button
                                    onClick={async () => {
                                        const res = await setActiveProfile(prof.id, true, activationScope)
                                        if (!res.success) {
                                            toast.error(`Could not switch to ${prof.shortName}`, {
                                                description: res.error || "Database or permission error.",
                                            })
                                            return
                                        }
                                        toast.success(`Swapped suite to ${prof.shortName}`, {
                                            description:
                                                activationScope === "global" && res.persistedGlobally
                                                    ? `${prof.legalName} published globally.`
                                                    : `${prof.legalName} active in current session.`,
                                        })
                                    }}
                                    disabled={isActive || isSwitching}
                                    variant={isActive ? "secondary" : "default"}
                                    className="w-full rounded-xl font-black h-10 text-xs"
                                >
                                    {isActive ? (
                                        <>
                                            <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-500" /> Active Suite
                                        </>
                                    ) : (
                                        `Activate ${prof.shortName}`
                                    )}
                                </Button>
                            </div>
                        </Card>
                    )
                })}
            </div>

            {/* Interactive Suite Feature & Dashboard Control Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <Card className="lg:col-span-7 rounded-3xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <Sliders className="h-5 w-5 text-primary" />
                            Enabled Modules &amp; Portal Feature Control ({activeProfile.shortName})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Toggle modules on or off to immediately tailor the Admin Dashboard sidebar, Client Portal hub, and available institutional features for <strong>{activeProfile.shortName}</strong>.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {BANK_MODULE_DEFINITIONS.map((mod) => {
                            const Icon = moduleIcons[mod.key]
                            const enabled = activeProfile.enabledModules[mod.key]
                            return (
                                <div
                                    key={mod.key}
                                    className={`flex items-center justify-between gap-4 p-4 rounded-2xl border transition-all ${
                                        enabled
                                            ? "bg-emerald-500/5 border-emerald-500/25"
                                            : "bg-muted/30 border-border opacity-80"
                                    }`}
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div
                                            className={`p-2 rounded-xl shrink-0 ${
                                                enabled
                                                    ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-xs sm:text-sm font-black">{mod.label}</p>
                                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background border border-border text-muted-foreground">
                                                    {mod.scopeHint}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                                {mod.description}
                                            </p>
                                        </div>
                                    </div>

                                    <Button
                                        type="button"
                                        size="sm"
                                        disabled={isSwitching}
                                        variant={enabled ? "default" : "outline"}
                                        onClick={async () => {
                                            const res = await toggleModule(activeProfile.id, mod.key, !enabled, activationScope)
                                            if (!res.success) {
                                                toast.error(`Failed to update ${mod.label}`, {
                                                    description: res.error || "Check superadmin session and database connection.",
                                                })
                                                return
                                            }
                                            toast.success(`${!enabled ? "Enabled" : "Disabled"} ${mod.label} for ${activeProfile.shortName}`)
                                        }}
                                        className="rounded-xl text-xs font-black shrink-0 min-w-[84px]"
                                    >
                                        {enabled ? "Enabled" : "Disabled"}
                                    </Button>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* Live Theme & Rail Customizer for Active Profile */}
                <Card className="lg:col-span-5 rounded-3xl border-border">
                    <CardHeader>
                        <CardTitle className="text-lg font-black flex items-center gap-2">
                            <PaletteIcon className="h-5 w-5 text-accent" />
                            Tune Active Profile ({activeProfile.shortName})
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Persist brand hex colors, USSD shortcodes, and motto overrides cleanly for live demos.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveActiveOverrides} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">Tagline / Motto</label>
                                <input
                                    type="text"
                                    value={editTagline}
                                    onChange={(e) => setEditTagline(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-muted-foreground">USSD Shortcode</label>
                                <input
                                    type="text"
                                    value={editUssd}
                                    onChange={(e) => setEditUssd(e.target.value)}
                                    className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-mono"
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Hero Hex</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={editHeroHex} onChange={(e) => setEditHeroHex(e.target.value)} className="h-9 w-10 rounded-lg border border-border p-0.5 bg-background" />
                                        <input type="text" value={editHeroHex} onChange={(e) => setEditHeroHex(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Top Bar Hex</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={editTopHex} onChange={(e) => setEditTopHex(e.target.value)} className="h-9 w-10 rounded-lg border border-border p-0.5 bg-background" />
                                        <input type="text" value={editTopHex} onChange={(e) => setEditTopHex(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs font-mono" />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[11px] font-bold text-muted-foreground">Accent Hex</label>
                                    <div className="flex items-center gap-2">
                                        <input type="color" value={editAccentHex} onChange={(e) => setEditAccentHex(e.target.value)} className="h-9 w-10 rounded-lg border border-border p-0.5 bg-background" />
                                        <input type="text" value={editAccentHex} onChange={(e) => setEditAccentHex(e.target.value)} className="w-full h-9 px-2 rounded-lg border border-border bg-background text-xs font-mono" />
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="submit"
                                disabled={isSwitching}
                                className="w-full rounded-xl font-black h-11 gap-2"
                            >
                                <Save className="h-4 w-4" />
                                Save Overrides ({activationScope === "global" ? "Publish Globally" : "Preview Only"})
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
