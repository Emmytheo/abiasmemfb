"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
    ArrowRight, ShieldCheck, Landmark, Users2, Sparkles, Building2,
    Store, CreditCard, Zap, TrendingUp, Globe, Play, Pause
} from "lucide-react";

// ─── Hero Slide Definitions ────────────────────────────────────────────────
const SLIDES = [
    {
        id: "pillar",
        badge: "Abia State's Financial Pillar",
        headline: ["Abia State's", "Financial Pillar."],
        accentLine: "Financial Pillar.",
        body: "Since inception, we've been the silent engine behind thousands of Abia entrepreneurs, providing secure, modern, and accessible financial infrastructure that turns ambition into legacy.",
        cta: { label: "Open Your Account", href: "/auth/sign-up" },
        ctaSecondary: { label: "Explore Banking", href: "/personal-banking" },
        stats: [
            { value: "12,000+", label: "Active Members" },
            { value: "₦4.2B", label: "Loans Disbursed" },
            { value: "18 yrs", label: "Of Trust" },
        ],
        orbA: "bg-primary/30",
        orbB: "bg-blue-500/20",
        accentGradient: "from-primary via-primary/80 to-accent",
        floatCard: {
            icon: <Building2 className="w-5 h-5 text-primary" />,
            title: "Umuahia Head Office",
            sub: "Serving Abia State Since 2006",
        },
    },
    {
        id: "trade",
        badge: "State-of-the-Art Banking",
        headline: ["Modernizing Abia Trade.", "Seeding Co-ops."],
        accentLine: "Seeding Co-ops.",
        body: "AbiaSME MFB is the engine empowering entrepreneurs, digitized Esusu thrifts, local trade unions, and market merchants with secure loans, smart cards, and agent banking solutions built for Abia.",
        cta: { label: "Unions & Business Suite", href: "/business" },
        ctaSecondary: { label: "Esusu Calculator", href: "/business#esusu" },
        stats: [
            { value: "340+", label: "Active Cooperatives" },
            { value: "₦250K", label: "Avg Esusu Pool" },
            { value: "1%", label: "Platform Fee" },
        ],
        orbA: "bg-emerald-500/25",
        orbB: "bg-primary/20",
        accentGradient: "from-emerald-500 via-primary/80 to-primary",
        floatCard: {
            icon: <Users2 className="w-5 h-5 text-emerald-500" />,
            title: "Digital Esusu Live",
            sub: "340 Active Thrift Cycles Running",
        },
    },
    {
        id: "agency",
        badge: "Neighborhood Banking Points",
        headline: ["Your Neighborhood.", "Your Bank."],
        accentLine: "Your Bank.",
        body: "Our expanding POS Agency network puts a licensed cashpoint in every corner of Abia—deposits, withdrawals, utility clearance, and Esusu collections—powered by our instant settlement rails.",
        cta: { label: "Become an Agent", href: "/business#agency" },
        ctaSecondary: { label: "Commission Estimator", href: "/business#agency" },
        stats: [
            { value: "500+", label: "Agent Terminals" },
            { value: "₦120", label: "Per-Tx Commission" },
            { value: "99.8%", label: "Uptime SLA" },
        ],
        orbA: "bg-amber-500/25",
        orbB: "bg-orange-500/15",
        accentGradient: "from-amber-500 via-primary/70 to-primary",
        floatCard: {
            icon: <Store className="w-5 h-5 text-amber-500" />,
            title: "POS Agency Partner",
            sub: "Apply — Get Terminal in 48hrs",
        },
    },
    {
        id: "cards",
        badge: "Smart Digital Payments",
        headline: ["Physical Security.", "Digital Freedom."],
        accentLine: "Digital Freedom.",
        body: "Issue Visa, Mastercard, and Verve debit cards instantly. Freeze, unblock, and set spending limits from your app. Our PCI-DSS compliant smart card system is built for the modern Abia merchant.",
        cta: { label: "Design Your Smart Card", href: "/business#cards" },
        ctaSecondary: { label: "Merchant Checkout", href: "/business#merchant" },
        stats: [
            { value: "3 Networks", label: "Visa · MC · Verve" },
            { value: "< 2.5s", label: "POS Latency" },
            { value: "PCI-DSS", label: "Compliant" },
        ],
        orbA: "bg-violet-500/25",
        orbB: "bg-indigo-500/15",
        accentGradient: "from-violet-500 via-primary/70 to-primary",
        floatCard: {
            icon: <CreditCard className="w-5 h-5 text-violet-500" />,
            title: "Smart Card Issuing",
            sub: "Physical & Virtual — Instant Activation",
        },
    },
] as const;

// Floating particle positions (static for SSR safety)
const PARTICLES = [
    { top: "15%", left: "8%", size: "w-1 h-1", delay: "0ms", duration: "3s" },
    { top: "25%", left: "92%", size: "w-1.5 h-1.5", delay: "500ms", duration: "4s" },
    { top: "60%", left: "5%", size: "w-1 h-1", delay: "1000ms", duration: "5s" },
    { top: "75%", left: "88%", size: "w-2 h-2", delay: "200ms", duration: "3.5s" },
    { top: "40%", left: "95%", size: "w-1 h-1", delay: "800ms", duration: "4.5s" },
    { top: "85%", left: "15%", size: "w-1.5 h-1.5", delay: "300ms", duration: "3s" },
    { top: "10%", left: "50%", size: "w-1 h-1", delay: "1500ms", duration: "6s" },
    { top: "55%", left: "98%", size: "w-1 h-1", delay: "700ms", duration: "4s" },
];

const CYCLE_DURATION = 7000; // 7 seconds per slide

export function HeroExpository() {
    const [activeIdx, setActiveIdx] = useState(0);
    const [prevIdx, setPrevIdx] = useState<number | null>(null);
    const [transitioning, setTransitioning] = useState(false);
    const [paused, setPaused] = useState(false);
    const [progress, setProgress] = useState(0);

    const goToSlide = useCallback((idx: number) => {
        if (transitioning || idx === activeIdx) return;
        setTransitioning(true);
        setPrevIdx(activeIdx);
        setTimeout(() => {
            setActiveIdx(idx);
            setProgress(0);
            setTimeout(() => setTransitioning(false), 600);
        }, 300);
    }, [activeIdx, transitioning]);

    // Auto-advance timer
    useEffect(() => {
        if (paused) return;
        const interval = setInterval(() => {
            setProgress(p => {
                if (p >= 100) {
                    const next = (activeIdx + 1) % SLIDES.length;
                    goToSlide(next);
                    return 0;
                }
                return p + (100 / (CYCLE_DURATION / 100));
            });
        }, 100);
        return () => clearInterval(interval);
    }, [paused, activeIdx, goToSlide]);

    const slide = SLIDES[activeIdx];

    return (
        <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-background">
            {/* ── Ambient Background Orbs (color-shifts per slide) ── */}
            <div className="absolute inset-0 pointer-events-none">
                <div
                    key={`orbA-${slide.id}`}
                    className={`absolute top-[-15%] left-[-10%] w-[50%] h-[50%] ${slide.orbA} rounded-full blur-[140px] transition-all duration-1000`}
                />
                <div
                    key={`orbB-${slide.id}`}
                    className={`absolute bottom-[-15%] right-[-10%] w-[45%] h-[45%] ${slide.orbB} rounded-full blur-[140px] transition-all duration-1000`}
                />
                {/* Center pulse */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] animate-pulse" />
            </div>

            {/* ── Floating Particles ── */}
            {PARTICLES.map((p, i) => (
                <div
                    key={i}
                    className={`absolute ${p.size} bg-primary/40 rounded-full opacity-60`}
                    style={{
                        top: p.top,
                        left: p.left,
                        animationDuration: p.duration,
                        animationDelay: p.delay,
                        animation: `bounce ${p.duration} ${p.delay} infinite alternate ease-in-out`,
                    }}
                />
            ))}

            {/* ── Grid/Pattern Overlay ── */}
            <div
                className="absolute inset-0 opacity-[0.03] pointer-events-none"
                style={{
                    backgroundImage: "url('/images/elephant-1.png')",
                    backgroundSize: "contain",
                    backgroundRepeat: "repeat",
                }}
            />

            {/* ── Main Content ── */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-28 pb-16 lg:pt-36 lg:pb-28 w-full">

                {/* Slide Progress Indicator — top right */}
                <div className="absolute top-0 right-4 sm:right-8 pt-4 flex items-center gap-3 z-20">
                    <button
                        onClick={() => setPaused(p => !p)}
                        className="w-7 h-7 rounded-full bg-foreground/5 border border-foreground/10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/10 transition-all"
                        aria-label={paused ? "Resume" : "Pause"}
                    >
                        {paused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                    </button>
                    {SLIDES.map((s, i) => (
                        <button
                            key={s.id}
                            onClick={() => goToSlide(i)}
                            className="relative h-1 rounded-full overflow-hidden transition-all duration-300"
                            style={{ width: i === activeIdx ? 48 : 20 }}
                            aria-label={`Go to slide ${i + 1}`}
                        >
                            <span className="absolute inset-0 bg-foreground/15 rounded-full" />
                            {i === activeIdx && (
                                <span
                                    className="absolute inset-y-0 left-0 bg-primary rounded-full transition-none"
                                    style={{ width: `${progress}%` }}
                                />
                            )}
                            {i !== activeIdx && (
                                <span className={`absolute inset-0 rounded-full ${i < activeIdx ? "bg-primary/60" : "bg-foreground/15"}`} />
                            )}
                        </button>
                    ))}
                </div>

                {/* ── Slide Transition Wrapper ── */}
                <div
                    className={`transition-all duration-500 ${transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
                >
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

                        {/* ── LEFT: Text Content ── */}
                        <div className="lg:col-span-7 space-y-8">

                            {/* Badge pill */}
                            <div className="inline-flex items-center gap-3 py-2 px-4 rounded-2xl bg-foreground/5 border border-foreground/10 backdrop-blur-xl">
                                <span className="flex h-2 w-2 rounded-full bg-primary animate-ping" />
                                <span className="text-foreground/80 text-[10px] sm:text-xs font-black uppercase tracking-[0.2em]">
                                    {slide.badge}
                                </span>
                            </div>

                            {/* Headline */}
                            <div className="space-y-1">
                                {slide.headline.map((line, i) => (
                                    <h1
                                        key={`${slide.id}-line-${i}`}
                                        className={`text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-black leading-[1.0] tracking-tight ${line === slide.accentLine
                                                ? `text-transparent bg-clip-text bg-gradient-to-r ${slide.accentGradient}`
                                                : "text-foreground"
                                            }`}
                                    >
                                        {line}
                                    </h1>
                                ))}
                            </div>

                            {/* Body */}
                            <p className="text-lg sm:text-xl text-muted-foreground font-medium max-w-2xl leading-relaxed">
                                {slide.body}
                            </p>

                            {/* CTAs */}
                            <div className="flex flex-wrap gap-4 sm:gap-5">
                                <Link
                                    href={slide.cta.href}
                                    className="px-8 sm:px-10 py-4 sm:py-5 bg-primary text-primary-foreground font-black rounded-2xl hover:bg-foreground hover:text-background transition-all duration-500 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] group flex items-center gap-3 text-sm sm:text-base"
                                >
                                    {slide.cta.label}
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                                </Link>
                                <Link
                                    href={slide.ctaSecondary.href}
                                    className="px-8 sm:px-10 py-4 sm:py-5 bg-foreground/5 text-foreground font-black rounded-2xl border border-foreground/10 hover:bg-foreground/10 transition-all duration-500 backdrop-blur-md text-sm sm:text-base"
                                >
                                    {slide.ctaSecondary.label}
                                </Link>
                            </div>

                            {/* Live Stats Row */}
                            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-foreground/5">
                                {slide.stats.map((stat, i) => (
                                    <div key={`${slide.id}-stat-${i}`} className="space-y-1">
                                        <p className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{stat.value}</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* ── RIGHT: Visual Showcase ── */}
                        <div className="lg:col-span-5 relative">

                            {/* Outer glow ring */}
                            <div className="absolute -inset-4 bg-primary/5 rounded-[3rem] blur-2xl -z-10 animate-pulse" />

                            {/* Main card box */}
                            <div className="relative z-10 rounded-[2rem] sm:rounded-[3rem] overflow-hidden border border-foreground/10 shadow-2xl bg-background group">
                                <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />
                                {/* Shimmer overlay */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent z-10 pointer-events-none" />

                                <img
                                    src="/images/elephant-1.png"
                                    alt="Abia MFB — Modern Banking Building"
                                    className="w-full h-auto object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-1000 scale-105 group-hover:scale-100"
                                />

                                {/* Floating Info Card */}
                                <div className="absolute bottom-4 left-4 right-4 sm:bottom-8 sm:left-8 sm:right-8 z-20">
                                    <div className="p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] bg-background/20 backdrop-blur-2xl border border-foreground/20 shadow-2xl">
                                        <div className="flex items-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shrink-0">
                                                {slide.floatCard.icon}
                                            </div>
                                            <div>
                                                <h4 className="text-foreground font-black text-base sm:text-lg leading-tight">
                                                    {slide.floatCard.title}
                                                </h4>
                                                <p className="text-foreground/60 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                                    {slide.floatCard.sub}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Badge Top-right */}
                            <div className="absolute -top-5 -right-3 sm:-right-6 z-20 bg-card/90 backdrop-blur-xl border border-border/60 rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                                <div className="leading-none">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">CBN Licensed</p>
                                    <p className="text-[9px] font-black text-foreground mt-0.5">NDIC Insured</p>
                                </div>
                            </div>

                            {/* Floating Stat Bottom-left */}
                            <div className="absolute -bottom-5 -left-3 sm:-left-6 z-20 bg-primary rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5">
                                <TrendingUp className="w-4 h-4 text-primary-foreground shrink-0 animate-pulse" />
                                <div className="leading-none">
                                    <p className="text-[8px] font-black uppercase tracking-widest text-primary-foreground/70">Total Deposits</p>
                                    <p className="text-[10px] font-black text-primary-foreground mt-0.5">₦8.4B+ Under Mgmt.</p>
                                </div>
                            </div>

                            {/* Decorative floaters */}
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl -z-10 animate-bounce" style={{ animationDuration: "5s" }} />
                            <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl -z-10" />
                        </div>
                    </div>
                </div>

                {/* ── Trust Badges Row ── */}
                <div className={`mt-16 transition-all duration-700 delay-200 ${transitioning ? "opacity-0" : "opacity-100"}`}>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 pt-10 border-t border-foreground/5">
                        {[
                            { icon: <ShieldCheck className="w-5 h-5" />, label: "CBN\nLicensed" },
                            { icon: <Building2 className="w-5 h-5" />, label: "NDIC\nInsured" },
                            { icon: <Users2 className="w-5 h-5" />, label: "Digital Esusu\nCooperative" },
                            { icon: <Landmark className="w-5 h-5" />, label: "PCI-DSS Card\nCompliant" },
                        ].map((badge, i) => (
                            <div key={i} className="flex items-center gap-3 group">
                                <div className="w-10 h-10 rounded-xl bg-foreground/5 flex items-center justify-center text-primary border border-foreground/10 shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                                    {badge.icon}
                                </div>
                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest leading-tight whitespace-pre-line">
                                    {badge.label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Scroll Indicator ── */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30 animate-bounce">
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">Scroll</span>
                <div className="w-[1px] h-8 bg-foreground" />
            </div>
        </section>
    );
}
