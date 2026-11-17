"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SidePanelWrapperProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    emptyState?: React.ReactNode
    className?: string
}

export function SidePanelWrapper({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    emptyState,
    className = "" 
}: SidePanelWrapperProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Lock background body scroll when mobile sheet is open
    React.useEffect(() => {
        if (!isOpen) return
        const origOverflow = document.body.style.overflow
        const origPaddingRight = document.body.style.paddingRight
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`
        }
        document.body.style.overflow = 'hidden'

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleKeyDown)

        return () => {
            document.body.style.overflow = origOverflow
            document.body.style.paddingRight = origPaddingRight
            window.removeEventListener('keydown', handleKeyDown)
        }
    }, [isOpen, onClose])

    return (
        <>
            {/* Mobile/Tablet Modal Sheet: Only mounted when isOpen is true */}
            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center lg:hidden pointer-events-auto">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={onClose}
                                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
                            />
                            {/* Modal Panel */}
                            <motion.div
                                initial={{ y: "100%", opacity: 0.5 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: "100%", opacity: 0.5 }}
                                transition={{ type: "spring", damping: 28, stiffness: 240 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-950 border-t sm:border border-slate-200 dark:border-slate-800 rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl flex flex-col max-h-[88vh] z-10"
                            >
                                {/* Mobile pull handle indicator */}
                                <div className="sm:hidden w-10 h-1 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto -mt-1 mb-3 shrink-0" />

                                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">{title || "Details"}</h3>
                                    </div>
                                    <button 
                                        onClick={onClose} 
                                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                        aria-label="Close"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="sidepanel-mobile-sheet-content overflow-y-auto overscroll-contain flex-1 pt-2 pr-0.5 space-y-3">
                                    {children}
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Desktop Sticky Panel: acts as a clean grid column element (hidden on mobile/tablet) */}
            <div className={`hidden lg:block ${className}`}>
                <div className="sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto pr-1 pb-6 space-y-4">
                    {isOpen ? (
                        children
                    ) : (
                        emptyState || (
                            <div className="bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center">
                                <svg className="h-8 w-8 mx-auto mb-3 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-xs font-bold text-muted-foreground">Select an item from the list to view specifications or details.</p>
                            </div>
                        )
                    )}
                </div>
            </div>
        </>
    )
}

