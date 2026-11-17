"use client"

import React, { createContext, useContext, useEffect, useState } from "react"

export type Palette = "default" | "nature" | "navy" | "electric" | "ocean" | "sunset"

interface PaletteContextType {
    palette: Palette
    setPalette: (palette: Palette) => void
}

const PaletteContext = createContext<PaletteContextType | undefined>(undefined)

export function PaletteProvider({
    children,
    initialPalette = "navy",
}: {
    children: React.ReactNode
    initialPalette?: Palette
}) {
    const [palette, setPaletteState] = useState<Palette>(initialPalette)

    // Always follow initialPalette when server/profile changes
    useEffect(() => {
        setPaletteState(initialPalette)
    }, [initialPalette])

    useEffect(() => {
        const root = document.documentElement
        if (palette === "default") {
            root.removeAttribute("data-palette")
        } else {
            root.setAttribute("data-palette", palette)
        }
        localStorage.setItem("theme-palette", palette)
    }, [palette])

    const setPalette = (next: Palette) => {
        setPaletteState(next)
    }

    return (
        <PaletteContext.Provider value={{ palette, setPalette }}>
            {children}
        </PaletteContext.Provider>
    )
}

export function usePalette() {
    const context = useContext(PaletteContext)
    if (!context) {
        return {
            palette: "navy" as Palette,
            setPalette: () => {},
        }
    }
    return context
}
