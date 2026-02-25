import * as React from "react"
import { cn } from "@/lib/utils"
import Image from "next/image"

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
    // Use this central file to swap out your logo icon or image!
    const renderIcon = () => (
        <div className={cn(
            "flex aspect-square shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-sm",
            iconShape === "square" ? "" : iconShape === "circle" ? "rounded-full" : "rounded-lg",
            "w-8 h-8 text-lg font-black", // Default styles
            iconClassName
        )}>
            {/* UPDATE HERE: Replace with <Image src="/logo.png" ... /> or your custom SVG icon */}
            <Image src="/images/ASM-logo.png" alt="Logo" width={50} height={50} />
        </div>
    )

    if (iconOnly) {
        return renderIcon()
    }

    return (
        <div className={cn("flex items-center gap-2", className)} {...props}>
            {renderIcon()}
            <div className="grid flex-1 text-left leading-tight">
                {/* UPDATE HERE: Update your brand name globally */}
                <span className={cn("truncate font-bold text-primary font-display", textClassName)}>
                    AbiaSME<span className="font-light">MFB</span>
                </span>
                {subtitle && (
                    <span className={cn("truncate text-xs text-muted-foreground tracking-widest uppercase font-medium", subtitleClassName)}>
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    )
}
