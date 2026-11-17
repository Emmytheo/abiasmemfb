"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { ShieldCheck } from "lucide-react"
import { useBankProfile } from "@/context/bank-profile-context"

export function NavalCrestSvg({ className = "w-full h-full" }: { className?: string }) {
    return (
        <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
            <defs>
                <radialGradient id="navyCrestBg" cx="50%" cy="35%" r="65%">
                    <stop offset="0%" stopColor="#132294" />
                    <stop offset="65%" stopColor="#070D59" />
                    <stop offset="100%" stopColor="#030630" />
                </radialGradient>
                <linearGradient id="brassGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE047" />
                    <stop offset="50%" stopColor="#F4C414" />
                    <stop offset="100%" stopColor="#CA8A04" />
                </linearGradient>
            </defs>

            {/* Outer Naval Seal Ring */}
            <circle cx="80" cy="80" r="76" fill="url(#navyCrestBg)" stroke="url(#brassGold)" strokeWidth="5" />
            <circle cx="80" cy="80" r="56" fill="none" stroke="url(#brassGold)" strokeWidth="2.5" />

            {/* Stylized Naira Glyph */}
            <path
                d="M54 110 V50 L106 110 V50 M44 72 H116 M44 88 H116"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="7.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.92"
            />

            {/* Diagonal Fouled Anchor Overlay */}
            <g transform="rotate(-32 80 80)">
                <circle cx="80" cy="48" r="6.5" fill="none" stroke="url(#brassGold)" strokeWidth="3.5" />
                <path
                    d="M80 55 V114 M64 66 H96 M56 98 C58 118, 102 118, 104 98"
                    fill="none"
                    stroke="url(#brassGold)"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
            </g>
        </svg>
    )
}

export function MaxitrustCrestSvg({ className = "w-full h-full" }: { className?: string }) {
    return (
        <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
            <defs>
                <linearGradient id="maxiEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#047857" />
                    <stop offset="55%" stopColor="#064E29" />
                    <stop offset="100%" stopColor="#032615" />
                </linearGradient>
                <linearGradient id="maxiGold" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#B45309" />
                </linearGradient>
            </defs>
            <rect x="8" y="8" width="144" height="144" rx="34" fill="url(#maxiEmerald)" stroke="url(#maxiGold)" strokeWidth="5" />
            <path
                d="M42 112 V48 L66 84 L80 62 L94 84 L118 48 V112"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M52 124 H108"
                stroke="url(#maxiGold)"
                strokeWidth="6"
                strokeLinecap="round"
            />
        </svg>
    )
}

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
    iconShape?: "square" | "circle" | "rounded-lg"
    iconClassName?: string
    textClassName?: string
    subtitle?: React.ReactNode
    subtitleClassName?: string
    iconOnly?: boolean
}

export function Logo({
    className,
    iconShape = "rounded-lg",
    iconClassName,
    textClassName,
    subtitle,
    subtitleClassName,
    iconOnly = false,
    ...props
}: LogoProps) {
    const { activeProfile } = useBankProfile()

    const renderIcon = () => {
        if (activeProfile.logoVariant === "navy-anchor") {
            return (
                <div
                    className={cn(
                        "flex aspect-square shrink-0 items-center justify-center rounded-full bg-white p-[2px] ring-1 ring-accent/50 overflow-hidden shadow-md",
                        "w-9 h-9",
                        iconClassName
                    )}
                >
                    <Image
                        src="/images/nnmfb-logo.png"
                        alt={`${activeProfile.shortName} Official Seal`}
                        width={96}
                        height={96}
                        className="w-full h-full object-contain rounded-full"
                        priority
                    />
                </div>
            )
        }

        if (activeProfile.logoVariant === "maxitrust-emblem") {
            return (
                <div
                    className={cn(
                        "flex aspect-square shrink-0 items-center justify-center rounded-xl overflow-hidden shadow-md",
                        "w-9 h-9",
                        iconClassName
                    )}
                >
                    <MaxitrustCrestSvg />
                </div>
            )
        }

        return (
            <div
                className={cn(
                    "flex aspect-square shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-sm overflow-hidden",
                    iconShape === "square" ? "" : iconShape === "circle" ? "rounded-full" : "rounded-lg",
                    "w-8 h-8 text-lg font-black",
                    iconClassName
                )}
            >
                {activeProfile.logoVariant === "asm-emblem" ? (
                    <Image src="/images/ASM-logo.png" alt={activeProfile.shortName} width={50} height={50} className="object-contain" />
                ) : (
                    <div className="w-full h-full bg-primary text-accent flex items-center justify-center rounded-[inherit]">
                        <ShieldCheck className="w-[58%] h-[58%]" />
                    </div>
                )}
            </div>
        )
    }

    if (iconOnly) {
        return renderIcon()
    }

    return (
        <div className={cn("flex items-center gap-2.5", className)} {...props}>
            {renderIcon()}
            <div className="grid flex-1 text-left leading-tight">
                <span className={cn("truncate font-bold tracking-tight text-primary font-display", textClassName)}>
                    {activeProfile.wordmarkPrimary}{" "}
                    <span className="font-light text-accent">{activeProfile.wordmarkSecondary}</span>
                </span>
                {subtitle && (
                    <span className={cn("truncate text-[10px] text-muted-foreground tracking-widest uppercase font-semibold", subtitleClassName)}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    )
}
