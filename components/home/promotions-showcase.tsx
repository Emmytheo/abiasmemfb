"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, Promotion } from "@/lib/api";
import { ChevronLeft, ChevronRight, Play, Pause, ExternalLink } from "lucide-react";

// =============================================
// HERO PROMOTIONS SHOWCASE
// Full-bleed cinematic slideshow with crossfade,
// progress bar, pause-on-hover & keyboard nav.
// =============================================

export function HeroPromotionsShowcase() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressRef = useRef<NodeJS.Timeout | null>(null);
    const DURATION = 5000; // ms per slide
    const TICK = 50;

    useEffect(() => {
        api.getPromotions('hero').then(p => {
            setPromotions(p.filter(x => x.isActive));
            setLoaded(true);
        }).catch(() => setLoaded(true));
    }, []);

    const clearTimers = useCallback(() => {
        if (intervalRef.current) clearTimeout(intervalRef.current);
        if (progressRef.current) clearInterval(progressRef.current);
    }, []);

    const startCycle = useCallback(() => {
        clearTimers();
        if (paused || promotions.length <= 1) return;
        let elapsed = 0;
        progressRef.current = setInterval(() => {
            elapsed += TICK;
            setProgress(Math.min((elapsed / DURATION) * 100, 100));
        }, TICK);
        intervalRef.current = setTimeout(() => {
            setProgress(0);
            setActiveIdx(prev => (prev + 1) % promotions.length);
        }, DURATION);
    }, [paused, promotions.length, clearTimers]);

    useEffect(() => {
        setProgress(0);
        startCycle();
        return clearTimers;
    }, [activeIdx, paused, promotions.length, startCycle, clearTimers]);

    const goTo = (idx: number) => { setProgress(0); setActiveIdx(idx); };
    const prev = () => goTo((activeIdx - 1 + promotions.length) % promotions.length);
    const next = () => goTo((activeIdx + 1) % promotions.length);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    });

    // Loading / empty states
    if (!loaded) {
        return (
            <div className="relative h-[520px] md:h-[620px] bg-gradient-to-br from-[hsl(36,85%,52%)] to-[hsl(25,80%,40%)] animate-pulse rounded-2xl overflow-hidden" />
        );
    }
    if (promotions.length === 0) return null;

    const current = promotions[activeIdx];

    return (
        <section
            className="relative h-[520px] md:h-[620px] rounded-2xl overflow-hidden shadow-2xl group select-none"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            {/* Slides */}
            {promotions.map((promo, idx) => (
                <div
                    key={promo.id}
                    className={`absolute inset-0 transition-opacity duration-700 ${idx === activeIdx ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                    {promo.resolvedImageUrl ? (
                        <Image
                            src={promo.resolvedImageUrl}
                            alt={promo.title}
                            fill
                            className="object-cover"
                            priority={idx === 0}
                            sizes="(max-width: 1280px) 100vw, 1280px"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(36,85%,42%)] via-[hsl(30,70%,35%)] to-[hsl(20,65%,25%)]" />
                    )}
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                </div>
            ))}

            {/* Content */}
            <div className="relative z-20 h-full flex flex-col justify-end p-8 md:p-12">
                <div className="max-w-2xl">
                    {/* Animated pill tag */}
                    <span className="inline-block px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-black text-amber-300 bg-amber-300/15 border border-amber-300/30 rounded-full mb-4 backdrop-blur-sm">
                        Featured Offer
                    </span>
                    <h2 className="text-3xl md:text-5xl font-black text-white leading-tight mb-3 drop-shadow-lg">
                        {current.title}
                    </h2>
                    {current.description && (
                        <p className="text-white/80 text-base md:text-lg leading-relaxed mb-6 max-w-xl line-clamp-2">
                            {current.description}
                        </p>
                    )}
                    {current.link && (
                        <Link
                            href={current.link}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-400 hover:bg-amber-300 text-amber-950 font-bold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg shadow-amber-500/30 text-sm"
                        >
                            Learn More <ExternalLink className="h-4 w-4" />
                        </Link>
                    )}
                </div>

                {/* Progress bar */}
                {promotions.length > 1 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                        <div
                            className="h-full bg-amber-400 transition-none"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Nav arrows */}
            {promotions.length > 1 && (
                <>
                    <button
                        onClick={prev}
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Previous"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={next}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
                        aria-label="Next"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>

                    {/* Pause/play + dot indicators */}
                    <div className="absolute top-4 right-4 z-30 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={() => setPaused(p => !p)}
                            className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/70"
                            aria-label={paused ? "Play" : "Pause"}
                        >
                            {paused ? <Play className="h-3 w-3 fill-current" /> : <Pause className="h-3 w-3" />}
                        </button>
                    </div>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
                        {promotions.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => goTo(idx)}
                                className={`transition-all duration-300 rounded-full ${idx === activeIdx ? 'w-6 h-2 bg-amber-400' : 'w-2 h-2 bg-white/40 hover:bg-white/70'}`}
                                aria-label={`Go to slide ${idx + 1}`}
                            />
                        ))}
                    </div>
                </>
            )}
        </section>
    );
}

// =============================================
// BANNER PROMOTIONS (horizontal strip)
// =============================================

export function BannerPromotion() {
    const [promotion, setPromotion] = useState<Promotion | null>(null);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        api.getPromotions('banner').then(p => {
            const active = p.filter(x => x.isActive);
            if (active.length > 0) setPromotion(active[0]);
        }).catch(() => {});
    }, []);

    if (!promotion || dismissed) return null;

    return (
        <div className="relative overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-amber-950/60 backdrop-blur-sm shadow-lg">
            {promotion.resolvedImageUrl && (
                <Image
                    src={promotion.resolvedImageUrl}
                    alt={promotion.title}
                    fill
                    className="object-cover opacity-10"
                />
            )}
            <div className="relative z-10 flex items-center justify-between gap-4 px-6 py-4">
                <div className="flex items-center gap-4 min-w-0">
                    <span className="shrink-0 w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-amber-400 text-xs font-black">
                        ★
                    </span>
                    <div className="min-w-0">
                        <p className="font-bold text-amber-200 text-sm truncate">{promotion.title}</p>
                        {promotion.description && (
                            <p className="text-amber-300/70 text-xs truncate">{promotion.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {promotion.link && (
                        <Link
                            href={promotion.link}
                            className="text-xs font-bold text-amber-400 hover:text-amber-300 underline-offset-2 hover:underline flex items-center gap-1"
                        >
                            View <ExternalLink className="h-3 w-3" />
                        </Link>
                    )}
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-amber-400/50 hover:text-amber-400 text-lg leading-none"
                        aria-label="Dismiss"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}

// =============================================
// SIDEBAR PROMOTIONS WIDGET
// Compact card stack for sidebar injection
// =============================================

export function SidebarPromotionsWidget() {
    const [promotions, setPromotions] = useState<Promotion[]>([]);
    const [activeIdx, setActiveIdx] = useState(0);

    useEffect(() => {
        api.getPromotions('sidebar').then(p => {
            setPromotions(p.filter(x => x.isActive));
        }).catch(() => {});

        // Auto-rotate sidebar promos every 7 seconds
        const timer = setInterval(() => {
            setActiveIdx(prev => prev + 1); // wraps in render
        }, 7000);
        return () => clearInterval(timer);
    }, []);

    if (promotions.length === 0) return null;

    const promo = promotions[activeIdx % promotions.length];

    return (
        <div className="rounded-xl overflow-hidden border border-border shadow-md group">
            {/* Image area */}
            <div className="relative h-36 bg-gradient-to-br from-amber-800/60 to-amber-950/80">
                {promo.resolvedImageUrl && (
                    <Image
                        src={promo.resolvedImageUrl}
                        alt={promo.title}
                        fill
                        className="object-cover opacity-60 group-hover:opacity-80 transition-opacity duration-500"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <span className="absolute top-2 left-2 text-[9px] uppercase tracking-[0.15em] font-black text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">
                    Promotion
                </span>
            </div>

            {/* Content */}
            <div className="p-4 bg-card">
                <h4 className="font-bold text-sm text-foreground leading-snug mb-1 line-clamp-2">
                    {promo.title}
                </h4>
                {promo.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{promo.description}</p>
                )}
                {promo.link && (
                    <Link
                        href={promo.link}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                    >
                        Learn more <ExternalLink className="h-3 w-3" />
                    </Link>
                )}
            </div>

            {/* Dot indicators */}
            {promotions.length > 1 && (
                <div className="flex justify-center gap-1 pb-3 bg-card">
                    {promotions.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIdx(i)}
                            className={`rounded-full transition-all duration-300 ${i === activeIdx % promotions.length ? 'w-4 h-1.5 bg-amber-400' : 'w-1.5 h-1.5 bg-muted-foreground/30'}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
