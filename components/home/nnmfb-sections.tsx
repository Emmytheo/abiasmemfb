"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ShieldCheck,
    Users,
    TrendingUp,
    Eye,
    Compass,
    Star,
    ArrowRight,
    ArrowUpRight,
    PiggyBank,
    Banknote,
    GraduationCap,
    Store,
    Cpu,
    CheckCircle2,
    Sparkles,
    Quote,
} from "lucide-react";
import { useBankProfile } from "@/context/bank-profile-context";
import { NavalCrestSvg } from "@/components/ui/logo";

export function WhyChooseBankSection() {
    const { activeProfile } = useBankProfile();
    const icons = [ShieldCheck, Users, TrendingUp];
    const cards = activeProfile.whyChoose.cards;
    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    const leadCard = cards[0];
    const secondaryCards = cards.slice(1);
    const LeadIcon = icons[0];

    return (
        <section className="relative py-20 lg:py-28 bg-white dark:bg-background overflow-hidden">
            {/* Subtle architectural coordinate backdrop */}
            <div
                className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage:
                        "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                }}
            />

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                {/* Editorial Section Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/5 dark:bg-white/5 border border-primary/15 dark:border-white/10 text-[11px] font-bold uppercase tracking-[0.18em] text-primary dark:text-accent">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Institutional Advantage</span>
                        </div>
                        <h2 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-display font-black tracking-tight text-foreground leading-[1.1]">
                            {activeProfile.whyChoose.title}
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {activeProfile.whyChoose.subtitle}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-border">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            {activeProfile.licenseBadge}
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/5 border border-border">
                            USSD <strong className="text-foreground">{activeProfile.ussdCode}</strong>
                        </span>
                    </div>
                </div>

                {/* Asymmetric Bento Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    {/* Lead Volumetric Vault Card */}
                    {leadCard && (
                        <motion.div
                            initial={{ opacity: 0, y: 18 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-60px" }}
                            transition={{ duration: 0.45 }}
                            className="lg:col-span-5 relative rounded-3xl p-8 sm:p-10 text-white overflow-hidden shadow-2xl flex flex-col justify-between min-h-[340px] border border-white/10"
                            style={{
                                background: `radial-gradient(circle at 88% 14%, rgba(244, 196, 20, 0.20), transparent 46%), linear-gradient(155deg, ${heroBg} 0%, ${activeProfile.themeStyle.topBarBgHex || "#040836"} 100%)`,
                            }}
                        >
                            {/* Watermark Seal */}
                            <div className="pointer-events-none absolute -right-10 -bottom-10 opacity-[0.07]">
                                <NavalCrestSvg className="w-56 h-56" />
                            </div>

                            <div className="relative z-10 space-y-6">
                                <div className="flex items-center justify-between">
                                    <div
                                        className="w-12 h-12 rounded-2xl flex items-center justify-center border border-white/15 bg-white/10 backdrop-blur-md"
                                        style={{ color: accentHex }}
                                    >
                                        <LeadIcon className="w-6 h-6" />
                                    </div>
                                    <span
                                        className="font-mono text-[11px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full bg-white/10 border border-white/15"
                                        style={{ color: accentHex }}
                                    >
                                        01 / Sovereign Trust
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-2xl sm:text-3xl font-display font-black tracking-tight text-white">
                                        {leadCard.title}
                                    </h3>
                                    <p className="text-sm sm:text-base text-slate-200/90 leading-relaxed">
                                        {leadCard.desc}
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 pt-8 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-mono">
                                <div className="space-y-0.5">
                                    <div className="text-slate-400 uppercase tracking-wider text-[10px]">Chartered Since</div>
                                    <div className="text-white font-bold text-sm">{activeProfile.foundedYear} • Full Prudential Compliance</div>
                                </div>
                                <Link
                                    href="/company"
                                    className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 text-white transition-colors"
                                    aria-label="Learn more about our governance"
                                >
                                    <ArrowUpRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </motion.div>
                    )}

                    {/* Right Stack Pillars */}
                    <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {secondaryCards.map((card, idx) => {
                            const Icon = icons[(idx + 1) % icons.length];
                            const stepLabel = `0${idx + 2}`;
                            const isSecond = idx === 0;
                            return (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 18 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: "-60px" }}
                                    transition={{ duration: 0.45, delay: (idx + 1) * 0.08 }}
                                    className="group relative rounded-3xl p-8 bg-slate-50/90 dark:bg-card border border-border/80 hover:border-primary/40 dark:hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[280px]"
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shadow-inner"
                                                style={{
                                                    backgroundColor: `${heroBg}12`,
                                                    color: heroBg,
                                                }}
                                            >
                                                <Icon className="w-6 h-6 dark:text-accent" />
                                            </div>
                                            <span className="font-mono text-xs font-bold text-muted-foreground/70 tracking-widest">
                                                {stepLabel} / {isSecond ? "ACCESS" : "GROWTH"}
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            <h3 className="text-xl sm:text-2xl font-display font-extrabold text-foreground tracking-tight">
                                                {card.title}
                                            </h3>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {card.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                                        <span className="text-primary dark:text-accent">
                                            {isSecond ? "Personnel, MSMEs & Civilians" : "Automated Liquidity & Yield"}
                                        </span>
                                        <Link
                                            href={isSecond ? "/personal-banking" : "/business"}
                                            className="inline-flex items-center gap-1 text-foreground hover:text-primary dark:hover:text-accent transition-colors"
                                        >
                                            Explore <ArrowRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* Full-width bottom telemetry bar across secondary columns */}
                        <div className="sm:col-span-2 rounded-2xl px-6 py-4 bg-slate-900 dark:bg-slate-950 text-white flex flex-wrap items-center justify-between gap-4 border border-white/10">
                            <div className="flex items-center gap-3">
                                <span
                                    className="w-2.5 h-2.5 rounded-full animate-pulse"
                                    style={{ backgroundColor: accentHex }}
                                />
                                <span className="text-xs sm:text-sm font-medium text-slate-200">
                                    Connected directly to <strong className="text-white">NIBSS NIP</strong>,{" "}
                                    <strong className="text-white">Remita</strong> &amp;{" "}
                                    <strong className="text-white">Interswitch</strong> clearing rails.
                                </span>
                            </div>
                            <Link
                                href="/internet-banking"
                                className="text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5 hover:underline"
                                style={{ color: accentHex }}
                            >
                                Digital Channels <ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

export function MissionVisionBand() {
    const { activeProfile } = useBankProfile();
    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const topBarBg = activeProfile.themeStyle.topBarBgHex || "#040836";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    return (
        <section className="relative py-20 lg:py-24 bg-slate-50/80 dark:bg-slate-950/60 border-y border-border/70 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
                    {/* Left Editorial Anchor */}
                    <div className="lg:col-span-4 space-y-5 lg:sticky lg:top-28">
                        <span className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                            <span
                                className="w-6 h-[2px] inline-block"
                                style={{ backgroundColor: accentHex }}
                            />
                            Our Charter &amp; Direction
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight leading-[1.12]">
                            Built on Discipline.{" "}
                            <span className="text-primary dark:text-accent">Engineered for Scale.</span>
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                            {activeProfile.mandate.whoWeAre}
                        </p>
                        <div className="pt-2">
                            <Link
                                href="/company"
                                className="inline-flex items-center gap-2 text-sm font-bold text-primary dark:text-accent hover:gap-3 transition-all"
                            >
                                Read Full Institutional History <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Right Manifesto Bento Split */}
                    <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Vision Card (Deep Naval Vault) */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.45 }}
                            className="relative rounded-3xl p-8 text-white shadow-xl overflow-hidden flex flex-col justify-between min-h-[290px]"
                            style={{
                                background: `linear-gradient(150deg, ${heroBg} 0%, ${topBarBg} 100%)`,
                            }}
                        >
                            <div
                                className="absolute top-0 inset-x-0 h-1"
                                style={{ backgroundColor: accentHex }}
                            />
                            <div className="space-y-5">
                                <div className="flex items-center justify-between">
                                    <div
                                        className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"
                                        style={{ color: accentHex }}
                                    >
                                        <Eye className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/60">
                                        NORTH STAR
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-black tracking-tight text-white">
                                        Our Vision
                                    </h3>
                                    <p className="text-sm sm:text-[15px] text-slate-200 leading-relaxed font-medium">
                                        &ldquo;{activeProfile.mandate.vision}&rdquo;
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-white/10 text-[11px] font-mono text-white/65 flex items-center justify-between">
                                <span>{activeProfile.shortName} Mandate</span>
                                <span style={{ color: accentHex }}>Sustainable Leadership</span>
                            </div>
                        </motion.div>

                        {/* Mission Card (Crisp Glass Editorial) */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.45, delay: 0.1 }}
                            className="relative rounded-3xl p-8 bg-white dark:bg-card border border-border/80 shadow-lg flex flex-col justify-between min-h-[290px]"
                        >
                            <div className="space-y-5">
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
                                        EXECUTION
                                    </span>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-xl font-display font-black tracking-tight text-foreground">
                                        Our Mission
                                    </h3>
                                    <p className="text-sm sm:text-[15px] text-muted-foreground leading-relaxed font-medium">
                                        {activeProfile.mandate.mission}
                                    </p>
                                </div>
                            </div>

                            <div className="pt-6 mt-6 border-t border-border/60 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                                <span>{activeProfile.regionLabel}</span>
                                <span className="font-bold text-foreground">Customer-First Service</span>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}

type SuiteCategory = "all" | "retail" | "credit" | "enterprise";

export function CoreServicesGrid() {
    const { activeProfile } = useBankProfile();
    const [activeCategory, setActiveCategory] = useState<SuiteCategory>("all");

    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    const services = [
        {
            id: "savings",
            category: "retail" as const,
            title: "Savings & Target Vaults",
            subtitle: "Automated Liquidity",
            desc: `High-yield personal savings, salary-sweep standing orders, and fixed term vaults protected by ${activeProfile.shortName} prudential safeguards.`,
            icon: PiggyBank,
            href: "/personal-banking",
            metric: "Up to 14.5% p.a.",
            tag: "Retail",
            featured: false,
        },
        {
            id: "loans",
            category: "credit" as const,
            title: "Personnel & SME Credit",
            subtitle: "24h Structured Underwriting",
            desc: "Tailored salary-backed consumer credit, asset acquisition facilities, and verified working capital for registered MSMEs and contractors.",
            icon: Banknote,
            href: "/business",
            metric: "Same-Day Scoring",
            tag: "Credit",
            featured: false,
        },
        {
            id: "collections",
            category: "enterprise" as const,
            title: "School Fee Collections",
            subtitle: "Automated Bursary Rails",
            desc: `Seamless instant tuition, levy, and institutional billing via ${activeProfile.internalPayBrand}, complete with printable e-receipts and bursar dashboards.`,
            icon: GraduationCap,
            href: "/business#collections",
            metric: "Instant E-Receipt",
            tag: "Flagship Suite",
            featured: true,
        },
        {
            id: "esusu",
            category: "retail" as const,
            title: "Cooperative Esusu Circles",
            subtitle: "Digitized Thrift & Dividends",
            desc: "Transparent group contribution ledgers, automated payday deductions, and pro-rata dividend distributions for cooperatives and staff unions.",
            icon: Users,
            href: "/personal-banking",
            metric: "Zero Manual Ledgers",
            tag: "Cooperative",
            featured: false,
        },
        {
            id: "agency",
            category: "enterprise" as const,
            title: `${activeProfile.posBrandName} Network`,
            subtitle: "Agent & Branch Banking",
            desc: `Smart Android POS terminals for instant card payouts, cash-in/cash-out liquidity, utility vend, and offline ${activeProfile.ussdCode} agent dispatch.`,
            icon: Store,
            href: "/internet-banking",
            metric: "99.9% Terminal Uptime",
            tag: "Agency POS",
            featured: false,
        },
        {
            id: "merchant-api",
            category: "credit" as const,
            title: "Merchant API & Bulk Payroll",
            subtitle: "Programmable Treasury",
            desc: "Multi-level approval workflows, batch salary schedules, virtual collection accounts, and real-time webhook settlement for institutions.",
            icon: Cpu,
            href: "/business",
            metric: "Batch 5,000+ Rows",
            tag: "Treasury",
            featured: false,
        },
    ];

    const visibleServices =
        activeCategory === "all"
            ? services
            : services.filter((s) => s.category === activeCategory);

    const tabs: { key: SuiteCategory; label: string }[] = [
        { key: "all", label: "All Suite Modules (6)" },
        { key: "retail", label: "Savings & Esusu" },
        { key: "credit", label: "Credit & Payroll" },
        { key: "enterprise", label: "Collections & POS" },
    ];

    return (
        <section className="py-20 lg:py-28 bg-white dark:bg-card">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-2.5 max-w-2xl">
                        <span className="inline-block text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-primary dark:text-accent">
                            Full-Stack Core Banking Suite
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-display font-black text-foreground tracking-tight">
                            Modular Solutions Engineered for Every Tier
                        </h2>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Explore the integrated financial rails powering retail depositors, cooperatives, educational institutions, and enterprises on {activeProfile.shortName}.
                        </p>
                    </div>

                    {/* Interactive Filter Pills */}
                    <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-border/70">
                        {tabs.map((tab) => {
                            const active = activeCategory === tab.key;
                            return (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveCategory(tab.key)}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                        active
                                            ? "bg-white dark:bg-card text-foreground shadow-sm"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* 6-Module Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {visibleServices.map((item) => {
                        const Icon = item.icon;
                        if (item.featured) {
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    className="group relative rounded-3xl p-7 text-white shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden border border-white/10 hover:-translate-y-1"
                                    style={{
                                        background: `radial-gradient(circle at 90% 10%, rgba(244, 196, 20, 0.24), transparent 48%), linear-gradient(145deg, ${heroBg} 0%, ${activeProfile.themeStyle.topBarBgHex || "#040836"} 100%)`,
                                    }}
                                >
                                    <div className="space-y-5">
                                        <div className="flex items-center justify-between">
                                            <div
                                                className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center"
                                                style={{ color: accentHex }}
                                            >
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <span
                                                className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white/10 border border-white/15"
                                                style={{ color: accentHex }}
                                            >
                                                {item.tag}
                                            </span>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-300">
                                                {item.subtitle}
                                            </div>
                                            <h3 className="text-xl font-display font-black text-white">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-slate-200/90 leading-relaxed">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-white/10 flex items-center justify-between text-xs font-bold">
                                        <span className="font-mono" style={{ color: accentHex }}>
                                            {item.metric}
                                        </span>
                                        <span className="inline-flex items-center gap-1.5 text-white group-hover:gap-2.5 transition-all">
                                            Launch Simulator <ArrowRight className="w-4 h-4" />
                                        </span>
                                    </div>
                                </Link>
                            );
                        }

                        return (
                            <Link
                                key={item.id}
                                href={item.href}
                                className="group relative rounded-3xl p-7 bg-slate-50/75 dark:bg-background border border-border/80 hover:border-primary/40 dark:hover:border-accent/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between hover:-translate-y-1"
                            >
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between">
                                        <div
                                            className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
                                            style={{
                                                backgroundColor: `${heroBg}12`,
                                                color: heroBg,
                                            }}
                                        >
                                            <Icon className="w-6 h-6 dark:text-accent" />
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-white dark:bg-card border border-border text-muted-foreground">
                                            {item.tag}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                                            {item.subtitle}
                                        </div>
                                        <h3 className="text-xl font-display font-black text-foreground group-hover:text-primary dark:group-hover:text-accent transition-colors">
                                            {item.title}
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {item.desc}
                                        </p>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-border/60 flex items-center justify-between text-xs font-bold">
                                    <span className="font-mono text-primary dark:text-accent">
                                        {item.metric}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 text-foreground group-hover:text-primary dark:group-hover:text-accent group-hover:gap-2.5 transition-all">
                                        Explore Module <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

export function TestimonialsBand() {
    const { activeProfile } = useBankProfile();
    const heroBg = activeProfile.themeStyle.heroBgHex || "#070D59";
    const topBarBg = activeProfile.themeStyle.topBarBgHex || "#040836";
    const accentHex = activeProfile.themeStyle.accentHex || "#F4C414";

    return (
        <section
            className="relative py-20 lg:py-28 text-white overflow-hidden"
            style={{
                background: `radial-gradient(circle at 20% 20%, ${heroBg} 0%, ${topBarBg} 65%, #02041A 100%)`,
            }}
        >
            {/* Subtle radial brass aura */}
            <div
                className="pointer-events-none absolute -top-24 right-1/4 w-96 h-96 rounded-full blur-[120px] opacity-20"
                style={{ backgroundColor: accentHex }}
            />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3 max-w-2xl">
                        <span
                            className="inline-flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-[0.2em]"
                            style={{ color: accentHex }}
                        >
                            <Star className="w-3.5 h-3.5 fill-current" />
                            Verified Depositor Voices
                        </span>
                        <h2 className="text-3xl sm:text-4xl font-display font-black tracking-tight text-white">
                            What Our Customers Say
                        </h2>
                        <p className="text-sm sm:text-base text-slate-300">
                            Trusted by personnel, schools, SMEs, and retail customers across {activeProfile.regionLabel} on {activeProfile.shortName}.
                        </p>
                    </div>

                    <div className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl bg-white/[0.06] border border-white/10 backdrop-blur-md">
                        <div>
                            <div className="text-xl font-display font-black text-white leading-none">
                                4.9 <span className="text-xs font-normal text-slate-400">/ 5.0</span>
                            </div>
                            <div className="text-[11px] text-slate-300 mt-1">Service Satisfaction</div>
                        </div>
                        <div className="flex items-center gap-0.5" style={{ color: accentHex }}>
                            {Array.from({ length: 5 }).map((_, s) => (
                                <Star key={s} className="w-4 h-4 fill-current" />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {activeProfile.testimonials.map((t, i) => {
                        const initials = t.author
                            .split(" ")
                            .filter(Boolean)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase())
                            .join("");

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 18 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 0.45, delay: i * 0.08 }}
                                className="rounded-3xl p-7 sm:p-8 bg-white/[0.05] hover:bg-white/[0.08] border border-white/12 backdrop-blur-xl flex flex-col justify-between gap-6 transition-colors"
                            >
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1" style={{ color: accentHex }}>
                                            {Array.from({ length: 5 }).map((_, s) => (
                                                <Star key={s} className="w-3.5 h-3.5 fill-current" />
                                            ))}
                                        </div>
                                        <Quote className="w-5 h-5 text-white/20" />
                                    </div>
                                    <p className="text-sm sm:text-[15px] text-slate-100 leading-relaxed">
                                        &ldquo;{t.quote}&rdquo;
                                    </p>
                                </div>

                                <div className="pt-5 border-t border-white/10 flex items-center gap-3.5">
                                    <div
                                        className="w-10 h-10 rounded-full flex items-center justify-center font-display font-black text-xs shrink-0 border border-white/20"
                                        style={{
                                            backgroundColor: `${accentHex}22`,
                                            color: accentHex,
                                        }}
                                    >
                                        {initials || "CU"}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-sm font-bold text-white truncate">
                                            {t.author}
                                        </div>
                                        <div className="text-xs text-slate-400 truncate">
                                            {t.role}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
