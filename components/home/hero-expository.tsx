"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight, ShieldCheck, GraduationCap, Wifi,
    CreditCard, Hash, CheckCircle2, Smartphone, Sparkles, SlidersHorizontal
} from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";
import { Logo } from "@/components/ui/logo";

const CYCLE_DURATION = 8000;

export function HeroExpository() {
    const { activeProfile } = useBankProfile();
    const slides = activeProfile.heroSlides;
    const isDarkHero = activeProfile.themeStyle.useBrandedDarkHero;

    const [activeIdx, setActiveIdx] = useState(0);
    const [paused, setPaused] = useState(false);
    const [dockTab, setDockTab] = useState<"card" | "school" | "ussd">("card");

    useEffect(() => {
        setActiveIdx(0);
    }, [activeProfile.id]);

    const goToSlide = useCallback((idx: number) => {
        setActiveIdx(idx % Math.max(slides.length, 1));
    }, [slides.length]);

    useEffect(() => {
        if (paused || slides.length <= 1) return;
        const interval = setInterval(() => {
            setActiveIdx((i) => (i + 1) % slides.length);
        }, CYCLE_DURATION);
        return () => clearInterval(interval);
    }, [paused, slides.length]);

    const slide = slides[activeIdx % slides.length] || slides[0];

    return (
        <section
            className={`relative overflow-hidden ${
                isDarkHero ? "text-white pt-28 sm:pt-36 pb-16 sm:pb-24" : "bg-background text-foreground pt-28 pb-20"
            }`}
            style={
                isDarkHero
                    ? {
                          background: `radial-gradient(1100px circle at 82% 18%, rgba(244, 196, 20, 0.16), transparent 55%), radial-gradient(900px circle at 10% 85%, rgba(59, 130, 246, 0.22), transparent 55%), linear-gradient(135deg, ${activeProfile.themeStyle.topBarBgHex} 0%, ${activeProfile.themeStyle.heroBgHex} 55%, #040836 100%)`,
                      }
                    : undefined
            }
        >
            {/* Architectural Coordinate Grid */}
            <div
                className={`absolute inset-0 pointer-events-none ${isDarkHero ? "opacity-[0.07]" : "opacity-[0.04]"}`}
                style={{
                    backgroundImage:
                        "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "52px 52px",
                }}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
                    {/* Left: Editorial Hero Copy */}
                    <div className="lg:col-span-7 space-y-7">
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`inline-flex items-center gap-2.5 py-1.5 px-4 rounded-full border backdrop-blur-md text-[11px] font-black uppercase tracking-[0.18em] ${
                                isDarkHero
                                    ? "bg-white/10 border-white/20 text-[#F4C414]"
                                    : "bg-primary/10 border-primary/20 text-primary"
                            }`}
                        >
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            <span>{slide.badge}</span>
                        </motion.div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeProfile.id}-${slide.id}`}
                                initial={{ opacity: 0, y: 14 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.35 }}
                                className="space-y-5"
                            >
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-[4.4rem] font-display font-black leading-[1.03] tracking-tight">
                                    {slide.headlineTop}
                                    <span
                                        className={`block mt-1 text-transparent bg-clip-text bg-gradient-to-r ${slide.accentGradient}`}
                                    >
                                        {slide.headlineAccent}
                                    </span>
                                </h1>

                                <p
                                    className={`text-base sm:text-lg max-w-xl leading-relaxed font-medium ${
                                        isDarkHero ? "text-slate-200" : "text-muted-foreground"
                                    }`}
                                >
                                    {slide.body}
                                </p>
                            </motion.div>
                        </AnimatePresence>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3.5 pt-1">
                            <Link
                                href={slide.ctaHref}
                                className="px-7 py-4 bg-accent text-accent-foreground font-black rounded-2xl hover:bg-white hover:text-[#070D59] transition-all shadow-xl shadow-black/20 flex items-center gap-2.5 text-sm group"
                            >
                                {slide.ctaLabel}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href={slide.ctaSecondaryHref}
                                className={`px-7 py-4 rounded-2xl font-bold text-sm border backdrop-blur-md transition-all ${
                                    isDarkHero
                                        ? "border-white/30 bg-white/5 text-white hover:bg-white/15"
                                        : "border-border bg-card text-foreground hover:bg-muted"
                                }`}
                            >
                                {slide.ctaSecondaryLabel}
                            </Link>
                        </div>

                        {/* Interactive Story Chapter Pills */}
                        {slides.length > 1 && (
                            <div className="pt-4 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    {slides.map((s, i) => (
                                        <button
                                            key={s.id}
                                            type="button"
                                            onClick={() => {
                                                setPaused(true);
                                                goToSlide(i);
                                            }}
                                            className={`px-3.5 py-1.5 rounded-full text-[11px] font-black transition-all border ${
                                                i === activeIdx
                                                    ? "bg-accent text-accent-foreground border-accent shadow-md"
                                                    : isDarkHero
                                                      ? "bg-white/5 border-white/15 text-white/75 hover:text-white hover:bg-white/10"
                                                      : "bg-muted border-border text-muted-foreground hover:text-foreground"
                                            }`}
                                        >
                                            0{i + 1} · {s.headlineAccent.replace(".", "")}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Grounded Institution Anchors */}
                        <div
                            className={`grid grid-cols-3 gap-4 pt-6 border-t ${
                                isDarkHero ? "border-white/15" : "border-border"
                            }`}
                        >
                            {slide.highlights.map((stat, i) => (
                                <div key={i} className="space-y-0.5">
                                    <p className={`text-base sm:text-xl font-black ${isDarkHero ? "text-[#F4C414]" : "text-primary"}`}>
                                        {stat.value}
                                    </p>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkHero ? "text-slate-300" : "text-muted-foreground"}`}>
                                        {stat.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Interactive Glassmorphic Executive Showcase Dock */}
                    <div className="lg:col-span-5">
                        <div className="relative mx-auto max-w-md">
                            {/* Subtle Ambient Crest Aura */}
                            <div className="absolute -inset-6 bg-gradient-to-tr from-[#F4C414]/25 via-blue-500/15 to-transparent rounded-[3rem] blur-2xl pointer-events-none" />

                            <div className="relative rounded-[28px] border border-white/15 bg-slate-950/90 text-white p-5 sm:p-6 shadow-[0_32px_80px_-15px_rgba(0,0,0,0.65)] backdrop-blur-2xl space-y-5">
                                {/* Top Emblem & Dock Switcher */}
                                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Logo iconOnly iconClassName="w-11 h-11 shrink-0" />
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-[#F4C414] truncate">
                                                {activeProfile.holdingEntity}
                                            </p>
                                            <h3 className="text-sm font-black text-white truncate">{activeProfile.legalName}</h3>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-[#F4C414] shrink-0">
                                        {activeProfile.ussdCode}
                                    </span>
                                </div>

                                {/* Interactive Mini Mode Tabs */}
                                <div className="grid grid-cols-3 gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                                    {[
                                        { id: "card", label: "Smart Card", icon: CreditCard },
                                        { id: "school", label: "School Pay", icon: GraduationCap },
                                        { id: "ussd", label: `USSD ${activeProfile.ussdCode}`, icon: Hash },
                                    ].map((t) => (
                                        <button
                                            key={t.id}
                                            type="button"
                                            onClick={() => setDockTab(t.id as "card" | "school" | "ussd")}
                                            className={`py-2 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 transition-all truncate ${
                                                dockTab === t.id
                                                    ? "bg-[#F4C414] text-[#070D59] shadow"
                                                    : "text-slate-300 hover:text-white"
                                            }`}
                                        >
                                            <t.icon className="w-3 h-3 shrink-0" />
                                            <span className="truncate">{t.label}</span>
                                        </button>
                                    ))}
                                </div>

                                {/* Active Showcase Card inside Dock */}
                                {dockTab === "card" && (
                                    <div
                                        className="rounded-2xl p-5 space-y-5 relative overflow-hidden border border-[#F4C414]/40 shadow-xl"
                                        style={{
                                            background: `linear-gradient(135deg, ${activeProfile.themeStyle.heroBgHex} 0%, #030630 100%)`,
                                        }}
                                    >
                                        <div className="absolute -right-10 -top-10 w-36 h-36 bg-[#F4C414]/15 rounded-full blur-2xl pointer-events-none" />
                                        <div className="flex justify-between items-start relative z-10">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#F4C414]">
                                                    {activeProfile.shortName} Contactless
                                                </p>
                                                <p className="text-xs font-bold text-white/90 mt-0.5">Personnel &amp; Retail Debit</p>
                                            </div>
                                            <Wifi className="w-4 h-4 text-[#F4C414] rotate-90" />
                                        </div>

                                        <div className="flex items-center gap-3 relative z-10">
                                            <div className="w-10 h-7 rounded-md bg-gradient-to-br from-yellow-200 via-[#F4C414] to-amber-600 border border-yellow-200/60" />
                                            <span className="font-mono text-sm tracking-[0.22em] text-white/90">
                                                5061 •••• •••• 3701
                                            </span>
                                        </div>

                                        <div className="flex justify-between items-end text-[11px] relative z-10 pt-1">
                                            <div>
                                                <p className="text-[9px] uppercase text-slate-400">Account Ref</p>
                                                <p className="font-mono font-bold text-white">{activeProfile.demoAccountNumber}</p>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-black italic text-[#F4C414]">VERVE · VISA · MC</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dockTab === "school" && (
                                    <div className="rounded-2xl p-5 bg-white text-slate-900 space-y-3 shadow-xl border-t-4 border-[#F4C414]">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                {activeProfile.shortName} School Collection
                                            </span>
                                            <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500 font-semibold">Institutional Bursar Settlement</p>
                                            <p className="text-base font-black text-slate-900">
                                                {activeProfile.id === "nnmfb" ? "Nigerian Navy Command Secondary" : `${activeProfile.shortName} Partner Institution`}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-slate-400">Tuition Credit</p>
                                                <p className="font-black text-slate-900">Instant Settlement</p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] uppercase font-bold text-slate-400">Parent Receipt</p>
                                                <p className="font-mono font-black text-primary">RCT-2026-084</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {dockTab === "ussd" && (
                                    <div className="rounded-2xl p-5 bg-black border border-emerald-500/30 font-mono text-xs text-emerald-400 space-y-2 shadow-inner">
                                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                                            <span className="text-[#F4C414] font-bold">{activeProfile.shortName} OFFLINE USSD</span>
                                            <span>{activeProfile.ussdCode}</span>
                                        </div>
                                        <p className="text-white text-[11px]">Welcome to {activeProfile.shortName}</p>
                                        <div className="space-y-1 text-[11px] text-emerald-300">
                                            <p>1. Check Account Balance</p>
                                            <p>2. Instant Transfers &amp; Airtime</p>
                                            <p>3. School Fees &amp; Bill Pay</p>
                                            <p>4. Micro-Loan Quick Status</p>
                                        </div>
                                    </div>
                                )}

                                {/* Dock Footer Info */}
                                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1">
                                    <span className="inline-flex items-center gap-1.5 font-semibold">
                                        <Smartphone className="w-3.5 h-3.5 text-[#F4C414]" />
                                        iOS · Android · Web · {activeProfile.ussdCode}
                                    </span>
                                    <Link
                                        href="/auth/login"
                                        className="font-black text-[#F4C414] hover:underline inline-flex items-center gap-1"
                                    >
                                        Enter Portal <ArrowRight className="w-3 h-3" />
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
