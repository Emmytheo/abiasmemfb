"use client"

import * as React from "react"
import Link from "next/link"
import { Check, ChevronsUpDown, Building2, Anchor, ShieldCheck, ExternalLink, Sparkles, Landmark, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBankProfile } from "@/context/bank-profile-context"
import { toast } from "sonner"

export function BankProfileSwitcher({ compact = false }: { compact?: boolean }) {
    const { activeProfile, allProfiles, setActiveProfile, isPreviewMode, exitPreviewMode, isSwitching } = useBankProfile()

    const handleSelect = async (id: string, name: string) => {
        if (id === activeProfile.id) return
        const result = await setActiveProfile(id, true, "global")
        toast.success(`Switched active bank profile to ${name}`, {
            description: result?.persistedGlobally
                ? "Published globally across this Vercel deployment."
                : "Updated theme palette, branding, channels & client portals.",
        })
    }

    const renderIcon = (variant: string) => {
        if (variant === "navy-anchor") return <Anchor className="h-3.5 w-3.5 text-[#D4AF37]" />
        if (variant === "asm-emblem") return <Building2 className="h-3.5 w-3.5 text-emerald-500" />
        if (variant === "maxitrust-emblem") return <Landmark className="h-3.5 w-3.5 text-amber-500" />
        return <ShieldCheck className="h-3.5 w-3.5 text-sky-500" />
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    size={compact ? "sm" : "default"}
                    disabled={isSwitching}
                    className="gap-2 border-primary/25 bg-primary/5 hover:bg-primary/10 text-foreground rounded-full px-3 h-9 shrink-0"
                >
                    {renderIcon(activeProfile.logoVariant)}
                    <span className="text-xs font-black tracking-tight max-w-[140px] truncate">
                        {activeProfile.shortName}
                    </span>
                    <span className={`hidden md:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${isPreviewMode ? "bg-amber-500/20 text-amber-600" : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"}`}>
                        <Globe className="h-2.5 w-2.5" />
                        {isPreviewMode ? "Preview" : "Live Global"}
                    </span>
                    <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 z-[200]">
                <DropdownMenuLabel className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                    <span>White-Label Bank Profile</span>
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {allProfiles.map((prof) => {
                    const isActive = prof.id === activeProfile.id
                    return (
                        <DropdownMenuItem
                            key={prof.id}
                            onClick={() => handleSelect(prof.id, prof.legalName)}
                            className={`flex items-start gap-2.5 p-2.5 cursor-pointer ${
                                isActive ? "bg-primary/10" : ""
                            }`}
                        >
                            <div className="mt-0.5 p-1.5 rounded-lg bg-background border border-border shrink-0">
                                {renderIcon(prof.logoVariant)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-xs font-black truncate">{prof.shortName}</p>
                                    {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{prof.legalName}</p>
                                <p className="text-[10px] text-muted-foreground/80 font-mono mt-0.5">
                                    {prof.ussdCode} · {prof.defaultPalette}
                                </p>
                            </div>
                        </DropdownMenuItem>
                    )
                })}

                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer font-bold text-xs text-primary">
                    <Link href="/settings/bank-profiles" className="flex items-center justify-between w-full">
                        <span>Open White-Label Studio</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="cursor-pointer font-semibold text-xs">
                    <Link href="/" target="_blank" className="flex items-center justify-between w-full">
                        <span>Preview Public Experience</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
