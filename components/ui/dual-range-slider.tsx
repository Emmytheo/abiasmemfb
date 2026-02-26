"use client";

import * as React from "react";

/**
 * A simple custom Dual Range Slider that uses two native HTML input ranges.
 * This avoids dependency issues when package managers fail in CMD.
 */
interface DualRangeSliderProps {
    min: number;
    max: number;
    step?: number;
    value: [number, number];
    onChange: (value: [number, number]) => void;
    className?: string;
}

export function DualRangeSlider({ min, max, step = 1, value, onChange, className = "" }: DualRangeSliderProps) {
    const [minValue, maxValue] = value;

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.min(Number(e.target.value), maxValue - step);
        onChange([newVal, maxValue]);
    };

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVal = Math.max(Number(e.target.value), minValue + step);
        onChange([minValue, newVal]);
    };

    const minPercent = ((minValue - min) / (max - min)) * 100;
    const maxPercent = ((maxValue - min) / (max - min)) * 100;

    return (
        <div className={`relative h-6 w-full flex items-center ${className}`}>
            <div className="absolute w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                    className="absolute h-full bg-primary"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={minValue}
                onChange={handleMinChange}
                className="absolute w-full h-full pointer-events-none appearance-none bg-transparent dual-slider-thumb z-20"
                style={{ WebkitAppearance: 'none' }}
            />
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={maxValue}
                onChange={handleMaxChange}
                className="absolute w-full h-full pointer-events-none appearance-none bg-transparent dual-slider-thumb z-30"
                style={{ WebkitAppearance: 'none' }}
            />
            <style jsx>{`
                input[type=range]::-webkit-slider-thumb {
                    pointer-events: auto;
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: hsl(var(--foreground));
                    cursor: pointer;
                    border: 2px solid hsl(var(--background));
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
                input[type=range]::-moz-range-thumb {
                    pointer-events: auto;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: hsl(var(--foreground));
                    cursor: pointer;
                    border: 2px solid hsl(var(--background));
                    box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                }
            `}</style>
        </div>
    );
}
