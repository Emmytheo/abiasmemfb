"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowRight,
    Eye,
    Compass,
    ShieldCheck,
    Users,
    Award,
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    Landmark,
    Phone,
    Quote,
    Layers,
} from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";
import { NavalCrestSvg } from "@/components/ui/logo";

export default function Company() {
    const { activeProfile } = useBankProfile();
    const m = activeProfile.mandate;
    const milestones = m.historyMilestones;
    const [selectedIdx, setSelectedIdx] = useState(milestones.length > 0 ? milestones.length - 1 : 0);

    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const topBarBg = activeProfile.themeStyle.topBarBgHex || "#040836";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    const safeIdx = Math.min(selectedIdx, Math.max(0, milestones.length - 1));
    const currentMilestone = milestones[safeIdx];

    // Partition leadership neatly into Directorate/Board vs Executive Management
    const isDirectorate = (role: string) =>
        /chairman|board|director(?!.*managing)|patron|governor/i.test(role) &&
        !/managing director/i.test(role);

    const boardMembers = m.leadership.filter((p) => isDirectorate(p.role));
    const managementMembers = m.leadership.filter((p) => !isDirectorate(p.role));

    const partnerNotes: Record<string, string> = {
        FCMB: "Correspondent Clearing & Treasury Rails",
        Remita: "Federal TSA & Institutional Fee Settlement",
        NIBSS: "Real-Time NIP Interbank Switching",
        Interswitch: "Card Issuing & Omnichannel Processing",
        NDIC: "Statutory Depositor Protection Scheme",
    };

    const getInitials = (name: string) =>
        name
            .replace(/^(R Adm|Dr\.|Mr\.|Mrs\.|Chief|Rear Admiral)\s+/i, "")
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase())
            .join("");

    return (
        <div className="bg-background text-foreground">
            {/* 1. Flagship Volumetric Institutional Hero */}
            <section
                className="relative overflow-hidden pt-28 sm:pt-36 pb-20 lg:pb-24 text-white"
                style={{
                    background: `radial-gradient(circle at 82% 20%, rgba(244, 196, 20, 0.16), transparent 44%), linear-gradient(155deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                }}
            >
                {/* Architectural Grid */}
                <div
                    className="pointer-events-none absolute inset-0 opacity-[0.07]"
                    style={{
                        backgroundImage:
                            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
                        backgroundSize: "64px 64px",
                    }}
                />
                {/* Watermark Crest */}
                <div className="pointer-events-none absolute -right-16 top-16 opacity-[0.06] hidden lg:block">
                    <NavalCrestSvg className="w-[420px] h-[420px]" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="max-w-3xl space-y-6">
                        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-xs font-mono uppercase tracking-[0.18em]">
                            <Sparkles className="w-3.5 h-3.5" style={{ color: accentHex }} />
                            <span style={{ color: accentHex }}>{m.badge}</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight leading-[1.06]">
                            {m.titleTop}{" "}
                            <span style={{ color: accentHex }}>{m.titleAccent}</span>
                        </h1>

                        <p className="text-base sm:text-lg text-slate-200 leading-relaxed max-w-2xl">
                            {m.summary}
                        </p>

                        <div className="flex flex-wrap gap-3.5 pt-2">
                            <a
                                href="#history"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 shadow-lg hover:brightness-105 transition-all"
                                style={{ backgroundColor: accentHex }}
                            >
                                Interactive History <ArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="#leadership"
                                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 backdrop-blur-md transition-all"
                            >
                                Board &amp; Management
                            </a>
                        </div>
                    </div>

                    {/* Telemetry Stat Ribbon */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                        {[
                            { label: "Charter & Founding", value: `Est. ${activeProfile.foundedYear}` },
                            { label: "Customer Footprint", value: "30,000+ Accounts" },
                            { label: "Regulatory Oversight", value: activeProfile.licenseBadge },
                            { label: "Operational Base", value: activeProfile.regionLabel },
                        ].map((stat, idx) => (
                            <div
                                key={idx}
                                className="rounded-2xl p-4 sm:p-5 bg-white/[0.06] border border-white/10 backdrop-blur-md space-y-1"
                            >
                                <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                                    {stat.label}
                                </div>
                                <div className="text-sm sm:text-base font-display font-bold text-white">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 2. Institutional Mandate + Vision & Mission Split */}
            <section className="py-20 lg:py-24 bg-white dark:bg-background border-b border-border/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                        <div className="lg:col-span-6 space-y-5">
                            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                                Who We Are
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight leading-tight">
                                Precision Stewardship for{" "}
                                <span className="text-primary dark:text-accent">{activeProfile.shortName}</span> Stakeholders
                            </h2>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                {m.whoWeAre}
                            </p>
                            <div className="pt-2 flex items-center gap-3 text-xs font-mono text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                <span>
                                    Owned &amp; backed by <strong>{activeProfile.holdingEntity}</strong>
                                </span>
                            </div>
                        </div>

                        {/* Patron / Executive Charter Card */}
                        <div className="lg:col-span-6 rounded-3xl p-8 bg-slate-50 dark:bg-card border border-border/80 shadow-sm space-y-5 relative overflow-hidden">
                            <Quote className="w-10 h-10 text-primary/15 dark:text-accent/20 absolute top-6 right-6" />
                            <div className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-accent">
                                <Landmark className="w-4 h-4" />
                                <span>Institutional Mandate</span>
                            </div>
                            <p className="text-sm sm:text-base text-foreground font-medium leading-relaxed">
                                &ldquo;{m.patronStatement}&rdquo;
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                {m.secondaryStatement}
                            </p>
                            <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-4">
                                <div>
                                    <div className="text-sm font-bold text-foreground">{m.patronName}</div>
                                    <div className="text-xs text-muted-foreground">{m.patronRole}</div>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-primary/10 dark:bg-accent/15 text-primary dark:text-accent text-[11px] font-mono font-bold">
                                    {activeProfile.shortName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Vision & Mission Bento Duo */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            className="rounded-3xl p-8 sm:p-10 text-white shadow-xl relative overflow-hidden space-y-4"
                            style={{
                                background: `linear-gradient(150deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                            }}
                        >
                            <div
                                className="absolute top-0 inset-x-0 h-1"
                                style={{ backgroundColor: accentHex }}
                            />
                            <div className="flex items-center justify-between">
                                <div
                                    className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"
                                    style={{ color: accentHex }}
                                >
                                    <Eye className="w-5 h-5" />
                                </div>
                                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                                    VISION STATEMENT
                                </span>
                            </div>
                            <h3 className="text-2xl font-display font-black">Our Vision</h3>
                            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                                &ldquo;{m.vision}&rdquo;
                            </p>
                        </div>

                        <div className="rounded-3xl p-8 sm:p-10 bg-slate-50/90 dark:bg-card border border-border/80 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div
                                    className="w-11 h-11 rounded-2xl flex items-center justify-center"
                                    style={{
                                        backgroundColor: `${heroBg}12`,
                                        color: heroBg,
                                    }}
                                >
                                    <Compass className="w-5 h-5 dark:text-accent" />
                                </div>
                                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-muted-foreground">
                                    MISSION STATEMENT
                                </span>
                            </div>
                            <h3 className="text-2xl font-display font-black text-foreground">Our Mission</h3>
                            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed font-medium">
                                {m.mission}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Interactive History Milestone Scrubber */}
            <section
                id="history"
                className="py-20 lg:py-28 bg-slate-50/70 dark:bg-slate-950/60 border-b border-border/70"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2.5 max-w-2xl">
                            <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                                Institutional Evolution
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                                Our Journey Through the Years
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Select any milestone era below to inspect how {activeProfile.legalName} scaled from charter incorporation to modern digital core banking.
                            </p>
                        </div>

                        {/* Prev / Next Scrubber Controls */}
                        {milestones.length > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedIdx((prev) => Math.max(0, prev - 1))}
                                    disabled={safeIdx === 0}
                                    className="w-10 h-10 rounded-xl border border-border bg-white dark:bg-card flex items-center justify-center disabled:opacity-40 hover:border-primary transition-colors"
                                    aria-label="Previous milestone"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <span className="px-3 font-mono text-xs font-bold text-muted-foreground">
                                    0{safeIdx + 1} / 0{milestones.length}
                                </span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setSelectedIdx((prev) => Math.min(milestones.length - 1, prev + 1))
                                    }
                                    disabled={safeIdx === milestones.length - 1}
                                    className="w-10 h-10 rounded-xl border border-border bg-white dark:bg-card flex items-center justify-center disabled:opacity-40 hover:border-primary transition-colors"
                                    aria-label="Next milestone"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Interactive Era Selector Pills */}
                    {milestones.length > 0 && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            {/* Left Selectable Timeline Rail */}
                            <div className="lg:col-span-5 flex flex-col gap-3">
                                {milestones.map((item, idx) => {
                                    const active = idx === safeIdx;
                                    return (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setSelectedIdx(idx)}
                                            className={`text-left rounded-2xl p-5 border transition-all duration-200 flex items-start gap-4 ${
                                                active
                                                    ? "bg-white dark:bg-card border-primary dark:border-accent shadow-lg"
                                                    : "bg-white/50 dark:bg-card/50 border-border/70 hover:bg-white dark:hover:bg-card"
                                            }`}
                                        >
                                            <div
                                                className={`w-9 h-9 rounded-xl font-mono text-xs font-black flex items-center justify-center shrink-0 transition-colors ${
                                                    active
                                                        ? "text-white"
                                                        : "bg-slate-100 dark:bg-slate-800 text-muted-foreground"
                                                }`}
                                                style={active ? { backgroundColor: heroBg } : undefined}
                                            >
                                                0{idx + 1}
                                            </div>
                                            <div className="min-w-0 space-y-1">
                                                <div
                                                    className="text-[11px] font-mono font-bold uppercase tracking-wider"
                                                    style={active ? { color: heroBg } : undefined}
                                                >
                                                    <span className={active ? "dark:text-accent" : "text-muted-foreground"}>
                                                        {item.date}
                                                    </span>
                                                </div>
                                                <div className="text-sm sm:text-base font-display font-bold text-foreground">
                                                    {item.title}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Right Milestone Stage Detail */}
                            <div className="lg:col-span-7">
                                <AnimatePresence mode="wait">
                                    {currentMilestone && (
                                        <motion.div
                                            key={safeIdx}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.25 }}
                                            className="h-full rounded-3xl p-8 sm:p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden min-h-[340px]"
                                            style={{
                                                background: `radial-gradient(circle at 88% 15%, rgba(244, 196, 20, 0.22), transparent 46%), linear-gradient(150deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                                            }}
                                        >
                                            <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-[0.07]">
                                                <NavalCrestSvg className="w-60 h-60" />
                                            </div>

                                            <div className="relative z-10 space-y-6">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <span
                                                        className="px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-widest bg-white/10 border border-white/15"
                                                        style={{ color: accentHex }}
                                                    >
                                                        {currentMilestone.date}
                                                    </span>
                                                    <span className="font-mono text-xs text-slate-300">
                                                        MILESTONE 0{safeIdx + 1} OF 0{milestones.length}
                                                    </span>
                                                </div>

                                                <div className="space-y-3">
                                                    <h3 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                                                        {currentMilestone.title}
                                                    </h3>
                                                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                                                        {currentMilestone.desc}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="relative z-10 pt-8 mt-8 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                                                <span className="text-slate-300">
                                                    {activeProfile.shortName} Institutional Archive
                                                </span>
                                                <Link
                                                    href="/auth/register"
                                                    className="inline-flex items-center gap-1.5 font-bold hover:underline"
                                                    style={{ color: accentHex }}
                                                >
                                                    Become Part of the Next Chapter <ArrowRight className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 4. Numbered Core Values Glass Bento (01..06) */}
            <section className="py-20 lg:py-24 bg-white dark:bg-background border-b border-border/70">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-2.5 max-w-2xl">
                            <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                                <Layers className="w-3.5 h-3.5" />
                                Code of Conduct
                            </span>
                            <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                                Our Six Core Values
                            </h2>
                            <p className="text-sm sm:text-base text-muted-foreground">
                                Every decision across credit underwriting, depositor care, and digital operations is governed by these non-negotiable standards.
                            </p>
                        </div>

                        <Link
                            href="/legal/code-of-conduct"
                            className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-wider text-primary dark:text-accent hover:underline"
                        >
                            Read Ethics Charter <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {m.coreValues.map((val, i) => (
                            <div
                                key={i}
                                className="group rounded-3xl p-7 bg-slate-50/80 dark:bg-card border border-border/80 hover:border-primary/40 dark:hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4"
                            >
                                <div className="flex items-center justify-between">
                                    <span
                                        className="px-3 py-1 rounded-xl font-mono text-xs font-black"
                                        style={{
                                            backgroundColor: `${heroBg}12`,
                                            color: heroBg,
                                        }}
                                    >
                                        <span className="dark:text-accent">0{i + 1}</span>
                                    </span>
                                    <ShieldCheck className="w-5 h-5 text-muted-foreground/40 group-hover:text-primary dark:group-hover:text-accent transition-colors" />
                                </div>
                                <h3 className="text-xl font-display font-extrabold text-foreground">
                                    {val.title}
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    {val.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Tiered Board & Executive Leadership Medallions */}
            <section
                id="leadership"
                className="py-20 lg:py-28 bg-slate-50/70 dark:bg-slate-950/60 border-b border-border/70"
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-14">
                    <div className="text-center max-w-2xl mx-auto space-y-3">
                        <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                            Governance &amp; Stewardship
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                            Board of Directors &amp; Management
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Seasoned naval command leadership and certified microfinance executives steering {activeProfile.legalName}.
                        </p>
                    </div>

                    {/* Board / Directorate Tier */}
                    {boardMembers.length > 0 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <Award className="w-4 h-4 text-primary dark:text-accent" />
                                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    Board of Directors
                                </h3>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {boardMembers.map((person, i) => (
                                    <div
                                        key={i}
                                        className="rounded-3xl p-7 text-white shadow-xl flex items-center gap-4 border border-white/10"
                                        style={{
                                            background: `linear-gradient(145deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                                        }}
                                    >
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-base shrink-0 border border-white/20"
                                            style={{
                                                backgroundColor: `${accentHex}22`,
                                                color: accentHex,
                                            }}
                                        >
                                            {getInitials(person.name)}
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <div className="text-lg font-display font-bold text-white truncate">
                                                {person.name}
                                            </div>
                                            <div
                                                className="text-xs font-mono font-semibold uppercase tracking-wider truncate"
                                                style={{ color: accentHex }}
                                            >
                                                {person.role}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Executive Management Tier */}
                    {managementMembers.length > 0 && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3">
                                <Users className="w-4 h-4 text-primary dark:text-accent" />
                                <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-muted-foreground">
                                    Executive Management Team
                                </h3>
                                <div className="flex-1 h-px bg-border" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {managementMembers.map((person, i) => (
                                    <div
                                        key={i}
                                        className="rounded-3xl p-7 bg-white dark:bg-card border border-border/80 shadow-sm hover:shadow-md transition-shadow flex items-center gap-4"
                                    >
                                        <div
                                            className="w-14 h-14 rounded-2xl flex items-center justify-center font-display font-black text-base shrink-0"
                                            style={{
                                                backgroundColor: `${heroBg}12`,
                                                color: heroBg,
                                            }}
                                        >
                                            <span className="dark:text-accent">{getInitials(person.name)}</span>
                                        </div>
                                        <div className="min-w-0 space-y-1">
                                            <div className="text-lg font-display font-bold text-foreground truncate">
                                                {person.name}
                                            </div>
                                            <div className="text-xs font-mono font-semibold text-primary dark:text-accent uppercase tracking-wider truncate">
                                                {person.role}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* 6. Clearing Partners & Bottom CTA Wall */}
            <section className="py-20 bg-white dark:bg-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                                Financial Infrastructure
                            </span>
                            <h2 className="text-2xl sm:text-3xl font-display font-black text-foreground">
                                Clearing Partners &amp; Affiliations
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-md">
                            Interconnected with Nigeria&apos;s Tier-1 clearing, payment switching, and deposit insurance institutions.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {m.partners.map((partner) => (
                            <div
                                key={partner}
                                className="rounded-2xl p-5 bg-slate-50 dark:bg-card border border-border/80 flex flex-col justify-between gap-3"
                            >
                                <div className="flex items-center justify-between">
                                    <Building2 className="w-5 h-5 text-primary dark:text-accent" />
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                </div>
                                <div>
                                    <div className="text-base font-display font-black text-foreground">
                                        {partner}
                                    </div>
                                    <div className="text-[11px] text-muted-foreground leading-snug mt-0.5">
                                        {partnerNotes[partner] || "Verified Clearing Partner"}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Executive Bottom Callout */}
                    <div
                        className="rounded-3xl p-8 sm:p-12 text-white flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 shadow-2xl"
                        style={{
                            background: `linear-gradient(135deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                        }}
                    >
                        <div className="space-y-2 max-w-xl">
                            <h3 className="text-2xl sm:text-3xl font-display font-black">
                                Ready to Bank with {activeProfile.shortName}?
                            </h3>
                            <p className="text-sm sm:text-base text-slate-200">
                                Open a personal account with instant BVN verification, launch school fee collections, or dial{" "}
                                <strong style={{ color: accentHex }}>{activeProfile.ussdCode}</strong> from any mobile phone.
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-3 shrink-0">
                            <Link
                                href="/auth/register"
                                className="px-6 py-3.5 rounded-xl font-bold text-sm text-slate-950 shadow-lg hover:brightness-105 transition-all inline-flex items-center gap-2"
                                style={{ backgroundColor: accentHex }}
                            >
                                Open Account <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/support"
                                className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-white/10 hover:bg-white/15 border border-white/20 inline-flex items-center gap-2"
                            >
                                <Phone className="w-4 h-4" /> Contact Us
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
