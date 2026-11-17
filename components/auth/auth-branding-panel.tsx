"use client";

import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/logo";
import { ShieldCheck, CheckCircle } from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";

interface AuthBrandingPanelProps {
    mode?: "login" | "signup";
}

export function AuthBrandingPanel({ mode = "login" }: AuthBrandingPanelProps) {
    const { activeProfile } = useBankProfile();
    const cycles = activeProfile.authCycles;
    const [idx, setIdx] = useState(0);
    const [transitioning, setTransitioning] = useState(false);

    useEffect(() => {
        setIdx(0);
    }, [activeProfile.id]);

    useEffect(() => {
        if (cycles.length <= 1) return;
        const interval = setInterval(() => {
            setTransitioning(true);
            setTimeout(() => {
                setIdx((i) => (i + 1) % cycles.length);
                setTransitioning(false);
            }, 350);
        }, 6000);
        return () => clearInterval(interval);
    }, [cycles.length]);

    const slide = cycles[idx % cycles.length] || cycles[0];

    return (
        <div className="relative hidden lg:flex flex-col items-center justify-center p-10 overflow-hidden bg-zinc-950">
            <div className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] ${slide.orbA} rounded-full blur-[130px] transition-all duration-1000 pointer-events-none`} />
            <div className={`absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] ${slide.orbB} rounded-full blur-[130px] transition-all duration-1000 pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/60 via-transparent to-zinc-950/80 pointer-events-none" />

            <div className="relative z-10 w-full max-w-lg flex flex-col items-center text-center gap-8">
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md ring-1 ring-white/20 shadow-2xl">
                    <Logo className="h-12 w-auto drop-shadow-lg" textClassName="text-white text-xl" />
                </div>

                <div className={`space-y-4 transition-all duration-300 ${transitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest text-accent">
                        {mode === "signup" ? `Join ${activeProfile.shortName}` : `${activeProfile.shortName} Digital Portal`}
                    </p>
                    <h2 className={`text-3xl lg:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r ${slide.accent} leading-tight`}>
                        {slide.headline}
                    </h2>
                    <p className="text-base text-white/75 leading-relaxed font-light max-w-md mx-auto">
                        {slide.sub}
                    </p>

                    <div className="flex flex-col gap-2 mt-4">
                        {slide.features.map((feat, i) => (
                            <div key={i} className="flex items-center gap-2 justify-center text-sm text-white/85 font-medium">
                                <ShieldCheck className="w-4 h-4 text-accent shrink-0" />
                                <span>{feat}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {cycles.length > 1 && (
                    <div className="flex gap-2">
                        {cycles.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                onClick={() => setIdx(i)}
                                aria-label={`Slide ${i + 1}`}
                                className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-white" : "w-2 bg-white/30"}`}
                            />
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-4 gap-3 w-full">
                    {activeProfile.authMetrics.map((s, i) => (
                        <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-3 border border-white/10 text-center">
                            <p className="text-sm sm:text-base font-black text-white leading-none">{s.value}</p>
                            <p className="text-[9px] font-bold uppercase tracking-widest text-white/55 mt-1.5">{s.label}</p>
                        </div>
                    ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-white/60 font-medium">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{activeProfile.licenseBadge}</span>
                </div>
            </div>
        </div>
    );
}
