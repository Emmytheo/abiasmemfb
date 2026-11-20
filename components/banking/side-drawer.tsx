"use client"

import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { X } from "lucide-react"

interface BankSideDrawerProps {
    open: boolean
    onClose: () => void
    title: string
    subtitle?: string
    badge?: React.ReactNode
    children: React.ReactNode
    footer?: React.ReactNode
    maxWidthClass?: string
}

export function BankSideDrawer({
    open,
    onClose,
    title,
    subtitle,
    badge,
    children,
    footer,
    maxWidthClass = "max-w-xl",
}: BankSideDrawerProps) {
    React.useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose()
        }
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [open, onClose])

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[2px]"
                    />
                    <motion.aside
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 28, stiffness: 280 }}
                        className={`relative z-10 w-full ${maxWidthClass} h-full bg-card border-l border-border shadow-2xl flex flex-col`}
                    >
                        <div className="px-6 py-5 border-b border-border/80 flex items-start justify-between gap-4 bg-muted/20">
                            <div className="space-y-1 min-w-0">
                                {badge && <div className="mb-1">{badge}</div>}
                                <h2 className="text-lg font-black tracking-tight text-foreground truncate">
                                    {title}
                                </h2>
                                {subtitle && (
                                    <p className="text-xs text-muted-foreground font-medium truncate">
                                        {subtitle}
                                    </p>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={onClose}
                                className="p-2 rounded-xl border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                aria-label="Close drawer"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">{children}</div>

                        {footer && (
                            <div className="px-6 py-4 border-t border-border/80 bg-muted/20 flex items-center justify-end gap-2">
                                {footer}
                            </div>
                        )}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    )
}
