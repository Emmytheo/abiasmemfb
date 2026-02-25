"use client"

import * as React from "react"
import { Moon, Sun, Palette as PaletteIcon, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { usePalette } from "@/context/palette-context"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuCheckboxItem
} from "@/components/ui/dropdown-menu"

export function ThemeCustomizer() {
    const { setTheme, theme } = useTheme()
    const { palette, setPalette } = usePalette()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="relative shrink-0">
                    <PaletteIcon className="h-[1.2rem] w-[1.2rem] transition-all" />
                    <span className="sr-only">Toggle theme and palette</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mode</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
                    <Sun className="h-4 w-4" /> Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
                    <Moon className="h-4 w-4" /> Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
                    <Monitor className="h-4 w-4" /> System
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuLabel>Color Palette</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                    checked={palette === 'default'}
                    onCheckedChange={() => setPalette('default')}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-zinc-500" />
                        Default (Zinc)
                    </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={palette === 'nature'}
                    onCheckedChange={() => setPalette('nature')}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#125B36]" />
                        Nature (Green)
                    </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={palette === 'electric'}
                    onCheckedChange={() => setPalette('electric')}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
                        Electric (Blue)
                    </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={palette === 'ocean'}
                    onCheckedChange={() => setPalette('ocean')}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#0ea5e9]" />
                        Ocean (Teal)
                    </div>
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                    checked={palette === 'sunset'}
                    onCheckedChange={() => setPalette('sunset')}
                >
                    <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#9333ea]" />
                        Sunset (Purple)
                    </div>
                </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
